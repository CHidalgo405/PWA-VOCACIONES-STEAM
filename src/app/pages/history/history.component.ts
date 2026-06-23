import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VocationTestService, TestHistorySummary } from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogService } from '../../core/services/dialog.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';

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
  private dialogService = inject(DialogService);

  testHistory: TestHistorySummary[] = [];
  latestTest: TestHistorySummary | null = null;
  previousTests: TestHistorySummary[] = [];
  maxMatchGlobal: number = 0;
  currentProfile: string = '';
  
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
        if (history.length > 0) {
          this.latestTest = history[0];
          this.previousTests = history.slice(1);
          this.currentProfile = this.latestTest.dominantTraits || 'Desconocido';
          this.calculateGlobalStats();
        } else {
          this.latestTest = null;
          this.previousTests = [];
          this.currentProfile = '-';
          this.maxMatchGlobal = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.toastService.showToast('No se pudo cargar el historial de tests.', 'error');
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
    // Asumiendo un puntaje máximo de 20 por área
    this.maxMatchGlobal = Math.round((maxScore / 20) * 100);
    if (this.maxMatchGlobal > 100) this.maxMatchGlobal = 100;
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

  async deleteTest(testId: string, event: Event) {
    event.stopPropagation();
    const confirmed = await this.dialogService.confirm(
      'Eliminar Test',
      '¿Estás seguro de que deseas eliminar este test permanentemente?',
      { confirmText: 'Sí, eliminar', isDanger: true }
    );
    
    if (!confirmed) {
      return;
    }

    this.testService.deleteTest(testId).subscribe({
      next: () => {
        this.testHistory = this.testHistory.filter(t => t.id !== testId);
        
        // Re-calculate derived arrays and stats
        if (this.testHistory.length > 0) {
          this.latestTest = this.testHistory[0];
          this.previousTests = this.testHistory.slice(1);
          this.currentProfile = this.latestTest.dominantTraits || 'Desconocido';
          this.calculateGlobalStats();
        } else {
          this.latestTest = null;
          this.previousTests = [];
          this.currentProfile = '-';
          this.maxMatchGlobal = 0;
        }

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
      let percentage = Math.round((score / 20) * 100);
      if (percentage > 100) percentage = 100;
      return {
        name,
        percentage,
        color: this.getSteamColor(name)
      };
    });
  }

  getMiniChartBars(scores: Record<string, number>): { height: number, color: string }[] {
    if (!scores) return [];
    
    // We can just take the first 5 or all of them, order doesn't strictly matter but maybe sorted by name or just use as is.
    const entries = Object.entries(scores).slice(0, 5);
    return entries.map(([name, score]) => {
      let percentage = Math.round((score / 20) * 100);
      if (percentage > 100) percentage = 100;
      // We scale height for the mini chart (e.g. max height 30px)
      return {
        height: Math.max(10, (percentage / 100) * 30), // Min 10px height
        color: this.getSteamColor(name)
      };
    });
  }
}
