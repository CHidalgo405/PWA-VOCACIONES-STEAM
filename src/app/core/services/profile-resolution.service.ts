import { Injectable, signal, computed } from '@angular/core';

export type MissionStatus = 'locked' | 'available' | 'completed';

export interface Mission {
  id: string;
  title: string;
  icon: string;
  status: MissionStatus;
  confidenceReward: number; // Porcentaje de confianza que otorga al completarse
}

export interface ConfidenceBadge {
  threshold: number; // Nivel requerido (ej. 30, 60, 90)
  iconName: string; // Nombre del icono de Lucide (ej. 'shield', 'award')
  label: string;
  achieved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileResolutionService {
  // 1. Indicador reactivo de Confianza IA (Inicia en el 33% base del Test Teórico)
  private _iaConfidenceLevel = signal<number>(33);
  public iaConfidenceLevel = this._iaConfidenceLevel.asReadonly();

  // 2. Estructura de Misiones
  private _missions = signal<Mission[]>([
    {
      id: 'mission1',
      title: 'Test Teórico',
      icon: 'check-circle-2',
      status: 'completed', // El usuario ya inicia con esta completada
      confidenceReward: 33
    },
    {
      id: 'mission2',
      title: 'Hobbies & Juegos',
      icon: 'gamepad-2',
      status: 'available', // Siguiente paso disponible
      confidenceReward: 20
    },
    {
      id: 'mission3',
      title: 'Lab. Errores',
      icon: 'alert-triangle',
      status: 'locked',
      confidenceReward: 25
    },
    {
      id: 'mission4',
      title: 'Simulador de Carrera',
      icon: 'flask-conical',
      status: 'locked',
      confidenceReward: 22
    }
  ]);
  public missions = this._missions.asReadonly();

  // 4. Array reactivo de Insignias (Badges) basado en la confianza actual
  public confidenceBadges = computed<ConfidenceBadge[]>(() => {
    const currentConfidence = this._iaConfidenceLevel();
    
    return [
      {
        threshold: 30,
        iconName: 'user', // Lucide icon
        label: 'Perfil Base',
        achieved: currentConfidence >= 30
      },
      {
        threshold: 50,
        iconName: 'crosshair',
        label: 'Perfil Calibrado',
        achieved: currentConfidence >= 50
      },
      {
        threshold: 75,
        iconName: 'shield-check',
        label: 'Perfil Validado',
        achieved: currentConfidence >= 75
      },
      {
        threshold: 95,
        iconName: 'award',
        label: 'Resolución Máxima',
        achieved: currentConfidence >= 95
      }
    ];
  });

  constructor() {
    this.loadStateFromStorage();
  }

  // 3. Método para completar una misión, incrementar IA y desbloquear la siguiente
  public completeMission(missionId: string): void {
    const currentMissions = this._missions();
    const missionIndex = currentMissions.findIndex(m => m.id === missionId);

    // Verificamos que la misión exista y no esté ya completada
    if (missionIndex !== -1 && currentMissions[missionIndex].status !== 'completed') {
      
      // Hacemos una copia para mantener la inmutabilidad de Signals
      const updatedMissions = [...currentMissions];
      
      // Marcamos la misión actual como completada
      updatedMissions[missionIndex] = {
        ...updatedMissions[missionIndex],
        status: 'completed'
      };

      // Incrementamos el nivel de confianza (Max 100%)
      this._iaConfidenceLevel.update(current => 
        Math.min(current + updatedMissions[missionIndex].confidenceReward, 100)
      );

      // Desbloqueamos la SIGUIENTE misión en la lista (si existe)
      if (missionIndex + 1 < updatedMissions.length) {
        updatedMissions[missionIndex + 1] = {
          ...updatedMissions[missionIndex + 1],
          status: 'available'
        };
      }

      // Actualizamos la señal
      this._missions.set(updatedMissions);
      
      // Persistimos el estado
      this.saveStateToStorage();
    }
  }

  // Métodos auxiliares para persistencia (localStorage)
  private saveStateToStorage(): void {
    localStorage.setItem('profileResolutionState', JSON.stringify({
      confidence: this._iaConfidenceLevel(),
      missions: this._missions()
    }));
  }

  public loadStateFromStorage(): void {
    const stored = localStorage.getItem('profileResolutionState');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.confidence) this._iaConfidenceLevel.set(parsed.confidence);
        if (parsed.missions) this._missions.set(parsed.missions);
      } catch (e) {
        console.error('Error al cargar el estado de resolución de perfil', e);
      }
    }
  }
}
