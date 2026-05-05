import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms'; // Para el buscador
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { VocationTestService, TestDetail } from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, RouterModule, LucideIconComponent],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  
  hasTakenTest = false;
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private testService = inject(VocationTestService);

  constructor(private authService: AuthService) {}

  searchQuery: string = '';
  isLoading: boolean = true;
  skeletonArray = Array(4).fill(0); // Array ficticio para renderizar 4 skeletons

  // Variables para Modales
  isUniversityModalOpen: boolean = false;
  selectedUniversity: any = null;
  
  // Datos
  bestMatchUniversity: any = null;
  otherUniversities: any[] = [];
  
  dominantTraitsStr: string = 'STEAM';
  totalCoincidencias: number = 0;
  maxMatchPercentage: number = 0;

  // Datos Simulados Hardcodeados por si no hay test
  universities = [
    {
      id: 1,
      name: 'Universidad Nacional Autónoma de México',
      location: 'Ciudad de México, Ciudad de México',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
      logo: 'building',
      tags: ['Universidad pública', 'Matemáticas + Ciencia'],
      rating: 4.8,
      matchPercentage: 95,
      career: 'Ingeniería en Computación',
      description: 'Líder en formación tecnológica y científica en el país.',
      keyDates: 'Examen: 15 de Julio',
      studyPlan: 'Matemáticas, Electrónica, Computación.'
    },
    {
      id: 2,
      name: 'Instituto Politécnico Nacional',
      location: 'Ciudad de México, Ciudad de México',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
      logo: 'graduation-cap',
      tags: ['Matemáticas + Ciencia', 'Universidad pública'],
      rating: 4.8,
      matchPercentage: 92,
      career: 'Ingeniería en Sistemas Computacionales',
      description: 'Excelencia académica en el área de ingeniería y ciencias físico-matemáticas.',
      keyDates: 'Convocatoria: Febrero - Marzo',
      studyPlan: 'Algoritmos, Estructuras de Datos, Redes, IA.'
    },
    {
      id: 3,
      name: 'Universidad Autónoma Metropolitana',
      location: 'Ciudad de México, Ciudad de México',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',
      logo: 'graduation-cap',
      tags: ['Ciencias Básicas', 'Universidad pública'],
      rating: 4.7,
      matchPercentage: 89,
      career: 'Licenciatura en Computación',
      description: 'Espacio dedicado a la investigación y desarrollo.',
      keyDates: 'Inscripciones: Todo el año',
      studyPlan: 'Lógica, Programación, Arquitectura de Computadoras.'
    },
    {
      id: 4,
      name: 'Tec de Monterrey (ITESM)',
      location: 'Santa Fe, Ciudad de México',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
      logo: 'graduation-cap',
      tags: ['Tecnología', 'Universidad privada'],
      rating: 4.9,
      matchPercentage: 85,
      career: 'Ingeniería en Tecnologías Computacionales',
      description: 'Prestigio internacional con enfoque en emprendimiento e innovación.',
      keyDates: 'Admisiones: Agosto y Enero',
      studyPlan: 'Software, Innovación, Liderazgo, Cloud.'
    }
  ];

  ngOnInit() {
    this.processData(); // Procesar hardcoded data initially
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.loadRecommendations();
      }
    });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest && latestTest.recommendations && latestTest.recommendations.length > 0) {
          this.hasTakenTest = true;
          this.dominantTraitsStr = latestTest.dominantTraits || 'STEAM';
          
          // Mapear recomendaciones de IA al formato de UI
          const defaultImages = [
            'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000'
          ];
          
          this.universities = latestTest.recommendations.map((rec: any, index: number) => {
            // Simulamos un Match descendente a partir del 95%
            const matchPct = Math.max(70, 95 - (index * 3));
            
            return {
              id: index + 1,
              name: rec.name,
              location: rec.location || 'Ubicación no especificada',
              image: defaultImages[index % defaultImages.length],
              logo: index === 0 ? 'building' : 'graduation-cap', 
              tags: [latestTest.dominantTraits || 'Ciencia', 'Universidad recomendada'],
              rating: parseFloat((4.9 - (index * 0.1)).toFixed(1)), // Rating simulado descendentemente
              matchPercentage: matchPct,
              career: rec.suggestedMajor,
              description: rec.matchReason,
              keyDates: rec.keyDates || 'Consultar sitio web oficial',
              studyPlan: Array.isArray(rec.studyPlan) ? rec.studyPlan.join(', ') : (rec.studyPlan || 'Plan multidisciplinario.')
            };
          });
        }
        
        this.processData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching recommendations from latest test', err);
        this.processData(); // Fallback to hardcoded
        this.isLoading = false;
      }
    });
  }

  processData() {
    this.totalCoincidencias = this.universities.length * 10 + 7; // Fake number like 47
    
    if (this.universities.length > 0) {
      this.bestMatchUniversity = this.universities[0];
      this.maxMatchPercentage = this.bestMatchUniversity.matchPercentage;
      this.otherUniversities = this.universities.slice(1);
    } else {
      this.bestMatchUniversity = null;
      this.otherUniversities = [];
    }
  }

  // Getters computados para el filtrado en tiempo real
  get filteredOtherUniversities() {
    if (!this.searchQuery) return this.otherUniversities;
    const query = this.searchQuery.toLowerCase();
    return this.otherUniversities.filter(uni => 
      uni.name.toLowerCase().includes(query) || 
      uni.location.toLowerCase().includes(query) ||
      uni.career.toLowerCase().includes(query)
    );
  }

  get showBestMatch() {
    // Solo mostrar el mejor match si no hay búsqueda activa o si la búsqueda coincide con el mejor match
    if (!this.searchQuery) return true;
    if (!this.bestMatchUniversity) return false;
    
    const query = this.searchQuery.toLowerCase();
    return this.bestMatchUniversity.name.toLowerCase().includes(query) || 
           this.bestMatchUniversity.location.toLowerCase().includes(query) ||
           this.bestMatchUniversity.career.toLowerCase().includes(query);
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