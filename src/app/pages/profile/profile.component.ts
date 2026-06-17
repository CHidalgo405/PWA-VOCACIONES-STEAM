import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { VocationTestService } from '../../core/services/test.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { STEAM_AREA_DEFINITIONS } from '../../core/data/vocational-steam.mock';
import type { SimulatorVocationalSignalResult } from '../../core/models/career-simulator.models';
import type {
  CalibrationModuleSignalResult,
  LocalVocationalTestResult,
  ProgressiveVocationalProfileLevel,
  SteamAreaId,
  VocationalProfileConfidenceEs
} from '../../core/models/vocational-steam.models';

interface ProfileAreaScore {
  id: SteamAreaId;
  label: string;
  score: number;
  color: string;
}

interface ProfileCareerSummary {
  name: string;
  compatibility: number | null;
  source: 'api' | 'local' | 'mock';
}

interface SavedUniversitySummary {
  name: string;
  career: string;
  location: string;
  source: 'api' | 'local' | 'mock';
}

interface NextProfileStep {
  title: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent, HeaderComponent, BaseChartDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private themeSub!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private themeService: ThemeService,
    private testService: VocationTestService
  ) { }

  user = {
    name: 'Cargando...',
    email: '',
    role: '',
    level: 5,
    avatar: 'https://ui-avatars.com/api/?name=C&background=07B1C9&color=fff&size=128'
  };
  isProfileLoading = true;
  profileLoadError = '';
  profileHistoryWarning = '';
  savedUniversitiesWarning = '';
  
  testCount: number = 0;
  profileLevel: ProgressiveVocationalProfileLevel = 'perfil_inicial';
  profileLevelLabel = 'Inicial';
  profileLevelDescription = 'Completa el test para empezar a construir tu camino STEAM.';
  profileConfidence: VocationalProfileConfidenceEs = 'baja';
  dominantArea = 'Sin resultado';
  secondaryArea = 'Por descubrir';
  profileCombination = 'Perfil STEAM en construcción';
  steamAreaScores: ProfileAreaScore[] = STEAM_AREA_DEFINITIONS.map(area => ({
    id: area.id,
    label: area.label,
    score: 0,
    color: area.color
  }));
  hasRadarData = false;
  recommendedCareers: ProfileCareerSummary[] = [];
  savedUniversities: SavedUniversitySummary[] = [];
  nextStep: NextProfileStep = {
    title: 'Completar test vocacional',
    description: 'El test inicial desbloquea tu ADN STEAM y primeras recomendaciones.',
    route: '/evaluations',
    icon: 'clipboard-check'
  };
  radarChartData: ChartConfiguration<'radar'>['data'] = {
    labels: STEAM_AREA_DEFINITIONS.map(area => area.label),
    datasets: [
      {
        label: 'ADN STEAM',
        data: [0, 0, 0, 0, 0],
        borderColor: '#07B1C9',
        backgroundColor: 'rgba(7, 177, 201, 0.16)',
        pointBackgroundColor: STEAM_AREA_DEFINITIONS.map(area => area.color),
        pointBorderColor: '#FFFFFF',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4
      }
    ]
  };
  radarChartOptions: ChartOptions<'radar'> = this.createRadarChartOptions();

  private latestTestScores: Record<string, number> = {};
  private latestDominantTraits = '';

  badges = [
    { id: 'first-step', name: 'Primer Paso', icon: 'star', unlocked: false, description: 'Completaste tu primer test vocacional STEAM.' },
    { id: 'steam-explorer', name: 'Explorador STEAM', icon: 'compass', unlocked: false, description: 'Nivel 5 o superior alcanzado en tu cuenta.' },
    { id: 'science-fan', name: 'Afinidad Científica', icon: 'flask-conical', unlocked: false, description: 'Completa al menos 2 tests vocacionales.' },
    { id: 'tech-innovator', name: 'Innovador Digital', icon: 'cpu', unlocked: false, description: 'Completa al menos 4 tests vocacionales.' }
  ];

  updateBadges() {
    this.badges.forEach(badge => {
      if (badge.id === 'first-step') {
        badge.unlocked = this.testCount > 0;
      }
      if (badge.id === 'steam-explorer') {
        badge.unlocked = this.user.level >= 5;
      }
      if (badge.id === 'science-fan') {
        badge.unlocked = this.testCount >= 2;
      }
      if (badge.id === 'tech-innovator') {
        badge.unlocked = this.testCount >= 4;
      }
    });
  }

  ngOnInit() {
    // Sync theme toggle state from ThemeService
    const themeSetting = this.preferencesSettings.find(s => s.action === 'theme');
    if (themeSetting) {
      themeSetting.toggleState = this.themeService.isDark;
    }

    // Subscribe to theme changes
    this.themeSub = this.themeService.isDarkMode$.subscribe(isDark => {
      // Keep toggle in sync if changed externally
      const ts = this.preferencesSettings.find(s => s.action === 'theme');
      if (ts) ts.toggleState = isDark;
    });

    this.loadUserProfile();
    this.loadProfileHistory();
    this.loadVocationalPath();
    this.loadSavedUniversities();
  }

  ngOnDestroy() {
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  private loadUserProfile() {
    this.isProfileLoading = true;
    this.profileLoadError = '';

    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.user.name = usuario.nombre;
        this.user.email = usuario.email;
        this.user.role = usuario.role;
        this.user.level = usuario.level || 5;

        if (usuario.fotoUrl) {
          this.user.avatar = usuario.fotoUrl;
        } else {
          const initials = usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
          this.user.avatar = `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff&size=128`;
        }

        // Sync theme toggle with user preference from API
        if (usuario.darkMode !== undefined) {
          const themeSetting = this.preferencesSettings.find(s => s.action === 'theme');
          if (themeSetting) {
            themeSetting.toggleState = usuario.darkMode;
          }
          this.themeService.setTheme(usuario.darkMode);
        }
        this.isProfileLoading = false;
        this.updateBadges();
        this.loadVocationalPath();
      },
      error: (err) => {
        console.error('Error cargando perfil', err);
        this.isProfileLoading = false;
        this.profileLoadError = 'No pudimos cargar tus datos de cuenta desde la API. Tu camino STEAM local sigue disponible en este dispositivo.';
        this.loadVocationalPath();
      }
    });
  }

  private loadProfileHistory() {
    this.profileHistoryWarning = '';
    this.testService.getTestHistory().subscribe({
      next: (history) => {
        this.testCount = history.length;
        this.latestTestScores = history[0]?.profileScores || {};
        this.latestDominantTraits = history[0]?.dominantTraits || '';
        this.updateBadges();
        this.loadVocationalPath();
      },
      error: (err) => {
        console.error('Error cargando historial para perfil', err);
        this.profileHistoryWarning = 'No pudimos consultar tu historial en API. El nivel y ADN usan datos locales disponibles.';
        this.testCount = 0;
        this.latestTestScores = {};
        this.latestDominantTraits = '';
        this.updateBadges();
        this.loadVocationalPath();
      }
    });
  }

  retryProfileData() {
    this.loadUserProfile();
    this.loadProfileHistory();
    this.loadSavedUniversities();
  }



  // --- SECCIONES PREMIUM DE AJUSTES ---
  accountSettings = [
    { icon: 'clock', title: 'Historial de Tests', action: 'viewHistory' },
    { icon: 'lock', title: 'Contraseña y Seguridad', action: 'security' },
    { icon: 'bell', title: 'Notificaciones', action: 'notifications' },
    { icon: 'user', title: 'Administrar Perfil', action: 'manage' },
    { icon: 'shield', title: 'Privacidad y Datos', action: 'privacy' }
  ];

  preferencesSettings = [
    { icon: 'moon', title: 'Tema (Modo Oscuro)', action: 'theme', isToggle: true, toggleState: false },
    { icon: 'globe', title: 'Idioma', action: 'language', value: 'Español' }
  ];

  supportSettings = [
    { icon: 'help-circle', title: 'Centro de ayuda', action: 'help' },
    { icon: 'headphones', title: 'Contactar soporte', action: 'contact' },
    { icon: 'info', title: 'Acerca de la app', action: 'about', value: 'v1.0.0' }
  ];

  // --- ESTADO Y VARIABLES DE LOS MODALES ---
  activeModal: 'editProfile' | 'security' | 'notifications' | 'help' | 'contact' | 'logout' | 'badge' | 'privacy' | null = null;
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';
  selectedBadge: any = null;
  avatarError: string | null = null;

  // Modelos de Formularios Simulados
  profileForm = {
    firstName: '',
    lastName: '',
    avatar: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  notificationSettings = {
    pushEnabled: true,
    emailMarketing: false,
    weeklySummary: true
  };

  handleAction(action: string) {
    if (action === 'viewHistory') {
      this.router.navigate(['/history']);
      return;
    }
    if (action === 'manage') this.openModal('editProfile');
    else if (action === 'security') this.openModal('security');
    else if (action === 'notifications') this.openModal('notifications');
    else if (action === 'privacy') this.openModal('privacy');
    else if (action === 'help') this.openModal('help');
    else if (action === 'contact') this.openModal('contact');
    else console.log(`Función no soportada por el momento: ${action}`);
  }

  togglePreference(setting: any) {
    if (setting.action === 'theme') {
      const isDark = !this.themeService.isDark;
      this.themeService.setTheme(isDark);
      setting.toggleState = isDark;
      
      this.userService.updateSettings({ darkMode: isDark }).subscribe({
        next: () => {
          this.showSuccessToast(isDark ? 'Modo oscuro activado' : 'Modo claro activado');
        },
        error: () => {
          this.showSuccessToast('Error al guardar preferencia de tema');
        }
      });
    } else {
      setting.toggleState = !setting.toggleState;
      this.showSuccessToast(`Ajuste guardado: ${setting.title}`);
    }
  }

  logout() {
    this.openModal('logout');
  }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }

  // --- LÓGICA DE LOS MODALES ---
  openModal(type: 'editProfile' | 'security' | 'notifications' | 'help' | 'contact' | 'logout' | 'privacy') {
    this.activeModal = type;
    if (type === 'editProfile') {
      // Cargar datos actuales en el formulario
      const names = this.user.name.split(' ');
      this.profileForm.firstName = names[0] || '';
      this.profileForm.lastName = names.slice(1).join(' ') || '';
      this.profileForm.avatar = this.user.avatar;
      this.avatarError = null;
    } else if (type === 'security') {
      this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
  }

  goToNextStep() {
    this.router.navigate([this.nextStep.route]);
  }

  goToEditProfile() {
    this.openModal('editProfile');
  }

  getConfidenceLabel(): string {
    if (this.profileConfidence === 'alta') return 'Confianza alta';
    if (this.profileConfidence === 'media') return 'Confianza media';
    return 'Confianza baja';
  }

  get profileRadarTextSummary(): string {
    if (!this.hasRadarData) {
      return 'ADN STEAM sin puntajes suficientes para graficar todavía.';
    }

    const scores = this.steamAreaScores
      .map((area) => `${area.label}: ${area.score}%`)
      .join(', ');
    return `ADN STEAM de mi camino: área dominante ${this.dominantArea}; área secundaria ${this.secondaryArea}. Puntajes: ${scores}.`;
  }

  getActiveModalTitle(): string {
    const titles: Record<string, string> = {
      editProfile: 'Administrar perfil',
      security: 'Contraseña y seguridad',
      notifications: 'Notificaciones',
      help: 'Centro de ayuda',
      contact: 'Contactar soporte',
      logout: 'Cerrar sesión',
      badge: this.selectedBadge?.name || 'Detalle de insignia',
      privacy: 'Privacidad y datos'
    };
    return this.activeModal ? titles[this.activeModal] : 'Modal';
  }

  get hasProfileDataWarning(): boolean {
    return this.testCount === 0 || !this.hasRadarData || this.profileConfidence === 'baja';
  }

  private loadVocationalPath() {
    const userId = this.getUserId();
    const localResult = this.readLocalJson<LocalVocationalTestResult | null>(`test_local_result_${userId}`, null);
    const calibrationSignals = this.readLocalJson<CalibrationModuleSignalResult[]>(`steam_calibration_signals_${userId}`, []);
    const simulatorSignals = this.readLocalJson<SimulatorVocationalSignalResult[]>(`steam_simulator_vocational_signals_${userId}`, []);

    this.profileLevel = this.resolveProfileLevel(localResult, calibrationSignals.length, simulatorSignals.length);
    this.profileLevelLabel = this.getProfileLevelLabel(this.profileLevel);
    this.profileLevelDescription = this.getProfileLevelDescription(this.profileLevel);
    this.profileConfidence = localResult?.progressiveProfile?.confidence || localResult?.strengthProfile.confidence || (this.testCount > 0 ? 'media' : 'baja');

    const strengthProfile = localResult?.progressiveProfile?.strengthProfile || localResult?.strengthProfile || null;
    this.dominantArea = this.formatAreaName(strengthProfile?.dominantArea?.area || this.latestDominantTraits);
    this.secondaryArea = this.formatAreaName(strengthProfile?.secondaryArea?.area || '');
    this.profileCombination = this.formatProfileLabel(strengthProfile?.primaryCombination || this.latestDominantTraits || 'Perfil STEAM en construcción');

    const areaScores = strengthProfile?.areaScores || this.latestTestScores || {};
    this.steamAreaScores = STEAM_AREA_DEFINITIONS.map(area => ({
      id: area.id,
      label: area.label,
      score: this.scoreToPercentage(this.getScoreForArea(areaScores, area.id)),
      color: area.color
    }));
    this.updateRadarChart(this.steamAreaScores);
    this.recommendedCareers = this.buildCareerSummaries(localResult);
    this.nextStep = this.resolveNextStep(calibrationSignals.length, simulatorSignals.length);
  }

  private loadSavedUniversities() {
    this.savedUniversitiesWarning = '';
    this.userService.getSavedUniversities().subscribe({
      next: (universities) => {
        this.savedUniversities = (universities || []).slice(0, 3).map(university => ({
          name: university?.universityName || university?.name || 'Universidad guardada',
          career: university?.careerName || university?.suggestedMajor || 'Carrera por validar',
          location: university?.location || university?.city || 'Ubicación por validar',
          source: 'api'
        }));
      },
      error: () => {
        this.savedUniversities = [];
        this.savedUniversitiesWarning = 'No pudimos cargar universidades guardadas desde la API. Puedes seguir explorando y guardarlas más tarde.';
      }
    });
  }

  private buildCareerSummaries(localResult: LocalVocationalTestResult | null): ProfileCareerSummary[] {
    const recommendations = localResult?.progressiveProfile?.careerRecommendations.recommendations
      || localResult?.careerRecommendations.recommendations
      || [];

    if (recommendations.length > 0) {
      return recommendations.slice(0, 3).map(recommendation => ({
        name: recommendation.career.name,
        compatibility: recommendation.compatibilityPercentage,
        source: recommendation.dataSource
      }));
    }

    const nicheCareers = this.authService.getCurrentUser()?.nicheCareers || [];
    return nicheCareers.slice(0, 3).map(career => ({
      name: career,
      compatibility: null,
      source: 'api'
    }));
  }

  private resolveProfileLevel(
    localResult: LocalVocationalTestResult | null,
    calibrationCount: number,
    simulatorCount: number
  ): ProgressiveVocationalProfileLevel {
    if (localResult?.progressiveProfile?.level) return localResult.progressiveProfile.level;
    if (this.testCount > 1 && calibrationCount > 1 && simulatorCount > 1) return 'perfil_avanzado';
    if (simulatorCount > 0) return 'perfil_validado';
    if (calibrationCount > 0) return 'perfil_calibrado';
    return 'perfil_inicial';
  }

  private getProfileLevelLabel(level: ProgressiveVocationalProfileLevel): string {
    const labels: Record<ProgressiveVocationalProfileLevel, string> = {
      perfil_inicial: 'Inicial',
      perfil_calibrado: 'Calibrado',
      perfil_validado: 'Validado',
      perfil_avanzado: 'Avanzado'
    };
    return labels[level];
  }

  private getProfileLevelDescription(level: ProgressiveVocationalProfileLevel): string {
    const descriptions: Record<ProgressiveVocationalProfileLevel, string> = {
      perfil_inicial: 'Tu perfil parte del test teórico. Puedes afinarlo con calibraciones y simuladores.',
      perfil_calibrado: 'Tu perfil ya incorpora experiencias reales, no solo gustos generales.',
      perfil_validado: 'Tus decisiones en simuladores ya contrastan el resultado del test.',
      perfil_avanzado: 'Tu camino combina varios tests, calibraciones y simuladores.'
    };
    return descriptions[level];
  }

  private resolveNextStep(calibrationCount: number, simulatorCount: number): NextProfileStep {
    if (this.testCount === 0) {
      return {
        title: 'Completar test vocacional',
        description: 'Empieza con el test para generar tu primer ADN STEAM.',
        route: '/evaluations',
        icon: 'clipboard-check'
      };
    }

    if (calibrationCount === 0) {
      return {
        title: 'Completar calibración',
        description: 'Ajusta tu perfil con experiencias que ya has vivido.',
        route: '/evaluations',
        icon: 'sliders-horizontal'
      };
    }

    if (simulatorCount === 0) {
      return {
        title: 'Probar simulador',
        description: 'Valida tu perfil tomando decisiones en una mini experiencia profesional.',
        route: '/career-simulator',
        icon: 'gamepad-2'
      };
    }

    return {
      title: 'Explorar universidades',
      description: 'Compara opciones cercanas compatibles con tu perfil vocacional.',
      route: '/explore',
      icon: 'map-pin'
    };
  }

  private updateRadarChart(areaScores: ProfileAreaScore[]) {
    const values = areaScores.map(area => area.score);
    this.hasRadarData = values.some(value => value > 0);
    this.radarChartData = {
      labels: areaScores.map(area => area.label),
      datasets: [
        {
          ...this.radarChartData.datasets[0],
          data: values,
          pointBackgroundColor: areaScores.map(area => area.color)
        }
      ]
    };
    this.radarChartOptions = this.createRadarChartOptions();
  }

  private createRadarChartOptions(): ChartOptions<'radar'> {
    const isDarkTheme = typeof document !== 'undefined' && document.body.classList.contains('dark-theme');
    const textColor = isDarkTheme ? '#E2E8F0' : '#334155';
    const gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.24)' : 'rgba(100, 116, 139, 0.20)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 25,
            backdropColor: 'transparent'
          },
          angleLines: { color: gridColor },
          grid: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: {
              size: 10,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.formattedValue}%`
          }
        }
      },
      elements: {
        line: { tension: 0.22 }
      }
    };
  }

  private getUserId(): string {
    return this.authService.getCurrentUser()?.id || 'guest';
  }

  private readLocalJson<T>(key: string, fallback: T): T {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private scoreToPercentage(score: number | null | undefined): number {
    const value = Number(score || 0);
    if (!Number.isFinite(value)) return 0;
    const normalized = value <= 20 ? Math.round((value / 20) * 100) : Math.round(value);
    return Math.max(0, Math.min(100, normalized));
  }

  private getScoreForArea(scores: Record<string, number>, areaId: SteamAreaId): number {
    const definition = STEAM_AREA_DEFINITIONS.find(area => area.id === areaId);
    const candidates = [areaId, definition?.apiKey, definition?.label, definition?.label.toLowerCase()].filter(Boolean) as string[];
    const entry = Object.entries(scores || {}).find(([key]) => {
      const normalizedKey = this.toSteamAreaId(key);
      return normalizedKey === areaId || candidates.some(candidate => candidate.toLowerCase() === key.toLowerCase());
    });
    return entry?.[1] || 0;
  }

  private formatAreaName(value: string | null | undefined): string {
    const normalized = this.toSteamAreaId(value);
    if (normalized) {
      return STEAM_AREA_DEFINITIONS.find(area => area.id === normalized)?.label || 'Por descubrir';
    }
    return value || 'Por descubrir';
  }

  private formatProfileLabel(value: string): string {
    return value
      .split('+')
      .map(part => this.formatAreaName(part.trim()))
      .join(' + ');
  }

  private toSteamAreaId(value: string | null | undefined): SteamAreaId | null {
    const normalized = (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.includes('ciencia')) return 'ciencia';
    if (normalized.includes('tecnolog')) return 'tecnologia';
    if (normalized.includes('ingenier')) return 'ingenieria';
    if (normalized.includes('arte')) return 'arte';
    if (normalized.includes('matem')) return 'matematicas';
    return null;
  }

  openBadgeModal(badge: any) {
    this.selectedBadge = badge;
    this.activeModal = 'badge';
  }

  // Método para abrir el correo desde el modal de ayuda
  openSupportMailer() {
    this.showSuccessToast('Abriendo cliente de correo...');
    setTimeout(() => {
      window.location.href = 'mailto:soporte@vocacionessteam.app';
      this.closeModal();
    }, 1500);
  }

  closeModal() {
    this.activeModal = null;
    this.selectedBadge = null;
    this.avatarError = null;
  }

  // --- LÓGICA DE SUBIDA DE IMAGEN ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.handleAvatarError('Solo se permiten imágenes PNG, JPG o JPEG.');
      return;
    }

    // Validar tamaño inicial (máximo 5MB antes de comprimir)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.handleAvatarError('La imagen es demasiado grande. El límite inicial es 5MB.');
      return;
    }

    this.avatarError = null;

    // Leer el archivo para comprimirlo
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Comprimir a JPEG con calidad 0.7 para asegurar un base64 muy ligero
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        this.profileForm.avatar = compressedBase64;

        if (this.activeModal !== 'editProfile') {
          // Si se seleccionó desde la vista principal, guardar directamente
          this.quickSaveAvatar(compressedBase64);
        }
      };
    };
    reader.onerror = () => {
      this.handleAvatarError('Error al leer el archivo. Inténtalo de nuevo.');
    };
    reader.readAsDataURL(file);
  }

  handleAvatarError(msg: string) {
    this.avatarError = msg;
    this.showSuccessToast(msg);
  }

  quickSaveAvatar(base64: string) {
    this.userService.updateAvatar(base64).subscribe({
      next: () => {
        this.user.avatar = base64;
        this.showSuccessToast('¡Foto de perfil actualizada!');
      },
      error: (err) => {
        console.error('Error actualizando foto', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 
                       (err.error?.message?.join(', ') || err.message || 'Error desconocido');
        this.showSuccessToast(`No se pudo actualizar la foto: ${detail}`);
      }
    });
  }

  // --- ACTUALIZACIÓN DE DATOS (Backend) ---
  saveProfile() {
    this.isSubmitting = true;
    
    // Preparar el nombre completo
    const fullname = `${this.profileForm.firstName} ${this.profileForm.lastName}`.trim();

    this.userService.updateProfile({ fullname }).subscribe({
      next: () => {
        // Actualizamos estado local
        this.user.name = fullname;
        
        // Si hay una nueva imagen de avatar que se capturó pero no se guardó, la guardamos también
        if (this.profileForm.avatar && this.profileForm.avatar !== this.user.avatar) {
          this.userService.updateAvatar(this.profileForm.avatar).subscribe({
            next: () => {
              this.user.avatar = this.profileForm.avatar;
              this.finalizeSaveProfile();
            },
            error: (err) => {
              console.error('Error actualizando avatar al guardar el perfil', err);
              this.finalizeSaveProfile(true);
            }
          });
        } else {
          this.finalizeSaveProfile();
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error actualizando perfil', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 
                       (err.error?.message?.join(', ') || err.message || 'Error desconocido');
        this.showSuccessToast(`Hubo un error al actualizar: ${detail}`);
      }
    });
  }

  private finalizeSaveProfile(withAvatarError: boolean = false) {
    this.isSubmitting = false;
    this.closeModal();
    if (withAvatarError) {
      this.showSuccessToast('Perfil actualizado, pero hubo un error con la foto.');
    } else {
      this.showSuccessToast('¡Perfil actualizado con éxito!');
    }
  }

  savePassword() {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword) {
      alert("Por favor completa los campos de contraseña.");
      return;
    }

    this.isSubmitting = true;
    
    this.userService.updatePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.showSuccessToast('Contraseña cambiada con éxito.');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error al cambiar contraseña', err);
        const detail = typeof err.error?.message === 'string' ? err.error.message : 
                       (err.message || 'Error desconocido al actualizar contraseña');
        this.showSuccessToast(`Error: ${detail}`);
      }
    });
  }

  saveNotifications() {
    this.isSubmitting = true;
    
    this.userService.updateSettings(this.notificationSettings).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.showSuccessToast('Preferencias de notificación guardadas.');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error guardando ajustes', err);
        this.showSuccessToast('Hubo un error al guardar');
      }
    });
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
