import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  AdminService,
  AxisMetaItem,
  CareerCatalogItem,
  SteamAxis,
  VocationCatalogItem,
} from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';

type CatalogTab = 'vocations' | 'careers' | 'axes';

@Component({
  selector: 'app-manage-catalogs',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-catalogs.component.html',
  styleUrls: ['./manage-catalogs.component.scss'],
})
export class ManageCatalogsComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  readonly axes: Array<{ value: SteamAxis; label: string; letter: string }> = [
    { value: 'ciencia', label: 'Ciencia', letter: 'S' },
    { value: 'tecnologia', label: 'Tecnología', letter: 'T' },
    { value: 'ingenieria', label: 'Ingeniería', letter: 'E' },
    { value: 'artes', label: 'Artes', letter: 'A' },
    { value: 'matematicas', label: 'Matemáticas', letter: 'M' },
  ];

  activeTab: CatalogTab = 'vocations';
  filterAxis: SteamAxis | '' = '';
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  vocations: VocationCatalogItem[] = [];
  careers: CareerCatalogItem[] = [];
  axisMeta: AxisMetaItem[] = [];

  isModalOpen = false;
  editId = '';
  vocationForm = this.emptyVocation();
  careerForm = this.emptyCareer();
  axisForm = this.emptyAxis();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.admin.getCatalogs().subscribe({
      next: (catalogs) => {
        this.vocations = catalogs.vocations;
        this.careers = catalogs.careers;
        this.axisMeta = catalogs.axisMeta;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'No se pudieron cargar los catálogos del motor.';
        this.isLoading = false;
      },
    });
  }

  switchTab(tab: CatalogTab): void {
    this.activeTab = tab;
    this.filterAxis = '';
  }

  get filteredVocations(): VocationCatalogItem[] {
    return this.vocations.filter((item) => !this.filterAxis || item.axis === this.filterAxis);
  }

  get filteredCareers(): CareerCatalogItem[] {
    return this.careers.filter((item) => !this.filterAxis || item.axis === this.filterAxis);
  }

  openCreate(): void {
    this.editId = '';
    if (this.activeTab === 'vocations') this.vocationForm = this.emptyVocation();
    if (this.activeTab === 'careers') this.careerForm = this.emptyCareer();
    this.isModalOpen = true;
  }

  openVocation(item: VocationCatalogItem): void {
    this.activeTab = 'vocations';
    this.editId = item.id;
    this.vocationForm = {
      ...item,
      skillsText: item.skills.join(', '),
    };
    this.isModalOpen = true;
  }

  openCareer(item: CareerCatalogItem): void {
    this.activeTab = 'careers';
    this.editId = item.id;
    this.careerForm = {
      ...item,
      relatedSimulatorSlug: item.relatedSimulatorSlug || '',
      highlightsText: item.studyPlanHighlights.join(', '),
      fieldsText: item.careerFields.join(', '),
    };
    this.isModalOpen = true;
  }

  openAxis(item: AxisMetaItem): void {
    this.activeTab = 'axes';
    this.editId = item.axis;
    this.axisForm = { ...item, workStyleText: item.workStyle.join(', ') };
    this.isModalOpen = true;
  }

  closeModal(): void {
    if (!this.isSaving) this.isModalOpen = false;
  }

  save(): void {
    if (this.activeTab === 'vocations') this.saveVocation();
    if (this.activeTab === 'careers') this.saveCareer();
    if (this.activeTab === 'axes') this.saveAxis();
  }

  async deleteVocation(item: VocationCatalogItem): Promise<void> {
    const confirmed = await this.dialog.confirm(
      'Eliminar Vocación',
      `“${item.name}” dejará de aparecer en los resultados A6.`,
      { confirmText: 'Eliminar vocación', isDanger: true },
    );
    if (!confirmed) return;
    this.admin.deleteVocation(item.id).subscribe({
      next: () => { this.toast.showToast('Vocación eliminada.', 'success'); this.load(); },
      error: (error) => this.showError(error),
    });
  }

  async deleteCareer(item: CareerCatalogItem): Promise<void> {
    const confirmed = await this.dialog.confirm(
      'Eliminar Carrera',
      `“${item.careerName}” dejará de aparecer en los resultados A7.`,
      { confirmText: 'Eliminar carrera', isDanger: true },
    );
    if (!confirmed) return;
    this.admin.deleteCareer(item.id).subscribe({
      next: () => { this.toast.showToast('Carrera eliminada.', 'success'); this.load(); },
      error: (error) => this.showError(error),
    });
  }

  axisLabel(axis: SteamAxis): string {
    return this.axes.find((item) => item.value === axis)?.label || axis;
  }

  axisLetter(axis: SteamAxis): string {
    return this.axes.find((item) => item.value === axis)?.letter || '?';
  }

  private saveVocation(): void {
    if (!this.vocationForm.name.trim() || !this.vocationForm.description.trim()) {
      this.toast.showToast('Nombre y descripción son obligatorios.', 'error');
      return;
    }
    const payload: Partial<VocationCatalogItem> = {
      axis: this.vocationForm.axis,
      name: this.vocationForm.name.trim(),
      description: this.vocationForm.description.trim(),
      icon: this.vocationForm.icon.trim() || 'sparkles',
      skills: this.csv(this.vocationForm.skillsText),
    };
    this.isSaving = true;
    const request = this.editId
      ? this.admin.updateVocation(this.editId, payload)
      : this.admin.createVocation(payload);
    request.subscribe({
      next: () => this.saved('Vocación guardada.'),
      error: (error) => this.showError(error),
    });
  }

  private saveCareer(): void {
    if (!this.careerForm.careerName.trim()) {
      this.toast.showToast('El nombre de la carrera es obligatorio.', 'error');
      return;
    }
    const payload: Partial<CareerCatalogItem> = {
      axis: this.careerForm.axis,
      careerName: this.careerForm.careerName.trim(),
      icon: this.careerForm.icon.trim() || 'graduation-cap',
      relatedSimulatorSlug: this.careerForm.relatedSimulatorSlug?.trim() || null,
      studyPlanHighlights: this.csv(this.careerForm.highlightsText),
      careerFields: this.csv(this.careerForm.fieldsText),
    };
    this.isSaving = true;
    const request = this.editId
      ? this.admin.updateCareer(this.editId, payload)
      : this.admin.createCareer(payload);
    request.subscribe({
      next: () => this.saved('Carrera guardada.'),
      error: (error) => this.showError(error),
    });
  }

  private saveAxis(): void {
    if (!this.axisForm.label.trim() || !this.axisForm.archetype.trim()) {
      this.toast.showToast('Etiqueta y arquetipo son obligatorios.', 'error');
      return;
    }
    const { workStyleText, ...form } = this.axisForm;
    this.isSaving = true;
    this.admin.updateAxisMeta(this.axisForm.axis, {
      ...form,
      workStyle: this.csv(workStyleText),
    }).subscribe({
      next: () => this.saved('Narrativa del eje actualizada.'),
      error: (error) => this.showError(error),
    });
  }

  private saved(message: string): void {
    this.isSaving = false;
    this.isModalOpen = false;
    this.toast.showToast(message, 'success');
    this.load();
  }

  private showError(error: any): void {
    this.isSaving = false;
    this.toast.showToast(error.error?.message || 'No se pudo completar la operación.', 'error');
  }

  private csv(value: string): string[] {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  private emptyVocation() {
    return { axis: 'ciencia' as SteamAxis, name: '', description: '', skillsText: '', icon: 'sparkles' };
  }

  private emptyCareer() {
    return { axis: 'ciencia' as SteamAxis, careerName: '', highlightsText: '', fieldsText: '', relatedSimulatorSlug: '', icon: 'graduation-cap' };
  }

  private emptyAxis() {
    return { axis: 'ciencia' as SteamAxis, label: '', adjective: '', icon: '', archetype: '', strengthTitle: '', strengthDesc: '', workStyleText: '' };
  }
}
