import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import { UniversityService } from '../../core/services/university.service';
import { University } from '../../core/models/university.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-universities-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './universities-map.component.html',
  styleUrls: ['./universities-map.component.scss']
})
export class UniversitiesMapComponent implements OnInit {
  private loaderService = inject(GoogleMapsLoaderService);
  private universityService = inject(UniversityService);

  isApiLoaded = false;
  universities$: Observable<University[]> | null = null;
  
  // Opciones de inicio del mapa (ejemplo: centrado en México/Centroamérica)
  mapOptions: google.maps.MapOptions = {
    center: { lat: 14.6349, lng: -90.5069 }, // Puedes cambiar esto al centro de tu país
    zoom: 6,
  };

  ngOnInit() {
    this.loaderService.loadMapScript()
      .then(() => {
        this.isApiLoaded = true;
        this.universities$ = this.universityService.getUniversities();
      })
      .catch(err => {
        console.error('No se pudo cargar Google Maps:', err);
      });
  }

  // Método para convertir GeoPoint de Firebase a google.maps.LatLngLiteral
  getMarkerPosition(location: any): google.maps.LatLngLiteral {
    // location es un GeoPoint de Firestore
    return {
      lat: location.latitude,
      lng: location.longitude
    };
  }
}
