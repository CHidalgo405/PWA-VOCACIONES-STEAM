import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-contact-support',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './contact-support.component.html',
  styleUrls: ['./contact-support.component.scss']
})
export class ContactSupportComponent {
  isSubmitting: boolean = false;
  showToast: boolean = false;
  toastMessage: string = '';

  contactForm = {
    category: '',
    subject: '',
    message: '',
    attachment: null as File | null
  };

  categories = [
    { value: 'bug', label: 'Problema Técnico' },
    { value: 'account', label: 'Problema con mi Cuenta' },
    { value: 'suggestion', label: 'Sugerencia o Mejora' },
    { value: 'other', label: 'Otro' }
  ];

  pastTickets = [
    { id: '#1045', subject: 'No carga el mapa', status: 'Cerrado', date: 'Hace 1 mes' },
    { id: '#1092', subject: 'Sugerencia de carrera', status: 'En revisión', date: 'Hace 3 días' }
  ];

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.contactForm.attachment = file;
    }
  }

  removeAttachment() {
    this.contactForm.attachment = null;
  }

  submitTicket() {
    this.isSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.showSuccessToast('Mensaje enviado. Te responderemos pronto.');
      
      // Add to simulated tickets
      this.pastTickets.unshift({
        id: `#${Math.floor(Math.random() * 9000) + 1000}`,
        subject: this.contactForm.subject,
        status: 'Abierto',
        date: 'Justo ahora'
      });

      this.contactForm = {
        category: '',
        subject: '',
        message: '',
        attachment: null
      };
    }, 1500);
  }

  private showSuccessToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}
