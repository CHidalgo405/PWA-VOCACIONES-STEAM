import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import {
  PdfCareerRecommendation,
  PdfNextStep,
  PdfProgressItem,
  PdfReportTemplateComponent,
  PdfUniversityRecommendation
} from '../../components/pdf-report-template/pdf-report-template.component';
import { UniversityRecommendation, TestSubmissionResponse, VocationTestService, Question } from '../../core/services/test.service';
import { LocalVocationalResultService } from '../../core/services/local-vocational-result.service';
import { LocalVocationalCalibrationService } from '../../core/services/local-vocational-calibration.service';
import { CareerSimulatorService } from '../../core/services/career-simulator.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import type {
  ComplementarySkillId,
  LocalVocationalTestResult,
  SteamCareerRecommendationMatch,
  SteamAreaId
} from '../../core/models/vocational-steam.models';
import { inject } from '@angular/core';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { HeaderComponent } from '../../components/header/header.component';
import { LocationFilterComponent } from '../../components/location-filter/location-filter.component';
import { timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subscription } from 'rxjs';

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

interface CareerRecommendationViewModel {
  name: string;
  description: string;
  compatibilityPercentage: number;
  mainReason: string;
  sourceLabel: string;
  matchingAreas: SteamAreaId[];
  areasToStrengthen: SteamAreaId[];
}

interface NextStepViewModel {
  title: string;
  description: string;
  actionLabel: string;
  icon: string;
  route: string;
}

interface ResultStateNotice {
  title: string;
  message: string;
  type: 'api' | 'ia' | 'missing' | 'empty';
  actionLabel?: string;
}

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, SplashScreenComponent, LucideIconComponent, PdfReportTemplateComponent, HeaderComponent, LocationFilterComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss']
})
export class TestResultComponent implements OnInit, OnDestroy {
  // UI States
  viewState: 'result' | 'universities' = 'result';
  isLoading: boolean = false;
  splashText: string = '';
  locationInput: string = '';
  resultError: ResultStateNotice | null = null;
  resultSourceNotice = '';
  isLoadingAnswers = false;
  answersError = '';

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
  hasRadarData = false;
  radarChartData: ChartConfiguration<'radar'>['data'] = {
    labels: ['Ciencia', 'Tecnología', 'Ingeniería', 'Arte', 'Matemáticas'],
    datasets: [
      {
        label: 'Perfil STEAM',
        data: [0, 0, 0, 0, 0],
        borderColor: '#07B1C9',
        backgroundColor: 'rgba(7, 177, 201, 0.18)',
        pointBackgroundColor: ['#07B1C9', '#6366F1', '#F88718', '#EC4899', '#4DB046'],
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#07B1C9',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5
      }
    ]
  };
  radarChartOptions: ChartOptions<'radar'> = this.createRadarChartOptions();

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
  // Resultado local/experimental: se calcula en frontend y no cambia contratos ni envios a API.
  localVocationalResult: LocalVocationalTestResult | null = null;
  localProfileFeedback: 'represents' | 'not_represents' | null = null;
  showAllCareerRecommendations = false;

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private testService = inject(VocationTestService);
  private localVocationalResultService = inject(LocalVocationalResultService);
  private localVocationalCalibrationService = inject(LocalVocationalCalibrationService);
  private careerSimulatorService = inject(CareerSimulatorService);
  private themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private themeSubscription?: Subscription;

  // STEAM area metadata palette
  private readonly STEAM_META: Record<string, { label: string; gradientStart: string; gradientEnd: string; icon: string }> = {
    ciencia:      { label: 'Ciencia',      gradientStart: '#07B1C9', gradientEnd: '#0E9AA7', icon: 'flask-conical' },
    tecnologia:   { label: 'Tecnología',   gradientStart: '#6366F1', gradientEnd: '#07B1C9', icon: 'cpu'           },
    ingenieria:   { label: 'Ingeniería',   gradientStart: '#F88718', gradientEnd: '#FBBF24', icon: 'wrench'        },
    arte:         { label: 'Arte',         gradientStart: '#EC4899', gradientEnd: '#A855F7', icon: 'palette'       },
    artes:        { label: 'Artes',        gradientStart: '#EC4899', gradientEnd: '#A855F7', icon: 'palette'       },
    matematicas:  { label: 'Matemáticas',  gradientStart: '#4DB046', gradientEnd: '#22D3EE', icon: 'sigma'         },
  };

