import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { SimulatorFeedbackResponse } from '../../../core/models/career-simulator.models';
import { AuthService } from '../../../core/services/auth.service';
import { VocationalProfile } from '../../../core/models/vocational-profile.models';

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
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  public slug = signal<string | null>(null);
  public status = signal<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  public feedback = signal<SimulatorFeedbackResponse | null>(null);

  public animatedScore = signal<number>(0);
  public discrepancyMessage = signal<string | null>(null);

  public session = toSignal(this.simulatorService.currentSession$);
  public careerData = computed(() => this.session()?.currentCareerData);

  public steamAreaClass = computed(() => this.careerData()?.areaClass ?? 'steam-tecnologia');
  public steamAreaName = computed(() => this.careerData()?.steamAreaName ?? 'STEAM');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.slug.set(params.get('slug'));
      this.fetchFeedback();
    });
  }

  public fetchFeedback() {
    const currentState = this.session();
    if (!currentState || !currentState.currentCareerData) {
      const s = this.slug();
      if (s) this.router.navigate(['/career-simulator', s]);
      return;
    }

    this.status.set('LOADING');

    this.simulatorService.computeAffinityResult().subscribe({
      next: (response) => {
        this.feedback.set(response);
        this.status.set('SUCCESS');
        try {
          const s = this.slug();
          const userId = this.authService.getCurrentUser()?.id;
          // userId al final: el barrido de limpieza en logout borra por sufijo `_<userId>`.
          if (s && userId) localStorage.setItem(`sim_score_${s}_${userId}`, response.affinity_score.toString());
        } catch { /* ignore */ }
        this.animateScore(response.affinity_score);
        this.checkVocationalDiscrepancy(response.affinity_score);
      },
      error: () => this.status.set('ERROR'),
    });
  }

  private animateScore(targetScore: number) {
    let startTimestamp: number | null = null;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.ngZone.run(() => this.animatedScore.set(Math.floor(easeOut * targetScore)));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    this.ngZone.runOutsideAngular(() => window.requestAnimationFrame(step));
  }

  /** Compara el score del simulador con el perfil vocacional guardado por el motor local. */
  private checkVocationalDiscrepancy(simulatorScore: number) {
    try {
      const userId = this.authService.getCurrentUser()?.id;
      if (!userId) return;
      const raw = localStorage.getItem(`test_profile_${userId}`);
      if (!raw) return;
      const profile: VocationalProfile = JSON.parse(raw);
      const areaKey = (this.careerData()?.steamAreaName || '')
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const profileScore: number | undefined = (profile.steamScores as any)[areaKey];
      if (typeof profileScore !== 'number') return;
      const diff = Math.abs(simulatorScore - profileScore);
      if (diff > 30) {
        const statusTerm = simulatorScore > profileScore ? 'emergente' : 'consolidado';
        this.discrepancyMessage.set(
          `Interesante: tu test vocacional indicó ${profileScore}% de afinidad con ${this.steamAreaName()}, pero tu comportamiento en este simulador muestra ${simulatorScore}%. Esto puede significar que tu interés por esta área es más ${statusTerm} de lo que pensabas.`
        );
      }
    } catch { /* silently ignore */ }
  }

  public goToProfile() { this.router.navigate(['/profile']); }
  public goToCatalog() { this.router.navigate(['/career-simulator']); }
  public retrySimulator() {
    this.simulatorService.resetSession();
    this.router.navigate(['/career-simulator', this.slug()]);
  }
  public goToHome() { this.router.navigate(['/dashboard']); }
}
