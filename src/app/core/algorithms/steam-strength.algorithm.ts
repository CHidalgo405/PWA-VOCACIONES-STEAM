import type {
  ComplementarySkillId,
  ComplementarySkillWeightMap,
  SteamAreaId,
  SteamAreaWeightMap,
  SteamStrengthAreaScore,
  SteamStrengthProfileResult,
  SteamStrengthSkillScore,
  VocationalDataSource,
  VocationalProfileConfidenceEs,
  VocationalQuestion,
  VocationalQuestionOption,
  VocationalUserAnswer
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
  pensamiento_logico: 'Pensamiento logico',
  creatividad: 'Creatividad',
  comunicacion: 'Comunicacion',
  resolucion_de_problemas: 'Resolucion de problemas',
  trabajo_en_equipo: 'Trabajo en equipo',
  liderazgo: 'Liderazgo',
  analisis_de_datos: 'Analisis de datos',
  pensamiento_critico: 'Pensamiento critico'
};

export interface SteamStrengthAlgorithmContext {
  hasCompletedCalibrations?: boolean;
  completedSimulatorCount?: number;
  dataSource?: VocationalDataSource;
}

export interface SteamStrengthAlgorithmInput {
  questions: VocationalQuestion[];
  answers: VocationalUserAnswer[];
  context?: SteamStrengthAlgorithmContext;
}

export function calculateSteamStrengthProfile(input: SteamStrengthAlgorithmInput): SteamStrengthProfileResult {
  const activeQuestions = input.questions
    .filter((question) => question.isActive)
    .sort((a, b) => a.order - b.order);

  const answerByQuestionId = new Map<string, VocationalUserAnswer>();
  for (const answer of input.answers) {
    answerByQuestionId.set(answer.questionId, answer);
  }

  const rawAreaScores = createEmptyAreaScores();
  const maxAreaScores = createEmptyAreaScores();
  const rawSkillScores = createEmptySkillScores();
  const maxSkillScores = createEmptySkillScores();

  let answeredQuestions = 0;
  let neutralAnswers = 0;
  let missingAnswers = 0;
  let weightedAnswers = 0;

  for (const question of activeQuestions) {
    const answer = answerByQuestionId.get(question.id);
    const selectedOption = answer
      ? question.options.find((option) => option.id === answer.optionId || option.letter === answer.optionLetter)
      : null;

    if (!answer || !selectedOption) {
      missingAnswers++;
      continue;
    }

    answeredQuestions++;

    if (isNoPenaltyOption(selectedOption)) {
      neutralAnswers++;
      continue;
    }

    weightedAnswers++;
    addAreaWeights(rawAreaScores, selectedOption.areaWeights);
    addSkillWeights(rawSkillScores, selectedOption.skillWeights || {});
    addAreaWeights(maxAreaScores, getQuestionMaxAreaWeights(question));
    addSkillWeights(maxSkillScores, getQuestionMaxSkillWeights(question));
  }

  const rankedAreas = rankAreaScores(rawAreaScores, maxAreaScores);
  const rankedSkills = rankSkillScores(rawSkillScores, maxSkillScores);
  const dominantArea = getMeaningfulArea(rankedAreas[0]);
  const secondaryArea = getMeaningfulArea(rankedAreas[1]);
  const primaryCombination = buildPrimaryCombination(dominantArea, secondaryArea);
  const missingSignals = buildMissingSignals({
    totalQuestions: activeQuestions.length,
    missingAnswers,
    neutralAnswers,
    context: input.context
  });
  const confidence = calculateConfidence({
    totalQuestions: activeQuestions.length,
    weightedAnswers,
    neutralAnswers,
    missingAnswers,
    rankedAreas,
    missingSignals
  });

  return {
    areaScores: toNormalizedAreaRecord(rankedAreas),
    skillScores: toNormalizedSkillRecord(rankedSkills),
    rankedAreas,
    rankedSkills,
    dominantArea,
    secondaryArea,
    primaryCombination,
    confidence,
    explanation: buildExplanation(dominantArea, secondaryArea, rankedSkills, confidence),
    missingSignals,
    answeredQuestions,
    neutralAnswers,
    missingAnswers,
    dataSource: input.context?.dataSource || 'local'
  };
}

