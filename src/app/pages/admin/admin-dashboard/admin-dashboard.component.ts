import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { BaseChartDirective } from 'ng2-charts'; // Importante para la gráfica
import { ChartConfiguration } from 'chart.js';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { PdfReportTemplateComponent } from '../../../components/pdf-report-template/pdf-report-template.component';
import { AdminReportTemplateComponent } from '../../../components/admin-report-template/admin-report-template.component';
import { SteamArea } from '../../test-result/test-result.component';
import { UniversityRecommendation } from '../../../core/services/test.service';
import { inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, BaseChartDirective, LucideIconComponent, PdfReportTemplateComponent, AdminReportTemplateComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  private toastService = inject(ToastService);

  // 1. Datos para las tarjetas rápidas (KPIs)
  kpis = [
    { title: 'Usuarios Totales', value: '1,245', icon: 'users', color: '#07B1C9', trend: '+12% este mes' },
    { title: 'Tests Completados', value: '890', icon: 'clipboard-list', color: '#4DB046', trend: '+5% esta semana' },
    { title: 'IA API Status', value: 'Online', icon: 'bot', color: '#F88718', trend: '99.9% Uptime' },
    { title: 'Nuevos Cursos', value: '24', icon: 'book-open', color: '#E8372D', trend: 'Sincronizados hoy' }
  ];

  // 2. Configuración de la Gráfica de Anillo (Doughnut)
  public doughnutChartLabels: string[] = ['Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas'];
  public doughnutChartDatasets: ChartConfiguration<'doughnut'>['data']['datasets'] = [
    {
      data: [15, 30, 25, 10, 20],
      backgroundColor: [
        '#07B1C9', // C
        '#10b981', // T (Verde esmeralda para diferenciar)
        '#4DB046', // I
        '#F88718', // A
        '#E8372D'  // M
      ],
      hoverOffset: 4
    }
  ];
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  // 3. Datos para la tabla de actividad reciente
  recentUsers = [
    { name: 'Ana Sofía', email: 'ana@ejemplo.com', institution: 'UTCV', profile: 'Tecnología', date: 'Hace 2 horas', status: 'Completado' },
    { name: 'Carlos R.', email: 'carlos@ejemplo.com', institution: 'CBTIS 47', profile: 'Ingeniería', date: 'Hace 5 horas', status: 'Completado' },
    { name: 'Lucía M.', email: 'lucia@ejemplo.com', institution: 'Independiente', profile: 'Artes', date: 'Ayer', status: 'Pendiente' },
    { name: 'Jorge H.', email: 'jorge@ejemplo.com', institution: 'ESBAO', profile: 'Ciencia', date: 'Ayer', status: 'Completado' }
  ];

  // Data for individual student PDF
  selectedStudentPdf: any = {
    userName: '',
    dominantTraits: '',
    secondaryArea: '',
    confidenceLabel: '',
    confidenceExplanation: '',
    description: '',
    greeting: '',
    steamAreas: [] as SteamArea[],
    recommendations: [] as UniversityRecommendation[],
    careerRecommendations: [],
    universityRecommendations: [],
    simulatorSummaries: [],
    calibrationSummaries: [],
    nextSteps: [],
    dataSourceNote: ''
  };

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

  async downloadStudentPdf(user: any) {
    this.toastService.showToast(
      `Generando reporte vocacional para ${user.name}...`,
      'info',
      'Reporte Estudiante'
    );

    // 1. Mockup data for the student (In real app, fetch from API)
    this.selectedStudentPdf = {
      userName: user.name,
      dominantTraits: user.profile,
      secondaryArea: 'Tecnología',
      confidenceLabel: 'Confianza media',
      confidenceExplanation: 'Reporte de ejemplo generado desde administración con datos disponibles en la tabla.',
      greeting: `Hola, ${user.name}`,
      description: `Basado en los datos disponibles para ${user.name}, se observa un perfil orientado a ${user.profile}. Esta lectura debe validarse con historial, calibraciones y acompañamiento vocacional.`,
      steamAreas: [
        { label: user.profile, percentage: 95, icon: 'star', gradientStart: '#07B1C9' },
        { label: 'Tecnología', percentage: 80, icon: 'cpu', gradientStart: '#6366F1' },
        { label: 'Ciencia', percentage: 70, icon: 'flask-conical', gradientStart: '#10b981' }
      ] as any[],
      recommendations: [
        { suggestedMajor: `Ingeniería en ${user.profile}`, name: 'Universidad Politécnica', location: 'Ciudad de México', matchReason: 'Alta afinidad con el perfil analítico detectado.' }
      ] as any[],
      careerRecommendations: [
        {
          name: `Ingeniería en ${user.profile}`,
          compatibilityPercentage: 88,
          reason: 'Coincide con el perfil registrado en administración.',
          sourceLabel: 'Mock admin'
        }
      ],
      universityRecommendations: [
        {
          name: 'Universidad Politécnica',
          location: 'Ciudad de México',
          suggestedMajor: `Ingeniería en ${user.profile}`,
          matchReason: 'Ejemplo administrativo. Validar oferta académica real antes de compartir.',
          dataSourceLabel: 'mock'
        }
      ],
      simulatorSummaries: [],
      calibrationSummaries: [],
      nextSteps: [
        {
          title: 'Validar con resultados reales',
          description: 'Conectar este reporte administrativo al historial del estudiante cuando el endpoint esté disponible.'
        }
      ],
      dataSourceNote: 'Reporte de ejemplo administrativo con datos mock. No presentarlo como resultado definitivo.'
    };

    // 2. Wait for template to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Generate PDF
    try {
      const pdfTemplate = document.getElementById('pdf-report-template-wrapper') as HTMLElement;
      if (!pdfTemplate) throw new Error('No PDF template found');

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

      pdf.save(`Reporte_STEAM_${user.name.replace(/\s+/g, '_')}.pdf`);
      this.toastService.showToast('Reporte individual generado con éxito.', 'success');
    } catch (error) {
      console.error('Error generating student PDF:', error);
      this.toastService.showToast('No se pudo generar el reporte individual.', 'error');
    }
  }
}
