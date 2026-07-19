import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts'; // Importante para la gráfica
import { ChartConfiguration } from 'chart.js';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { AdminReportTemplateComponent } from '../../../components/admin-report-template/admin-report-template.component';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { withMinDuration } from '../../../core/utils/with-min-duration';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Alert { type: 'warning' | 'success' | 'info'; text: string; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, LucideIconComponent, AdminReportTemplateComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private toastService = inject(ToastService);
  private adminService = inject(AdminService);

  isLoading = true;
  loadError = false;

  // 1. KPIs — se llenan con datos reales en ngOnInit.
  kpis: { title: string; value: string; icon: string; color: string; trend: string }[] = [];

  // 2. Gráfica de anillo (distribución real de perfiles STEAM dominantes)
  public doughnutChartLabels: string[] = ['Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];
  public doughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    {
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#07B1C9', '#10b981', '#4DB046', '#F88718', '#E8372D'],
      hoverOffset: 4
    }
  ];
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  hasProfileData = false;

  // 3. Actividad reciente (usuarios recién registrados + su último test)
  recentUsers: { name: string; email: string; profile: string; date: string; status: string }[] = [];

  // 4. Alertas derivadas de datos reales
  alerts: Alert[] = [];

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.isLoading = true;
    this.loadError = false;
    withMinDuration(this.adminService.getStats()).subscribe({
      next: (stats) => {
        this.applyStats(stats);
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
        this.toastService.showToast('No se pudieron cargar las métricas.', 'error');
      },
    });
  }

  private applyStats(stats: AdminStats): void {
    const t = stats.totals;

    this.kpis = [
      { title: 'Usuarios Totales', value: this.fmt(t.users), icon: 'users', color: '#07B1C9', trend: `${t.students} estudiantes` },
      { title: 'Tests Completados', value: this.fmt(t.tests), icon: 'clipboard-list', color: '#4DB046', trend: `+${t.testsThisWeek} esta semana` },
      { title: 'Simuladores', value: this.fmt(t.simulators), icon: 'gamepad-2', color: '#F88718', trend: `${t.questions} preguntas activas` },
      { title: 'Cuentas Moderadas', value: this.fmt(t.moderated), icon: 'shield', color: '#E8372D', trend: t.moderated === 0 ? 'Sin incidencias' : 'Suspendidas/baneadas' },
    ];

    const d = stats.distribution;
    const data = [d.ciencia, d.tecnologia, d.ingenieria, d.artes, d.matematicas];
    this.doughnutChartDatasets = [{ ...this.doughnutChartDatasets[0], data }];
    this.hasProfileData = data.some((n) => n > 0);

    this.recentUsers = (stats.recentUsers || []).map((u) => ({
      name: u.fullname,
      email: u.email,
      profile: u.dominantTraits || 'Sin test',
      date: this.relativeDate(u.createdAt),
      status: u.hasTest ? 'Completado' : 'Pendiente',
    }));

    this.alerts = this.buildAlerts(stats);
  }

  private buildAlerts(stats: AdminStats): Alert[] {
    const t = stats.totals;
    const list: Alert[] = [];
    if (t.moderated > 0) {
      list.push({ type: 'warning', text: `${t.moderated} cuenta(s) suspendida(s) o baneada(s).` });
    }
    list.push({ type: 'success', text: `${t.testsThisMonth} test(s) completado(s) en los últimos 30 días.` });
    list.push({ type: 'info', text: `${t.students} estudiante(s) registrado(s) en la plataforma.` });
    return list;
  }

  private fmt(n: number): string {
    return (n ?? 0).toLocaleString('es-MX');
  }

  private relativeDate(iso: string): string {
    const then = new Date(iso).getTime();
    const diffH = Math.floor((Date.now() - then) / 3600000);
    if (diffH < 1) return 'Hace minutos';
    if (diffH < 24) return `Hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Ayer';
    if (diffD < 30) return `Hace ${diffD} días`;
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async exportDashboardPdf() {
    this.toastService.showToast('Generando reporte ejecutivo...', 'info', 'Descargando PDF');

    try {
      const pdfTemplate = document.getElementById('admin-report-template-wrapper') as HTMLElement;
      if (!pdfTemplate) throw new Error('No Admin Report template found');

      const canvas = await html2canvas(pdfTemplate, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 800
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pageWidth / imgWidth;
      const totalPdfHeight = imgHeight * ratio;
      
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

      pdf.save(`Reporte_Gestion_STEAM_${new Date().toLocaleDateString()}.pdf`);
      this.toastService.showToast('Reporte ejecutivo exportado.', 'success');
    } catch (error) {
      console.error('Error exporting admin dashboard PDF:', error);
      this.toastService.showToast('Error al generar el reporte ejecutivo.', 'error');
    }
  }

}
