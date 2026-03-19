import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms'; // Para el buscador
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, RouterModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  
  hasTakenTest = false;

  constructor(private authService: AuthService) {}

  activeTab: 'universities' | 'courses' = 'universities';
  searchQuery: string = '';
  selectedFilter: string = 'Todas';
  isLoading: boolean = true;
  skeletonArray = Array(4).fill(0); // Array ficticio para renderizar 4 skeletons

  // Variables para el Modal de Detalles del Curso
  isCourseModalOpen: boolean = false;
  selectedCourse: any = null;
  
  // Datos simulados para el temario del curso (Syllabus)
  courseSyllabus = [
    { module: 1, title: 'Introducción y Conceptos Básicos', duration: '2h 15m' },
    { module: 2, title: 'Herramientas y Entorno de Trabajo', duration: '3h 40m' },
    { module: 3, title: 'Proyecto Práctico Final', duration: '5h 00m' }
  ];

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

  ngOnInit() {
    this.simulateFetch();
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.hasTakenTest = localStorage.getItem(`hasTakenTest_${user.id}`) === 'true';
      }
    });
  }

  simulateFetch() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  // Getters computados para el filtrado en tiempo real
  get filteredUniversities() {
    return this.universities.filter(uni => {
      const matchesSearch = uni.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            uni.location.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesFilter = this.selectedFilter === 'Todas' || uni.tags.includes(this.selectedFilter);
      return matchesSearch && matchesFilter;
    });
  }

  get filteredCourses() {
    return this.courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                            course.provider.toLowerCase().includes(this.searchQuery.toLowerCase());
      // Nota: Asumiendo que cursos podrían no tener arr de tags, filtramos solo por Todas por ahora, o podrías agregar lógica extra.
      const matchesFilter = this.selectedFilter === 'Todas'; 
      return matchesSearch && matchesFilter;
    });
  }

  switchTab(tab: 'universities' | 'courses') {
    this.activeTab = tab;
    // Opcional: Volver a simular carga al cambiar de pestaña
    // this.simulateFetch();
  }

  // Métodos para el Modal
  openCourseDetail(course: any) {
    this.selectedCourse = course;
    this.isCourseModalOpen = true;
  }

  closeCourseModal() {
    this.isCourseModalOpen = false;
    setTimeout(() => {
      this.selectedCourse = null; // Limpiar después de la animación
    }, 300);
  }
}