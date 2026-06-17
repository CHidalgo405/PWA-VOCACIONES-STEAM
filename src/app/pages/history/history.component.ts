import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VocationTestService, TestHistorySummary } from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { STEAM_AREA_DEFINITIONS } from '../../core/data/vocational-steam.mock';
import type { SimulatorVocationalSignalResult } from '../../core/models/career-simulator.models';
import type {
  CalibrationModuleSignalResult,
  LocalVocationalTestResult,
  ProgressiveVocationalProfileLevel,
  SteamAreaId,
  VocationalProfileConfidenceEs
} from '../../core/models/vocational-steam.models';

type HistoryEventType = 'test' | 'calibration' | 'simulator' | 'university';

interface HistoryTimelineEvent {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  dateIso: string | null;
  label: string;
  icon: string;
  color: string;
  confidence?: VocationalProfileConfidenceEs;
  route?: string;
  dataSource: 'api' | 'local' | 'mock';
}

interface EvolutionSnapshot {
  id: ProgressiveVocationalProfileLevel;
  title: string;
  description: string;
  combination: string;
  confidence: VocationalProfileConfidenceEs | 'pendiente';
  status: 'available' | 'pending';
  icon: string;
}

interface AreaEvolutionRow {
  area: SteamAreaId;
  label: string;
  color: string;
  initialScore: number;
  currentScore: number;
  delta: number;
}

interface CareerEvolutionRow {
  name: string;
  compatibility: number;
  note: string;
  source: 'local' | 'mock' | 'api';
}

interface ConfidenceTimelinePoint {
  id: string;
  label: string;
  confidence: VocationalProfileConfidenceEs;
  dateIso: string | null;
  percentage: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, LucideIconComponent, FormsModule, HeaderComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  private testService = inject(VocationTestService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  testHistory: TestHistorySummary[] = [];
  latestTest: TestHistorySummary | null = null;
  previousTests: TestHistorySummary[] = [];
  maxMatchGlobal: number = 0;
  currentProfile: string = '';
  timelineEvents: HistoryTimelineEvent[] = [];
  evolutionSnapshots: EvolutionSnapshot[] = [];
  areaEvolution: AreaEvolutionRow[] = [];
  careerEvolution: CareerEvolutionRow[] = [];
  confidenceTimeline: ConfidenceTimelinePoint[] = [];
  hasInsufficientEvolutionData = true;
  hasLocalEvolutionData = false;
  localEvolutionNotice = 'La evolución usa datos API disponibles y señales locales de test, calibración, simulador o universidades cuando la API todavía no tiene esos campos.';
  
  isLoading: boolean = true;
  historyError: string = '';
  isRenaming: string | null = null;
  newTestName: string = '';

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.historyError = '';
    this.testService.getTestHistory().subscribe({
      next: (history) => {
        this.testHistory = history;
        if (history.length > 0) {
          this.latestTest = history[0];
          this.previousTests = history.slice(1);
          this.currentProfile = this.formatProfileLabel(this.latestTest.dominantTraits || 'Desconocido');
          this.calculateGlobalStats();
        } else {
          this.latestTest = null;
          this.previousTests = [];
          this.currentProfile = '-';
          this.maxMatchGlobal = 0;
        }
        this.buildEvolutionView();
        this.loadSavedUniversityEvents();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.historyError = 'No pudimos conectar con el historial de la API. Si hay señales locales en este dispositivo, las mostraremos como fallback.';
        this.toastService.showToast('No se pudo cargar el historial de tests.', 'error');
        this.testHistory = [];
        this.latestTest = null;
        this.previousTests = [];
        this.currentProfile = '-';
        this.maxMatchGlobal = 0;
        this.buildEvolutionView();
        this.loadSavedUniversityEvents();
        this.isLoading = false;
      }
    });
  }

  calculateGlobalStats() {
    let maxScore = 0;
    this.testHistory.forEach(test => {
      if (test.profileScores) {
        const scores = Object.values(test.profileScores);
        const testMax = Math.max(...scores, 0);
        if (testMax > maxScore) {
          maxScore = testMax;
        }
      }
    });
    this.maxMatchGlobal = this.scoreToPercentage(maxScore);
  }

