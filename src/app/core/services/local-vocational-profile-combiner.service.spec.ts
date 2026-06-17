import { LocalVocationalProfileCombinerService } from './local-vocational-profile-combiner.service';
import type { SimulatorVocationalSignalResult } from '../models/career-simulator.models';
import type {
  CalibrationModuleSignalResult,
  ComplementarySkillId,
  LocalVocationalTestResult,
  SteamAreaId,
  SteamStrengthAreaScore,
  SteamStrengthSkillScore
} from '../models/vocational-steam.models';

describe('LocalVocationalProfileCombinerService', () => {
  let service: LocalVocationalProfileCombinerService;

  beforeEach(() => {
    service = new LocalVocationalProfileCombinerService();
  });

  it('reinforces the current profile when calibration points to the same areas', () => {
    const result = service.buildProgressiveProfile({
      initialResult: localResultFixture({
        tecnologia: 82,
        matematicas: 68,
        ciencia: 30,
        ingenieria: 42,
        arte: 18
      }),
      calibrationSignals: [
        signalFixture('digital_consumption', { tecnologia: 100, matematicas: 70 })
      ]
    });

    expect(result.level).toBe('perfil_calibrado');
    expect(result.comparison.changedDominantArea).toBeFalse();
    expect(result.strengthProfile.areaScores.tecnologia).toBeGreaterThan(82);
    expect(result.confidence).toBe('media');
    expect(result.careerRecommendations.recommendations.length).toBe(5);
  });

  it('updates the dominant area when calibration strongly changes the evidence', () => {
    const result = service.buildProgressiveProfile({
      initialResult: localResultFixture({
        ciencia: 58,
        tecnologia: 50,
        arte: 48,
        ingenieria: 20,
        matematicas: 18
      }),
      calibrationSignals: [
        signalFixture('school_projects', { arte: 100, tecnologia: 40 }),
        signalFixture('teamwork', { arte: 100 })
      ]
    });

    expect(result.level).toBe('perfil_calibrado');
    expect(result.comparison.changedDominantArea).toBeTrue();
    expect(result.strengthProfile.dominantArea?.area).toBe('arte');
    expect(result.explanation).toContain('movió el perfil');
  });

  it('keeps the initial profile when calibration has insufficient information', () => {
    const initialResult = localResultFixture({
      matematicas: 76,
      ciencia: 64,
      tecnologia: 40,
      ingenieria: 20,
      arte: 12
    });
    const result = service.buildProgressiveProfile({
      initialResult,
      calibrationSignals: [
        signalFixture('physical_hobbies', {}, 0)
      ]
    });

    expect(result.level).toBe('perfil_inicial');
    expect(result.strengthProfile.primaryCombination).toBe(initialResult.strengthProfile.primaryCombination);
    expect(result.strengthProfile.areaScores.matematicas).toBe(76);
    expect(result.changeSummary.join(' ')).toContain('Aún no hay calibraciones suficientes');
  });

  it('validates the profile when simulator decisions reinforce the test', () => {
    const result = service.buildProgressiveProfile({
      initialResult: localResultFixture({
        tecnologia: 72,
        matematicas: 62,
        ciencia: 24,
        ingenieria: 34,
        arte: 18
      }),
      calibrationSignals: [
        signalFixture('digital_consumption', { tecnologia: 100, matematicas: 70 })
      ],
      simulatorSignals: [
        simulatorSignalFixture('ingenieria-de-software-local', { tecnologia: 100, matematicas: 70 }, 'reinforces')
      ]
    });

    expect(result.level).toBe('perfil_validado');
    expect(result.confidence).toBe('alta');
    expect(result.strengthProfile.areaScores.tecnologia).toBeGreaterThan(72);
  });

  it('keeps simulator contradictions as complementary evidence instead of replacing blindly', () => {
    const result = service.buildProgressiveProfile({
      initialResult: localResultFixture({
        ciencia: 62,
        arte: 56,
        tecnologia: 26,
        ingenieria: 18,
        matematicas: 18
      }),
      calibrationSignals: [
        signalFixture('school_projects', { ciencia: 70, arte: 60 })
      ],
      simulatorSignals: [
        simulatorSignalFixture('diseno-ux-ui-local', { arte: 100, tecnologia: 40 }, 'partially_contradicts')
      ]
    });

    expect(result.level).toBe('perfil_validado');
    expect(result.comparison.areaDeltas.arte).toBeGreaterThan(0);
    expect(result.changeSummary.join(' ')).toContain('simulador');
  });
});

