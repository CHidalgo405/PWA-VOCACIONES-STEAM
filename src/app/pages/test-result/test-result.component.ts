import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { UniversityRecommendation, TestSubmissionResponse } from '../../core/services/test.service';

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SplashScreenComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.scss']
})
export class TestResultComponent {
  // UI States
  viewState: 'result' | 'universities' = 'result';
  isSearching: boolean = false;
  splashText: string = '';
  locationInput: string = '';

  // Modal State
  selectedUniversity: UniversityRecommendation | null = null;
  isModalOpen: boolean = false;

  // Mock User Result Data
  userProfile = {
    dominantTraits: '',
    description: ''
  };

  // Mock Universities Data
  recommendedUniversities: UniversityRecommendation[] = [];

  constructor() {
    this.loadResults();
  }

  loadResults() {
    const rawResult = localStorage.getItem('latest_test_result');
    if (rawResult) {
      const result: TestSubmissionResponse = JSON.parse(rawResult);
      this.userProfile.dominantTraits = result.dominantTraits;
      this.userProfile.description = result.aiProfileDescription;
      this.recommendedUniversities = result.recommendations;
    }
  }

  startAISearch() {
    if (!this.locationInput.trim()) {
      // In a real app we might show an error, but let's fall back to a generic message
      this.locationInput = 'tu zona';
    }

    // Set Splash parameters
    this.splashText = `Analizando opciones en ${this.locationInput}...`;
    this.isSearching = true;

    // Simulate AI API call
    setTimeout(() => {
      this.isSearching = false;
      this.viewState = 'universities';
    }, 3000);
  }

  openDetails(university: UniversityRecommendation) {
    this.selectedUniversity = university;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    // Delay setting to null so the close animation has time to finish smoothly
    setTimeout(() => {
      this.selectedUniversity = null;
    }, 300);
  }

  saveToFavorites() {
    if (!this.selectedUniversity) return;
    
    const savedUniversities = JSON.parse(localStorage.getItem('favorite_universities') || '[]');
    
    // Verificar si ya existe
    const isAlreadySaved = savedUniversities.some((u: any) => u.name === this.selectedUniversity?.name);
    
    if (!isAlreadySaved) {
      const newFav = {
        id: this.selectedUniversity.id || new Date().getTime(),
        name: this.selectedUniversity.name,
        location: this.selectedUniversity.location,
        image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000', // Foto de stock genérica de universidad
        logo: '🎓',
        tags: [this.selectedUniversity.suggestedMajor, 'Selección IA'],
        rating: 4.8
      };
      
      savedUniversities.push(newFav);
      localStorage.setItem('favorite_universities', JSON.stringify(savedUniversities));
      
      alert(`¡${this.selectedUniversity.name} guardada en tus favoritos!`);
    } else {
      alert(`¡Esta universidad ya se encuentra en tus favoritos!`);
    }
  }

  goBackToResult() {
    this.viewState = 'result';
  }
}
