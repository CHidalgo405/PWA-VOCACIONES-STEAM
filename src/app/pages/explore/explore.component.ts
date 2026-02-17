import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms'; // Para el buscador

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent {
  
  activeTab: 'universities' | 'courses' = 'universities';
  searchQuery: string = '';
  selectedFilter: string = 'Todas';

  // Filtros rápidos (Chips)
  filters = ['Todas', 'Ingeniería', 'Salud', 'Artes', 'Tecnología'];

  // Datos Simulados: Universidades
  universities = [
    {
      name: 'Universidad Tecnológica (UTCV)',
      location: 'Veracruz, 5km',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
      logo: '🎓',
      tags: ['Ingeniería', 'Mecatrónica'],
      rating: 4.8
    },
    {
      name: 'Instituto Politécnico',
      location: 'Ciudad de México, 120km',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
      logo: '🏛️',
      tags: ['Ciencias', 'Investigación'],
      rating: 4.9
    },
    {
      name: 'Escuela de Artes Visuales',
      location: 'Centro, 2km',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',
      logo: '🎨',
      tags: ['Artes', 'Diseño'],
      rating: 4.5
    }
  ];

  // Datos Simulados: Cursos
  courses = [
    {
      title: 'Introducción a la IA',
      provider: 'Google Activate',
      duration: '40 horas',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000',
      level: 'Principiante',
      isFree: true
    },
    {
      title: 'Desarrollo Web Full Stack',
      provider: 'Udemy',
      duration: '12 horas',
      image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1000',
      level: 'Intermedio',
      isFree: false
    }
  ];

  switchTab(tab: 'universities' | 'courses') {
    this.activeTab = tab;
  }
}