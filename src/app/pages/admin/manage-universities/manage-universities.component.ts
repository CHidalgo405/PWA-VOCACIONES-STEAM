import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminUniversity } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

type CostTier = 'public' | 'affordable' | 'private-premium';

interface UniversityFormModel {
  name: string;
  address: string;
  website: string;
  latitude: number | null;
  longitude: number | null;
  costTier: CostTier;
  tuitionRange: string;
  rating: number | null;
  modality: string;
  steamPrograms: { name: string; area: string }[];
}

const EMPTY_FORM: UniversityFormModel = {
  name: '',
  address: '',
  website: '',
  latitude: null,
  longitude: null,
  costTier: 'affordable',
  tuitionRange: '',
  rating: null,
  modality: 'presencial',
  steamPrograms: [],
};

/**
 * Administra las universidades candidatas del algoritmo A8 (matching).
 * Sin datos aquí, /universities/match siempre responde vacío y los
 * filtros de Explorar no tienen nada que mostrar.
 */
@Component({
  selector: 'app-manage-universities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-universities.component.html',
  styleUrls: ['./manage-universities.component.scss'],
})
export class ManageUniversitiesComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);

  public readonly axisOptions = [
    { value: 'ciencia', label: 'Ciencia' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'ingenieria', label: 'Ingeniería' },
    { value: 'artes', label: 'Artes' },
    { value: 'matematicas', label: 'Matemáticas' },
  ];

  public readonly costTierOptions: { value: CostTier; label: string }[] = [
    { value: 'public', label: 'Pública' },
    { value: 'affordable', label: 'Costo accesible' },
    { value: 'private-premium', label: 'Privada' },
  ];

  public universities = signal<AdminUniversity[]>([]);
  public isLoading = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public isModalOpen = signal<boolean>(false);
  public modalMode = signal<'create' | 'edit'>('create');

  public searchTerm = '';
  public filterCostTier: CostTier | '' = '';

  private currentUniversityId = '';
  public formModel: UniversityFormModel = { ...EMPTY_FORM, steamPrograms: [] };

  ngOnInit() {
    this.loadUniversities();
  }

  loadUniversities() {
    this.isLoading.set(true);
    this.adminService.getAdminUniversities().subscribe({
      next: (data) => {
        this.universities.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading universities:', err);
        this.toastService.showToast('No se pudieron cargar las universidades.', 'error', 'Error');
        this.isLoading.set(false);
      },
    });
  }

  // --- ORDENAMIENTO ---
  sortColumn: 'name' | 'costTier' | 'rating' = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

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

  get filteredUniversities(): AdminUniversity[] {
    const filtered = this.universities().filter((u) => {
      const term = this.searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        (u.address || '').toLowerCase().includes(term);
      const matchesTier = !this.filterCostTier || u.costTier === this.filterCostTier;
      return matchesSearch && matchesTier;
    });

    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      if (col === 'rating') {
        valA = a.rating ?? -1;
        valB = b.rating ?? -1;
      } else {
        valA = String(a[col] ?? '').toLowerCase();
        valB = String(b[col] ?? '').toLowerCase();
      }
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  }

  /** Universidades sin coordenadas: quedan excluidas de A8 sin previo aviso. */
  isMissingCoordinates(u: AdminUniversity): boolean {
    return (
      typeof u.location?.latitude !== 'number' ||
      typeof u.location?.longitude !== 'number'
    );
  }

  costTierLabel(tier?: string): string {
    return this.costTierOptions.find((o) => o.value === tier)?.label || 'Sin definir';
  }

  openCreateModal() {
    this.modalMode.set('create');
    this.currentUniversityId = '';
    this.formModel = { ...EMPTY_FORM, steamPrograms: [] };
    this.isModalOpen.set(true);
  }

  openEditModal(u: AdminUniversity) {
    this.modalMode.set('edit');
    this.currentUniversityId = u.id || '';
    this.formModel = {
      name: u.name,
      address: u.address || '',
      website: u.website || '',
      latitude: u.location?.latitude ?? null,
      longitude: u.location?.longitude ?? null,
      costTier: (u.costTier as CostTier) || 'affordable',
      tuitionRange: u.tuitionRange || '',
      rating: u.rating ?? null,
      modality: u.modality || 'presencial',
      steamPrograms: u.steamPrograms ? JSON.parse(JSON.stringify(u.steamPrograms)) : [],
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  addProgram() {
    this.formModel.steamPrograms.push({ name: '', area: 'tecnologia' });
  }

  removeProgram(index: number) {
    this.formModel.steamPrograms.splice(index, 1);
  }

  saveUniversity() {
    if (!this.formModel.name.trim()) {
      this.toastService.showToast('El nombre de la universidad es obligatorio.', 'warning', 'Advertencia');
      return;
    }
    if (this.formModel.latitude == null || this.formModel.longitude == null) {
      this.toastService.showToast(
        'Sin coordenadas, esta universidad no aparecerá en el mapa ni en el matching de A8.',
        'warning',
        'Faltan coordenadas'
      );
      return;
    }
    const validPrograms = this.formModel.steamPrograms.filter((p) => p.name.trim());
    if (!validPrograms.length) {
      this.toastService.showToast(
        'Agrega al menos un programa/carrera: sin uno, A8 nunca podrá recomendar esta universidad.',
        'warning',
        'Faltan programas'
      );
      return;
    }

    const payload: Partial<AdminUniversity> = {
      name: this.formModel.name.trim(),
      address: this.formModel.address.trim() || undefined,
      website: this.formModel.website.trim() || undefined,
      location: { latitude: this.formModel.latitude, longitude: this.formModel.longitude },
      costTier: this.formModel.costTier,
      tuitionRange: this.formModel.tuitionRange.trim() || undefined,
      rating: this.formModel.rating ?? undefined,
      modality: this.formModel.modality.trim() || undefined,
      steamPrograms: validPrograms,
    };

    this.isSubmitting.set(true);
    const request$ =
      this.modalMode() === 'create'
        ? this.adminService.createUniversity(payload)
        : this.adminService.updateUniversity(this.currentUniversityId, payload);

    request$.subscribe({
      next: () => {
        this.toastService.showToast(
          this.modalMode() === 'create' ? 'Universidad creada exitosamente.' : 'Universidad actualizada exitosamente.',
          'success',
          'Éxito'
        );
        this.loadUniversities();
        this.isModalOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error saving university:', err);
        this.toastService.showToast('No se pudo guardar la universidad.', 'error', 'Error');
        this.isSubmitting.set(false);
      },
    });
  }

  async deleteUniversity(u: AdminUniversity) {
    const confirmed = await this.dialogService.confirm(
      'Eliminar Universidad',
      `¿Estás seguro de que deseas eliminar "${u.name}"? Ya no aparecerá en las recomendaciones de A8.`,
      { confirmText: 'Sí, eliminar', isDanger: true }
    );
    if (!confirmed || !u.id) return;

    this.isLoading.set(true);
    this.adminService.deleteUniversity(u.id).subscribe({
      next: () => {
        this.toastService.showToast('Universidad eliminada.', 'success', 'Éxito');
        this.loadUniversities();
      },
      error: (err) => {
        console.error('Error deleting university:', err);
        this.toastService.showToast('No se pudo eliminar la universidad.', 'error', 'Error');
        this.isLoading.set(false);
      },
    });
  }
}