  startRename(test: TestHistorySummary, event: Event) {
    event.stopPropagation();
    this.isRenaming = test.id;
    this.newTestName = test.testName;
  }

  saveRename(test: TestHistorySummary, event: Event) {
    event.stopPropagation();
    if (!this.newTestName.trim()) {
      this.cancelRename(event);
      return;
    }

    this.testService.updateTestName(test.id, this.newTestName).subscribe({
      next: () => {
        test.testName = this.newTestName;
        this.isRenaming = null;
        this.toastService.showToast('Nombre actualizado', 'success');
      },
      error: (err) => {
        console.error('Failed to update name', err);
        this.toastService.showToast('Error al renombrar el test', 'error');
        this.isRenaming = null;
      }
    });
  }

  cancelRename(event: Event) {
    event.stopPropagation();
    this.isRenaming = null;
  }

  deleteTest(testId: string, event: Event) {
    event.stopPropagation();
    const confirmMessage = [
      '¿Deseas eliminar este test permanentemente?',
      'Esto puede afectar comparaciones del historial y el perfil inicial si este resultado formaba parte de tu evolución local.',
      'No elimina calibraciones, simuladores ni universidades guardadas.'
    ].join('\n\n');

    if (!confirm(confirmMessage)) {
      return;
    }

    this.testService.deleteTest(testId).subscribe({
      next: () => {
        this.testHistory = this.testHistory.filter(t => t.id !== testId);
        
        // Re-calculate derived arrays and stats
        if (this.testHistory.length > 0) {
          this.latestTest = this.testHistory[0];
          this.previousTests = this.testHistory.slice(1);
          this.currentProfile = this.formatProfileLabel(this.latestTest.dominantTraits || 'Desconocido');
          this.calculateGlobalStats();
        } else {
          this.latestTest = null;
          this.previousTests = [];
          this.currentProfile = '-';
          this.maxMatchGlobal = 0;
        }
        this.buildEvolutionView();

        this.toastService.showToast('Test eliminado', 'success');
      },
      error: (err) => {
        console.error('Failed to delete test', err);
        this.toastService.showToast('Error al eliminar el test', 'error');
      }
    });
  }

  getSteamIcon(dominantTraits: string): string {
    const trait = dominantTraits?.toLowerCase() || '';
    if (trait.includes('ciencia')) return 'flask-conical';
    if (trait.includes('tecnolog') || trait.includes('tecnología')) return 'cpu';
    if (trait.includes('ingenier')) return 'wrench';
    if (trait.includes('arte')) return 'palette';
    if (trait.includes('matem')) return 'sigma';
    return 'star';
  }

  getSteamColor(dominantTraits: string): string {
    const trait = dominantTraits?.toLowerCase() || '';
    if (trait.includes('ciencia')) return '#07B1C9';
    if (trait.includes('tecnolog') || trait.includes('tecnología')) return '#6366F1';
    if (trait.includes('ingenier')) return '#F88718';
    if (trait.includes('arte')) return '#EC4899';
    if (trait.includes('matem')) return '#4DB046';
    return '#94A3B8';
  }

  getTopAreas(scores: Record<string, number>): { name: string, percentage: number, color: string }[] {
    if (!scores) return [];
    
    // Sort scores descending
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Take top 3

    return sorted.map(([name, score]) => {
      return {
        name: this.formatAreaName(name),
        percentage: this.scoreToPercentage(score),
        color: this.getSteamColor(name)
      };
    });
  }

  getMiniChartBars(scores: Record<string, number>): { height: number, color: string }[] {
    if (!scores) return [];
    
    // We can just take the first 5 or all of them, order doesn't strictly matter but maybe sorted by name or just use as is.
    const entries = Object.entries(scores).slice(0, 5);
    return entries.map(([name, score]) => {
      const percentage = this.scoreToPercentage(score);
      // We scale height for the mini chart (e.g. max height 30px)
      return {
        height: Math.max(10, (percentage / 100) * 30), // Min 10px height
        color: this.getSteamColor(name)
      };
    });
  }

