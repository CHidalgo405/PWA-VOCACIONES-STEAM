/**
 * ============================================================================
 *  MODELO CANÓNICO DEL PERFIL VOCACIONAL CALIBRADO
 * ============================================================================
 *
 * Este archivo define el CONTRATO que la API deberá replicar cuando se migren
 * los algoritmos al backend. Hoy el motor corre localmente (ver
 * `vocational-profile.service.ts`) con datos de ejemplo, pero la forma de los
 * datos (request/response) es la definitiva.
 *
 * FILOSOFÍA DEL SISTEMA
 * ---------------------
 * El perfil final es un vector STEAM (5 ejes) construido con 3 fuentes:
 *   1. Test teórico (20 preguntas)  → CIMIENTO        (peso 55%)
 *   2. Tests de calibración (swipe) → CORRECCIÓN SESGO(peso 30%)
 *   3. Simuladores de carrera       → BAÑO DE REALIDAD(peso 15%)
 *
 * Cada fuente además aporta "calibración" (confianza 0-100). A más tests,
 * más preciso y confiable es el perfil.
 */

// ---------------------------------------------------------------------------
// Ejes STEAM
// ---------------------------------------------------------------------------

/** Los 5 ejes del modelo STEAM, normalizados sin acentos como claves. */
export type SteamAxis =
  | 'ciencia'
  | 'tecnologia'
  | 'ingenieria'
  | 'artes'
  | 'matematicas';

/** Vector de puntuaciones STEAM. Cada valor es 0-100. */
export interface SteamVector {
  ciencia: number;
  tecnologia: number;
  ingenieria: number;
  artes: number;
  matematicas: number;
}

/** Las 3 fuentes de señal que alimentan el perfil. */
export type ProfileSource = 'theoretical' | 'calibration' | 'simulator';

/**
 * Pesos globales de cada fuente sobre el perfil final.
 * (La API debe usar exactamente estos valores para reproducir el resultado.)
 */
export const SOURCE_WEIGHTS: Record<ProfileSource, number> = {
  theoretical: 0.55,
  calibration: 0.30,
  simulator: 0.15,
};

/**
 * Aporte de calibración (confianza) por cada test completado, en puntos
 * porcentuales sobre el medidor 0-100.
 */
export const CALIBRATION_GAINS = {
  /** Completar el test teórico fija la base de calibración. */
  theoreticalBase: 55,
  /** Cada módulo de calibración (swipe deck) completado. */
  perCalibrationModule: 10,
  /** Cada simulador de carrera completado. */
  perSimulator: 7,
} as const;

// ---------------------------------------------------------------------------
// Contribuciones (trazabilidad de cómo se formó el perfil)
// ---------------------------------------------------------------------------

/**
 * Registro de cómo una fuente concreta contribuyó al vector final.
 * Sirve para mostrar trazabilidad ("tu perfil se calculó con X, Y, Z") y para
 * que la API/el frontend puedan auditar el cálculo.
 */
export interface ProfileContribution {
  source: ProfileSource;
  /** Id de la fuente: módulo de calibración o slug del simulador. */
  sourceId?: string;
  /** Etiqueta legible (ej. "Test teórico", "Hábitos de Gaming"). */
  label: string;
  /** Peso efectivo aplicado (0-1). */
  weight: number;
  /** Aporte normalizado al vector STEAM (puede ser parcial). */
  vector: Partial<SteamVector>;
  /** ISO date de cuándo se registró la contribución. */
  takenAt?: string;
}

// ---------------------------------------------------------------------------
// Calibración / confianza
// ---------------------------------------------------------------------------

/** Nivel cualitativo de calibración del perfil. */
export type ConfidenceLevel =
  | 'inicial'           // solo test teórico
  | 'en_calibracion'    // algo de calibración/simuladores
  | 'calibrado'         // buena cobertura
  | 'altamente_calibrado';

export interface CalibrationState {
  /** Medidor 0-100. */
  level: number;
  confidence: ConfidenceLevel;
  /** Cuántos módulos de calibración se completaron. */
  calibrationModulesCompleted: number;
  /** Cuántos simuladores se completaron. */
  simulatorsCompleted: number;
  /** Frase explicativa de qué significa el nivel actual. */
  explanation: string;
}

// ---------------------------------------------------------------------------
// Fortalezas y estilo
// ---------------------------------------------------------------------------

