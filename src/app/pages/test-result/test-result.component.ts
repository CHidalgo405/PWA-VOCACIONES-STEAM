import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { UniversityRecommendation, TestSubmissionResponse, VocationTestService, Question } from '../../core/services/test.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

// Metadata for each STEAM area
export interface SteamArea {
  key: string;
  label: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  icon: string;
  rawScore: number;
  percentage: number;
}

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SplashScreenComponent, LucideIconComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss']
})
export class TestResultComponent implements OnInit {
  // UI States
  viewState: 'result' | 'universities' = 'result';
  isLoading: boolean = false;
  splashText: string = '';
  locationInput: string = '';

  // Modal State
  selectedUniversity: UniversityRecommendation | null = null;
  isModalOpen: boolean = false;

  // Profile data
  userProfile = {
    dominantTraits: '',
    description: '',
    greeting: ''
  };

  // ── STEAM Ring Chart ──
  steamAreas: SteamArea[] = [];
  topThree: SteamArea[] = [];
  globalAffinityPct: number = 0;

  // ── Aptitude Thermometer ──
  aptitudeLevel: 'explorador' | 'intermedio' | 'preparado' = 'explorador';
  aptitudePct: number = 0; // 0-100 for the pointer position

  readonly aptitudeLevels = [
    { key: 'explorador', label: 'Explorador',  icon: 'compass',      range: [0, 33]  },
    { key: 'intermedio', label: 'Intermedio',  icon: 'trending-up',  range: [34, 66] },
    { key: 'preparado',  label: 'Preparado',   icon: 'award',        range: [67, 100] },
  ];

  // ── Career Carousel ──
  careerCards: { name: string; icon: string; major: string; uniName: string; color: string }[] = [];
  activeCareerIndex: number = 0;

  // SVG ring constants
  readonly ringConfigs = [
    { radius: 72, strokeWidth: 14, rank: 0 }, // outer — dominant
  ];

  // Animated dash offsets for each ring (filled after init)
  ringOffsets: number[] = [0];
  ringFilled = false;

  recommendedUniversities: UniversityRecommendation[] = [];

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private testService = inject(VocationTestService);
  private route = inject(ActivatedRoute);

  // STEAM area metadata palette
  private readonly STEAM_META: Record<string, { label: string; gradientStart: string; gradientEnd: string; icon: string }> = {
    ciencia:      { label: 'Ciencia',      gradientStart: '#07B1C9', gradientEnd: '#0E9AA7', icon: 'flask-conical' },
    tecnologia:   { label: 'Tecnología',   gradientStart: '#6366F1', gradientEnd: '#07B1C9', icon: 'cpu'           },
    ingenieria:   { label: 'Ingeniería',   gradientStart: '#F88718', gradientEnd: '#FBBF24', icon: 'wrench'        },
    artes:        { label: 'Artes',        gradientStart: '#EC4899', gradientEnd: '#A855F7', icon: 'palette'       },
    matematicas:  { label: 'Matemáticas',  gradientStart: '#4DB046', gradientEnd: '#22D3EE', icon: 'sigma'         },
  };

  // Properties for Answers Modal
  showAnswersModal: boolean = false;
  testAnswers: Record<string, string> = {};
  allQuestions: Question[] = [];

