import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { PdfReportTemplateComponent } from '../../components/pdf-report-template/pdf-report-template.component';
import { VocationTestService, Question } from '../../core/services/test.service';
import { VocationalProfileService } from '../../core/services/vocational-profile.service';
import {
  VocationalProfile,
  SteamAxis,
  CalibrationModuleResult,
  SimulatorAffinityResult,
} from '../../core/models/vocational-profile.models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { HeaderComponent } from '../../components/header/header.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/** Vista de un eje STEAM con metadatos de presentación. */
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
  imports: [CommonModule, FormsModule, SplashScreenComponent, LucideIconComponent, PdfReportTemplateComponent, HeaderComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss'],
})
export class TestResultComponent implements OnInit {
  isLoading = false;
  splashText = '';

  /** Perfil calibrado completo (motor local). */
  profile: VocationalProfile | null = null;
  greeting = '';

  // ── Vista del desglose STEAM ──
  steamAreas: SteamArea[] = [];
  topThree: SteamArea[] = [];
  globalAffinityPct = 0;

  // Ring chart (anillo del eje dominante)
  readonly ringRadius = 72;
  ringOffset = 0;
  ringFilled = false;

  // Respuestas del test
  showAnswersModal = false;
  testAnswers: Record<string, string> = {};
  allQuestions: Question[] = [];

  currentDate = new Date();

