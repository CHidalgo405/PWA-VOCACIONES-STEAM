import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  VocationTestService,
  TestDetail,
} from '../../core/services/test.service';
import { ToastService } from '../../core/services/toast.service';
import { inject } from '@angular/core';

import { LucideIconComponent } from '../../components/lucide-icon/lucide-icon.component';
import { HeaderComponent } from '../../components/header/header.component';
import { Router } from '@angular/router';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import {
  UniversityService,
  CostPreference,
  UniversityMatchItem,
  UniversityMatchResponse,
  DbNearbyUniversity,
  NearbyDiscoveryResponse,
} from '../../core/services/university.service';
import {
  ExploreCacheService,
  CityOption,
} from '../../core/services/explore-cache.service';
import { ScrollRevealDirective } from './scroll-reveal.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';

/** Estilo de mapa oscuro (tonos navy consistentes con el tema oscuro de la app). */
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#111827' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0f2027' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0b1120' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#273549' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0b1120' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#061422' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#334155' }],
  },
];

type SearchRadiusKm = 10 | 30 | 50;

interface DistanceOption {
  km: SearchRadiusKm;
  title: string;
  description: string;
  recommended?: boolean;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideIconComponent,
    HeaderComponent,
    GoogleMapsModule,
    ScrollRevealDirective,
  ],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit, OnDestroy {
  hasTakenTest = false;
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private testService = inject(VocationTestService);
  private loaderService = inject(GoogleMapsLoaderService);
  private universityService = inject(UniversityService);
  private exploreCache = inject(ExploreCacheService);
  private themeService = inject(ThemeService);
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  isApiLoaded = false;
  mapLoadError = false;
  isLocating = false;
  locationLoadError = false;
  userPosition: google.maps.LatLngLiteral | null = null;
  userMarkerIcon: google.maps.Icon | null = null;

  center: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 }; // CDMX por defecto
  zoom = 6;

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
  };

  constructor(private authService: AuthService) {}

  searchQuery: string = '';
  isLoading: boolean = true;
  skeletonArray = Array(4).fill(0); // Array ficticio para renderizar 4 skeletons

  /** Momento en que arrancó la carga (para el mínimo de visibilidad del skeleton). */
  private loadStartedAt = Date.now();
  private readonly MIN_SKELETON_MS = 400;
  isLoadingProfile = true;
  profileLoadError = false;
  isLoadingSaved = true;
  savedLoadError = false;
  isOffline = !navigator.onLine;
  isUsingCachedMatches = false;
  isUsingCachedNearby = false;
  isRefreshingMatches = false;
  isRefreshingNearby = false;
  isLoadingNearby = false;
  matchLoadError: string | null = null;
  nearbyLoadError: string | null = null;
  distancePreviewError = false;
  lastDataUpdatedAt: Date | null = null;
  aiPollingPaused = false;
  nearbyPollingPaused = false;
  private finishLoadingTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Apaga isLoading respetando un mínimo de visibilidad del skeleton: con
   * caché o una API rápida, la carga puede resolverse en unos milisegundos,
   * demasiado rápido para que el shimmer llegue a percibirse.
   */
  private finishLoading(): void {
    const elapsed = Date.now() - this.loadStartedAt;
    const remaining = this.MIN_SKELETON_MS - elapsed;
    if (this.finishLoadingTimer) clearTimeout(this.finishLoadingTimer);
    if (remaining > 0) {
      this.finishLoadingTimer = setTimeout(() => {
        this.isLoading = false;
        this.finishLoadingTimer = null;
      }, remaining);
    } else {
      this.isLoading = false;
    }
  }

  private beginBlockingLoad(): void {
    if (this.finishLoadingTimer) clearTimeout(this.finishLoadingTimer);
    this.finishLoadingTimer = null;
    this.isLoading = true;
    this.loadStartedAt = Date.now();
  }

  // Variables para Modales
  isUniversityModalOpen: boolean = false;
  isUniversityModalClosing: boolean = false;
  selectedUniversity: any = null;

  // Estado de vista
  viewMode: 'explore' | 'saved' = 'explore';
  savedUniversities: any[] = [];

  /** Vista activa en móvil: lista o mapa a pantalla completa (alternable con FAB). */
  mobileView: 'list' | 'map' = 'list';

  // Datos
  bestMatchUniversity: any = null;
  otherUniversities: any[] = [];

  dominantTraitsStr: string = 'STEAM';
  totalCoincidencias: number = 0;
  maxMatchPercentage: number = 0;

  universities: any[] = [];

  // ── A8: matching real (API) + filtros instantáneos ──
  apiMatches: any[] = [];
  nearbyUniversities: any[] = [];
  isLoadingMatches = false;
  /** Origen del ranking: 'Groq' (IA activa) o 'deterministic'. */
  aiProvider: string | null = null;
  aiAnalyzedCount = 0;
  candidateCount = 0;
  /** El ranking determinista ya está visible y la IA sigue afinándolo. */
  aiProcessing = false;
  /** true mientras el backend descubre/valida universidades en background. */
  isDiscoveringNearby = false;
  /** false cuando conservamos resultados pero la zona aún requiere otra ronda. */
  nearbyDiscoveryComplete = true;
  nearbyCoverageCount = 0;
  nearbyVerifiedCount = 0;
  nearbyJobStartedAt: Date | null = null;
  private nearbyRetryAt: number | null = null;

  /** Claves de la última búsqueda ejecutada (dedupe de llamadas repetidas). */
  private lastMatchKey = '';
  private lastDbNearbyKey = '';
  private nearbyRequestId = 0;
  private matchRequestId = 0;
  private aiRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private aiRefreshAttempts = 0;
  private readonly MAX_AI_REFRESH_ATTEMPTS = 120;
  private readonly PARTIAL_AI_RETRY_MS = 60_000;
  private readonly DETERMINISTIC_AI_RETRY_MS = 3 * 60_000;
  private aiRecoveryPending = false;
  private activeMatchRequestKey: string | null = null;
  private queuedMatchRefreshKey: string | null = null;
  private nearbyRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private nearbyRefreshAttempts = 0;
  private readonly MAX_NEARBY_REFRESH_ATTEMPTS = 120;
  /** null = todavía no recibimos snapshot; '' = snapshot recibido sin catálogo. */
  private nearbyCatalogSignature: string | null = null;
  private lastMatchesSavedAt = 0;
  private locationRequestId = 0;
  private locationTimeout: ReturnType<typeof setTimeout> | null = null;
  private locationAbortController: AbortController | null = null;
  private recommendationsRequested = false;
  private searchDebounceId: any = null;
  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.resumeBackgroundUpdates();
    } else {
      this.pauseBackgroundTimers();
    }
  };
  private readonly handleOnline = () => {
    this.isOffline = false;
    this.resumeBackgroundUpdates();
  };
  private readonly handleOffline = () => {
    this.isOffline = true;
    this.pauseBackgroundTimers();
  };
  readonly distanceOptions: DistanceOption[] = [
    {
      km: 10,
      title: 'Cerca de mí',
      description:
        'Zona urbana y campus cercanos; ideal para traslados cotidianos cortos.',
    },
    {
      km: 30,
      title: 'Ciudad y alrededores',
      description:
        'Incluye municipios cercanos y ofrece un buen equilibrio entre variedad y traslado.',
      recommended: true,
    },
    {
      km: 50,
      title: 'Región ampliada',
      description:
        'Más alternativas, considerando trayectos largos o una posible mudanza.',
    },
  ];
  maxDistanceKm: SearchRadiusKm = 30;
  costPreference: CostPreference = 'any';

  // ── Pregunta inicial de radio + vista previa de instituciones ─────────────
  isDistanceQuestionnaireOpen = false;
  isLoadingDistancePreview = false;
  isRefreshingDistancePreview = false;
  pendingDistanceKm: SearchRadiusKm = 30;
  distancePreviewUniversities: DbNearbyUniversity[] = [];
  distanceSelectionConfirmed = false;
  private distanceLocationKey = '';
  private forceDistanceConfirmation = false;
  private distancePreviewRequestId = 0;
  private locationReady = false;

  // ── Ubicación manual (ciudad) o automática (GPS/IP) ────────────────────────
  /** 'auto' = GPS/IP; 'city' = el usuario eligió una ciudad manualmente. */
  locationMode: 'auto' | 'city' = 'auto';
  selectedCityId: string | null = null;
  readonly cities: CityOption[] = this.exploreCache.cities;

  /** Marcador del test vigente: un test nuevo invalida el caché de matches. */
  private testMarker = '';

  /** Valor del <select> de ubicación en la barra de filtros. */
  get locationChoice(): string {
    return this.locationMode === 'city' && this.selectedCityId
      ? this.selectedCityId
      : 'auto';
  }

  readonly costOptions: { value: CostPreference; label: string }[] = [
    { value: 'any', label: 'Todas' },
    { value: 'public', label: 'Públicas' },
    { value: 'affordable', label: 'Accesibles' },
  ];

  private readonly COST_TIER_LABELS: Record<string, string> = {
    public: 'Pública',
    affordable: 'Costo accesible',
    'private-premium': 'Privada',
  };

  private readonly DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',
  ];

  /** Nombres normalizados ya guardados (heart relleno) y su id de registro guardado (para poder quitarlos). */
  private savedNames = new Set<string>();
  private savedIdByName = new Map<string, string>();
  /** Nombres con una petición de guardar/quitar en vuelo (anti-spam). */
  private pendingFavorite = new Set<string>();

  private router = inject(Router);

  ngOnDestroy(): void {
    document.body.classList.remove('explore-modal-open');
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
    if (this.finishLoadingTimer) clearTimeout(this.finishLoadingTimer);
    this.locationRequestId++;
    if (this.locationTimeout) clearTimeout(this.locationTimeout);
    this.locationTimeout = null;
    this.locationAbortController?.abort();
    this.locationAbortController = null;
    this.cancelAiRefresh();
    this.cancelNearbyRefresh();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  ngOnInit() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    if (this.themeService.isDark) {
      this.mapOptions = { ...this.mapOptions, styles: DARK_MAP_STYLE };
    }

    // Preferencia de ubicación persistida: ciudad manual = cero GPS y cero IP lookup.
    const pref = this.exploreCache.getLocationPreference();
    const prefCity =
      pref?.mode === 'city' && pref.cityId
        ? this.exploreCache.getCityById(pref.cityId)
        : null;
    if (prefCity) {
      this.locationMode = 'city';
      this.selectedCityId = prefCity.id;
      this.userPosition = { lat: prefCity.lat, lng: prefCity.lng };
      this.center = this.userPosition;
      this.zoom = 12;
      this.locationReady = true;
    } else {
      // Arrancamos sobre la última ubicación conocida mientras llega el GPS.
      const last = this.exploreCache.getLastLocation();
      if (last) {
        this.center = last;
        this.userPosition = last;
        this.locationReady = true;
        this.zoom = 12;
      }
    }

    this.loaderService
      .loadMapScript()
      .then(() => this.onMapScriptLoaded())
      .catch((err) => this.onMapScriptFailed(err));

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user?.id) {
          this.loadRecommendations();
          this.loadSavedUniversities();
        }
      });
  }

  private onMapScriptLoaded(): void {
    this.isApiLoaded = true;
    this.mapLoadError = false;
    this.mapOptions = {
      ...this.mapOptions,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    };
    const svgMarker =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
    this.userMarkerIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker),
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12),
    };
    if (this.locationMode === 'city') {
      this.loadApiMatches();
      this.triggerPlacesSearch();
    } else {
      this.getUserLocation();
    }
  }

  private onMapScriptFailed(error: unknown): void {
    console.error('No se pudo cargar Google Maps en ExploreComponent:', error);
    this.mapLoadError = true;
    // La lista y su caché funcionan aunque el proveedor del mapa esté caído.
    if (this.locationMode === 'city') {
      this.loadApiMatches();
      this.triggerPlacesSearch();
    } else {
      this.getUserLocation();
    }
  }

  retryMapLoading(): void {
    this.mapLoadError = false;
    this.loaderService
      .loadMapScript()
      .then(() => this.onMapScriptLoaded())
      .catch((error) => this.onMapScriptFailed(error));
  }

  getUserLocation(): void {
    const requestId = ++this.locationRequestId;
    this.isLocating = true;
    this.locationLoadError = false;
    this.locationReady = false;
    if (this.locationTimeout) clearTimeout(this.locationTimeout);
    this.locationAbortController?.abort();
    this.locationAbortController = null;

    let resolved = false;
    let fallbackStarted = false;

    const applyLocation = (
      location: google.maps.LatLngLiteral,
      options: {
        approximate?: boolean;
        label?: string;
        failed?: boolean;
        persist?: boolean;
      } = {},
    ): void => {
      if (resolved || requestId !== this.locationRequestId) return;
      resolved = true;
      if (this.locationTimeout) clearTimeout(this.locationTimeout);
      this.locationTimeout = null;
      this.locationAbortController?.abort();
      this.locationAbortController = null;

      this.ngZone.run(() => {
        this.center = location;
        this.userPosition = location;
        this.locationReady = true;
        this.locationLoadError = !!options.failed;
        this.zoom = 13;
        this.isLocating = false;
        if (options.persist !== false)
          this.exploreCache.setLastLocation(location);
        this.googleMap?.panTo(location);
        if (options.approximate) {
          this.toastService.showToast(
            `Ubicación aproximada: ${options.label || 'zona detectada'}`,
            'info',
          );
        } else if (options.failed) {
          this.toastService.showToast(
            'No pudimos obtener tu ubicación. Puedes elegir una ciudad en los filtros.',
            'info',
          );
        }
        this.loadApiMatches();
        this.triggerPlacesSearch();
      });
    };

    const useSafeFallback = (): void => {
      if (resolved || requestId !== this.locationRequestId) return;
      const savedLocation = this.exploreCache.getLastLocation();
      applyLocation(savedLocation || this.center, {
        failed: true,
        // El centro por defecto no debe guardarse como si fuera una lectura real.
        persist: false,
      });
    };

    const runIpFallback = async (reason: string): Promise<void> => {
      if (resolved || fallbackStarted || requestId !== this.locationRequestId) {
        return;
      }
      fallbackStarted = true;
      console.warn(`Geolocation failed (${reason}). Intentando IP fallback...`);
      const controller = new AbortController();
      this.locationAbortController = controller;
      const ipTimeout = setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch('https://ipwho.is/', {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(`IP fallback respondió HTTP ${response.status}`);
        const data = await response.json();
        if (
          data.success &&
          Number.isFinite(data.latitude) &&
          Number.isFinite(data.longitude)
        ) {
          applyLocation(
            { lat: data.latitude, lng: data.longitude },
            { approximate: true, label: data.city || data.region },
          );
          return;
        }
      } catch (error) {
        if (!controller.signal.aborted)
          console.error('IP Fallback falló:', error);
      } finally {
        clearTimeout(ipTimeout);
      }
      useSafeFallback();
    };

    // Safari a veces no llama ninguno de los callbacks de geolocalización.
    this.locationTimeout = setTimeout(() => {
      void runIpFallback('Tiempo de espera agotado');
    }, 8_000);

    if (!navigator.geolocation) {
      void runIpFallback('Sin soporte nativo');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        applyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => void runIpFallback(`Error nativo: ${error.message}`),
      { enableHighAccuracy: true, timeout: 7_000, maximumAge: 5 * 60_000 },
    );
  }

  loadSavedUniversities() {
    this.isLoadingSaved = true;
    this.savedLoadError = false;
    this.userService
      .getSavedUniversities()
      .pipe(timeout(15_000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.isLoadingSaved = false;
          this.savedNames.clear();
          this.savedIdByName.clear();

          const mappedSaved = data.map((item) => {
            const key = this.normalizeName(item.universityName);
            this.savedNames.add(key);
            this.savedIdByName.set(key, item.id);

            const hasCoords =
              typeof item.latitude === 'number' &&
              typeof item.longitude === 'number';
            return {
              id: item.id,
              name: item.universityName,
              location: item.location,
              image:
                'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
              logo: 'graduation-cap',
              tags: [item.careerName, 'Guardada'],
              rating: item.rating ?? null,
              matchPercentage: null,
              career: item.careerName,
              description:
                item.relationshipExplanation || 'Universidad guardada.',
              keyDates: item.keyDates || 'Consultar sitio web',
              studyPlan: item.studyPlan || 'Varios módulos',
              websiteUrl: item.officialWebsite || null,
              position: hasCoords
                ? { lat: item.latitude, lng: item.longitude }
                : null,
              source: 'saved',
            };
          });

          this.savedUniversities = mappedSaved;
        },
        error: (err) => {
          this.isLoadingSaved = false;
          this.savedLoadError = true;
          console.error('Error cargando universidades guardadas', err);
        },
      });
  }

  loadRecommendations() {
    if (this.recommendationsRequested) return; // currentUser$ puede emitir varias veces
    this.recommendationsRequested = true;
    this.beginBlockingLoad();
    this.isLoadingProfile = true;
    this.profileLoadError = false;
    const cachedMeta = this.exploreCache.getTestMeta();
    if (cachedMeta?.hasTakenTest) {
      this.hasTakenTest = true;
      this.dominantTraitsStr = cachedMeta.dominantTraitsStr;
      this.testMarker = cachedMeta.testMarker;
      // Hidrata los resultados locales mientras se confirma el perfil actual.
      this.loadApiMatches();
      this.triggerPlacesSearch();
    }
    this.testService
      .getLatestTest()
      .pipe(timeout(20_000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (latestTest: TestDetail | null) => {
          this.isLoadingProfile = false;
          if (latestTest) {
            this.hasTakenTest = true;
            const profile = (latestTest as any)?.profile;
            this.dominantTraitsStr =
              profile?.profileName || latestTest.dominantTraits || 'STEAM';
            // Un test nuevo cambia el marcador → invalida el caché de matches.
            const nextTestMarker = String(
              latestTest.testId || latestTest.completedAt || 'test',
            );
            if (this.testMarker && this.testMarker !== nextTestMarker) {
              this.lastMatchKey = '';
              this.matchRequestId++;
            }
            this.testMarker = nextTestMarker;
            this.exploreCache.setTestMeta({
              hasTakenTest: true,
              dominantTraitsStr: this.dominantTraitsStr,
              testMarker: this.testMarker,
            });
            this.loadApiMatches();
            this.triggerPlacesSearch();
          } else {
            this.exploreCache.setTestMeta({
              hasTakenTest: false,
              dominantTraitsStr: 'STEAM',
              testMarker: '',
            });
            this.processData();
            this.finishLoading();
          }
        },
        error: (err) => {
          this.isLoadingProfile = false;
          this.profileLoadError = true;
          console.error('Error cargando perfil del test', err);
          // Sin red: usamos el último perfil conocido para servir todo desde caché.
          const meta = this.exploreCache.getTestMeta();
          if (meta?.hasTakenTest) {
            this.hasTakenTest = true;
            this.dominantTraitsStr = meta.dominantTraitsStr;
            this.testMarker = meta.testMarker;
            this.loadApiMatches();
            this.triggerPlacesSearch();
          } else {
            this.processData();
            this.finishLoading();
          }
        },
      });
  }

  // ── Elección inicial del radio de búsqueda ────────────────────────────────

  private ensureDistanceSelection(): boolean {
    if (!this.locationReady) return false;
    const key = this.currentDistanceLocationKey();
    if (this.distanceSelectionConfirmed && this.distanceLocationKey === key) {
      return true;
    }
    if (this.isDistanceQuestionnaireOpen && this.distanceLocationKey === key) {
      return false;
    }

    this.distanceLocationKey = key;
    const saved = this.forceDistanceConfirmation
      ? null
      : this.exploreCache.getSearchRadiusPreference(key);
    if (saved) {
      this.maxDistanceKm = saved.radiusKm;
      this.pendingDistanceKm = saved.radiusKm;
      this.distanceSelectionConfirmed = true;
      return true;
    }

    this.distanceSelectionConfirmed = false;
    this.pendingDistanceKm = 30;
    this.openDistanceQuestionnaire();
    // La pregunta reemplaza al skeleton inicial; aún no se inicia ningún
    // descubrimiento ni matching pesado hasta que el alumno confirme.
    this.finishLoading();
    return false;
  }

  private currentDistanceLocationKey(): string {
    const location = this.userPosition || this.center;
    return this.searchZoneKey(location);
  }

  openDistanceQuestionnaire(): void {
    if (!this.locationReady) return;
    this.distanceLocationKey = this.currentDistanceLocationKey();
    this.pendingDistanceKm = this.distanceSelectionConfirmed
      ? this.maxDistanceKm
      : 30;
    this.isDistanceQuestionnaireOpen = true;
    this.loadDistancePreview();
  }

  closeDistanceQuestionnaire(): void {
    // En el primer ingreso el radio es obligatorio; cuando se abrió desde
    // los filtros sí se puede cerrar conservando la elección anterior.
    if (!this.distanceSelectionConfirmed) return;
    this.isDistanceQuestionnaireOpen = false;
  }

  selectDistanceOption(km: SearchRadiusKm): void {
    this.pendingDistanceKm = km;
  }

  confirmDistanceSelection(): void {
    const wasConfirmed = this.distanceSelectionConfirmed;
    const changed =
      !wasConfirmed || this.maxDistanceKm !== this.pendingDistanceKm;
    this.maxDistanceKm = this.pendingDistanceKm;
    this.distanceSelectionConfirmed = true;
    this.forceDistanceConfirmation = false;
    this.isDistanceQuestionnaireOpen = false;
    this.exploreCache.setSearchRadiusPreference(
      this.distanceLocationKey,
      this.maxDistanceKm,
    );
    if (!changed) return;

    this.cancelAiRefresh();
    this.cancelNearbyRefresh();
    this.lastMatchKey = '';
    this.lastDbNearbyKey = '';
    this.matchRequestId++;
    this.nearbyRequestId++;
    this.apiMatches = [];
    this.nearbyUniversities = [];
    this.nearbyCatalogSignature = null;
    this.nearbyDiscoveryComplete = true;
    this.nearbyRetryAt = null;
    this.lastMatchesSavedAt = 0;
    this.isUsingCachedMatches = false;
    this.isUsingCachedNearby = false;
    this.matchLoadError = null;
    this.nearbyLoadError = null;
    this.processData();
    this.beginBlockingLoad();
    this.loadApiMatches();
    this.triggerPlacesSearch();
  }

  private resetDistanceSelection(forceConfirmation: boolean): void {
    this.distanceSelectionConfirmed = false;
    this.forceDistanceConfirmation = forceConfirmation;
    this.isDistanceQuestionnaireOpen = false;
    this.distanceLocationKey = '';
    this.distancePreviewUniversities = [];
    this.distancePreviewRequestId++;
    this.cancelAiRefresh();
    this.cancelNearbyRefresh();
    this.lastMatchKey = '';
    this.lastDbNearbyKey = '';
    this.matchRequestId++;
    this.nearbyRequestId++;
    this.nearbyCatalogSignature = null;
    this.nearbyDiscoveryComplete = true;
    this.nearbyRetryAt = null;
    this.lastMatchesSavedAt = 0;
  }

  private loadDistancePreview(): void {
    const requestId = ++this.distancePreviewRequestId;
    const location = this.userPosition || this.center;
    const previewKey = `${this.searchZoneKey(location)}|50`;
    const cached = this.exploreCache.getNearbyPreview(previewKey);
    if (cached) {
      this.distancePreviewUniversities = cached.data;
      if (!cached.stale) {
        this.isLoadingDistancePreview = false;
        this.isRefreshingDistancePreview = false;
        this.distancePreviewError = false;
        return;
      }
    }
    this.isLoadingDistancePreview = !cached;
    this.isRefreshingDistancePreview = !!cached;
    this.distancePreviewError = false;
    this.universityService
      .getNearbyUniversities(location, 50)
      .pipe(timeout(15_000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          if (requestId !== this.distancePreviewRequestId) return;
          this.distancePreviewUniversities = rows || [];
          this.exploreCache.setNearbyPreview(
            previewKey,
            this.distancePreviewUniversities,
          );
          this.isLoadingDistancePreview = false;
          this.isRefreshingDistancePreview = false;
        },
        error: (error) => {
          if (requestId !== this.distancePreviewRequestId) return;
          console.error('No se pudo cargar la vista previa del radio:', error);
          if (!cached) this.distancePreviewUniversities = [];
          this.isLoadingDistancePreview = false;
          this.isRefreshingDistancePreview = false;
          this.distancePreviewError = !cached;
        },
      });
  }

  retryDistancePreview(): void {
    this.loadDistancePreview();
  }

  get distancePreviewForSelection(): DbNearbyUniversity[] {
    return this.distancePreviewUniversities.filter(
      (university) => university.distanceKm <= this.pendingDistanceKm,
    );
  }

  get verifiedDistancePreviewCount(): number {
    return this.distancePreviewForSelection.filter(
      (university) => !!university.steamPrograms?.length,
    ).length;
  }

  distanceOptionCount(km: SearchRadiusKm): number {
    return this.distancePreviewUniversities.filter(
      (university) => university.distanceKm <= km,
    ).length;
  }

  get distanceContextLabel(): string {
    if (this.locationMode === 'city' && this.selectedCityId) {
      return (
        this.exploreCache.getCityById(this.selectedCityId)?.name ||
        'la ciudad elegida'
      );
    }
    return 'tu ubicación actual';
  }

  // ── A8: matching real desde la API ─────────────────────────────────────────

  /**
   * Pide a la API el matching de universidades (A8): match duro por programa,
   * distancia y costo + explicación de la IA. El radio recalcula de inmediato
   * la lista determinista y la IA la afina en segundo plano; costo reutiliza caché.
   */
  loadApiMatches(forceRefresh = false, silent = false) {
    if (!this.hasTakenTest) return;
    if (!this.ensureDistanceSelection()) return;
    const location = this.userPosition || this.center;

    // Una zona GPS usa dos decimales para tolerar el movimiento normal del
    // teléfono; así un jitter de pocos metros no invalida toda la caché.
    const key = `${this.searchZoneKey(location)}|${this.maxDistanceKm}|${this.costPreference}`;
    const sameKey = key === this.lastMatchKey;
    if (sameKey && !forceRefresh) return;
    if (!sameKey) {
      this.cancelAiRefresh();
      this.queuedMatchRefreshKey = null;
    }
    this.lastMatchKey = key;
    if (forceRefresh) this.clearAiRefreshTimer();

    // Stale-while-revalidate: incluso una entrada vencida se pinta primero.
    // Si está fresca y la IA terminó por completo, entrar hace cero peticiones.
    // Los fallbacks deterministas y lotes parciales respetan el mismo backoff
    // corto del backend y se recuperan solos, sin quedar congelados 24 horas.
    const cached = this.exploreCache.getMatches(key, this.testMarker);
    if (!forceRefresh && cached) {
      this.applyMatchResponse(cached.data, key, true, cached.savedAt);
      if (
        !this.shouldRevalidateCachedMatch(
          cached.data,
          cached.savedAt,
          cached.stale,
        )
      ) {
        return;
      }
      silent = true;
      this.clearAiRefreshTimer();
    }

    // Un poll de IA y un cambio progresivo del catálogo pueden coincidir. Se
    // conserva una sola petición activa por clave y se ejecuta una única
    // revalidación final con el catálogo más reciente.
    if (this.activeMatchRequestKey === key) {
      this.queuedMatchRefreshKey = key;
      return;
    }
    if (this.queuedMatchRefreshKey === key) {
      // Esta petición ya satisface la revalidación que quedó pendiente al
      // pausar la pestaña o perder conexión.
      this.queuedMatchRefreshKey = null;
    }

    const requestId = ++this.matchRequestId;
    this.activeMatchRequestKey = key;
    const hasVisibleResults = this.apiMatches.length > 0 || !!cached;
    this.matchLoadError = null;
    this.isLoadingMatches = !silent && !hasVisibleResults;
    this.isRefreshingMatches = silent || hasVisibleResults;
    this.universityService
      .matchUniversities({
        userLocation: { lat: location.lat, lng: location.lng },
        filters: {
          maxDistanceKm: this.maxDistanceKm,
          costPreference: this.costPreference,
        },
      })
      .pipe(timeout(30_000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // Una respuesta iniciada antes del enriquecimiento de la zona no debe
          // pisar la respuesta fresca que ya contiene la nueva oferta verificada.
          if (requestId !== this.matchRequestId) return;
          this.activeMatchRequestKey = null;
          this.exploreCache.setMatches(key, this.testMarker, res);
          const savedAt = Date.now();
          this.applyMatchResponse(res, key, false, savedAt);
          this.flushQueuedMatchRefresh(key);
        },
        error: (err) => {
          if (requestId !== this.matchRequestId) return;
          this.activeMatchRequestKey = null;
          console.error('Error en el matching de universidades (A8)', err);
          this.isLoadingMatches = false;
          this.isRefreshingMatches = false;
          this.matchLoadError = this.isOffline
            ? 'Sin conexión. Seguimos mostrando la información guardada.'
            : 'No pudimos actualizar las coincidencias en este momento.';
          this.finishLoading();
          if (this.queuedMatchRefreshKey === key) {
            this.flushQueuedMatchRefresh(key);
            return;
          }
          if (this.aiProcessing || this.aiRecoveryPending) {
            this.scheduleAiRefresh(
              key,
              this.aiProcessing ? 5_000 : 30_000,
              this.aiRecoveryPending,
            );
            return;
          }
          if (!cached && !this.apiMatches.length) {
            this.apiMatches = [];
            this.processData();
          }
          // Una falla transitoria no debe obligar a recargar la página. El
          // mismo temporizador acotado del polling reintenta en segundo plano;
          // al volver la conexión, resumeBackgroundUpdates lo adelanta.
          if (!this.isOffline) {
            const retryDelay = Math.min(
              30_000,
              3_000 * 2 ** Math.min(this.aiRefreshAttempts, 4),
            );
            this.scheduleAiRefresh(key, retryDelay);
          }
        },
      });
  }

  /** Aplica una respuesta de matching (de la red o del caché) a la vista. */
  private applyMatchResponse(
    res: UniversityMatchResponse,
    key: string,
    fromCache: boolean,
    updatedAt: number,
  ): void {
    this.apiMatches = (res.matches || []).map((m, index) =>
      this.mapApiMatch(m, index),
    );
    this.aiProvider = res.aiProvider ?? null;
    this.aiAnalyzedCount =
      res.aiAnalyzedCount ?? this.apiMatches.filter((m) => m.aiAnalyzed).length;
    this.candidateCount = res.candidateCount ?? this.apiMatches.length;
    this.aiProcessing = res.aiProcessing ?? false;
    this.isLoadingMatches = false;
    this.isRefreshingMatches = false;
    this.isUsingCachedMatches = fromCache;
    this.matchLoadError = null;
    this.lastMatchesSavedAt = updatedAt;
    this.lastDataUpdatedAt = new Date(
      Math.max(this.lastDataUpdatedAt?.getTime() || 0, updatedAt),
    );
    // El listado determinista ya es útil; no se mantiene toda la pantalla en
    // skeleton mientras Groq termina el ajuste fino en segundo plano.
    this.finishLoading();
    this.processData();
    this.fitMapToResults();
    const recoveryDelay = this.aiRecoveryDelayMs(res);
    this.aiRecoveryPending = !this.aiProcessing && recoveryDelay !== null;
    if (this.aiProcessing) {
      this.scheduleAiRefresh(key);
    } else if (recoveryDelay !== null) {
      const remainingDelay = Math.max(
        1_000,
        recoveryDelay - Math.max(0, Date.now() - updatedAt),
      );
      this.scheduleAiRefresh(key, remainingDelay, true);
    } else {
      this.cancelAiRefresh();
    }
  }

  private shouldRevalidateCachedMatch(
    response: UniversityMatchResponse,
    savedAt: number,
    stale: boolean,
  ): boolean {
    if (stale || response.aiProcessing) return true;
    const recoveryDelay = this.aiRecoveryDelayMs(response);
    return recoveryDelay !== null && Date.now() - savedAt >= recoveryDelay;
  }

  private aiRecoveryDelayMs(response: UniversityMatchResponse): number | null {
    return this.aiRecoveryDelayForProvider(response.aiProvider);
  }

  private aiRecoveryDelayForProvider(
    providerName?: string | null,
  ): number | null {
    const provider = (providerName || '').toLowerCase();
    if (provider.includes('deterministic'))
      return this.DETERMINISTIC_AI_RETRY_MS;
    if (provider.includes('partial') || provider.includes('parcial')) {
      return this.PARTIAL_AI_RETRY_MS;
    }
    return null;
  }

  private scheduleAiRefresh(
    key: string,
    delayMs = 5_000,
    recovery = false,
  ): void {
    if (recovery) this.aiRecoveryPending = true;
    if (this.aiRefreshTimer || key !== this.lastMatchKey) return;
    if (this.isOffline || document.visibilityState !== 'visible') return;
    if (this.aiRefreshAttempts >= this.MAX_AI_REFRESH_ATTEMPTS) {
      this.aiPollingPaused = true;
      return;
    }
    this.aiPollingPaused = false;
    this.aiRefreshTimer = setTimeout(() => {
      this.aiRefreshTimer = null;
      if (key !== this.lastMatchKey) return;
      this.aiRefreshAttempts++;
      this.loadApiMatches(true, true);
    }, delayMs);
  }

  private flushQueuedMatchRefresh(key: string): void {
    if (this.queuedMatchRefreshKey !== key) return;
    if (this.isOffline || document.visibilityState !== 'visible') return;
    this.queuedMatchRefreshKey = null;
    this.clearAiRefreshTimer();
    queueMicrotask(() => {
      if (key === this.lastMatchKey) this.loadApiMatches(true, true);
    });
  }

  private clearAiRefreshTimer(): void {
    if (this.aiRefreshTimer) clearTimeout(this.aiRefreshTimer);
    this.aiRefreshTimer = null;
  }

  private cancelAiRefresh(): void {
    this.clearAiRefreshTimer();
    this.aiRefreshAttempts = 0;
    this.aiPollingPaused = false;
    this.aiRecoveryPending = false;
  }

  private searchZoneKey(location: google.maps.LatLngLiteral): string {
    if (this.locationMode === 'city' && this.selectedCityId) {
      return `city:${this.selectedCityId}`;
    }
    return `auto:${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
  }

  /** Convierte un UniversityMatchItem de la API al modelo de tarjeta de la vista. */
  private mapApiMatch(m: UniversityMatchItem, index: number): any {
    return {
      id: m.universityId,
      name: m.name,
      location: m.googleMapsData?.address || 'Dirección no disponible',
      image: this.DEFAULT_IMAGES[index % this.DEFAULT_IMAGES.length],
      logo: index === 0 ? 'building' : 'graduation-cap',
      // El chip principal siempre es una carrera REAL de esta institución;
      // matchedCareer es la recomendación del alumno y se muestra aparte.
      tags: [
        m.matchedProgram || m.matchedCareer,
        this.COST_TIER_LABELS[m.costTier] || m.costTier,
      ],
      rating: m.googleMapsData?.rating ?? null,
      matchPercentage: m.matchScore,
      career: m.matchedCareer,
      /** Programa real de la universidad afín a la carrera recomendada (si difiere del nombre del catálogo). */
      matchedProgram: m.matchedProgram || null,
      aiAnalyzed: m.aiAnalyzed ?? false,
      description: m.explanation,
      keyDates: m.admissionDates || 'Consultar sitio web',
      studyPlan: m.steamPrograms?.length
        ? m.steamPrograms.map((p) => p.name).join(', ')
        : m.matchedCareer,
      tuitionRange: m.tuitionRange || null,
      modality: m.modality || null,
      websiteUrl: m.websiteUrl || null,
      distanceKm: m.distanceKm,
      costTier: m.costTier,
      costTierLabel: this.COST_TIER_LABELS[m.costTier] || m.costTier,
      position: m.location
        ? { lat: m.location.lat, lng: m.location.lng }
        : null,
      source: 'api',
      programs: m.steamPrograms || [],
    };
  }

  setDistanceFilter(km: SearchRadiusKm) {
    if (this.maxDistanceKm === km) return;
    this.maxDistanceKm = km;
    this.pendingDistanceKm = km;
    this.apiMatches = this.apiMatches.filter((match) => match.distanceKm <= km);
    this.nearbyUniversities = this.nearbyUniversities.filter(
      (university) => university.distanceKm <= km,
    );
    this.processData();
    if (this.distanceLocationKey) {
      this.exploreCache.setSearchRadiusPreference(this.distanceLocationKey, km);
    }
    this.loadApiMatches();
    // El radio de Places también depende de la distancia elegida
    this.triggerPlacesSearch();
  }

  setCostFilter(pref: CostPreference) {
    if (this.costPreference === pref) return;
    this.costPreference = pref;
    this.loadApiMatches();
  }

  /**
   * Cambia el centro de búsqueda: 'auto' vuelve al GPS/IP; un id de ciudad
   * usa sus coordenadas sin pedir ubicación (útil si el usuario no quiere
   * compartirla o quiere explorar otra ciudad). La elección se persiste.
   */
  setLocationChoice(choice: string) {
    this.resetDistanceSelection(true);
    if (choice === 'auto') {
      this.locationMode = 'auto';
      this.selectedCityId = null;
      this.exploreCache.setLocationPreference({ mode: 'auto' });
      this.getUserLocation();
      return;
    }

    const city = this.exploreCache.getCityById(choice);
    if (!city) return;

    this.locationMode = 'city';
    this.selectedCityId = city.id;
    this.exploreCache.setLocationPreference({ mode: 'city', cityId: city.id });

    const cityLocation = { lat: city.lat, lng: city.lng };
    this.userPosition = cityLocation;
    this.center = cityLocation;
    this.locationReady = true;
    this.zoom = 12;
    if (this.googleMap?.googleMap) {
      this.googleMap.panTo(cityLocation);
    }
    this.loadApiMatches();
    this.triggerPlacesSearch();
  }

  // ── "Cerca de ti": todo pasa por un único endpoint server-side (BD propia
  //    + Google Places + validación/enriquecimiento con IA solo si la zona
  //    tiene poca cobertura) — ver UniversityService.discoverNearby() ───────

  /**
   * Nombre conservado por historia (lo llaman ~12 lugares). Ya no hay
   * llamada a Places desde el navegador: el backend decide si la BD ya
   * cubre la zona o si hace falta descubrir/validar universidades nuevas.
   */
  triggerPlacesSearch(forceNetwork = false, restartJob = false) {
    if (!this.hasTakenTest) return;
    if (!this.ensureDistanceSelection()) return;

    // Fallback: usar el default si no hay ubicación de usuario
    const locationToUse = this.userPosition || this.center;

    // El radio de búsqueda sigue al filtro de distancia (Places admite máx. 50 km)
    const radiusKm = Math.min(this.maxDistanceKm, 50);

    const key = `${this.searchZoneKey(locationToUse)}|${radiusKm}`;
    const sameKey = key === this.lastDbNearbyKey;
    if (sameKey && !forceNetwork) return;
    if (!sameKey) {
      this.cancelNearbyRefresh();
      this.nearbyDiscoveryComplete = true;
      this.nearbyRetryAt = null;
    }
    this.lastDbNearbyKey = key;
    const requestId = ++this.nearbyRequestId;

    const cached = this.exploreCache.getPlaces(key);
    if (!forceNetwork && cached) {
      this.applyNearbySnapshot(cached.data, key, true, cached.savedAt);
      if (!cached.stale && !cached.data.processing) {
        // retryAt manda incluso si la última ronda dejó un aviso: entrar o
        // enfocar la pantalla no debe convertir ese aviso en POST repetidos.
        if (this.hasFutureNearbyRetry(cached.data)) return;
        if (this.isNearbySnapshotComplete(cached.data)) return;
      }
      if (this.nearbyRefreshTimer) clearTimeout(this.nearbyRefreshTimer);
      this.nearbyRefreshTimer = null;
    }

    const hasVisibleResults = this.nearbyUniversities.length > 0 || !!cached;
    this.nearbyLoadError = null;
    this.isLoadingNearby = !hasVisibleResults;
    this.isRefreshingNearby = hasVisibleResults;
    this.universityService
      .discoverNearby(locationToUse, radiusKm, restartJob)
      .pipe(timeout(20_000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rawSnapshot) => {
          if (requestId !== this.nearbyRequestId) return;
          // Compatibilidad durante el despliegue escalonado: la versión anterior
          // del backend respondía directamente un arreglo después de esperar.
          const snapshot = this.normalizeNearbySnapshot(rawSnapshot);
          this.exploreCache.setPlaces(key, snapshot);
          this.applyNearbySnapshot(snapshot, key, false, Date.now());
        },
        error: (err) => {
          if (requestId !== this.nearbyRequestId) return;
          console.error('No se pudieron cargar universidades cercanas:', err);
          this.isLoadingNearby = false;
          this.isRefreshingNearby = false;
          this.nearbyLoadError = this.isOffline
            ? 'Sin conexión. Mostramos las universidades guardadas en este dispositivo.'
            : 'No pudimos comprobar si hay universidades nuevas en la zona.';
          // Conservamos el caché visible y reintentamos sin que el alumno
          // tenga que actualizar el navegador.
          if (!this.isOffline) {
            const retryDelay = Math.min(
              30_000,
              3_000 * 2 ** Math.min(this.nearbyRefreshAttempts, 4),
            );
            this.nearbyRetryAt = Date.now() + retryDelay;
            if (!hasVisibleResults) this.nearbyDiscoveryComplete = false;
            this.scheduleNearbyRefresh(key, retryDelay);
          }
          this.finishLoading();
          this.processData();
        },
      });
  }

  private normalizeNearbySnapshot(
    response: NearbyDiscoveryResponse | DbNearbyUniversity[],
  ): NearbyDiscoveryResponse {
    if (Array.isArray(response)) {
      const verifiedCount = response.filter(
        (u) => !!u.steamPrograms?.length,
      ).length;
      return {
        universities: response,
        processing: false,
        complete: true,
        coverageCount: response.length,
        verifiedCount,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      universities: response?.universities || [],
      processing: !!response?.processing,
      // Durante un despliegue escalonado, un backend anterior no envía
      // `complete`; en ese caso conservamos su semántica previa.
      complete: response?.complete ?? !response?.processing,
      coverageCount:
        response?.coverageCount ?? response?.universities?.length ?? 0,
      verifiedCount: response?.verifiedCount ?? 0,
      startedAt: response?.startedAt,
      updatedAt: response?.updatedAt || new Date().toISOString(),
      retryAt: response?.retryAt,
      error: response?.error,
    };
  }

  private applyNearbySnapshot(
    snapshot: NearbyDiscoveryResponse,
    key: string,
    fromCache: boolean,
    savedAt: number,
  ): void {
    const signature = this.buildNearbyCatalogSignature(snapshot.universities);
    const previousSignature = this.nearbyCatalogSignature;
    const catalogChanged =
      previousSignature !== null && signature !== previousSignature;
    const firstSnapshotMayBeNewer =
      previousSignature === null &&
      snapshot.universities.length > 0 &&
      ((this.lastMatchesSavedAt > 0 && savedAt > this.lastMatchesSavedAt) ||
        this.activeMatchRequestKey === this.lastMatchKey);
    this.nearbyCatalogSignature = signature;
    this.nearbyUniversities = snapshot.universities.map((u, i) =>
      this.mapDbNearby(u, i),
    );
    this.nearbyCoverageCount = snapshot.coverageCount;
    this.nearbyVerifiedCount = snapshot.verifiedCount;
    this.nearbyJobStartedAt = snapshot.startedAt
      ? new Date(snapshot.startedAt)
      : null;
    this.isDiscoveringNearby = snapshot.processing;
    this.nearbyDiscoveryComplete = this.isNearbySnapshotComplete(snapshot);
    this.nearbyRetryAt = this.parseNearbyRetryAt(snapshot);
    this.isLoadingNearby = false;
    this.isRefreshingNearby = false;
    this.isUsingCachedNearby = fromCache;
    this.nearbyLoadError = snapshot.error || null;
    const serverUpdatedAt = Date.parse(snapshot.updatedAt);
    const updatedAt = Number.isFinite(serverUpdatedAt)
      ? serverUpdatedAt
      : savedAt;
    this.lastDataUpdatedAt = new Date(
      Math.max(this.lastDataUpdatedAt?.getTime() || 0, updatedAt),
    );
    this.processData();
    this.finishLoading();
    this.fitMapToResults();

    if (catalogChanged || firstSnapshotMayBeNewer) {
      // Recalcula si cambió la oferta o si Places trae una fotografía más
      // reciente que el match local. Esto cubre también el primer lote que
      // pasa de un catálogo vacío a universidades verificadas.
      this.loadApiMatches(true, true);
    }
    if (snapshot.processing) {
      this.scheduleNearbyRefresh(key);
    } else if (this.hasFutureNearbyRetry(snapshot)) {
      // retryAt tiene prioridad incluso si hay cobertura completa: puede ser
      // el reintento de una actualización que terminó con aviso.
      this.scheduleNearbyRefresh(key, this.nearbyRetryDelay(snapshot), false);
    } else if (!this.nearbyDiscoveryComplete) {
      this.scheduleNearbyRefresh(key, this.nearbyRetryDelay(snapshot), false);
    } else {
      this.cancelNearbyRefresh();
    }
  }

  private buildNearbyCatalogSignature(
    universities: DbNearbyUniversity[],
  ): string {
    return universities
      .map(
        (university) =>
          `${university.id}:${university.programsVerifiedAt || ''}:${(
            university.steamPrograms || []
          )
            .map((program) => `${program.name}:${program.area}`)
            .sort()
            .join(',')}`,
      )
      .sort()
      .join('|');
  }

  private isNearbySnapshotComplete(snapshot: NearbyDiscoveryResponse): boolean {
    return snapshot.complete !== false;
  }

  private parseNearbyRetryAt(snapshot: NearbyDiscoveryResponse): number | null {
    if (!snapshot.retryAt) return null;
    const timestamp = Date.parse(snapshot.retryAt);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  private hasFutureNearbyRetry(snapshot: NearbyDiscoveryResponse): boolean {
    const retryAt = this.parseNearbyRetryAt(snapshot);
    return retryAt !== null && retryAt > Date.now();
  }

  private nearbyRetryDelay(snapshot: NearbyDiscoveryResponse): number {
    const retryAt = this.parseNearbyRetryAt(snapshot);
    if (retryAt === null) return 30_000;
    return Math.max(1_000, retryAt - Date.now() + 250);
  }

  private scheduleNearbyRefresh(
    key: string,
    delayMs = 5_000,
    countAttempt = true,
  ): void {
    if (this.nearbyRefreshTimer || key !== this.lastDbNearbyKey) return;
    if (this.isOffline || document.visibilityState !== 'visible') return;
    if (
      countAttempt &&
      this.nearbyRefreshAttempts >= this.MAX_NEARBY_REFRESH_ATTEMPTS
    ) {
      this.nearbyPollingPaused = true;
      return;
    }
    this.nearbyPollingPaused = false;
    this.nearbyRefreshTimer = setTimeout(() => {
      this.nearbyRefreshTimer = null;
      if (key !== this.lastDbNearbyKey) return;
      if (countAttempt) this.nearbyRefreshAttempts++;
      this.triggerPlacesSearch(true, false);
    }, delayMs);
  }

  private cancelNearbyRefresh(): void {
    if (this.nearbyRefreshTimer) clearTimeout(this.nearbyRefreshTimer);
    this.nearbyRefreshTimer = null;
    this.nearbyRefreshAttempts = 0;
    this.nearbyPollingPaused = false;
  }

  private pauseBackgroundTimers(): void {
    this.clearAiRefreshTimer();
    if (this.nearbyRefreshTimer) clearTimeout(this.nearbyRefreshTimer);
    this.nearbyRefreshTimer = null;
  }

  private resumeBackgroundUpdates(): void {
    if (
      this.isOffline ||
      document.visibilityState !== 'visible' ||
      !this.hasTakenTest ||
      !this.distanceSelectionConfirmed
    ) {
      return;
    }
    const mustRefreshAiNow =
      this.aiProcessing ||
      this.queuedMatchRefreshKey === this.lastMatchKey ||
      this.aiPollingPaused ||
      !!this.matchLoadError;
    if (mustRefreshAiNow) {
      this.clearAiRefreshTimer();
      this.aiRefreshAttempts = 0;
      this.aiPollingPaused = false;
      this.loadApiMatches(true, true);
    } else if (this.aiRecoveryPending) {
      const retryDelay = this.aiRecoveryDelayForProvider(this.aiProvider);
      const remainingDelay =
        retryDelay === null
          ? 1_000
          : Math.max(
              1_000,
              retryDelay - (Date.now() - this.lastMatchesSavedAt),
            );
      this.scheduleAiRefresh(this.lastMatchKey, remainingDelay, true);
    }
    const hasScheduledNearbyRecovery =
      !!this.nearbyLoadError && this.nearbyRetryAt !== null;
    if (
      this.isDiscoveringNearby ||
      !this.nearbyDiscoveryComplete ||
      this.nearbyPollingPaused ||
      hasScheduledNearbyRecovery
    ) {
      if (this.nearbyRefreshTimer) clearTimeout(this.nearbyRefreshTimer);
      this.nearbyRefreshTimer = null;
      this.nearbyRefreshAttempts = 0;
      this.nearbyPollingPaused = false;
      const retryDelay =
        this.nearbyRetryAt === null ? 0 : this.nearbyRetryAt - Date.now() + 250;
      if (!this.isDiscoveringNearby && retryDelay > 1_000) {
        this.scheduleNearbyRefresh(this.lastDbNearbyKey, retryDelay, false);
      } else {
        this.triggerPlacesSearch(true, false);
      }
    }
  }

  retryUniversityLoading(): void {
    if (this.isOffline) return;
    this.matchLoadError = null;
    this.nearbyLoadError = null;
    this.aiPollingPaused = false;
    this.nearbyPollingPaused = false;
    this.aiRefreshAttempts = 0;
    this.nearbyRefreshAttempts = 0;
    this.loadApiMatches(true, this.apiMatches.length > 0);
    this.triggerPlacesSearch(true, true);
  }

  retryProfileLoading(): void {
    this.recommendationsRequested = false;
    this.loadRecommendations();
  }

  retrySavedUniversities(): void {
    this.loadSavedUniversities();
  }

  get hasUniversityData(): boolean {
    return this.apiMatches.length > 0 || this.nearbyUniversities.length > 0;
  }

  get showInitialUniversitySkeleton(): boolean {
    return (
      this.viewMode === 'explore' &&
      this.isLoading &&
      !this.hasUniversityData &&
      !this.isDistanceQuestionnaireOpen
    );
  }

  get hasBackgroundWork(): boolean {
    return (
      this.isLoadingMatches ||
      this.isLoadingNearby ||
      this.isRefreshingMatches ||
      this.isRefreshingNearby ||
      this.aiProcessing ||
      this.isDiscoveringNearby
    );
  }

  get showLoadStatus(): boolean {
    return (
      this.viewMode === 'explore' &&
      this.hasTakenTest &&
      (this.hasBackgroundWork ||
        this.isUsingCachedMatches ||
        this.isUsingCachedNearby ||
        this.isOffline ||
        !!this.matchLoadError ||
        !!this.nearbyLoadError ||
        this.aiPollingPaused ||
        this.nearbyPollingPaused ||
        !this.nearbyDiscoveryComplete ||
        !!this.lastDataUpdatedAt)
    );
  }

  get loadStatusTone(): 'loading' | 'cached' | 'error' | 'ready' {
    if (
      this.matchLoadError ||
      this.nearbyLoadError ||
      this.aiPollingPaused ||
      this.nearbyPollingPaused
    ) {
      return 'error';
    }
    if (this.hasBackgroundWork) return 'loading';
    if (this.isOffline || this.isUsingCachedMatches || this.isUsingCachedNearby)
      return 'cached';
    return 'ready';
  }

  get loadStatusTitle(): string {
    if (this.isOffline) return 'Estás viendo datos guardados';
    if (this.aiPollingPaused || this.nearbyPollingPaused)
      return 'La preparación está tomando más tiempo';
    if (this.matchLoadError || this.nearbyLoadError)
      return 'No pudimos completar la actualización';
    if (this.isLoadingProfile) return 'Preparando tu perfil vocacional';
    if (this.isLocating) return 'Obteniendo tu ubicación';
    if (this.isLoadingMatches && !this.hasUniversityData)
      return 'Calculando tus mejores coincidencias';
    if (this.isLoadingNearby && !this.hasUniversityData)
      return 'Buscando universidades en tu zona';
    if (this.isDiscoveringNearby)
      return 'Ampliando y verificando la oferta de tu zona';
    if (this.aiProcessing) return 'Afinando tus coincidencias con IA';
    if (this.isRefreshingMatches || this.isRefreshingNearby)
      return 'Actualizando en segundo plano';
    if (!this.nearbyDiscoveryComplete) return 'Seguiremos ampliando esta zona';
    if (this.isUsingCachedMatches || this.isUsingCachedNearby)
      return 'Resultados listos desde este dispositivo';
    return 'Resultados actualizados';
  }

  get loadStatusDetail(): string {
    if (this.isOffline)
      return 'Puedes seguir explorando. Actualizaremos automáticamente al recuperar la conexión.';
    if (this.aiPollingPaused || this.nearbyPollingPaused) {
      return 'Conservamos los resultados disponibles. Puedes reintentar sin recargar la página.';
    }
    if (this.matchLoadError || this.nearbyLoadError) {
      return this.matchLoadError || this.nearbyLoadError || '';
    }
    if (this.isLocating)
      return 'Usaremos GPS y, si no está disponible, una ubicación aproximada.';
    if (this.isDiscoveringNearby) {
      return `${this.nearbyVerifiedCount} de ${this.nearbyCoverageCount} instituciones tienen oferta STEAM verificada. Las tarjetas nuevas aparecerán solas.`;
    }
    if (this.aiProcessing) {
      return `${this.aiAnalyzedCount} de ${this.candidateCount} coincidencias ya fueron analizadas. Puedes seguir usando la pantalla.`;
    }
    if (!this.nearbyDiscoveryComplete) {
      return `Ya puedes consultar ${this.nearbyCoverageCount} instituciones. La siguiente verificación se ejecutará sola, sin recargar la página.`;
    }
    if (this.isUsingCachedMatches || this.isUsingCachedNearby) {
      return 'No fue necesario volver a consultar la IA para mostrar esta información.';
    }
    return 'La lista y el mapa ya tienen la información más reciente disponible.';
  }

  /** Convierte una universidad de la BD al modelo de tarjeta "cerca de ti". */
  private mapDbNearby(u: DbNearbyUniversity, index: number): any {
    const programs = u.steamPrograms || [];
    return {
      id: u.id,
      name: u.name,
      location: u.address || 'Dirección no disponible',
      image: this.DEFAULT_IMAGES[index % this.DEFAULT_IMAGES.length],
      logo: 'graduation-cap',
      tags: u.costTier
        ? ['Cerca de ti', this.COST_TIER_LABELS[u.costTier] || u.costTier]
        : ['Cerca de ti'],
      rating: u.rating ?? null,
      matchPercentage: null, // sin match real: no lo inventamos
      career: null,
      description: programs.length
        ? `Ofrece: ${programs
            .slice(0, 4)
            .map((p) => p.name)
            .join(', ')}${programs.length > 4 ? '…' : ''}.`
        : 'Universidad cercana a tu ubicación.',
      keyDates: u.admissionDates || 'Consultar sitio web',
      studyPlan: programs.length
        ? programs.map((p) => p.name).join(', ')
        : 'Consultar oferta educativa',
      tuitionRange: u.tuitionRange || null,
      modality: u.modality || null,
      websiteUrl: u.website || null,
      distanceKm: Math.round(u.distanceKm * 10) / 10,
      position: u.location
        ? { lat: u.location.latitude, lng: u.location.longitude }
        : null,
      costTier: u.costTier,
      costTierLabel: u.costTier
        ? this.COST_TIER_LABELS[u.costTier] || u.costTier
        : undefined,
      source: 'db',
      programs,
      /** Presente si el backend completó/validó este registro con IA (findOrDiscoverNearby) — dispara el aviso al alumno. */
      aiEnrichedAt: u.aiEnrichedAt || null,
      aiEnrichmentStatus: u.aiEnrichmentStatus || null,
      programsVerifiedAt: u.programsVerifiedAt || null,
    };
  }

  /** true si alguna universidad visible "cerca de ti" fue investigada/completada con IA — dispara el aviso al alumno. */
  get hasAiResearchedNearby(): boolean {
    return this.filteredNearbyUniversities.some(
      (u) =>
        u.aiEnrichmentStatus === 'complete' ||
        u.aiEnrichmentStatus === 'partial',
    );
  }

  /** Encuadra la cámara del mapa para mostrar usuario + resultados visibles (respeta la búsqueda activa). */
  private fitMapToResults() {
    if (!this.googleMap?.googleMap) return;
    const withPosition = this.mapMarkers;
    if (!withPosition.length && !this.userPosition) return;

    const bounds = new google.maps.LatLngBounds();
    // Si hay una búsqueda activa con resultados, no metemos al usuario en el
    // encuadre para que el zoom se concentre en lo que se buscó.
    if (this.userPosition && !this.searchQuery.trim())
      bounds.extend(this.userPosition);
    withPosition.forEach((u) => bounds.extend(u.position));
    this.googleMap.googleMap.fitBounds(bounds, {
      bottom: 60,
      left: 40,
      right: 40,
      top: 40,
    });
  }

  /** true si la universidad coincide con la búsqueda activa (predicado único, compartido por lista y mapa). */
  matchesQuery(uni: any): boolean {
    if (!this.searchQuery.trim()) return true;
    const query = this.searchQuery.toLowerCase().trim();
    return (
      uni.name?.toLowerCase().includes(query) ||
      uni.location?.toLowerCase().includes(query) ||
      (uni.career && uni.career.toLowerCase().includes(query))
    );
  }

  /** Se dispara en cada tecleo de la búsqueda: re-encuadra el mapa a los resultados (con un pequeño debounce). */
  onSearchChange(): void {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
    this.searchDebounceId = setTimeout(() => this.fitMapToResults(), 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.fitMapToResults();
  }

  getMarkerOptions(uni: any): google.maps.MarkerOptions {
    const isSelected =
      this.selectedUniversity && this.selectedUniversity.id === uni.id;
    const isSearchMatch = !!this.searchQuery.trim() && this.matchesQuery(uni);

    if (isSelected) {
      // Marcador grande y color principal (cyan) para la seleccionada
      const selectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#07B1C9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      return {
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(selectedSvg),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 44),
        },
        zIndex: 1000,
      };
    }

    if (isSearchMatch) {
      // Resalta el resultado de búsqueda: pin ámbar más grande + animación de rebote
      const highlightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      return {
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(highlightSvg),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40),
        },
        animation: google.maps.Animation.BOUNCE,
        zIndex: 900,
      };
    }

    // Universidades con match real (A8) en cyan; cercanas (Places) en gris-rojo neutro
    const isApiMatch = uni.source === 'api';
    const color = isApiMatch
      ? '#07B1C9'
      : uni.source === 'saved'
        ? '#EC4899'
        : '#94A3B8';
    const size = isApiMatch ? 30 : 24;
    const normalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    return {
      icon: {
        url:
          'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(normalSvg),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size),
      },
      zIndex: isApiMatch ? 200 : 1,
    };
  }

  processData() {
    // Combina matches reales (A8) con contexto de Places, sin duplicar por nombre.
    const apiNames = new Set(
      this.apiMatches.map((u) => this.normalizeName(u.name)),
    );
    const nearbyDeduped = this.nearbyUniversities.filter(
      (u) => !apiNames.has(this.normalizeName(u.name)),
    );
    this.universities = [...this.apiMatches, ...nearbyDeduped];

    this.totalCoincidencias = this.apiMatches.length;
    this.bestMatchUniversity = this.apiMatches[0] || null;
    this.maxMatchPercentage = this.apiMatches[0]?.matchPercentage || 0;
    this.otherUniversities = this.apiMatches.slice(1);
  }

  private normalizeName(name: string): string {
    return (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  trackUniversity(_index: number, university: any): string {
    return (
      university?.id ||
      university?.universityId ||
      this.normalizeName(university?.name || '')
    );
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackDistanceOption(_index: number, option: DistanceOption): number {
    return option.km;
  }

  /** true si esta universidad ya está en favoritos (heart relleno). */
  isSaved(uni: any): boolean {
    return this.savedNames.has(this.normalizeName(uni?.name || ''));
  }

  /** Lista "cerca de ti" (Places) con los filtros de distancia y búsqueda aplicados. */
  get filteredNearbyUniversities(): any[] {
    if (this.viewMode === 'saved') return [];
    const apiNames = new Set(
      this.apiMatches.map((u) => this.normalizeName(u.name)),
    );
    const list = this.nearbyUniversities.filter(
      (u) =>
        !apiNames.has(this.normalizeName(u.name)) &&
        (u.distanceKm == null || u.distanceKm <= this.maxDistanceKm),
    );
    return list.filter((uni) => this.matchesQuery(uni));
  }

  /** Marcadores del mapa: universidades con coordenadas que superen el filtro de búsqueda activo. */
  get mapMarkers(): any[] {
    return this.currentUniversitiesList.filter(
      (u) => u.position && this.matchesQuery(u),
    );
  }

  /** Abre la universidad seleccionada en Google Maps (app nativa en móvil, o el sitio web en desktop). */
  openInGoogleMaps(uni?: any): void {
    const target = uni || this.selectedUniversity;
    if (!target) return;
    const query = target.position
      ? `${target.position.lat},${target.position.lng}`
      : `${target.name} ${target.location || ''}`.trim();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener');
  }

  /** Abre el sitio oficial de la universidad seleccionada (si existe). */
  openWebsite() {
    const url = this.selectedUniversity?.websiteUrl;
    if (url) {
      window.open(url, '_blank', 'noopener');
    } else {
      this.toastService.showToast(
        'Esta universidad no tiene sitio web registrado.',
        'info',
      );
    }
  }

  get currentUniversitiesList(): any[] {
    const list =
      this.viewMode === 'saved' ? this.savedUniversities : this.universities;
    return list.filter((uni) => this.matchesQuery(uni));
  }

  // Getters computados para el filtrado en tiempo real
  get filteredOtherUniversities() {
    // Si estamos en modo 'saved', filtramos sobre las guardadas
    const sourceArray =
      this.viewMode === 'saved'
        ? this.savedUniversities
        : this.otherUniversities;
    return sourceArray.filter((uni) => this.matchesQuery(uni));
  }

  /**
   * Sugerencias secundarias que sí recibieron análisis individual de IA.
   */
  get secondarySuggestions(): any[] {
    if (this.viewMode !== 'explore') return [];
    return this.filteredOtherUniversities.filter((uni) => uni.aiAnalyzed);
  }

  /** El resto de coincidencias (ranking determinista, sin análisis individual de IA). */
  get remainingRecommended(): any[] {
    if (this.viewMode !== 'explore') return [];
    return this.filteredOtherUniversities.filter((uni) => !uni.aiAnalyzed);
  }

  get showBestMatch() {
    // No mostrar mejor coincidencia en modo 'saved'
    if (this.viewMode === 'saved') return false;
    if (!this.bestMatchUniversity) return false;
    return this.matchesQuery(this.bestMatchUniversity);
  }

  switchViewMode(mode: 'explore' | 'saved') {
    this.viewMode = mode;
  }

  showMobileMap(): void {
    this.mobileView = 'map';
    // El contenedor del mapa estaba fuera de pantalla (transform): forzamos
    // que Google Maps recalcule su tamaño al volverse visible, y lo re-centramos.
    setTimeout(() => {
      if (this.googleMap?.googleMap) {
        google.maps.event.trigger(this.googleMap.googleMap, 'resize');
        this.googleMap.googleMap.setCenter(this.center);
      }
    }, 320);
  }

  showMobileList(): void {
    this.mobileView = 'list';
  }

  toggleFavoriteStatus(uni: any, event: Event) {
    event.stopPropagation();
    const key = this.normalizeName(uni.name);
    if (this.pendingFavorite.has(key)) return; // anti-spam: ya hay una petición en vuelo

    if (this.isSaved(uni)) {
      this.removeSavedByName(uni);
    } else {
      this.saveUniversity(uni);
    }
  }

  private removeSavedByName(uni: any): void {
    const key = this.normalizeName(uni.name);
    const savedId = this.savedIdByName.get(key);
    if (!savedId) return;

    this.pendingFavorite.add(key);
    this.userService.deleteSavedUniversity(savedId).subscribe({
      next: () => {
        this.pendingFavorite.delete(key);
        this.savedNames.delete(key);
        this.savedIdByName.delete(key);
        this.savedUniversities = this.savedUniversities.filter(
          (u) => u.id !== savedId,
        );
        this.toastService.showToast(
          'Universidad eliminada de favoritos',
          'info',
        );
      },
      error: () => {
        this.pendingFavorite.delete(key);
        this.toastService.showToast(
          'No se pudo eliminar la universidad',
          'error',
        );
      },
    });
  }

  // Métodos para el Modal de Universidad
  openUniversityDetail(uni: any) {
    this.selectedUniversity = uni;
    this.isUniversityModalClosing = false;
    this.isUniversityModalOpen = true;
    document.body.classList.add('explore-modal-open');
    if (uni && uni.position && this.googleMap) {
      this.googleMap.panTo(uni.position);
      this.center = uni.position;
      this.zoom = 14;
    }
  }

  closeUniversityModal() {
    this.isUniversityModalClosing = true;
    document.body.classList.remove('explore-modal-open');
    setTimeout(() => {
      this.isUniversityModalOpen = false;
      this.isUniversityModalClosing = false;
      this.selectedUniversity = null;
    }, 300); // 300ms coincide con la animación CSS
  }

  saveUniversity(uni?: any) {
    const targetUni = uni || this.selectedUniversity;
    if (!targetUni) return;

    const key = this.normalizeName(targetUni.name);
    if (this.pendingFavorite.has(key)) return; // anti-spam: ya hay una petición en vuelo
    this.pendingFavorite.add(key);

    const payload = {
      careerName: targetUni.career || targetUni.tags[0],
      universityName: targetUni.name,
      location: targetUni.location,
      relationshipExplanation:
        targetUni.description || 'Universidad destacada en tu área de interés.',
      keyDates: targetUni.keyDates || 'Consultar sitio web',
      studyPlan: targetUni.studyPlan || 'Varios módulos',
      officialWebsite: targetUni.websiteUrl || undefined,
      latitude: targetUni.position?.lat,
      longitude: targetUni.position?.lng,
      rating:
        typeof targetUni.rating === 'number' ? targetUni.rating : undefined,
    };

    this.userService.saveUniversity(payload).subscribe({
      next: () => {
        this.pendingFavorite.delete(key);
        this.toastService.showToast(`¡${targetUni.name} guardada!`, 'success');
        this.loadSavedUniversities(); // refresca con el id y las coordenadas ya persistidas
      },
      error: (err) => {
        this.pendingFavorite.delete(key);
        if (err.status === 409) {
          this.toastService.showToast('Ya está en tus favoritos', 'info');
          this.savedNames.add(key); // corrige el estado local por si se había desincronizado
        } else {
          this.toastService.showToast('Error al guardar', 'error');
        }
      },
    });
  }
}
