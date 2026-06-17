import type { University } from './university.model';

export type VocationalDataSource = 'api' | 'local' | 'mock';

export type SteamAreaId =
  | 'ciencia'
  | 'tecnologia'
  | 'ingenieria'
  | 'arte'
  | 'matematicas';

export type SteamAreaApiKey =
  | 'ciencia'
  | 'tecnologia'
  | 'ingenieria'
  | 'artes'
  | 'matematicas';

export type ComplementarySkillId =
  | 'pensamiento_logico'
  | 'creatividad'
  | 'comunicacion'
  | 'resolucion_de_problemas'
  | 'trabajo_en_equipo'
  | 'liderazgo'
  | 'analisis_de_datos'
  | 'pensamiento_critico';

export type VocationalProfileConfidence = 'high' | 'medium' | 'low';

export type VocationalProfileConfidenceEs = 'baja' | 'media' | 'alta';

export type CalibrationExperienceModuleId =
  | 'physical_hobbies'
  | 'digital_consumption'
  | 'everyday_mechanics'
  | 'gaming_habits'
  | 'school_projects'
  | 'teamwork';

export type CalibrationModuleStatus = 'locked' | 'available' | 'completed';

export type CalibrationAnswerValue = 'liked' | 'disliked' | 'not_tried';

export type ProgressiveVocationalProfileLevel =
  | 'perfil_inicial'
  | 'perfil_calibrado'
  | 'perfil_validado'
  | 'perfil_avanzado';

export type VocationalQuestionMeasurementType =
  | 'interes'
  | 'habilidad_percibida'
  | 'experiencia_previa'
  | 'estilo_de_pensamiento'
  | 'motivacion'
  | 'tolerancia_a_frustracion'
  | 'preferencia_de_aprendizaje';

export type VocationalQuestionCategoryId =
  | 'exploracion_cientifica'
  | 'construccion_tecnologica'
  | 'diseno_y_creatividad'
  | 'razonamiento_cuantitativo'
  | 'colaboracion_y_liderazgo'
  | 'resiliencia_vocacional'
  | 'aprendizaje_autonomo';

export type SteamAreaWeightMap = Record<SteamAreaId, number>;

export type ComplementarySkillWeightMap = Record<ComplementarySkillId, number>;

export interface SteamAreaDefinition {
  id: SteamAreaId;
  apiKey: SteamAreaApiKey;
  label: string;
  shortLabel: 'S' | 'T' | 'E' | 'A' | 'M';
  color: string;
  gradientStart: string;
  gradientEnd: string;
  icon: string;
  description: string;
  dataSource: VocationalDataSource;
}

export interface ComplementarySkillDefinition {
  id: ComplementarySkillId;
  label: string;
  description: string;
  icon: string;
  dataSource: VocationalDataSource;
}

export interface VocationalQuestionOption {
  id: string;
  letter: string;
  text: string;
  areaWeights: Partial<SteamAreaWeightMap>;
  skillWeights?: Partial<ComplementarySkillWeightMap>;
  isNeutral?: boolean;
  scoringPolicy?: 'weighted' | 'no_penalty';
  value?: number;
}

export interface VocationalQuestion {
  id: string;
  order: number;
  text: string;
  category: VocationalQuestionCategoryId;
  measurementType: VocationalQuestionMeasurementType;
  options: VocationalQuestionOption[];
  isActive: boolean;
  dataSource: VocationalDataSource;
  tags?: string[];
}

export interface CalibrationExperienceCard {
  id: string;
  text: string;
  category: SteamAreaId | 'habilidades';
  areaWeights: Partial<SteamAreaWeightMap>;
  skillWeights?: Partial<ComplementarySkillWeightMap>;
  isNoExperienceOption?: boolean;
}

export interface CalibrationExperienceModule {
  id: CalibrationExperienceModuleId;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  icon: string;
  order: number;
  defaultStatus: CalibrationModuleStatus;
  unlockExplanation: string;
  lockedReason: string;
  cards: CalibrationExperienceCard[];
  dataSource: VocationalDataSource;
}

export interface CalibrationModuleSignalResult {
  id: string;
  moduleId: CalibrationExperienceModuleId;
  moduleTitle: string;
  answers: Record<string, CalibrationAnswerValue>;
  areaAdjustments: Record<SteamAreaId, number>;
  skillAdjustments: Record<ComplementarySkillId, number>;
  answeredCards: number;
  positiveSignals: number;
  noExperienceAnswers: number;
  confidenceBoost: number;
  explanation: string;
  dataSource: VocationalDataSource;
  generatedAtIso: string;
}

export interface VocationalUserAnswer {
  questionId: string;
  optionId: string;
  optionLetter?: string;
  answeredAtIso?: string;
  timeSpentMs?: number;
  dataSource: VocationalDataSource;
}

export interface SteamAreaScore {
  area: SteamAreaId;
  score: number;
  percentage: number;
  rank: number;
}

export interface ComplementarySkillScore {
  skill: ComplementarySkillId;
  score: number;
  percentage: number;
  rank: number;
}

export interface StrongAreasResult {
  id: string;
  userId?: string;
  areas: SteamAreaScore[];
  strongestArea: SteamAreaScore;
  secondaryArea?: SteamAreaScore;
  complementarySkills: ComplementarySkillScore[];
  confidence: VocationalProfileConfidence;
  dataSource: VocationalDataSource;
  generatedAtIso: string;
}

