import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { SimulatorFeedbackResponse } from '../../../core/models/career-simulator.models';

@Component({
  selector: 'app-career-simulator-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './career-simulator-result.component.html',
  styleUrls: ['./career-simulator-result.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerSimulatorResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private simulatorService = inject(CareerSimulatorService);
  private ngZone = inject(NgZone);

  public slug = signal<string | null>(null);
  public status = signal<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  public feedback = signal<SimulatorFeedbackResponse | null>(null);
  
  public animatedScore = signal<number>(0);
  public discrepancyMessage = signal<string | null>(null);

  // Leer estado sincrónico actual
  public session = toSignal(this.simulatorService.currentSession$);
  
  public careerData = computed(() => this.session()?.currentCareerData);

  // Clases CSS dinámicas para pintar el entorno según el área STEAM principal
  public steamAreaClass = computed(() => {
    return this.careerData()?.areaClass ?? 'steam-tecnologia';
  });

  public steamAreaName = computed(() => {
    return this.careerData()?.steamAreaName ?? 'STEAM';
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.slug.set(params.get('slug'));
      this.fetchFeedback();
    });
  }

  public fetchFeedback() {
    const currentState = this.session();
    if (!currentState || !currentState.currentCareerData) {
      // Si se perdió el estado en memoria, obligar a reiniciar el flujo
      const s = this.slug();
      if (s) {
        this.router.navigate(['/career-simulator', s]);
      }
      return;
    }

    this.status.set('LOADING');
    
    // El servicio lanza internamente la llamada al endpoint Serverless (max 8s abort signal)
    this.simulatorService.submitForAIFeedback().subscribe({
      next: (response) => {
        this.feedback.set(response);
        this.status.set('SUCCESS');
        
        // Guardar score para el catálogo
        try {
          const s = this.slug();
          if (s) localStorage.setItem(`sim_score_${s}`, response.affinity_score.toString());
        } catch(e) {}

        this.animateScore(response.affinity_score);
        this.checkVocationalDiscrepancy(response.affinity_score);
      },
      error: () => {
        this.status.set('ERROR');
      }
    });
  }

  /**
   * Anima el score grande circular usando requestAnimationFrame para alto rendimiento.
   */
  private animateScore(targetScore: number) {
    let startTimestamp: number | null = null;
    const duration = 1500;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(easeOut * targetScore);
      
      // Updateamos dentro del NgZone para que el template se entere, 
      // aunque con Signals suele notificar directo.
      this.ngZone.run(() => {
        this.animatedScore.set(currentVal);
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      window.requestAnimationFrame(step);
    });
  }

  /**
   * Integra el resultado del simulador con el test vocacional base 
   * guardado en localStorage ('steam_profile').
   */
  private checkVocationalDiscrepancy(simulatorScore: number) {
    try {
      const storedProfile = localStorage.getItem('steam_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        
        let areaKey = 'tecnologia';
        const areaName = this.careerData()?.steamAreaName;
        if (areaName) {
          areaKey = areaName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        }

        if (profile.desglose_steam && typeof profile.desglose_steam[areaKey] === 'number') {
          const profileScore = profile.desglose_steam[areaKey];
          const diff = Math.abs(simulatorScore - profileScore);
          
          if (diff > 30) {
            const statusTerm = simulatorScore > profileScore ? 'emergente' : 'consolidado';

            this.discrepancyMessage.set(
              `Interesante: tu test vocacional indicó ${profileScore}% de afinidad con ${this.steamAreaName()}, pero tu comportamiento en este simulador muestra ${simulatorScore}%. Esto puede significar que tu interés por esta área es más ${statusTerm} de lo que pensabas.`
            );
          }
        }
      }
    } catch (e) {
      console.error('Error parseando steam_profile del localStorage', e);
    }
  }

  public goToProfile() {
    this.router.navigate(['/profile']);
  }

  public goToCatalog() {
    this.router.navigate(['/career-simulator']);
  }

  public retrySimulator() {
    this.simulatorService.resetSession();
    this.router.navigate(['/career-simulator', this.slug()]);
  }

  public goToHome() {
    this.router.navigate(['/dashboard']);
  }
}
