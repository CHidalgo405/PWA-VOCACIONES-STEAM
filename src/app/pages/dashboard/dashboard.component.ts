import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';
import { VocationTestService, TestDetail } from '../../core/services/test.service';
import { VocationalProfileService } from '../../core/services/vocational-profile.service';
import { VocationalProfile } from '../../core/models/vocational-profile.models';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import gsap from 'gsap';

interface ProfileArea {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  public pwaInstall = inject(PwaInstallService);
  private profileEngine = inject(VocationalProfileService);

  userName = 'Cargando...';
  userProfile?: Usuario;
  avatarUrl = '';

  // User state
  hasTakenTest = false;
  dominantTraitsStr = 'Pendiente';
  calibrationLevel = 0;

  calibrationModulesConfig = [
    { id: 'gaming_habits', title: 'Hábitos de Gaming', icon: 'gamepad-2' },
    { id: 'physical_hobbies', title: 'Hobbies y Ecosistemas', icon: 'leaf' },
    { id: 'digital_consumption', title: 'Consumo Digital', icon: 'monitor-smartphone' },
    { id: 'everyday_mechanics', title: 'Resolución Doméstica', icon: 'wrench' },
  ];

  showWelcomeModal = false;

  /** Módulos completados según la BD (fuente de verdad cross-device). */
  private completedModuleIds = new Set<string>();

  profileAreas: ProfileArea[] = [];
  recommendedCareers: { title: string; category: string }[] = [];
  dominantArea: ProfileArea | null = null;
  secondaryArea: ProfileArea | null = null;

  // Paleta STEAM alineada con la vista de resultados
  private readonly STEAM_META: Record<string, { label: string; color: string }> = {
    ciencia: { label: 'Ciencia', color: '#07B1C9' },
    tecnologia: { label: 'Tecnología', color: '#6366F1' },
    ingenieria: { label: 'Ingeniería', color: '#F88718' },
    artes: { label: 'Artes', color: '#EC4899' },
    matematicas: { label: 'Matemáticas', color: '#4DB046' },
  };

