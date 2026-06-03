import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { University } from '../models/university.model';

@Injectable({
  providedIn: 'root'
})
export class UniversityService {
  private ngZone = inject(NgZone);

  /**
   * Busca universidades usando Google Maps Places API (nearbySearch)
   * @param mapInstance La instancia nativa de google.maps.Map
   * @param location Coordenadas centrales para la búsqueda
   * @param radius Radio en metros
   */
  searchNearbyUniversities(mapInstance: google.maps.Map, location: google.maps.LatLngLiteral, radius: number = 50000): Observable<University[]> {
    return new Observable<University[]>(observer => {
      // Necesitamos ejecutar esto asegurándonos de que la librería Places esté cargada
      if (!google.maps || !google.maps.places) {
        observer.error('La librería de Google Places no está cargada.');
        return;
      }

      const service = new google.maps.places.PlacesService(mapInstance);
      
      const request: google.maps.places.PlaceSearchRequest = {
        location: location,
        radius: radius,
        type: 'university',
        keyword: 'universidad' // Opcional, para ayudar a afinar en LATAM
      };

      service.nearbySearch(request, (results, status) => {
        this.ngZone.run(() => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const mappedUniversities: University[] = results.map(place => ({
              id: place.place_id,
              name: place.name || 'Universidad sin nombre',
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              address: place.vicinity,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              logoUrl: place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 }) : undefined,
              isOpen: place.opening_hours?.isOpen()
            }));
            observer.next(mappedUniversities);
            observer.complete();
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            observer.next([]);
            observer.complete();
          } else {
            observer.error(`Error buscando lugares: ${status}`);
          }
        });
      });
    });
  }
}
