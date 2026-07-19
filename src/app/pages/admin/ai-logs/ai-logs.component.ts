import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { AdminService, AiLogsStatsResponse, RecentLogItem } from '../../../core/services/admin.service';

@Component({
  selector: 'app-ai-logs',
  standalone: true,
  imports: [CommonModule, LucideIconComponent],
  templateUrl: './ai-logs.component.html',
  styleUrls: ['./ai-logs.component.scss']
})
export class AiLogsComponent implements OnInit {

  private adminService = inject(AdminService);
  
  isLoading = true;
  errorMessage = '';

  // --- MÉTRICAS DE SALUD DE LA API ---
  apiHealth = {
    status: 'Cargando...', // Operativo, Degradado, Caído
    latency: '...',
    successRate: '...',
    tokensUsed: '...'
  };

  // --- LOGS DE LA IA ---
  logs: RecentLogItem[] = [];

  // --- ESTADO PARA EL MODAL ---
  selectedLog: RecentLogItem | null = null;
  isModalOpen = false;

  ngOnInit() {
    this.fetchLogs();
  }

  fetchLogs() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.adminService.getAiLogsStats().subscribe({
      next: (res: AiLogsStatsResponse) => {
        this.apiHealth.successRate = res.successRate || '0%';
        this.apiHealth.latency = res.averageLatency || '0ms';
        this.apiHealth.tokensUsed = res.totalTokens || '0';
        this.apiHealth.status = 'Operativo';
        this.logs = res.recentLogs || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de IA:', err);
        this.apiHealth.status = 'Degradado';
        this.errorMessage = 'Ocurrió un error al cargar las estadísticas de la IA. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }

  viewDetails(log: RecentLogItem) {
    this.selectedLog = log;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedLog = null;
  }
}
