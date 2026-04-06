import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <--- IMPORTANTE: Agregar esto

import { LucideIconComponent } from '../lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideIconComponent], // <--- IMPORTANTE: Agregarlo aquí también
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {}