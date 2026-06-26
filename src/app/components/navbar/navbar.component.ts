import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <--- IMPORTANTE: Agregar esto

import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent], // <--- IMPORTANTE: Agregarlo aquí también
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  pwaInstall = inject(PwaInstallService);
}