  private readonly RADAR_AREAS: Array<{ key: string; scoreKeys: string[]; label: string }> = [
    { key: 'ciencia', scoreKeys: ['ciencia'], label: 'Ciencia' },
    { key: 'tecnologia', scoreKeys: ['tecnologia', 'tecnología'], label: 'Tecnología' },
    { key: 'ingenieria', scoreKeys: ['ingenieria', 'ingeniería'], label: 'Ingeniería' },
    { key: 'arte', scoreKeys: ['arte', 'artes'], label: 'Arte' },
    { key: 'matematicas', scoreKeys: ['matematicas', 'matemáticas'], label: 'Matemáticas' }
  ];

  private readonly SKILL_LABELS: Record<ComplementarySkillId, string> = {
    pensamiento_logico: 'Pensamiento lógico',
    creatividad: 'Creatividad',
    comunicacion: 'Comunicación',
    resolucion_de_problemas: 'Resolución de problemas',
    trabajo_en_equipo: 'Trabajo en equipo',
    liderazgo: 'Liderazgo',
    analisis_de_datos: 'Análisis de datos',
    pensamiento_critico: 'Pensamiento crítico'
  };

  // Properties for Answers Modal
  showAnswersModal: boolean = false;
  testAnswers: Record<string, string> = {};
  allQuestions: Question[] = [];

  // Metadata for PDF
  currentDate: Date = new Date();

