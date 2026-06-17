import { MOCK_VOCATIONAL_QUESTIONS } from '../data/vocational-steam.mock';
import type { VocationalUserAnswer } from '../models/vocational-steam.models';
import { calculateSteamStrengthProfile } from './steam-strength.algorithm';

describe('calculateSteamStrengthProfile', () => {
  it('detects a technological profile', () => {
    const result = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS,
      answers: answersByLetter(['B', 'A', 'B', 'B', 'B', 'B', 'B']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });

    expect(result.dominantArea?.area).toBe('tecnologia');
    expect(result.areaScores.tecnologia).toBeGreaterThanOrEqual(70);
    expect(result.primaryCombination).toContain('Tecnología');
    expect(result.confidence).not.toBe('baja');
    expectScoresWithinRange(Object.values(result.areaScores));
    expectScoresWithinRange(Object.values(result.skillScores));
  });

  it('detects an artistic profile', () => {
    const result = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS,
      answers: answersByLetter(['C', 'C', 'D', 'C', 'C', 'C', 'C']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });

    expect(result.dominantArea?.area).toBe('arte');
    expect(result.areaScores.arte).toBeGreaterThanOrEqual(80);
    expect(result.rankedSkills[0].skill).toBe('creatividad');
    expectScoresWithinRange(Object.values(result.areaScores));
  });

  it('detects a mathematical profile', () => {
    const result = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS,
      answers: answersByLetter(['E', 'A', 'E', 'A', 'E', 'A', 'A']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });

    expect(result.dominantArea?.area).toBe('matematicas');
    expect(result.areaScores.matematicas).toBeGreaterThanOrEqual(90);
    expect(result.neutralAnswers).toBe(3);
    expect(result.confidence).toBe('media');
    expect(result.missingSignals).toContain('Hay respuestas sin experiencia previa');
  });

  it('handles a mixed profile without absurd percentages', () => {
    const result = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS,
      answers: answersByLetter(['A', 'B', 'C', 'D', 'A', 'C', 'D']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });

    expect(result.dominantArea).not.toBeNull();
    expect(result.secondaryArea).not.toBeNull();
    expect(result.primaryCombination).toContain('+');
    expectScoresWithinRange(Object.values(result.areaScores));
    expectScoresWithinRange(Object.values(result.skillScores));
  });

  it('uses safe fallback for incomplete answers', () => {
    const result = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS,
      answers: answersByLetter(['B']),
      context: { hasCompletedCalibrations: false, completedSimulatorCount: 0 }
    });

    expect(result.confidence).toBe('baja');
    expect(result.missingAnswers).toBe(MOCK_VOCATIONAL_QUESTIONS.length - 1);
    expect(result.missingSignals).toContain('Faltan respuestas del test teorico');
    expect(result.missingSignals).toContain('Faltan calibraciones');
    expect(result.missingSignals).toContain('Faltan simuladores');
    expectScoresWithinRange(Object.values(result.areaScores));
  });

  it('does not penalize no-experience neutral answers in normalized scores', () => {
    const baseline = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS.slice(0, 2),
      answers: answersByLetter(['B']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });
    const withNeutral = calculateSteamStrengthProfile({
      questions: MOCK_VOCATIONAL_QUESTIONS.slice(0, 2),
      answers: answersByLetter(['B', 'E']),
      context: { hasCompletedCalibrations: true, completedSimulatorCount: 1 }
    });

    expect(withNeutral.areaScores.tecnologia).toBe(baseline.areaScores.tecnologia);
    expect(withNeutral.neutralAnswers).toBe(1);
    expect(withNeutral.confidence).toBe('baja');
    expect(withNeutral.missingSignals).toContain('Hay respuestas sin experiencia previa');
  });
});

function answersByLetter(letters: string[]): VocationalUserAnswer[] {
  return letters.map((letter, index) => {
    const question = MOCK_VOCATIONAL_QUESTIONS[index];
    const option = question.options.find((item) => item.letter === letter);

    if (!question || !option) {
      throw new Error(`Invalid test fixture answer ${letter} at index ${index}`);
    }

    return {
      questionId: question.id,
      optionId: option.id,
      optionLetter: option.letter,
      dataSource: 'mock'
    };
  });
}

function expectScoresWithinRange(scores: number[]): void {
  for (const score of scores) {
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  }
}