  formatAreaName(name: string): string {
    const normalized = this.toSteamAreaId(name);
    if (normalized) {
      return STEAM_AREA_DEFINITIONS.find(area => area.id === normalized)?.label || name;
    }

    return (name || 'Sin área')
      .replace(/matematicas/gi, 'Matemáticas')
      .replace(/tecnologia/gi, 'Tecnología')
      .replace(/ingenieria/gi, 'Ingeniería')
      .replace(/\bartes\b/gi, 'Arte');
  }

  formatProfileLabel(value: string | null | undefined): string {
    if (!value) return 'Desconocido';
    return value
      .split('+')
      .map(part => this.formatAreaName(part.trim()))
      .join(' + ');
  }

  getConfidenceLabel(confidence: VocationalProfileConfidenceEs | 'pendiente' | undefined): string {
    if (confidence === 'alta') return 'Confianza alta';
    if (confidence === 'media') return 'Confianza media';
    if (confidence === 'baja') return 'Confianza baja';
    return 'Pendiente';
  }

  getConfidenceExplanation(confidence: VocationalProfileConfidenceEs | 'pendiente' | undefined): string {
    if (confidence === 'alta') return 'Test, calibración y simulador aportan señales consistentes.';
    if (confidence === 'media') return 'Hay test completo y al menos una señal adicional o suficiente evidencia teórica.';
    if (confidence === 'baja') return 'Faltan calibraciones, simuladores o respuestas suficientes para validar el perfil.';
    return 'Completa más actividades para desbloquear esta comparación.';
  }

  getEventDate(event: HistoryTimelineEvent): string {
    return event.dateIso || '';
  }

  getDeltaText(delta: number): string {
    if (delta > 0) return `+${delta}`;
    return `${delta}`;
  }

  trackByEventId(_: number, event: HistoryTimelineEvent): string {
    return event.id;
  }

  private buildEvolutionView(): void {
    const userId = this.getUserId();
    const localResult = this.readLocalJson<LocalVocationalTestResult | null>(`test_local_result_${userId}`, null);
    const calibrationSignals = this.readLocalJson<CalibrationModuleSignalResult[]>(`steam_calibration_signals_${userId}`, []);
    const simulatorSignals = this.readLocalJson<SimulatorVocationalSignalResult[]>(`steam_simulator_vocational_signals_${userId}`, []);
    this.hasLocalEvolutionData = Boolean(localResult) || calibrationSignals.length > 0 || simulatorSignals.length > 0;

    if (!this.latestTest && localResult) {
      this.currentProfile = this.formatProfileLabel(
        localResult.progressiveProfile?.strengthProfile.primaryCombination || localResult.strengthProfile.primaryCombination
      );
      const localMax = Math.max(...Object.values(localResult.strengthProfile.areaScores), 0);
      this.maxMatchGlobal = this.scoreToPercentage(localMax);
    }

    this.timelineEvents = [
      ...this.buildTestEvents(),
      ...this.buildCalibrationEvents(calibrationSignals),
      ...this.buildSimulatorEvents(simulatorSignals)
    ].sort((a, b) => this.dateValue(b.dateIso) - this.dateValue(a.dateIso));

    this.evolutionSnapshots = this.buildEvolutionSnapshots(localResult, calibrationSignals.length, simulatorSignals.length);
    this.areaEvolution = this.buildAreaEvolution(localResult);
    this.careerEvolution = this.buildCareerEvolution(localResult);
    this.confidenceTimeline = this.buildConfidenceTimeline(localResult, calibrationSignals, simulatorSignals);
    this.hasInsufficientEvolutionData = this.resolveInsufficientHistory(localResult, calibrationSignals, simulatorSignals);
  }

  private loadSavedUniversityEvents(): void {
    this.userService.getSavedUniversities().subscribe({
      next: (universities) => {
        const universityEvents = (universities || []).slice(0, 8).map((university, index) => this.toUniversityEvent(university, index));
        this.timelineEvents = [...this.timelineEvents.filter(event => event.type !== 'university'), ...universityEvents]
          .sort((a, b) => this.dateValue(b.dateIso) - this.dateValue(a.dateIso));
      },
      error: () => {
        // El historial API sigue funcionando aunque la API de universidades guardadas no responda.
      }
    });
  }

