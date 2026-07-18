import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  AdminService,
  AdminSimulator,
  SteamAxis,
} from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { SimulatorStep } from '../../../core/models/career-simulator.models';

interface SimulatorForm {
  slug: string;
  careerName: string;
  steamArea: SteamAxis;
  estimatedDurationMinutes: number;
  difficulty: string;
  status: 'activo' | 'inactivo';
  colorToken: string;
  icon: string;
  shortDescription: string;
  tagsText: string;
  completionBadge: string;
  steps: SimulatorStep[];
}

const STEAM_AREAS: Array<{ value: SteamAxis; label: string; emoji: string }> = [
  { value: 'ciencia', label: 'Ciencia', emoji: '🔬' },
  { value: 'tecnologia', label: 'Tecnología', emoji: '💻' },
  { value: 'ingenieria', label: 'Ingeniería', emoji: '🏗️' },
  { value: 'artes', label: 'Artes', emoji: '🎨' },
  { value: 'matematicas', label: 'Matemáticas', emoji: '🧮' },
];

@Component({
  selector: 'app-manage-simulators',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-simulators.component.html',
  styleUrls: ['./manage-simulators.component.scss'],
})
export class ManageSimulatorsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  readonly areas = STEAM_AREAS;
  readonly stepTypes = [
    { label: 'Contexto', type: 'CONTEXT' },
    { label: 'Análisis', type: 'DATA_ANALYSIS' },
    { label: 'Dilema', type: 'TRADEOFF_DECISION' },
    { label: 'Sorpresa', type: 'SURPRISE_REVEAL' },
    { label: 'Resultado', type: 'REALITY_CHECK' },
    { label: 'Reflexión', type: 'EMOTIONAL_REFLECTION' },
  ] as const;

  simulators = signal<AdminSimulator[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  isModalOpen = signal(false);
  modalMode = signal<'create' | 'edit' | 'view'>('view');
  activeTab = signal(-1);

  searchTerm = '';
  filterArea: SteamAxis | '' = '';
  filterStatus: 'activo' | 'inactivo' | '' = '';
  sortColumn: 'careerName' | 'steamArea' | 'updatedAt' = 'careerName';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentSimulatorId = '';
  formModel = this.emptyForm();

  ngOnInit(): void {
    this.loadSimulators();
  }

  loadSimulators(): void {
    this.isLoading.set(true);
    this.adminService.getAdminSimulators().subscribe({
      next: (data) => {
        this.simulators.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toast.showToast(
          error.error?.message || 'No se pudieron cargar los simuladores.',
          'error',
        );
      },
    });
  }

  openModal(mode: 'create' | 'edit' | 'view', simulator?: AdminSimulator): void {
    this.modalMode.set(mode);
    this.activeTab.set(-1);
    if (mode === 'create') {
      this.currentSimulatorId = '';
      this.formModel = this.emptyForm();
    } else if (simulator) {
      this.currentSimulatorId = simulator.id;
      this.formModel = {
        slug: simulator.slug,
        careerName: simulator.careerName,
        steamArea: simulator.steamArea,
        estimatedDurationMinutes: simulator.estimatedDurationMinutes,
        difficulty: simulator.difficulty,
        status: simulator.status,
        colorToken: simulator.colorToken,
        icon: simulator.icon,
        shortDescription: simulator.shortDescription,
        tagsText: (simulator.tags || []).join(', '),
        completionBadge: String(simulator.completionConfig?.['badge'] || ''),
        steps: this.normalizeSteps(simulator.slug, simulator.steps),
      };
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    if (!this.isSubmitting()) this.isModalOpen.set(false);
  }

  addOption(stepIndex: number): void {
    const step = this.formModel.steps[stepIndex];
    step.options ??= [];
    step.options.push({
      id: `${this.formModel.slug || 'new'}_${stepIndex}_${Date.now()}`,
      text: '',
      steamTraitWeight: this.emptyWeights(),
    });
  }

  removeOption(stepIndex: number, optionIndex: number): void {
    this.formModel.steps[stepIndex].options?.splice(optionIndex, 1);
  }

  saveSimulator(): void {
    const error = this.validateForm();
    if (error) {
      this.toast.showToast(error, 'error');
      return;
    }
    const payload: Partial<AdminSimulator> = {
      slug: this.formModel.slug,
      careerName: this.formModel.careerName.trim(),
      steamArea: this.formModel.steamArea,
      estimatedDurationMinutes: Number(this.formModel.estimatedDurationMinutes),
      difficulty: this.formModel.difficulty.trim(),
      status: this.formModel.status,
      colorToken: this.formModel.colorToken.trim(),
      icon: this.formModel.icon.trim(),
      shortDescription: this.formModel.shortDescription.trim(),
      tags: this.formModel.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      steps: this.formModel.steps.map((step, index) => ({
        ...step,
        type: this.stepTypes[index].type,
      })),
      completionConfig: this.formModel.completionBadge.trim()
        ? { badge: this.formModel.completionBadge.trim() }
        : null,
    };

    this.isSubmitting.set(true);
    const request = this.modalMode() === 'create'
      ? this.adminService.createSimulator(payload)
      : this.adminService.updateSimulator(this.currentSimulatorId, payload);
    request.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.toast.showToast(
          this.modalMode() === 'create' ? 'Simulador creado.' : 'Simulador actualizado.',
          'success',
        );
        this.loadSimulators();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.toast.showToast(
          error.error?.message || 'No se pudo guardar el simulador.',
          'error',
        );
      },
    });
  }

  async deleteSimulator(simulator: AdminSimulator): Promise<void> {
    const confirmed = await this.dialog.confirm(
      'Eliminar Simulador',
      `Se eliminará “${simulator.careerName}” y dejará de estar disponible en la app.`,
      { confirmText: 'Eliminar simulador', isDanger: true },
    );
    if (!confirmed) return;
    this.adminService.deleteSimulator(simulator.id).subscribe({
      next: () => {
        this.toast.showToast('Simulador eliminado.', 'success');
        this.loadSimulators();
      },
      error: (error) => this.toast.showToast(
        error.error?.message || 'No se pudo eliminar el simulador.',
        'error',
      ),
    });
  }

  sortBy(column: typeof this.sortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  sortIcon(column: typeof this.sortColumn): string {
    if (this.sortColumn !== column) return 'arrow-up-down';
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  get filteredSimulatorsList(): AdminSimulator[] {
    const term = this.searchTerm.trim().toLowerCase();
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return this.simulators()
      .filter((simulator) =>
        (!term || simulator.careerName.toLowerCase().includes(term) || simulator.slug.includes(term)) &&
        (!this.filterArea || simulator.steamArea === this.filterArea) &&
        (!this.filterStatus || simulator.status === this.filterStatus),
      )
      .sort((a, b) => String(a[this.sortColumn] || '').localeCompare(
        String(b[this.sortColumn] || ''),
        'es-MX',
      ) * direction);
  }

  areaLabel(axis: SteamAxis): string {
    return this.areas.find((area) => area.value === axis)?.label || axis;
  }

  areaEmoji(axis: SteamAxis): string {
    return this.areas.find((area) => area.value === axis)?.emoji || '🧭';
  }

  private emptyForm(): SimulatorForm {
    const slug = 'nuevo-simulador';
    return {
      slug: '',
      careerName: '',
      steamArea: 'tecnologia',
      estimatedDurationMinutes: 15,
      difficulty: 'Intermedia',
      status: 'inactivo',
      colorToken: '#07B1C9',
      icon: 'briefcase-business',
      shortDescription: '',
      tagsText: '',
      completionBadge: '',
      steps: this.createDefaultSteps(slug),
    };
  }

  private normalizeSteps(slug: string, steps: any[]): SimulatorStep[] {
    const defaults = this.createDefaultSteps(slug);
    return defaults.map((fallback, index) => {
      const source = steps?.[index] || {};
      return {
        ...fallback,
        ...source,
        type: this.stepTypes[index].type,
        options: Array.isArray(source.options)
          ? source.options.map((option: any) => ({
              ...option,
              steamTraitWeight: { ...this.emptyWeights(), ...(option.steamTraitWeight || {}) },
            }))
          : fallback.options,
      } as SimulatorStep;
    });
  }

  private createDefaultSteps(slug: string): SimulatorStep[] {
    const option = (suffix: string) => ({
      id: `${slug}_${suffix}`,
      text: '',
      steamTraitWeight: this.emptyWeights(),
    });
    return [
      { id: `${slug}_context`, type: 'CONTEXT', title: 'Contexto del reto', content: '' },
      { id: `${slug}_analysis`, type: 'DATA_ANALYSIS', title: 'Análisis de información', content: '', options: [option('analysis_a'), option('analysis_b')] },
      { id: `${slug}_decision`, type: 'TRADEOFF_DECISION', title: 'Decisión crítica', content: '', options: [option('decision_a'), option('decision_b')] },
      { id: `${slug}_surprise`, type: 'SURPRISE_REVEAL', title: 'Giro del escenario', content: '' },
      { id: `${slug}_result`, type: 'REALITY_CHECK', title: 'Resultado de afinidad', content: 'El sistema calculará la afinidad a partir de las decisiones.' },
      { id: `${slug}_reflection`, type: 'EMOTIONAL_REFLECTION', title: 'Reflexión final', content: '¿Cómo te sentiste al resolver el reto?', options: [option('reflection_a'), option('reflection_b')] },
    ];
  }

  private emptyWeights() {
    return { ciencia: 0, tecnologia: 0, ingenieria: 0, artes: 0, matematicas: 0 };
  }

  private validateForm(): string | null {
    if (!this.formModel.slug.trim() || !this.formModel.careerName.trim()) {
      return 'El slug y el nombre de carrera son obligatorios.';
    }
    if (!this.formModel.shortDescription.trim()) return 'Agrega una descripción breve.';
    if (this.formModel.steps.length !== 6) return 'El simulador debe conservar exactamente 6 pasos.';
    for (let index = 0; index < this.formModel.steps.length; index++) {
      const step = this.formModel.steps[index];
      if (!step.title?.trim()) return `Agrega el título del paso ${index + 1}.`;
      if ([1, 2, 5].includes(index) && (step.options?.length || 0) < 2) {
        return `El paso ${index + 1} necesita al menos 2 opciones.`;
      }
    }
    return null;
  }
}
