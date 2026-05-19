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
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent, HeaderComponent],
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
  
  // Estado de vista
  viewMode: 'explore' | 'saved' = 'explore';
  savedUniversities: any[] = [];
  
  // Datos
  bestMatchUniversity: any = null;
  otherUniversities: any[] = [];
  
  dominantTraitsStr: string = 'STEAM';
  totalCoincidencias: number = 0;
  maxMatchPercentage: number = 0;

  universities: any[] = [];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.loadRecommendations();
        this.loadSavedUniversities();
      }
    });
  }

  loadSavedUniversities() {
    this.userService.getSavedUniversities().subscribe({
      next: (data) => {
        this.savedUniversities = data.map(item => ({
          id: item.id,
          name: item.universityName,
          location: item.location,
          image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
          logo: 'graduation-cap',
          tags: [item.careerName, 'Selección IA'],
          rating: 4.8,
          matchPercentage: 90, // Un número alto simulado para las guardadas
          career: item.careerName,
          description: item.relationshipExplanation || 'Universidad guardada.',
          keyDates: item.keyDates || 'Consultar sitio web',
          studyPlan: item.studyPlan || 'Varios módulos'
        }));
      },
      error: (err) => {
        console.error("Error loading saved universities", err);
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
        this.processData();
        this.isLoading = false;
      }
    });
  }

  processData() {
    this.totalCoincidencias = this.universities.length;
    
    if (this.universities.length > 0) {
      this.bestMatchUniversity = this.universities[0];
      // Encontrar el match máximo real del array
      this.maxMatchPercentage = Math.max(...this.universities.map(u => u.matchPercentage));
      this.otherUniversities = this.universities.slice(1);
    } else {
      this.bestMatchUniversity = null;
      this.maxMatchPercentage = 0;
      this.otherUniversities = [];
    }
  }

  // Getters computados para el filtrado en tiempo real
  get filteredOtherUniversities() {
    // Si estamos en modo 'saved', filtramos sobre las guardadas
    const sourceArray = this.viewMode === 'saved' ? this.savedUniversities : this.otherUniversities;

    if (!this.searchQuery) return sourceArray;
    const query = this.searchQuery.toLowerCase();
    return sourceArray.filter(uni => 
      uni.name.toLowerCase().includes(query) || 
      uni.location.toLowerCase().includes(query) ||
      (uni.career && uni.career.toLowerCase().includes(query))
    );
  }

  get showBestMatch() {
    // No mostrar mejor coincidencia en modo 'saved'
    if (this.viewMode === 'saved') return false;

    // Solo mostrar el mejor match si no hay búsqueda activa o si la búsqueda coincide con el mejor match
    if (!this.searchQuery) return true;
    if (!this.bestMatchUniversity) return false;
    
    const query = this.searchQuery.toLowerCase();
    return this.bestMatchUniversity.name.toLowerCase().includes(query) || 
           this.bestMatchUniversity.location.toLowerCase().includes(query) ||
           (this.bestMatchUniversity.career && this.bestMatchUniversity.career.toLowerCase().includes(query));
  }

  switchViewMode(mode: 'explore' | 'saved') {
    this.viewMode = mode;
  }

  toggleFavoriteStatus(uni: any, event: Event) {
    event.stopPropagation(); // Evitar que se abra el modal

    if (this.viewMode === 'saved') {
      // Estamos en la vista de guardados, la acción es eliminar
      this.userService.deleteSavedUniversity(uni.id).subscribe({
        next: () => {
          this.savedUniversities = this.savedUniversities.filter(u => u.id !== uni.id);
          this.toastService.showToast('Universidad eliminada de favoritos', 'info');
        },
        error: () => {
          this.toastService.showToast('No se pudo eliminar la universidad', 'error');
        }
      });
    } else {
      // Estamos en la vista de explorar, la acción es guardar
      this.saveUniversity(uni);
    }
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