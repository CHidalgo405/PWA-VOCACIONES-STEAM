import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  constructor(private router: Router) { }
  currentIndex = 0;

  // Datos definidos con tus colores exactos y textos de la imagen previa
  slides = [
    {
      title: 'Ciencia y Tecnología',
      subtitle: 'Descubre el universo a través de la observación y la experimentación.',
      color: '#07B1C9', // Azul
      imgPlaceholder: '👨🏻‍🔬', // Reemplazar con <img src="...">
      bgShape: 'circle'
    },
    {
      title: 'Arte e Ingeniería',
      subtitle: 'Donde la creatividad se encuentra con la construcción del futuro.',
      color: '#F88718', // Naranja (y usaremos verde en degradado)
      imgPlaceholder: '🎨',
      bgShape: 'blob'
    },
    {
      title: 'Matemáticas',
      subtitle: 'El lenguaje universal que descifra los patrones del mundo.',
      color: '#E8372D', // Rojo
      imgPlaceholder: '📐',
      bgShape: 'square'
    }
  ];

  nextSlide() {
    if (this.currentIndex < this.slides.length - 1) {
      this.currentIndex++;
    } else {
      // Aquí redirigirías al login o register
      console.log('Finalizado, ir a Login');
      this.router.navigate(['/login']);
    }
  }

  skip() {
    this.currentIndex = this.slides.length - 1;
  }

  // Función auxiliar para obtener el color actual de forma segura
  get currentColor() {
    return this.slides[this.currentIndex].color;
  }
}