  private buildTestEvents(): HistoryTimelineEvent[] {
    return this.testHistory.map((test, index) => ({
      id: `test-${test.id}`,
      type: 'test',
      title: test.testName || `Test ${this.testHistory.length - index}`,
      description: `Perfil detectado: ${this.formatProfileLabel(test.dominantTraits)}.`,
      dateIso: test.completedAt,
      label: 'Test completado',
      icon: 'clipboard-check',
      color: this.getSteamColor(test.dominantTraits),
      route: `/test-result/${test.id}`,
      dataSource: 'api'
    }));
  }

  private buildCalibrationEvents(signals: CalibrationModuleSignalResult[]): HistoryTimelineEvent[] {
    return signals.map(signal => ({
      id: `calibration-${signal.id}`,
      type: 'calibration',
      title: signal.moduleTitle,
      description: signal.explanation || 'La calibración agregó señales de experiencias reales sin penalizar lo no probado.',
      dateIso: signal.generatedAtIso,
      label: 'Calibración completada',
      icon: 'sliders-horizontal',
      color: '#F88718',
      confidence: signal.confidenceBoost > 0 ? 'media' : 'baja',
      dataSource: signal.dataSource
    }));
  }

  private buildSimulatorEvents(signals: SimulatorVocationalSignalResult[]): HistoryTimelineEvent[] {
    return signals.map(signal => ({
      id: `simulator-${signal.id}`,
      type: 'simulator',
      title: signal.careerName,
      description: signal.explanation || 'El simulador aportó evidencia práctica sobre tus decisiones.',
      dateIso: signal.generatedAtIso,
      label: 'Simulador completado',
      icon: 'gamepad-2',
      color: '#6366F1',
      confidence: signal.confidence,
      dataSource: signal.dataSource
    }));
  }

  private toUniversityEvent(university: any, index: number): HistoryTimelineEvent {
    const name = university?.universityName || university?.name || 'Universidad guardada';
    const career = university?.careerName || university?.suggestedMajor || 'carrera por validar';
    const savedAt = university?.createdAt || university?.savedAt || university?.updatedAt || null;

    return {
      id: `university-${university?.id || name}-${index}`,
      type: 'university',
      title: name,
      description: `Exploraste o guardaste una opción vinculada con ${career}. Fecha exacta no disponible si la API no la entrega.`,
      dateIso: savedAt,
      label: 'Universidad explorada',
      icon: 'map-pin',
      color: '#4DB046',
      dataSource: 'api'
    };
  }

  private buildEvolutionSnapshots(
    localResult: LocalVocationalTestResult | null,
    calibrationCount: number,
    simulatorCount: number
  ): EvolutionSnapshot[] {
    const progressive = localResult?.progressiveProfile;
    const initialCombination = progressive?.comparison.initialCombination
      || localResult?.strengthProfile.primaryCombination
      || this.formatProfileLabel(this.latestTest?.dominantTraits)
      || 'Sin perfil inicial';
    const currentCombination = progressive?.strengthProfile.primaryCombination
      || localResult?.strengthProfile.primaryCombination
      || initialCombination;

    return [
      {
        id: 'perfil_inicial',
        title: 'Perfil inicial',
        description: 'Resultado base del test teórico.',
        combination: this.formatProfileLabel(initialCombination),
        confidence: localResult?.strengthProfile.confidence || (this.latestTest ? 'media' : 'pendiente'),
        status: this.latestTest || localResult ? 'available' : 'pending',
        icon: 'clipboard-list'
      },
      {
        id: 'perfil_calibrado',
        title: 'Perfil calibrado',
        description: 'Test ajustado con experiencias reales.',
        combination: calibrationCount > 0 ? this.formatProfileLabel(currentCombination) : 'Completa una calibración',
        confidence: calibrationCount > 0 ? (progressive?.confidence || 'media') : 'pendiente',
        status: calibrationCount > 0 ? 'available' : 'pending',
        icon: 'sliders-horizontal'
      },
      {
        id: 'perfil_validado',
        title: 'Perfil validado',
        description: 'Test y calibración contrastados con simulador.',
        combination: simulatorCount > 0 ? this.formatProfileLabel(currentCombination) : 'Completa un simulador',
        confidence: simulatorCount > 0 ? (progressive?.confidence || 'alta') : 'pendiente',
        status: simulatorCount > 0 ? 'available' : 'pending',
        icon: 'badge-check'
      }
    ];
  }

