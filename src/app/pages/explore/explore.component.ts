import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormsModule } from '@angular/forms'; // Para el buscador
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
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
} from '../../core/services/university.service';
import { ScrollRevealDirective } from './scroll-reveal.directive';

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
  private ngZone = inject(NgZone);

  @ViewChild(GoogleMap) googleMap!: GoogleMap;

  isApiLoaded = false;
  isLocating = false;
  userPosition: google.maps.LatLngLiteral | null = null;
  userMarkerIcon: google.maps.Icon | null = null;
  
  center: google.maps.LatLngLiteral = { lat: 14.6349, lng: -90.5069 }; // Por defecto
  zoom = 6;

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  };

  constructor(private authService: AuthService) {}

  searchQuery: string = '';
  isLoading: boolean = true;
  skeletonArray = Array(4).fill(0); // Array ficticio para renderizar 4 skeletons

  // Variables para Modales
  isUniversityModalOpen: boolean = false;
  isUniversityModalClosing: boolean = false;
  selectedUniversity: any = null;
  
  // Estado de vista
  viewMode: 'explore' | 'saved' = 'explore';
  savedUniversities: any[] = [];
  
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
  readonly distanceOptions = [10, 25, 50, 100];
  maxDistanceKm = 50;
  costPreference: CostPreference = 'any';

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

  private router = inject(Router);

  ngOnDestroy(): void {
    document.body.classList.remove('explore-modal-open');
  }

  ngOnInit() {
    this.loaderService.loadMapScript()
      .then(() => {
        this.isApiLoaded = true;
        const svgMarker = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>';
        this.userMarkerIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarker),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        };
        this.getUserLocation();
      })
      .catch(err => {
        console.error('No se pudo cargar Google Maps en ExploreComponent:', err);
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
              this.loadApiMatches();
              this.triggerPlacesSearch(); // Fallback a Guatemala
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
        const mappedSaved = data.map(item => ({
          id: item.id,
          name: item.universityName,
          location: item.location,
          image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
          logo: 'graduation-cap',
          tags: [item.careerName, 'Selección IA'],
          rating: 4.8,
          matchPercentage: 90,
          career: item.careerName,
          description: item.relationshipExplanation || 'Universidad guardada.',
          keyDates: item.keyDates || 'Consultar sitio web',
          studyPlan: item.studyPlan || 'Varios módulos',
          position: { lat: 14.6349, lng: -90.5069 } // No tenemos el geocoder, pondremos dummy para que no rompa el mapa
        }));

        this.savedUniversities = mappedSaved;
      },
      error: (err) => {
        console.error("Error cargando universidades guardadas", err);
      }
    });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest) {
          this.hasTakenTest = true;
          const profile = (latestTest as any)?.profile;
          this.dominantTraitsStr = profile?.profileName || latestTest.dominantTraits || 'STEAM';
          this.loadApiMatches();
          this.triggerPlacesSearch();
        } else {
          this.processData();
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error("Error cargando perfil del test", err);
        this.processData();
        this.isLoading = false;
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

    this.isLoadingMatches = true;
    this.universityService.matchUniversities({
      userLocation: { lat: location.lat, lng: location.lng },
      filters: {
        maxDistanceKm: this.maxDistanceKm,
        costPreference: this.costPreference,
      },
    }).subscribe({
      next: (res) => {
        this.apiMatches = (res.matches || []).map((m, index) => this.mapApiMatch(m, index));
        this.isLoadingMatches = false;
        this.processData();
        this.fitMapToResults();
      },
      error: (err) => {
        console.error('Error en el matching de universidades (A8)', err);
        this.apiMatches = [];
        this.isLoadingMatches = false;
        this.processData();
      },
    });
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
  }

  setCostFilter(pref: CostPreference) {
    if (this.costPreference === pref) return;
    this.costPreference = pref;
    this.loadApiMatches();
  }

  // ── Google Places: contexto "cerca de ti" (sin porcentajes inventados) ─────

  triggerPlacesSearch() {
    // Procedemos si ya tomamos el test
    if (!this.hasTakenTest) return;

    // Fallback: usar el default si no hay ubicación de usuario
    const locationToUse = this.userPosition || this.center;

    // Si el mapa aún no está listo en la vista, lo intentamos en un breve timeout
    if (!this.googleMap || !this.googleMap.googleMap) {
      setTimeout(() => this.triggerPlacesSearch(), 300);
      return;
    }

    this.universityService.searchNearbyUniversities(this.googleMap.googleMap, locationToUse, 30000, 'universidad').subscribe({
      next: (results) => {
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
          position: place.location,
          source: 'places',
        }));

        this.processData();
        this.isLoading = false;
        this.fitMapToResults();
      },
      error: (err) => {
        console.error("Error buscando en Google Places", err);
        this.isLoading = false;
        this.processData();
      }
    });
  }

  /** Encuadra la cámara del mapa para mostrar usuario + resultados. */
  private fitMapToResults() {
    if (!this.googleMap?.googleMap) return;
    const withPosition = this.universities.filter(u => u.position);
    if (!withPosition.length && !this.userPosition) return;

    const bounds = new google.maps.LatLngBounds();
    if (this.userPosition) bounds.extend(this.userPosition);
    withPosition.forEach(u => bounds.extend(u.position));
    this.googleMap.googleMap.fitBounds(bounds, { bottom: 40, left: 40, right: 40, top: 40 });
  }

  getMarkerOptions(uni: any): google.maps.MarkerOptions {
    const isSelected = this.selectedUniversity && this.selectedUniversity.id === uni.id;
    
    if (isSelected) {
      // Marcador grande y color principal (cyan) para la seleccionada
      const selectedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#07B1C9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
      return {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(selectedSvg),
          scaledSize: new google.maps.Size(42, 42),
          anchor: new google.maps.Point(21, 42)
        },
        zIndex: 1000
      };
    }
    
    // Marcador normal (rojo clásico)
    const normalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    return {
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(normalSvg),
        scaledSize: new google.maps.Size(28, 28),
        anchor: new google.maps.Point(14, 28)
      },
      zIndex: 1
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

  /** Lista "cerca de ti" (Places) con el filtro de búsqueda aplicado. */
  get filteredNearbyUniversities(): any[] {
    if (this.viewMode === 'saved') return [];
    const apiNames = new Set(this.apiMatches.map(u => this.normalizeName(u.name)));
    const list = this.nearbyUniversities.filter(u => !apiNames.has(this.normalizeName(u.name)));
    if (!this.searchQuery) return list;
    const query = this.searchQuery.toLowerCase();
    return list.filter(uni =>
      uni.name.toLowerCase().includes(query) ||
      uni.location.toLowerCase().includes(query)
    );
  }

  /** Marcadores del mapa: solo universidades con coordenadas. */
  get mapMarkers(): any[] {
    return this.currentUniversitiesList.filter(u => u.position);
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
    if (!this.searchQuery) return list;
    const query = this.searchQuery.toLowerCase();
    return list.filter(uni => 
      uni.name.toLowerCase().includes(query) || 
      uni.location.toLowerCase().includes(query) ||
      (uni.career && uni.career.toLowerCase().includes(query))
    );
  }

  // Getters computados para el filtrado en tiempo real
  get filteredOtherUniversities() {
    // Si estamos en modo 'saved', filtramos sobre las guardadas
    const sourceArray = this.viewMode === 'saved' ? this.savedUniversities : this.otherUniversities;

    if (!this.searchQuery) return sourceArray;
    const query = this.searchQuery.toLowerCase();
    return sourceArray.filter(uni => 
      uni.name.toLowerCase().includes(query) || 
      uni.location.toLowerCase().includes(query) ||
      (uni.career && uni.career.toLowerCase().includes(query))
    );
  }

  get showBestMatch() {
    // No mostrar mejor coincidencia en modo 'saved'
    if (this.viewMode === 'saved') return false;

    // Solo mostrar el mejor match si no hay búsqueda activa o si la búsqueda coincide con el mejor match
    if (!this.searchQuery) return true;
    if (!this.bestMatchUniversity) return false;
    
    const query = this.searchQuery.toLowerCase();
    return this.bestMatchUniversity.name.toLowerCase().includes(query) || 
           this.bestMatchUniversity.location.toLowerCase().includes(query) ||
           (this.bestMatchUniversity.career && this.bestMatchUniversity.career.toLowerCase().includes(query));
  }

  switchViewMode(mode: 'explore' | 'saved') {
    this.viewMode = mode;
  }

  toggleFavoriteStatus(uni: any, event: Event) {
    event.stopPropagation(); // Evitar que se abra el modal

    if (this.viewMode === 'saved') {
      // Estamos en la vista de guardados, la acción es eliminar
      this.userService.deleteSavedUniversity(uni.id).subscribe({
        next: () => {
          this.savedUniversities = this.savedUniversities.filter(u => u.id !== uni.id);
          this.toastService.showToast('Universidad eliminada de favoritos', 'info');
        },
        error: () => {
          this.toastService.showToast('No se pudo eliminar la universidad', 'error');
        }
      });
    } else {
      // Estamos en la vista de explorar, la acción es guardar
      this.saveUniversity(uni);
    }
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

    const payload = {
      careerName: targetUni.career || targetUni.tags[0],
      universityName: targetUni.name,
      location: targetUni.location,
      relationshipExplanation: targetUni.description || 'Universidad destacada en tu área de interés.',
      keyDates: targetUni.keyDates || 'Consultar sitio web',
      studyPlan: targetUni.studyPlan || 'Varios módulos'
    };

    this.userService.saveUniversity(payload).subscribe({
      next: () => {
        this.toastService.showToast(`¡${targetUni.name} guardada!`, 'success');
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastService.showToast('Ya está en tus favoritos', 'info');
        } else {
          this.toastService.showToast('Error al guardar', 'error');
        }
      }
    });
  }
}