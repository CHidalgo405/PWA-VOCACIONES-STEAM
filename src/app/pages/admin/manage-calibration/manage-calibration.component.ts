import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { CalibrationDeckService, CalibrationDeck, CalibrationCard } from '../../../core/services/calibration-deck.service';

const AXES = ['ciencia', 'tecnologia', 'ingenieria', 'artes', 'matematicas'];

function emptyForm(): CalibrationDeck {
  return { moduleId: '', title: '', subtitle: '', icon: 'sparkles', order: 0, status: 'activo', cards: [] };
}

@Component({
  selector: 'app-manage-calibration',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent, LucideIconComponent],
  templateUrl: './manage-calibration.component.html',
  styleUrls: ['./manage-calibration.component.scss'],
})
export class ManageCalibrationComponent implements OnInit {
  private deckService = inject(CalibrationDeckService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  readonly axes = AXES;
  decks = signal<CalibrationDeck[]>([]);
  isLoading = signal(true);

  // Modal
  isModalOpen = signal(false);
  modalMode: 'create' | 'edit' = 'create';
  currentId = '';
  form: CalibrationDeck = emptyForm();
  isSaving = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.deckService.getAllDecks().subscribe({
      next: (decks) => { this.decks.set(decks); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.toast.showToast('No se pudieron cargar los módulos.', 'error'); },
    });
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.currentId = '';
    this.form = emptyForm();
    this.form.order = this.decks().length + 1;
    this.isModalOpen.set(true);
  }

  openEdit(deck: CalibrationDeck): void {
    this.modalMode = 'edit';
    this.currentId = deck.id || '';
    // Copia profunda para no mutar la fila de la tabla mientras se edita.
    this.form = {
      ...deck,
      cards: deck.cards.map((c) => ({ ...c })),
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    if (this.isSaving) return;
    this.isModalOpen.set(false);
  }

  addCard(): void {
    this.form.cards.push({ id: 'c' + Date.now().toString(36), text: '', category: 'tecnologia' });
  }

  removeCard(index: number): void {
    this.form.cards.splice(index, 1);
  }

  save(): void {
    if (!this.form.title.trim()) { this.toast.showToast('El título es obligatorio.', 'error'); return; }
    if (this.modalMode === 'create' && !this.form.moduleId.trim()) {
      this.toast.showToast('El identificador (moduleId) es obligatorio.', 'error'); return;
    }
    const validCards = this.form.cards.filter((c) => c.text.trim());
    if (validCards.length < 3) { this.toast.showToast('Agrega al menos 3 tarjetas con texto.', 'error'); return; }

    this.isSaving = true;
    const payload: Partial<CalibrationDeck> = {
      moduleId: this.slugify(this.form.moduleId),
      title: this.form.title.trim(),
      subtitle: (this.form.subtitle || '').trim(),
      icon: this.form.icon || 'sparkles',
      order: Number(this.form.order) || 0,
      status: this.form.status,
      cards: validCards.map((c) => ({ ...c, text: c.text.trim() })),
    };

    const req = this.modalMode === 'create'
      ? this.deckService.createDeck(payload)
      : this.deckService.updateDeck(this.currentId, payload);

    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.isModalOpen.set(false);
        this.toast.showToast(this.modalMode === 'create' ? 'Módulo creado.' : 'Módulo actualizado.', 'success');
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.showToast('Error: ' + (err.error?.message || 'no se pudo guardar'), 'error');
      },
    });
  }

  async remove(deck: CalibrationDeck): Promise<void> {
    const ok = await this.dialog.confirm(
      'Eliminar módulo',
      `¿Eliminar "${deck.title}"? Los estudiantes dejarán de verlo. Esta acción no borra las respuestas ya registradas.`,
      { confirmText: 'Sí, eliminar', isDanger: true },
    );
    if (!ok) return;
    this.deckService.deleteDeck(deck.id!).subscribe({
      next: () => { this.toast.showToast('Módulo eliminado.', 'success'); this.load(); },
      error: () => this.toast.showToast('No se pudo eliminar.', 'error'),
    });
  }

  cardCountByAxis(deck: CalibrationDeck, axis: string): number {
    return deck.cards.filter((c) => c.category === axis).length;
  }

  private slugify(v: string): string {
    return v.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
}
