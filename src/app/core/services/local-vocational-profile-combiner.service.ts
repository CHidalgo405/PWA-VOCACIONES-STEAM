import { Injectable } from '@angular/core';
import { recommendSteamCareers } from '../algorithms/career-recommendation.algorithm';
import type { SimulatorVocationalSignalResult } from '../models/career-simulator.models';
import type {
  CalibrationModuleSignalResult,
  ComplementarySkillId,
  LocalVocationalTestResult,
  ProgressiveProfileComparison,
  ProgressiveVocationalProfile,
  ProgressiveVocationalProfileLevel,
  SteamAreaId,
  SteamStrengthAreaScore,
  SteamStrengthProfileResult,
  SteamStrengthSkillScore,
  VocationalProfileConfidenceEs
} from '../models/vocational-steam.models';

const STEAM_AREAS: SteamAreaId[] = ['ciencia', 'tecnologia', 'ingenieria', 'arte', 'matematicas'];
const COMPLEMENTARY_SKILLS: ComplementarySkillId[] = [
  'pensamiento_logico',
  'creatividad',
  'comunicacion',
  'resolucion_de_problemas',
  'trabajo_en_equipo',
  'liderazgo',
  'analisis_de_datos',
  'pensamiento_critico'
];

const AREA_LABELS: Record<SteamAreaId, string> = {
  ciencia: 'Ciencia',
  tecnologia: 'Tecnología',
  ingenieria: 'Ingeniería',
  arte: 'Arte',
  matematicas: 'Matemáticas'
};

const SKILL_LABELS: Record<ComplementarySkillId, string> = {
  pensamiento_logico: 'Pensamiento lógico',
  creatividad: 'Creatividad',
  comunicacion: 'Comunicación',
  resolucion_de_problemas: 'Resolución de problemas',
  trabajo_en_equipo: 'Trabajo en equipo',
  liderazgo: 'Liderazgo',
  analisis_de_datos: 'Análisis de datos',
  pensamiento_critico: 'Pensamiento crítico'
};

