import { MOCK_STEAM_CAREER_MATRIX } from '../data/vocational-steam.mock';
import type {
  LocalUniversityMatchResult,
  NearbySteamUniversity,
  SteamAreaId,
  SteamCareerRecommendationMatch,
  SteamStrengthProfileResult,
  VocationalProfileConfidenceEs
} from '../models/vocational-steam.models';

const STEAM_AREAS: SteamAreaId[] = ['ciencia', 'tecnologia', 'ingenieria', 'arte', 'matematicas'];

const AREA_LABELS: Record<SteamAreaId, string> = {
  ciencia: 'Ciencia',
  tecnologia: 'Tecnología',
  ingenieria: 'Ingeniería',
  arte: 'Arte',
  matematicas: 'Matemáticas'
};

export interface UniversityMatchInput {
  universities: NearbySteamUniversity[];
  profile: SteamStrengthProfileResult;
  careerRecommendations: SteamCareerRecommendationMatch[];
  radiusKm: number;
}

export function matchNearbyUniversities(input: UniversityMatchInput): LocalUniversityMatchResult[] {
  return input.universities
    .map((university) => scoreUniversity(university, input))
    .sort((a, b) => b.matchTotal - a.matchTotal || a.distanceKm - b.distanceKm);
}

function scoreUniversity(
  university: NearbySteamUniversity,
  input: UniversityMatchInput
): LocalUniversityMatchResult {
  const warnings: string[] = [];
  const programs = university.programs || [];
  const distanceKm = university.distanceKm ?? input.radiusKm;

  if (!programs.length) {
    warnings.push('Datos insuficientes: la API no incluyó carreras o planes de estudio para esta universidad.');
  }
  if (university.dataSource !== 'api') {
    warnings.push(`Oferta marcada como ${university.dataSource}; validar en el sitio oficial antes de decidir.`);
  }

  const compatibleCareers = findCompatibleCareers(programs, input.careerRecommendations);
  const compatibleAreas = findCompatibleAreas(programs);
  const careerCompatibility = programs.length ? calculateCareerCompatibility(compatibleCareers, input.careerRecommendations) : 0;
  const areaCompatibility = programs.length ? calculateAreaCompatibility(compatibleAreas, input.profile) : 0;
  const distanceScore = calculateDistanceScore(distanceKm, input.radiusKm);
  const varietyScore = programs.length ? Math.round((new Set(compatibleAreas).size / STEAM_AREAS.length) * 100) : 0;
  const confidenceScore = confidenceToScore(input.profile.confidence);
  const total = Math.round(
    careerCompatibility * 0.45
    + areaCompatibility * 0.25
    + distanceScore * 0.15
    + varietyScore * 0.10
    + confidenceScore * 0.05
  );

  return {
    university,
    distanceKm,
    matchTotal: clamp(total),
    matchVocational: clamp(Math.round(careerCompatibility * 0.65 + areaCompatibility * 0.35)),
    matchGeographic: distanceScore,
    matchAcademic: clamp(Math.round(careerCompatibility * 0.55 + varietyScore * 0.45)),
    compatibleCareers,
    compatibleAreas,
    reasons: buildReasons(compatibleCareers, compatibleAreas, distanceScore),
    warnings,
    dataSource: university.dataSource
  };
}

function findCompatibleCareers(
  programs: string[],
  recommendations: SteamCareerRecommendationMatch[]
): string[] {
  const normalizedPrograms = programs.map(normalize);
  return recommendations
    .filter((recommendation) => {
      const careerTokens = [
        recommendation.career.name,
        recommendation.career.slug,
        ...recommendation.career.relatedSubjects,
        ...recommendation.career.jobOutcomes
      ].map(normalize);
      return normalizedPrograms.some((program) =>
        careerTokens.some((token) => program.includes(token) || token.includes(program))
      );
    })
    .map((recommendation) => recommendation.career.name);
}

function findCompatibleAreas(programs: string[]): SteamAreaId[] {
  const normalizedPrograms = programs.map(normalize);
  const areas = new Set<SteamAreaId>();

  for (const career of MOCK_STEAM_CAREER_MATRIX) {
    const careerTokens = [
      career.name,
      career.slug,
      ...career.relatedSubjects,
      ...career.jobOutcomes
    ].map(normalize);
    if (normalizedPrograms.some((program) => careerTokens.some((token) => program.includes(token) || token.includes(program)))) {
      areas.add(career.primaryArea);
      career.secondaryAreas.forEach((area) => areas.add(area));
    }
  }

  return [...areas];
}

function calculateCareerCompatibility(
  compatibleCareers: string[],
  recommendations: SteamCareerRecommendationMatch[]
): number {
  if (!recommendations.length) return 0;
  const recommendationNames = recommendations.map((item) => item.career.name);
  const topMatches = compatibleCareers
    .map((career) => {
      const index = recommendationNames.indexOf(career);
      if (index < 0) return 0;
      return Math.max(35, 100 - index * 14);
    })
    .filter(Boolean);
  if (!topMatches.length) return 0;
  return clamp(Math.round(topMatches.reduce((sum, score) => sum + score, 0) / topMatches.length));
}

function calculateAreaCompatibility(
  compatibleAreas: SteamAreaId[],
  profile: SteamStrengthProfileResult
): number {
  if (!compatibleAreas.length) return 0;
  const scores = compatibleAreas.map((area) => profile.areaScores[area] || 0);
  return clamp(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length));
}

function calculateDistanceScore(distanceKm: number, radiusKm: number): number {
  if (radiusKm <= 0) return 0;
  return clamp(Math.round(100 - (distanceKm / radiusKm) * 100));
}

function confidenceToScore(confidence: VocationalProfileConfidenceEs): number {
  if (confidence === 'alta') return 100;
  if (confidence === 'media') return 70;
  return 40;
}

function buildReasons(
  compatibleCareers: string[],
  compatibleAreas: SteamAreaId[],
  distanceScore: number
): string[] {
  const reasons: string[] = [];
  if (compatibleCareers.length) {
    reasons.push(`Coincide con ${compatibleCareers.slice(0, 2).join(', ')}.`);
  }
  if (compatibleAreas.length) {
    reasons.push(`Tiene señales académicas asociadas a ${compatibleAreas.slice(0, 3).map((area) => AREA_LABELS[area]).join(', ')}.`);
  }
  if (distanceScore >= 70) {
    reasons.push('Está dentro de un rango geográfico favorable.');
  }
  if (!reasons.length) {
    reasons.push('Match preliminar: faltan datos académicos reales para explicar mejor la compatibilidad.');
  }
  return reasons;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}
