import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  userName = 'Estudiante'; // Esto vendría de tu base de datos

  constructor(private router: Router) { }

  startTest() {
    this.router.navigate(['/vocation-test']);
  }

  // Estado del usuario: ¿Ya hizo el test?
  hasTakenTest = false;

  // Categorías rápidas (STEAM)
  categories = [
    { name: 'Ciencia', icon: '🧬', color: '#07B1C9' },
    { name: 'Tecnología', icon: '💻', color: '#4DB046' }, // Usando verde ingeniería
    { name: 'Ingeniería', icon: '⚙️', color: '#F88718' },
    { name: 'Artes', icon: '🎨', color: '#E8372D' },
    { name: 'Matemáticas', icon: '📐', color: '#8E44AD' },
  ];

  // Recomendaciones simuladas
  recommendedCourses = [
    { title: 'Intro a Python', provider: 'Coursera', time: '4h', image: '🐍' },
    { title: 'Diseño UX/UI', provider: 'Google', time: '6h', image: '✨' },
    { title: 'Robótica Básica', provider: 'EdX', time: '8h', image: '🤖' }
  ];
}