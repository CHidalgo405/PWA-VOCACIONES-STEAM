import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-about-app',
  standalone: true,
  imports: [CommonModule, HeaderComponent, LucideIconComponent],
  templateUrl: './about-app.component.html',
  styleUrls: ['./about-app.component.scss']
})
export class AboutAppComponent {
  version = 'v1.2.4 (Beta)';

  changelog = [
    { version: '1.2.4', date: 'Junio 2026', desc: 'Rediseño de secciones premium, geolocalización IP.' },
    { version: '1.1.0', date: 'Mayo 2026', desc: 'Agregado simulador de carreras interactivo.' },
    { version: '1.0.0', date: 'Abril 2026', desc: 'Lanzamiento inicial en fase Beta.' }
  ];

  openLink(url: string) {
    // Para propósitos simulados, abre en nueva pestaña
    window.open(url, '_blank');
  }
}
