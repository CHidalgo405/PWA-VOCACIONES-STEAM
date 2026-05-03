import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VocationTestService, TestHistorySummary } from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, NavbarComponent, LucideIconComponent, FormsModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  private testService = inject(VocationTestService);
  private toastService = inject(ToastService);

  testHistory: TestHistorySummary[] = [];
  isLoading: boolean = true;
  isRenaming: string | null = null;
  newTestName: string = '';

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.testService.getTestHistory().subscribe({
      next: (history) => {
        this.testHistory = history;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.toastService.showToast('No se pudo cargar el historial de tests.', 'error');
        this.isLoading = false;
      }
    });
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
    if (!confirm('¿Estás seguro de que deseas eliminar este test permanentemente?')) {
      return;
    }

    this.testService.deleteTest(testId).subscribe({
      next: () => {
        this.testHistory = this.testHistory.filter(t => t.id !== testId);
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
}