function isNoPenaltyOption(option: VocationalQuestionOption): boolean {
  return option.isNeutral === true || option.scoringPolicy === 'no_penalty';
}

function getQuestionMaxAreaWeights(question: VocationalQuestion): Partial<SteamAreaWeightMap> {
  const result = createEmptyAreaScores();
  for (const option of question.options) {
    if (isNoPenaltyOption(option)) continue;
    for (const area of STEAM_AREAS) {
      result[area] = Math.max(result[area], option.areaWeights[area] || 0);
    }
  }
  return result;
}

function getQuestionMaxSkillWeights(question: VocationalQuestion): Partial<ComplementarySkillWeightMap> {
  const result = createEmptySkillScores();
  for (const option of question.options) {
    if (isNoPenaltyOption(option)) continue;
    for (const skill of COMPLEMENTARY_SKILLS) {
      result[skill] = Math.max(result[skill], option.skillWeights?.[skill] || 0);
    }
  }
  return result;
}

function addAreaWeights(target: SteamAreaWeightMap, weights: Partial<SteamAreaWeightMap>): void {
  for (const area of STEAM_AREAS) {
    target[area] += sanitizeWeight(weights[area]);
  }
}

function addSkillWeights(target: ComplementarySkillWeightMap, weights: Partial<ComplementarySkillWeightMap>): void {
  for (const skill of COMPLEMENTARY_SKILLS) {
    target[skill] += sanitizeWeight(weights[skill]);
  }
}

function rankAreaScores(
  rawScores: SteamAreaWeightMap,
  maxScores: SteamAreaWeightMap
): SteamStrengthAreaScore[] {
  return STEAM_AREAS
    .map((area) => ({
      area,
      label: AREA_LABELS[area],
      rawScore: round(rawScores[area]),
      maxPossibleScore: round(maxScores[area]),
      normalizedScore: normalizeScore(rawScores[area], maxScores[area]),
      rank: 0
    }))
    .sort(sortByScore)
    .map((score, index) => ({ ...score, rank: index + 1 }));
}

function rankSkillScores(
  rawScores: ComplementarySkillWeightMap,
  maxScores: ComplementarySkillWeightMap
): SteamStrengthSkillScore[] {
  return COMPLEMENTARY_SKILLS
    .map((skill) => ({
      skill,
      label: SKILL_LABELS[skill],
      rawScore: round(rawScores[skill]),
      maxPossibleScore: round(maxScores[skill]),
      normalizedScore: normalizeScore(rawScores[skill], maxScores[skill]),
      rank: 0
    }))
    .sort(sortByScore)
    .map((score, index) => ({ ...score, rank: index + 1 }));
}

function sortByScore<T extends { normalizedScore: number; rawScore: number; label: string }>(a: T, b: T): number {
  return b.normalizedScore - a.normalizedScore
    || b.rawScore - a.rawScore
    || a.label.localeCompare(b.label);
}

function getMeaningfulArea(score: SteamStrengthAreaScore | undefined): SteamStrengthAreaScore | null {
  if (!score || score.normalizedScore <= 0) return null;
  return score;
}

function buildPrimaryCombination(
  dominantArea: SteamStrengthAreaScore | null,
  secondaryArea: SteamStrengthAreaScore | null
): string {
  if (dominantArea && secondaryArea) {
    return `${dominantArea.label} + ${secondaryArea.label}`;
  }
  if (dominantArea) {
    return dominantArea.label;
  }
  return 'Perfil por explorar';
}

