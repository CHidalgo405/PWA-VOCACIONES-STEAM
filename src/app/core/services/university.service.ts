import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { University } from '../models/university.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UniversityService {
  private http = inject(HttpClient);

  /**
   * Busca universidades usando Google Maps Places API (New) vía REST
   * @param mapInstance La instancia nativa de google.maps.Map (ya no es obligatoria para la nueva API, pero la mantenemos por compatibilidad de firma)
   * @param location Coordenadas centrales para la búsqueda
   * @param radius Radio en metros
   */
  searchNearbyUniversities(mapInstance: any, location: google.maps.LatLngLiteral, radius: number = 30000, keyword: string = 'universidad'): Observable<University[]> {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    
    // FieldMask para pedir solo los datos que necesitamos (optimiza costos y tiempo)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': environment.googleMapsApiKey,
      'X-Goog-FieldMask': 'places.displayName,places.location,places.photos,places.id,places.formattedAddress,places.rating,places.userRatingCount,places.regularOpeningHours'
    });

    const body = {
      includedTypes: ["university"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: radius
        }
      }
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => {
        if (!response.places) {
          return [];
        }
        
        return response.places.map((place: any) => ({
          id: place.id,
          name: place.displayName?.text || 'Universidad sin nombre',
          location: {
            lat: place.location.latitude,
            lng: place.location.longitude
          },
          address: place.formattedAddress,
          rating: place.rating,
          userRatingsTotal: place.userRatingCount,
          logoUrl: place.photos && place.photos.length > 0 
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=200&maxWidthPx=200&key=${environment.googleMapsApiKey}`
            : undefined,
          isOpen: place.regularOpeningHours ? place.regularOpeningHours.openNow : undefined
        }));
      })
    );
  }
}
