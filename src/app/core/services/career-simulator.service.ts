import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, delay } from 'rxjs/operators';
import { 
  SimulatorSessionState, 
  UserStepDecision,
  CareerSimulatorData,
  SimulatorCompetencyId,
  SimulatorVocationalSignalResult
} from '../models/career-simulator.models';
import type {
  ComplementarySkillId,
  LocalVocationalTestResult,
  SteamAreaId,
  VocationalProfileConfidenceEs
} from '../models/vocational-steam.models';
import { environment } from '../../../environments/environment';
import { 
  SimulatorFeedbackRequest, 
  SimulatorFeedbackResponse, 
  SimulatorFeedbackDecision 
} from '../models/career-simulator.models';
import { LOCAL_CAREER_SIMULATORS } from '../data/local-career-simulators.mock';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CareerSimulatorService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly STORAGE_KEY = 'steam_completed_simulators';
  private readonly VOCATIONAL_SIGNAL_STORAGE_PREFIX = 'steam_simulator_vocational_signals';

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
      map(sims => {
        if (!sims?.length) return LOCAL_CAREER_SIMULATORS;
        return sims.map(sim => ({
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
        }));
      }),
      catchError((error) => {
        console.warn('No se pudieron cargar simuladores desde API. Usando fallback local.', error);
        return of(LOCAL_CAREER_SIMULATORS);
      })
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
        steps: sim.steps
      })),
      catchError((error) => {
        const localSimulator = LOCAL_CAREER_SIMULATORS.find((sim) => sim.careerId === slug);
        if (localSimulator) {
          console.warn(`Usando simulador local para ${slug}.`, error);
          return of(localSimulator);
        }
        return throwError(() => error);
      })
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
    
    const isLastStep = state.currentStepIndex >= state.currentCareerData.steps.length - 1;

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
   * Toma el estado actual de la sesión, construye el payload y hace el POST
   * al endpoint REST del backend para evaluar las decisiones matemáticamente.
   * @returns Observable con la respuesta (SimulatorFeedbackResponse).
   */
  public submitForAIFeedback(): Observable<SimulatorFeedbackResponse> {
    const state = this.sessionSubject.value;
    if (!state || !state.currentCareerData) {
      return throwError(() => new Error('No hay una sesión activa de simulación.'));
    }

    // Mapear las decisiones al nuevo payload esperado (pasos 2 y 3 típicamente son DATA_ANALYSIS y TRADEOFF_DECISION)
    const decisionsForAI: SimulatorFeedbackDecision[] = state.userDecisions.map((d, index) => {
      // Find the option text if it was a selection
      let decisionText = d.reasoning || '';
      let optionChosenIndex = undefined;

      if (d.selectedOptionId) {
        const stepData = state.currentCareerData?.steps.find(s => s.id === d.stepId);
        if (stepData && stepData.options) {
          const optIndex = stepData.options.findIndex((o: any) => o.id === d.selectedOptionId);
          if (optIndex !== -1) {
            optionChosenIndex = optIndex;
            decisionText = stepData.options[optIndex].text;
          }
        }
      }

      return {
        step: index + 1,
        step_type: d.stepType,
        decision_text: decisionText,
        time_spent_seconds: d.timeSpentMs / 1000,
        option_chosen_index: optionChosenIndex
      };
    });

    const totalResponseTime = state.userDecisions.reduce((acc, curr) => acc + (curr.timeSpentMs / 1000), 0);
    const avgResponseTime = decisionsForAI.length > 0 ? totalResponseTime / decisionsForAI.length : 0;

    const payload: SimulatorFeedbackRequest = {
      career_slug: state.currentCareerData.careerId,
      career_name: state.currentCareerData.careerName,
      steam_area: state.currentCareerData.steamAreaName,
      user_decisions: decisionsForAI,
      avg_response_time_seconds: avgResponseTime,
      bias_flags: state.biasFlags
    };

    // Actualizar estado para reflejar la carga
    this.sessionSubject.next({ ...state, isLoadingAIFeedback: true });

    // --- DEMO MOCK: Retornar resultado simulado estático ---
    const mockResponse: SimulatorFeedbackResponse = {
      reasoning_style: 'Analítico y estructurado. Tomaste decisiones basadas en datos objetivos antes que en corazonadas.',
      steam_affinity_analysis: 'CIENCIA: Fuerte, TECNOLOGÍA: Moderado, MATEMÁTICAS: Fuerte',
      strengths_detected: [
        'Priorización de riesgos inminentes',
        'Uso de lógica estructurada',
        'Visión de impacto a gran escala'
      ],
      honest_reality_check: 'Tu nivel de paciencia para lidiar con variables incompletas demuestra que estarías cómodo en entornos de incertidumbre, un aspecto vital de esta carrera.',
      affinity_score: 85,
      confidence_level: state.biasFlags.too_fast ? 'low' : 'high',
      suggested_next_simulators: ['ciencia-de-datos', 'inteligencia-artificial-ml', 'uxui-design']
    };

    return of(mockResponse).pipe(
      delay(3000), // Simular tiempo de procesamiento de IA (3 segundos)
      tap((response) => {
        const currentState = this.sessionSubject.value!;
        this.sessionSubject.next({
          ...currentState,
          isLoadingAIFeedback: false,
          aiFeedbackData: response
        });
        const signal = this.buildVocationalSignal(currentState, response);
        if (signal) {
          this.saveVocationalSignal(this.authService.getCurrentUser()?.id || 'guest', signal);
        }
      })
    );
  }

  /**
   * Resetea el estado completo de la sesión.
   */
  public resetSession(): void {
    this.sessionSubject.next(null);
  }

  /**
   * Lee del localStorage el arreglo con los identificadores (slugs) 
   * de los simuladores que el usuario ha completado.
   * @returns Array de strings con los career_slugs.
   */
  public getCompletedSimulators(): string[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public getStoredVocationalSignals(userId: string = this.authService.getCurrentUser()?.id || 'guest'): SimulatorVocationalSignalResult[] {
    try {
      const rawValue = localStorage.getItem(this.getVocationalSignalStorageKey(userId));
      return rawValue ? JSON.parse(rawValue) : [];
    } catch {
      return [];
    }
  }

  /**
   * Agrega un identificador al array de simuladores completados y lo persiste.
   * @param careerSlug Slug de la carrera completada.
   */
  private saveCompletedSimulator(careerSlug: string): void {
    const completed = this.getCompletedSimulators();
    if (!completed.includes(careerSlug)) {
      completed.push(careerSlug);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(completed));
      } catch (e) {
        console.error('No se pudo persistir el progreso en LocalStorage.', e);
      }
    }
  }

  private buildVocationalSignal(
    state: SimulatorSessionState,
    feedback: SimulatorFeedbackResponse
  ): SimulatorVocationalSignalResult | null {
    if (!state.currentCareerData) return null;

    const areaTotals = this.emptyAreaScores();
    const skillTotals = this.emptySkillScores();
    const competencyTotals = this.emptyCompetencyScores();
    const selectedConsequences: string[] = [];
    const strengthsShown: string[] = [];

    for (const decision of state.userDecisions) {
      if (!decision.selectedOptionId) continue;
      const step = state.currentCareerData.steps.find((item: any) => item.id === decision.stepId);
      const option = step?.options?.find((item: any) => item.id === decision.selectedOptionId);
      const impact = option?.vocationalImpact;
      if (!impact) continue;

      this.addWeights(areaTotals, impact.areaWeights || {});
      this.addWeights(skillTotals, impact.skillWeights || {});
      this.addWeights(competencyTotals, impact.competencyWeights || {});
      if (impact.consequence) selectedConsequences.push(impact.consequence);
      if (impact.feedback) strengthsShown.push(impact.feedback);
    }

    const areaAdjustments = this.normalizeScores(areaTotals);
    const skillAdjustments = this.normalizeScores(skillTotals);
    const competencyScores = this.normalizeScores(competencyTotals);
    const dominantArea = this.pickTopKey(areaAdjustments);
    const alignment = this.resolveProfileAlignment(dominantArea);
    const confidence = this.mapConfidence(feedback.confidence_level);

    return {
      id: `simulator-signal-${state.currentCareerData.careerId}-${Date.now()}`,
      careerId: state.currentCareerData.careerId,
      careerName: state.currentCareerData.careerName,
      role: state.currentCareerData.steps[0]?.metadata?.role || 'Participante de simulación',
      areaAdjustments,
      skillAdjustments,
      competencyScores,
      selectedConsequences,
      strengthsShown,
      profileAlignment: alignment,
      explanation: this.buildSimulatorExplanation(alignment, dominantArea, competencyScores),
      confidence,
      affinityScore: feedback.affinity_score,
      dataSource: 'local',
      generatedAtIso: new Date().toISOString()
    };
  }

  private saveVocationalSignal(userId: string, signal: SimulatorVocationalSignalResult): void {
    const storageKey = this.getVocationalSignalStorageKey(userId);
    const currentSignals = this.getStoredVocationalSignals(userId)
      .filter((item) => item.careerId !== signal.careerId);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...currentSignals, signal]));
    } catch (error) {
      console.error('No se pudo persistir la señal vocacional del simulador.', error);
    }
  }

  private getVocationalSignalStorageKey(userId: string): string {
    return `${this.VOCATIONAL_SIGNAL_STORAGE_PREFIX}_${userId}`;
  }

  private resolveProfileAlignment(dominantSimulatorArea: SteamAreaId | null): SimulatorVocationalSignalResult['profileAlignment'] {
    if (!dominantSimulatorArea) return 'insufficient';
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const localResult = this.readJson<LocalVocationalTestResult | null>(
      localStorage.getItem(`test_local_result_${userId}`),
      null
    );
    const dominantTestArea = localResult?.strengthProfile.dominantArea?.area || null;
    const secondaryTestArea = localResult?.strengthProfile.secondaryArea?.area || null;

    if (!dominantTestArea) return 'new_signal';
    if (dominantSimulatorArea === dominantTestArea || dominantSimulatorArea === secondaryTestArea) {
      return 'reinforces';
    }
    return 'partially_contradicts';
  }

  private buildSimulatorExplanation(
    alignment: SimulatorVocationalSignalResult['profileAlignment'],
    dominantSimulatorArea: SteamAreaId | null,
    competencyScores: Record<SimulatorCompetencyId, number>
  ): string {
    const areaLabel = dominantSimulatorArea ? this.getAreaLabel(dominantSimulatorArea) : 'STEAM';
    const topCompetencies = this.getTopCompetencyLabels(competencyScores);
    if (alignment === 'reinforces') {
      return `Tus decisiones en el simulador reforzaron tu afinidad con ${areaLabel}${topCompetencies ? ` y mostraron ${topCompetencies}` : ''}.`;
    }
    if (alignment === 'partially_contradicts') {
      const userId = this.authService.getCurrentUser()?.id || 'guest';
      const localResult = this.readJson<LocalVocationalTestResult | null>(
        localStorage.getItem(`test_local_result_${userId}`),
        null
      );
      const testArea = localResult?.strengthProfile.dominantArea?.label || 'otra área';
      return `Aunque tu test indicó ${testArea}, en el simulador mostraste mayor afinidad con ${areaLabel}${topCompetencies ? ` y ${topCompetencies}` : ''}. Esto no reemplaza tu resultado; lo complementa.`;
    }
    if (alignment === 'new_signal') {
      return `Este simulador agregó una señal nueva hacia ${areaLabel}. Conviene compararla con tu test y futuras calibraciones.`;
    }
    return 'El simulador no reunió suficientes señales para ajustar el perfil; intenta repetirlo con calma.';
  }

  private getTopCompetencyLabels(scores: Record<SimulatorCompetencyId, number>): string {
    return (Object.entries(scores) as [SimulatorCompetencyId, number][])
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([competency]) => this.getCompetencyLabel(competency))
      .join(' y ');
  }

  private addWeights<T extends string>(target: Record<T, number>, weights: Partial<Record<T, number>>): void {
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

  private pickTopKey<T extends string>(scores: Record<T, number>): T | null {
    const [topKey, topScore] = (Object.entries(scores) as [T, number][])
      .sort((a, b) => b[1] - a[1])[0] || [null, 0];
    return topScore > 0 ? topKey : null;
  }

  private emptyAreaScores(): Record<SteamAreaId, number> {
    return { ciencia: 0, tecnologia: 0, ingenieria: 0, arte: 0, matematicas: 0 };
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

  private emptyCompetencyScores(): Record<SimulatorCompetencyId, number> {
    return {
      pensamiento_logico: 0,
      creatividad: 0,
      comunicacion: 0,
      etica: 0,
      analisis: 0,
      toma_de_decisiones: 0,
      manejo_de_incertidumbre: 0
    };
  }

  private mapConfidence(confidence: SimulatorFeedbackResponse['confidence_level']): VocationalProfileConfidenceEs {
    if (confidence === 'high') return 'alta';
    if (confidence === 'medium') return 'media';
    return 'baja';
  }

  private getAreaLabel(area: SteamAreaId): string {
    const labels: Record<SteamAreaId, string> = {
      ciencia: 'Ciencia',
      tecnologia: 'Tecnología',
      ingenieria: 'Ingeniería',
      arte: 'Arte',
      matematicas: 'Matemáticas'
    };
    return labels[area];
  }

  private getCompetencyLabel(competency: SimulatorCompetencyId): string {
    const labels: Record<SimulatorCompetencyId, string> = {
      pensamiento_logico: 'pensamiento lógico',
      creatividad: 'creatividad',
      comunicacion: 'comunicación',
      etica: 'ética',
      analisis: 'análisis',
      toma_de_decisiones: 'toma de decisiones',
      manejo_de_incertidumbre: 'manejo de incertidumbre'
    };
    return labels[competency];
  }

  private readJson<T>(rawValue: string | null, fallback: T): T {
    if (!rawValue) return fallback;
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  }
}
