import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { OfflineSyncService } from './offline-sync.service';
import {
  SteamAxis,
  SteamVector,
  VocationalProfile,
  VocationRecommendation,
  CareerRecommendation,
  ProfileContribution,
  ProfileStrength,
  CalibrationState,
  ConfidenceLevel,
  NextStep,
  CalibrationModuleResult,
  SimulatorAffinityResult,
  SOURCE_WEIGHTS,
  CALIBRATION_GAINS,
} from '../models/vocational-profile.models';

/** Respuesta de POST /calibration/submit. */
export interface CalibrationSubmitResponse {
  success: boolean;
  moduleId: string;
  /** Perfil recomputado por la API (null si aún no hay test teórico). */
  profile: VocationalProfile | null;
}

/** Respuesta de POST /simulator/submit. */
export interface SimulatorSubmitResponse {
  success: boolean;
  affinity: SimulatorAffinityResult;
  feedback: {
    reasoning_style: string;
    steam_affinity_analysis: string;
    strengths_detected: string[];
    honest_reality_check: string;
    affinity_score: number;
    confidence_level: 'high' | 'medium' | 'low';
    suggested_next_simulators: string[];
  };
  profile: VocationalProfile | null;
}

/**
 * ============================================================================
 *  MOTOR DE PERFIL VOCACIONAL (LOCAL, BASADO EN ALGORITMOS)
 * ============================================================================
 *
 * Reemplaza el procesamiento por IA por algoritmos deterministas y explicables.
 * Corre 100% local con un catálogo de ejemplo. Cuando la API incorpore los
 * algoritmos, este servicio se sustituye por llamadas HTTP, pero la forma de la
 * respuesta (VocationalProfile) NO cambia.
 *
 * Dos "algoritmos" conceptuales:
 *   - ALGORITMO 1 (vocaciones): de las respuestas → ejes STEAM dominantes →
 *     vocaciones predominantes.
 *   - ALGORITMO 2 (carreras): del perfil → planes de estudio / carreras afines.
 */

const AXES: SteamAxis[] = [
  'ciencia',
  'tecnologia',
  'ingenieria',
  'artes',
  'matematicas',
];

interface AxisMeta {
  label: string;
  /** Forma adjetiva para el nombre del perfil (ej. "Tecnológico"). */
  adjective: string;
  icon: string;
  archetype: string;
  strengthTitle: string;
  strengthDesc: string;
  workStyle: string[];
}

/** Metadatos por eje STEAM (etiquetas, íconos, arquetipos, fortalezas). */
const AXIS_META: Record<SteamAxis, AxisMeta> = {
  ciencia: {
    label: 'Ciencia',
    adjective: 'Científico',
    icon: 'flask-conical',
    archetype: 'Investigador',
    strengthTitle: 'Pensamiento científico',
    strengthDesc:
      'Formulas hipótesis y buscas evidencia antes de concluir. Te mueve entender el porqué de las cosas.',
    workStyle: [
      'Curiosidad metódica',
      'Razonamiento basado en evidencia',
      'Atención al detalle',
    ],
  },
  tecnologia: {
    label: 'Tecnología',
    adjective: 'Tecnológico',
    icon: 'cpu',
    archetype: 'Creador Digital',
    strengthTitle: 'Mentalidad tecnológica',
    strengthDesc:
      'Aprendes herramientas nuevas con facilidad y disfrutas automatizar y construir soluciones digitales.',
    workStyle: [
      'Aprendizaje autodidacta',
      'Lógica computacional',
      'Iteración rápida',
    ],
  },
  ingenieria: {
    label: 'Ingeniería',
    adjective: 'Ingenieril',
    icon: 'wrench',
    archetype: 'Constructor',
    strengthTitle: 'Resolución práctica',
    strengthDesc:
      'Te orientas a soluciones tangibles: diseñas, pruebas y optimizas sistemas que funcionan en el mundo real.',
    workStyle: [
      'Orientación a resultados',
      'Optimización de recursos',
      'Pensamiento sistémico',
    ],
  },
  artes: {
    label: 'Artes',
    adjective: 'Creativo',
    icon: 'palette',
    archetype: 'Visionario Creativo',
    strengthTitle: 'Sensibilidad creativa',
    strengthDesc:
      'Comunicas ideas con impacto visual y emocional. Equilibras estética, propósito y experiencia humana.',
    workStyle: [
      'Pensamiento divergente',
      'Empatía con el usuario',
      'Comunicación visual',
    ],
  },
  matematicas: {
    label: 'Matemáticas',
    adjective: 'Matemático',
    icon: 'sigma',
    archetype: 'Analista',
    strengthTitle: 'Razonamiento abstracto',
    strengthDesc:
      'Modelas problemas complejos con patrones y números. Te sientes cómodo con la abstracción y la lógica formal.',
    workStyle: [
      'Pensamiento abstracto',
      'Análisis cuantitativo',
      'Rigor lógico',
    ],
  },
};