export interface ProgressiveProfileInput {
  initialResult: LocalVocationalTestResult;
  calibrationSignals?: CalibrationModuleSignalResult[];
  simulatorSignals?: SimulatorVocationalSignalResult[];
  completedSimulatorCount?: number;
  testResultCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalVocationalProfileCombinerService {
  buildProgressiveProfile(input: ProgressiveProfileInput): ProgressiveVocationalProfile {
    const calibrationSignals = (input.calibrationSignals || [])
      .filter((signal) => signal.positiveSignals > 0);
    const simulatorSignals = (input.simulatorSignals || [])
      .filter((signal) => signal.profileAlignment !== 'insufficient');
    const completedCalibrationModules = calibrationSignals.length;
    const completedSimulatorCount = Math.max(input.completedSimulatorCount || 0, simulatorSignals.length);
    const testResultCount = input.testResultCount || 1;
    const level = this.resolveLevel(testResultCount, completedCalibrationModules, completedSimulatorCount);
    const calibrationWeight = this.resolveCalibrationWeight(completedCalibrationModules);

    const calibrationAreaScores = this.combineScores(
      input.initialResult.strengthProfile.areaScores,
      this.averageCalibrationScores(calibrationSignals, 'areaAdjustments'),
      calibrationWeight
    );
    const calibrationSkillScores = this.combineScores(
      input.initialResult.strengthProfile.skillScores,
      this.averageCalibrationScores(calibrationSignals, 'skillAdjustments'),
      calibrationWeight
    );
    const simulatorWeight = this.resolveSimulatorWeight(simulatorSignals.length);
    const combinedAreaScores = this.combineScores(
      calibrationAreaScores,
      this.averageSimulatorScores(simulatorSignals, 'areaAdjustments'),
      simulatorWeight
    );
    const combinedSkillScores = this.combineScores(
      calibrationSkillScores,
      this.averageSimulatorScores(simulatorSignals, 'skillAdjustments'),
      simulatorWeight
    );
    const rankedAreas = this.rankAreas(combinedAreaScores);
    const rankedSkills = this.rankSkills(combinedSkillScores);
    const confidence = this.resolveConfidence(
      input.initialResult.strengthProfile.confidence,
      completedCalibrationModules,
      completedSimulatorCount,
      testResultCount
    );
    const comparison = this.buildComparison(input.initialResult.strengthProfile, combinedAreaScores, combinedSkillScores, rankedAreas);
    const strengthProfile: SteamStrengthProfileResult = {
      ...input.initialResult.strengthProfile,
      areaScores: combinedAreaScores,
      skillScores: combinedSkillScores,
      rankedAreas,
      rankedSkills,
      dominantArea: rankedAreas[0] || null,
      secondaryArea: rankedAreas[1] || null,
      primaryCombination: this.buildCombination(rankedAreas),
      confidence,
      explanation: this.buildExplanation(level, comparison, completedCalibrationModules, completedSimulatorCount),
      missingSignals: this.buildMissingSignals(completedCalibrationModules, completedSimulatorCount)
    };
    const careerRecommendations = recommendSteamCareers({
      profile: strengthProfile,
      topN: 5,
      dataSource: 'local'
    });

    return {
      id: `progressive-profile-${Date.now()}`,
      level,
      initialResultId: input.initialResult.id,
      strengthProfile,
      careerRecommendations,
      confidence,
      completedCalibrationModules,
      completedSimulatorCount,
      testResultCount,
      explanation: strengthProfile.explanation,
      changeSummary: this.buildChangeSummary(comparison, completedCalibrationModules, completedSimulatorCount),
      comparison,
      dataSource: 'local',
      generatedAtIso: new Date().toISOString()
    };
  }

  applyToLocalResult(
    initialResult: LocalVocationalTestResult,
    calibrationSignals: CalibrationModuleSignalResult[],
    completedSimulatorCount = 0,
    testResultCount = 1,
    simulatorSignals: SimulatorVocationalSignalResult[] = []
  ): LocalVocationalTestResult {
    const progressiveProfile = this.buildProgressiveProfile({
      initialResult,
      calibrationSignals,
      simulatorSignals,
      completedSimulatorCount,
      testResultCount
    });

    return {
      ...initialResult,
      strengthProfile: progressiveProfile.strengthProfile,
      careerRecommendations: progressiveProfile.careerRecommendations,
      progressiveProfile,
      generatedAtIso: progressiveProfile.generatedAtIso
    };
  }

  private resolveLevel(
    testResultCount: number,
    completedCalibrationModules: number,
    completedSimulatorCount: number
  ): ProgressiveVocationalProfileLevel {
    if (testResultCount > 1 && completedCalibrationModules >= 2 && completedSimulatorCount >= 2) {
      return 'perfil_avanzado';
    }
    if (completedCalibrationModules > 0 && completedSimulatorCount > 0) {
      return 'perfil_validado';
    }
    if (completedCalibrationModules > 0) {
      return 'perfil_calibrado';
    }
    return 'perfil_inicial';
  }

  private resolveCalibrationWeight(completedCalibrationModules: number): number {
    if (completedCalibrationModules <= 0) return 0;
    return Math.min(0.35, 0.14 + completedCalibrationModules * 0.07);
  }

  private resolveSimulatorWeight(completedSimulatorSignals: number): number {
    if (completedSimulatorSignals <= 0) return 0;
    return Math.min(0.25, 0.12 + completedSimulatorSignals * 0.06);
  }

  private averageCalibrationScores<T extends SteamAreaId | ComplementarySkillId>(
    signals: CalibrationModuleSignalResult[],
    key: 'areaAdjustments' | 'skillAdjustments'
  ): Record<T, number> {
    const totals = {} as Record<T, number>;
    const counts = {} as Record<T, number>;

    for (const signal of signals) {
      const scores = signal[key] as Record<T, number>;
      for (const [scoreKey, value] of Object.entries(scores) as [T, number][]) {
        if (value <= 0) continue;
        totals[scoreKey] = (totals[scoreKey] || 0) + value;
        counts[scoreKey] = (counts[scoreKey] || 0) + 1;
      }
    }

    const scoreKeys = key === 'areaAdjustments' ? STEAM_AREAS : COMPLEMENTARY_SKILLS;
    return (scoreKeys as T[]).reduce((average, scoreKey) => {
      average[scoreKey] = counts[scoreKey] ? Math.round(totals[scoreKey] / counts[scoreKey]) : 0;
      return average;
    }, {} as Record<T, number>);
  }

  private averageSimulatorScores<T extends SteamAreaId | ComplementarySkillId>(
    signals: SimulatorVocationalSignalResult[],
    key: 'areaAdjustments' | 'skillAdjustments'
  ): Record<T, number> {
    const totals = {} as Record<T, number>;
    const counts = {} as Record<T, number>;

    for (const signal of signals) {
      const scores = signal[key] as Record<T, number>;
      for (const [scoreKey, value] of Object.entries(scores) as [T, number][]) {
        if (value <= 0) continue;
        totals[scoreKey] = (totals[scoreKey] || 0) + value;
        counts[scoreKey] = (counts[scoreKey] || 0) + 1;
      }
    }

    const scoreKeys = key === 'areaAdjustments' ? STEAM_AREAS : COMPLEMENTARY_SKILLS;
    return (scoreKeys as T[]).reduce((average, scoreKey) => {
      average[scoreKey] = counts[scoreKey] ? Math.round(totals[scoreKey] / counts[scoreKey]) : 0;
      return average;
    }, {} as Record<T, number>);
  }

  private combineScores<T extends string>(
    initialScores: Record<T, number>,
    calibrationScores: Record<T, number>,
    calibrationWeight: number
  ): Record<T, number> {
    return Object.keys(initialScores).reduce((combined, key) => {
      const typedKey = key as T;
      const calibrationScore = calibrationScores[typedKey] || 0;
      const initialScore = initialScores[typedKey] || 0;
      if (calibrationWeight === 0 || calibrationScore === 0) {
        combined[typedKey] = Math.round(initialScore);
        return combined;
      }
      combined[typedKey] = this.clampScore(
        Math.round(initialScore * (1 - calibrationWeight) + calibrationScore * calibrationWeight)
      );
      return combined;
    }, {} as Record<T, number>);
  }

  private resolveConfidence(
    initialConfidence: VocationalProfileConfidenceEs,
    completedCalibrationModules: number,
    completedSimulatorCount: number,
    testResultCount: number
  ): VocationalProfileConfidenceEs {
    if (testResultCount > 1 && completedCalibrationModules >= 2 && completedSimulatorCount >= 2) return 'alta';
    if (completedCalibrationModules > 0 && completedSimulatorCount > 0) return 'alta';
    if (completedCalibrationModules > 0) return initialConfidence === 'alta' ? 'alta' : 'media';
    return initialConfidence;
  }

  private buildComparison(
    initialProfile: SteamStrengthProfileResult,
    combinedAreaScores: Record<SteamAreaId, number>,
    combinedSkillScores: Record<ComplementarySkillId, number>,
    rankedAreas: SteamStrengthAreaScore[]
  ): ProgressiveProfileComparison {
    const initialDominantArea = initialProfile.dominantArea?.area || null;
    const calibratedDominantArea = rankedAreas[0]?.area || null;

    return {
      initialDominantArea,
      calibratedDominantArea,
      initialCombination: initialProfile.primaryCombination,
      calibratedCombination: this.buildCombination(rankedAreas),
      changedDominantArea: Boolean(initialDominantArea && calibratedDominantArea && initialDominantArea !== calibratedDominantArea),
      areaDeltas: STEAM_AREAS.reduce((deltas, area) => {
        deltas[area] = this.clampDelta((combinedAreaScores[area] || 0) - (initialProfile.areaScores[area] || 0));
        return deltas;
      }, {} as Record<SteamAreaId, number>),
      skillDeltas: COMPLEMENTARY_SKILLS.reduce((deltas, skill) => {
        deltas[skill] = this.clampDelta((combinedSkillScores[skill] || 0) - (initialProfile.skillScores[skill] || 0));
        return deltas;
      }, {} as Record<ComplementarySkillId, number>)
    };
  }

  private buildExplanation(
    level: ProgressiveVocationalProfileLevel,
    comparison: ProgressiveProfileComparison,
    completedCalibrationModules: number,
    completedSimulatorCount: number
  ): string {
    if (level === 'perfil_inicial') {
      return 'Perfil inicial basado en el test teórico. La confianza puede mejorar con calibraciones y simuladores.';
    }
    if (comparison.changedDominantArea) {
      return `La calibración agregó experiencias reales y movió el perfil de ${comparison.initialCombination} hacia ${comparison.calibratedCombination}. Es una señal para explorar ambas rutas, no una decisión definitiva.`;
    }
    if (completedSimulatorCount > 0) {
      return `Las calibraciones y simuladores refuerzan tu perfil ${comparison.calibratedCombination} con más evidencia práctica.`;
    }
    return `La calibración refuerza tu perfil ${comparison.calibratedCombination} con ${completedCalibrationModules} módulo(s) completado(s).`;
  }

  private buildChangeSummary(
    comparison: ProgressiveProfileComparison,
    completedCalibrationModules: number,
    completedSimulatorCount: number
  ): string[] {
    const strongestAreaDelta = this.pickLargestDelta(comparison.areaDeltas, AREA_LABELS);
    const strongestSkillDelta = this.pickLargestDelta(comparison.skillDeltas, SKILL_LABELS);
    const changes = [
      completedCalibrationModules > 0
        ? `Se incorporaron ${completedCalibrationModules} módulo(s) de calibración.`
        : 'Aún no hay calibraciones suficientes para ajustar el perfil.',
      strongestAreaDelta,
      strongestSkillDelta
    ].filter(Boolean);

    if (completedSimulatorCount > 0) {
      changes.push(`Se consideraron ${completedSimulatorCount} simulador(es) completado(s) para elevar la confianza.`);
    }

    if (comparison.changedDominantArea) {
      changes.push('El área dominante cambió; conviene revisar la explicación antes de decidir.');
    }

    return changes;
  }

  private buildMissingSignals(completedCalibrationModules: number, completedSimulatorCount: number): string[] {
    const missingSignals: string[] = [];
    if (completedCalibrationModules === 0) missingSignals.push('Faltan calibraciones');
    if (completedSimulatorCount === 0) missingSignals.push('Faltan simuladores');
    return missingSignals;
  }

  private pickLargestDelta<T extends string>(deltas: Record<T, number>, labels: Record<T, string>): string {
    const [key, delta] = (Object.entries(deltas) as [T, number][])
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0] || [null, 0];
    if (!key || Math.abs(delta) < 3) return '';
    const verb = delta > 0 ? 'subió' : 'bajó';
    return `${labels[key]} ${verb} ${Math.abs(delta)} punto(s) frente al perfil inicial.`;
  }