export interface ProfileStrength {
  title: string;
  description: string;
  axis: SteamAxis;
  /** Nombre de ícono lucide para la UI. */
  icon: string;
}

// ---------------------------------------------------------------------------
// Recomendaciones: vocaciones y carreras
// ---------------------------------------------------------------------------

/**
 * Una "vocación" es un área de actividad profesional (más amplia que una
 * carrera concreta). Resultado del ALGORITMO 1 (vocaciones predominantes).
 */
export interface VocationRecommendation {
  name: string;
  axis: SteamAxis;
  /** Afinidad 0-100 con el perfil del usuario. */
  affinity: number;
  description: string;
  /** Habilidades clave asociadas. */
  skills: string[];
  icon: string;
}

/**
 * Una carrera concreta (plan de estudios). Resultado del ALGORITMO 2
 * (asociación perfil → planes de estudio / carreras).
 */
export interface CareerRecommendation {
  careerName: string;
  axis: SteamAxis;
  /** Afinidad 0-100 con el perfil. */
  affinity: number;
  /** Por qué encaja con el perfil del usuario. */
  rationale: string;
  /** Materias / ejes destacados del plan de estudios. */
  studyPlanHighlights: string[];
  /** Campos laborales típicos. */
  careerFields: string[];
  /** Slug del simulador relacionado para "baño de realidad" (si existe). */
  relatedSimulatorSlug?: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Próximos pasos (cómo subir la precisión)
// ---------------------------------------------------------------------------

export interface NextStep {
  type: 'calibration' | 'simulator';
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  /** Cuánto subiría el medidor de calibración si lo completa. */
  calibrationGain: number;
}

// ---------------------------------------------------------------------------
// Perfil vocacional final (lo que consume la vista de resultados)
// ---------------------------------------------------------------------------

export interface VocationalProfile {
  /** Vector STEAM final calibrado (0-100 por eje). */
  steamScores: SteamVector;
  /** Ejes ordenados de mayor a menor afinidad. */
  dominantAxes: SteamAxis[];
  /** Nombre del perfil (ej. "Perfil Tecnológico–Científico"). */
  profileName: string;
  /** Arquetipo corto (ej. "El Constructor Analítico"). */
  profileArchetype: string;
  /** Párrafo descriptivo y detallado del perfil. */
  profileSummary: string;

  /** Estado de calibración / confianza. */
  calibration: CalibrationState;
  /** Trazabilidad de las contribuciones que formaron el perfil. */
  contributions: ProfileContribution[];

  /** Fortalezas detectadas. */
  strengths: ProfileStrength[];
  /** Rasgos de estilo de trabajo/razonamiento. */
  workStyle: string[];

  /** ALGORITMO 1: vocaciones predominantes. */
  recommendedVocations: VocationRecommendation[];
  /** ALGORITMO 2: carreras / planes de estudio afines. */
  recommendedCareers: CareerRecommendation[];

  /** Próximos pasos para subir la precisión del perfil. */
  nextSteps: NextStep[];

  /** ISO date de generación. */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Request hacia la API (cuando se migre)
// ---------------------------------------------------------------------------

/**
 * Payload que el frontend enviaría a la API para que los dos algoritmos
 * (vocaciones + carreras) computen el perfil. Hoy se procesa localmente.
 */
export interface ProfileComputationRequest {
  /** Respuestas del test teórico: { [questionId]: "A" | "B" | ... }. */
  theoreticalAnswers: Record<string, string>;
  /** Resultados de los módulos de calibración completados. */
  calibrationResults?: CalibrationModuleResult[];
  /** Resultados de los simuladores completados. */
  simulatorResults?: SimulatorAffinityResult[];
  /** Ubicación opcional para recomendación de universidades. */
  locationInput?: string;
}

/** Resultado de un módulo de calibración (swipe deck). */
export interface CalibrationModuleResult {
  moduleId: string;
  /** Por cada carta: liked/disliked + el eje STEAM al que pertenece. */
  answers: Array<{ axis: SteamAxis; liked: boolean }>;
}

/** Afinidad resultante de un simulador de carrera. */
export interface SimulatorAffinityResult {
  careerSlug: string;
  axis: SteamAxis;
  /** Afinidad 0-100 calculada algorítmicamente. */
  affinity: number;
  /** Banderas de sesgo detectadas durante la simulación. */
  biasFlags?: { too_fast: boolean; linear_pattern_detected: boolean };
}