/** ALGORITMO 1 — catálogo de vocaciones por eje (datos de ejemplo). */
const VOCATION_CATALOG: Record<
  SteamAxis,
  Omit<VocationRecommendation, 'affinity'>[]
> = {
  ciencia: [
    {
      name: 'Investigación biomédica',
      axis: 'ciencia',
      description:
        'Estudiar el cuerpo humano y enfermedades para desarrollar tratamientos y diagnósticos.',
      skills: ['Método científico', 'Análisis de datos', 'Laboratorio'],
      icon: 'microscope',
    },
    {
      name: 'Ciencias ambientales',
      axis: 'ciencia',
      description:
        'Analizar ecosistemas y proponer soluciones sostenibles a problemas ambientales.',
      skills: ['Observación', 'Modelado', 'Trabajo de campo'],
      icon: 'leaf',
    },
  ],
  tecnologia: [
    {
      name: 'Desarrollo de software',
      axis: 'tecnologia',
      description:
        'Diseñar y construir aplicaciones y sistemas que resuelven problemas reales.',
      skills: ['Programación', 'Lógica', 'Arquitectura de sistemas'],
      icon: 'code-2',
    },
    {
      name: 'Ciberseguridad',
      axis: 'tecnologia',
      description:
        'Proteger sistemas e información frente a amenazas digitales.',
      skills: ['Análisis de riesgos', 'Redes', 'Pensamiento adversario'],
      icon: 'shield',
    },
  ],
  ingenieria: [
    {
      name: 'Ingeniería mecatrónica',
      axis: 'ingenieria',
      description:
        'Integrar mecánica, electrónica y software para crear sistemas automatizados.',
      skills: ['Diseño', 'Control', 'Prototipado'],
      icon: 'cpu',
    },
    {
      name: 'Ingeniería civil',
      axis: 'ingenieria',
      description: 'Planear y construir infraestructura segura y funcional.',
      skills: ['Cálculo estructural', 'Gestión de proyectos', 'Materiales'],
      icon: 'building-2',
    },
  ],
  artes: [
    {
      name: 'Diseño de experiencia (UX/UI)',
      axis: 'artes',
      description:
        'Crear productos digitales útiles, usables y atractivos centrados en las personas.',
      skills: ['Investigación de usuarios', 'Prototipado', 'Diseño visual'],
      icon: 'palette',
    },
    {
      name: 'Producción audiovisual',
      axis: 'artes',
      description: 'Contar historias con imagen, sonido y movimiento.',
      skills: ['Narrativa', 'Composición', 'Edición'],
      icon: 'clapperboard',
    },
  ],
  matematicas: [
    {
      name: 'Ciencia de datos',
      axis: 'matematicas',
      description:
        'Extraer conocimiento de grandes volúmenes de datos para tomar mejores decisiones.',
      skills: ['Estadística', 'Programación', 'Modelado'],
      icon: 'bar-chart-3',
    },
    {
      name: 'Actuaría / finanzas cuantitativas',
      axis: 'matematicas',
      description:
        'Modelar riesgo e incertidumbre para el sector financiero y asegurador.',
      skills: ['Probabilidad', 'Modelos financieros', 'Análisis'],
      icon: 'trending-up',
    },
  ],
};

/** ALGORITMO 2 — catálogo de carreras / planes de estudio por eje (ejemplo). */
const CAREER_CATALOG: Record<
  SteamAxis,
  Omit<CareerRecommendation, 'affinity' | 'rationale'>[]
