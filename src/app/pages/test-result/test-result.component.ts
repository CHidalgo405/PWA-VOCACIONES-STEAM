import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';
import { UniversityRecommendation, TestSubmissionResponse } from '../../core/services/test.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SplashScreenComponent, LucideIconComponent],
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

  private userService = inject(UserService);
  private toastService = inject(ToastService);

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
    
    const payload = {
      careerName: this.selectedUniversity.suggestedMajor,
      universityName: this.selectedUniversity.name,
      location: this.selectedUniversity.location,
      relationshipExplanation: this.selectedUniversity.matchReason,
      keyDates: this.selectedUniversity.keyDates,
      studyPlan: Array.isArray(this.selectedUniversity.studyPlan) 
                 ? this.selectedUniversity.studyPlan.join(', ') 
                 : (this.selectedUniversity.studyPlan || '')
    };

    this.userService.saveUniversity(payload).subscribe({
      next: (res) => {
        this.toastService.showToast(
          `¡${this.selectedUniversity?.name} guardada en tus favoritos!`, 
          'success', 
          '¡Guardado!'
        );
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastService.showToast('Esta universidad ya está en tus favoritos.', 'info');
        } else {
          this.toastService.showToast('No se pudo guardar la universidad. Intenta más tarde.', 'error');
        }
      }
    });
  }

  goBackToResult() {
    this.viewState = 'result';
  }
}