export interface SteamStrengthAreaScore {
  area: SteamAreaId;
  label: string;
  rawScore: number;
  maxPossibleScore: number;
  normalizedScore: number;
  rank: number;
}

export interface SteamStrengthSkillScore {
  skill: ComplementarySkillId;
  label: string;
  rawScore: number;
  maxPossibleScore: number;
  normalizedScore: number;
  rank: number;
}

export interface SteamStrengthProfileResult {
  areaScores: Record<SteamAreaId, number>;
  skillScores: Record<ComplementarySkillId, number>;
  rankedAreas: SteamStrengthAreaScore[];
  rankedSkills: SteamStrengthSkillScore[];
  dominantArea: SteamStrengthAreaScore | null;
  secondaryArea: SteamStrengthAreaScore | null;
  primaryCombination: string;
  confidence: VocationalProfileConfidenceEs;
  explanation: string;
  missingSignals: string[];
  answeredQuestions: number;
  neutralAnswers: number;
  missingAnswers: number;
  dataSource: VocationalDataSource;
}

export interface SteamCareerRecommendation {
  id: string;
  slug: string;
  name: string;
  description: string;
  primaryArea: SteamAreaId;
  relatedAreas: SteamAreaId[];
  complementarySkills: ComplementarySkillId[];
  matchPercentage?: number;
  reasons?: string[];
  dataSource: VocationalDataSource;
}

export interface SteamCareerWeightProfile {
  careerId: string;
  areaWeights: SteamAreaWeightMap;
  skillWeights: ComplementarySkillWeightMap;
  dataSource: VocationalDataSource;
}

export interface SteamCareerVocationalMatrixItem {
  id: string;
  slug: string;
  name: string;
  primaryArea: SteamAreaId;
  secondaryAreas: SteamAreaId[];
  shortDescription: string;
  relatedSubjects: string[];
  commonActivities: string[];
  requiredSkills: ComplementarySkillId[];
  perceivedDifficulty: 'baja' | 'media' | 'alta';
  jobOutcomes: string[];
  profileMatchReasons: string[];
  vocationalWeights: {
    areas: SteamAreaWeightMap;
    skills: Partial<ComplementarySkillWeightMap>;
  };
  dataSource: VocationalDataSource;
}

export interface SteamCareerRecommendationMatch {
  career: SteamCareerVocationalMatrixItem;
  compatibilityPercentage: number;
  mainReasons: string[];
  matchingAreas: SteamAreaId[];
  areasToStrengthen: SteamAreaId[];
  confidenceWarning?: string;
  dataSource: VocationalDataSource;
}

export interface SteamCareerRecommendationResult {
  recommendations: SteamCareerRecommendationMatch[];
  profileConfidence: VocationalProfileConfidenceEs;
  confidenceWarning?: string;
  dataSource: VocationalDataSource;
}

export interface LocalVocationalTestResult {
  id: string;
  strengthProfile: SteamStrengthProfileResult;
  careerRecommendations: SteamCareerRecommendationResult;
  progressiveProfile?: ProgressiveVocationalProfile;
  generatedAtIso: string;
  dataSource: VocationalDataSource;
  isExperimental: boolean;
  fallbackReason?: string;
}

export interface ProgressiveProfileComparison {
  initialDominantArea: SteamAreaId | null;
  calibratedDominantArea: SteamAreaId | null;
  initialCombination: string;
  calibratedCombination: string;
  changedDominantArea: boolean;
  areaDeltas: Record<SteamAreaId, number>;
  skillDeltas: Record<ComplementarySkillId, number>;
}

export interface ProgressiveVocationalProfile {
  id: string;
  level: ProgressiveVocationalProfileLevel;
  initialResultId: string;
  strengthProfile: SteamStrengthProfileResult;
  careerRecommendations: SteamCareerRecommendationResult;
  confidence: VocationalProfileConfidenceEs;
  completedCalibrationModules: number;
  completedSimulatorCount: number;
  testResultCount: number;
  explanation: string;
  changeSummary: string[];
  comparison: ProgressiveProfileComparison;
  dataSource: VocationalDataSource;
  generatedAtIso: string;
}

export interface NearbySteamUniversity extends Omit<University, 'programs'> {
  id: string;
  city: string;
  state?: string;
  country: string;
  programs: string[];
  websiteUrl?: string;
  dataSource: VocationalDataSource;
  distanceKm?: number;
}

export interface UniversityCareerMatch {
  id: string;
  universityId: string;
  careerId: string;
  matchPercentage: number;
  reasons: string[];
  distanceScore?: number;
  academicFitScore?: number;
  profileFitScore?: number;
  confidence: VocationalProfileConfidence;
  dataSource: VocationalDataSource;
}

export interface LocalUniversityMatchResult {
  university: NearbySteamUniversity;
  distanceKm: number;
  matchTotal: number;
  matchVocational: number;
  matchGeographic: number;
  matchAcademic: number;
  compatibleCareers: string[];
  compatibleAreas: SteamAreaId[];
  reasons: string[];
  warnings: string[];
  dataSource: VocationalDataSource;
}
