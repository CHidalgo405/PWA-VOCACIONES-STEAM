import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CareerSimulatorService } from '../../../core/services/career-simulator.service';
import { CAREER_SIMULATORS } from '../../../core/data/career-simulators.data';
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

  // Lista base estática extraída del data
  private allSimulators = signal<CareerSimulatorData[]>(CAREER_SIMULATORS);

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

    // NOTA TÉCNICA: Se lee el perfil STEAM de localStorage directamente en el ngOnInit 
    // en lugar de usar un InjectionToken por simplicidad dado que la PWA es cliente puro
    // sin SSR, y este perfil es estático durante esta vista.
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

  // Helper para inferir el área base desde el slug piloto
  public getSteamArea(careerId: string): SteamAreaFilter {
    if (careerId === 'epidemiologia') return 'Ciencia';
    if (careerId === 'ux-ui-design') return 'Artes';
    if (careerId === 'ciencia-datos') return 'Matemáticas';
    return 'Tecnología';
  }

  public getAreaClass(careerId: string): string {
    if (careerId === 'epidemiologia') return 'steam-ciencia';
    if (careerId === 'ux-ui-design') return 'steam-artes';
    if (careerId === 'ciencia-datos') return 'steam-matematicas';
    return 'steam-tecnologia';
  }

  public getAreaEmoji(careerId: string): string {
    if (careerId === 'epidemiologia') return '🔬';
    if (careerId === 'ux-ui-design') return '🎨';
    if (careerId === 'ciencia-datos') return '🧮';
    return '💻';
  }
}
