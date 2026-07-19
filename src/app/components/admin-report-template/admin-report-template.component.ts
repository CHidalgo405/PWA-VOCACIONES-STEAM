import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-report-template',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div id="admin-report-template" class="admin-pdf-container">
      <!-- Cover/Header -->
      <div class="report-header">
        <div class="header-left">
          <h1>Reporte Ejecutivo de Gestión</h1>
          <p class="subtitle">Plataforma Vocaciones STEAM</p>
        </div>
        <div class="header-right">
          <div class="report-date">{{ currentDate | date:'MMMM yyyy' | uppercase }}</div>
          <div class="report-id">ID: STM-{{ currentDate | date:'yyyyMMdd' }}</div>
        </div>
      </div>

      <div class="report-body">
        <!-- KPI Section -->
        <div class="section-title">Indicadores Clave de Desempeño (KPIs)</div>
        <div class="kpi-grid">
          <div class="kpi-box" *ngFor="let kpi of kpis">
            <div class="kpi-meta">
              <span class="kpi-label">{{ kpi.title }}</span>
              <span class="kpi-trend">{{ kpi.trend }}</span>
            </div>
            <div class="kpi-main">
              <span class="kpi-val">{{ kpi.value }}</span>
            </div>
          </div>
        </div>

        <div class="two-column-grid">
          <!-- Left: Distribution Summary -->
          <div class="chart-summary-box">
            <div class="section-title">Distribución de Perfiles STEAM</div>
            <p class="description">Análisis porcentual de los perfiles dominantes detectados en los últimos tests completados por la población estudiantil.</p>
            <div class="stats-list">
              <div class="stat-item" *ngFor="let label of chartLabels; let i = index">
                <span class="stat-color" [style.background-color]="chartColors[i]"></span>
                <span class="stat-label">{{ label }}</span>
                <span class="stat-value">{{ chartData[i] }}%</span>
              </div>
            </div>
          </div>

          <!-- Right: Alerts/Status -->
          <div class="status-summary-box">
            <div class="section-title">Estado del Ecosistema</div>
            <div class="status-list">
              <div class="status-item success">
                <span class="status-icon">🗄️</span>
                <div>
                  <strong>Persistencia</strong>
                  <p>Los datos se almacenan en PostgreSQL. Consulta la Torre de Control para conocer su estado en tiempo real.</p>
                </div>
              </div>
              <div class="status-item success">
                <span class="status-icon">🧭</span>
                <div>
                  <strong>Motor vocacional</strong>
                  <p>Cálculo determinista y explicable para el perfil A1–A7.</p>
                </div>
              </div>
              <div class="status-item success">
                <span class="status-icon">✨</span>
                <div>
                  <strong>IA para universidades</strong>
                  <p>Uso acotado al refinamiento A8. Consulta Monitoreo de IA para conocer sus métricas reales.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity Table -->
        <div class="section-title">Actividad Reciente de Usuarios</div>
        <div class="activity-table">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Perfil Detectado</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of recentUsers">
                <td>
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </td>
                <td><span class="profile-tag">{{ user.profile }}</span></td>
                <td>{{ user.date }}</td>
                <td>{{ user.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-footer">
        <div class="footer-line"></div>
        <div class="footer-content">
          <span>© {{ currentDate | date:'yyyy' }} Vocaciones STEAM Admin Panel</span>
          <span>Generado confidencialmente</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-pdf-container {
      width: 800px;
      background: white;
      color: #1e293b;
      font-family: 'Inter', sans-serif;
      padding: 0;
      margin: 0;
    }

    .report-header {
      background: #0f172a;
      color: white;
      padding: 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 { margin: 0; font-size: 28px; font-weight: 800; }
      .subtitle { margin: 5px 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
      
      .header-right { text-align: right; }
      .report-date { font-size: 16px; font-weight: 700; color: #07B1C9; }
      .report-id { font-size: 12px; color: #64748b; margin-top: 5px; }
    }

    .report-body { padding: 40px 50px; }

    .section-title {
      font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 20px;
      text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #07B1C9; padding-left: 15px;
    }

    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px;
    }

    .kpi-box {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;
      .kpi-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
      .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }
      .kpi-trend { font-size: 10px; font-weight: 700; color: #10b981; }
      .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; }
    }

    .two-column-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }

    .description { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }

    .stats-list { display: flex; flex-direction: column; gap: 10px; }
    .stat-item {
      display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600;
      .stat-color { width: 12px; height: 12px; border-radius: 3px; }
      .stat-label { flex: 1; }
      .stat-value { color: #0f172a; }
    }

    .status-list { display: flex; flex-direction: column; gap: 15px; }
    .status-item {
      display: flex; gap: 15px; padding: 15px; border-radius: 12px; font-size: 12px;
      .status-icon { font-size: 20px; }
      strong { display: block; margin-bottom: 3px; }
      p { margin: 0; line-height: 1.4; color: #475569; }
      &.warning { background: #fffbeb; border: 1px solid #fde68a; }
      &.success { background: #f0fdf4; border: 1px solid #bbf7d0; }
    }

    .activity-table {
      table {
        width: 100%; border-collapse: collapse;
        th { text-align: left; padding: 12px; font-size: 11px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .user-name { font-weight: 700; color: #0f172a; }
        .user-email { font-size: 11px; color: #94a3b8; }
        .profile-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #475569; }
      }
    }

    .report-footer {
      padding: 0 50px 50px;
      .footer-line { height: 1px; background: #e2e8f0; margin-bottom: 20px; }
      .footer-content { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 500; }
    }
  `]
})
export class AdminReportTemplateComponent {
  @Input() kpis: any[] = [];
  @Input() recentUsers: any[] = [];
  @Input() chartLabels: string[] = [];
  @Input() chartData: any = [];
  @Input() chartColors: any = [];
  @Input() currentDate: Date = new Date();
}
