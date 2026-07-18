import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private scriptLoaded = false;
  private loadPromise: Promise<void> | null = null;

  loadMapScript(): Promise<void> {
    if (this.scriptLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeoutId = window.setTimeout(() => {
        script.remove();
        this.loadPromise = null;
        reject(new Error('Google Maps tardó demasiado en responder'));
      }, 15_000);
      // Asegúrate de tener googleMapsApiKey en tu environment
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.clearTimeout(timeoutId);
        this.scriptLoaded = true;
        resolve();
      };

      script.onerror = (error) => {
        window.clearTimeout(timeoutId);
        script.remove();
        this.loadPromise = null;
        console.error('Error loading Google Maps script:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