  private buildAreaEvolution(localResult: LocalVocationalTestResult | null): AreaEvolutionRow[] {
    const initialScores = this.latestTest?.profileScores || {};
    const currentScores = localResult?.progressiveProfile?.strengthProfile.areaScores
      || localResult?.strengthProfile.areaScores
      || initialScores;

    return STEAM_AREA_DEFINITIONS.map(area => {
      const initialScore = this.scoreToPercentage(this.getScoreForArea(initialScores, area.id));
      const currentScore = this.scoreToPercentage(this.getScoreForArea(currentScores, area.id));
      return {
        area: area.id,
        label: area.label,
        color: area.color,
        initialScore,
        currentScore,
        delta: currentScore - initialScore
      };
    });
  }

  private buildCareerEvolution(localResult: LocalVocationalTestResult | null): CareerEvolutionRow[] {
    const recommendations = localResult?.progressiveProfile?.careerRecommendations.recommendations
      || localResult?.careerRecommendations.recommendations
      || [];

    return recommendations.slice(0, 5).map((recommendation, index) => ({
      name: recommendation.career.name,
      compatibility: recommendation.compatibilityPercentage,
      note: index === 0
        ? 'Carrera principal actual según el algoritmo local.'
        : `Coincide por ${recommendation.matchingAreas.map(area => this.formatAreaName(area)).join(', ') || 'habilidades compatibles'}.`,
      source: recommendation.dataSource
    }));
  }

  private buildConfidenceTimeline(
    localResult: LocalVocationalTestResult | null,
    calibrationSignals: CalibrationModuleSignalResult[],
    simulatorSignals: SimulatorVocationalSignalResult[]
  ): ConfidenceTimelinePoint[] {
    const points: ConfidenceTimelinePoint[] = [];

    if (localResult || this.latestTest) {
      const confidence = localResult?.strengthProfile.confidence || 'media';
      points.push({
        id: 'confidence-test',
        label: 'Test teórico',
        confidence,
        percentage: this.confidenceToPercentage(confidence),
        dateIso: localResult?.generatedAtIso || this.latestTest?.completedAt || null
      });
    }

    calibrationSignals.forEach((signal, index) => {
      const confidence: VocationalProfileConfidenceEs = signal.confidenceBoost > 0 ? 'media' : 'baja';
      points.push({
        id: `confidence-calibration-${signal.id || index}`,
        label: signal.moduleTitle,
        confidence,
        percentage: this.confidenceToPercentage(confidence),
        dateIso: signal.generatedAtIso
      });
    });

    simulatorSignals.forEach((signal, index) => {
      points.push({
        id: `confidence-simulator-${signal.id || index}`,
        label: signal.careerName,
        confidence: signal.confidence,
        percentage: this.confidenceToPercentage(signal.confidence),
        dateIso: signal.generatedAtIso
      });
    });

    return points.sort((a, b) => this.dateValue(a.dateIso) - this.dateValue(b.dateIso));
  }

  private resolveInsufficientHistory(
    localResult: LocalVocationalTestResult | null,
    calibrationSignals: CalibrationModuleSignalResult[],
    simulatorSignals: SimulatorVocationalSignalResult[]
  ): boolean {
    const hasSeveralTests = this.testHistory.length > 1;
    const hasLocalSignals = Boolean(localResult) && (calibrationSignals.length > 0 || simulatorSignals.length > 0);
    return !hasSeveralTests && !hasLocalSignals;
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

  private confidenceToPercentage(confidence: VocationalProfileConfidenceEs): number {
    if (confidence === 'alta') return 100;
    if (confidence === 'media') return 68;
    return 36;
  }

  private dateValue(dateIso: string | null): number {
    if (!dateIso) return 0;
    const value = new Date(dateIso).getTime();
    return Number.isNaN(value) ? 0 : value;
  }
}
