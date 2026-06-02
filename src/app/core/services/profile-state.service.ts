import { Injectable, signal, computed, effect } from '@angular/core';
import { UserProfileState, Badge, CalibrationModule } from '../models/profile.models';

const INITIAL_MODULES: CalibrationModule[] = [
  { id: 'mission1', name: 'Test Teórico', status: 'locked', resolutionBonus: 40 },
  { id: 'mission2', name: 'Hobbies & Videojuegos', status: 'locked', resolutionBonus: 30 },
  { id: 'mission3', name: 'Laboratorio de Errores', status: 'locked', resolutionBonus: 30 }
];

const INITIAL_STATE: UserProfileState = {
  userId: 'user-1', // Default or fetch from auth
  hasTakenBaseTest: false,
  profileResolution: 0,
  badges: [],
  calibrationModules: [...INITIAL_MODULES]
};

@Injectable({
  providedIn: 'root'
})
export class ProfileStateService {
  // Main reactive state
  private state = signal<UserProfileState>(this.loadStateFromStorage());

  // Computed properties for easy access
  readonly profileResolution = computed(() => this.state().profileResolution);
  readonly badges = computed(() => this.state().badges);
  readonly calibrationModules = computed(() => this.state().calibrationModules);
  readonly hasTakenBaseTest = computed(() => this.state().hasTakenBaseTest);

  constructor() {
    // Persist state changes automatically
    effect(() => {
      localStorage.setItem('profileState', JSON.stringify(this.state()));
    });
  }

  private loadStateFromStorage(): UserProfileState {
    const saved = localStorage.getItem('profileState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing profile state', e);
      }
    }
    return INITIAL_STATE;
  }

  // Action: Complete Base Test (Mission 1)
  completeBaseTest() {
    this.state.update(current => {
      // Prevent completing again if already done
      if (current.hasTakenBaseTest) return current;

      const updatedModules = current.calibrationModules.map(mod => {
        if (mod.id === 'mission1') return { ...mod, status: 'completed' as const };
        if (mod.id === 'mission2' || mod.id === 'mission3') return { ...mod, status: 'available' as const };
        return mod;
      });

      const mission1 = current.calibrationModules.find(m => m.id === 'mission1');
      const bonus = mission1 ? mission1.resolutionBonus : 40;
      
      const newResolution = Math.min(100, current.profileResolution + bonus);

      // Check if we need to award a badge
      let newBadges = [...current.badges];
      if (!newBadges.find(b => b.id === 'base_profile')) {
        newBadges.push({
          id: 'base_profile',
          name: 'Perfil Base',
          description: 'Has descubierto tus talentos STEAM principales.',
          iconName: 'fingerprint',
          unlockedAt: new Date()
        });
      }

      return {
        ...current,
        hasTakenBaseTest: true,
        profileResolution: newResolution,
        calibrationModules: updatedModules,
        badges: newBadges
      };
    });
  }

  // Action: Complete extra calibration modules
  completeCalibrationModule(moduleId: string) {
    this.state.update(current => {
      const moduleToComplete = current.calibrationModules.find(m => m.id === moduleId);
      
      // If module doesn't exist or is already completed, return current state
      if (!moduleToComplete || moduleToComplete.status === 'completed') {
        return current;
      }

      const updatedModules = current.calibrationModules.map(mod => {
        if (mod.id === moduleId) {
          return { ...mod, status: 'completed' as const };
        }
        return mod;
      });

      const newResolution = Math.min(100, current.profileResolution + moduleToComplete.resolutionBonus);
      
      // Assign badges based on module or new resolution
      let newBadges = [...current.badges];
      
      if (moduleId === 'mission2' && !newBadges.find(b => b.id === 'hobby_master')) {
        newBadges.push({
          id: 'hobby_master',
          name: 'Conexión Real',
          description: 'Conectaste tus pasatiempos con el mundo STEAM.',
          iconName: 'gamepad-2',
          unlockedAt: new Date()
        });
      }
      
      if (moduleId === 'mission3' && !newBadges.find(b => b.id === 'error_solver')) {
        newBadges.push({
          id: 'error_solver',
          name: 'Solucionador Lógico',
          description: 'Demostraste capacidad analítica ante fallos.',
          iconName: 'wrench',
          unlockedAt: new Date()
        });
      }

      if (newResolution === 100 && !newBadges.find(b => b.id === 'full_resolution')) {
        newBadges.push({
          id: 'full_resolution',
          name: 'Visión 4K',
          description: 'Perfil calibrado al máximo. Tienes recomendaciones ultra precisas.',
          iconName: 'sparkles',
          unlockedAt: new Date()
        });
      }

      return {
        ...current,
        profileResolution: newResolution,
        calibrationModules: updatedModules,
        badges: newBadges
      };
    });
  }

  // Reset state for testing
  resetState() {
    this.state.set(INITIAL_STATE);
  }
}
