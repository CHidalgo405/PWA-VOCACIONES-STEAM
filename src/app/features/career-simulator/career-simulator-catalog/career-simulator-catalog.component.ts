import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { CareerSimulatorData } from '../../../core/models/career-simulator.models';
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
  private router = inject(Router);

  public filters: SteamAreaFilter[] = ['Todas', 'Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];
  public currentFilter = signal<SteamAreaFilter>('Todas');
  
  public completedSimulators = signal<string[]>([]);
  public userSteamProfile = signal<any>(null);
  public isLoadingSimulators = signal<boolean>(true);
  public simulatorLoadError = signal<string | null>(null);

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

    // 2. Ordenamiento inteligente si existe perfil STEAM
    const profile = this.userSteamProfile();
    if (profile && profile.desglose_steam) {
      sims.sort((a, b) => {
        // Normalizamos los nombres de área para compararlos con la DB
        const normalize = (area: string) => area.toLowerCase().replace('á', 'a').replace('í', 'i');
        const areaA = normalize(this.getSteamArea(a));
        const areaB = normalize(this.getSteamArea(b));
        
        const scoreA = profile.desglose_steam[areaA] || 0;
        const scoreB = profile.desglose_steam[areaB] || 0;
        
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

  ngOnInit() {
    this.completedSimulators.set(this.simulatorService.getCompletedSimulators());
    this.loadSimulators();

    try {
      const stored = localStorage.getItem('steam_profile');
      if (stored) {
        this.userSteamProfile.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error parseando steam_profile del localStorage', e);
    }
  }

  public loadSimulators() {
    this.isLoadingSimulators.set(true);
    this.simulatorLoadError.set(null);

    // El servicio mantiene fallback local si la API no responde.
    this.simulatorService.getSimulators().subscribe({
      next: (sims) => {
        if (sims && sims.length > 0) {
          this.allSimulators.set(sims);
        } else {
          console.warn('La API no devolvió simuladores activos.');
          this.allSimulators.set([]);
        }
        this.isLoadingSimulators.set(false);
      },
      error: (err) => {
        console.error('Failed to load simulators from API:', err);
        this.allSimulators.set([]);
        this.simulatorLoadError.set('No pudimos cargar simuladores. Si existe fallback local, intenta recargar en unos segundos.');
        this.isLoadingSimulators.set(false);
      }
    });
  }

  ngAfterViewInit() {
    // Animación de entrada inicial del header y filtros
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
    try {
      const val = localStorage.getItem(`sim_score_${careerId}`);
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
}
