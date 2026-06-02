import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';
import { TestSubmissionResponse, VocationTestService, TestDetail } from '../../core/services/test.service';
import { ProfileStateService } from '../../core/services/profile-state.service';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName = 'Cargando...';
  userProfile?: Usuario;
  avatarUrl = '';

  // User state
  hasTakenTest = false;
  dominantTraitsStr = 'Pendiente';
  
  // Gamification State
  private profileState = inject(ProfileStateService);
  profileResolution = this.profileState.profileResolution;
  badges = this.profileState.badges;
  calibrationModules = this.profileState.calibrationModules;
  hasTakenBaseTest = this.profileState.hasTakenBaseTest;

  // AI Confidence & Simulators
  aiConfidence = 0;

  // Modal State
  showWelcomeModal = false;

  // Profile Areas
  profileAreas: { name: string; percentage: number; color: string }[] = [];

  recommendedCareers: { title: string; category: string }[] = [];
  dominantArea: any = null;
  secondaryArea: any = null;

  constructor(
    private router: Router, 
    private authService: AuthService,
    private testService: VocationTestService
  ) { }

  ngOnInit() {
    // 1. Carga Rápida Síncrona Offline-First (desde el usuario en caché)
    const cachedUser = this.authService.getCurrentUser();
    if (cachedUser) {
      this.userProfile = cachedUser;
      this.userName = cachedUser.nombre || this.userName;
      if (cachedUser.fotoUrl) {
        this.avatarUrl = cachedUser.fotoUrl;
      }
      if (cachedUser.id) {
        this.readFromCache(cachedUser.id);
      }
    }

    // 2. Suscripción Asíncrona (Carga desde el Servidor en segundo plano)
    this.authService.obtenerPerfil().subscribe(usuario => {
      this.userProfile = usuario;
      this.userName = usuario.nombre || this.userName;
      if (usuario.fotoUrl) {
        this.avatarUrl = usuario.fotoUrl;
      } else {
        const initials = this.userName.split(' ').map(n => n[0]).join('').substring(0, 2);
        this.avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=E53935&color=fff`; // Red avatar like mockup
      }

      if (usuario.id) {
        const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${usuario.id}`);
        if (!hasSeenWelcome) {
          this.showWelcomeModal = true;
          document.body.style.overflow = 'hidden';
        }

        // Carga/Actualiza desde la API
        this.loadTestResult(usuario.id);
      }
    });
  }

  loadTestResult(userId: string) {
    // 1. Carga Rápida Offline-First (desde caché)
    this.readFromCache(userId);

    // 2. Fetch fresco desde la API
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest) {
          // Actualizamos la caché
          localStorage.setItem(`test_result_${userId}`, JSON.stringify(latestTest));
          localStorage.setItem(`hasTakenTest_${userId}`, 'true');
          // Actualizamos la interfaz
          this.processResultObject(latestTest);
        } else {
          // El usuario no tiene tests en el servidor
          this.hasTakenTest = false;
          localStorage.removeItem(`test_result_${userId}`);
          localStorage.removeItem(`hasTakenTest_${userId}`);
          this.setDefaultProfile();
        }
      },
      error: (err) => {
        console.error('Error fetching latest test from API, fallback to cache', err);
        // We already loaded from cache in step 1, so we just log the error.
      }
    });
  }

  private readFromCache(userId: string) {
    const rawResult = localStorage.getItem(`test_result_${userId}`);
    if (rawResult) {
      try {
        const result: TestSubmissionResponse = JSON.parse(rawResult);
        this.processResultObject(result);
      } catch (e) {
        console.error('Failed to parse test result cache', e);
        this.setDefaultProfile();
      }
    } else {
      this.setDefaultProfile();
    }
  }

  private processResultObject(result: any) {
    this.hasTakenTest = true;
    
    // Support both scores and profileScores to be safe
    const scores = result.scores || result.profileScores || {};
    const MAX_SCORE = 20;
    
    const topScore = Math.max(...Object.values(scores as Record<string, number>), 0);

    const areaColorMap: Record<string, string> = {
      tecnologia: '#F27405',
      ingenieria: '#4CAF50',
      ciencia: '#00BCD4',
      artes: '#F44336',
      matematicas: '#424242'
    };

    const areaNameMap: Record<string, string> = {
      tecnologia: 'Tecnología',
      ingenieria: 'Ingeniería',
      ciencia: 'Ciencia',
      artes: 'Artes',
      matematicas: 'Matemáticas'
    };

    this.profileAreas = Object.entries(scores).map(([key, rawScore]) => {
      return {
        name: areaNameMap[key] || key,
        percentage: Math.min(Math.round(((rawScore as number) / MAX_SCORE) * 100), 100),
        color: areaColorMap[key] || '#999999'
      };
    }).sort((a, b) => b.percentage - a.percentage);

    this.dominantTraitsStr = result.dominantTraits || 'Perfil Mixto';
    
    // Calculate AI Confidence based on completed modules (Mock: only module 1 is ready, so 33%)
    this.aiConfidence = 33;

    if (result.recommendations && result.recommendations.length > 0) {
      this.recommendedCareers = result.recommendations.slice(0, 5).map((r: any) => ({
        title: r.suggestedMajor,
        category: 'general'
      }));
    } else {
      this.recommendedCareers = [];
    }

    // Set dominant/secondary areas for the summary widget
    if (this.profileAreas.length > 0) {
        this.dominantArea = this.profileAreas[0];
        this.secondaryArea = this.profileAreas[1] || null;
    }
  }

  private setDefaultProfile() {
    this.hasTakenTest = false;
    this.aiConfidence = 0;
    this.profileAreas = [
      { name: 'Tecnología', percentage: 0, color: '#F27405' },
      { name: 'Ingeniería', percentage: 0, color: '#4CAF50' },
      { name: 'Ciencia', percentage: 0, color: '#00BCD4' },
      { name: 'Artes', percentage: 0, color: '#F44336' },
      { name: 'Matemáticas', percentage: 0, color: '#424242' }
    ];
  }

  startTest() {
    this.router.navigate(['/evaluations']);
  }

  goToMission(missionId: string) {
    if (missionId === 'mission1') {
      this.router.navigate(['/evaluations']);
    } else if (missionId === 'mission2') {
      this.router.navigate(['/evaluations/hobbies-test']);
    } else if (missionId === 'mission3') {
      this.router.navigate(['/evaluations/error-lab']);
    }
  }

  closeWelcomeModal() {
    this.showWelcomeModal = false;
    document.body.style.overflow = '';
    if (this.userProfile?.id) {
      localStorage.setItem(`hasSeenWelcome_${this.userProfile.id}`, 'true');
    }
  }
}