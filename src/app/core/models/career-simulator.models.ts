/**
 * Tipos de mecánicas disponibles en los pasos del simulador de carrera.
 * 
 * - CONTEXT: Solo lectura, establece el escenario.
 * - DATA_ANALYSIS: El usuario debe identificar un patrón o interpretar datos.
 * - TRADEOFF_DECISION: El usuario debe elegir entre opciones con restricciones reales.
 * - SURPRISE_REVEAL: Se revela un dato o evento inesperado propio de la carrera.
 * - AI_FEEDBACK: Se muestra un feedback generado por IA basado en el razonamiento previo.
 * - EMOTIONAL_REFLECTION: El usuario evalúa cómo se sintió ante el reto.
 */
export type SimulatorStepType = 
  | 'CONTEXT'
  | 'DATA_ANALYSIS'
  | 'TRADEOFF_DECISION'
  | 'SURPRISE_REVEAL'
  | 'AI_FEEDBACK'
  | 'EMOTIONAL_REFLECTION';

/**
 * Representa una opción dentro de un paso interactivo del simulador.
 */
export interface SimulatorStepOption {
  /** Identificador único de la opción */
  id: string;
  /** Texto a mostrar al usuario */
  text: string;
  /** Valor numérico asociado a esta opción (útil para ponderaciones) */
  value?: number;
  /** Área STEAM principal a la que aporta esta opción (para cálculo de afinidad) */
  steamArea?: 'S' | 'T' | 'E' | 'A' | 'M';
  /** Pesos específicos que esta opción suma a cada área STEAM según la elección */
  steamTraitWeight?: Record<'ciencia' | 'tecnologia' | 'ingenieria' | 'artes' | 'matematicas', number>;
  /** Datos adicionales específicos de la opción (ej. consecuencias_positivas, consecuencias_negativas) */
  metadata?: Record<string, any>;
}

/**
 * Define la estructura de un paso individual dentro del simulador.
 */
export interface SimulatorStep {
  /** Identificador único del paso */
  id: string;
  /** Tipo de mecánica del paso */
  type: SimulatorStepType;
  /** Título del paso a mostrar en la interfaz */
  title: string;
  /** Contenido principal, descripción de la situación o tarea a realizar */
  content: string;
  /** Opciones disponibles si el paso requiere una decisión */
  options?: SimulatorStepOption[];
  /** Datos adicionales específicos del paso (ej. datos crudos para analizar en DATA_ANALYSIS) */
  metadata?: Record<string, unknown>;
}

/**
 * Estructura estática que define una carrera completa en el simulador.
 * Cada carrera se instancia como un objeto de este tipo con sus pasos predefinidos.
 */
export interface CareerSimulatorData {
  /** Identificador único de la carrera (ej. 'software-engineering') */
  careerId: string;
  /** Nombre visible de la carrera (ej. 'Ingeniería de Software') */
  careerName: string;
  /** Descripción breve o premisa de la simulación de esta carrera */
  description: string;
  /** 
   * Los 6 pasos secuenciales definidos para esta carrera.
   * Deben seguir el orden: CONTEXT, DATA_ANALYSIS, TRADEOFF_DECISION, SURPRISE_REVEAL, AI_FEEDBACK, EMOTIONAL_REFLECTION.
   */
  steps: [
    SimulatorStep,
    SimulatorStep,
    SimulatorStep,
    SimulatorStep,
    SimulatorStep,
    SimulatorStep
  ];
}

/**
 * Representa la acción o respuesta que da el usuario en un paso específico del simulador.
 */
export interface UserStepDecision {
  /** Identificador del paso al que corresponde esta decisión */
  stepId: string;
  /** Tipo de paso en el que se tomó la decisión */
  stepType: SimulatorStepType;
  /** Identificador de la opción seleccionada, si el paso era de selección */
  selectedOptionId?: string;
  /** Texto libre o justificación proporcionada por el usuario (si aplica) */
  reasoning?: string;
  /** Tiempo en milisegundos que le tomó al usuario completar el paso */
  timeSpentMs: number;
}

/**
 * Payload o estructura de datos que se enviará al endpoint de IA (Gemini/Groq)
 * para generar el feedback personalizado en el paso AI_FEEDBACK.
 */