  private rankAreas(areaScores: Record<SteamAreaId, number>): SteamStrengthAreaScore[] {
    return STEAM_AREAS
      .map((area) => ({
        area,
        label: AREA_LABELS[area],
        rawScore: areaScores[area],
        maxPossibleScore: 100,
        normalizedScore: areaScores[area],
        rank: 0
      }))
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .map((score, index) => ({ ...score, rank: index + 1 }));
  }

  private rankSkills(skillScores: Record<ComplementarySkillId, number>): SteamStrengthSkillScore[] {
    return COMPLEMENTARY_SKILLS
      .map((skill) => ({
        skill,
        label: SKILL_LABELS[skill],
        rawScore: skillScores[skill],
        maxPossibleScore: 100,
        normalizedScore: skillScores[skill],
        rank: 0
      }))
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .map((score, index) => ({ ...score, rank: index + 1 }));
  }

  private buildCombination(rankedAreas: SteamStrengthAreaScore[]): string {
    if (!rankedAreas.length) return 'Perfil STEAM inicial';
    if (rankedAreas.length === 1) return rankedAreas[0].label;
    return `${rankedAreas[0].label} + ${rankedAreas[1].label}`;
  }

  private clampScore(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  private clampDelta(value: number): number {
    return Math.min(Math.max(value, -100), 100);
  }
}
