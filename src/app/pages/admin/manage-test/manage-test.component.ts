import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { AdminService, AdminTestQuestion } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-manage-test',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-test.component.html',
  styleUrls: ['./manage-test.component.scss']
})
export class ManageTestComponent implements OnInit {

  // --- DATOS REALES ---
  questions: AdminTestQuestion[] = [];

  // Rasgos STEAM para las opciones y filtros
  traitOptions = [
    { value: 'ciencia', label: 'Ciencia' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'ingenieria', label: 'Ingeniería' },
    { value: 'artes', label: 'Artes' },
    { value: 'matematicas', label: 'Matemáticas' }
  ];

  // --- VARIABLES DE ESTADO ---
  selectedQuestions: any[] = [];
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';

  viewedQuestionIndex: number = -1;
  isFormDirty = false;
  showUnsavedOverlay = false;
  pendingNavigationAction: (() => void) | null = null;

  searchTerm: string = '';
  filterTrait: string = '';

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage: number | string = 10;
  itemsPerPageOptions = [5, 10, 25, 50];

  isLoading = true;
  skeletonArray = Array(5).fill(0);

  constructor(private adminService: AdminService, private toastService: ToastService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.isLoading = true;
    this.adminService.getAllQuestions().pipe(
      catchError(err => {
        this.isLoading = false;
        this.displayToast('Error cargando preguntas. ' + (err.error?.message || ''), true);
        return of([]);
      })
    ).subscribe((data: AdminTestQuestion[]) => {
      this.isLoading = false;
      this.questions = data;
    });
  }

  isSubmitting = false;
  toastMessage = '';
  showToast = false;

  // --- FORMULARIO ---
  questionForm: any = { 
    text: '', 
    order: 1, 
    status: 'activo', 
    options: [
      { text: '', letter: 'A', steamTrait: 'ciencia' }
    ] 
  };

