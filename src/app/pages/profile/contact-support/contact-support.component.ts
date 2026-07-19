import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import {
  SupportService,
  SupportTicket,
} from '../../../core/services/support.service';

@Component({
  selector: 'app-contact-support',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './contact-support.component.html',
  styleUrls: ['./contact-support.component.scss'],
})
export class ContactSupportComponent implements OnInit {
  private readonly supportService = inject(SupportService);

  isSubmitting = false;
  isLoadingTickets = true;
  ticketsError = '';
  showToast = false;
  toastMessage = '';

  contactForm = this.emptyForm();
  pastTickets: SupportTicket[] = [];

  readonly categories = [
    { value: 'bug', label: 'Problema Técnico' },
    { value: 'account', label: 'Problema con mi Cuenta' },
    { value: 'suggestion', label: 'Sugerencia o Mejora' },
    { value: 'other', label: 'Otro' },
  ];

  ngOnInit(): void {
    this.loadTickets();
  }

  private emptyForm() {
    return {
      category: '',
      subject: '',
      message: '',
      attachment: null as File | null,
    };
  }

  loadTickets(): void {
    this.isLoadingTickets = true;
    this.ticketsError = '';
    this.supportService.getOwnTickets().subscribe({
      next: (tickets) => {
        this.pastTickets = tickets;
        this.isLoadingTickets = false;
      },
      error: () => {
        this.ticketsError =
          'No pudimos consultar tus tickets. Inténtalo de nuevo.';
        this.isLoadingTickets = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.showMessage('Adjunta una imagen o PDF de máximo 5 MB.');
      return;
    }
    this.contactForm.attachment = file;
  }

  removeAttachment(): void {
    this.contactForm.attachment = null;
  }

  submitTicket(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.supportService.createTicket(this.contactForm).subscribe({
      next: ({ ticket, emailDelivered }) => {
        this.pastTickets.unshift(ticket);
        this.contactForm = this.emptyForm();
        this.isSubmitting = false;
        this.showMessage(
          emailDelivered
            ? `Ticket ${ticket.reference} creado. También enviamos la confirmación a tu correo.`
            : `Ticket ${ticket.reference} creado. Puedes seguirlo desde esta pantalla.`,
        );
      },
      error: (error) => {
        this.isSubmitting = false;
        this.showMessage(
          error?.error?.message ||
            'No se pudo crear el ticket. Revisa los datos e inténtalo de nuevo.',
        );
      },
    });
  }

  downloadAttachment(ticket: SupportTicket): void {
    if (!ticket.hasAttachment) return;
    this.supportService.downloadAttachment(ticket.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = ticket.attachmentName || 'adjunto';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.showMessage('No se pudo descargar el archivo adjunto.'),
    });
  }

  statusLabel(status: SupportTicket['status']): string {
    return (
      {
        open: 'Abierto',
        in_review: 'En revisión',
        resolved: 'Resuelto',
        closed: 'Cerrado',
      }[status] || status
    );
  }

  private showMessage(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    window.setTimeout(() => (this.showToast = false), 4500);
  }
}
