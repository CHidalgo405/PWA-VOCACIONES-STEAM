import { Component, OnInit, inject, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
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
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  isApiLoaded = false;
  isLocating = false;
  isSearching = false;
  mapError = '';
  locationError = '';
  searchError = '';
  hasSearched = false;
  
  universities: University[] = [];
  selectedUniversity: University | null = null;
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
    this.loadMap();
  }

  loadMap() {
    this.mapError = '';
    this.loaderService.loadMapScript()
      .then(() => {
        this.isApiLoaded = true;
        
        // Inicializamos el icono después de que google.maps está cargado
        const svgMarker = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
        
        this.userMarkerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        };

        // Pedir la ubicación al iniciar
        this.getUserLocation();
      })
      .catch(err => {
        console.error('No se pudo cargar Google Maps:', err);
        this.isApiLoaded = false;
        this.mapError = 'No pudimos cargar Google Maps. Revisa tu conexión e intenta de nuevo.';
      });
  }

  getUserLocation() {
    if (navigator.geolocation) {
      this.isLocating = true;
      this.locationError = '';
      this.searchError = '';
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
              // Si el mapa ya está inicializado, buscar universidades cercanas
              if (this.googleMap.googleMap) {
                this.searchUniversities(this.googleMap.googleMap, userLocation);
              } else {
                // Si la instancia nativa no está lista, nos suscribimos al evento tilesloaded una sola vez
                const listener = this.googleMap.tilesloaded.subscribe(() => {
                  if (this.googleMap.googleMap) {
                    this.searchUniversities(this.googleMap.googleMap, userLocation);
                    listener.unsubscribe();
                  }
                });
              }
            }
            this.isLocating = false;
            this.locationError = '';
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.warn('Error obteniendo ubicación o permiso denegado:', error);
            this.isLocating = false;
            this.locationError = 'No pudimos acceder a tu ubicación. Activa el permiso del navegador y pulsa Reintentar ubicación.';
          });
        },
        // Aumentamos el timeout y bajamos la precisión para que Safari no falle al pedir permisos
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    } else {
      console.warn('Geolocalización no soportada por el navegador.');
      this.locationError = 'Este navegador no permite geolocalización. Puedes volver a la pantalla de explorar para usar búsqueda manual.';
    }
  }

  searchUniversities(mapInstance: google.maps.Map, location: google.maps.LatLngLiteral) {
    this.isSearching = true;
    this.searchError = '';
    this.hasSearched = true;
    this.universityService.searchNearbyUniversities(mapInstance, location, 20000).subscribe({
      next: (results) => {
        this.universities = results;
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error buscando universidades:', err);
        this.searchError = 'No pudimos consultar universidades cercanas. Intenta de nuevo en unos segundos.';
        this.isSearching = false;
      }
    });
  }

  retrySearchUniversities() {
    if (!this.userPosition || !this.googleMap?.googleMap) {
      this.getUserLocation();
      return;
    }
    this.searchUniversities(this.googleMap.googleMap, this.userPosition);
  }

  openInfoWindow(marker: MapMarker, university: University) {
    this.selectedUniversity = university;
    this.infoWindow.open(marker);
  }

  getMarkerPosition(location: { lat: number, lng: number }): google.maps.LatLngLiteral {
    return {
      lat: location.lat,
      lng: location.lng
    };
  }
}
