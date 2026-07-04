import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { VocationalProfileService } from '../../../core/services/vocational-profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { CareerSimulatorData } from '../../../core/models/career-simulator.models';
import { SteamVector } from '../../../core/models/vocational-profile.models';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import gsap from 'gsap';

type SteamAreaFilter = 'Todas' | 'Ciencia' | 'Tecnología' | 'Ingeniería' | 'Artes' | 'Matemáticas';

@Component({
  selector: 'app-career-simulator-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './career-simulator-catalog.component.html',
  styleUrls: ['./career-simulator-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerSimulatorCatalogComponent implements OnInit, AfterViewInit {
  private simulatorService = inject(CareerSimulatorService);
  private profileService = inject(VocationalProfileService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public viewState = signal<'intro' | 'catalog'>('intro');
  public filters: SteamAreaFilter[] = ['Todas', 'Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];
  public currentFilter = signal<SteamAreaFilter>('Todas');

  public completedSimulators = signal<string[]>([]);
  /** Vector STEAM del perfil vocacional (para ordenar por afinidad). */
  public userSteamScores = signal<SteamVector | null>(null);

  // Lista base dinámica
  public allSimulators = signal<CareerSimulatorData[]>([]);

  // Computed state para las cards filtradas y ordenadas
  public filteredSimulators = computed(() => {
    let sims = [...this.allSimulators()];

    // 1. Aplicar Filtro Visual
    const filter = this.currentFilter();
    if (filter !== 'Todas') {
      sims = sims.filter(sim => this.getSteamArea(sim) === filter);
    }

    // 2. Ordenamiento inteligente por afinidad del perfil vocacional
    const scores = this.userSteamScores();
    if (scores) {
      const AXIS_BY_AREA: Record<string, keyof SteamVector> = {
        'Ciencia': 'ciencia',
        'Tecnología': 'tecnologia',
        'Ingeniería': 'ingenieria',
        'Artes': 'artes',
        'Matemáticas': 'matematicas',
      };
      sims.sort((a, b) => {
        const scoreA = scores[AXIS_BY_AREA[this.getSteamArea(a)]] ?? 0;
        const scoreB = scores[AXIS_BY_AREA[this.getSteamArea(b)]] ?? 0;
        // Orden descendente por afinidad del perfil
        return scoreB - scoreA;
      });
    }

    return sims;
  });

  constructor() {
    // Reaccionar a cambios en los simuladores filtrados para re-animar
    effect(() => {
      const sims = this.filteredSimulators();
      if (sims.length > 0) {
        // Usar setTimeout para asegurar que el DOM se haya actualizado
        setTimeout(() => this.animateCardsEntry(), 50);
      }
    });
  }

  /** Scores por carrera según la API (prioridad sobre localStorage). */
  private apiScores = new Map<string, number>();

  ngOnInit() {
    this.completedSimulators.set(this.simulatorService.getCompletedSimulators());

    // Fuente de verdad cross-device: resultados guardados en la API.
    this.simulatorService.getMyResults().subscribe(results => {
      if (!results.length) return;
      this.apiScores = new Map(results.map(r => [r.careerSlug, r.affinity]));
      const merged = new Set([
        ...this.simulatorService.getCompletedSimulators(),
        ...results.map(r => r.careerSlug),
      ]);
      this.completedSimulators.set([...merged]);
    });

    // Carga exclusiva desde la API (JSONB)
    this.simulatorService.getSimulators().subscribe({
      next: (sims) => {
        if (sims && sims.length > 0) {
          this.allSimulators.set(sims);
        } else {
          console.warn('La API no devolvió simuladores activos.');
        }
      },
      error: (err) => {
        console.error('Failed to load simulators from API:', err);
      }
    });

    // Perfil vocacional para ordenar el catálogo por afinidad
    // (caché instantánea; si no existe, se pide a la API).
    const cached = this.profileService.getCachedProfile();
    if (cached) {
      this.userSteamScores.set(cached.steamScores);
    } else {
      this.profileService.fetchLatestProfile().subscribe(profile => {
        if (profile) this.userSteamScores.set(profile.steamScores);
      });
    }
  }

  ngAfterViewInit() {
    if (this.viewState() === 'intro') {
      gsap.from('.intro-container > *', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out'
      });
    } else {
      this.playCatalogEntryAnimations();
    }
  }

  private playCatalogEntryAnimations() {
    gsap.from('.catalog-header h1, .catalog-header p', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    });

    gsap.from('.filters-container', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      delay: 0.3,
      ease: 'power3.out'
    });
  }

  public startCatalog() {
    this.viewState.set('catalog');
    // Pequeño retardo para que Angular renderice el contenedor antes de animarlo
    setTimeout(() => {
      this.playCatalogEntryAnimations();
      this.animateCardsEntry();
    }, 50);
  }

  private animateCardsEntry() {
    gsap.killTweensOf('.sim-card'); // Cancelar animaciones en curso si cambia rápido el filtro
    gsap.fromTo('.sim-card', 
      { y: 40, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.2)',
        clearProps: 'all' // Limpiar para que el hover por CSS funcione bien
      }
    );
  }

  public setFilter(filter: SteamAreaFilter) {
    // Animación de salida rápida antes de cambiar el filtro
    const cards = document.querySelectorAll('.sim-card');
    if (cards.length > 0) {
      gsap.to(cards, {
        y: 20,
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        stagger: 0.02,
        ease: 'power2.in',
        onComplete: () => {
          // Cambiar filtro una vez que desaparecen
          this.currentFilter.set(filter);
        }
      });
    } else {
      this.currentFilter.set(filter);
    }
  }

  public goToSimulator(careerId: string) {
    this.router.navigate(['/career-simulator', careerId]);
  }

  public getAffinityScore(careerId: string): number | null {
    const fromApi = this.apiScores.get(careerId);
    if (typeof fromApi === 'number') return fromApi;
    try {
      const userId = this.authService.getCurrentUser()?.id;
      if (!userId) return null;
      const val = localStorage.getItem(`sim_score_${careerId}_${userId}`);
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  public getSteamArea(sim: CareerSimulatorData): string {
    const area = (sim.steamAreaName || 'Tecnología').toLowerCase();
    if (area.includes('ciencia')) return 'Ciencia';
    if (area.includes('tecnologia') || area.includes('tecnología')) return 'Tecnología';
    if (area.includes('ingenieria') || area.includes('ingeniería')) return 'Ingeniería';
    if (area.includes('arte')) return 'Artes';
    if (area.includes('matematica') || area.includes('matemática')) return 'Matemáticas';
    return 'Tecnología';
  }

  public getAreaIcon(area: SteamAreaFilter | string): string {
    switch (area) {
      case 'Ciencia': return 'microscope';
      case 'Tecnología': return 'code-2';
      case 'Ingeniería': return 'settings';
      case 'Artes': return 'palette';
      case 'Matemáticas': return 'sigma';
      default: return '';
    }
  }

  public getSteamLetter(area: string): string {
    switch (area) {
      case 'Ciencia': return 'S';
      case 'Tecnología': return 'T';
      case 'Ingeniería': return 'E';
      case 'Artes': return 'A';
      case 'Matemáticas': return 'M';
      default: return 'S';
    }
  }
}