> = {
  ciencia: [
    {
      careerName: 'Médico Cirujano',
      axis: 'ciencia',
      studyPlanHighlights: [
        'Anatomía',
        'Fisiología',
        'Bioquímica',
        'Farmacología',
      ],
      careerFields: ['Hospitales', 'Investigación clínica', 'Salud pública'],
      relatedSimulatorSlug: 'medicina',
      icon: 'stethoscope',
    },
    {
      careerName: 'Biotecnología',
      axis: 'ciencia',
      studyPlanHighlights: [
        'Biología molecular',
        'Genética',
        'Microbiología',
        'Bioprocesos',
      ],
      careerFields: ['Farmacéutica', 'Agroindustria', 'I+D'],
      relatedSimulatorSlug: 'biotecnologia',
      icon: 'dna',
    },
  ],
  tecnologia: [
    {
      careerName: 'Ingeniería en Software',
      axis: 'tecnologia',
      studyPlanHighlights: [
        'Algoritmos',
        'Estructuras de datos',
        'Bases de datos',
        'Ingeniería de software',
      ],
      careerFields: ['Desarrollo web/móvil', 'Startups', 'Cloud'],
      relatedSimulatorSlug: 'software',
      icon: 'code-2',
    },
    {
      careerName: 'Ingeniería en Inteligencia Artificial',
      axis: 'tecnologia',
      studyPlanHighlights: [
        'Machine Learning',
        'Álgebra lineal',
        'Procesamiento de datos',
        'Redes neuronales',
      ],
      careerFields: ['IA aplicada', 'Robótica', 'Análisis predictivo'],
      relatedSimulatorSlug: 'inteligencia-artificial-ml',
      icon: 'bot',
    },
  ],
  ingenieria: [
    {
      careerName: 'Ingeniería Mecatrónica',
      axis: 'ingenieria',
      studyPlanHighlights: [
        'Mecánica',
        'Electrónica',
        'Control',
        'Programación',
      ],
      careerFields: ['Automatización industrial', 'Robótica', 'Manufactura'],
      relatedSimulatorSlug: 'mecatronica',
      icon: 'cpu',
    },
    {
      careerName: 'Ingeniería Civil',
      axis: 'ingenieria',
      studyPlanHighlights: [
        'Estática',
        'Resistencia de materiales',
        'Hidráulica',
        'Construcción',
      ],
      careerFields: ['Construcción', 'Infraestructura', 'Consultoría'],
      relatedSimulatorSlug: 'ingenieria-civil',
      icon: 'building-2',
    },
  ],
  artes: [
    {
      careerName: 'Diseño Digital / UX',
      axis: 'artes',
      studyPlanHighlights: [
        'Fundamentos de diseño',
        'Investigación UX',
        'Interacción',
        'Prototipado',
      ],
      careerFields: ['Producto digital', 'Agencias', 'Freelance'],
      relatedSimulatorSlug: 'uxui-design',
      icon: 'palette',
    },
    {
      careerName: 'Animación y Medios Digitales',
      axis: 'artes',
      studyPlanHighlights: [
        'Dibujo',
        'Modelado 3D',
        'Narrativa',
        'Postproducción',
      ],
      careerFields: ['Cine', 'Videojuegos', 'Publicidad'],
      relatedSimulatorSlug: 'animacion-digital',
      icon: 'clapperboard',
    },
  ],
  matematicas: [
    {
      careerName: 'Ciencia de Datos',
      axis: 'matematicas',
      studyPlanHighlights: [
        'Estadística',
        'Programación',
        'Minería de datos',
        'Visualización',
      ],
      careerFields: ['Analítica', 'Banca', 'Tecnología'],
      relatedSimulatorSlug: 'ciencia-de-datos',
      icon: 'bar-chart-3',
    },
    {
      careerName: 'Actuaría',
      axis: 'matematicas',
      studyPlanHighlights: [
        'Probabilidad',
        'Estadística',
        'Modelos de riesgo',
        'Finanzas',
      ],
      careerFields: ['Seguros', 'Banca', 'Consultoría'],
      relatedSimulatorSlug: 'actuaria',
      icon: 'trending-up',
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class VocationalProfileService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private offlineSync = inject(OfflineSyncService);

  /** Perfil vigente (reactivo) para dashboard/resultados. */
  readonly currentProfile = signal<VocationalProfile | null>(null);

  constructor() {
    this.offlineSync.synced$.subscribe(({ response }) => {
      const candidate = (response as any)?.profile ?? response;
      if (candidate?.steamScores && candidate?.profileVersion) {
        this.cacheProfile(candidate as VocationalProfile);
      }
    });
  }

  // ===========================================================================
  //  CAPA API — el motor determinista ahora vive en el backend (A1-A8).
  //  Los métodos locales de abajo se conservan como fallback offline.
  // ===========================================================================

  /**
   * Corre A1→A7 en la API con las respuestas del test teórico
   * ({ questionId: letra }) y persiste el resultado en el historial.
   */
  computeProfileRemote(
    theoreticalAnswers: Record<string, string>,
    locationInput?: string,
  ): Observable<VocationalProfile> {
    const body: any = { theoreticalAnswers };
    if (locationInput?.trim()) body.locationInput = locationInput.trim();
    return this.offlineSync
      .submit<VocationalProfile>('profile', '/profile/compute', body)
      .pipe(tap((profile) => this.cacheProfile(profile)));
  }

  /** Guarda un módulo de calibración en la API y recibe el perfil recomputado. */
  submitCalibrationModule(
    result: CalibrationModuleResult,
  ): Observable<CalibrationSubmitResponse> {
    return this.offlineSync
      .submit<CalibrationSubmitResponse>(
        'calibration',
        '/calibration/submit',
        result as any,
      )
      .pipe(
        tap((res) => {
          if (res.profile) this.cacheProfile(res.profile);
        }),
      );
  }

  /**
   * Envía las decisiones del simulador; la API corre A3a, guarda el
   * resultado y devuelve feedback + perfil recomputado.
   */
  submitSimulatorSession(payload: {
    careerSlug: string;
    decisions: Array<{
      stepId: string;
      stepType?: string;
      selectedOptionId?: string;
      timeSpentMs: number;
    }>;
    biasFlags?: { too_fast: boolean; linear_pattern_detected: boolean };
  }): Observable<SimulatorSubmitResponse> {
    return this.offlineSync
      .submit<SimulatorSubmitResponse>(
        'simulator',
        '/simulator/submit',
        payload as any,
      )
      .pipe(
        tap((res) => {
          if (res.profile) this.cacheProfile(res.profile);
        }),
      );
  }

  /**
   * Módulos de calibración completados según la BD (fuente de verdad
   * cross-device para los chips del dashboard).
   */
  getMyCalibrations(): Observable<{ moduleId: string }[]> {
    return this.http
      .get<any[]>(`${environment.apiUrl}/tests/calibration/me`)
      .pipe(
        map((rows) => (Array.isArray(rows) ? rows : [])),
        catchError(() => of([])),
      );
  }

  /** Recupera el último perfil persistido en la API (p. ej. en otro dispositivo). */
  fetchLatestProfile(): Observable<VocationalProfile | null> {
    return this.http.get<any>(`${environment.apiUrl}/tests/latest`).pipe(
      map((res) => (res?.profile as VocationalProfile) ?? null),
      tap((profile) => {
        if (profile) this.cacheProfile(profile);
      }),
      catchError(() => of(null)),
    );
  }

  // ── Caché local (pintado instantáneo + soporte offline) ──────────────────

  cacheProfile(profile: VocationalProfile): void {
    this.currentProfile.set(profile);
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    try {
      localStorage.setItem(`test_profile_${userId}`, JSON.stringify(profile));
    } catch {
      /* storage lleno o bloqueado: ignorar */
    }
  }

  getCachedProfile(): VocationalProfile | null {
    if (this.currentProfile()) return this.currentProfile();
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    try {
      const raw = localStorage.getItem(`test_profile_${userId}`);
      const profile = raw ? (JSON.parse(raw) as VocationalProfile) : null;
      if (profile) this.currentProfile.set(profile);
      return profile;
    } catch {
      return null;
    }
  }

  // ===========================================================================
  //  MOTOR LOCAL (fallback offline) — réplica de los algoritmos A1-A7
  // ===========================================================================

  /**
   * Calcula el perfil vocacional calibrado LOCALMENTE (fallback sin conexión).
   * La fuente de verdad es la API (computeProfileRemote).
   * @param theoreticalScores Conteo por eje del test teórico (ej. {ciencia: 4, ...}).
   * @param calibrationResults Resultados de módulos de calibración completados.
   * @param simulatorResults Afinidades de simuladores completados.
   */
  computeProfile(
    theoreticalScores: Record<string, number>,
    calibrationResults: CalibrationModuleResult[] = [],
    simulatorResults: SimulatorAffinityResult[] = [],
  ): VocationalProfile {
    const contributions: ProfileContribution[] = [];

    // ── 1. Vector base del test teórico (normalizado 0-100) ──────────────
    const baseVector = this.normalizeTheoretical(theoreticalScores);
    contributions.push({
      source: 'theoretical',
      label: 'Test teórico (20 preguntas)',
      weight: SOURCE_WEIGHTS.theoretical,
      vector: { ...baseVector },
      takenAt: new Date().toISOString(),
    });

    // ── 2. Vector experiencial de calibración (corrige sesgo) ────────────
    const calibVector = this.buildCalibrationVector(calibrationResults);
    if (calibrationResults.length) {
      contributions.push({
        source: 'calibration',
        label: `Tests de calibración (${calibrationResults.length})`,
        weight: SOURCE_WEIGHTS.calibration,
        vector: calibVector ?? {},
      });
    }

    // ── 3. Vector de simuladores (baño de realidad) ──────────────────────
    const simVector = this.buildSimulatorVector(simulatorResults);
    if (simulatorResults.length) {
      contributions.push({
        source: 'simulator',
        label: `Simuladores de carrera (${simulatorResults.length})`,
        weight: SOURCE_WEIGHTS.simulator,
        vector: simVector ?? {},
      });
    }

    // ── 4. Mezcla ponderada por eje (renormalizando pesos disponibles) ───
    const steamScores = this.blend(baseVector, calibVector, simVector);

    // ── 5. Derivados ─────────────────────────────────────────────────────
    const dominantAxes = [...AXES].sort(
      (a, b) => steamScores[b] - steamScores[a],
    );
    const calibration = this.buildCalibration(
      calibrationResults.length,
      simulatorResults.length,
    );
    const { profileName, profileArchetype, profileSummary } =
      this.buildNarrative(dominantAxes, steamScores, calibration);
    const strengths = this.buildStrengths(dominantAxes);
    const workStyle = this.buildWorkStyle(dominantAxes);
    const recommendedVocations = this.recommendVocations(
      dominantAxes,
      steamScores,
    );
    const recommendedCareers = this.recommendCareers(dominantAxes, steamScores);
    const nextSteps = this.buildNextSteps(
      calibrationResults.length,
      simulatorResults.length,
    );

    return {
      steamScores,
      dominantAxes,
      profileName,
      profileArchetype,
      profileSummary,
      calibration,
      contributions,
      strengths,
      workStyle,
      recommendedVocations,
      recommendedCareers,
      nextSteps,
      generatedAt: new Date().toISOString(),
    };
  }

  // ===========================================================================
  //  Cálculo de vectores
  // ===========================================================================

  /** Convierte conteos crudos del test teórico a un vector 0-100. */
  private normalizeTheoretical(scores: Record<string, number>): SteamVector {
    const vector = this.emptyVector();
    const max = Math.max(1, ...AXES.map((a) => scores[a] || 0));
    for (const axis of AXES) {
      vector[axis] = Math.round(((scores[axis] || 0) / max) * 100);
    }
    return vector;
  }

  /**
   * Construye el vector experiencial a partir de las cartas liked/disliked.
   * liked = evidencia de experiencia real (+15); disliked = desinterés (-8).
   * Parte de un neutral de 50 y se acota a 0-100. Devuelve null si no hay señal.
   */
  private buildCalibrationVector(
    results: CalibrationModuleResult[],
  ): Partial<SteamVector> | null {
    if (!results.length) return null;
    const counts: Record<SteamAxis, { liked: number; disliked: number }> = {
      ciencia: { liked: 0, disliked: 0 },
      tecnologia: { liked: 0, disliked: 0 },
      ingenieria: { liked: 0, disliked: 0 },
      artes: { liked: 0, disliked: 0 },
      matematicas: { liked: 0, disliked: 0 },
    };
    for (const mod of results) {
      for (const ans of mod.answers) {
        if (!counts[ans.axis]) continue;
        ans.liked ? counts[ans.axis].liked++ : counts[ans.axis].disliked++;
      }
    }
    const vector: Partial<SteamVector> = {};
    for (const axis of AXES) {
      const c = counts[axis];
      if (c.liked === 0 && c.disliked === 0) continue; // sin señal para este eje
      vector[axis] = this.clamp(50 + c.liked * 15 - c.disliked * 8);
    }
    return Object.keys(vector).length ? vector : null;
  }

  /** Promedia las afinidades de simuladores por eje. */
  private buildSimulatorVector(
    results: SimulatorAffinityResult[],
  ): Partial<SteamVector> | null {
    if (!results.length) return null;
    const acc: Partial<Record<SteamAxis, number[]>> = {};
    for (const r of results) {
      if (!AXES.includes(r.axis)) continue;
      (acc[r.axis] ??= []).push(this.clamp(r.affinity));
    }
    const vector: Partial<SteamVector> = {};
    for (const axis of AXES) {
      const arr = acc[axis];
      if (arr && arr.length)
        vector[axis] = Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    }
    return Object.keys(vector).length ? vector : null;
  }

  /**
   * Mezcla por eje: para cada eje, promedio ponderado de las fuentes que tengan
   * señal, renormalizando los pesos. El test teórico siempre aporta.
   */
  private blend(
    base: SteamVector,
    calib: Partial<SteamVector> | null,
    sim: Partial<SteamVector> | null,
  ): SteamVector {
    const out = this.emptyVector();
    for (const axis of AXES) {
      const parts: Array<{ w: number; v: number }> = [
        { w: SOURCE_WEIGHTS.theoretical, v: base[axis] },
      ];
      if (calib && calib[axis] !== undefined)
        parts.push({ w: SOURCE_WEIGHTS.calibration, v: calib[axis]! });
      if (sim && sim[axis] !== undefined)
        parts.push({ w: SOURCE_WEIGHTS.simulator, v: sim[axis]! });

      const totalW = parts.reduce((s, p) => s + p.w, 0);
      out[axis] = Math.round(parts.reduce((s, p) => s + p.w * p.v, 0) / totalW);
    }
    return out;
  }

  // ===========================================================================
  //  Calibración / confianza
  // ===========================================================================

  private buildCalibration(
    modulesDone: number,
    simsDone: number,
  ): CalibrationState {
    const level = this.clamp(
      CALIBRATION_GAINS.theoreticalBase +
        modulesDone * CALIBRATION_GAINS.perCalibrationModule +
        simsDone * CALIBRATION_GAINS.perSimulator,
    );

    let confidence: ConfidenceLevel;
    let explanation: string;
    if (level >= 90) {
      confidence = 'altamente_calibrado';
      explanation =
        'Tu perfil tiene una base sólida de evidencia. Las recomendaciones son altamente confiables.';
    } else if (level >= 75) {
      confidence = 'calibrado';
      explanation =
        'Buen nivel de calibración. Completa algún simulador más para afinar al máximo tu perfil.';
    } else if (level >= 60) {
      confidence = 'en_calibracion';
      explanation =
        'Tu perfil ya tiene forma, pero aún puede refinarse con más tests de calibración y simuladores.';
    } else {
      confidence = 'inicial';
      explanation =
        'Este es tu perfil base. Calíbralo con las experiencias de gaming, hobbies y simuladores para mayor precisión.';
    }
    return {
      level,
      confidence,
      calibrationModulesCompleted: modulesDone,
      simulatorsCompleted: simsDone,
      explanation,
    };
  }

  // ===========================================================================
  //  Narrativa, fortalezas, estilo
  // ===========================================================================

  private buildNarrative(
    dominant: SteamAxis[],
    scores: SteamVector,
    cal: CalibrationState,
  ) {
    const a1 = dominant[0];
    const a2 = dominant[1];
    const meta1 = AXIS_META[a1];
    const meta2 = AXIS_META[a2];

    // Si el segundo eje está cerca del primero (≤15 pts), es un perfil híbrido.
    const hybrid = scores[a1] - scores[a2] <= 15;
    const profileName = hybrid
      ? `Perfil ${meta1.adjective}–${meta2.adjective}`
      : `Perfil ${meta1.adjective}`;
    const profileArchetype = hybrid
      ? `${meta1.archetype} ${meta2.archetype}`
      : meta1.archetype;

    const summary = hybrid
      ? `Tu perfil combina fuertemente ${meta1.label} y ${meta2.label}. Eres alguien que ${this.lower(meta1.strengthDesc)} y, a la vez, ${this.lower(meta2.strengthDesc)} Esta combinación te abre puertas en campos donde se cruzan ambas áreas. ${cal.explanation}`
      : `Tu perfil está claramente orientado hacia ${meta1.label}. ${meta1.strengthDesc} Tu segunda área de afinidad es ${meta2.label}, que complementa tu perfil principal. ${cal.explanation}`;

    return { profileName, profileArchetype, profileSummary: summary };
  }

  private buildStrengths(dominant: SteamAxis[]): ProfileStrength[] {
    return dominant.slice(0, 3).map((axis) => {
      const m = AXIS_META[axis];
      return {
        title: m.strengthTitle,
        description: m.strengthDesc,
        axis,
        icon: m.icon,
      };
    });
  }

  private buildWorkStyle(dominant: SteamAxis[]): string[] {
    const traits = new Set<string>();
    for (const axis of dominant.slice(0, 2)) {
      for (const t of AXIS_META[axis].workStyle) traits.add(t);
    }
    return [...traits];
  }

  // ===========================================================================
  //  Recomendaciones (algoritmos 1 y 2)
  // ===========================================================================

  /** ALGORITMO 1: vocaciones predominantes, ordenadas por afinidad. */
  private recommendVocations(
    dominant: SteamAxis[],
    scores: SteamVector,
  ): VocationRecommendation[] {
    const out: VocationRecommendation[] = [];
    for (const axis of dominant.slice(0, 3)) {
      for (const v of VOCATION_CATALOG[axis]) {
        out.push({ ...v, affinity: this.affinityFor(axis, scores) });
      }
    }
    return out.sort((a, b) => b.affinity - a.affinity).slice(0, 4);
  }

  /** ALGORITMO 2: carreras / planes de estudio afines. */
  private recommendCareers(
    dominant: SteamAxis[],
    scores: SteamVector,
  ): CareerRecommendation[] {
    const out: CareerRecommendation[] = [];
    for (const axis of dominant.slice(0, 3)) {
      const m = AXIS_META[axis];
      for (const c of CAREER_CATALOG[axis]) {
        out.push({
          ...c,
          affinity: this.affinityFor(axis, scores),
          rationale: `Encaja con tu fuerte afinidad en ${m.label}: ${this.lower(m.strengthDesc)}`,
        });
      }
    }
    return out.sort((a, b) => b.affinity - a.affinity).slice(0, 5);
  }

  /** Afinidad de una recomendación = score del eje con leve ajuste por ranking. */
  private affinityFor(axis: SteamAxis, scores: SteamVector): number {
    return this.clamp(Math.round(scores[axis] * 0.85 + 12));
  }

  // ===========================================================================
  //  Próximos pasos
  // ===========================================================================

  private buildNextSteps(modulesDone: number, simsDone: number): NextStep[] {
    const steps: NextStep[] = [];
    if (modulesDone < 4) {
      steps.push({
        type: 'calibration',
        title: 'Completa tus tests de calibración',
        description: `Te faltan ${4 - modulesDone} módulos. Nos ayudan a distinguir lo que realmente te interesa de lo que solo suena bien.`,
        actionLabel: 'Calibrar perfil',
        route: '/evaluations',
        calibrationGain: CALIBRATION_GAINS.perCalibrationModule,
      });
    }
    steps.push({
      type: 'simulator',
      title: 'Vive un simulador de carrera',
      description:
        'Date un "baño de realidad": experimenta decisiones reales de una carrera y comprueba si encaja contigo.',
      actionLabel: 'Explorar simuladores',
      route: '/career-simulator',
      calibrationGain: CALIBRATION_GAINS.perSimulator,
    });
    return steps;
  }

  // ===========================================================================
  //  Utilidades
  // ===========================================================================

  private emptyVector(): SteamVector {
    return {
      ciencia: 0,
      tecnologia: 0,
      ingenieria: 0,
      artes: 0,
      matematicas: 0,
    };
  }

  private clamp(n: number): number {
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  private lower(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
}
