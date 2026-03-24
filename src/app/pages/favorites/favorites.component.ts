import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { RouterModule } from '@angular/router';

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
    const savedUni = JSON.parse(localStorage.getItem('favorite_universities') || 'null');
    const savedCourses = JSON.parse(localStorage.getItem('favorite_courses') || 'null');

    if (savedUni) {
      this.favoriteUniversities = savedUni;
    } else {
      localStorage.setItem('favorite_universities', JSON.stringify(this.favoriteUniversities));
    }
    
    if (savedCourses) {
      this.favoriteCourses = savedCourses;
    } else {
      localStorage.setItem('favorite_courses', JSON.stringify(this.favoriteCourses));
    }
  }

  simulateFetch() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1200);
  }

  switchTab(tab: 'universities' | 'courses') {
    this.activeTab = tab;
  }

  removeFromFavorites(type: 'university' | 'course', id: number) {
    if (type === 'university') {
      this.favoriteUniversities = this.favoriteUniversities.filter(u => u.id !== id);
      localStorage.setItem('favorite_universities', JSON.stringify(this.favoriteUniversities));
    } else {
      this.favoriteCourses = this.favoriteCourses.filter(c => c.id !== id);
      localStorage.setItem('favorite_courses', JSON.stringify(this.favoriteCourses));
    }
  }
}
