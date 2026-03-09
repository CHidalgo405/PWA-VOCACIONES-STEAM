import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SplashScreenComponent } from '../../components/splash-screen/splash-screen.component';

interface University {
  id: number;
  name: string;
  location: string;
  suggestedMajor: string;
  matchReason: string;
  keyDates: string;
  studyPlan: string[];
  websiteUrl: string;
}

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
  selectedUniversity: University | null = null;
  isModalOpen: boolean = false;

  // Mock User Result Data
  userProfile = {
    dominantTraits: 'Ingeniería + Tecnología',
    description: 'Eres un solucionador de problemas nato. Disfrutas desarmar cosas para entender cómo funcionan y usar la tecnología para crear herramientas innovadoras. Tu mente analítica te hace ideal para carreras donde la lógica y la creatividad técnica se encuentran.'
  };

  // Mock Universities Data
  recommendedUniversities: University[] = [
    {
      id: 1,
      name: 'Universidad Tecnológica del Centro de Veracruz (UTCV)',
      location: 'Cuitláhuac, Veracruz',
      suggestedMajor: 'Ing. Mecatrónica',
      matchReason: 'Combina perfectamente tu pasión por la mecánica, la electrónica y la programación robótica.',
      keyDates: 'Próxima convocatoria: Agosto 2026',
      studyPlan: ['Robótica Industrial', 'Sistemas de Control', 'Diseño CAD/CAM', 'Programación Avanzada'],
      websiteUrl: 'https://www.utcv.edu.mx/'
    },
    {
      id: 2,
      name: 'Instituto Tecnológico de Orizaba (ITO)',
      location: 'Orizaba, Veracruz',
      suggestedMajor: 'Ing. en Sistemas Computacionales',
      matchReason: 'Excelente para potenciar tu lado tecnológico enfocado al desarrollo de software e inteligencia artificial.',
      keyDates: 'Examen de admisión: Mayo 2026',
      studyPlan: ['Estructuras de Datos', 'Inteligencia Artificial', 'Redes de Computadoras', 'Ingeniería de Software'],
      websiteUrl: 'https://www.orizaba.tecnm.mx/'
    },
    {
      id: 3,
      name: 'Universidad Veracruzana (UV)',
      location: 'Xalapa / Córdoba, Veracruz',
      suggestedMajor: 'Ing. de Software',
      matchReason: 'Destaca por su sólido programa de desarrollo tecnológico y fuertes bases en matemáticas e ingeniería.',
      keyDates: 'Registro en línea: Febrero 2026',
      studyPlan: ['Arquitectura de Software', 'Bases de Datos Avanzadas', 'Desarrollo Web Full-Stack', 'Ciberseguridad'],
      websiteUrl: 'https://www.uv.mx/'
    }
  ];

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

  openDetails(university: University) {
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
    console.log(`Guardado en favoritos: ${this.selectedUniversity?.name}`);
    alert(`¡${this.selectedUniversity?.name} guardada en tus favoritos!`);
  }

  goBackToResult() {
    this.viewState = 'result';
  }
}