  // --- FUNCIONES DE TABLA / BUSQUEDA / PAGINACION ---
  get filteredQuestionsList() {
    return this.questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesTrait = this.filterTrait 
        ? (q.options || []).some((opt: any) => opt.steamTrait === this.filterTrait) 
        : true;
      return matchesSearch && matchesTrait;
    });
  }

  get totalPages() {
    return Math.ceil(this.filteredQuestionsList.length / Number(this.itemsPerPage)) || 1;
  }

  get paginatedQuestions() {
    const limit = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * limit;
    return this.filteredQuestionsList.slice(startIndex, startIndex + limit);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  toggleCategoryFilter(traitValue: string) {
    if (this.filterTrait === traitValue) {
      this.filterTrait = ''; // Deseleccionar si ya estaba activo
    } else {
      this.filterTrait = traitValue;
    }
    this.currentPage = 1; // Reiniciar paginación al filtrar
  }

  // --- SELECCIÓN MULTIPLE Y ESTADO RAPIDO ---
  toggleSelection(q: any, event?: Event) {
    if (event) event.stopPropagation();
    const index = this.selectedQuestions.findIndex(sq => sq.id === q.id);
    if (index > -1) {
      this.selectedQuestions.splice(index, 1);
    } else {
      this.selectedQuestions.push(q);
    }
  }

  clearSelection() {
    this.selectedQuestions = [];
  }

  isSelected(q: any): boolean {
    return this.selectedQuestions.some(sq => sq.id === q.id);
  }

  toggleStatus(q: any, event: Event) {
    event.stopPropagation();
    const newStatus = q.status === 'activo' ? 'inactivo' : 'activo';

    // Se envía el payload completo para que la API persista el cambio correctamente
    const fullPayload = {
      text: q.text,
      order: q.order,
      options: (q.options || []).map((o: any) => ({
        ...(o.id ? { id: o.id } : {}),
        text: o.text,
        letter: o.letter,
        steamTrait: o.steamTrait
      })),
      status: newStatus
    };

    this.adminService.updateQuestion(q.id, fullPayload).pipe(
      catchError(err => {
        this.displayToast('Error al actualizar estado.', true);
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        const index = this.questions.findIndex(item => item.id === q.id);
        if (index > -1) {
          this.questions[index].status = newStatus;
          this.displayToast(`Pregunta ${newStatus === 'activo' ? 'activada' : 'desactivada'} correctamente.`);
        }
      }
    });
  }

  // --- MODAL Y FORMULARIO ---
  openModal(mode: 'create' | 'edit' | 'view', q?: any, event?: Event) {
    if (event) event.stopPropagation();
    this.modalMode = mode;
    this.isFormDirty = false;

    if ((mode === 'edit' || mode === 'view') && q) {
      this.viewedQuestionIndex = this.filteredQuestionsList.findIndex(item => item.id === q.id);
      this.loadQuestionForm(q);
    } else if (mode === 'edit' && this.selectedQuestions.length === 1) {
      this.viewedQuestionIndex = this.filteredQuestionsList.findIndex(item => item.id === this.selectedQuestions[0].id);
      this.loadQuestionForm(this.selectedQuestions[0]);
    } else {
      this.questionForm = { 
        text: '', 
        order: this.filteredQuestionsList.length + 1, 
        status: 'activo', 
        options: [
          { text: '', letter: 'A', steamTrait: 'ciencia' },
          { text: '', letter: 'B', steamTrait: 'tecnologia' }
        ] 
      };
      this.viewedQuestionIndex = -1;
    }
    this.isModalOpen = true;
  }

  loadQuestionForm(q: any) {
    this.questionForm = { 
      text: q.text,
      order: q.order || 1,
      status: q.status === 'activo' ? 'activo' : 'inactivo',
      options: q.options && q.options.length > 0 ? q.options.map((o: any) => ({ ...o })) : [
        { text: '', letter: 'A', steamTrait: 'ciencia' }
      ]
    };
    this.isFormDirty = false;
  }

  addOption() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[this.questionForm.options.length % 26];
    this.questionForm.options.push({ text: '', letter: nextLetter, steamTrait: 'ciencia' });
    this.onFormChange();
  }

  removeOption(index: number) {
    this.questionForm.options.splice(index, 1);
    this.onFormChange();
  }

  onFormChange() {
    this.isFormDirty = true;
  }

  switchToEdit() {
    this.modalMode = 'edit';
    this.isFormDirty = false;
  }

  // --- ALERTA CAMBIOS SIN GUARDAR (Custom Overlay) ---
  closeModal() {
    if ((this.modalMode === 'create' || this.modalMode === 'edit') && this.isFormDirty) {
      this.pendingNavigationAction = () => { this.isModalOpen = false; };
      this.showUnsavedOverlay = true;
      return;
    }
    this.isModalOpen = false;
  }

  confirmUnsavedChanges() {
    this.showUnsavedOverlay = false;
    this.isFormDirty = false;
    if (this.pendingNavigationAction) {
      this.pendingNavigationAction();
      this.pendingNavigationAction = null;
    }
  }

  cancelUnsavedChanges() {
    this.showUnsavedOverlay = false;
    this.pendingNavigationAction = null;
  }

  navigationAlertAndProceed(callback: () => void) {
    if ((this.modalMode === 'create' || this.modalMode === 'edit') && this.isFormDirty) {
      this.pendingNavigationAction = callback;
      this.showUnsavedOverlay = true;
    } else {
      callback();
    }
  }

  previousQuestion() {
    this.navigationAlertAndProceed(() => {
      if (this.viewedQuestionIndex > 0) {
        this.viewedQuestionIndex--;
        const q = this.filteredQuestionsList[this.viewedQuestionIndex];
        this.loadQuestionForm(q);
      }
    });
  }

  nextQuestion() {
    this.navigationAlertAndProceed(() => {
      if (this.viewedQuestionIndex >= 0 && this.viewedQuestionIndex < this.filteredQuestionsList.length - 1) {
        this.viewedQuestionIndex++;
        const q = this.filteredQuestionsList[this.viewedQuestionIndex];
        this.loadQuestionForm(q);
      }
    });
  }

  // --- GUARDAR Y ELIMINAR ---
  saveQuestion() {
    if (!this.questionForm.text.trim()) {
      this.displayToast('El texto de la pregunta es obligatorio.', true);
      return;
    }

    if (!document.forms[0].checkValidity()) {
      this.displayToast('Verifica que todos los campos requeridos y opciones estén llenos correctamente.', true);
      return;
    }

    this.isSubmitting = true;
    
    // Clean up options before sending (ensure text and traits are set)
    const formattedOptions = this.questionForm.options.map((opt: any) => ({
      text: opt.text.trim(),
      letter: opt.letter.trim().toUpperCase() || 'A',
      steamTrait: opt.steamTrait
    }));

    const payload = {
      text: this.questionForm.text.trim(),
      order: this.questionForm.order || 1,
      options: formattedOptions,
      status: this.questionForm.status
    };

    if (this.modalMode === 'edit') {
      const q = this.filteredQuestionsList[this.viewedQuestionIndex];
      this.adminService.updateQuestion(q.id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isFormDirty = false;
          this.displayToast('Pregunta guardada exitosamente.');
          this.isModalOpen = false;
          this.loadQuestions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error al actualizar: ' + (err.error?.message || ''), true);
        }
      });
    } else {
      this.adminService.createQuestion(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isFormDirty = false;
          this.displayToast('Pregunta añadida existosamente.');
          this.isModalOpen = false;
          this.loadQuestions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error al crear: ' + (err.error?.message || ''), true);
        }
      });
    }
  }

  deleteSelected() {
    if (this.selectedQuestions.length === 0) return;
    const count = this.selectedQuestions.length;

    const msg = count > 1
      ? `¿Estás seguro de eliminar a las ${count} preguntas seleccionadas?`
      : '¿Eliminar esta pregunta definitivamente?';

    if (confirm(msg)) {
      this.isSubmitting = true;
      const deleteObservables = this.selectedQuestions.map(sq => this.adminService.deleteQuestion(sq.id));

      forkJoin(deleteObservables).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.displayToast(count > 1 ? 'Preguntas eliminadas correctamente.' : 'Pregunta eliminada correctamente.');
          this.selectedQuestions = [];
          this.loadQuestions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Hubo un error al eliminar algunas preguntas.', true);
          this.loadQuestions();
        }
      });
    }
  }

  deleteQuestionFromModal() {
    const q = this.filteredQuestionsList[this.viewedQuestionIndex];
    if (confirm(`¿Eliminar la pregunta #${q.id} definitivamente?`)) {
      this.isSubmitting = true;
      this.adminService.deleteQuestion(q.id).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.selectedQuestions = this.selectedQuestions.filter(item => item.id !== q.id);
          this.displayToast('Pregunta eliminada correctamente.');
          this.isModalOpen = false;
          this.loadQuestions();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error al eliminar: ' + (err.error?.message || ''), true);
        }
      });
    }
  }

  displayToast(message: string, isError: boolean = false) {
    this.toastService.showToast(message, isError ? 'error' : 'success');
  }

  getCount(traitValue: string): number {
    return this.questions.reduce((sum, q) => {
      if (q.status !== 'activo') return sum;
      return sum + (q.options || []).filter(o => o.steamTrait === traitValue).length;
    }, 0);
  }
}