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
  userPosition: google.maps.LatLngLiteral | null = null;
  
  center: google.maps.LatLngLiteral = { lat: 14.6349, lng: -90.5069 }; // Por defecto
  zoom = 6;

  // Icono SVG personalizado para el usuario (punto azul)
  userMarkerIcon: google.maps.Icon | null = null;

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
        
        // Inicializamos el icono después de que google.maps está cargado
        this.userMarkerIcon = {
          url: 'data:image/svg+xml;utf-8, <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        };

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
            this.userPosition = userLocation;
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
        // Aumentamos el timeout y bajamos la precisión para que Safari no falle al pedir permisos
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
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