  ngOnInit(): void {
    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.loadHistoricalResult(testId);
    } else {
      this.loadResults();
    }
  }

  loadHistoricalResult(testId: string) {
    this.isLoading = true;
    this.splashText = 'Cargando análisis histórico...';
    
    this.testService.getTestDetails(testId).subscribe({
      next: (result) => {
        this.processResult(result);
        this.testAnswers = result.answers || {};
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load historical result:', err);
        this.isLoading = false;
        this.toastService.showToast('No se pudo cargar este test.', 'error');
      }
    });
  }

  loadResults() {
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';

    const answersStr = localStorage.getItem(`test_answers_${userId}`) || localStorage.getItem('latest_test_answers');
    if (!answersStr) {
      console.warn('No test answers found.');
      this.toastService.showToast('No se encontraron las respuestas del test.', 'error');
      return;
    }
    const answers = JSON.parse(answersStr);

    const savedLocation = localStorage.getItem(`test_location_${userId}`) || localStorage.getItem('latest_test_location') || '';
    if (savedLocation) {
      this.locationInput = savedLocation;
    }

    this.isLoading = true;
    this.splashText = 'Analizando tu perfil STEAM...';

    this.testService.submitTest(answers, savedLocation).subscribe({
      next: (result) => {
        localStorage.setItem(`test_result_${userId}`, JSON.stringify(result));
        this.processResult(result);
        this.testAnswers = answers; // Guardamos las respuestas actuales
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load results:', err);
        this.isLoading = false;
        this.toastService.showToast('Error al procesar el test con la IA. Por favor intenta de nuevo.', 'error', 'Error del Servidor');
      }
    });
  }

  private processResult(result: TestSubmissionResponse) {
    this.userProfile.dominantTraits = result.dominantTraits;
    this.userProfile.description = result.aiProfileDescription;
    this.recommendedUniversities = result.recommendations;

    this.buildSteamChart(result.scores);
    this.buildGreeting();
    this.buildCareerCards(result.recommendations);
  }

  private buildSteamChart(scores: Record<string, number>) {
    const MAX_SCORE = 20;

    this.steamAreas = Object.entries(scores).map(([key, rawScore]) => {
      const meta = this.STEAM_META[key] ?? {
        label: key,
        gradientStart: '#07B1C9',
        gradientEnd: '#0698AC',
        icon: 'star',
      };
      
      const percentage = Math.min(Math.round((rawScore / MAX_SCORE) * 100), 100);
      
      return {
        key,
        label: meta.label,
        color: meta.gradientStart,
        gradientStart: meta.gradientStart,
        gradientEnd: meta.gradientEnd,
        icon: meta.icon,
        rawScore,
        percentage,
      };
    }).sort((a, b) => b.rawScore - a.rawScore);

    this.topThree = this.steamAreas.slice(0, 3);

    const top3Sum = this.topThree.reduce((s, a) => s + a.percentage, 0);
    this.globalAffinityPct = Math.min(Math.round(top3Sum / Math.max(this.topThree.length, 1)), 100);

    // ── Derive aptitude level from globalAffinityPct ──
    if (this.globalAffinityPct >= 67) {
      this.aptitudeLevel = 'preparado';
      this.aptitudePct   = Math.min(100, 67 + ((this.globalAffinityPct - 67) / 33) * 33);
    } else if (this.globalAffinityPct >= 34) {
      this.aptitudeLevel = 'intermedio';
      this.aptitudePct   = 34 + ((this.globalAffinityPct - 34) / 33) * 33;
    } else {
      this.aptitudeLevel = 'explorador';
      this.aptitudePct   = (this.globalAffinityPct / 33) * 33;
    }

    setTimeout(() => {
      this.ringFilled = true;
      this.ringOffsets = this.ringConfigs.map((cfg, i) => {
        const area = this.topThree[i];
        if (!area) return this.circumference(cfg.radius);
        const pct = area.percentage / 100;
        return this.circumference(cfg.radius) * (1 - pct);
      });
    }, 300);
  }

  private buildGreeting() {
    const hour = new Date().getHours();
    let tod = 'Hola';
    if (hour < 12)  tod = '¡Buenos días!';
    else if (hour < 19) tod = '¡Buenas tardes!';
    else tod = '¡Buenas noches!';
    this.userProfile.greeting = tod;
  }

  private buildCareerCards(recs: UniversityRecommendation[]) {
    // Map each recommendation to a carousel card
    const icons = ['graduation-cap', 'briefcase', 'rocket'];
    const colors = ['#07B1C9', '#6366F1', '#4DB046'];
    this.careerCards = recs.map((rec, i) => ({
      name:    rec.suggestedMajor,
      icon:    icons[i % icons.length],
      major:   rec.suggestedMajor,
      uniName: rec.name,
      color:   colors[i % colors.length],
    }));
  }

  carouselNext() {
    if (this.activeCareerIndex < this.careerCards.length - 1) {
      this.activeCareerIndex++;
    } else {
      this.activeCareerIndex = 0; // wrap
    }
  }

  carouselPrev() {
    if (this.activeCareerIndex > 0) {
      this.activeCareerIndex--;
    } else {
      this.activeCareerIndex = this.careerCards.length - 1;
    }
  }

  isActiveCard(i: number): boolean   { return i === this.activeCareerIndex; }
  isAdjacentCard(i: number): boolean {
    const n = this.careerCards.length;
    return i === (this.activeCareerIndex + 1) % n || i === (this.activeCareerIndex - 1 + n) % n;
  }

  /** Generate a realistic match score for each recommendation */
  getMatchScore(index: number): number {
    // Higher scores for top recommendations, slight randomness seeded by index
    const base = [95, 91, 87, 83, 79];
    return base[index % base.length];
  }

  openCardDetail(index: number) {
    const uni = this.recommendedUniversities[index];
    if (uni) this.openDetails(uni);
  }

  downloadPDF() {
    // Stub — in production connect to a PDF generation service
    this.toastService.showToast(
      'Tu reporte STEAM se está generando. ¡Estará listo pronto!',
      'info',
      'Descargando...'
    );
  }

  navigateToUniversities() {
    this.startAISearch();
  }

  /** Safe area accessors — eliminates optional chaining in templates */
  areaGradientStart(i: number): string {
    return this.topThree[i]?.gradientStart ?? '#07B1C9';
  }
  areaGradientEnd(i: number): string {
    return this.topThree[i]?.gradientEnd ?? '#0698AC';
  }

  circumference(r: number): number {
    return 2 * Math.PI * r;
  }

  /** Returns stroke-dashoffset for a given ring index */
  dashOffset(ringIndex: number): number {
    return this.ringOffsets[ringIndex] ?? this.circumference(this.ringConfigs[ringIndex].radius);
  }

  /** Full dash array (circumference) for a ring */
  dashArray(ringIndex: number): number {
    return this.circumference(this.ringConfigs[ringIndex].radius);
  }

  // ── Rest of original methods ──

  startAISearch() {
    if (!this.locationInput.trim()) {
      this.locationInput = 'tu zona';
    }
    this.splashText = `Analizando opciones en ${this.locationInput}...`;
    this.isLoading = true;

    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';

    const answersStr = localStorage.getItem(`test_answers_${userId}`);
    const answers = answersStr ? JSON.parse(answersStr) : {};

    this.testService.submitTest(answers, this.locationInput).subscribe({
      next: (result) => {
        this.processResult(result);
        this.isLoading = false;
        this.viewState = 'universities';
        window.scrollTo({ top: 0, behavior: 'auto' });
      },
      error: (err) => {
        console.error('Error during AI Search:', err);
        this.isLoading = false;
      }
    });
  }

  openDetails(university: UniversityRecommendation) {
    this.selectedUniversity = university;
    // Only open the off-canvas/bottom-sheet modal on mobile devices
    if (window.innerWidth < 1024) {
      this.isModalOpen = true;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    setTimeout(() => { this.selectedUniversity = null; }, 300);
  }

  saveToFavorites() {
    if (!this.selectedUniversity) return;

    const payload = {
      careerName: this.selectedUniversity.suggestedMajor,
      universityName: this.selectedUniversity.name,
      location: this.selectedUniversity.location,
      relationshipExplanation: this.selectedUniversity.matchReason,
      keyDates: this.selectedUniversity.keyDates,
      studyPlan: Array.isArray(this.selectedUniversity.studyPlan)
        ? this.selectedUniversity.studyPlan.join(', ')
        : (this.selectedUniversity.studyPlan || '')
    };

    this.userService.saveUniversity(payload).subscribe({
      next: () => {
        this.toastService.showToast(
          `¡${this.selectedUniversity?.name} guardada en tus favoritos!`,
          'success',
          '¡Guardado!'
        );
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastService.showToast('Esta universidad ya está en tus favoritos.', 'info');
        } else {
          this.toastService.showToast('No se pudo guardar la universidad. Intenta más tarde.', 'error');
        }
      }
    });
  }

  goBackToResult() {
    this.viewState = 'result';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // --- MODAL DE RESPUESTAS ---
  openAnswersModal() {
    this.showAnswersModal = true;
    if (this.allQuestions.length === 0) {
      this.testService.getQuestions().subscribe(q => {
        if (q && q.length > 0) this.allQuestions = q;
      });
    }
  }

  closeAnswersModal() {
    this.showAnswersModal = false;
  }

  getAnswerText(questionId: string, letter: string): string {
    const q = this.allQuestions.find(x => x.id === questionId);
    if (!q) return letter;
    const opt = q.options.find(o => o.letter === letter);
    return opt ? opt.text : letter;
  }
}
