import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  SimulatorSessionState,
  UserStepDecision,
  CareerSimulatorData,
  SimulatorFeedbackResponse,
} from '../models/career-simulator.models';
import { SimulatorAffinityResult, SteamAxis } from '../models/vocational-profile.models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { VocationalProfileService } from './vocational-profile.service';

@Injectable({
  providedIn: 'root'
})
export class CareerSimulatorService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private profileService = inject(VocationalProfileService);

  private readonly STORAGE_KEY = 'steam_completed_simulators';

  private initialState: SimulatorSessionState = {
    currentCareerData: null,
    currentStepIndex: 0,
    userDecisions: [],
    isCompleted: false,
    currentStepStartTime: 0,
    isLoadingAIFeedback: false,
    aiFeedbackData: null,
    biasFlags: {
      too_fast: false,
      linear_pattern_detected: false
    }
  };

  private sessionSubject = new BehaviorSubject<SimulatorSessionState | null>(null);
  
  /** 
   * Observable de solo lectura con el estado actual de la sesión del simulador. 
   */
  public readonly currentSession$ = this.sessionSubject.asObservable();

  private inferAreaClass(steamAreaName: string): string {
    const area = (steamAreaName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (area.includes('ciencia')) return 'steam-ciencia';
    if (area.includes('tecnologia')) return 'steam-tecnologia';
    if (area.includes('ingenieria')) return 'steam-ingenieria';
    if (area.includes('arte')) return 'steam-arte';
    if (area.includes('matematica')) return 'steam-matematicas';
    return 'steam-tecnologia';
  }

  private inferAreaEmoji(steamAreaName: string): string {
    const area = (steamAreaName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (area.includes('ciencia')) return '🔬';
    if (area.includes('tecnologia')) return '💻';
    if (area.includes('ingenieria')) return '🏗️';
    if (area.includes('arte')) return '🎨';
    if (area.includes('matematica')) return '🧮';
    return '💻';
  }

  public getSimulators(): Observable<CareerSimulatorData[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/career-simulators`).pipe(
      map(sims => sims.map(sim => ({
        careerId: sim.slug || sim.id,
        careerName: sim.careerName,
        description: sim.shortDescription || sim.description,
        steamAreaName: sim.steamArea || sim.steamAreaName,
        areaClass: sim.colorToken ? sim.colorToken : this.inferAreaClass(sim.steamArea || sim.steamAreaName),
        areaEmoji: sim.icon || this.inferAreaEmoji(sim.steamArea || sim.steamAreaName),
        difficulty: sim.difficulty,
        tags: sim.tags,
        colorToken: sim.colorToken,
        icon: sim.icon,
        steps: sim.steps || []
      })))
    );
  }

  public getSimulator(slug: string): Observable<CareerSimulatorData> {
    return this.http.get<any>(`${environment.apiUrl}/career-simulators/${slug}`).pipe(
      map(sim => ({
        careerId: sim.slug || sim.id,
        careerName: sim.careerName,
        description: sim.description || sim.shortDescription,
        steamAreaName: sim.steamArea || sim.steamAreaName,
        areaClass: sim.colorToken ? `bg-[${sim.colorToken}]` : this.inferAreaClass(sim.steamArea || sim.steamAreaName),
        areaEmoji: sim.icon || this.inferAreaEmoji(sim.steamArea || sim.steamAreaName),
        steps: (sim.steps || []).map((step: any) => ({
          ...step,
          // Normaliza el tipo legacy que envía la API actual
          type: step.type === 'AI_FEEDBACK' ? 'REALITY_CHECK' : step.type,
        })),
      }))
    );
  }

  /**
   * Inicializa una nueva sesión de simulación buscando la carrera de forma asíncrona en la API.
   * @param careerSlug El ID o slug de la carrera a simular.
   */
  public startSession(careerSlug: string): void {
    this.sessionSubject.next({
      ...this.initialState,
      isLoadingAIFeedback: true // Representa cargando metadatos
    });

    this.getSimulator(careerSlug).subscribe({
      next: (careerData) => {
        this.sessionSubject.next({
          ...this.initialState,
          currentCareerData: careerData,
          currentStepStartTime: Date.now(),
          biasFlags: { too_fast: false, linear_pattern_detected: false }
        });
      },
      error: (err) => {
        console.error(`No se pudo cargar la sesión del simulador ${careerSlug} desde la API:`, err);
        this.sessionSubject.next(null);
      }
    });
  }

  /**
   * Calcula y retorna el tiempo transcurrido (en segundos) desde que inició el paso actual.
   * @returns Segundos transcurridos.
   */
  public recordStepTime(): number {
    const state = this.sessionSubject.value;
    if (!state || state.currentStepStartTime === 0) return 0;
    
    const elapsedMs = Date.now() - state.currentStepStartTime;
    return Math.round(elapsedMs / 1000);
  }

  /**
   * Registra una decisión, detecta posible prisa (tiempo < 3s) y avanza al siguiente paso.
   * Si es el último paso, marca la simulación como completada y guarda en localStorage.
   * @param decision La decisión tomada por el usuario en el paso actual.
   */
  public advanceStep(decision: UserStepDecision): void {
    const state = this.sessionSubject.value;
    if (!state || !state.currentCareerData || state.isCompleted) return;

    // Calcular tiempo para este paso y convertirlo a MS (el tipo UserStepDecision guarda MS)
    const timeSpentSeconds = this.recordStepTime();
    decision.timeSpentMs = timeSpentSeconds * 1000;

    const newBiasFlags = { ...state.biasFlags };
    
    // Detección de prisa: Si responde en menos de 3 segundos
    if (timeSpentSeconds < 3) {
      newBiasFlags.too_fast = true;
    }

    const newDecisions = [...state.userDecisions, decision];
    
    const isLastStep = state.currentStepIndex >= 5; // Hay 6 pasos (0 a 5)

    this.sessionSubject.next({
      ...state,
      userDecisions: newDecisions,
      currentStepIndex: isLastStep ? state.currentStepIndex : state.currentStepIndex + 1,
      currentStepStartTime: Date.now(),
      isCompleted: isLastStep,
      biasFlags: newBiasFlags
    });

    // Detectar patrones de respuesta repetitivos y actualizar bandera
    this.detectLinearPattern();

    if (isLastStep) {
      this.saveCompletedSimulator(state.currentCareerData.careerId);
    }
  }

  /**
   * Retorna true y marca la bandera 'linear_pattern_detected' si el usuario ha elegido 
   * el mismo índice de opción el 70% de las veces o más, considerando pasos DATA_ANALYSIS y TRADEOFF_DECISION.
   * @returns Booleano indicando si se detectó el patrón lineal.
   */
  public detectLinearPattern(): boolean {
    const state = this.sessionSubject.value;
    if (!state || state.userDecisions.length < 3) return false;

    // Obtener las decisiones aplicables que contengan un option ID
    const applicableDecisions = state.userDecisions.filter(d => 
      (d.stepType === 'DATA_ANALYSIS' || d.stepType === 'TRADEOFF_DECISION') && d.selectedOptionId
    );

    if (applicableDecisions.length < 3) return false;

    // Mapear cada decision a su índice respectivo dentro de las opciones
    const optionIndices = applicableDecisions.map(decision => {
      const stepData = state.currentCareerData?.steps.find(s => s.id === decision.stepId);
      if (!stepData || !stepData.options) return -1;
      return stepData.options.findIndex((opt: any) => opt.id === decision.selectedOptionId);
    }).filter(idx => idx !== -1);

    if (optionIndices.length < 3) return false;

    // Contar la frecuencia máxima de un mismo índice
    const indexCounts = new Map<number, number>();
    let maxCount = 0;
    
    for (const idx of optionIndices) {
      const count = (indexCounts.get(idx) || 0) + 1;
      indexCounts.set(idx, count);
      if (count > maxCount) maxCount = count;
    }

    const isLinear = (maxCount / optionIndices.length) >= 0.7;

    if (isLinear && !state.biasFlags.linear_pattern_detected) {
      this.sessionSubject.next({
        ...state,
        biasFlags: { ...state.biasFlags, linear_pattern_detected: true }
      });
    }

    return isLinear;
  }

  /**
   * Envía las decisiones a la API (POST /simulator/submit): el backend corre
   * el algoritmo A3a contra los pasos reales, guarda el resultado y recomputa
   * el perfil vocacional. Sin conexión, cae al algoritmo local equivalente.
   */
  public computeAffinityResult(): Observable<SimulatorFeedbackResponse> {
    const state = this.sessionSubject.value;
    if (!state?.currentCareerData) {
      return throwError(() => new Error('No hay una sesión activa de simulación.'));
    }

    const career = state.currentCareerData;
    const payload = {
      careerSlug: career.careerId,
      decisions: state.userDecisions.map(d => ({
        stepId: d.stepId,
        stepType: d.stepType,
        selectedOptionId: d.selectedOptionId,
        timeSpentMs: d.timeSpentMs,
      })),
      biasFlags: state.biasFlags,
    };

    return this.profileService.submitSimulatorSession(payload).pipe(
      map(res => res.feedback as SimulatorFeedbackResponse),
      tap(feedback => {
        this.persistSimulatorResult(career.careerId, career.steamAreaName, feedback);
        this.sessionSubject.next({ ...state, isLoadingAIFeedback: false, aiFeedbackData: feedback });
      }),
      catchError(err => {
        console.warn('Simulador: API no disponible, usando algoritmo local.', err);
        return this.computeAffinityLocally(state);
      }),
    );
  }

  /** Fallback offline: la réplica local del algoritmo A3a. */
  private computeAffinityLocally(state: SimulatorSessionState): Observable<SimulatorFeedbackResponse> {
    const career = state.currentCareerData!;
    try {
      const result = this.runAffinityAlgorithm(state);
      this.persistSimulatorResult(career.careerId, career.steamAreaName, result);
      this.sessionSubject.next({ ...state, isLoadingAIFeedback: false, aiFeedbackData: result });
      return of(result);
    } catch (err) {
      return throwError(() => err);
    }
  }

  /** Algoritmo de afinidad: acumula steamTraitWeight de cada opción elegida y deriva métricas. */
  private runAffinityAlgorithm(state: SimulatorSessionState): SimulatorFeedbackResponse {
    const career = state.currentCareerData!;
    const decisions = state.userDecisions;

    const AXIS_MAP: Record<string, string> = { S: 'ciencia', T: 'tecnologia', E: 'ingenieria', A: 'artes', M: 'matematicas' };
    const steamAccum: Record<string, number> = { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 };
    let scoredDecisions = 0;

    for (const decision of decisions) {
      if (!decision.selectedOptionId) continue;
      const step = career.steps.find((s: any) => s.id === decision.stepId);
      if (!step?.options) continue;
      const option = step.options.find((o: any) => o.id === decision.selectedOptionId);
      if (!option) continue;

      if (option.steamTraitWeight) {
        for (const [axis, weight] of Object.entries(option.steamTraitWeight as Record<string, number>)) {
          if (axis in steamAccum) steamAccum[axis] += weight;
        }
        scoredDecisions++;
      } else if (option.steamArea && AXIS_MAP[option.steamArea]) {
        steamAccum[AXIS_MAP[option.steamArea]] += 10;
        scoredDecisions++;
      }
    }

    // Normalizar a 0-100 relativo al eje con mayor acumulación
    const steamScores: Record<string, number> = { ...steamAccum };
    const maxVal = Math.max(...Object.values(steamAccum), 1);
    for (const axis of Object.keys(steamScores)) {
      steamScores[axis] = Math.round((steamAccum[axis] / maxVal) * 100);
    }

    // Afinidad basada en el eje principal de la carrera
    const primaryAxis = this.getCareerAxisKey(career.steamAreaName);
    const primaryScore = scoredDecisions > 0 ? (steamScores[primaryAxis] ?? 60) : 60;

    // Tiempo promedio por decisión (segundos)
    const avgTimeSec = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.timeSpentMs, 0) / decisions.length / 1000
      : 0;

    const timeFactor = Math.min(1, avgTimeSec / 20);
    const biasDeduction = state.biasFlags.linear_pattern_detected ? 15 : 0;
    const speedDeduction = state.biasFlags.too_fast ? 10 : 0;
    const affinityScore = Math.max(10, Math.min(100,
      Math.round(primaryScore * (0.7 + 0.3 * timeFactor) - biasDeduction - speedDeduction)
    ));

    const confidenceLevel: 'high' | 'medium' | 'low' =
      (state.biasFlags.too_fast && state.biasFlags.linear_pattern_detected) ? 'low' :
      (state.biasFlags.too_fast || state.biasFlags.linear_pattern_detected) ? 'medium' : 'high';

    const reasoningStyle =
      avgTimeSec > 15 ? 'Reflexivo y analítico. Tomaste tiempo para evaluar cada escenario con cuidado antes de decidir.' :
      avgTimeSec > 5  ? 'Equilibrado e intuitivo. Combinaste análisis con instinto al enfrentar cada situación.' :
                        'Rápido y directo. Tus decisiones fueron ágiles; asegúrate de haber leído cada escenario con calma.';

    // Fortalezas: top 3 ejes con mayor puntuación
    const STRENGTH_LABELS: Record<string, string> = {
      ciencia: 'Pensamiento científico', tecnologia: 'Aptitud tecnológica',
      ingenieria: 'Resolución de problemas', artes: 'Creatividad aplicada',
      matematicas: 'Razonamiento lógico-matemático',
    };
    const AREA_LABELS: Record<string, string> = {
      ciencia: 'CIENCIA', tecnologia: 'TECNOLOGÍA', ingenieria: 'INGENIERÍA',
      artes: 'ARTES', matematicas: 'MATEMÁTICAS',
    };
    const sortedAxes = Object.entries(steamScores).sort(([, a], [, b]) => b - a);
    const strengthsDetected = sortedAxes.slice(0, 3)
      .filter(([, s]) => s > 0)
      .map(([axis]) => STRENGTH_LABELS[axis] || axis);

    if (strengthsDetected.length === 0) {
      strengthsDetected.push('Participación en el simulador', 'Exploración vocacional', 'Toma de decisiones');
    }

    const steamAffinityAnalysis = sortedAxes.slice(0, 3)
      .filter(([, s]) => s > 0)
      .map(([axis, s]) => `${AREA_LABELS[axis] || axis}: ${s >= 70 ? 'Fuerte' : s >= 40 ? 'Moderado' : 'En desarrollo'}`)
      .join(', ') || `${career.steamAreaName}: Explorado`;

    const honestRealityCheck =
      affinityScore >= 75
        ? `Tu comportamiento mostró una afinidad ${affinityScore >= 85 ? 'muy alta' : 'alta'} con ${career.careerName}. Las decisiones que tomaste reflejan un perfil compatible con los retos reales de esta carrera.`
        : affinityScore >= 50
        ? `Tienes bases sólidas para esta área, pero algunos escenarios revelaron zonas de incertidumbre. ${career.careerName} requiere habilidades que podrías desarrollar con práctica constante.`
        : `Tu perfil de decisiones sugiere que esta área puede representar un reto significativo. Explora también otras opciones antes de comprometerte con ${career.careerName}.`;

    return {
      reasoning_style: reasoningStyle,
      steam_affinity_analysis: steamAffinityAnalysis,
      strengths_detected: strengthsDetected,
      honest_reality_check: honestRealityCheck,
      affinity_score: affinityScore,
      confidence_level: confidenceLevel,
      suggested_next_simulators: [],
    };
  }

  private getCareerAxisKey(steamAreaName: string): SteamAxis {
    const area = (steamAreaName || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (area.includes('ciencia')) return 'ciencia';
    if (area.includes('tecnologia')) return 'tecnologia';
    if (area.includes('ingenieria')) return 'ingenieria';
    if (area.includes('arte')) return 'artes';
    if (area.includes('matematica')) return 'matematicas';
    return 'tecnologia';
  }

  /** Guarda el SimulatorAffinityResult en localStorage para que el motor de perfil lo consuma. */
  private persistSimulatorResult(careerSlug: string, steamAreaName: string, result: SimulatorFeedbackResponse): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;
    const key = `simulator_results_${userId}`;
    try {
      const existing: SimulatorAffinityResult[] = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = existing.findIndex(r => r.careerSlug === careerSlug);
      const entry: SimulatorAffinityResult = {
        careerSlug,
        axis: this.getCareerAxisKey(steamAreaName),
        affinity: result.affinity_score,
        biasFlags: { too_fast: false, linear_pattern_detected: false },
      };
      const state = this.sessionSubject.value;
      if (state) entry.biasFlags = state.biasFlags;
      if (idx >= 0) existing[idx] = entry; else existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* silently ignore storage errors */ }
  }

  /**
   * Resultados de simuladores del usuario guardados en la API (último
   * intento por carrera). Fuente de verdad cross-device para el catálogo.
   */
  public getMyResults(): Observable<Array<{
    careerSlug: string;
    axis: string;
    affinity: number;
    completedAt?: string;
  }>> {
    return this.http.get<any[]>(`${environment.apiUrl}/simulator/results`).pipe(
      map(rows => (Array.isArray(rows) ? rows : [])),
      catchError(() => of([])),
    );
  }

  /**
   * Resetea el estado completo de la sesión.
   */
  public resetSession(): void {
    this.sessionSubject.next(null);
  }

  /** Clave por usuario: sin esto, un equipo compartido mostraría los
   *  simuladores completados por el estudiante anterior. */
  private completedSimulatorsKey(): string | null {
    const userId = this.authService.getCurrentUser()?.id;
    return userId ? `${this.STORAGE_KEY}_${userId}` : null;
  }

  /**
   * Lee del localStorage el arreglo con los identificadores (slugs)
   * de los simuladores que el usuario ha completado.
   * @returns Array de strings con los career_slugs.
   */
  public getCompletedSimulators(): string[] {
    const key = this.completedSimulatorsKey();
    if (!key) return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Agrega un identificador al array de simuladores completados y lo persiste.
   * @param careerSlug Slug de la carrera completada.
   */
  private saveCompletedSimulator(careerSlug: string): void {
    const key = this.completedSimulatorsKey();
    if (!key) return;
    const completed = this.getCompletedSimulators();
    if (!completed.includes(careerSlug)) {
      completed.push(careerSlug);
      try {
        localStorage.setItem(key, JSON.stringify(completed));
      } catch (e) {
        console.error('No se pudo persistir el progreso en LocalStorage.', e);
      }
    }
  }
}
