import { MOCK_STEAM_CAREER_MATRIX } from '../data/vocational-steam.mock';
import type {
  ComplementarySkillId,
  SteamAreaId,
  SteamCareerRecommendationMatch,
  SteamCareerRecommendationResult,
  SteamCareerVocationalMatrixItem,
  SteamStrengthProfileResult,
  VocationalDataSource
} from '../models/vocational-steam.models';

const AREA_LABELS: Record<SteamAreaId, string> = {
  ciencia: 'Ciencia',
  tecnologia: 'Tecnología',
  ingenieria: 'Ingeniería',
  arte: 'Arte',
  matematicas: 'Matemáticas'
};

const SKILL_LABELS: Record<ComplementarySkillId, string> = {
  pensamiento_logico: 'pensamiento logico',
  creatividad: 'creatividad',
  comunicacion: 'comunicacion',
  resolucion_de_problemas: 'resolucion de problemas',
  trabajo_en_equipo: 'trabajo en equipo',
  liderazgo: 'liderazgo',
  analisis_de_datos: 'analisis de datos',
  pensamiento_critico: 'pensamiento critico'
};

const STEAM_AREAS: SteamAreaId[] = ['ciencia', 'tecnologia', 'ingenieria', 'arte', 'matematicas'];
const CORE_SKILLS: ComplementarySkillId[] = [
  'pensamiento_logico',
  'creatividad',
  'comunicacion',
  'resolucion_de_problemas',
  'trabajo_en_equipo'
];

export interface CareerRecommendationAlgorithmInput {
  profile: SteamStrengthProfileResult;
  careers?: SteamCareerVocationalMatrixItem[];
  topN?: number;
  dataSource?: VocationalDataSource;
}

export function recommendSteamCareers(input: CareerRecommendationAlgorithmInput): SteamCareerRecommendationResult {
  const careers = input.careers || MOCK_STEAM_CAREER_MATRIX;
  const topN = input.topN || 5;
  const resultDataSource = input.dataSource || (input.careers ? 'local' : 'mock');
  const confidenceWarning = buildConfidenceWarning(input.profile);

  const recommendations = careers
    .map((career) => scoreCareer(career, input.profile, confidenceWarning, input.dataSource || career.dataSource))
    .sort((a, b) => b.compatibilityPercentage - a.compatibilityPercentage || a.career.name.localeCompare(b.career.name))
    .slice(0, topN);

  return {
    recommendations,
    profileConfidence: input.profile.confidence,
    confidenceWarning,
    dataSource: resultDataSource
  };
}

function scoreCareer(
  career: SteamCareerVocationalMatrixItem,
  profile: SteamStrengthProfileResult,
  confidenceWarning: string | undefined,
  dataSource: VocationalDataSource
): SteamCareerRecommendationMatch {
  const areaSimilarity = weightedSimilarity(
    STEAM_AREAS.map((area) => profile.areaScores[area] || 0),
    normalizeWeights(STEAM_AREAS.map((area) => career.vocationalWeights.areas[area] || 0)),
    0.56
  );
  const skillSimilarity = weightedSimilarity(
    CORE_SKILLS.map((skill) => profile.skillScores[skill] || 0),
    normalizeWeights(CORE_SKILLS.map((skill) => career.vocationalWeights.skills[skill] || 0)),
    0.34
  );
  const primaryAreaBonus = profile.dominantArea?.area === career.primaryArea ? 4 : 0;
  const secondaryAreaBonus = profile.secondaryArea && career.secondaryAreas.includes(profile.secondaryArea.area) ? 2 : 0;
  const confidenceAdjustment = profile.confidence === 'baja' ? -4 : profile.confidence === 'media' ? -2 : 0;
  const compatibilityPercentage = clamp(
    Math.round(areaSimilarity + skillSimilarity + primaryAreaBonus + secondaryAreaBonus + confidenceAdjustment),
    0,
    100
  );
  const matchingAreas = findMatchingAreas(profile, career);
  const areasToStrengthen = findAreasToStrengthen(profile, career);

  return {
    career,
    compatibilityPercentage,
    mainReasons: buildMatchReasons(profile, career, matchingAreas),
    matchingAreas,
    areasToStrengthen,
    confidenceWarning,
    dataSource
  };
}

function weightedSimilarity(userValues: number[], careerValues: number[], contribution: number): number {
  if (userValues.length !== careerValues.length || userValues.length === 0) return 0;

  const distance = userValues.reduce((sum, userValue, index) => {
    return sum + Math.abs(clamp(userValue, 0, 100) - clamp(careerValues[index], 0, 100));
  }, 0) / userValues.length;

  const similarity = clamp(100 - distance, 0, 100);
  return similarity * contribution;
}

function normalizeWeights(values: number[]): number[] {
  const maxValue = Math.max(...values);
  if (maxValue <= 0) return values.map(() => 0);

  return values.map((value) => (clamp(value, 0, 100) / maxValue) * 100);
}

function findMatchingAreas(
  profile: SteamStrengthProfileResult,
  career: SteamCareerVocationalMatrixItem
): SteamAreaId[] {
  return STEAM_AREAS.filter((area) => {
    const userScore = profile.areaScores[area] || 0;
    const careerNeed = career.vocationalWeights.areas[area] || 0;
    return userScore >= 55 && careerNeed >= 18;
  });
}

function findAreasToStrengthen(
  profile: SteamStrengthProfileResult,
  career: SteamCareerVocationalMatrixItem
): SteamAreaId[] {
  return STEAM_AREAS.filter((area) => {
    const userScore = profile.areaScores[area] || 0;
    const careerNeed = career.vocationalWeights.areas[area] || 0;
    return careerNeed >= 22 && userScore < 50;
  }).slice(0, 3);
}

function buildMatchReasons(
  profile: SteamStrengthProfileResult,
  career: SteamCareerVocationalMatrixItem,
  matchingAreas: SteamAreaId[]
): string[] {
  const reasons: string[] = [];

  if (profile.dominantArea?.area === career.primaryArea) {
    reasons.push(`Tu area dominante (${AREA_LABELS[profile.dominantArea.area]}) coincide con el nucleo de la carrera.`);
  }

  const matchingAreaLabels = matchingAreas.map((area) => AREA_LABELS[area]);
  if (matchingAreaLabels.length > 0) {
    reasons.push(`Coinciden areas clave: ${matchingAreaLabels.join(', ')}.`);
  }

  const matchingSkills = CORE_SKILLS
    .filter((skill) => (profile.skillScores[skill] || 0) >= 55 && (career.vocationalWeights.skills[skill] || 0) >= 16)
    .map((skill) => SKILL_LABELS[skill]);
  if (matchingSkills.length > 0) {
    reasons.push(`Tus habilidades fuertes se alinean con ${matchingSkills.slice(0, 2).join(' y ')}.`);
  }

  reasons.push(career.profileMatchReasons[0]);
  return unique(reasons).slice(0, 4);
}

function buildConfidenceWarning(profile: SteamStrengthProfileResult): string | undefined {
  if (profile.confidence === 'baja') {
    return 'Perfil con datos limitados: completa mas respuestas, calibraciones o simuladores antes de tomar una decision final.';
  }
  if (profile.confidence === 'media' || profile.missingSignals.length > 0) {
    return 'Recomendacion preliminar: puede mejorar con calibraciones, simuladores o mas respuestas no neutrales.';
  }
  return undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
