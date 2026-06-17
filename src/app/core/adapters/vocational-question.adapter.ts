import type { Option, Question } from '../services/test.service';
import type {
  ComplementarySkillWeightMap,
  SteamAreaId,
  SteamAreaWeightMap,
  VocationalQuestion,
  VocationalQuestionCategoryId,
  VocationalQuestionMeasurementType,
  VocationalQuestionOption
} from '../models/vocational-steam.models';

const ZERO_AREA_WEIGHTS: SteamAreaWeightMap = {
  ciencia: 0,
  tecnologia: 0,
  ingenieria: 0,
  arte: 0,
  matematicas: 0
};

const ZERO_SKILL_WEIGHTS: ComplementarySkillWeightMap = {
  pensamiento_logico: 0,
  creatividad: 0,
  comunicacion: 0,
  resolucion_de_problemas: 0,
  trabajo_en_equipo: 0,
  liderazgo: 0,
  analisis_de_datos: 0,
  pensamiento_critico: 0
};

export interface VocationalQuestionAdapterOptions {
  addNeutralOption?: boolean;
  defaultMeasurementType?: VocationalQuestionMeasurementType;
  defaultCategory?: VocationalQuestionCategoryId;
}

const DEFAULT_ADAPTER_OPTIONS: Required<VocationalQuestionAdapterOptions> = {
  addNeutralOption: true,
  defaultMeasurementType: 'interes',
  defaultCategory: 'exploracion_cientifica'
};

export function adaptApiQuestionsToVocationalQuestions(
  questions: Question[],
  options: VocationalQuestionAdapterOptions = {}
): VocationalQuestion[] {
  return questions.map((question) => adaptApiQuestionToVocationalQuestion(question, options));
}

export function adaptApiQuestionToVocationalQuestion(
  question: Question,
  options: VocationalQuestionAdapterOptions = {}
): VocationalQuestion {
  const resolvedOptions = { ...DEFAULT_ADAPTER_OPTIONS, ...options };
  const adaptedOptions = question.options.map((option, index) => adaptApiOptionToVocationalOption(option, index));
  const optionsWithNeutral = hasNeutralOption(adaptedOptions) || !resolvedOptions.addNeutralOption
    ? adaptedOptions
    : [...adaptedOptions, createNeutralVocationalOption(question.id, adaptedOptions.length)];

  const dominantArea = inferDominantAreaFromOptions(adaptedOptions);

  return {
    id: question.id,
    order: question.order,
    text: question.text,
    category: inferCategoryFromArea(dominantArea, resolvedOptions.defaultCategory),
    measurementType: inferMeasurementTypeFromOrder(question.order, resolvedOptions.defaultMeasurementType),
    options: optionsWithNeutral,
    isActive: true,
    dataSource: 'api',
    tags: ['api-normalized', dominantArea]
  };
}

export function adaptApiOptionToVocationalOption(option: Option, index: number): VocationalQuestionOption {
  const area = normalizeSteamTraitToArea(option.steamTrait);
  const letter = option.letter || String.fromCharCode(65 + index);

  return {
    id: option.id,
    letter,
    text: option.text,
    areaWeights: area ? { [area]: 1 } : ZERO_AREA_WEIGHTS,
    skillWeights: inferSkillWeightsFromArea(area),
    scoringPolicy: 'weighted',
    value: area ? 1 : 0
  };
}

export function createNeutralVocationalOption(questionId: string, index: number): VocationalQuestionOption {
  return {
    id: `${questionId}-neutral`,
    letter: String.fromCharCode(65 + index),
    text: 'No lo he probado / No estoy seguro.',
    areaWeights: ZERO_AREA_WEIGHTS,
    skillWeights: ZERO_SKILL_WEIGHTS,
    isNeutral: true,
    scoringPolicy: 'no_penalty',
    value: 0
  };
}

export function hasNeutralOption(options: VocationalQuestionOption[]): boolean {
  return options.some((option) => option.isNeutral || isNeutralText(option.text));
}

export function isNeutralText(text: string): boolean {
  const normalized = normalizeText(text);
  return normalized.includes('no lo he probado')
    || normalized.includes('no estoy seguro')
    || normalized.includes('no estoy segura')
    || normalized.includes('no se')
    || normalized.includes('ninguna');
}

export function normalizeSteamTraitToArea(steamTrait: string | undefined): SteamAreaId | null {
  const trait = normalizeText(steamTrait || '');
  if (trait.includes('ciencia')) return 'ciencia';
  if (trait.includes('tecnologia')) return 'tecnologia';
  if (trait.includes('ingenieria')) return 'ingenieria';
  if (trait.includes('arte')) return 'arte';
  if (trait.includes('matematica')) return 'matematicas';
  return null;
}

function inferDominantAreaFromOptions(options: VocationalQuestionOption[]): SteamAreaId {
  const totals: SteamAreaWeightMap = { ...ZERO_AREA_WEIGHTS };

  for (const option of options) {
    for (const [area, weight] of Object.entries(option.areaWeights) as [SteamAreaId, number][]) {
      totals[area] += weight || 0;
    }
  }

  return (Object.entries(totals) as [SteamAreaId, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function inferCategoryFromArea(
  area: SteamAreaId,
  fallback: VocationalQuestionCategoryId
): VocationalQuestionCategoryId {
  const categoryByArea: Record<SteamAreaId, VocationalQuestionCategoryId> = {
    ciencia: 'exploracion_cientifica',
    tecnologia: 'construccion_tecnologica',
    ingenieria: 'construccion_tecnologica',
    arte: 'diseno_y_creatividad',
    matematicas: 'razonamiento_cuantitativo'
  };

  return categoryByArea[area] || fallback;
}

function inferMeasurementTypeFromOrder(
  order: number,
  fallback: VocationalQuestionMeasurementType
): VocationalQuestionMeasurementType {
  const cycle: VocationalQuestionMeasurementType[] = [
    'interes',
    'habilidad_percibida',
    'experiencia_previa',
    'estilo_de_pensamiento',
    'motivacion',
    'tolerancia_a_frustracion',
    'preferencia_de_aprendizaje'
  ];

  return cycle[(Math.max(order, 1) - 1) % cycle.length] || fallback;
}

function inferSkillWeightsFromArea(area: SteamAreaId | null): Partial<ComplementarySkillWeightMap> {
  if (area === 'ciencia') {
    return { pensamiento_critico: 1, analisis_de_datos: 1 };
  }
  if (area === 'tecnologia') {
    return { pensamiento_logico: 1, resolucion_de_problemas: 1 };
  }
  if (area === 'ingenieria') {
    return { resolucion_de_problemas: 1, pensamiento_logico: 1 };
  }
  if (area === 'arte') {
    return { creatividad: 1, comunicacion: 1 };
  }
  if (area === 'matematicas') {
    return { pensamiento_logico: 1, analisis_de_datos: 1 };
  }
  return ZERO_SKILL_WEIGHTS;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

