import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Contrato del algoritmo A8 (POST /universities/match) ────────────────────

export type CostTier = 'public' | 'affordable' | 'private-premium';
export type CostPreference = 'public' | 'affordable' | 'any';

export interface UniversityMatchFilters {
  /** Radio que limita las candidatas antes de calcular y afinar el ranking. */
  maxDistanceKm: number;
  costPreference: CostPreference;
}

export interface UniversityMatchItem {
  universityId: string;
  name: string;
  matchedCareer: string;
  /**
   * Programa REAL de la universidad más afín a matchedCareer (puede diferir
   * del catálogo: "Ing. en Sistemas Computacionales" ≈ "Ingeniería en Software").
   */
  matchedProgram?: string;
  /** true si la IA analizó este match individualmente (mejor coincidencia + sugerencias secundarias). */
  aiAnalyzed?: boolean;
  /** Match real: baseScore determinista + ajuste acotado de la IA (±15). */
  matchScore: number;
  distanceKm: number;
  costTier: CostTier;
  explanation: string;
  websiteUrl?: string;
  /** Rango de colegiatura legible (dato duro, no lo genera la IA). */
  tuitionRange?: string;
  /** presencial | en línea | híbrida. */
  modality?: string;
  /** Fecha/periodo de examen de admisión, ficha o convocatoria (solo si el sitio oficial lo menciona explícitamente). */
  admissionDates?: string;
  /** Oferta educativa completa (no solo matchedCareer). */
  steamPrograms?: { name: string; area: string; sourceUrl?: string }[];
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
  steamPrograms?: { name: string; area: string; sourceUrl?: string }[];
  costTier?: CostTier;
  tuitionRange?: string;
  rating?: number;
  modality?: string;
  /** Fecha/periodo de examen de admisión, ficha o convocatoria (solo si el sitio oficial lo menciona explícitamente). */
  admissionDates?: string;
  distanceKm: number;
  /** Momento del último enriquecimiento que sí recuperó datos del sitio oficial. */
  aiEnrichedAt?: string | null;
  /** complete/partial solo cuando el sitio oficial sí pudo leerse; failed no se presenta como enriquecido. */
  aiEnrichmentStatus?: 'complete' | 'partial' | 'failed' | null;
  programsVerifiedAt?: string | null;
}

export interface UniversityMatchResponse {
  matches: UniversityMatchItem[];
  generatedAt: string;
  /** 'Groq' si la IA explicó los matches; 'deterministic' si se degradó. */
  aiProvider?: string;
  aiAnalyzedCount?: number;
  candidateCount?: number;
  /** true mientras el backend termina el análisis IA sin bloquear la respuesta inicial. */
  aiProcessing?: boolean;
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

  /** Vista previa de la base actual; no dispara descubrimiento ni llamadas a IA. */
  getNearbyUniversities(
    location: { lat: number; lng: number },
    radiusKm: number,
  ): Observable<DbNearbyUniversity[]> {
    return this.http.get<DbNearbyUniversity[]>(
      `${environment.apiUrl}/universities/nearby`,
      {
        params: {
          lat: String(location.lat),
          lng: String(location.lng),
          radiusKm: String(radiusKm),
        },
      },
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
