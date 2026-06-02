export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string; // Identifier for Lucide Icons (e.g., 'award', 'zap', 'brain')
  unlockedAt?: Date;
}

export type ModuleStatus = 'locked' | 'available' | 'completed';

export interface CalibrationModule {
  id: string; // Identifier of the mission (e.g., 'mission1', 'mission2', 'mission3')
  name: string;
  status: ModuleStatus;
  resolutionBonus: number; // Percentage it adds to resolution when completed
}

export interface UserProfileState {
  userId: string;
  hasTakenBaseTest: boolean;
  profileResolution: number; // Percentage from 0 to 100
  badges: Badge[];
  calibrationModules: CalibrationModule[];
}
