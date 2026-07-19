import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

interface HelpCategory {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

interface HelpFaq {
  category: string;
  question: string;
  answer: string;
  keywords: string;
  isOpen: boolean;
  action?: 'delete-account';
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss'],
})
export class HelpCenterComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  searchQuery = '';
  activeCategory: string | null = null;
  showDeletePanel = false;
  deleteConfirmation = '';
  deletePassword = '';
  deleteError = '';
  isDeleting = false;

  readonly categories: HelpCategory[] = [
    {
      id: 'tests',
      icon: 'clipboard-list',
      title: 'Tests Vocacionales',
      desc: 'Evaluaciones, resultados y sincronización',
    },
    {
      id: 'careers',
      icon: 'briefcase',
      title: 'Carreras STEAM',
      desc: 'Simuladores, mapa y recomendaciones',
    },
    {
      id: 'account',
      icon: 'user',
      title: 'Mi Cuenta',
      desc: 'Perfil, privacidad y eliminación',
    },
    {
      id: 'technical',
      icon: 'alert-triangle',
      title: 'Fallas Técnicas',
      desc: 'Conectividad, PWA y soporte',
    },
  ];

  readonly faqs: HelpFaq[] = [
    {
      category: 'tests',
      question: '¿Cuántos tests puedo realizar?',
      answer:
        'Puedes repetir el test principal. Cada intento confirmado se conserva en tu historial para que compares la evolución de tus intereses.',
      keywords: 'evaluación repetir intento historial',
      isOpen: false,
    },
    {
      category: 'tests',
      question: '¿Mis resultados se guardan automáticamente?',
      answer:
        'Sí. Si pierdes conexión, el resultado se guarda en una cola local y se reintenta automáticamente con el mismo identificador para evitar duplicados.',
      keywords: 'offline sincronización guardar resultados cola',
      isOpen: false,
    },
    {
      category: 'careers',
      question: '¿Dónde encuentro mis simulaciones completadas?',
      answer:
        'Abre Simuladores y activa “Mis simulaciones”. El catálogo mostrará únicamente las experiencias que ya terminaste.',
      keywords: 'simuladores completados afinidad carreras',
      isOpen: false,
    },
    {
      category: 'careers',
      question: 'No me aparece el mapa de universidades',
      answer:
        'Concede permiso de ubicación al navegador. También puedes usar la búsqueda manual; si el error continúa, crea un ticket desde Contactar soporte.',
      keywords: 'mapa ubicación universidades permiso gps',
      isOpen: false,
    },
    {
      category: 'technical',
      question: '¿Cómo activo las notificaciones push?',
      answer:
        'Instala la PWA, abre Perfil > Notificaciones y pulsa “Activar aquí”. Tu navegador pedirá permiso antes de registrar el dispositivo.',
      keywords: 'push permiso navegador instalar pwa alertas',
      isOpen: false,
    },
    {
      category: 'technical',
      question: '¿Cómo reporto una falla con una captura?',
      answer:
        'En Contactar soporte puedes crear un ticket y adjuntar una imagen o PDF de hasta 5 MB. El folio y las respuestas quedan disponibles en esa pantalla.',
      keywords: 'soporte ticket captura archivo pdf problema',
      isOpen: false,
    },
    {
      category: 'account',
      question: '¿Cómo elimino mi cuenta y mis datos?',
      answer:
        'Puedes hacerlo desde la zona de peligro de este centro. La operación elimina definitivamente tu perfil, resultados, cachés y archivos de soporte; no se puede deshacer.',
      keywords: 'eliminar borrar cuenta privacidad datos derecho',
      isOpen: false,
      action: 'delete-account',
    },
  ];

  get filteredFaqs(): HelpFaq[] {
    const query = this.normalize(this.searchQuery);
    return this.faqs.filter((faq) => {
      const categoryMatches =
        !this.activeCategory || faq.category === this.activeCategory;
      const searchMatches =
        !query ||
        this.normalize(
          `${faq.question} ${faq.answer} ${faq.keywords}`,
        ).includes(query);
      return categoryMatches && searchMatches;
    });
  }

  selectCategory(categoryId: string): void {
    this.activeCategory =
      this.activeCategory === categoryId ? null : categoryId;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory = null;
  }

  toggleFaq(faq: HelpFaq): void {
    faq.isOpen = !faq.isOpen;
  }

  openFaqAction(faq: HelpFaq, event: Event): void {
    event.stopPropagation();
    if (faq.action === 'delete-account') this.showDeletePanel = true;
  }

  closeDeletePanel(): void {
    if (this.isDeleting) return;
    this.showDeletePanel = false;
    this.deleteConfirmation = '';
    this.deletePassword = '';
    this.deleteError = '';
  }

  deleteAccount(): void {
    if (this.isDeleting || this.deleteConfirmation !== 'ELIMINAR') return;
    this.isDeleting = true;
    this.deleteError = '';
    this.userService
      .deleteOwnAccount({
        confirmation: this.deleteConfirmation,
        password: this.deletePassword || undefined,
      })
      .subscribe({
        next: () => {
          this.authService.clearSession();
          this.router.navigate(['/welcome'], {
            state: { accountDeleted: true },
          });
        },
        error: (error) => {
          this.isDeleting = false;
          this.deleteError =
            error?.error?.message || 'No se pudo eliminar la cuenta.';
        },
      });
  }

  goToContact(): void {
    this.router.navigate(['/profile/contact']);
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
