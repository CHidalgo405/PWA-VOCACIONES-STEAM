import type {
  ComplementarySkillId,
  SteamAreaId,
  SteamStrengthAreaScore,
  SteamStrengthProfileResult,
  SteamStrengthSkillScore
} from '../models/vocational-steam.models';
import { recommendSteamCareers } from './career-recommendation.algorithm';

describe('recommendSteamCareers', () => {
  it('recommends software-oriented careers for a technological profile', () => {
    const result = recommendSteamCareers({
      profile: profileFixture(
        { tecnologia: 92, ingenieria: 68, matematicas: 62, ciencia: 24, arte: 18 },
        {
          pensamiento_logico: 90,
          resolucion_de_problemas: 86,
          trabajo_en_equipo: 65,
          comunicacion: 48,
          creatividad: 34
        },
        'alta'
      )
    });

    expect(result.recommendations.length).toBe(5);
    expect(result.recommendations[0].career.id).toBe('career-software-engineering');
    expect(result.recommendations[0].matchingAreas).toContain('tecnologia');
    expect(result.recommendations[0].compatibilityPercentage).toBeLessThanOrEqual(100);
    expect(result.recommendations[0].compatibilityPercentage).toBeGreaterThan(result.recommendations[4].compatibilityPercentage);
  });

  it('recommends visual and design careers for an artistic profile', () => {
    const result = recommendSteamCareers({
      profile: profileFixture(
        { arte: 95, tecnologia: 58, ciencia: 26, ingenieria: 18, matematicas: 20 },
        {
          creatividad: 96,
          comunicacion: 82,
          trabajo_en_equipo: 62,
          resolucion_de_problemas: 46,
          pensamiento_logico: 28
        },
        'alta'
      )
    });

    const topTwoIds = result.recommendations.slice(0, 2).map((item) => item.career.id);
    expect(topTwoIds).toContain('career-ux-ui-design');
    expect(topTwoIds).toContain('career-digital-animation');
    expect(result.recommendations[0].compatibilityPercentage).toBeLessThan(95);
  });

  it('recommends data science for a mathematical profile', () => {
    const result = recommendSteamCareers({
      profile: profileFixture(
        { matematicas: 96, tecnologia: 72, ciencia: 66, ingenieria: 28, arte: 10 },
        {
          pensamiento_logico: 94,
          analisis_de_datos: 92,
          pensamiento_critico: 86,
          comunicacion: 58,
          resolucion_de_problemas: 70
        },
        'alta'
      )
    });

    expect(result.recommendations[0].career.id).toBe('career-data-science');
    expect(result.recommendations[0].matchingAreas).toContain('matematicas');
    expect(result.recommendations[0].mainReasons.join(' ')).toContain('Matemáticas');
  });

  it('keeps mixed-profile recommendations varied and not all too high', () => {
    const result = recommendSteamCareers({
      profile: profileFixture(
        { ingenieria: 72, matematicas: 70, tecnologia: 64, ciencia: 55, arte: 40 },
        {
          resolucion_de_problemas: 78,
          pensamiento_logico: 72,
          trabajo_en_equipo: 70,
          comunicacion: 64,
          creatividad: 44
        },
        'media',
        ['Recomendacion preliminar']
      )
    });

    const scores = result.recommendations.map((item) => item.compatibilityPercentage);
    expect([
      'career-industrial-engineering',
      'career-mechatronics',
      'career-environmental-engineering'
    ]).toContain(result.recommendations[0].career.id);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(4);
    expect(scores.filter((score) => score >= 90).length).toBeLessThanOrEqual(1);
  });

  it('adds confidence warning when profile has few data', () => {
    const result = recommendSteamCareers({
      profile: profileFixture(
        { tecnologia: 80, ingenieria: 60, matematicas: 30, ciencia: 10, arte: 10 },
        {
          pensamiento_logico: 70,
          resolucion_de_problemas: 68,
          creatividad: 20,
          comunicacion: 20,
          trabajo_en_equipo: 25
        },
        'baja',
        ['Faltan calibraciones', 'Faltan simuladores']
      )
    });

    expect(result.confidenceWarning).toBeTruthy();
    expect(result.recommendations[0].confidenceWarning).toBe(result.confidenceWarning);
    expect(result.recommendations[0].compatibilityPercentage).toBeLessThan(90);
  });
});

function profileFixture(
  areas: Partial<Record<SteamAreaId, number>>,
  skills: Partial<Record<ComplementarySkillId, number>>,
  confidence: SteamStrengthProfileResult['confidence'],
  missingSignals: string[] = []
): SteamStrengthProfileResult {
  const areaScores = {
    ciencia: areas.ciencia || 0,
    tecnologia: areas.tecnologia || 0,
    ingenieria: areas.ingenieria || 0,
    arte: areas.arte || 0,
    matematicas: areas.matematicas || 0
  };
  const skillScores = {
    pensamiento_logico: skills.pensamiento_logico || 0,
    creatividad: skills.creatividad || 0,
    comunicacion: skills.comunicacion || 0,
    resolucion_de_problemas: skills.resolucion_de_problemas || 0,
    trabajo_en_equipo: skills.trabajo_en_equipo || 0,
    liderazgo: skills.liderazgo || 0,
    analisis_de_datos: skills.analisis_de_datos || 0,
    pensamiento_critico: skills.pensamiento_critico || 0
  };
  const rankedAreas = rankAreas(areaScores);
  const rankedSkills = rankSkills(skillScores);

  return {
    areaScores,
    skillScores,
    rankedAreas,
    rankedSkills,
    dominantArea: rankedAreas[0],
    secondaryArea: rankedAreas[1],
    primaryCombination: `${rankedAreas[0].label} + ${rankedAreas[1].label}`,
    confidence,
    explanation: 'Fixture profile',
    missingSignals,
    answeredQuestions: 7,
    neutralAnswers: 0,
    missingAnswers: 0,
    dataSource: 'mock'
  };
}

function rankAreas(areaScores: Record<SteamAreaId, number>): SteamStrengthAreaScore[] {
  const labels: Record<SteamAreaId, string> = {
    ciencia: 'Ciencia',
    tecnologia: 'Tecnología',
    ingenieria: 'Ingeniería',
    arte: 'Arte',
    matematicas: 'Matemáticas'
  };

  return (Object.entries(areaScores) as [SteamAreaId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([area, score], index) => ({
      area,
      label: labels[area],
      rawScore: score,
      maxPossibleScore: 100,
      normalizedScore: score,
      rank: index + 1
    }));
}

function rankSkills(skillScores: Record<ComplementarySkillId, number>): SteamStrengthSkillScore[] {
  return (Object.entries(skillScores) as [ComplementarySkillId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([skill, score], index) => ({
      skill,
      label: skill,
      rawScore: score,
      maxPossibleScore: 100,
      normalizedScore: score,
      rank: index + 1
    }));
}
