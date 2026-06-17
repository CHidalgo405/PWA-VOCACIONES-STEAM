import { Injectable } from '@angular/core';
import { adaptApiQuestionsToVocationalQuestions } from '../adapters/vocational-question.adapter';
import { recommendSteamCareers } from '../algorithms/career-recommendation.algorithm';
import { calculateSteamStrengthProfile } from '../algorithms/steam-strength.algorithm';
import { LocalVocationalProfileCombinerService } from './local-vocational-profile-combiner.service';
import type { Question } from './test.service';
import type { SimulatorVocationalSignalResult } from '../models/career-simulator.models';
import type {
  CalibrationModuleSignalResult,
  LocalVocationalTestResult,
  VocationalDataSource,
  VocationalUserAnswer
} from '../models/vocational-steam.models';

export interface LocalVocationalResultInput {
  answers: Record<string, string>;
  questions: Question[];
  hasCompletedCalibrations?: boolean;
  completedSimulatorCount?: number;
  calibrationSignals?: CalibrationModuleSignalResult[];
  simulatorSignals?: SimulatorVocationalSignalResult[];
  testResultCount?: number;
  dataSource?: VocationalDataSource;
  fallbackReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalVocationalResultService {
  constructor(private profileCombiner: LocalVocationalProfileCombinerService) {}

  buildResult(input: LocalVocationalResultInput): LocalVocationalTestResult | null {
    if (!input.questions.length || Object.keys(input.answers).length === 0) {
      return null;
    }

    const questions = adaptApiQuestionsToVocationalQuestions(input.questions, {
      addNeutralOption: true
    });
    const answers = this.toVocationalAnswers(input.answers, input.dataSource || 'local');
    const strengthProfile = calculateSteamStrengthProfile({
      questions,
      answers,
      context: {
        hasCompletedCalibrations: input.hasCompletedCalibrations,
        completedSimulatorCount: input.completedSimulatorCount,
        dataSource: input.dataSource || 'local'
      }
    });
    const careerRecommendations = recommendSteamCareers({
      profile: strengthProfile,
      topN: 5,
      dataSource: 'mock'
    });

    const initialResult: LocalVocationalTestResult = {
      id: `local-vocational-${Date.now()}`,
      strengthProfile,
      careerRecommendations,
      generatedAtIso: new Date().toISOString(),
      dataSource: input.dataSource || 'local',
      isExperimental: true,
      fallbackReason: input.fallbackReason
    };

    if (!input.calibrationSignals?.length && !input.simulatorSignals?.length && !input.completedSimulatorCount) {
      return initialResult;
    }

    return this.profileCombiner.applyToLocalResult(
      initialResult,
      input.calibrationSignals || [],
      input.completedSimulatorCount || 0,
      input.testResultCount || 1,
      input.simulatorSignals || []
    );
  }

  private toVocationalAnswers(
    answers: Record<string, string>,
    dataSource: VocationalDataSource
  ): VocationalUserAnswer[] {
    return Object.entries(answers).map(([questionId, optionLetter]) => ({
      questionId,
      optionId: optionLetter,
      optionLetter,
      answeredAtIso: new Date().toISOString(),
      dataSource
    }));
  }
}
