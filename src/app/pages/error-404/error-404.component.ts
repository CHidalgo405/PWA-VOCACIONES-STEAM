import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Importamos Location
import { RouterModule } from '@angular/router';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
    selector: 'app-error-404',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideIconComponent],
    templateUrl: './error-404.component.html',
    styleUrls: ['./error-404.component.scss']
})
export class Error404Component {

  // Inyectamos el servicio Location
  constructor(private location: Location) {}

  goBack() {
    // Vuelve a la página anterior en el historial del navegador
    this.location.back();
  }
}