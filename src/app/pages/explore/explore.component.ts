import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms'; // Para el buscador
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, RouterModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  
  hasTakenTest = false;
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  constructor(private authService: AuthService) {}

  activeTab: 'universities' | 'courses' = 'universities';
  searchQuery: string = '';
  selectedFilter: string = 'Todas';
  isLoading: boolean = true;
  skeletonArray = Array(4).fill(0); // Array ficticio para renderizar 4 skeletons

  // Variables para Modales
  isCourseModalOpen: boolean = false;
  selectedCourse: any = null;

  isUniversityModalOpen: boolean = false;
  selectedUniversity: any = null;
  
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
      id: 1,
      name: 'Universidad Tecnológica (UTCV)',
      location: 'Veracruz, 5km',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
      logo: '🎓',
      tags: ['Ingeniería', 'Mecatrónica'],
      rating: 4.8,
      career: 'Ingeniería en Mecatrónica',
      description: 'Líder en formación tecnológica en la región de las altas montañas.',
      keyDates: 'Examen: 15 de Julio',
      studyPlan: 'Matemáticas, Electrónica, Robótica, Control.'
    },
    {
      id: 2,
      name: 'Instituto Politécnico Nacional',
      location: 'Ciudad de México, 120km',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
      logo: '🏛️',
      tags: ['Ciencias', 'Investigación'],
      rating: 4.9,
      career: 'Ingeniería en Sistemas Computacionales',
      description: 'Excelencia académica en el área de ingeniería y ciencias físico-matemáticas.',
      keyDates: 'Convocatoria: Febrero - Marzo',
      studyPlan: 'Algoritmos, Estructuras de Datos, Redes, IA.'
    },
    {
      id: 3,
      name: 'Escuela de Artes Visuales',
      location: 'Centro, 2km',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',
      logo: '🎨',
      tags: ['Artes', 'Diseño'],
      rating: 4.5,
      career: 'Licenciatura en Diseño Gráfico',
      description: 'Espacio creativo para el desarrollo de talentos artísticos y visuales.',
      keyDates: 'Inscripciones: Todo el año',
      studyPlan: 'Dibujo, Teoría del Color, Diseño Digital.'
    },
    {
      id: 4,
      name: 'Tec de Monterrey (ITESM)',
      location: 'Santa Fe, 15km',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
      logo: '🎓',
      tags: ['Tecnología', 'Negocios'],
      rating: 4.9,
      career: 'Ingeniería en Tecnologías Computacionales',
      description: 'Prestigio internacional con enfoque en emprendimiento e innovación.',
      keyDates: 'Admisiones: Agosto y Enero',
      studyPlan: 'Software, Innovación, Liderazgo, Cloud.'
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

  // Métodos para el Modal de Universidad
  openUniversityDetail(uni: any) {
    this.selectedUniversity = uni;
    this.isUniversityModalOpen = true;
  }

  closeUniversityModal() {
    this.isUniversityModalOpen = false;
    setTimeout(() => {
      this.selectedUniversity = null;
    }, 300);
  }

  saveUniversity(uni?: any) {
    const targetUni = uni || this.selectedUniversity;
    if (!targetUni) return;

    const payload = {
      careerName: targetUni.career || targetUni.tags[0],
      universityName: targetUni.name,
      location: targetUni.location,
      relationshipExplanation: targetUni.description || 'Universidad destacada en tu área de interés.',
      keyDates: targetUni.keyDates || 'Consultar sitio web',
      studyPlan: targetUni.studyPlan || 'Varios módulos'
    };

    this.userService.saveUniversity(payload).subscribe({
      next: () => {
        this.toastService.showToast(`¡${targetUni.name} guardada!`, 'success');
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastService.showToast('Ya está en tus favoritos', 'info');
        } else {
          this.toastService.showToast('Error al guardar', 'error');
        }
      }
    });
  }
}