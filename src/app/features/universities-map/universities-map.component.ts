import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleMap,
  GoogleMapsModule,
  MapInfoWindow,
  MapMarker,
} from '@angular/google-maps';
import { Subscription, TimeoutError, timeout } from 'rxjs';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import {
  DbNearbyUniversity,
  NearbyDiscoveryResponse,
  UniversityService,
} from '../../core/services/university.service';
import { ExploreCacheService } from '../../core/services/explore-cache.service';
import { University } from '../../core/models/university.model';
import { HeaderComponent } from '../../components/header/header.component';
import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-universities-map',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    HeaderComponent,
    LucideIconComponent,
    EmptyStateComponent,
  ],
  templateUrl: './universities-map.component.html',
  styleUrls: ['./universities-map.component.scss'],
})
export class UniversitiesMapComponent implements OnInit, OnDestroy {
  private readonly loaderService = inject(GoogleMapsLoaderService);
  private readonly universityService = inject(UniversityService);
  private readonly exploreCache = inject(ExploreCacheService);
  private readonly ngZone = inject(NgZone);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  readonly searchRadiusKm = 30;

  isApiLoaded = false;
  isMapLoading = true;
  mapLoadError: string | null = null;
  isLocating = false;
  isSearching = false;
  isRefreshing = false;
  isProcessing = false;
  isComplete = true;
  isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  searchError: string | null = null;
  showingCachedData = false;

  coverageCount = 0;
  verifiedCount = 0;
  lastUpdatedAt: string | null = null;
  retryAt: string | null = null;

  universities: University[] = [];
  selectedUniversity: University | null = null;
  userPosition: google.maps.LatLngLiteral | null = null;

