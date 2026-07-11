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

  /** Expuesto para poder usar Math.min(...) en el template de paginación. */
  public readonly Math = Math;

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

  /** Mismos 32 estados que cubre el descubrimiento en el backend (ai.service.ts). */
  public readonly discoveryStates = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Coahuila', 'Colima', 'Chiapas', 'Chihuahua', 'CDMX', 'Durango',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Estado de México',
    'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
    'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
    'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
  ];
  public selectedDiscoveryState = '';

  public universities = signal<AdminUniversity[]>([]);
  public isLoading = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public isDiscovering = signal<boolean>(false);
  public isDiscoveringDenue = signal<boolean>(false);
  public isDeletingAll = signal<boolean>(false);
  public isCleaningJunk = signal<boolean>(false);
  public isEnriching = signal<boolean>(false);
  public isExporting = signal<boolean>(false);
  public isImporting = signal<boolean>(false);
  public isModalOpen = signal<boolean>(false);
  public modalMode = signal<'create' | 'edit'>('create');
  
  // Export Modal
  public isExportModalOpen = signal<boolean>(false);
  public selectedExportState = '';

  public searchTerm = '';
  public filterCostTier: CostTier | '' = '';

  // --- PAGINACIÓN (client-side, sobre la lista ya filtrada/ordenada) ---
  public readonly pageSizeOptions = [10, 20, 30, 50];
  public pageSize = signal<number>(20);
  public currentPage = signal<number>(1);

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

  /**
   * Descubrimiento automático (Google Places): busca en capitales estatales
   * + zonas metropolitanas grandes, de-duplica contra lo que ya existe en
   * BD y guarda las nuevas. No llena steamPrograms/costTier/tuitionRange —
   * eso se completa a mano por institución desde este mismo panel.
   */
  runDiscovery() {
    if (this.isDiscovering()) return; // anti-spam: no encadenar ejecuciones
    this.isDiscovering.set(true);
    const states = this.selectedDiscoveryState ? [this.selectedDiscoveryState] : undefined;
    this.adminService.discoverUniversities(states).subscribe({
      next: (result) => {
        this.isDiscovering.set(false);
        if (result.created > 0) {
          this.loadUniversities();
        }
        const partes = [`${result.created} nuevas agregadas`];
        if (result.skippedExisting > 0) partes.push(`${result.skippedExisting} ya existían`);
        if (result.failed > 0) partes.push(`${result.failed} con error`);
        const scope = this.selectedDiscoveryState ? ` en ${this.selectedDiscoveryState}` : '';
        this.toastService.showToast(
          `Descubrimiento${scope} terminado: ${partes.join(', ')} (de ${result.totalFound} encontradas).`,
          result.failed > 0 ? 'warning' : 'success',
          'Descubrimiento de universidades',
        );
      },
      error: (err) => {
        console.error('Error en descubrimiento de universidades:', err);
        this.isDiscovering.set(false);
        const detail = err?.error?.message || 'Revisa que GOOGLE_PLACES_API_KEY esté configurada en el servidor.';
        this.toastService.showToast(
          `No se pudo ejecutar el descubrimiento: ${detail}`,
          'error',
          'Descubrimiento de universidades',
        );
      },
    });
  }

  /**
   * Descubrimiento vía DENUE/INEGI: censo económico oficial filtrado por el
   * SCIAN exacto de "escuelas de educación superior" — más preciso que
   * Google Places, pero requiere elegir un estado (un solo estado puede
   * traer cientos de registros).
   */
  runDenueDiscovery() {
    if (this.isDiscoveringDenue()) return; // anti-spam
    if (!this.selectedDiscoveryState) {
      this.toastService.showToast(
        'Elige un estado del selector de arriba antes de correr el descubrimiento por DENUE.',
        'warning',
        'Falta seleccionar estado',
      );
      return;
    }
    this.isDiscoveringDenue.set(true);
    this.adminService.discoverFromDenue([this.selectedDiscoveryState]).subscribe({
      next: (result) => {
        this.isDiscoveringDenue.set(false);
        if (result.created > 0) {
          this.loadUniversities();
        }
        const partes = [`${result.created} nuevas agregadas`];
        if (result.skippedExisting > 0) partes.push(`${result.skippedExisting} ya existían`);
        if (result.failed > 0) partes.push(`${result.failed} con error`);
        this.toastService.showToast(
          `DENUE en ${this.selectedDiscoveryState} terminado: ${partes.join(', ')} (de ${result.totalFound} encontradas).`,
          result.failed > 0 ? 'warning' : 'success',
          'Descubrimiento vía DENUE (INEGI)',
        );
      },
      error: (err) => {
        console.error('Error en descubrimiento DENUE:', err);
        this.isDiscoveringDenue.set(false);
        const detail = err?.error?.message || 'Revisa que INEGI_DENUE_TOKEN esté configurada en el servidor.';
        this.toastService.showToast(
          `No se pudo ejecutar el descubrimiento DENUE: ${detail}`,
          'error',
          'Descubrimiento vía DENUE (INEGI)',
        );
      },
    });
  }

  /** Borra TODAS las universidades — para reiniciar el mapeo desde cero. Pide doble confirmación. */
  async deleteAllUniversities() {
    if (this.isDeletingAll()) return;
    const total = this.universities().length;
    const confirmed = await this.dialogService.confirm(
      'Eliminar TODAS las universidades',
      `Esto borra las ${total} universidades guardadas ahora mismo. Los filtros de Explorar quedarán sin resultados hasta que vuelvas a cargar datos. Esta acción no se puede deshacer.`,
      { confirmText: 'Eliminar todo', cancelText: 'Cancelar', isDanger: true },
    );
    if (!confirmed) return;

    this.isDeletingAll.set(true);
    this.adminService.deleteAllUniversities().subscribe({
      next: (result) => {
        this.isDeletingAll.set(false);
        this.loadUniversities();
        this.toastService.showToast(`${result.deleted} universidades eliminadas.`, 'success', 'Éxito');
      },
      error: (err) => {
        console.error('Error al eliminar todas las universidades:', err);
        this.isDeletingAll.set(false);
        this.toastService.showToast('No se pudieron eliminar las universidades.', 'error', 'Error');
      },
    });
  }

  /**
   * Borra retroactivamente lo ya guardado que coincide con el filtro de
   * nombres basura (oficinas de gobierno, sindicatos, estacionamientos,
   * etc. — el mismo filtro que ya se aplica al descubrir cosas nuevas).
   */
  async cleanupJunk() {
    if (this.isCleaningJunk()) return;
    const confirmed = await this.dialogService.confirm(
      'Limpiar nombres genéricos / mal clasificados',
      'Busca y elimina entradas que claramente no son universidades (oficinas de gobierno, sindicatos, estacionamientos, etc.) entre las ya guardadas. No afecta universidades reales.',
      { confirmText: 'Limpiar', cancelText: 'Cancelar' },
    );
    if (!confirmed) return;

    this.isCleaningJunk.set(true);
    this.adminService.cleanupJunkUniversities().subscribe({
      next: (result) => {
        this.isCleaningJunk.set(false);
        if (result.deleted > 0) this.loadUniversities();
        this.toastService.showToast(
          result.deleted > 0
            ? `${result.deleted} entradas eliminadas: ${result.deletedNames.slice(0, 5).join(', ')}${result.deleted > 5 ? '…' : ''}`
            : 'No se encontró nada que limpiar.',
          'success',
          'Limpieza de genéricos y duplicados',
        );
      },
      error: (err) => {
        console.error('Error en limpieza de genéricos y duplicados:', err);
        this.isCleaningJunk.set(false);
        this.toastService.showToast('No se pudo ejecutar la limpieza.', 'error', 'Error');
      },
    });
  }

  /**
   * Enriquece con IA (Groq) universidades que ya tienen `website` guardado
   * pero les falta steamPrograms/costTier/tuitionRange/modality: el servidor
   * lee el sitio oficial real y extrae solo lo que esté explícito en la
   * página (no inventa). Se aplica directo sin revisión previa — solo
   * rellena huecos, nunca sobreescribe un dato ya cargado a mano. Procesa
   * un lote a la vez; pulsa varias veces para avanzar en el resto de la
   * lista. Si hay texto en el buscador, se usa como filtro de zona (ej.
   * escribir "Orizaba" y pulsar el botón enriquece solo esa zona).
   */
  runEnrichment() {
    if (this.isEnriching()) return; // anti-spam
    this.isEnriching.set(true);
    const filter = this.searchTerm.trim() || undefined;
    this.adminService.enrichUniversitiesWithAi(undefined, filter).subscribe({
      next: (result) => {
        this.isEnriching.set(false);
        if (result.enriched > 0) {
          this.loadUniversities();
        }
        const partes = [`${result.enriched} completadas`];
        if (result.skipped > 0) partes.push(`${result.skipped} sin info nueva en su sitio`);
        if (result.failed > 0) partes.push(`${result.failed} con error (sitio caído/bloqueado)`);
        const scope = filter ? ` (filtro: "${filter}")` : '';
        this.toastService.showToast(
          `Enriquecimiento con IA${scope}: ${partes.join(', ')} (de ${result.processed} procesadas). Pulsa de nuevo para seguir con las siguientes.`,
          result.failed > 0 ? 'warning' : 'success',
          'Enriquecimiento con IA',
        );
      },
      error: (err) => {
        console.error('Error en enriquecimiento con IA:', err);
        this.isEnriching.set(false);
        const detail = err?.error?.message || 'Revisa que GROQ_API_KEY esté configurada en el servidor.';
        this.toastService.showToast(`No se pudo ejecutar el enriquecimiento: ${detail}`, 'error', 'Enriquecimiento con IA');
      },
    });
  }

  /** Abre el modal para seleccionar el estado a exportar */
  openExportModal() {
    this.selectedExportState = '';
    this.isExportModalOpen.set(true);
  }

  closeExportModal() {
    this.isExportModalOpen.set(false);
  }

  /**
   * Exporta a un archivo .json (con `id` real de cada universidad) filtrando
   * por estado y dividiendo el resultado en archivos de 20 universidades max.
   */
  exportJsonByState() {
    if (!this.selectedExportState) {
      this.toastService.showToast('Por favor selecciona un estado.', 'warning', 'Exportar JSON');
      return;
    }
    if (this.isExporting()) return;
    this.isExporting.set(true);
    const state = this.selectedExportState;
    this.adminService.exportUniversities(state).subscribe({
      next: (rows) => {
        this.isExporting.set(false);
        this.closeExportModal();
        if (!rows.length) {
          this.toastService.showToast(`No hay universidades que coincidan con ${state}.`, 'warning', 'Exportar JSON');
          return;
        }

        const chunkSize = 20;
        let index = 0;
        let chunkNum = 1;
        const totalChunks = Math.ceil(rows.length / chunkSize);

        const downloadNextChunk = () => {
          if (index >= rows.length) {
            this.toastService.showToast(
              `${rows.length} universidades exportadas en ${totalChunks} archivo(s) para ${state}.`,
              'success',
              'Exportar JSON'
            );
            return;
          }

          const chunk = rows.slice(index, index + chunkSize);
          const blob = new Blob([JSON.stringify(chunk, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const scope = state.toLowerCase().replace(/\s+/g, '-');
          a.href = url;
          a.download = `universidades-${scope}-part${chunkNum}.json`;
          a.click();
          URL.revokeObjectURL(url);

          index += chunkSize;
          chunkNum++;

          // Retraso para evitar que el navegador bloquee descargas múltiples
          setTimeout(downloadNextChunk, 500);
        };

        downloadNextChunk();
      },
      error: (err) => {
        console.error('Error exportando universidades:', err);
        this.isExporting.set(false);
        this.toastService.showToast('No se pudo exportar el JSON.', 'error', 'Error');
      },
    });
  }

  /** Dispara el selector de archivo oculto para "Importar JSON editado". */
  triggerImportPicker(fileInput: HTMLInputElement) {
    if (this.isImporting()) return;
    fileInput.value = ''; // permite re-subir el mismo archivo dos veces seguidas
    fileInput.click();
  }

  /**
   * Reimporta el JSON exportado (ya editado a mano): ACTUALIZA por `id`,
   * nunca crea universidades nuevas — para eso están los botones de
   * descubrimiento. Filas sin `id` o con `id` que ya no existe se reportan
   * como error individual sin tocar el resto del archivo.
   */
  async onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    let rows: any[];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      this.toastService.showToast('El archivo no es un JSON válido.', 'error', 'Importar JSON editado');
      return;
    }
    if (!rows.length) {
      this.toastService.showToast('El archivo no tiene universidades.', 'warning', 'Importar JSON editado');
      return;
    }

    this.isImporting.set(true);
    this.adminService.bulkUpdateUniversities(rows).subscribe({
      next: (result) => {
        this.isImporting.set(false);
        if (result.updated > 0) this.loadUniversities();
        const partes = [`${result.updated} actualizadas`];
        if (result.failed > 0) partes.push(`${result.failed} con error`);
        this.toastService.showToast(
          `Importación: ${partes.join(', ')} (de ${rows.length} filas en el archivo).`,
          result.failed > 0 ? 'warning' : 'success',
          'Importar JSON editado',
        );
        if (result.errors?.length) {
          console.warn('Errores al importar JSON:', result.errors);
        }
      },
      error: (err) => {
        console.error('Error importando JSON:', err);
        this.isImporting.set(false);
        this.toastService.showToast('No se pudo importar el archivo.', 'error', 'Error');
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
    this.currentPage.set(1);
  }

  sortIcon(column: typeof this.sortColumn): string {
    if (this.sortColumn !== column) return 'arrow-up-down';
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  /** Quita acentos y normaliza a minúsculas, para que "tecnologico" encuentre "Tecnológico". */
  private normalizeSearchText(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  get filteredUniversities(): AdminUniversity[] {
    const filtered = this.universities().filter((u) => {
      const term = this.normalizeSearchText(this.searchTerm);
      // Búsqueda por palabras sueltas, en cualquier orden y sin acentos: no
      // hace falta escribir el nombre exacto ni completo (ej. "tec queretaro"
      // encuentra "Instituto Tecnológico de Querétaro" aunque no sea substring literal).
      const haystack = this.normalizeSearchText(`${u.name} ${u.address || ''}`);
      const matchesSearch =
        !term || term.split(/\s+/).every((word) => haystack.includes(word));
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUniversities.length / this.pageSize()));
  }

  /**
   * Página actual, ya recortada de filteredUniversities — esto es lo que pinta la tabla.
   * Se auto-ajusta si la página guardada quedó fuera de rango (ej. tras borrar
   * varias universidades) sin necesidad de resetear el estado en cada carga.
   */
  get pagedUniversities(): AdminUniversity[] {
    const filtered = this.filteredUniversities;
    const page = Math.min(this.currentPage(), this.totalPages);
    const start = (page - 1) * this.pageSize();
    return filtered.slice(start, start + this.pageSize());
  }

  /** Se llama al escribir en el buscador o cambiar el filtro: la búsqueda sigue corriendo sobre TODA la lista, solo se reinicia a la página 1 para no quedar viendo una página vacía. */
  onSearchOrFilterChange() {
    this.currentPage.set(1);
  }

  onPageSizeChange() {
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
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
