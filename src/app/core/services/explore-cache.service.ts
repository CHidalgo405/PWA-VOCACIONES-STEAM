import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UniversityMatchResponse } from './university.service';

/** Ciudad seleccionable manualmente como centro de búsqueda (sin GPS). */
export interface CityOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** Preferencia de ubicación persistida: GPS automático o ciudad manual. */
export interface LocationPreference {
  mode: 'auto' | 'city';
  cityId?: string;
}

/** Último perfil de test conocido, para poder servir Explorar sin red. */
export interface ExploreTestMeta {
  hasTakenTest: boolean;
  dominantTraitsStr: string;
  testMarker: string;
}

interface CacheEntry<T> {
  savedAt: number;
  /** Marcador del test con el que se generó: un test nuevo invalida el caché. */
  testMarker?: string;
  data: T;
}

export interface CacheHit<T> {
  data: T;
  /** true si superó el TTL: solo usable como respaldo cuando falla la red. */
  stale: boolean;
}

const MATCHES_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const PLACES_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const MAX_ENTRIES_PER_STORE = 8; // combinaciones de ubicación+filtros retenidas

/**
 * Caché local de Explorar (localStorage, por usuario): evita repetir las
 * peticiones al matching A8 y a Google Places cuando la ubicación, los
 * filtros y el test no han cambiado, y permite usar la sección sin internet.
 */
@Injectable({ providedIn: 'root' })
export class ExploreCacheService {
  private authService = inject(AuthService);

  /** Principales ciudades de México como centros de búsqueda manuales. */
  readonly cities: CityOption[] = [
    { id: 'cdmx', name: 'Ciudad de México', lat: 19.4326, lng: -99.1332 },
    { id: 'guadalajara', name: 'Guadalajara', lat: 20.6597, lng: -103.3496 },
    { id: 'monterrey', name: 'Monterrey', lat: 25.6866, lng: -100.3161 },
    { id: 'puebla', name: 'Puebla', lat: 19.0414, lng: -98.2063 },
    { id: 'queretaro', name: 'Querétaro', lat: 20.5888, lng: -100.3899 },
    { id: 'toluca', name: 'Toluca', lat: 19.2826, lng: -99.6557 },
    { id: 'tijuana', name: 'Tijuana', lat: 32.5149, lng: -117.0382 },
    { id: 'leon', name: 'León', lat: 21.125, lng: -101.686 },
    { id: 'merida', name: 'Mérida', lat: 20.9674, lng: -89.5926 },
    { id: 'cancun', name: 'Cancún', lat: 21.1619, lng: -86.8515 },
    { id: 'chihuahua', name: 'Chihuahua', lat: 28.632, lng: -106.0691 },
    { id: 'aguascalientes', name: 'Aguascalientes', lat: 21.8853, lng: -102.2916 },
    { id: 'san-luis-potosi', name: 'San Luis Potosí', lat: 22.1565, lng: -100.9855 },
    { id: 'morelia', name: 'Morelia', lat: 19.706, lng: -101.195 },
    { id: 'veracruz', name: 'Veracruz', lat: 19.1738, lng: -96.1342 },
    { id: 'oaxaca', name: 'Oaxaca', lat: 17.0732, lng: -96.7266 },
    { id: 'hermosillo', name: 'Hermosillo', lat: 29.073, lng: -110.9559 },
    { id: 'culiacan', name: 'Culiacán', lat: 24.8091, lng: -107.394 },
  ];

  getCityById(id: string): CityOption | undefined {
    return this.cities.find((c) => c.id === id);
  }

  // ── Matches A8 ─────────────────────────────────────────────────────────────

  getMatches(key: string, testMarker: string): CacheHit<UniversityMatchResponse> | null {
    const entry = this.readStore<UniversityMatchResponse>('explore_matches')[key];
    if (!entry || entry.testMarker !== testMarker) return null;
    return { data: entry.data, stale: Date.now() - entry.savedAt > MATCHES_TTL_MS };
  }

  setMatches(key: string, testMarker: string, data: UniversityMatchResponse): void {
    const store = this.readStore<UniversityMatchResponse>('explore_matches');
    store[key] = { savedAt: Date.now(), testMarker, data };
    this.writeStore('explore_matches', this.prune(store));
  }

  // ── Google Places "cerca de ti" ────────────────────────────────────────────

  getPlaces(key: string): CacheHit<any[]> | null {
    const entry = this.readStore<any[]>('explore_places')[key];
    if (!entry) return null;
    return { data: entry.data, stale: Date.now() - entry.savedAt > PLACES_TTL_MS };
  }

  setPlaces(key: string, data: any[]): void {
    const store = this.readStore<any[]>('explore_places');
    store[key] = { savedAt: Date.now(), data };
    this.writeStore('explore_places', this.prune(store));
  }

  // ── Preferencia de ubicación y última ubicación conocida ─────────────────

  getLocationPreference(): LocationPreference | null {
    return this.readJson<LocationPreference>('explore_location_pref');
  }

  setLocationPreference(pref: LocationPreference): void {
    this.writeJson('explore_location_pref', pref);
  }

  getLastLocation(): { lat: number; lng: number } | null {
    return this.readJson<{ lat: number; lng: number }>('explore_last_location');
  }

  setLastLocation(loc: { lat: number; lng: number }): void {
    this.writeJson('explore_last_location', loc);
  }

  // ── Último test conocido (para modo offline) ─────────────────────────────

  getTestMeta(): ExploreTestMeta | null {
    return this.readJson<ExploreTestMeta>('explore_test_meta');
  }

  setTestMeta(meta: ExploreTestMeta): void {
    this.writeJson('explore_test_meta', meta);
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  private userId(): string {
    return this.authService.getCurrentUser()?.id || 'guest';
  }

  private storageKey(prefix: string): string {
    return `${prefix}_${this.userId()}`;
  }

  private readStore<T>(prefix: string): Record<string, CacheEntry<T>> {
    return this.readJson<Record<string, CacheEntry<T>>>(prefix) || {};
  }

  private writeStore<T>(prefix: string, store: Record<string, CacheEntry<T>>): void {
    this.writeJson(prefix, store);
  }

  /** Mantiene el almacén acotado: conserva las entradas más recientes. */
  private prune<T>(store: Record<string, CacheEntry<T>>): Record<string, CacheEntry<T>> {
    const keys = Object.keys(store);
    if (keys.length <= MAX_ENTRIES_PER_STORE) return store;
    keys
      .sort((a, b) => store[a].savedAt - store[b].savedAt)
      .slice(0, keys.length - MAX_ENTRIES_PER_STORE)
      .forEach((k) => delete store[k]);
    return store;
  }

  private readJson<T>(prefix: string): T | null {
    try {
      const raw = localStorage.getItem(this.storageKey(prefix));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeJson(prefix: string, value: unknown): void {
    try {
      localStorage.setItem(this.storageKey(prefix), JSON.stringify(value));
    } catch {
      // localStorage lleno o no disponible: el caché es opcional, seguimos sin él
    }
  }
}
