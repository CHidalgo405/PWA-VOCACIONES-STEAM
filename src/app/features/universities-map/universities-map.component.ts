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
  
  universities: University[] = [];
  selectedUniversity: University | null = null;
  userPosition: google.maps.LatLngLiteral | null = null;
  
  center: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 }; // CDMX por defecto
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
      });
  }

  getUserLocation() {
    this.isLocating = true;

    // Función de respaldo robusta si falla la geolocalización nativa (Muy común en Safari)
    const runIpFallback = async (reason: string) => {
      console.warn(`Geolocation failed (${reason}). Intentando IP fallback...`);
      try {
        const response = await fetch('https://ipwho.is/');
        const data = await response.json();
        if (data.success && data.latitude && data.longitude) {
          this.ngZone.run(() => {
            const userLocation = { lat: data.latitude, lng: data.longitude };
            this.center = userLocation;
            this.userPosition = userLocation;
            this.zoom = 13;
            if (this.googleMap) {
              this.googleMap.panTo(userLocation);
              if (this.googleMap.googleMap) {
                this.searchUniversities(this.googleMap.googleMap, userLocation);
              }
            }
            this.isLocating = false;
          });
          return true;
        }
      } catch (err) {
        console.error('IP Fallback falló:', err);
      }
      return false;
    };

    if (navigator.geolocation) {
      // Manual timeout fallback for Safari bug where callbacks are never fired
      const safariTimeout = setTimeout(async () => {
        if (this.isLocating) {
          const success = await runIpFallback('Timeout manual Safari');
          if (!success) {
            this.ngZone.run(() => {
              this.isLocating = false;
              if (this.googleMap && this.googleMap.googleMap) {
                 this.searchUniversities(this.googleMap.googleMap, this.center);
              }
            });
          }
        }
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(safariTimeout);
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
          });
        },
        async (error) => {
          clearTimeout(safariTimeout);
          const success = await runIpFallback(`Error nativo: ${error.message}`);
          if (!success) {
            this.ngZone.run(() => {
              this.isLocating = false;
              if (this.googleMap && this.googleMap.googleMap) {
                 this.searchUniversities(this.googleMap.googleMap, this.center);
              }
            });
          }
        },
        // Configuración crítica para Safari
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      runIpFallback('Sin soporte nativo').then(success => {
        if (!success) {
          this.ngZone.run(() => {
            this.isLocating = false;
            if (this.googleMap && this.googleMap.googleMap) {
               this.searchUniversities(this.googleMap.googleMap, this.center);
            }
          });
        }
      });
    }
  }

  searchUniversities(mapInstance: google.maps.Map, location: google.maps.LatLngLiteral) {
    this.isSearching = true;
    this.universityService.searchNearbyUniversities(mapInstance, location, 20000).subscribe({
      next: (results) => {
        this.universities = results;
        this.isSearching = false;
      },
      error: (err) => {
        console.error('Error buscando universidades:', err);
        this.isSearching = false;
      }
    });
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


