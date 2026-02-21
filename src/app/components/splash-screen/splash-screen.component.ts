import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss']
})
export class SplashScreenComponent implements OnInit {
  showSplash = true;
  fadeOut = false;

  ngOnInit() {
    // Simulamos un tiempo de carga de 2.5 segundos
    setTimeout(() => {
      this.fadeOut = true; // Inicia la animación de desvanecimiento
      
      // Esperamos a que termine la animación (0.5s) para removerlo del DOM
      setTimeout(() => {
        this.showSplash = false;
      }, 500); 
    }, 2500);
  }
}