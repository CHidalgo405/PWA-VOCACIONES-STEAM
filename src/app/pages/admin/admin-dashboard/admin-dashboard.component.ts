import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { BaseChartDirective } from 'ng2-charts'; // Importante para la gráfica
import { ChartConfiguration } from 'chart.js';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, BaseChartDirective, LucideIconComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {

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
}