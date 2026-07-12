import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  /** true si algún campo fue completado/validado por IA (aiEnrichedAt presente) — para mostrar advertencia al alumno. */
  aiEnrichedAt?: string | null;
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
   * "Cerca de ti" / mapa: BD propia + (si la zona tiene poca cobertura)
   * descubrimiento en vivo en el servidor vía Google Places, validado y
   * enriquecido con IA, y guardado para siempre — reemplaza la llamada
   * directa a Places desde el navegador (searchNearbyUniversities). Puede
   * tardar más en zonas nunca visitadas (~30-40s) mientras la IA valida los
   * candidatos nuevos; en zonas ya cubiertas responde al instante.
   */
  discoverNearby(location: { lat: number; lng: number }, radiusKm: number): Observable<DbNearbyUniversity[]> {
    return this.http.post<DbNearbyUniversity[]>(
      `${environment.apiUrl}/universities/nearby-discover`,
      { lat: location.lat, lng: location.lng, radiusKm },
    );
  }

}