function localResultFixture(areaScores: Partial<Record<SteamAreaId, number>>): LocalVocationalTestResult {
  const fullAreaScores = fillAreas(areaScores);
  const skillScores = fillSkills({
    pensamiento_logico: 70,
    resolucion_de_problemas: 64,
    comunicacion: 42,
    creatividad: fullAreaScores.arte
  });
  const rankedAreas = rankAreas(fullAreaScores);
  const rankedSkills = rankSkills(skillScores);

  return {
    id: 'local-fixture',
    strengthProfile: {
      areaScores: fullAreaScores,
      skillScores,
      rankedAreas,
      rankedSkills,
      dominantArea: rankedAreas[0],
      secondaryArea: rankedAreas[1],
      primaryCombination: `${rankedAreas[0].label} + ${rankedAreas[1].label}`,
      confidence: 'baja',
      explanation: 'Perfil inicial de prueba',
      missingSignals: ['Faltan calibraciones', 'Faltan simuladores'],
      answeredQuestions: 7,
      neutralAnswers: 0,
      missingAnswers: 0,
      dataSource: 'local'
    },
    careerRecommendations: {
      recommendations: [],
      profileConfidence: 'baja',
      dataSource: 'local'
    },
    generatedAtIso: '2026-01-01T00:00:00.000Z',
    dataSource: 'local',
    isExperimental: true
  };
}

function signalFixture(
  moduleId: CalibrationModuleSignalResult['moduleId'],
  areas: Partial<Record<SteamAreaId, number>>,
  positiveSignals = 3
): CalibrationModuleSignalResult {
  return {
    id: `signal-${moduleId}`,
    moduleId,
    moduleTitle: moduleId,
    answers: {},
    areaAdjustments: fillAreas(areas),
    skillAdjustments: fillSkills({
      creatividad: areas.arte || 0,
      pensamiento_logico: Math.max(areas.matematicas || 0, areas.tecnologia || 0),
      comunicacion: areas.arte || 0,
      resolucion_de_problemas: areas.ingenieria || areas.tecnologia || 0
    }),
    answeredCards: positiveSignals,
    positiveSignals,
    noExperienceAnswers: 0,
    confidenceBoost: positiveSignals > 0 ? 12 : 0,
    explanation: 'Señal de prueba',
    dataSource: 'local',
    generatedAtIso: '2026-01-01T00:00:00.000Z'
  };
}

function simulatorSignalFixture(
  careerId: string,
  areas: Partial<Record<SteamAreaId, number>>,
  alignment: SimulatorVocationalSignalResult['profileAlignment']
): SimulatorVocationalSignalResult {
  return {
    id: `sim-${careerId}`,
    careerId,
    careerName: careerId,
    role: 'Rol de prueba',
    areaAdjustments: fillAreas(areas),
    skillAdjustments: fillSkills({
      creatividad: areas.arte || 0,
      pensamiento_logico: Math.max(areas.matematicas || 0, areas.tecnologia || 0),
      comunicacion: areas.arte || 0,
      analisis_de_datos: areas.matematicas || 0
    }),
    competencyScores: {
      pensamiento_logico: areas.tecnologia || 0,
      creatividad: areas.arte || 0,
      comunicacion: areas.arte || 0,
      etica: 0,
      analisis: areas.matematicas || 0,
      toma_de_decisiones: 70,
      manejo_de_incertidumbre: 50
    },
    selectedConsequences: ['Consecuencia de prueba'],
    strengthsShown: ['Fortaleza de prueba'],
    profileAlignment: alignment,
    explanation: 'Explicación de prueba',
    confidence: 'alta',
    affinityScore: 84,
    dataSource: 'local',
    generatedAtIso: '2026-01-01T00:00:00.000Z'
  };
}

function fillAreas(values: Partial<Record<SteamAreaId, number>>): Record<SteamAreaId, number> {
  return {
    ciencia: values.ciencia || 0,
    tecnologia: values.tecnologia || 0,
    ingenieria: values.ingenieria || 0,
    arte: values.arte || 0,
    matematicas: values.matematicas || 0
  };
}

function fillSkills(values: Partial<Record<ComplementarySkillId, number>>): Record<ComplementarySkillId, number> {
  return {
    pensamiento_logico: values.pensamiento_logico || 0,
    creatividad: values.creatividad || 0,
    comunicacion: values.comunicacion || 0,
    resolucion_de_problemas: values.resolucion_de_problemas || 0,
    trabajo_en_equipo: values.trabajo_en_equipo || 0,
    liderazgo: values.liderazgo || 0,
    analisis_de_datos: values.analisis_de_datos || 0,
    pensamiento_critico: values.pensamiento_critico || 0
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
