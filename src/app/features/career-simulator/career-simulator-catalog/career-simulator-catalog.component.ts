import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { CAREER_SIMULATORS, CAREER_SIMULATOR_MAP } from '../../../core/data/career-simulators.data';
import { CareerSimulatorData } from '../../../core/models/career-simulator.models';

type SteamAreaFilter = 'Todas' | 'Ciencia' | 'Tecnología' | 'Ingeniería' | 'Artes' | 'Matemáticas';

@Component({
  selector: 'app-career-simulator-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './career-simulator-catalog.component.html',
  styleUrls: ['./career-simulator-catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CareerSimulatorCatalogComponent implements OnInit {
  private simulatorService = inject(CareerSimulatorService);
  private router = inject(Router);

  public filters: SteamAreaFilter[] = ['Todas', 'Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];
  public currentFilter = signal<SteamAreaFilter>('Todas');
  
  public completedSimulators = signal<string[]>([]);
  public userSteamProfile = signal<any>(null);

  // Lista base dinámica
  private allSimulators = signal<CareerSimulatorData[]>([]);

  // Computed state para las cards filtradas y ordenadas
  public filteredSimulators = computed(() => {
    let sims = [...this.allSimulators()];

    // 1. Aplicar Filtro Visual
    const filter = this.currentFilter();
    if (filter !== 'Todas') {
      sims = sims.filter(sim => this.getSteamArea(sim.careerId) === filter);
    }

    // 2. Ordenamiento inteligente si existe perfil STEAM
    const profile = this.userSteamProfile();
    if (profile && profile.desglose_steam) {
      sims.sort((a, b) => {
        // Normalizamos los nombres de área para compararlos con la DB
        const normalize = (area: string) => area.toLowerCase().replace('á', 'a').replace('í', 'i');
        const areaA = normalize(this.getSteamArea(a.careerId));
        const areaB = normalize(this.getSteamArea(b.careerId));
        
        const scoreA = profile.desglose_steam[areaA] || 0;
        const scoreB = profile.desglose_steam[areaB] || 0;
        
        // Orden descendente por afinidad del perfil
        return scoreB - scoreA;
      });
    }

    return sims;
  });

  ngOnInit() {
    this.completedSimulators.set(this.simulatorService.getCompletedSimulators());

    // Carga de simuladores desde la API con fallback estático
    this.simulatorService.getSimulators().subscribe({
      next: (sims) => {
        if (sims && sims.length > 0) {
          this.allSimulators.set(sims);
        } else {
          console.log('No simulators in DB, falling back to static list.');
          this.allSimulators.set(CAREER_SIMULATORS);
        }
      },
      error: (err) => {
        console.error('Failed to load simulators from API, falling back to static list:', err);
        this.allSimulators.set(CAREER_SIMULATORS);
      }
    });

    try {
      const stored = localStorage.getItem('steam_profile');
      if (stored) {
        this.userSteamProfile.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error parseando steam_profile del localStorage', e);
    }
  }

  public setFilter(filter: SteamAreaFilter) {
    this.currentFilter.set(filter);
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

  // Helper para obtener el área desde los metadatos de la carrera o lista dinámica
  public getSteamArea(careerId: string): SteamAreaFilter {
    const sim = CAREER_SIMULATOR_MAP.get(careerId) || this.allSimulators().find(s => s.careerId === careerId);
    return (sim?.steamAreaName ?? 'Tecnología') as SteamAreaFilter;
  }

  public getAreaClass(careerId: string): string {
    const sim = CAREER_SIMULATOR_MAP.get(careerId) || this.allSimulators().find(s => s.careerId === careerId);
    if (!sim) return 'steam-tecnologia';
    // El SCSS del catálogo espera 'steam-artes' con S
    if (sim.areaClass === 'steam-arte') return 'steam-artes';
    return sim.areaClass;
  }

  public getAreaEmoji(careerId: string): string {
    const sim = CAREER_SIMULATOR_MAP.get(careerId) || this.allSimulators().find(s => s.careerId === careerId);
    return sim?.areaEmoji ?? '💻';
  }
}
