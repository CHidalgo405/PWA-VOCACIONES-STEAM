import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ThemeService } from '../../core/services/theme.service';
import { VocationTestService, TestDetail } from '../../core/services/test.service';
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
} from '../../core/services/university.service';
import { ExploreCacheService, CityOption } from '../../core/services/explore-cache.service';
import { ScrollRevealDirective } from './scroll-reveal.directive';

/** Estilo de mapa oscuro (tonos navy consistentes con el tema oscuro de la app). */
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f2027' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b1120' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#273549' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0b1120' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#061422' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent, HeaderComponent, GoogleMapsModule, ScrollRevealDirective],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
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

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  isApiLoaded = false;
  isLocating = false;
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

  /**
   * Apaga isLoading respetando un mínimo de visibilidad del skeleton: con
   * caché o una API rápida, la carga puede resolverse en unos milisegundos,
   * demasiado rápido para que el shimmer llegue a percibirse.
   */
  private finishLoading(): void {
    const elapsed = Date.now() - this.loadStartedAt;
    const remaining = this.MIN_SKELETON_MS - elapsed;
    if (remaining > 0) {
      setTimeout(() => { this.isLoading = false; }, remaining);
    } else {
      this.isLoading = false;
    }
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

  /** Claves de la última búsqueda ejecutada (dedupe de llamadas repetidas). */
  private lastMatchKey = '';
  private lastPlacesKey = '';
  private recommendationsRequested = false;
  private searchDebounceId: any = null;
  readonly distanceOptions = [10, 25, 50, 100];
  maxDistanceKm = 50;
  costPreference: CostPreference = 'any';

  // ── Ubicación manual (ciudad) o automática (GPS/IP) ────────────────────────
  /** 'auto' = GPS/IP; 'city' = el usuario eligió una ciudad manualmente. */
  locationMode: 'auto' | 'city' = 'auto';
  selectedCityId: string | null = null;
  readonly cities: CityOption[] = this.exploreCache.cities;

  /** Marcador del test vigente: un test nuevo invalida el caché de matches. */
  private testMarker = '';

  /** Valor del <select> de ubicación en la barra de filtros. */
  get locationChoice(): string {
    return this.locationMode === 'city' && this.selectedCityId ? this.selectedCityId : 'auto';
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
  }

  ngOnInit() {
    if (this.themeService.isDark) {
      this.mapOptions = { ...this.mapOptions, styles: DARK_MAP_STYLE };
    }

    // Preferencia de ubicación persistida: ciudad manual = cero GPS y cero IP lookup.
    const pref = this.exploreCache.getLocationPreference();
    const prefCity = pref?.mode === 'city' && pref.cityId ? this.exploreCache.getCityById(pref.cityId) : null;
    if (prefCity) {
      this.locationMode = 'city';
      this.selectedCityId = prefCity.id;
      this.userPosition = { lat: prefCity.lat, lng: prefCity.lng };
      this.center = this.userPosition;
      this.zoom = 12;
    } else {
      // Arrancamos sobre la última ubicación conocida mientras llega el GPS.
      const last = this.exploreCache.getLastLocation();
      if (last) {
        this.center = last;
        this.zoom = 12;
      }
    }

    this.loaderService.loadMapScript()
      .then(() => {
        this.isApiLoaded = true;
        this.mapOptions = {
          ...this.mapOptions,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        };
        const svgMarker = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
        this.userMarkerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        };
        if (this.locationMode === 'city') {
          this.loadApiMatches();
          this.triggerPlacesSearch();
        } else {
          this.getUserLocation();
        }
      })
      .catch(err => {
        console.error('No se pudo cargar Google Maps en ExploreComponent:', err);
        // Sin el script de Maps (p. ej. offline) la lista aún puede servirse desde caché.
        this.loadApiMatches();
        this.triggerPlacesSearch();
      });

    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.loadRecommendations();
        this.loadSavedUniversities();
      }
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
            this.exploreCache.setLastLocation(userLocation);
            if (this.googleMap) {
              this.googleMap.panTo(userLocation);
            }
            this.isLocating = false;
            this.toastService.showToast(`Ubicación aproximada: ${data.city || data.region}`, 'info');
            this.loadApiMatches();
            this.triggerPlacesSearch();
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
              this.loadApiMatches();
              this.triggerPlacesSearch();
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
            this.exploreCache.setLastLocation(userLocation);

            if (this.googleMap) {
              this.googleMap.panTo(userLocation);
            }
            this.isLocating = false;
            this.loadApiMatches();
            this.triggerPlacesSearch();
          });
        },
        async (error) => {
          clearTimeout(safariTimeout);
          const success = await runIpFallback(`Error nativo: ${error.message}`);
          if (!success) {
            this.ngZone.run(() => {
              this.isLocating = false;
              this.toastService.showToast('No pudimos obtener tu ubicación. Puedes elegir una ciudad en los filtros.', 'info');
              this.loadApiMatches();
              this.triggerPlacesSearch(); // Fallback a la ubicación por defecto
            });
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      runIpFallback('Sin soporte nativo').then(success => {
        if (!success) {
          this.ngZone.run(() => {
            this.isLocating = false;
            this.loadApiMatches();
            this.triggerPlacesSearch();
          });
        }
      });
    }
  }

  loadSavedUniversities() {
    this.userService.getSavedUniversities().subscribe({
      next: (data) => {
        this.savedNames.clear();
        this.savedIdByName.clear();

        const mappedSaved = data.map(item => {
          const key = this.normalizeName(item.universityName);
          this.savedNames.add(key);
          this.savedIdByName.set(key, item.id);

          const hasCoords = typeof item.latitude === 'number' && typeof item.longitude === 'number';
          return {
            id: item.id,
            name: item.universityName,
            location: item.location,
            image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
            logo: 'graduation-cap',
            tags: [item.careerName, 'Guardada'],
            rating: item.rating ?? null,
            matchPercentage: null,
            career: item.careerName,
            description: item.relationshipExplanation || 'Universidad guardada.',
            keyDates: item.keyDates || 'Consultar sitio web',
            studyPlan: item.studyPlan || 'Varios módulos',
            websiteUrl: item.officialWebsite || null,
            position: hasCoords ? { lat: item.latitude, lng: item.longitude } : null,
            source: 'saved',
          };
        });

        this.savedUniversities = mappedSaved;
      },
      error: (err) => {
        console.error("Error cargando universidades guardadas", err);
      }
    });
  }

  loadRecommendations() {
    if (this.recommendationsRequested) return; // currentUser$ puede emitir varias veces
    this.recommendationsRequested = true;
    this.isLoading = true;
    this.loadStartedAt = Date.now();
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest) {
          this.hasTakenTest = true;
          const profile = (latestTest as any)?.profile;
          this.dominantTraitsStr = profile?.profileName || latestTest.dominantTraits || 'STEAM';
          // Un test nuevo cambia el marcador → invalida el caché de matches.
          this.testMarker = String(latestTest.testId || latestTest.completedAt || 'test');
          this.exploreCache.setTestMeta({
            hasTakenTest: true,
            dominantTraitsStr: this.dominantTraitsStr,
            testMarker: this.testMarker,
          });
          this.loadApiMatches();
          this.triggerPlacesSearch();
        } else {
          this.exploreCache.setTestMeta({ hasTakenTest: false, dominantTraitsStr: 'STEAM', testMarker: '' });
          this.processData();
          this.finishLoading();
        }
      },
      error: (err) => {
        console.error("Error cargando perfil del test", err);
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
      }
    });
  }

  // ── A8: matching real desde la API ─────────────────────────────────────────

  /**
   * Pide a la API el matching de universidades (A8): match duro por programa,
   * distancia y costo + explicación de la IA. Los cambios de filtro re-piden
   * al instante porque el backend responde desde su caché sin re-llamar a la IA.
   */
  loadApiMatches() {
    if (!this.hasTakenTest) return;
    const location = this.userPosition || this.center;

    // Dedupe: misma ubicación (±100m) y mismos filtros → ya está pedido.
    const key = `${location.lat.toFixed(3)},${location.lng.toFixed(3)}|${this.maxDistanceKm}|${this.costPreference}`;
    if (key === this.lastMatchKey) return;
    this.lastMatchKey = key;

    // Caché local: mismos filtros, misma zona y mismo test → cero red.
    const cached = this.exploreCache.getMatches(key, this.testMarker);
    if (cached && !cached.stale) {
      this.applyMatchResponse(cached.data);
      return;
    }

    this.isLoadingMatches = true;
    this.universityService.matchUniversities({
      userLocation: { lat: location.lat, lng: location.lng },
      filters: {
        maxDistanceKm: this.maxDistanceKm,
        costPreference: this.costPreference,
      },
    }).subscribe({
      next: (res) => {
        this.exploreCache.setMatches(key, this.testMarker, res);
        this.applyMatchResponse(res);
      },
      error: (err) => {
        console.error('Error en el matching de universidades (A8)', err);
        this.lastMatchKey = ''; // permitir reintento (p. ej. cambiando filtros)
        if (cached) {
          // Vencido pero utilizable: mejor que nada cuando no hay internet.
          this.applyMatchResponse(cached.data);
        } else {
          this.apiMatches = [];
          this.isLoadingMatches = false;
          this.processData();
        }
      },
    });
  }

  /** Aplica una respuesta de matching (de la red o del caché) a la vista. */
  private applyMatchResponse(res: UniversityMatchResponse): void {
    this.apiMatches = (res.matches || []).map((m, index) => this.mapApiMatch(m, index));
    this.aiProvider = res.aiProvider ?? null;
    this.isLoadingMatches = false;
    this.processData();
    this.fitMapToResults();
  }

  /** Convierte un UniversityMatchItem de la API al modelo de tarjeta de la vista. */
  private mapApiMatch(m: UniversityMatchItem, index: number): any {
    return {
      id: m.universityId,
      name: m.name,
      location: m.googleMapsData?.address || 'Dirección no disponible',
      image: this.DEFAULT_IMAGES[index % this.DEFAULT_IMAGES.length],
      logo: index === 0 ? 'building' : 'graduation-cap',
      tags: [m.matchedCareer, this.COST_TIER_LABELS[m.costTier] || m.costTier],
      rating: m.googleMapsData?.rating ?? null,
      matchPercentage: m.matchScore,
      career: m.matchedCareer,
      description: m.explanation,
      keyDates: 'Consultar sitio web',
      studyPlan: m.matchedCareer,
      websiteUrl: m.websiteUrl || null,
      distanceKm: m.distanceKm,
      costTier: m.costTier,
      costTierLabel: this.COST_TIER_LABELS[m.costTier] || m.costTier,
      position: m.location ? { lat: m.location.lat, lng: m.location.lng } : null,
      source: 'api',
    };
  }

  setDistanceFilter(km: number) {
    if (this.maxDistanceKm === km) return;
    this.maxDistanceKm = km;
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
    this.zoom = 12;
    if (this.googleMap?.googleMap) {
      this.googleMap.panTo(cityLocation);
    }
    this.loadApiMatches();
    this.triggerPlacesSearch();
  }

  // ── Google Places: contexto "cerca de ti" (sin porcentajes inventados) ─────

  triggerPlacesSearch(attempt = 0) {
    // Procedemos si ya tomamos el test
    if (!this.hasTakenTest) return;

    // Fallback: usar el default si no hay ubicación de usuario
    const locationToUse = this.userPosition || this.center;

    // El radio de búsqueda sigue al filtro de distancia (Places admite máx. 50 km)
    const radiusKm = Math.min(this.maxDistanceKm, 50);

    // Dedupe: misma ubicación (±100m) y mismo radio → esta búsqueda ya se hizo.
    const key = `${locationToUse.lat.toFixed(3)},${locationToUse.lng.toFixed(3)}|${radiusKm}`;
    if (key === this.lastPlacesKey) return;

    // Caché local primero: no requiere red ni que el mapa esté listo.
    const cached = this.exploreCache.getPlaces(key);
    if (cached && !cached.stale) {
      this.lastPlacesKey = key;
      this.applyPlacesResults(cached.data, locationToUse);
      return;
    }

    // Si el mapa aún no está listo en la vista, lo intentamos en un breve timeout
    // (con tope: p. ej. offline el script de Maps nunca carga).
    if (!this.googleMap || !this.googleMap.googleMap) {
      if (attempt < 20) {
        setTimeout(() => this.triggerPlacesSearch(attempt + 1), 300);
      } else if (cached) {
        this.lastPlacesKey = key;
        this.applyPlacesResults(cached.data, locationToUse);
      } else {
        this.finishLoading();
        this.processData();
      }
      return;
    }
    this.lastPlacesKey = key;

    this.universityService.searchNearbyUniversities(this.googleMap.googleMap, locationToUse, radiusKm * 1000, 'universidad').subscribe({
      next: (results) => {
        // El estado "abierta ahora" caduca en minutos: no lo persistimos.
        this.exploreCache.setPlaces(key, results.map(({ isOpen, ...rest }: any) => rest));
        this.applyPlacesResults(results, locationToUse);
      },
      error: (err) => {
        console.error("Error buscando en Google Places", err);
        this.lastPlacesKey = ''; // permitir reintento
        if (cached) {
          // Vencido pero utilizable: mejor que nada cuando no hay internet.
          this.applyPlacesResults(cached.data, locationToUse);
        } else {
          this.finishLoading();
          this.processData();
        }
      }
    });
  }

  /** Aplica resultados de Places (de la red o del caché) a la vista. */
  private applyPlacesResults(results: any[], locationToUse: { lat: number; lng: number }): void {
    this.nearbyUniversities = results.map((place: any, index: number) => ({
      id: place.id,
      name: place.name,
      location: place.address || 'Ubicación no especificada',
      image: place.logoUrl || this.DEFAULT_IMAGES[index % this.DEFAULT_IMAGES.length],
      logo: 'graduation-cap',
      tags: ['Cerca de ti'],
      rating: place.rating || null,
      matchPercentage: null, // sin match real: no lo inventamos
      career: null,
      description: place.isOpen === true ? 'Abierta en este momento.' : (place.isOpen === false ? 'Cerrada en este momento.' : 'Universidad cercana a tu ubicación.'),
      keyDates: 'Consultar sitio web',
      studyPlan: 'Consultar oferta educativa',
      websiteUrl: null,
      distanceKm: place.location ? this.distanceKmBetween(locationToUse, place.location) : null,
      position: place.location,
      source: 'places',
    }));

    this.processData();
    this.finishLoading();
    this.fitMapToResults();
  }

  /** Encuadra la cámara del mapa para mostrar usuario + resultados visibles (respeta la búsqueda activa). */
  private fitMapToResults() {
    if (!this.googleMap?.googleMap) return;
    const withPosition = this.mapMarkers;
    if (!withPosition.length && !this.userPosition) return;

    const bounds = new google.maps.LatLngBounds();
    // Si hay una búsqueda activa con resultados, no metemos al usuario en el
    // encuadre para que el zoom se concentre en lo que se buscó.
    if (this.userPosition && !this.searchQuery.trim()) bounds.extend(this.userPosition);
    withPosition.forEach(u => bounds.extend(u.position));
    this.googleMap.googleMap.fitBounds(bounds, { bottom: 60, left: 40, right: 40, top: 40 });
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
    const isSelected = this.selectedUniversity && this.selectedUniversity.id === uni.id;
    const isSearchMatch = !!this.searchQuery.trim() && this.matchesQuery(uni);

    if (isSelected) {
      // Marcador grande y color principal (cyan) para la seleccionada
      const selectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#07B1C9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      return {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(selectedSvg),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 44)
        },
        zIndex: 1000
      };
    }

    if (isSearchMatch) {
      // Resalta el resultado de búsqueda: pin ámbar más grande + animación de rebote
      const highlightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      return {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(highlightSvg),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40)
        },
        animation: google.maps.Animation.BOUNCE,
        zIndex: 900
      };
    }

    // Universidades con match real (A8) en cyan; cercanas (Places) en gris-rojo neutro
    const isApiMatch = uni.source === 'api';
    const color = isApiMatch ? '#07B1C9' : (uni.source === 'saved' ? '#EC4899' : '#94A3B8');
    const size = isApiMatch ? 30 : 24;
    const normalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    return {
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(normalSvg),
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size)
      },
      zIndex: isApiMatch ? 200 : 1
    };
  }

  processData() {
    // Combina matches reales (A8) con contexto de Places, sin duplicar por nombre.
    const apiNames = new Set(this.apiMatches.map(u => this.normalizeName(u.name)));
    const nearbyDeduped = this.nearbyUniversities.filter(u => !apiNames.has(this.normalizeName(u.name)));
    this.universities = [...this.apiMatches, ...nearbyDeduped];

    this.totalCoincidencias = this.apiMatches.length;
    this.bestMatchUniversity = this.apiMatches[0] || null;
    this.maxMatchPercentage = this.apiMatches[0]?.matchPercentage || 0;
    this.otherUniversities = this.apiMatches.slice(1);
  }

  private normalizeName(name: string): string {
    return (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  /** true si esta universidad ya está en favoritos (heart relleno). */
  isSaved(uni: any): boolean {
    return this.savedNames.has(this.normalizeName(uni?.name || ''));
  }

  /** Lista "cerca de ti" (Places) con los filtros de distancia y búsqueda aplicados. */
  get filteredNearbyUniversities(): any[] {
    if (this.viewMode === 'saved') return [];
    const apiNames = new Set(this.apiMatches.map(u => this.normalizeName(u.name)));
    const list = this.nearbyUniversities.filter(u =>
      !apiNames.has(this.normalizeName(u.name)) &&
      (u.distanceKm == null || u.distanceKm <= this.maxDistanceKm)
    );
    return list.filter(uni => this.matchesQuery(uni));
  }

  /** Distancia haversine en km (1 decimal) entre dos coordenadas. */
  private distanceKmBetween(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ): number {
    const R = 6371;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
  }

  /** Marcadores del mapa: universidades con coordenadas que superen el filtro de búsqueda activo. */
  get mapMarkers(): any[] {
    return this.currentUniversitiesList.filter(u => u.position && this.matchesQuery(u));
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
      this.toastService.showToast('Esta universidad no tiene sitio web registrado.', 'info');
    }
  }

  get currentUniversitiesList(): any[] {
    const list = this.viewMode === 'saved' ? this.savedUniversities : this.universities;
    return list.filter(uni => this.matchesQuery(uni));
  }

  // Getters computados para el filtrado en tiempo real
  get filteredOtherUniversities() {
    // Si estamos en modo 'saved', filtramos sobre las guardadas
    const sourceArray = this.viewMode === 'saved' ? this.savedUniversities : this.otherUniversities;
    return sourceArray.filter(uni => this.matchesQuery(uni));
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
        this.savedUniversities = this.savedUniversities.filter(u => u.id !== savedId);
        this.toastService.showToast('Universidad eliminada de favoritos', 'info');
      },
      error: () => {
        this.pendingFavorite.delete(key);
        this.toastService.showToast('No se pudo eliminar la universidad', 'error');
      }
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
      relationshipExplanation: targetUni.description || 'Universidad destacada en tu área de interés.',
      keyDates: targetUni.keyDates || 'Consultar sitio web',
      studyPlan: targetUni.studyPlan || 'Varios módulos',
      officialWebsite: targetUni.websiteUrl || undefined,
      latitude: targetUni.position?.lat,
      longitude: targetUni.position?.lng,
      rating: typeof targetUni.rating === 'number' ? targetUni.rating : undefined,
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
      }
    });
  }
}