function buildMissingSignals(params: {
  totalQuestions: number;
  missingAnswers: number;
  neutralAnswers: number;
  context?: SteamStrengthAlgorithmContext;
}): string[] {
  const signals: string[] = [];
  if (params.missingAnswers > 0) {
    signals.push('Faltan respuestas del test teorico');
  }
  if (params.neutralAnswers > 0) {
    signals.push('Hay respuestas sin experiencia previa');
  }
  if (params.context?.hasCompletedCalibrations !== true) {
    signals.push('Faltan calibraciones');
  }
  if (!params.context?.completedSimulatorCount) {
    signals.push('Faltan simuladores');
  }
  if (params.totalQuestions === 0) {
    signals.push('No hay preguntas activas para evaluar');
  }
  return signals;
}

function calculateConfidence(params: {
  totalQuestions: number;
  weightedAnswers: number;
  neutralAnswers: number;
  missingAnswers: number;
  rankedAreas: SteamStrengthAreaScore[];
  missingSignals: string[];
}): VocationalProfileConfidenceEs {
  if (params.totalQuestions === 0 || params.weightedAnswers === 0) return 'baja';

  const coverage = params.weightedAnswers / params.totalQuestions;
  const neutralRatio = params.neutralAnswers / params.totalQuestions;
  const missingRatio = params.missingAnswers / params.totalQuestions;
  const top = params.rankedAreas[0]?.normalizedScore || 0;
  const second = params.rankedAreas[1]?.normalizedScore || 0;
  const topGap = top - second;

  if (coverage >= 0.85 && neutralRatio <= 0.15 && missingRatio === 0 && topGap >= 12) {
    return params.missingSignals.length > 0 ? 'media' : 'alta';
  }

  if (coverage >= 0.55 && neutralRatio <= 0.45) {
    return 'media';
  }

  return 'baja';
}

function buildExplanation(
  dominantArea: SteamStrengthAreaScore | null,
  secondaryArea: SteamStrengthAreaScore | null,
  rankedSkills: SteamStrengthSkillScore[],
  confidence: VocationalProfileConfidenceEs
): string {
  if (!dominantArea) {
    return 'Aun no hay suficientes respuestas con peso vocacional para identificar un area dominante.';
  }

  const topSkills = rankedSkills
    .filter((skill) => skill.normalizedScore > 0)
    .slice(0, 2)
    .map((skill) => skill.label.toLowerCase());
  const skillText = topSkills.length > 0
    ? ` Tambien aparecen senales de ${topSkills.join(' y ')}.`
    : '';
  const secondaryText = secondaryArea
    ? ` La segunda senal mas fuerte es ${secondaryArea.label}.`
    : '';

  return `El perfil apunta principalmente a ${dominantArea.label} por las opciones con mayor peso seleccionadas.${secondaryText}${skillText} La confianza del resultado es ${confidence}.`;
}

function toNormalizedAreaRecord(scores: SteamStrengthAreaScore[]): Record<SteamAreaId, number> {
  const record = createEmptyAreaScores();
  for (const score of scores) {
    record[score.area] = score.normalizedScore;
  }
  return record;
}

function toNormalizedSkillRecord(scores: SteamStrengthSkillScore[]): Record<ComplementarySkillId, number> {
  const record = createEmptySkillScores();
  for (const score of scores) {
    record[score.skill] = score.normalizedScore;
  }
  return record;
}

function normalizeScore(rawScore: number, maxPossibleScore: number): number {
  if (maxPossibleScore <= 0) return 0;
  return clamp(Math.round((rawScore / maxPossibleScore) * 100), 0, 100);
}

function sanitizeWeight(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(value || 0, 0);
}

function createEmptyAreaScores(): SteamAreaWeightMap {
  return {
    ciencia: 0,
    tecnologia: 0,
    ingenieria: 0,
    arte: 0,
    matematicas: 0
  };
}

function createEmptySkillScores(): ComplementarySkillWeightMap {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
