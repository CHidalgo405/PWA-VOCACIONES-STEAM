import { Injectable } from '@angular/core';
import {
  DEFAULT_CALIBRATION_MODULE_STATES,
  LOCAL_CALIBRATION_MODULES
} from '../data/vocational-calibration.mock';
import type {
  CalibrationAnswerValue,
  CalibrationExperienceModule,
  CalibrationExperienceModuleId,
  CalibrationModuleSignalResult,
  CalibrationModuleStatus,
  ComplementarySkillId,
  ComplementarySkillWeightMap,
  SteamAreaId,
  SteamAreaWeightMap
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

export interface CalibrationModuleView extends CalibrationExperienceModule {
  status: CalibrationModuleStatus;
}

@Injectable({
  providedIn: 'root'
})
export class LocalVocationalCalibrationService {
  readonly modules = LOCAL_CALIBRATION_MODULES;

  getModulesWithState(currentStates: { id: string; status: CalibrationModuleStatus }[] = []): CalibrationModuleView[] {
    const stateById = new Map(currentStates.map((module) => [module.id, module.status]));
    return this.modules
      .map((module) => ({
        ...module,
        status: (stateById.get(module.id) || DEFAULT_CALIBRATION_MODULE_STATES[module.id]) as CalibrationModuleStatus
      }))
      .sort((a, b) => a.order - b.order);
  }

  getModuleById(moduleId: string): CalibrationExperienceModule | undefined {
    return this.modules.find((module) => module.id === moduleId);
  }

  buildSignalResult(
    moduleId: string,
    answers: Record<string, CalibrationAnswerValue>
  ): CalibrationModuleSignalResult | null {
    const module = this.getModuleById(moduleId);
    if (!module) return null;

    const rawAreaTotals = this.emptyAreaScores();
    const rawSkillTotals = this.emptySkillScores();
    let positiveSignals = 0;
    let noExperienceAnswers = 0;
    let answeredCards = 0;

    for (const card of module.cards) {
      const answer = answers[card.id];
      if (!answer) continue;
      answeredCards++;

      if (answer === 'not_tried') {
        noExperienceAnswers++;
        continue;
      }

      if (answer === 'liked') {
        positiveSignals++;
        this.addWeights(rawAreaTotals, card.areaWeights);
        this.addWeights(rawSkillTotals, card.skillWeights || {});
      }
    }

    const areaAdjustments = this.normalizeScores(rawAreaTotals);
    const skillAdjustments = this.normalizeScores(rawSkillTotals);
    const evidenceRatio = module.cards.length > 0 ? positiveSignals / module.cards.length : 0;
    const confidenceBoost = positiveSignals > 0 ? Math.min(20, Math.round(8 + evidenceRatio * 12)) : 0;

    return {
      id: `local-calibration-${module.id}-${Date.now()}`,
      moduleId: module.id,
      moduleTitle: module.title,
      answers,
      areaAdjustments,
      skillAdjustments,
      answeredCards,
      positiveSignals,
      noExperienceAnswers,
      confidenceBoost,
      explanation: this.buildExplanation(module.title, positiveSignals, noExperienceAnswers),
      dataSource: 'local',
      generatedAtIso: new Date().toISOString()
    };
  }

  saveSignalResult(userId: string, result: CalibrationModuleSignalResult): void {
    const storageKey = this.getStorageKey(userId);
    const currentResults = this.getStoredSignalResults(userId)
      .filter((item) => item.moduleId !== result.moduleId);
    localStorage.setItem(storageKey, JSON.stringify([...currentResults, result]));
  }

  getStoredSignalResults(userId: string): CalibrationModuleSignalResult[] {
    const rawValue = localStorage.getItem(this.getStorageKey(userId));
    if (!rawValue) return [];
    try {
      return JSON.parse(rawValue) as CalibrationModuleSignalResult[];
    } catch (error) {
      console.warn('Failed to parse local calibration signals', error);
      return [];
    }
  }

  toApiCompatibleAnswers(answers: Record<string, CalibrationAnswerValue>): Record<string, 'liked' | 'disliked'> {
    return Object.entries(answers).reduce((apiAnswers, [cardId, answer]) => {
      if (answer === 'liked' || answer === 'disliked') {
        apiAnswers[cardId] = answer;
      }
      return apiAnswers;
    }, {} as Record<string, 'liked' | 'disliked'>);
  }

  private getStorageKey(userId: string): string {
    return `steam_calibration_signals_${userId}`;
  }

  private addWeights<T extends string>(
    target: Record<T, number>,
    weights: Partial<Record<T, number>>
  ): void {
    for (const [key, weight] of Object.entries(weights) as [T, number][]) {
      target[key] = (target[key] || 0) + weight;
    }
  }

  private normalizeScores<T extends string>(scores: Record<T, number>): Record<T, number> {
    const maxScore = Math.max(...Object.values(scores).map(Number), 0);
    return (Object.entries(scores) as [T, number][])
      .reduce((normalized, [key, value]) => {
        normalized[key] = maxScore > 0 ? Math.round((value / maxScore) * 100) : 0;
        return normalized;
      }, {} as Record<T, number>);
  }

  private emptyAreaScores(): Record<SteamAreaId, number> {
    return {
      ciencia: 0,
      tecnologia: 0,
      ingenieria: 0,
      arte: 0,
      matematicas: 0
    };
  }

  private emptySkillScores(): Record<ComplementarySkillId, number> {
    return {
      pensamiento_logico: 0,
      creatividad: 0,
      comunicacion: 0,
      resolucion_de_problemas: 0,
      trabajo_en_equipo: 0,
      liderazgo: 0,
      analisis_de_datos: 0,
      pensamiento_critico: 0
    };
  }

  private buildExplanation(moduleTitle: string, positiveSignals: number, noExperienceAnswers: number): string {
    if (positiveSignals === 0) {
      return `${moduleTitle} no aporta suficientes señales todavía. Las respuestas "No lo he probado" reducen el peso de esa dimensión sin bajar tus puntajes.`;
    }
    const neutralCopy = noExperienceAnswers > 0
      ? ` ${noExperienceAnswers} respuesta(s) sin experiencia se trataron como evidencia pendiente.`
      : '';
    return `${moduleTitle} aporta ${positiveSignals} señal(es) para ajustar el perfil con experiencias reales.${neutralCopy}`;
  }
}