  center: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 };
  zoom = 6;
  userMarkerIcon: google.maps.Icon | null = null;

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  private readonly DISCOVERY_TIMEOUT_MS = 20_000;
  private readonly POLL_INTERVAL_MS = 5_000;
  private readonly MAX_AUTOMATIC_RETRIES = 3;

  private currentLocation: google.maps.LatLngLiteral | null = null;
  private currentCacheKey = '';
  private cacheIsStale = false;
  private discoverySubscription: Subscription | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private fitTimer: ReturnType<typeof setTimeout> | null = null;
  private locationTimeout: ReturnType<typeof setTimeout> | null = null;
  private locationAbortController: AbortController | null = null;
  private requestId = 0;
  private locationRequestId = 0;
  private automaticRetryCount = 0;
  private destroyed = false;

  get canRetrySearch(): boolean {
    return !!this.currentLocation && !this.isOffline;
  }

  private readonly onlineListener = () =>
    this.ngZone.run(() => this.handleOnline());
  private readonly offlineListener = () =>
    this.ngZone.run(() => this.handleOffline());
  private readonly focusListener = () =>
    this.ngZone.run(() => this.resumePendingWork());
  private readonly visibilityListener = () =>
    this.ngZone.run(() => {
      if (document.hidden) {
        this.clearPollTimer();
      } else {
        this.resumePendingWork();
      }
    });

  ngOnInit(): void {
    this.registerBrowserListeners();

    // El último punto conocido permite pintar el caché antes de que terminen
    // tanto Google Maps como una nueva lectura del GPS.
    const lastLocation = this.exploreCache.getLastLocation();
    if (lastLocation) {
      this.center = lastLocation;
      this.userPosition = lastLocation;
      this.zoom = 13;
      this.hydrateFromCache(lastLocation);
    }

    this.loadMap();
    this.getUserLocation();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestId++;
    this.locationRequestId++;
    this.discoverySubscription?.unsubscribe();
    this.discoverySubscription = null;
    this.clearPollTimer();
    if (this.fitTimer) clearTimeout(this.fitTimer);
    if (this.locationTimeout) clearTimeout(this.locationTimeout);
    this.locationAbortController?.abort();
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
    window.removeEventListener('focus', this.focusListener);
    document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  loadMap(): void {
    if (this.destroyed) return;
    this.isMapLoading = true;
    this.mapLoadError = null;

    this.loaderService
      .loadMapScript()
      .then(() => {
        if (this.destroyed) return;
        this.ngZone.run(() => {
          this.isApiLoaded = true;
          this.isMapLoading = false;
          const svgMarker =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
          this.userMarkerIcon = {
            url:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(svgMarker),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          };
          this.scheduleFitMap();
        });
      })
      .catch((error) => {
        if (this.destroyed) return;
        console.error('No se pudo cargar Google Maps:', error);
        this.ngZone.run(() => {
          this.isApiLoaded = false;
          this.isMapLoading = false;
          this.mapLoadError = this.isOffline
            ? 'El mapa necesita conexión para cargarse.'
            : 'Google Maps no respondió. Tus universidades guardadas localmente siguen disponibles.';
        });
      });
  }

  retryMapLoad(): void {
    if (this.isOffline || this.isMapLoading) return;
    this.loadMap();
  }

  getUserLocation(): void {
    const locationRequestId = ++this.locationRequestId;
    this.isLocating = true;
    if (this.locationTimeout) clearTimeout(this.locationTimeout);
    this.locationAbortController?.abort();

    let resolved = false;
    let fallbackStarted = false;

    const applyLocation = (location: google.maps.LatLngLiteral): void => {
      if (
        resolved ||
        this.destroyed ||
        locationRequestId !== this.locationRequestId
      )
        return;
      resolved = true;
      if (this.locationTimeout) clearTimeout(this.locationTimeout);
      this.locationAbortController?.abort();
      this.ngZone.run(() => {
        this.center = location;
        this.userPosition = location;
        this.currentLocation = location;
        this.zoom = 13;
        this.isLocating = false;
        this.exploreCache.setLastLocation(location);
        this.googleMap?.googleMap?.panTo(location);
        this.searchUniversities(location);
      });
    };

    const useSafeFallback = (): void => {
      const fallback = this.exploreCache.getLastLocation() || this.center;
      applyLocation(fallback);
    };

    const runIpFallback = async (reason: string): Promise<void> => {
      if (resolved || fallbackStarted || this.destroyed) return;
      fallbackStarted = true;
      console.warn(
        `Geolocation failed (${reason}). Intentando ubicación aproximada...`,
      );
      const controller = new AbortController();
      this.locationAbortController = controller;
      const timeoutId = setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch('https://ipwho.is/', {
          signal: controller.signal,
        });
        const data = await response.json();
        if (
          data.success &&
          Number.isFinite(data.latitude) &&
          Number.isFinite(data.longitude)
        ) {
          applyLocation({ lat: data.latitude, lng: data.longitude });
          return;
        }
      } catch (error) {
        if (!controller.signal.aborted)
          console.error('IP fallback falló:', error);
      } finally {
        clearTimeout(timeoutId);
      }
      useSafeFallback();
    };

    this.locationTimeout = setTimeout(() => {
      void runIpFallback('Tiempo de espera agotado');
    }, 8_000);

    if (!navigator.geolocation) {
      void runIpFallback('Navegador sin geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        applyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => void runIpFallback(error.message),
      { enableHighAccuracy: true, timeout: 7_000, maximumAge: 5 * 60_000 },
    );
  }

  /**
   * Sirve primero el snapshot local. Una entrada fresca y terminada evita por
   * completo otra llamada; una entrada vencida o en proceso se revalida sin
   * quitar los marcadores que el usuario ya puede consultar.
   */
  searchUniversities(
    location: google.maps.LatLngLiteral,
    forceRefresh = false,
  ): void {
    const key = this.buildCacheKey(location);
    const keyChanged = key !== this.currentCacheKey;
    if (keyChanged) {
      this.cancelDiscoveryRequest();
      this.clearPollTimer();
      this.currentCacheKey = key;
      this.currentLocation = location;
      this.automaticRetryCount = 0;
      this.searchError = null;
    }

    const cached = this.exploreCache.getPlaces(key);
    if (cached) {
      this.cacheIsStale = cached.stale;
      this.applySnapshot(cached.data, true);
    } else if (keyChanged) {
      // No mantenemos marcadores de otra zona porque indicarían ubicaciones
      // incorrectas; durante una actualización de la misma zona sí se conservan.
      this.universities = [];
      this.selectedUniversity = null;
      this.coverageCount = 0;
      this.verifiedCount = 0;
      this.lastUpdatedAt = null;
      this.isProcessing = false;
      this.isComplete = true;
      this.retryAt = null;
      this.showingCachedData = false;
      // También funciona como "hay trabajo pendiente": si la pestaña estaba
      // oculta, visibilitychange sabrá que debe iniciar esta primera consulta.
      this.cacheIsStale = true;
    }

    if (!forceRefresh && cached && !cached.stale && !cached.data.processing) {
      const retryAt = cached.data.retryAt
        ? Date.parse(cached.data.retryAt)
        : Number.NaN;
      if (Number.isFinite(retryAt) && retryAt > Date.now()) {
        this.isSearching = false;
        this.isRefreshing = false;
        this.schedulePoll(this.retryDelay(cached.data));
        return;
      }
      if (this.snapshotIsComplete(cached.data)) {
        this.isSearching = false;
        this.isRefreshing = false;
        return;
      }
    }

    if (this.isOffline) {
      this.isSearching = false;
      this.isRefreshing = false;
      this.searchError = this.universities.length
        ? 'Sin conexión. Mostramos la última información guardada.'
        : 'Sin conexión y sin universidades guardadas para esta zona.';
      return;
    }

    this.requestDiscovery(location, forceRefresh);
  }

  retrySearch(): void {
    if (!this.currentLocation || this.isOffline) return;
    this.automaticRetryCount = 0;
    this.searchError = null;
    this.requestDiscovery(this.currentLocation, true);
  }

  refreshUniversities(): void {
    if (!this.currentLocation || this.isOffline) return;
    this.automaticRetryCount = 0;
    this.searchError = null;
    this.requestDiscovery(this.currentLocation, true);
  }

  onMapInitialized(): void {
    this.scheduleFitMap();
  }

  openInfoWindow(marker: MapMarker, university: University): void {
    this.selectedUniversity = university;
    this.infoWindow.open(marker);
  }

  getMarkerPosition(location: {
    lat: number;
    lng: number;
  }): google.maps.LatLngLiteral {
    return { lat: location.lat, lng: location.lng };
  }

  trackByUniversityId(index: number, university: University): string {
    return university.id || `${university.name}-${index}`;
  }

  get lastUpdatedLabel(): string | null {
    if (!this.lastUpdatedAt) return null;
    const date = new Date(this.lastUpdatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private registerBrowserListeners(): void {
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
    window.addEventListener('focus', this.focusListener);
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private hydrateFromCache(location: google.maps.LatLngLiteral): boolean {
    const key = this.buildCacheKey(location);
    const cached = this.exploreCache.getPlaces(key);
    if (!cached) return false;
    this.currentLocation = location;
    this.currentCacheKey = key;
    this.cacheIsStale = cached.stale;
    this.applySnapshot(cached.data, true);
    if (cached.data.processing) {
      this.schedulePoll(1_000);
    } else if (!this.snapshotIsComplete(cached.data)) {
      this.schedulePoll(this.retryDelay(cached.data));
    }
    return true;
  }

  private requestDiscovery(
    location: google.maps.LatLngLiteral,
    forceRefresh: boolean,
  ): void {
    if (this.destroyed || this.isOffline || document.hidden) return;
    if (this.discoverySubscription && !this.discoverySubscription.closed)
      return;

    this.clearPollTimer();
    const requestId = ++this.requestId;
    const key = this.buildCacheKey(location);
    this.currentLocation = location;
    this.currentCacheKey = key;
    this.isSearching = this.universities.length === 0;
    this.isRefreshing = this.universities.length > 0;
    this.searchError = null;

    this.discoverySubscription = this.universityService
      .discoverNearby(location, this.searchRadiusKm, forceRefresh)
      .pipe(timeout(this.DISCOVERY_TIMEOUT_MS))
      .subscribe({
        next: (snapshot) => {
          if (
            this.destroyed ||
            requestId !== this.requestId ||
            key !== this.currentCacheKey
          )
            return;
          this.exploreCache.setPlaces(key, snapshot);
          this.cacheIsStale = false;
          this.applySnapshot(snapshot, false);
          this.isSearching = false;
          this.isRefreshing = false;
          this.automaticRetryCount = 0;
          if (snapshot.processing) {
            this.schedulePoll(this.POLL_INTERVAL_MS);
          } else if (!this.snapshotIsComplete(snapshot)) {
            this.schedulePoll(this.retryDelay(snapshot));
          } else {
            this.clearPollTimer();
          }
        },
        error: (error) => {
          if (
            this.destroyed ||
            requestId !== this.requestId ||
            key !== this.currentCacheKey
          )
            return;
          console.error('Error buscando universidades:', error);
          this.discoverySubscription = null;
          this.isSearching = false;
          this.isRefreshing = false;
          this.searchError =
            error instanceof TimeoutError
              ? 'La actualización está tardando más de lo esperado. Conservamos los datos disponibles y volveremos a intentarlo.'
              : this.isOffline
                ? 'Sin conexión. Conservamos los datos disponibles.'
                : 'No pudimos actualizar las universidades. Conservamos la última información disponible.';
          this.scheduleAutomaticRetry();
        },
        complete: () => {
          if (requestId === this.requestId) this.discoverySubscription = null;
        },
      });
  }

  private applySnapshot(
    snapshot: NearbyDiscoveryResponse,
    fromCache: boolean,
  ): void {
    const mapped = this.mapUniversities(snapshot.universities || []);

    // Una respuesta progresiva vacía no borra marcadores útiles. Cuando el
    // trabajo termina, una lista vacía sí representa el estado definitivo.
    if (mapped.length || !snapshot.processing || !this.universities.length) {
      this.universities = mapped;
    }

    if (this.selectedUniversity) {
      this.selectedUniversity =
        this.universities.find(
          (university) => university.id === this.selectedUniversity?.id,
        ) || null;
    }

    this.coverageCount =
      snapshot.coverageCount ?? snapshot.universities?.length ?? 0;
    this.verifiedCount = snapshot.verifiedCount ?? 0;
    this.lastUpdatedAt = snapshot.updatedAt || this.lastUpdatedAt;
    this.isProcessing = snapshot.processing;
    this.isComplete = this.snapshotIsComplete(snapshot);
    this.retryAt = snapshot.retryAt || null;
    this.showingCachedData = fromCache;
    this.searchError = snapshot.error || null;
    this.isSearching = false;
    this.scheduleFitMap();
  }

  private mapUniversities(rows: DbNearbyUniversity[]): University[] {
    return rows
      .filter(
        (university) =>
          Number.isFinite(university.location?.latitude) &&
          Number.isFinite(university.location?.longitude),
      )
      .map((university) => ({
        id: university.id,
        name: university.name,
        location: {
          lat: university.location!.latitude,
          lng: university.location!.longitude,
        },
        address: university.address,
        contactUrl: university.website,
        rating: university.rating,
        programs: (university.steamPrograms || []).map(
          (program) => program.name,
        ),
      }));
  }

  private buildCacheKey(location: google.maps.LatLngLiteral): string {
    return `auto:${location.lat.toFixed(2)},${location.lng.toFixed(2)}|${this.searchRadiusKm}`;
  }

  private snapshotIsComplete(snapshot: NearbyDiscoveryResponse): boolean {
    return snapshot.complete !== false;
  }

  private retryDelay(snapshot: NearbyDiscoveryResponse): number {
    const retryAt = snapshot.retryAt
      ? Date.parse(snapshot.retryAt)
      : Number.NaN;
    return Number.isFinite(retryAt)
      ? Math.max(1_000, retryAt - Date.now() + 250)
      : 30_000;
  }

  private schedulePoll(delayMs: number): void {
    if (
      this.destroyed ||
      this.isOffline ||
      document.hidden ||
      !this.currentLocation
    ) {
      return;
    }
    this.clearPollTimer();
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      if (this.currentLocation)
        this.requestDiscovery(this.currentLocation, false);
    }, delayMs);
  }

  private scheduleAutomaticRetry(): void {
    if (
      this.destroyed ||
      this.isOffline ||
      document.hidden ||
      this.automaticRetryCount >= this.MAX_AUTOMATIC_RETRIES
    ) {
      return;
    }
    const delayMs = 3_000 * 2 ** this.automaticRetryCount;
    this.automaticRetryCount++;
    this.schedulePoll(delayMs);
  }

  private resumePendingWork(): void {
    if (this.destroyed || this.isOffline || document.hidden) return;
    if (this.mapLoadError && !this.isMapLoading) this.loadMap();
    if (!this.currentLocation) return;
    if (this.discoverySubscription && !this.discoverySubscription.closed)
      return;
    const retryAt = this.retryAt ? Date.parse(this.retryAt) : Number.NaN;
    if (
      !this.isProcessing &&
      Number.isFinite(retryAt) &&
      retryAt > Date.now() + 1_000
    ) {
      this.schedulePoll(retryAt - Date.now() + 250);
      return;
    }
    // Un snapshot completo con un aviso histórico y sin retryAt sigue siendo
    // un caché válido; solo el botón manual debe intentar actualizarlo.
    if (
      this.isComplete &&
      this.searchError &&
      !this.cacheIsStale &&
      !Number.isFinite(retryAt)
    )
      return;
    if (
      this.isProcessing ||
      !this.isComplete ||
      this.searchError ||
      this.cacheIsStale
    ) {
      this.automaticRetryCount = 0;
      this.requestDiscovery(this.currentLocation, false);
    }
  }

  private handleOnline(): void {
    this.isOffline = false;
    this.resumePendingWork();
  }

  private handleOffline(): void {
    this.isOffline = true;
    this.cancelDiscoveryRequest();
    this.clearPollTimer();
    this.isSearching = false;
    this.isRefreshing = false;
    this.searchError = this.universities.length
      ? 'Sin conexión. Mostramos la última información guardada.'
      : 'Sin conexión y sin universidades guardadas para esta zona.';
  }

  private cancelDiscoveryRequest(): void {
    this.requestId++;
    this.discoverySubscription?.unsubscribe();
    this.discoverySubscription = null;
  }

  private clearPollTimer(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }

  private scheduleFitMap(): void {
    if (!this.isApiLoaded) return;
    if (this.fitTimer) clearTimeout(this.fitTimer);
    this.fitTimer = setTimeout(() => {
      this.fitTimer = null;
      if (this.destroyed || !this.googleMap?.googleMap) return;
      const bounds = new google.maps.LatLngBounds();
      if (this.userPosition) bounds.extend(this.userPosition);
      this.universities.forEach((university) =>
        bounds.extend(university.location),
      );
      if (bounds.isEmpty()) return;
      if (this.universities.length === 0 && this.userPosition) {
        this.googleMap.googleMap.setCenter(this.userPosition);
        this.googleMap.googleMap.setZoom(13);
        return;
      }
      this.googleMap.googleMap.fitBounds(bounds, {
        top: 70,
        right: 50,
        bottom: 60,
        left: 50,
      });
    }, 100);
  }
}
