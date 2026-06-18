import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LucideIconComponent } from '../../../../components/lucide-icon/lucide-icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss']
})
export class HelpCenterComponent {
  searchQuery: string = '';

  categories = [
    { icon: 'clipboard-list', title: 'Tests Vocacionales', desc: 'Dudas sobre tus evaluaciones' },
    { icon: 'briefcase', title: 'Carreras STEAM', desc: 'Información sobre opciones' },
    { icon: 'user', title: 'Mi Cuenta', desc: 'Perfil y configuración' },
    { icon: 'alert-triangle', title: 'Fallas Técnicas', desc: 'Reportar problemas' }
  ];

  faqs = [
    {
      question: '¿Cuántos tests puedo realizar?',
      answer: 'Puedes realizar todos los tests disponibles las veces que quieras. Te recomendamos dejarlos pasar un tiempo entre intentos para ver cómo evolucionan tus intereses.',
      isOpen: false
    },
    {
      question: '¿Mis resultados se guardan automáticamente?',
      answer: 'Sí, cada vez que terminas una evaluación, los resultados se guardan en tu cuenta. Puedes verlos en la sección "Historial de Tests".',
      isOpen: false
    },
    {
      question: 'No me aparece el mapa de universidades',
      answer: 'Asegúrate de conceder permisos de ubicación en tu navegador. Si el problema persiste, revisa que no estés bloqueando el uso de JavaScript.',
      isOpen: false
    },
    {
      question: '¿Cómo elimino mi cuenta?',
      answer: 'Para eliminar tu cuenta y todos tus datos, ve a Cuenta > Administrar Perfil, y al fondo encontrarás la opción de eliminar cuenta.',
      isOpen: false
    }
  ];

  constructor(private router: Router) {}

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  goToContact() {
    this.router.navigate(['/profile/contact']);
  }
}
