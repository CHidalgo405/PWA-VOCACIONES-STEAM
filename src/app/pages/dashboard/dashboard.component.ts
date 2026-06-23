import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/auth.service';
import { TestSubmissionResponse, VocationTestService, TestDetail } from '../../core/services/test.service';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import gsap from 'gsap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  userName = 'Cargando...';
  userProfile?: Usuario;
  avatarUrl = '';

  // User state
  hasTakenTest = false;
  dominantTraitsStr = 'Pendiente';
  
  // AI Confidence & Simulators
  aiConfidence = 0;
  activeSimulator: { title: string; progress: number } | null = { 
    title: 'Reto: Construye tu primer circuito', 
    progress: 50 
  };

  calibrationModulesConfig = [
    { id: 'gaming_habits', title: 'Hábitos de Gaming', icon: 'gamepad-2' },
    { id: 'physical_hobbies', title: 'Hobbies y Ecosistemas', icon: 'leaf' },
    { id: 'digital_consumption', title: 'Consumo Digital', icon: 'monitor-smartphone' },
    { id: 'everyday_mechanics', title: 'Resolución Doméstica', icon: 'wrench' }
  ];

  // Modal State
  showWelcomeModal = false;

  // Profile Areas
  profileAreas: { name: string; percentage: number; color: string }[] = [];

  recommendedCareers: { title: string; category: string }[] = [];
  dominantArea: any = null;
  secondaryArea: any = null;

  private ctx!: gsap.Context;

  constructor(
    private router: Router, 
    public authService: AuthService,
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
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
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
      },
      error: (err) => {
        console.error('Error al cargar perfil en dashboard:', err);
        if (err.status === 401) {
          this.userName = 'Sesión expirada';
        } else {
          this.userName = 'Error de conexión';
        }
      }
    });
  }

  ngAfterViewInit() {
    // Usamos setTimeout para asegurar que Angular ya renderizó la vista 
    // en el caso de depender de un caché inicial super rápido.
    setTimeout(() => {
      this.ctx = gsap.context(() => {
        
        // --- FIX: Evitar conflicto entre transiciones CSS y GSAP ---
        // GSAP se traba si las clases tienen 'transition: all' en CSS.
        // Solución: Desactivamos transiciones inline al inicio, y las restauramos al final.
        const animatedTargets = '.user-greeting, .header-actions, .steam-banner, .hero-stats-panel, .stepper-container, .module-slot, .widget-card, .cta-card, .why-card';
        
        gsap.set(animatedTargets, { transition: 'none' });

        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(animatedTargets, { clearProps: 'transition' });
          }
        });

        // 1. El texto de bienvenida y los gráficos circulares/banners: fade-in y escalar desde 0.95
        tl.from('.user-greeting, .header-actions, .steam-banner, .hero-stats-panel, .stepper-container', {
          duration: 0.8,
          opacity: 0,
          scale: 0.95,
          ease: 'power3.out',
          stagger: 0.1
        });

        // 2. Las tarjetas (Módulos de Calibración, Carreras, etc): entrar desde la derecha (translateX 30px)
        tl.from('.module-slot, .widget-card, .cta-card, .why-card', {
          duration: 0.8,
          opacity: 0,
          x: 30, // equivalente a translateX(30px)
          ease: 'expo.out',
          stagger: 0.1
        }, "-=0.4"); // Solapamiento sutil de -0.4s con la animación anterior para mayor dinamismo
      });
    }, 50);
  }

  ngOnDestroy() {
    // Evita memory leaks destruyendo el contexto completo de GSAP (líneas de tiempo y tweens asociadas)
    if (this.ctx) {
      this.ctx.revert();
    }
  }

  loadTestResult(userId: string) {
    // 1. Carga Rápida Offline-First (desde caché)
    this.readFromCache(userId);

    // 2. Fetch fresco desde la API
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest) {
          localStorage.setItem(`test_raw_scores_${userId}`, JSON.stringify(latestTest.scores));
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
    
    const userId = this.userProfile?.id || 'guest';
    const rawScores = result.scores || result.profileScores || {};
    const weightedScores = this.testService.calculateWeightedScores(rawScores, userId);

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

    this.profileAreas = Object.entries(weightedScores).map(([key, scoreVal]) => {
      return {
        name: areaNameMap[key] || key,
        percentage: scoreVal as number,
        color: areaColorMap[key] || '#999999'
      };
    }).sort((a, b) => b.percentage - a.percentage);

    this.dominantTraitsStr = result.dominantTraits || 'Perfil Mixto';
    
    // Calculate AI Confidence based on completed modules
    if (!this.hasTakenTest) {
      this.aiConfidence = 0;
    } else {
      const completedCount = this.userProfile?.calibrationModules?.filter(m => m.status === 'completed').length || 0;
      this.aiConfidence = Math.min(20 + completedCount * 20, 100);
    }

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

  getModuleState(moduleId: string): 'locked' | 'available' | 'completed' {
    const modules = this.authService.currentUserSig()?.calibrationModules;
    const mod = modules?.find(m => m.id === moduleId);
    // If it says 'locked', we override it to 'available' for now because we enabled all modules
    if (mod && mod.status === 'completed') return 'completed';
    return 'available';
  }

  goToMission(moduleId: string) {
    if (moduleId === 'mission1') {
      this.router.navigate(['/evaluations']);
    } else {
      const state = this.getModuleState(moduleId);
      if (state !== 'locked') {
        this.router.navigate(['/evaluations/calibration', moduleId]);
      }
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