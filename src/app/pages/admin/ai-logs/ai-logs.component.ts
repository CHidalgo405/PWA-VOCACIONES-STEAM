import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-ai-logs',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent],
  templateUrl: './ai-logs.component.html',
  styleUrls: ['./ai-logs.component.scss']
})
export class AiLogsComponent {

  // --- MÉTRICAS DE SALUD DE LA API ---
  apiHealth = {
    status: 'Operativo', // Operativo, Degradado, Caído
    latency: '240ms',
    successRate: '99.8%',
    tokensUsed: '1.2M'
  };

  // --- LOGS SIMULADOS DE LA IA ---
  logs = [
    { 
      id: 'REQ-901', 
      date: '21 Feb 2026, 10:30 AM', 
      user: 'Ana Sofía', 
      profile: 'Ingeniería + Tecnología', 
      status: 'Éxito', 
      latency: '210ms',
      prompt: 'Recomendar 3 universidades locales (Córdoba, Veracruz) y 2 cursos online para perfil: Ingeniería de Software.',
      response: '{\n  "universidades": ["UTCV - Ing. Mecatrónica", "UV - Ing. Informática"],\n  "cursos": ["Coursera: FullStack", "Udemy: Python para IA"]\n}'
    },
    { 
      id: 'REQ-900', 
      date: '21 Feb 2026, 10:15 AM', 
      user: 'Carlos R.', 
      profile: 'Artes Visuales', 
      status: 'Éxito', 
      latency: '350ms',
      prompt: 'Recomendar carreras y cursos para perfil: Artes, diseño digital.',
      response: '{\n  "universidades": ["Escuela de Artes Visuales", "Gestalt Diseño"],\n  "cursos": ["Domestika: Ilustración Digital"]\n}'
    },
    { 
      id: 'REQ-899', 
      date: '21 Feb 2026, 09:45 AM', 
      user: 'Luis M.', 
      profile: 'Ciencia', 
      status: 'Error', 
      latency: '5000ms',
      prompt: 'Recomendar opciones para perfil: Biología Marina.',
      response: 'Error 504: Gateway Timeout. La API de la IA tardó demasiado en responder.'
    }
  ];

  // --- ESTADO PARA EL MODAL ---
  selectedLog: any = null;
  isModalOpen = false;

  selectLog(log: any) {
    this.selectedLog = this.selectedLog?.id === log.id ? null : log;
  }

  viewDetails() {
    if (this.selectedLog) {
      this.isModalOpen = true;
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }
}