export interface SimulatorStepResponse {
  /** Identificador de la carrera que se está simulando actualmente */
  careerId: string;
  /** Nombre de la carrera para proveer contexto al prompt de IA */
  careerName: string;
  /** Historial de decisiones que ha tomado el usuario hasta el momento previo al feedback */
  decisions: UserStepDecision[];
  /** (Opcional) Identificador del usuario autenticado */
  userId?: string;
}

/**
 * Estructura de la respuesta esperada del endpoint de IA 
 * al procesar un SimulatorStepResponse.
 */
export interface SimulatorAIFeedback {
  /** Mensaje principal generado por la IA analizando el desempeño y razonamiento del usuario */
  feedbackMessage: string;
  /** Puntos fuertes identificados en las decisiones tomadas */
  strengths: string[];
  /** Áreas de mejora, reflexiones adicionales o consecuencias en el mundo real señaladas por la IA */
  areasForImprovement: string[];
}

/**
 * Estado interno de la sesión del simulador que debe manejar el componente.
 */
export interface SimulatorSessionState {
  /** Referencia a los datos completos de la carrera que se está simulando */
  currentCareerData: CareerSimulatorData | null;
  /** Índice del paso actual en el arreglo de steps (0 al 5) */
  currentStepIndex: number;
  /** Arreglo acumulativo con las decisiones que el usuario ha tomado en la sesión actual */
  userDecisions: UserStepDecision[];
  /** Bandera que indica si el simulador ha llegado a su fin */
  isCompleted: boolean;
  /** Timestamp de cuándo inició el paso actual (usado para medir la duración) */
  currentStepStartTime: number;
  /** Bandera que indica si el componente está esperando respuesta de la IA */
  isLoadingAIFeedback: boolean;
  /** Almacena temporalmente el feedback de la IA una vez recibido */
  aiFeedbackData: SimulatorFeedbackResponse | null;
  /** Banderas de detección de sesgos en el comportamiento del usuario */
  biasFlags: {
    too_fast: boolean;
    linear_pattern_detected: boolean;
  };
}

/**
 * Representa una decisión tomada por el usuario en el simulador.
 */
export interface SimulatorFeedbackDecision {
  step: number;
  step_type: string;
  decision_text: string;
  time_spent_seconds: number;
  option_chosen_index?: number;
}

/**
 * Payload esperado del frontend Angular (POST request body).
 */
export interface SimulatorFeedbackRequest {
  career_slug: string;
  career_name: string;
  steam_area: string;
  user_decisions: SimulatorFeedbackDecision[];
  avg_response_time_seconds: number;
  bias_flags: {
    linear_pattern_detected: boolean;
    too_fast: boolean;
  };
}

/**
 * Respuesta que devuelve la API Route hacia el frontend Angular.
 */
export interface SimulatorFeedbackResponse {
  reasoning_style: string;
  steam_affinity_analysis: string;
  strengths_detected: string[];
  honest_reality_check: string;
  affinity_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  suggested_next_simulators: string[];
}

/**
 * Desglose de puntuación de afinidad por área STEAM.
 */
export interface SteamAffinityScore {
  /** Science (Ciencia) */
  S: number;
  /** Technology (Tecnología) */
  T: number;
  /** Engineering (Ingeniería) */
  E: number;
  /** Arts (Artes) */
  A: number;
  /** Mathematics (Matemáticas) */
  M: number;
}

/**
 * Nivel de confianza asociado a los resultados de una simulación.
 * Sirve para detectar respuestas aleatorias ("speedrunning") o inconsistencias.
 */
export type SimulatorConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Objeto final generado tras concluir exitosamente los 6 pasos del simulador.
 */
export interface SimulatorResult {
  /** Identificador único de la carrera simulada */
  careerId: string;
  /** Nombre visible de la carrera simulada */
  careerName: string;
  /** Registro completo de todas las decisiones y tiempos del usuario en cada paso */
  decisions: UserStepDecision[];
  /** Tiempos agrupados o promediados si es necesario (ya contenidos en decisions, pero útil destacarlo) */
  totalTimeSpentMs: number;
  /** Puntuaciones de afinidad calculadas basándose en las opciones elegidas */
  affinityScore: SteamAffinityScore;
  /** Nivel de confianza de los resultados, evaluado según el tiempo por paso y consistencia */
  confidenceFlag: SimulatorConfidenceLevel;
  /** Fecha y hora exacta de la culminación de la simulación */
  completedAt: Date;
}