  // Radar Chart
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(7, 177, 201, 0.2)' },
        grid: { color: 'rgba(7, 177, 201, 0.15)' },
        pointLabels: { color: '#94A3B8', font: { size: 12, family: 'Poppins', weight: 'bold' } },
        ticks: { display: false, stepSize: 20 },
        min: 0,
        max: 100,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: 'Poppins', size: 14, weight: 'bold' },
        bodyFont: { family: 'Poppins', size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (context) => `${context.parsed.r}% de Afinidad` },
      },
    },
  };

  public radarChartData: ChartData<'radar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Afinidad',
      backgroundColor: 'rgba(7, 177, 201, 0.15)',
      borderColor: '#07B1C9',
      pointBackgroundColor: '#07B1C9',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#07B1C9',
      borderWidth: 2,
    }],
  };

  private ctx!: gsap.Context;

  constructor(
    private router: Router,
    public authService: AuthService,
    private testService: VocationTestService
  ) {}

  ngOnInit() {
    // Estado real de calibración desde la BD (sobrevive recargas y
    // cambios de dispositivo, a diferencia del estado local del usuario).
    this.profileEngine.getMyCalibrations().subscribe((rows) => {
      this.completedModuleIds = new Set(rows.map((r) => r.moduleId));
    });

    const cachedUser = this.authService.getCurrentUser();
    if (cachedUser) {
      this.userProfile = cachedUser;
      this.userName = cachedUser.nombre || this.userName;
      if (cachedUser.fotoUrl) this.avatarUrl = cachedUser.fotoUrl;
      if (cachedUser.id) this.loadLocalOrCache(cachedUser.id);
    }

    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.userProfile = usuario;
        this.userName = usuario.nombre || this.userName;
        this.avatarUrl = usuario.fotoUrl || this.fallbackAvatar(this.userName);

        if (usuario.id) {
          const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${usuario.id}`);
          if (!hasSeenWelcome) {
            this.showWelcomeModal = true;
            document.body.style.overflow = 'hidden';
          }
          this.loadTestResult(usuario.id);
        }
      },
      error: (err) => {
        console.error('Error al cargar perfil en dashboard:', err);
        // Si hay perfil local computado, lo seguimos mostrando; solo ajustamos el avatar.
        if (!this.avatarUrl) this.avatarUrl = this.fallbackAvatar(this.userName);
      },
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.ctx = gsap.context(() => {
        const targets = '.dash-header, .steam-hero, .profile-summary-card, .module-chip, .dash-card, .why-card';
        gsap.set(targets, { transition: 'none' });
        gsap.from(targets, {
          duration: 0.6,
          opacity: 0,
          y: 18,
          ease: 'power3.out',
          stagger: 0.07,
          clearProps: 'transform,opacity',
        });
      });
    }, 50);
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
  }

  private fallbackAvatar(name: string): string {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
    return `https://ui-avatars.com/api/?name=${initials}&background=07B1C9&color=fff&bold=true`;
  }

  // ── Carga del perfil ──────────────────────────────────────────────
  /** Prioriza el perfil computado localmente por el motor; cae a caché de API. */
  private loadLocalOrCache(userId: string) {
    if (this.tryLoadLocalProfile(userId)) return;
    this.readFromCache(userId);
  }

  loadTestResult(userId: string) {
    // 1. Perfil cacheado localmente (pintado instantáneo)
    if (this.tryLoadLocalProfile(userId)) return;

    // 2. API: último test con el VocationalProfile del motor determinista
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        const apiProfile = (latestTest as any)?.profile as VocationalProfile | null;
        if (apiProfile) {
          this.profileEngine.cacheProfile(apiProfile);
          this.applyProfile(apiProfile);
        } else if (latestTest) {
          // 3. Legacy: tests previos sin perfil persistido
          localStorage.setItem(`test_result_${userId}`, JSON.stringify(latestTest));
          this.processLegacyResult(latestTest);
        } else {
          this.hasTakenTest = false;
          this.setDefaultProfile();
        }
      },
      error: (err) => console.error('Error fetching latest test (fallback to cache)', err),
    });
  }

  /** Intenta cargar el VocationalProfile guardado por la vista de resultados. */
  private tryLoadLocalProfile(userId: string): boolean {
    let profile: VocationalProfile | null = null;
    try {
      const raw = localStorage.getItem(`test_profile_${userId}`);
      if (raw) profile = JSON.parse(raw);
    } catch { profile = null; }

    // Si no hay perfil pero sí respuestas, lo computamos al vuelo.
    if (!profile) {
      try {
        const scoresRaw = localStorage.getItem(`test_theoretical_scores_${userId}`);
        if (scoresRaw) profile = this.profileEngine.computeProfile(JSON.parse(scoresRaw));
      } catch { profile = null; }
    }

    if (!profile) return false;
    this.applyProfile(profile);
    return true;
  }

  /** Pinta un VocationalProfile (del caché o de la API) en el dashboard. */
  private applyProfile(profile: VocationalProfile): void {
    this.hasTakenTest = true;
    this.dominantTraitsStr = profile.profileName;
    this.calibrationLevel = profile.calibration.level;

    this.profileAreas = Object.entries(profile.steamScores)
      .map(([key, pct]) => ({
        name: this.STEAM_META[key]?.label || key,
        percentage: pct as number,
        color: this.STEAM_META[key]?.color || '#94A3B8',
      }))
      .sort((a, b) => b.percentage - a.percentage);

    this.dominantArea = this.profileAreas[0] || null;
    this.secondaryArea = this.profileAreas[1] || null;
    this.recommendedCareers = profile.recommendedCareers.slice(0, 5).map(c => ({ title: c.careerName, category: '' }));
    this.updateRadar();
  }

  private readFromCache(userId: string) {
    const rawResult = localStorage.getItem(`test_result_${userId}`);
    if (rawResult) {
      try {
        this.processLegacyResult(JSON.parse(rawResult));
      } catch {
        this.setDefaultProfile();
      }
    } else {
      this.setDefaultProfile();
    }
  }

  /** Procesa el formato legacy de la API (scores + dominantTraits). */
  private processLegacyResult(result: any) {
    this.hasTakenTest = true;
    const scores: Record<string, number> = result.scores || result.profileScores || {};

    this.profileAreas = Object.entries(scores)
      .map(([key, val]) => ({
        name: this.STEAM_META[key]?.label || key,
        percentage: val as number,
        color: this.STEAM_META[key]?.color || '#94A3B8',
      }))
      .sort((a, b) => b.percentage - a.percentage);

    this.dominantTraitsStr = result.dominantTraits || 'Perfil Mixto';
    this.dominantArea = this.profileAreas[0] || null;
    this.secondaryArea = this.profileAreas[1] || null;

    const completed = this.userProfile?.calibrationModules?.filter(m => m.status === 'completed').length || 0;
    this.calibrationLevel = Math.min(55 + completed * 10, 100);

    this.recommendedCareers = (result.recommendations || []).slice(0, 5).map((r: any) => ({ title: r.suggestedMajor, category: 'general' }));
    this.updateRadar();
  }

  private updateRadar() {
    this.radarChartData = {
      labels: this.profileAreas.map(a => a.name),
      datasets: [{
        data: this.profileAreas.map(a => a.percentage),
        label: 'Afinidad',
        backgroundColor: 'rgba(7, 177, 201, 0.22)',
        borderColor: '#07B1C9',
        pointBackgroundColor: '#07B1C9',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#07B1C9',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderWidth: 2,
      }],
    };
  }

  private setDefaultProfile() {
    this.hasTakenTest = false;
    this.calibrationLevel = 0;
    this.profileAreas = Object.entries(this.STEAM_META).map(([, meta]) => ({
      name: meta.label,
      percentage: 0,
      color: meta.color,
    }));
  }

  // ── Calibración ──
  get completedModulesCount(): number {
    return this.calibrationModulesConfig.filter(m => this.getModuleState(m.id) === 'completed').length;
  }

  getModuleState(moduleId: string): 'locked' | 'available' | 'completed' {
    if (this.completedModuleIds.has(moduleId)) return 'completed';
    const mod = this.authService.currentUserSig()?.calibrationModules?.find(m => m.id === moduleId);
    if (mod && mod.status === 'completed') return 'completed';
    return 'available';
  }

  goToMission(moduleId: string) {
    this.router.navigate(['/evaluations/calibration', moduleId]);
  }

  startTest() {
    this.router.navigate(['/evaluations']);
  }

  closeWelcomeModal() {
    this.showWelcomeModal = false;
    document.body.style.overflow = '';
    if (this.userProfile?.id) {
      localStorage.setItem(`hasSeenWelcome_${this.userProfile.id}`, 'true');
    }
  }
}
