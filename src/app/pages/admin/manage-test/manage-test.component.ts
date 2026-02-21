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
    { id: 4, text: '¿Se te da bien resolver problemas lógicos o rompecabezas numéricos?', category: 'Matemáticas', secondary: 'Tecnología', status: 'Activo' }
  ];

  // Categorías STEAM para los selectores del formulario
  categories = ['Ciencia', 'Tecnología', 'Ingeniería', 'Artes', 'Matemáticas', 'Ninguna'];

  // --- VARIABLES DE ESTADO ---
  selectedQuestion: any = null;
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';

  // --- FORMULARIO ---
  questionForm = { text: '', category: 'Ciencia', secondary: 'Ninguna', status: 'Activo' };

  // --- SELECCIÓN Y MODAL ---
  selectQuestion(q: any) {
    this.selectedQuestion = this.selectedQuestion?.id === q.id ? null : q;
  }

  openModal(mode: 'create' | 'edit') {
    this.modalMode = mode;
    if (mode === 'edit' && this.selectedQuestion) {
      this.questionForm = { ...this.selectedQuestion };
    } else {
      this.questionForm = { text: '', category: 'Ciencia', secondary: 'Ninguna', status: 'Activo' };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveQuestion() {
    console.log('Guardando pregunta:', this.questionForm);
    this.closeModal();
    this.selectedQuestion = null;
  }

  deleteQuestion() {
    if(confirm('¿Eliminar esta pregunta definitivamente?')) {
      console.log('Eliminada:', this.selectedQuestion.id);
      this.selectedQuestion = null;
    }
  }

  // --- FUNCIÓN PARA EL DASHBOARD DE BALANCE ---
  // Cuenta cuántas preguntas hay de cada categoría principal
  getCount(cat: string): number {
    return this.questions.filter(q => q.category === cat && q.status === 'Activo').length;
  }
}