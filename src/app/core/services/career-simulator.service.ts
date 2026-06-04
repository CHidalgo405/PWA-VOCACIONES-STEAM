import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, delay } from 'rxjs/operators';
import { 
  SimulatorSessionState, 
  UserStepDecision,
  CareerSimulatorData
} from '../models/career-simulator.models';
import { environment } from '../../../environments/environment';
import { 
  SimulatorFeedbackRequest, 
  SimulatorFeedbackResponse, 
  SimulatorFeedbackDecision 
} from '../models/career-simulator.models';

@Injectable({
  providedIn: 'root'
})
export class CareerSimulatorService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

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
        steps: sim.steps
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
}
