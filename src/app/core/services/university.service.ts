import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { University } from '../models/university.model';
import { environment } from '../../../environments/environment';

// ── Contrato del algoritmo A8 (POST /universities/match) ────────────────────

export type CostTier = 'public' | 'affordable' | 'private-premium';
export type CostPreference = 'public' | 'affordable' | 'any';

export interface UniversityMatchFilters {
  /** 10 | 25 | 50 | 100 km — se aplican sobre el caché del backend, sin IA. */
  maxDistanceKm: number;
  costPreference: CostPreference;
}

export interface UniversityMatchItem {
  universityId: string;
  name: string;
  matchedCareer: string;
  /** Match real: baseScore determinista + ajuste acotado de la IA (±10). */
  matchScore: number;
  distanceKm: number;
  costTier: CostTier;
  explanation: string;
  websiteUrl?: string;
  /** Rango de colegiatura legible (dato duro, no lo genera la IA). */
  tuitionRange?: string;
  /** presencial | en línea | híbrida. */
  modality?: string;
  /** Oferta educativa completa (no solo matchedCareer). */
  steamPrograms?: { name: string; area: string }[];
  googleMapsData?: { rating?: number; address?: string };
  location?: { lat: number; lng: number };
  scoreAdjustmentReason?: string;
}

/** Universidad de nuestra BD con distancia calculada (GET /universities/nearby). */
export interface DbNearbyUniversity {
  id: string;
  name: string;
  address?: string;
  website?: string;
  location?: { latitude: number; longitude: number };
  steamPrograms?: { name: string; area: string }[];
  costTier?: CostTier;
  tuitionRange?: string;
  rating?: number;
  modality?: string;
  distanceKm: number;
}

export interface UniversityMatchResponse {
  matches: UniversityMatchItem[];
  generatedAt: string;
  /** 'Groq' si la IA explicó los matches; 'deterministic' si se degradó. */
  aiProvider?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UniversityService {
  private http = inject(HttpClient);

  /**
   * A8 — Matching de universidades: capa determinista (programa, distancia,
   * costo) + IA acotada que explica cada match. Los filtros son instantáneos
   * porque el backend los aplica sobre su caché.
   */
  matchUniversities(request: {
    userLocation: { lat: number; lng: number };
    filters: UniversityMatchFilters;
  }): Observable<UniversityMatchResponse> {
    return this.http.post<UniversityMatchResponse>(
      `${environment.apiUrl}/universities/match`,
      request,
    );
  }

  /**
   * Universidades de NUESTRA base cercanas a una coordenada, con los campos
   * enriquecidos (programas/costo/modalidad). Se cruza con los resultados de
   * Google Places para que las tarjetas "cerca de ti" muestren la info real
   * de la BD y no solo lo que trae el mapa.
   */
  getNearbyFromDb(location: { lat: number; lng: number }, radiusKm: number): Observable<DbNearbyUniversity[]> {
    return this.http.get<DbNearbyUniversity[]>(
      `${environment.apiUrl}/universities/nearby?lat=${location.lat}&lng=${location.lng}&radiusKm=${radiusKm}`,
    );
  }

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
            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=800&maxWidthPx=800&key=${environment.googleMapsApiKey}`
            : undefined,
          isOpen: place.regularOpeningHours ? place.regularOpeningHours.openNow : undefined
        }));
      })
    );
  }
}