  ngOnInit(): void {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(() => {
      this.radarChartOptions = this.createRadarChartOptions();
    });

    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.loadHistoricalResult(testId);
    } else {
      this.loadResults();
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  loadHistoricalResult(testId: string) {
    this.isLoading = true;
    this.splashText = 'Cargando análisis histórico...';
    this.resultError = null;
    this.resultSourceNotice = '';
    
    this.testService.getTestDetails(testId).subscribe({
      next: (result) => {
        this.processResult(result);
        this.testAnswers = result.answers || {};
        this.attachLocalResultFromCache(this.testAnswers, 'Resultado local calculado desde el historial disponible.');
        this.loadLocalFeedbackState();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load historical result:', err);
        this.isLoading = false;
        this.resultError = {
          title: 'No pudimos abrir este resultado',
          message: 'El historial no respondió en este momento. Puedes reintentar o volver al historial sin perder tus datos.',
          type: 'api',
          actionLabel: 'Reintentar'
        };
        this.toastService.showToast('No se pudo cargar este test.', 'error');
      }
    });
  }

  loadResults() {
    if (this.isLoading) return;
    this.resultError = null;
    this.resultSourceNotice = '';

    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';

    const answersStr = localStorage.getItem(`test_answers_${userId}`) || localStorage.getItem('latest_test_answers');
    if (!answersStr) {
      console.warn('No test answers found.');
      this.resultError = {
        title: 'No encontramos respuestas guardadas',
        message: 'Para calcular tu perfil necesitamos que termines el test. Si ya lo hiciste, intenta abrir el resultado desde el historial.',
        type: 'missing',
        actionLabel: 'Hacer test'
      };
      this.toastService.showToast('No se encontraron las respuestas del test.', 'error');
      return;
    }
    const answers = JSON.parse(answersStr);
    const savedQuestions = this.getCachedQuestions(userId);
    const localResult = this.buildLocalVocationalResult(
      answers,
      savedQuestions,
      'Resultado experimental calculado localmente al terminar el test.'
    );

    const savedLocation = localStorage.getItem(`test_location_${userId}`) || localStorage.getItem('latest_test_location') || '';
    if (savedLocation) {
      this.locationInput = savedLocation;
    }

    this.isLoading = true;
    this.splashText = 'Analizando tu perfil STEAM...';

    this.testService.submitTest(answers, savedLocation).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          console.warn(`Retry ${retryCount} for AI analysis...`);
          this.splashText = 'La IA está analizando profundamente... un momento más.';
          return timer(8000);
        }
      })
    ).subscribe({
      next: (result) => {
        // Save raw scores
        localStorage.setItem(`test_raw_scores_${userId}`, JSON.stringify(result.scores));
        // Apply weighted calculation using calibration modules
        result.scores = this.testService.calculateWeightedScores(result.scores, userId);

        const combinedResult = this.withLocalExperimentalResult(result, localResult);
        localStorage.setItem(`test_result_${userId}`, JSON.stringify(combinedResult));
        this.cacheLocalVocationalResult(userId, localResult);
        this.processResult(combinedResult);
        this.testAnswers = answers; // Guardamos las respuestas actuales
        this.loadLocalFeedbackState();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load results:', err);
        this.isLoading = false;
        if (localResult) {
          const fallbackResult = this.toLocalFallbackResponse(localResult);
          localStorage.setItem(`test_result_${userId}`, JSON.stringify(fallbackResult));
          this.cacheLocalVocationalResult(userId, localResult);
          this.processResult(fallbackResult);
          this.testAnswers = answers;
          this.loadLocalFeedbackState();
          this.resultSourceNotice = 'La API o IA no respondió a tiempo. Mostramos un resultado algorítmico local para que puedas avanzar sin perder orientación.';
          this.toastService.showToast(
            'No se pudo completar el análisis de API. Mostramos un resultado experimental local.',
            'info',
            'Resultado local'
          );
          return;
        }

        const cachedResult = this.getCachedResult(userId);
        if (cachedResult) {
          this.processResult(cachedResult);
          this.testAnswers = answers;
          this.loadLocalFeedbackState();
          this.resultSourceNotice = 'No se pudo actualizar el análisis. Se mantiene el último resultado guardado mientras la API vuelve a estar disponible.';
          this.toastService.showToast(
            'No se pudo actualizar el análisis. Se mantiene el último resultado guardado.',
            'info',
            'Resultado anterior'
          );
          return;
        }

        this.resultError = {
          title: 'No pudimos procesar el resultado',
          message: 'Falló el análisis de API y no encontramos un resultado local suficiente. Reintenta o vuelve al test para generar nuevas respuestas.',
          type: 'ia',
          actionLabel: 'Reintentar'
        };
        this.toastService.showToast('Error al procesar el test con la IA. Por favor intenta de nuevo.', 'error', 'Error del Servidor');
      }
    });
  }

  private processResult(result: TestSubmissionResponse | any) {
    this.localVocationalResult = result.localExperimentalResult || result.localVocationalResult || this.localVocationalResult;
    this.userProfile.dominantTraits = result.dominantTraits || this.localVocationalResult?.strengthProfile.primaryCombination || '';
    this.userProfile.description = result.aiProfileDescription || this.localVocationalResult?.strengthProfile.explanation || '';
    this.recommendedUniversities = result.recommendations || [];

    const scores = this.resolveDisplayScores(result);
    this.buildSteamChart(scores);
    this.buildGreeting();
    this.buildCareerCards(this.recommendedUniversities);
  }

  get localTopSkills() {
    return this.localVocationalResult?.strengthProfile.rankedSkills
      .filter((skill) => skill.normalizedScore > 0)
      .slice(0, 5) || [];
  }

  get localTopAreas() {
    return this.localVocationalResult?.strengthProfile.rankedAreas
      .filter((area) => area.normalizedScore > 0)
      .slice(0, 5) || [];
  }

  get localCareerRecommendations() {
    return this.localVocationalResult?.careerRecommendations.recommendations || [];
  }

  get dominantProfileLabel(): string {
    return this.localVocationalResult?.strengthProfile.primaryCombination
      || this.userProfile.dominantTraits
      || 'Perfil STEAM';
  }

  get confidenceValue(): 'baja' | 'media' | 'alta' {
    return this.localVocationalResult?.strengthProfile.confidence || 'media';
  }

  get confidenceLabel(): string {
    const labelByConfidence = {
      baja: 'Confianza baja',
      media: 'Confianza media',
      alta: 'Confianza alta'
    };
    return labelByConfidence[this.confidenceValue];
  }

  get confidenceExplanation(): string {
    const missingSignals = this.localVocationalResult?.strengthProfile.missingSignals || [];
    if (this.confidenceValue === 'baja') {
      const reasons = missingSignals.length > 0 ? `: ${missingSignals.join(', ').toLowerCase()}` : ' porque faltan señales complementarias';
      return `Confianza baja${reasons}. Completa calibraciones o simuladores para afinar el perfil.`;
    }
    if (this.confidenceValue === 'alta') {
      return 'Confianza alta porque hay test, calibración y simuladores suficientes para sostener una lectura más completa.';
    }
    return 'Confianza media porque el test ya aporta una base clara, aunque aún puede mejorar con calibraciones o simuladores.';
  }

  get radarTextSummary(): string {
    if (!this.hasRadarData) {
      return 'ADN STEAM sin puntajes suficientes para graficar todavía.';
    }

    const areaSummary = this.steamAreas
      .map((area) => `${area.label}: ${area.percentage}%`)
      .join(', ');
    const dominantArea = this.topThree[0]?.label || this.dominantProfileLabel;
    const secondaryArea = this.topThree[1]?.label || 'sin área secundaria clara';
    return `ADN STEAM del resultado: área dominante ${dominantArea}; área secundaria ${secondaryArea}. Puntajes: ${areaSummary}.`;
  }

  get reportUserName(): string {
    return this.authService.getCurrentUser()?.nombre || '';
  }

  get reportSecondaryArea(): string {
    return this.localVocationalResult?.strengthProfile.secondaryArea?.label
      || this.topThree[1]?.label
      || '';
  }

  get reportCareerRecommendations(): PdfCareerRecommendation[] {
    if (this.localCareerRecommendations.length > 0) {
      return this.localCareerRecommendations.slice(0, 5).map((match) => ({
        name: match.career.name,
        compatibilityPercentage: match.compatibilityPercentage,
        reason: match.mainReasons.join(' ') || match.career.profileMatchReasons[0],
        sourceLabel: match.dataSource === 'mock' ? 'Local/mock temporal' : match.dataSource.toUpperCase(),
        areas: match.matchingAreas.map((area) => this.getSteamAreaLabel(area))
      }));
    }

    return this.recommendedUniversities.slice(0, 5).map((recommendation, index) => ({
      name: recommendation.suggestedMajor,
      compatibilityPercentage: this.getMatchScore(index),
      reason: recommendation.matchReason,
      sourceLabel: 'API'
    }));
  }

  get reportUniversityRecommendations(): PdfUniversityRecommendation[] {
    return this.recommendedUniversities
      .filter((recommendation) => recommendation.name && recommendation.name !== 'Resultado local')
      .slice(0, 5)
      .map((recommendation, index) => ({
        name: recommendation.name,
        location: recommendation.location,
        suggestedMajor: recommendation.suggestedMajor,
        matchReason: recommendation.matchReason,
        matchPercentage: this.getMatchScore(index),
        dataSourceLabel: recommendation.websiteUrl === '#' ? 'local' : 'API',
        warnings: recommendation.studyPlan?.includes('Datos insuficientes')
          ? ['Falta validar oferta académica real de esta universidad.']
          : []
      }));
  }

  get reportCalibrationSummaries(): PdfProgressItem[] {
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const storedSignals = this.localVocationalCalibrationService.getStoredSignalResults(userId);
    if (storedSignals.length > 0) {
      return storedSignals.map((signal) => ({
        title: signal.moduleTitle,
        description: signal.explanation,
        meta: `${signal.positiveSignals} señal(es) positiva(s), ${signal.noExperienceAnswers} respuesta(s) sin experiencia`,
        dataSourceLabel: signal.dataSource
      }));
    }

    return (this.authService.getCurrentUser()?.calibrationModules || [])
      .filter((module) => module.status === 'completed')
      .map((module) => {
        const localModule = this.localVocationalCalibrationService.getModuleById(module.id);
        return {
          title: localModule?.title || this.humanizeSlug(module.id),
          description: 'Completada. El detalle local estará disponible cuando se guarde la señal de calibración.',
          dataSourceLabel: 'api'
        };
      });
  }

  get reportSimulatorSummaries(): PdfProgressItem[] {
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const simulatorSignals = this.careerSimulatorService.getStoredVocationalSignals(userId);
    const signalIds = new Set(simulatorSignals.map((signal) => signal.careerId));
    const fromSignals = simulatorSignals.map((signal) => ({
      title: signal.careerName,
      description: signal.explanation,
      meta: `Afinidad ${signal.affinityScore}% · confianza ${signal.confidence}`,
      dataSourceLabel: signal.dataSource
    }));

    const fromCompletedSlugs = this.careerSimulatorService.getCompletedSimulators()
      .filter((slug) => !signalIds.has(slug))
      .map((slug) => ({
        title: this.humanizeSlug(slug),
        description: 'Completado. Falta una señal vocacional detallada para este simulador.',
        dataSourceLabel: 'local'
      }));

    return [...fromSignals, ...fromCompletedSlugs];
  }

  get reportNextSteps(): PdfNextStep[] {
    const primaryStep = {
      title: this.nextStepRecommendation.title,
      description: this.nextStepRecommendation.description
    };
    const baselineSteps: PdfNextStep[] = [
      primaryStep,
      {
        title: 'Conversar el resultado',
        description: 'Comparte este reporte con un orientador, tutor o docente para contrastarlo con tus intereses reales.'
      },
      {
        title: 'Validar oferta académica',
        description: 'Antes de decidir, revisa planes de estudio, costos, becas, convocatoria y requisitos oficiales.'
      }
    ];

    return baselineSteps.filter((step, index, list) =>
      list.findIndex((item) => item.title === step.title) === index
    );
  }

  get reportDataSourceNote(): string {
    if (this.localVocationalResult?.isExperimental) {
      return 'Este reporte combina datos de la API con cálculos locales experimentales cuando están disponibles. Los datos mock o locales no deben leerse como definitivos.';
    }
    if (this.resultSourceNotice) {
      return this.resultSourceNotice;
    }
    return 'Las recomendaciones deben validarse con fuentes oficiales antes de tomar decisiones académicas.';
  }

  get hasInsufficientProfileData(): boolean {
    return this.confidenceValue === 'baja' || !this.hasRadarData || this.displayedCareerRecommendations.length === 0;
  }

  get displayedCareerRecommendations(): CareerRecommendationViewModel[] {
    const localMatches = this.localCareerRecommendations.map((match) => this.toCareerViewModel(match));
    const apiFallback = this.recommendedUniversities.map((recommendation, index) => ({
      name: recommendation.suggestedMajor,
      description: recommendation.matchReason || 'Recomendacion generada desde el resultado actual.',
      compatibilityPercentage: this.getMatchScore(index),
      mainReason: recommendation.matchReason || 'Coincide con el perfil vocacional detectado.',
      sourceLabel: 'API',
      matchingAreas: [],
      areasToStrengthen: []
    }));
    const recommendations = localMatches.length > 0 ? localMatches : apiFallback;
    return (this.showAllCareerRecommendations ? recommendations : recommendations.slice(0, 3));
  }

  get hasMoreCareerRecommendations(): boolean {
    const total = this.localCareerRecommendations.length || this.recommendedUniversities.length;
    return total > 3;
  }

  get nextStepRecommendation(): NextStepViewModel {
    const missingSignals = this.localVocationalResult?.strengthProfile.missingSignals || [];
    if (missingSignals.some((signal) => signal.toLowerCase().includes('calibracion') || signal.toLowerCase().includes('calibración'))) {
      return {
        title: 'Completar calibración',
        description: 'Mejora la confianza del perfil con módulos que revelan intereses y habilidades ocultas.',
        actionLabel: 'Ir a calibración',
        icon: 'target',
        route: '/dashboard'
      };
    }
    if (missingSignals.some((signal) => signal.toLowerCase().includes('simulador'))) {
      return {
        title: 'Probar un simulador',
        description: 'Pon a prueba una carrera en una situación práctica para confirmar si te representa.',
        actionLabel: 'Ver simuladores',
        icon: 'rocket',
        route: '/career-simulator'
      };
    }
    return {
      title: 'Explorar universidades',
      description: 'Ya tienes una lectura consistente. El siguiente paso es comparar opciones cercanas.',
      actionLabel: 'Ver universidades',
      icon: 'map-pin',
      route: '/explore'
    };
  }

  toggleCareerRecommendationList(): void {
    this.showAllCareerRecommendations = !this.showAllCareerRecommendations;
  }

  saveLocalProfileFeedback(feedback: 'represents' | 'not_represents'): void {
    this.localProfileFeedback = feedback;
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    localStorage.setItem(`test_feedback_${userId}`, JSON.stringify({
      feedback,
      localResultId: this.localVocationalResult?.id || null,
      createdAtIso: new Date().toISOString()
    }));
    this.toastService.showToast('Gracias. Guardamos tu feedback en este dispositivo.', 'success', 'Feedback local');
  }

  goToRecommendedNextStep(): void {
    this.router.navigate([this.nextStepRecommendation.route]);
  }

  retryResultLoad(): void {
    const testId = this.route.snapshot.paramMap.get('id');
    if (testId) {
      this.loadHistoricalResult(testId);
    } else {
      this.loadResults();
    }
  }

  goToTest(): void {
    this.router.navigate(['/evaluations']);
  }

  getSteamAreaLabel(area: SteamAreaId): string {
    return this.STEAM_META[area]?.label || area;
  }

  getSkillLabel(skill: ComplementarySkillId): string {
    return this.SKILL_LABELS[skill] || skill;
  }

  private toCareerViewModel(match: SteamCareerRecommendationMatch): CareerRecommendationViewModel {
    return {
      name: match.career.name,
      description: match.career.shortDescription,
      compatibilityPercentage: match.compatibilityPercentage,
      mainReason: match.mainReasons[0] || 'Coincide con tus áreas y habilidades principales.',
      sourceLabel: match.dataSource === 'mock' ? 'Local' : match.dataSource.toUpperCase(),
      matchingAreas: match.matchingAreas,
      areasToStrengthen: match.areasToStrengthen
    };
  }

  private loadLocalFeedbackState(): void {
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const feedbackState = this.parseJson<{ feedback?: 'represents' | 'not_represents' } | null>(
      localStorage.getItem(`test_feedback_${userId}`),
      null
    );
    this.localProfileFeedback = feedbackState?.feedback || null;
  }

  private attachLocalResultFromCache(answers: Record<string, string>, fallbackReason: string): void {
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';
    const cachedLocalResult = this.getCachedLocalVocationalResult(userId);
    if (cachedLocalResult) {
      this.localVocationalResult = cachedLocalResult;
      return;
    }

    const localResult = this.buildLocalVocationalResult(answers, this.getCachedQuestions(userId), fallbackReason);
    if (localResult) {
      this.localVocationalResult = localResult;
      this.cacheLocalVocationalResult(userId, localResult);
    }
  }

  private buildLocalVocationalResult(
    answers: Record<string, string>,
    questions: Question[],
    fallbackReason?: string
  ): LocalVocationalTestResult | null {
    try {
      const user = this.authService.getCurrentUser();
      const completedCalibrations = user?.calibrationModules?.filter((module) => module.status === 'completed').length || 0;
      return this.localVocationalResultService.buildResult({
        answers,
        questions,
        hasCompletedCalibrations: completedCalibrations > 0,
        completedSimulatorCount: this.getCompletedSimulatorCount(),
        calibrationSignals: this.localVocationalCalibrationService.getStoredSignalResults(user?.id || 'guest'),
        simulatorSignals: this.careerSimulatorService.getStoredVocationalSignals(user?.id || 'guest'),
        testResultCount: this.getStoredTestResultCount(user?.id || 'guest'),
        dataSource: 'local',
        fallbackReason
      });
    } catch (error) {
      console.error('Failed to build local vocational result:', error);
      return null;
    }
  }

  private withLocalExperimentalResult(
    result: TestSubmissionResponse,
    localResult: LocalVocationalTestResult | null
  ): TestSubmissionResponse & { localExperimentalResult?: LocalVocationalTestResult } {
    return localResult ? { ...result, localExperimentalResult: localResult } : result;
  }

  private toLocalFallbackResponse(localResult: LocalVocationalTestResult): TestSubmissionResponse & {
    localExperimentalResult: LocalVocationalTestResult;
  } {
    const topCareers = localResult.careerRecommendations.recommendations.slice(0, 3);

    return {
      testId: localResult.id,
      scores: this.toDisplayAreaScores(localResult),
      dominantTraits: localResult.strengthProfile.primaryCombination,
      aiProfileDescription: localResult.strengthProfile.explanation,
      recommendations: topCareers.map((match, index) => ({
        id: index,
        name: 'Resultado local',
        location: 'Disponible para conectar con universidades cercanas',
        suggestedMajor: match.career.name,
        matchReason: match.mainReasons.join(' '),
        keyDates: 'Consulta la convocatoria de la universidad de tu interés.',
        studyPlan: match.career.relatedSubjects,
        websiteUrl: '#'
      })),
      localExperimentalResult: localResult
    };
  }

  private toDisplayAreaScores(localResult: LocalVocationalTestResult | null): Record<string, number> {
    if (!localResult) return {};
    return {
      ciencia: localResult.strengthProfile.areaScores.ciencia,
      tecnologia: localResult.strengthProfile.areaScores.tecnologia,
      ingenieria: localResult.strengthProfile.areaScores.ingenieria,
      artes: localResult.strengthProfile.areaScores.arte,
      matematicas: localResult.strengthProfile.areaScores.matematicas
    };
  }

  private resolveDisplayScores(result: TestSubmissionResponse | any): Record<string, number> {
    const scores = result.scores || result.profileScores || {};
    if (scores && Object.keys(scores).length > 0) {
      return scores;
    }
    return this.toDisplayAreaScores(this.localVocationalResult);
  }

  private getCachedQuestions(userId: string): Question[] {
    return this.parseJson<Question[]>(
      localStorage.getItem(`test_questions_${userId}`) || localStorage.getItem('latest_test_questions'),
      []
    );
  }

  private getCachedResult(userId: string): (TestSubmissionResponse & { localExperimentalResult?: LocalVocationalTestResult }) | null {
    return this.parseJson<(TestSubmissionResponse & { localExperimentalResult?: LocalVocationalTestResult }) | null>(
      localStorage.getItem(`test_result_${userId}`),
      null
    );
  }

  private getCachedLocalVocationalResult(userId: string): LocalVocationalTestResult | null {
    return this.parseJson<LocalVocationalTestResult | null>(
      localStorage.getItem(`test_local_result_${userId}`),
      null
    );
  }

  private cacheLocalVocationalResult(userId: string, localResult: LocalVocationalTestResult | null): void {
    if (!localResult) return;
    localStorage.setItem(`test_local_result_${userId}`, JSON.stringify(localResult));
  }

  private getCompletedSimulatorCount(): number {
    const completed = this.parseJson<string[]>(localStorage.getItem('steam_completed_simulators'), []);
    return completed.length;
  }

  private getStoredTestResultCount(userId: string): number {
    const historicalResults = this.parseJson<unknown[]>(localStorage.getItem(`test_history_${userId}`), []);
    return Math.max(1, historicalResults.length || 1);
  }

  private humanizeSlug(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private parseJson<T>(rawValue: string | null, fallback: T): T {
    if (!rawValue) return fallback;
    try {
      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.warn('Failed to parse cached test data', error);
      return fallback;
    }
  }

  private buildSteamChart(scores: Record<string, number>) {
    const MAX_SCORE = 100; // Updated from 20 for the new weighted average system

    
    // Ensure scores object exists
    if (!scores || Object.keys(scores).length === 0) {
      console.warn('No scores provided to buildSteamChart');
      this.steamAreas = [];
      this.globalAffinityPct = 0;
      this.topThree = [];
      this.updateRadarChart(scores);
      return;
    }

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
    this.updateRadarChart(scores);

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

  private updateRadarChart(scores: Record<string, number>): void {
    const values = this.RADAR_AREAS.map((area) => this.getRadarAreaScore(scores, area.scoreKeys));
    this.hasRadarData = values.some((value) => value > 0);
    this.radarChartData = {
      labels: this.RADAR_AREAS.map((area) => area.label),
      datasets: [
        {
          ...this.radarChartData.datasets[0],
          data: values
        }
      ]
    };
    this.radarChartOptions = this.createRadarChartOptions();
  }

  private getRadarAreaScore(scores: Record<string, number>, scoreKeys: string[]): number {
    for (const key of scoreKeys) {
      const value = scores[key];
      if (Number.isFinite(value)) {
        return Math.min(Math.max(Math.round(value), 0), 100);
      }
    }
    return 0;
  }

  private createRadarChartOptions(): ChartOptions<'radar'> {
    const isDarkTheme = typeof document !== 'undefined' && document.body.classList.contains('dark-theme');
    const textColor = isDarkTheme ? '#E2E8F0' : '#334155';
    const mutedTextColor = isDarkTheme ? '#94A3B8' : '#64748B';
    const gridColor = isDarkTheme ? 'rgba(148, 163, 184, 0.24)' : 'rgba(100, 116, 139, 0.20)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            backdropColor: 'transparent',
            color: mutedTextColor,
            showLabelBackdrop: false
          },
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor,
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.formattedValue}%`
          }
        }
      }
    };
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

  async downloadPDF() {
    this.isLoading = true;
    this.splashText = 'Generando reporte profesional...';
    
    // Give UI a moment to show the loading screen
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const pdfTemplate = document.getElementById('pdf-report-template-wrapper') as HTMLElement;
      if (!pdfTemplate) throw new Error('No PDF template found');

      // Capture at high scale for maximum sharpness
      const canvas = await html2canvas(pdfTemplate, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 800, // Fixed width for A4 proportion
      });

      // Hide template again

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // PDF dimensions (A4: 210 x 297 mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate how many PDF pages we need
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pageWidth / imgWidth;
      const totalPdfHeight = imgHeight * ratio;
      
      let heightLeft = totalPdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, totalPdfHeight);
      heightLeft -= pageHeight;

      // If content is longer than one page, add more pages
      while (heightLeft > 0) {
        position = heightLeft - totalPdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, totalPdfHeight);
        heightLeft -= pageHeight;
      }
      
      const profileName = this.userProfile.dominantTraits ? this.userProfile.dominantTraits.replace(/\s+/g, '_') : 'Perfil';
      const fileName = `Reporte_STEAM_${profileName}.pdf`;
      pdf.save(fileName);

      this.toastService.showToast('Tu reporte profesional ha sido descargado.', 'success', '¡Listo!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toastService.showToast('Ocurrió un error al generar el PDF.', 'error', 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  navigateToUniversities() {
    this.router.navigate(['/explore']);
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
    this.resultSourceNotice = '';

    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';

    const answersStr = localStorage.getItem(`test_answers_${userId}`);
    const answers = answersStr ? JSON.parse(answersStr) : {};

    this.testService.submitTest(answers, this.locationInput).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          console.warn(`Retry ${retryCount} for AI search...`);
          this.splashText = 'Buscando las mejores opciones para ti...';
          return timer(8000);
        }
      })
    ).subscribe({
      next: (result) => {
        this.processResult(result);
        this.isLoading = false;
        this.viewState = 'universities';
        window.scrollTo({ top: 0, behavior: 'auto' });
      },
      error: (err) => {
        console.error('Error during AI Search:', err);
        this.isLoading = false;
        this.resultSourceNotice = 'No pudimos generar una nueva explicación con IA. Mantendremos el resultado algorítmico local y las recomendaciones disponibles.';
        this.toastService.showToast('Error al buscar universidades en la zona solicitada.', 'error');
      }
    });
  }

  updateLocation(newLocation: string) {
    this.locationInput = newLocation;
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';
    localStorage.setItem(`test_location_${userId}`, newLocation);
    
    this.startAISearch();
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
      this.isLoadingAnswers = true;
      this.answersError = '';
      this.testService.getQuestions().subscribe({
        next: (q) => {
          if (q && q.length > 0) this.allQuestions = q;
          this.isLoadingAnswers = false;
          if (!q || q.length === 0) {
            this.answersError = 'No encontramos las preguntas para cruzarlas con tus respuestas.';
          }
        },
        error: (err) => {
          console.error('Failed to load questions for answers modal:', err);
          this.isLoadingAnswers = false;
          this.answersError = 'No pudimos cargar las preguntas del test. Tus respuestas siguen guardadas, pero no podemos mostrarlas completas ahora.';
        }
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
