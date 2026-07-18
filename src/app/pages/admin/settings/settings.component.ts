import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  AdminService,
  SystemOverview,
  SystemServiceStatus,
} from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private admin = inject(AdminService);
  private dialog = inject(DialogService);
  private toast = inject(ToastService);

  overview: SystemOverview | null = null;
  isLoading = true;
  isRunningAction = false;
  errorMessage = '';

  readonly countLabels: Record<string, string> = {
    users: 'Usuarios',
    vocationalTests: 'Tests Completados',
    questions: 'Preguntas',
    activeQuestions: 'Preguntas Activas',
    simulators: 'Simuladores',
    universities: 'Universidades',
    aiLogs: 'Consultas IA',
    algorithmRuns: 'Corridas del Motor',
    calibrationDecks: 'Módulos de Calibración',
    careerCatalog: 'Carreras A7',
    vocationCatalog: 'Vocaciones A6',
    universityCache: 'Matches en Caché',
  };

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.admin.getSystemOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'No se pudo consultar la operación del sistema.';
        this.isLoading = false;
      },
    });
  }

  async clearCache(): Promise<void> {
    const cacheCount = this.overview?.counts['universityCache'] || 0;
    const confirmed = await this.dialog.confirm(
      'Vaciar Caché Operativa',
      `Se recalcularán ${cacheCount} coincidencias de universidades cuando vuelvan a solicitarse. También se retirarán códigos OTP vencidos.`,
      { confirmText: 'Vaciar caché', isDanger: true },
    );
    if (!confirmed) return;
    this.isRunningAction = true;
    this.admin.clearOperationalCache().subscribe({
      next: (result) => {
        this.isRunningAction = false;
        this.toast.showToast(
          `${result.universityMatchCacheDeleted} matches y ${result.expiredOtpCodesDeleted} OTP vencidos eliminados.`,
          'success',
        );
        this.loadOverview();
      },
      error: (error) => this.actionFailed(error),
    });
  }

  async cleanupOrphanOptions(): Promise<void> {
    const orphanCount = this.overview?.quality.orphanOptions || 0;
    if (!orphanCount) return;
    const confirmed = await this.dialog.confirm(
      'Eliminar Opciones Huérfanas',
      `Se eliminarán ${orphanCount} opciones que no pertenecen a ninguna pregunta. Las preguntas activas no se modificarán.`,
      { confirmText: 'Eliminar huérfanas', isDanger: true },
    );
    if (!confirmed) return;
    this.isRunningAction = true;
    this.admin.cleanupOrphanOptions().subscribe({
      next: (result) => {
        this.isRunningAction = false;
        this.toast.showToast(`${result.deleted} opciones huérfanas eliminadas.`, 'success');
        this.loadOverview();
      },
      error: (error) => this.actionFailed(error),
    });
  }

  statusLabel(service: SystemServiceStatus): string {
    if (service.status === 'operational') return 'Operativo';
    if (service.status === 'configured') return 'Configurado';
    if (service.status === 'degraded') return 'Degradado';
    return 'Sin Configurar';
  }

  statusIcon(service: SystemServiceStatus): string {
    if (service.status === 'operational') return 'check';
    if (service.status === 'configured') return 'settings-2';
    if (service.status === 'degraded') return 'triangle-alert';
    return 'circle-dashed';
  }

  get operationalCount(): number {
    return this.overview?.services.filter((service) => service.status === 'operational').length || 0;
  }

  get availableCount(): number {
    return this.overview?.services.filter((service) =>
      service.status === 'operational' || service.status === 'configured'
    ).length || 0;
  }

  get configuredCount(): number {
    return this.overview?.services.filter((service) => service.status === 'configured').length || 0;
  }

  get issueCount(): number {
    if (!this.overview) return 0;
    return Object.values(this.overview.quality).filter((value) => value > 0).length;
  }

  countEntries(): Array<{ key: string; label: string; value: number }> {
    return Object.entries(this.overview?.counts || {}).map(([key, value]) => ({
      key,
      label: this.countLabels[key] || key,
      value,
    }));
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toLocaleString('es-MX', { maximumFractionDigits: 1 })} MB`;
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return days ? `${days} d ${hours} h` : hours ? `${hours} h ${minutes} min` : `${minutes} min`;
  }

  private actionFailed(error: any): void {
    this.isRunningAction = false;
    this.toast.showToast(error.error?.message || 'La acción de mantenimiento no se completó.', 'error');
  }
}
