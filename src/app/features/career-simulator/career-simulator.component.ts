import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy, 
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { CareerSimulatorService } from '../../core/services/career-simulator.service';
import { SimulatorStep } from '../../core/models/career-simulator.models';

import { StepDataAnalysisComponent } from './steps/step-data-analysis/step-data-analysis.component';
import { StepTradeoffDecisionComponent } from './steps/step-tradeoff-decision/step-tradeoff-decision.component';
import { StepContextComponent } from './steps/step-context/step-context.component';
import { StepSurpriseRevealComponent } from './steps/step-surprise-reveal/step-surprise-reveal.component';
import { StepAIFeedbackComponent } from './steps/step-ai-feedback/step-ai-feedback.component';
import { StepEmotionalReflectionComponent } from './steps/step-emotional-reflection/step-emotional-reflection.component';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-career-simulator',
  standalone: true,
  imports: [
    CommonModule,
    StepContextComponent,
    StepDataAnalysisComponent,
    StepTradeoffDecisionComponent,
    StepSurpriseRevealComponent,
    StepAIFeedbackComponent,
    StepEmotionalReflectionComponent,
    LucideIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './career-simulator.component.html',
  styleUrls: ['./career-simulator.component.scss']
})
export class CareerSimulatorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private simulatorService = inject(CareerSimulatorService);

  // Estado reactivo basado en el servicio
  public session = toSignal(this.simulatorService.currentSession$);
  
  // Timer gestionado con signals localmente en el componente
  public timerSeconds = signal<number>(0);
  private timerInterval: any;

  // Signal para ocultar el banner localmente sin afectar el estado interno del servicio
  public userDismissedBanner = signal<boolean>(false);

  // Computed properties extraídas del estado de la sesión
  public currentStepType = computed(() => {
    const s = this.session();
    if (!s || !s.currentCareerData || s.isCompleted) return null;
    return s.currentCareerData.steps[s.currentStepIndex].type;
  });

  public currentStepIndex = computed(() => this.session()?.currentStepIndex ?? 0);
  public careerData = computed(() => this.session()?.currentCareerData);
  public isCompleted = computed(() => this.session()?.isCompleted ?? false);
  
  public currentStepData = computed<SimulatorStep | null>(() => {
    const data = this.careerData();
    if (!data) return null;
    return data.steps[this.currentStepIndex()] ?? null;
  });
  
  public showBiasBanner = computed(() => {
    const s = this.session();
    return (s?.biasFlags.linear_pattern_detected ?? false) && !this.userDismissedBanner();
  });

  // Clases CSS dinámicas para pintar el entorno según el área STEAM principal
  public steamAreaClass = computed(() => {
    return this.careerData()?.areaClass ?? 'steam-tecnologia';
  });

  // Nombre formateado para el Badge
  public steamAreaName = computed(() => {
    return this.careerData()?.steamAreaName ?? 'STEAM';
  });

  constructor() {
    // Efecto reactivo: cuando el estado cambia a completado, navegar al resultado
    effect(() => {
      if (this.isCompleted()) {
        const slug = this.careerData()?.careerId;
        if (slug) {
          this.router.navigate(['/career-simulator', slug, 'result']);
        }
      }
    });
  }

  ngOnInit() {
    // Leer el parámetro slug e inicializar sesión y timer
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.simulatorService.startSession(slug);
        this.startTimer();
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
    // No reseteamos la sesión aquí porque la página de resultados la necesita
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds.set(this.simulatorService.recordStepTime());
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  public dismissBiasBanner() {
    this.userDismissedBanner.set(true);
  }

  public onStepCompleted(decision: any) {
    this.simulatorService.advanceStep(decision);
  }

  public closeSimulator() {
    this.router.navigate(['/career-simulator']);
  }
}
