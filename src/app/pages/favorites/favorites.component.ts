import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  
  activeTab: 'universities' | 'courses' = 'universities';
  isLoading: boolean = true;
  skeletonArray = Array(3).fill(0);

  private userService = inject(UserService);
  private toastService = inject(ToastService);

  // Datos simulados (Iguales a los del Explorer pero filtrados como "favoritos")
  favoriteUniversities = [
    {
      id: 1,
      name: 'Universidad Tecnológica (UTCV)',
      location: 'Veracruz, 5km',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
      logo: '🎓',
      tags: ['Ingeniería', 'Mecatrónica'],
      rating: 4.8
    },
    {
      id: 2,
      name: 'Instituto Politécnico',
      location: 'Ciudad de México, 120km',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
      logo: '🏛️',
      tags: ['Ciencias', 'Investigación'],
      rating: 4.9
    }
  ];

  favoriteCourses = [
    {
      id: 101,
      title: 'Desarrollo Web Full Stack',
      provider: 'Udemy',
      duration: '12 horas',
      image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=1000',
      level: 'Intermedio',
      isFree: false
    }
  ];

  ngOnInit() {
    this.loadFavorites();
    this.simulateFetch();
  }

  loadFavorites() {
    this.isLoading = true;
    this.userService.getSavedUniversities().subscribe({
      next: (data) => {
        this.favoriteUniversities = data.map(item => ({
          id: item.id,
          name: item.universityName,
          location: item.location,
          image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
          logo: '🎓',
          tags: [item.careerName, 'Selección IA'],
          rating: 4.8
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading favorites", err);
        this.isLoading = false;
        this.toastService.showToast('No se pudieron cargar tus favoritos.', 'error');
      }
    });

    // Cursos aún en localStorage hasta que el usuario pase los endpoints
    const savedCourses = JSON.parse(localStorage.getItem('favorite_courses') || 'null');
    if (savedCourses) {
      this.favoriteCourses = savedCourses;
    }
  }

  simulateFetch() {
    // Ya no es necesario para universidades pero lo dejamos para compatibilidad visual con cursos
    if (this.favoriteCourses.length > 0) {
       // ...
    }
  }

  switchTab(tab: 'universities' | 'courses') {
    this.activeTab = tab;
  }

  removeFromFavorites(type: 'university' | 'course', id: any) {
    if (type === 'university') {
      this.userService.deleteSavedUniversity(id).subscribe({
        next: () => {
          this.favoriteUniversities = this.favoriteUniversities.filter(u => u.id !== id);
          this.toastService.showToast('Universidad eliminada de favoritos', 'info');
        },
        error: () => {
          this.toastService.showToast('No se pudo eliminar la universidad', 'error');
        }
      });
    } else {
      this.favoriteCourses = this.favoriteCourses.filter(c => c.id !== id);
      localStorage.setItem('favorite_courses', JSON.stringify(this.favoriteCourses));
    }
  }
}
