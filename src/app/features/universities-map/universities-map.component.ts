import { Component, OnInit, inject, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import { UniversityService } from '../../core/services/university.service';
import { University } from '../../core/models/university.model';
import { Observable } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-universities-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, HeaderComponent, LucideIconComponent],
  templateUrl: './universities-map.component.html',
  styleUrls: ['./universities-map.component.scss']
})
export class UniversitiesMapComponent implements OnInit {
  private loaderService = inject(GoogleMapsLoaderService);
  private universityService = inject(UniversityService);
  private ngZone = inject(NgZone);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  isApiLoaded = false;
  isLocating = false;
  universities$: Observable<University[]> | null = null;
  
  center: google.maps.LatLngLiteral = { lat: 14.6349, lng: -90.5069 }; // Por defecto
  zoom = 6;

  // Opciones iniciales por defecto
  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  };

  ngOnInit() {
    this.loaderService.loadMapScript()
      .then(() => {
        this.isApiLoaded = true;
        this.universities$ = this.universityService.getUniversities();
        // Pedir la ubicación al iniciar
        this.getUserLocation();
      })
      .catch(err => {
        console.error('No se pudo cargar Google Maps:', err);
      });
  }

  getUserLocation() {
    if (navigator.geolocation) {
      this.isLocating = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.ngZone.run(() => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.center = userLocation;
            this.zoom = 13;
            
            if (this.googleMap) {
              this.googleMap.panTo(userLocation);
            }
            this.isLocating = false;
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.warn('Error obteniendo ubicación o permiso denegado:', error);
            this.isLocating = false;
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn('Geolocalización no soportada por el navegador.');
    }
  }

  // Método para convertir GeoPoint de Firebase a google.maps.LatLngLiteral
  getMarkerPosition(location: any): google.maps.LatLngLiteral {
    return {
      lat: location.latitude,
      lng: location.longitude
    };
  }
}


