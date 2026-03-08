import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-manage-test',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './manage-test.component.html',
  styleUrls: ['./manage-test.component.scss']
})
export class ManageTestComponent {

  // --- DATOS SIMULADOS ---
  questions = [
    { id: 1, text: '¿Disfrutas armar y desarmar aparatos electrónicos para ver cómo funcionan?', category: 'Ingeniería', secondary: 'Tecnología', status: 'Activo' },
    { id: 2, text: '¿Te resulta fácil expresar tus emociones a través del dibujo, la música o la escritura?', category: 'Artes', secondary: 'Ninguna', status: 'Activo' },
    { id: 3, text: '¿Te intriga saber de qué están compuestos los materiales y cómo reaccionan entre sí?', category: 'Ciencia', secondary: 'Matemáticas', status: 'Inactivo' },
    { id: 4, text: '¿Se te da bien resolver problemas lógicos o rompecabezas numéricos?', category: 'Matemáticas', secondary: 'Tecnología', status: 'Activo' },
    { id: 5, text: '¿Te interesa investigar el comportamiento de los seres vivos en su entorno natural?', category: 'Ciencia', secondary: 'Ninguna', status: 'Activo' },
    { id: 6, text: '¿Te gusta diseñar y programar aplicaciones o videojuegos?', category: 'Tecnología', secondary: 'Ingeniería', status: 'Activo' },
    { id: 7, text: '¿Disfrutas analizando datos estadísticos para encontrar patrones?', category: 'Matemáticas', secondary: 'Ciencia', status: 'Activo' },
    { id: 8, text: '¿Te apasiona la creación de maquetas o estructuras arquitectónicas?', category: 'Artes', secondary: 'Ingeniería', status: 'Inactivo' },
    { id: 9, text: '¿Te sientes cómodo liderando proyectos técnicos en equipo?', category: 'Ingeniería', secondary: 'Ninguna', status: 'Activo' },
    { id: 10, text: '¿Te gusta experimentar con nuevas herramientas digitales para el diseño gráfico?', category: 'Tecnología', secondary: 'Artes', status: 'Activo' },
    { id: 11, text: '¿Te gusta experimentar con nuevas herramientas digitales para el diseño gráfico?', category: 'Tecnología', secondary: 'Artes', status: 'Activo' },
  ];

  // Categorías STEAM para los selectores del formulario
  categories = ['Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas', 'Ninguna'];

  // --- VARIABLES DE ESTADO ---
  selectedQuestions: any[] = [];
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';

  viewedQuestionIndex: number = -1;
  isFormDirty = false;
  showUnsavedOverlay = false;
  pendingNavigationAction: (() => void) | null = null;

  searchTerm: string = '';
  filterCategory: string = '';

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage: number | string = 10;
  itemsPerPageOptions = [5, 10, 25, 50];

  isSubmitting = false;
  toastMessage = '';
  showToast = false;

  // --- FORMULARIO ---
  questionForm = { text: '', category: 'Ciencia', secondary: 'Ninguna', status: 'Activo' };

  // --- FUNCIONES DE TABLA / BUSQUEDA / PAGINACION ---
  get filteredQuestionsList() {
    return this.questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.filterCategory ? q.category === this.filterCategory : true;
      return matchesSearch && matchesCategory;
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

  toggleCategoryFilter(category: string) {
    if (this.filterCategory === category) {
      this.filterCategory = ''; // Deseleccionar si ya estaba activo
    } else {
      this.filterCategory = category;
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

    // Cambiamos el estado de manera directa
    const newStatus = q.status === 'Activo' ? 'Inactivo' : 'Activo';

    // Actualizamos la lista original
    const index = this.questions.findIndex(item => item.id === q.id);
    if (index > -1) {
      this.questions[index].status = newStatus;

      // Feedback visual rápido
      this.displayToast(`Pregunta #${q.id} marcada como ${newStatus}.`);
    }
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
      this.questionForm = { text: '', category: 'Ciencia', secondary: 'Ninguna', status: 'Activo' };
      this.viewedQuestionIndex = -1;
    }
    this.isModalOpen = true;
  }

  loadQuestionForm(q: any) {
    this.questionForm = { ...q };
    this.isFormDirty = false;
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

    this.isSubmitting = true;

    setTimeout(() => {
      if (this.modalMode === 'edit') {
        const q = this.filteredQuestionsList[this.viewedQuestionIndex];
        const originalIndex = this.questions.findIndex(item => item.id === q.id);
        if (originalIndex > -1) {
          this.questions[originalIndex] = { id: q.id, ...this.questionForm };
        }
      } else {
        const newId = (this.questions.length > 0 ? Math.max(...this.questions.map(item => item.id)) : 0) + 1;
        this.questions.unshift({ id: newId, ...this.questionForm });
      }

      this.isSubmitting = false;
      this.isFormDirty = false;
      this.displayToast(this.modalMode === 'create' ? 'Pregunta añadida existosamente.' : 'Pregunta guardada exitosamente.');
      this.isModalOpen = false;
    }, 800);
  }

  deleteSelected() {
    if (this.selectedQuestions.length === 0) return;
    const count = this.selectedQuestions.length;

    // Podemos seguir usando el confirm nativo para eliminar (es destructivo pero seguro)
    // O si prefieres lo cambiamos a otro modal. Usaremos confirm por simplicidad de eliminación.
    const msg = count > 1
      ? `¿Estás seguro de eliminar a las ${count} preguntas seleccionadas?`
      : '¿Eliminar esta pregunta definitivamente?';

    if (confirm(msg)) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.questions = this.questions.filter(q => !this.selectedQuestions.some(sq => sq.id === q.id));
        this.isSubmitting = false;
        this.displayToast(count > 1 ? 'Preguntas eliminadas correctamente.' : 'Pregunta eliminada correctamente.');
        this.selectedQuestions = [];
      }, 600);
    }
  }

  deleteQuestionFromModal() {
    const q = this.filteredQuestionsList[this.viewedQuestionIndex];
    if (confirm(`¿Eliminar la pregunta #${q.id} definitivamente?`)) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.questions = this.questions.filter(item => item.id !== q.id);
        this.selectedQuestions = this.selectedQuestions.filter(item => item.id !== q.id);
        this.isSubmitting = false;
        this.displayToast('Pregunta eliminada correctamente.');
        this.isModalOpen = false;
      }, 600);
    }
  }

  displayToast(message: string, isError: boolean = false) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  // --- FUNCIÓN PARA EL DASHBOARD DE BALANCE ---
  getCount(cat: string): number {
    return this.questions.filter(q => q.category === cat && q.status === 'Activo').length;
  }
}