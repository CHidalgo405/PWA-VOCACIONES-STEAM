import { matchNearbyUniversities } from './university-match.algorithm';
import type {
  NearbySteamUniversity,
  SteamCareerRecommendationMatch,
  SteamStrengthProfileResult
} from '../models/vocational-steam.models';
import { MOCK_STEAM_CAREER_MATRIX } from '../data/vocational-steam.mock';

describe('matchNearbyUniversities', () => {
  it('prioritizes universities with several compatible careers', () => {
    const result = matchNearbyUniversities({
      universities: [
        universityFixture('strong', 8, ['Ingeniería en Software', 'Ciencia de Datos', 'Ingeniería Industrial']),
        universityFixture('weak', 4, ['Administración general'])
      ],
      profile: profileFixture(),
      careerRecommendations: recommendationFixtures(),
      radiusKm: 30
    });

    expect(result[0].university.id).toBe('strong');
    expect(result[0].compatibleCareers.length).toBeGreaterThan(1);
    expect(result[0].matchTotal).toBeGreaterThan(result[1].matchTotal);
  });

  it('does not over-rank nearby universities with insufficient academic compatibility', () => {
    const result = matchNearbyUniversities({
      universities: [
        universityFixture('near-low-fit', 2, ['Administración general']),
        universityFixture('far-high-fit', 26, ['Ingeniería en Software', 'Ciencia de Datos'])
      ],
      profile: profileFixture(),
      careerRecommendations: recommendationFixtures(),
      radiusKm: 30
    });

    const near = result.find((item) => item.university.id === 'near-low-fit')!;
    expect(near.matchVocational).toBeLessThan(40);
    expect(near.matchTotal).toBeLessThan(70);
  });

  it('keeps distant but compatible universities below unrealistic perfect scores', () => {
    const result = matchNearbyUniversities({
      universities: [
        universityFixture('far-high-fit', 29, ['Ingeniería en Software', 'Ciencia de Datos', 'Mecatrónica'])
      ],
      profile: profileFixture(),
      careerRecommendations: recommendationFixtures(),
      radiusKm: 30
    });

    expect(result[0].matchVocational).toBeGreaterThan(70);
    expect(result[0].matchGeographic).toBeLessThan(10);
    expect(result[0].matchTotal).toBeLessThan(90);
  });

  it('warns when real API data has no programs', () => {
    const result = matchNearbyUniversities({
      universities: [universityFixture('api-no-programs', 5, [], 'api')],
      profile: profileFixture(),
      careerRecommendations: recommendationFixtures(),
      radiusKm: 30
    });

    expect(result[0].warnings.join(' ')).toContain('Datos insuficientes');
  });
});

function universityFixture(
  id: string,
  distanceKm: number,
  programs: string[],
  dataSource: NearbySteamUniversity['dataSource'] = 'mock'
): NearbySteamUniversity {
  return {
    id,
    name: id,
    location: { lat: 18.9, lng: -96.9 },
    address: 'Veracruz',
    city: 'Córdoba',
    country: 'México',
    programs,
    distanceKm,
    dataSource
  };
}

function recommendationFixtures(): SteamCareerRecommendationMatch[] {
  return ['career-software-engineering', 'career-data-science', 'career-industrial-engineering']
    .map((id, index) => ({
      career: MOCK_STEAM_CAREER_MATRIX.find((career) => career.id === id)!,
      compatibilityPercentage: 92 - index * 8,
      mainReasons: ['Fixture'],
      matchingAreas: ['tecnologia'],
      areasToStrengthen: [],
      dataSource: 'mock'
    }));
}

function profileFixture(): SteamStrengthProfileResult {
  const rankedAreas = [
    { area: 'tecnologia' as const, label: 'Tecnología', rawScore: 88, maxPossibleScore: 100, normalizedScore: 88, rank: 1 },
    { area: 'matematicas' as const, label: 'Matemáticas', rawScore: 76, maxPossibleScore: 100, normalizedScore: 76, rank: 2 },
    { area: 'ingenieria' as const, label: 'Ingeniería', rawScore: 68, maxPossibleScore: 100, normalizedScore: 68, rank: 3 },
    { area: 'ciencia' as const, label: 'Ciencia', rawScore: 40, maxPossibleScore: 100, normalizedScore: 40, rank: 4 },
    { area: 'arte' as const, label: 'Arte', rawScore: 20, maxPossibleScore: 100, normalizedScore: 20, rank: 5 }
  ];

  return {
    areaScores: {
      ciencia: 40,
      tecnologia: 88,
      ingenieria: 68,
      arte: 20,
      matematicas: 76
    },
    skillScores: {
      pensamiento_logico: 82,
      creatividad: 28,
      comunicacion: 52,
      resolucion_de_problemas: 78,
      trabajo_en_equipo: 64,
      liderazgo: 35,
      analisis_de_datos: 70,
      pensamiento_critico: 68
    },
    rankedAreas,
    rankedSkills: [],
    dominantArea: rankedAreas[0],
    secondaryArea: rankedAreas[1],
    primaryCombination: 'Tecnología + Matemáticas',
    confidence: 'media',
    explanation: 'Fixture',
    missingSignals: [],
    answeredQuestions: 8,
    neutralAnswers: 0,
    missingAnswers: 0,
    dataSource: 'local'
  };
}