  private profileEngine = inject(VocationalProfileService);
  private testService = inject(VocationTestService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Paleta de presentación por eje (concern de UI, no del motor)
  private readonly STEAM_META: Record<string, { label: string; gradientStart: string; gradientEnd: string; icon: string }> = {
    ciencia:     { label: 'Ciencia',     gradientStart: '#07B1C9', gradientEnd: '#0E9AA7', icon: 'flask-conical' },
    tecnologia:  { label: 'Tecnología',  gradientStart: '#6366F1', gradientEnd: '#07B1C9', icon: 'cpu' },
    ingenieria:  { label: 'Ingeniería',  gradientStart: '#F88718', gradientEnd: '#FBBF24', icon: 'wrench' },
    artes:       { label: 'Artes',       gradientStart: '#EC4899', gradientEnd: '#A855F7', icon: 'palette' },
    matematicas: { label: 'Matemáticas', gradientStart: '#4DB046', gradientEnd: '#22D3EE', icon: 'sigma' },
  };

  ngOnInit(): void {
    this.buildGreeting();
    this.loadResults();
  }

  /** Carga las señales persistidas y computa el perfil con el motor local. */
  private loadResults(): void {
    const user = this.authService.getCurrentUser();
    const userId = user?.id || 'guest';

    const scoresStr =
      localStorage.getItem(`test_theoretical_scores_${userId}`) ||
      localStorage.getItem('test_theoretical_scores_guest');

    if (!scoresStr) {
      this.toastService.showToast('No se encontraron resultados de tu test. Realiza el test teórico primero.', 'error');
      this.router.navigate(['/evaluations']);
      return;
    }

    const theoreticalScores: Record<string, number> = JSON.parse(scoresStr);
    const calibrationResults = this.readCalibrationResults(userId);
    const simulatorResults = this.readSimulatorResults(userId);

    this.isLoading = true;
    this.splashText = 'Calculando tu perfil vocacional...';

    // El cómputo es síncrono (local). Mantenemos un breve splash por UX.
    setTimeout(() => {
      this.profile = this.profileEngine.computeProfile(theoreticalScores, calibrationResults, simulatorResults);
      this.buildSteamChart(this.profile.steamScores);

      // Guardamos el perfil para el dashboard / historial local
      localStorage.setItem(`test_profile_${userId}`, JSON.stringify(this.profile));

      // Cargamos respuestas para el modal de revisión
      const answersStr = localStorage.getItem(`test_answers_${userId}`);
      this.testAnswers = answersStr ? JSON.parse(answersStr) : {};

      this.isLoading = false;
    }, 600);
  }

  /** Lee los resultados de calibración persistidos (si existen). */
  private readCalibrationResults(userId: string): CalibrationModuleResult[] {
    try {
      const raw = localStorage.getItem(`calibration_results_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Lee las afinidades de simuladores persistidas (si existen). */
  private readSimulatorResults(userId: string): SimulatorAffinityResult[] {
    try {
      const raw = localStorage.getItem(`simulator_results_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private buildSteamChart(scores: Record<SteamAxis, number>): void {
    this.steamAreas = Object.entries(scores)
      .map(([key, percentage]) => {
        const meta = this.STEAM_META[key] ?? { label: key, gradientStart: '#07B1C9', gradientEnd: '#0698AC', icon: 'star' };
        return {
          key,
          label: meta.label,
          color: meta.gradientStart,
          gradientStart: meta.gradientStart,
          gradientEnd: meta.gradientEnd,
          icon: meta.icon,
          rawScore: percentage,
          percentage,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    this.topThree = this.steamAreas.slice(0, 3);

    const top3Sum = this.topThree.reduce((s, a) => s + a.percentage, 0);
    this.globalAffinityPct = Math.round(top3Sum / Math.max(this.topThree.length, 1));

    setTimeout(() => {
      this.ringFilled = true;
      const pct = (this.topThree[0]?.percentage ?? 0) / 100;
      this.ringOffset = this.circumference(this.ringRadius) * (1 - pct);
    }, 300);
  }

  private buildGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = '¡Buenos días!';
    else if (hour < 19) this.greeting = '¡Buenas tardes!';
    else this.greeting = '¡Buenas noches!';
  }

  // ── Etiquetas de calibración ──
  get calibrationLabel(): string {
    switch (this.profile?.calibration.confidence) {
      case 'altamente_calibrado': return 'Altamente calibrado';
      case 'calibrado': return 'Calibrado';
      case 'en_calibracion': return 'En calibración';
      default: return 'Perfil inicial';
    }
  }

  get calibrationColor(): string {
    const lvl = this.profile?.calibration.level ?? 0;
    if (lvl >= 90) return '#4DB046';
    if (lvl >= 75) return '#07B1C9';
    if (lvl >= 60) return '#F88718';
    return '#94A3B8';
  }

  // ── Ring helpers ──
  circumference(r: number): number {
    return 2 * Math.PI * r;
  }

  // ── Navegación ──
  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToUniversities(): void {
    this.router.navigate(['/explore']);
  }

  goToSimulator(slug?: string): void {
    if (slug) this.router.navigate(['/career-simulator', slug]);
    else this.router.navigate(['/career-simulator']);
  }

  goToNextStep(route: string): void {
    this.router.navigate([route]);
  }

  // ── Modal de respuestas ──
  openAnswersModal(): void {
    this.showAnswersModal = true;
    if (this.allQuestions.length === 0) {
      this.testService.getQuestions().subscribe(q => {
        if (q && q.length > 0) this.allQuestions = q;
      });
    }
  }

  closeAnswersModal(): void {
    this.showAnswersModal = false;
  }

  getAnswerText(questionId: string, letter: string): string {
    const q = this.allQuestions.find(x => x.id === questionId);
    if (!q) return letter;
    const opt = q.options.find(o => o.letter === letter);
    return opt ? opt.text : letter;
  }

  // ── PDF ──
  async downloadPDF(): Promise<void> {
    this.isLoading = true;
    this.splashText = 'Generando reporte profesional...';
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const pdfTemplate = document.getElementById('pdf-report-template-wrapper') as HTMLElement;
      if (!pdfTemplate) throw new Error('No PDF template found');

      const canvas = await html2canvas(pdfTemplate, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = pageWidth / canvas.width;
      const totalPdfHeight = canvas.height * ratio;

      let heightLeft = totalPdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, totalPdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - totalPdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, totalPdfHeight);
        heightLeft -= pageHeight;
      }

      const profileName = this.profile?.profileName.replace(/\s+/g, '_') || 'Perfil';
      pdf.save(`Reporte_STEAM_${profileName}.pdf`);
      this.toastService.showToast('Tu reporte profesional ha sido descargado.', 'success', '¡Listo!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.toastService.showToast('Ocurrió un error al generar el PDF.', 'error', 'Error');
    } finally {
      this.isLoading = false;
    }
  }
}
