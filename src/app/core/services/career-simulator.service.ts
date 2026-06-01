import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { 
  SimulatorSessionState, 
  UserStepDecision
} from '../models/career-simulator.models';
import { CAREER_SIMULATOR_MAP } from '../data/career-simulators.data';
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

  /**
   * Inicializa una nueva sesión de simulación buscando la carrera por su slug.
   * @param careerSlug El ID o slug de la carrera a simular.
   */
  public startSession(careerSlug: string): void {
    const careerData = CAREER_SIMULATOR_MAP.get(careerSlug);
    if (!careerData) {
      console.error(`No se encontró la carrera con slug: ${careerSlug}`);
      return;
    }

    this.sessionSubject.next({
      ...this.initialState,
      currentCareerData: careerData,
      currentStepStartTime: Date.now(),
      biasFlags: { too_fast: false, linear_pattern_detected: false }
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
      return stepData.options.findIndex(opt => opt.id === decision.selectedOptionId);
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
   * Toma el estado actual de la sesión, construye el payload (SimulatorFeedbackRequest)
   * y hace el POST a la Serverless API Route para obtener el feedback de la IA.
   * @returns Observable con la respuesta (SimulatorFeedbackResponse).
   */
  public submitForAIFeedback(): Observable<SimulatorFeedbackResponse> {
    const state = this.sessionSubject.value;
    if (!state || !state.currentCareerData) {
      return throwError(() => new Error('No hay una sesión activa de simulación.'));
    }

    const totalTimeMs = state.userDecisions.reduce((acc, curr) => acc + (curr.timeSpentMs || 0), 0);
    const avgResponseTimeSeconds = (state.userDecisions.length > 0) 
      ? Math.round((totalTimeMs / 1000) / state.userDecisions.length) 
      : 0;

    // Convertir las decisiones locales al contrato de la API
    const mappedDecisions: SimulatorFeedbackDecision[] = state.userDecisions.map((decision, idx) => {
      let optionIndex: number | undefined = undefined;
      let decisionText = decision.reasoning || '';
      
      const stepDef = state.currentCareerData!.steps.find(s => s.id === decision.stepId);
      if (stepDef && stepDef.options && decision.selectedOptionId) {
        optionIndex = stepDef.options.findIndex(opt => opt.id === decision.selectedOptionId);
        if (optionIndex !== -1) {
          const optText = stepDef.options[optionIndex].text;
          decisionText = decisionText ? `${optText} - ${decisionText}` : optText;
        }
      }

      return {
        step: idx + 1,
        step_type: decision.stepType,
        decision_text: decisionText || 'Lectura o interacción básica completada',
        time_spent_seconds: Math.round((decision.timeSpentMs || 0) / 1000),
        option_chosen_index: optionIndex !== -1 ? optionIndex : undefined
      };
    });

    // Mapeo dinámico de área STEAM para cumplir con el contrato de la API
    const steamArea = state.currentCareerData.steamAreaName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const payload: SimulatorFeedbackRequest = {
      career_slug: state.currentCareerData.careerId,
      career_name: state.currentCareerData.careerName,
      steam_area: steamArea,
      user_decisions: mappedDecisions,
      avg_response_time_seconds: avgResponseTimeSeconds,
      bias_flags: state.biasFlags
    };

    // Actualizar estado para reflejar la carga
    this.sessionSubject.next({ ...state, isLoadingAIFeedback: true });

    return this.http.post<SimulatorFeedbackResponse>('/api/ia/career-simulator-feedback', payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(response => {
          // Guardar el feedback en el estado temporalmente
          const currentState = this.sessionSubject.value!;
          this.sessionSubject.next({
            ...currentState,
            isLoadingAIFeedback: false,
            aiFeedbackData: response
          });
        }),
        catchError(() => {
          // Revertir el estado de carga y emitir error tipado
          const currentState = this.sessionSubject.value!;
          this.sessionSubject.next({ ...currentState, isLoadingAIFeedback: false });
          return throwError(() => new Error('Ocurrió un error al contactar con la IA para obtener tu feedback.'));
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
