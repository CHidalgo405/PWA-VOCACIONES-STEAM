import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
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
import { UniversityService } from '../../core/services/university.service';
import { ScrollRevealDirective } from './scroll-reveal.directive';
import { LocalUniversityRecommendationService } from '../../core/services/local-university-recommendation.service';
import type {
  LocalUniversityMatchResult,
  LocalVocationalTestResult,
  SteamAreaId
} from '../../core/models/vocational-steam.models';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent, HeaderComponent, GoogleMapsModule, ScrollRevealDirective],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  
  hasTakenTest = false;
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private testService = inject(VocationTestService);
  private loaderService = inject(GoogleMapsLoaderService);
  private universityService = inject(UniversityService);
  private localUniversityRecommendationService = inject(LocalUniversityRecommendationService);
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
  searchError: string = '';
  mapLoadError: string = '';
  locationError: string = '';
  profileLoadWarning: string = '';
  savedUniversitiesWarning: string = '';
  hasAttemptedUniversitySearch = false;
  locationHint = 'Usaremos tu ubicación para buscar universidades cercanas. Si no das permiso, puedes seguir explorando con búsqueda manual.';
  radiusOptionsKm = [10, 30, 50, 100];
  selectedRadiusKm = 30;
  minMatchFilter = 0;
  careerFilter = '';
  areaFilter: 'todas' | SteamAreaId = 'todas';
  comparisonList: any[] = [];
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
  localVocationalResult: LocalVocationalTestResult | null = null;

  private router = inject(Router);

  ngOnInit() {
    this.loadMap();

    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.loadRecommendations();
        this.loadSavedUniversities();
      }
    });
  }

  loadMap() {
    this.mapLoadError = '';
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
        this.isApiLoaded = false;
        this.mapLoadError = 'No pudimos cargar el mapa. Tus recomendaciones pueden seguir visibles como lista, pero el mapa necesita conexión con Google Maps.';
        this.isLoading = false;
      });
  }

  getUserLocation() {
    if (navigator.geolocation) {
      this.isLocating = true;
      this.locationError = '';
      this.locationHint = 'Buscando tu ubicación para ordenar universidades cercanas. Puedes cambiar el radio después.';
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
            this.locationError = '';
            this.locationHint = `Usando tu ubicación aproximada para buscar universidades en un radio de ${this.selectedRadiusKm} km.`;
            
            // Intentamos disparar la búsqueda de Places si ya tenemos el test cargado
            this.triggerPlacesSearch();
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.warn('Error obteniendo ubicación o permiso denegado:', error);
            this.locationHint = 'No pudimos usar tu ubicación. Puedes permitir acceso al navegador o buscar universidades manualmente.';
            this.locationError = 'No tenemos permiso para usar tu ubicación o el navegador no pudo obtenerla. Activa permisos y pulsa Reintentar ubicación.';
            this.isLocating = false;
            this.isLoading = false;
          });
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    } else {
      console.warn('Geolocalización no soportada por el navegador.');
      this.locationError = 'Tu navegador no permite geolocalización. Puedes seguir explorando, pero no podremos ordenar por distancia exacta.';
      this.isLoading = false;
    }
  }

  retryMapLoad() {
    this.loadMap();
  }

  retryLocation() {
    this.getUserLocation();
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
          matchVocational: 0,
          matchAcademic: 0,
          matchGeographic: 0,
          career: item.careerName,
          compatibleCareers: item.careerName ? [item.careerName] : [],
          compatibleAreas: [],
          dataSourceLabel: 'api',
          warnings: ['Universidad guardada desde la API. Valida oferta académica y sitio oficial antes de decidir.'],
          description: item.relationshipExplanation || 'Universidad guardada.',
          keyDates: item.keyDates || 'Consultar sitio web',
          studyPlan: item.studyPlan || 'Varios módulos',
          websiteUrl: '#',
          position: { lat: 14.6349, lng: -90.5069 } // No tenemos el geocoder, pondremos dummy para que no rompa el mapa
        }));

        this.savedUniversities = mappedSaved;
      },
      error: (err) => {
        console.error("Error cargando universidades guardadas", err);
        this.savedUniversitiesWarning = 'No pudimos cargar tus universidades guardadas. Tus recomendaciones cercanas siguen disponibles.';
      }
    });
  }

  loadRecommendations() {
    this.isLoading = true;
    this.profileLoadWarning = '';
    this.searchError = '';
    this.localVocationalResult = this.getLocalVocationalResult();
    if (this.localVocationalResult) {
      this.hasTakenTest = true;
      this.dominantTraitsStr = this.localVocationalResult.strengthProfile.primaryCombination;
    }
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest || this.localVocationalResult) {
          this.hasTakenTest = true;
          this.dominantTraitsStr = this.localVocationalResult?.strengthProfile.primaryCombination
            || latestTest?.dominantTraits
            || 'STEAM';
          this.triggerPlacesSearch();
        } else {
          this.processData();
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error("Error cargando perfil del test", err);
        this.profileLoadWarning = this.localVocationalResult
          ? 'No pudimos consultar tu último test en la API. Usaremos el resultado local guardado en este dispositivo.'
          : 'No pudimos consultar tu último test en la API. Si ya completaste uno, intenta de nuevo más tarde.';
        if (this.localVocationalResult) {
          this.hasTakenTest = true;
          this.triggerPlacesSearch();
          if (!this.userPosition) {
            this.isLoading = false;
          }
        } else {
          this.processData();
          this.isLoading = false;
        }
      }
    });
  }

  triggerPlacesSearch() {
    // Solo procedemos si ya tomamos el test, y ya tenemos la ubicación
    if (!this.hasTakenTest) {
      this.isLoading = false;
      return;
    }

    if (!this.userPosition) {
      if (!this.isLocating) {
        this.locationError = 'Necesitamos ubicación para buscar universidades cercanas. Puedes reintentar el permiso o ampliar tu búsqueda desde el mapa cuando esté disponible.';
      }
      this.isLoading = false;
      return;
    }

    if (!this.isApiLoaded) {
      if (this.mapLoadError) {
        this.mapLoadError = 'El mapa aún no está disponible. Reintenta cargar Google Maps para buscar universidades cercanas.';
      }
      this.isLoading = false;
      return;
    }

    // Si el mapa aún no está listo en la vista, lo intentamos en un breve timeout
    if (!this.googleMap || !this.googleMap.googleMap) {
      setTimeout(() => this.triggerPlacesSearch(), 300);
      return;
    }

    // Usamos simplemente 'universidad' para asegurar resultados.
    // Combinarlo con 'Tecnología' o 'STEAM' hace que Google Places no devuelva resultados.
    const searchQuery = 'universidad';

    this.isLoading = true;
    this.searchError = '';
    this.hasAttemptedUniversitySearch = true;
    this.universityService.searchNearbyUniversities(this.googleMap.googleMap, this.userPosition, this.selectedRadiusKm * 1000, searchQuery).subscribe({
      next: (results) => {
        const defaultImages = [
          'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000'
        ];

        const matches = this.userPosition && this.localVocationalResult
          ? this.localUniversityRecommendationService.buildMatches(results, this.userPosition, this.localVocationalResult, this.selectedRadiusKm)
          : [];

        this.universities = matches.length
          ? matches.map((match, index) => this.toUniversityViewModel(match, defaultImages[index % defaultImages.length], index))
          : results.map((place: any, index: number) => ({
              id: place.id,
              name: place.name,
              location: place.address || 'Ubicación no especificada',
              image: place.logoUrl || defaultImages[index % defaultImages.length],
              logo: index === 0 ? 'building' : 'graduation-cap',
              tags: [this.dominantTraitsStr, 'Google Places', 'Datos insuficientes'],
              rating: place.rating || 4.5,
              matchPercentage: Math.max(35, 65 - (index * 2)),
              matchVocational: 0,
              matchAcademic: 0,
              matchGeographic: 0,
              career: this.dominantTraitsStr,
              compatibleCareers: [],
              compatibleAreas: [],
              dataSourceLabel: 'api',
              warnings: ['Datos insuficientes: Google Places no incluyó carreras o planes de estudio.'],
              description: 'Encontrada cerca de tu ubicación. Falta validar oferta académica.',
              keyDates: 'Consultar sitio web',
              studyPlan: 'Datos insuficientes',
              websiteUrl: place.contactUrl || '#',
              position: place.location
            }));

        this.processData();
        this.isLoading = false;
        this.searchError = '';

        // Animar la cámara para encuadrar todas las universidades y al usuario (FitBounds)
        if (this.googleMap && this.googleMap.googleMap && this.universities.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          if (this.userPosition) {
            bounds.extend(this.userPosition);
          }
          this.universities.forEach(u => {
            if (u.position) {
              bounds.extend(u.position);
            }
          });
          // Ajustamos la cámara suavemente
          this.googleMap.googleMap.fitBounds(bounds, {
            bottom: 40,
            left: 40,
            right: 40,
            top: 40
          });
        }
      },
      error: (err) => {
        console.error("Error buscando en Google Places", err);
        this.searchError = 'No pudimos cargar universidades cercanas. Intenta cambiar el radio o buscar de nuevo.';
        this.isLoading = false;
        this.hasAttemptedUniversitySearch = true;
        this.processData();
      }
    });
  }

  expandRadiusAndRetry(radiusKm: number) {
    this.selectedRadiusKm = radiusKm;
    this.triggerPlacesSearch();
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
    this.totalCoincidencias = this.universities.length;
    
    if (this.universities.length > 0) {
      this.bestMatchUniversity = this.universities[0];
      this.maxMatchPercentage = Math.max(...this.universities.map(u => u.matchPercentage));
      this.otherUniversities = this.universities.slice(1);
    } else {
      this.bestMatchUniversity = null;
      this.maxMatchPercentage = 0;
      this.otherUniversities = [];
    }
  }

  get currentUniversitiesList(): any[] {
    const list = this.applyStructuredFilters(this.viewMode === 'saved' ? this.savedUniversities : this.universities);
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
    const sourceArray = this.applyStructuredFilters(this.viewMode === 'saved' ? this.savedUniversities : this.otherUniversities);

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

  onRadiusChange(radiusKm: number) {
    this.selectedRadiusKm = radiusKm;
    this.triggerPlacesSearch();
  }

  toggleCompare(uni: any, event: Event) {
    event.stopPropagation();
    const exists = this.comparisonList.some(item => item.id === uni.id);
    if (exists) {
      this.comparisonList = this.comparisonList.filter(item => item.id !== uni.id);
      return;
    }
    if (this.comparisonList.length >= 3) {
      this.toastService.showToast('Puedes comparar hasta 3 universidades.', 'info');
      return;
    }
    this.comparisonList = [...this.comparisonList, uni];
  }

  isInComparison(uni: any): boolean {
    return this.comparisonList.some(item => item.id === uni.id);
  }

  toggleFavoriteStatus(uni: any, event: Event) {
    event.stopPropagation(); // Evitar que se abra el modal

    if (this.viewMode === 'saved') {
      // Estamos en la vista de guardados, la acción es eliminar
      this.userService.deleteSavedUniversity(uni.id).subscribe({
        next: () => {
          this.savedUniversities = this.savedUniversities.filter(u => u.id !== uni.id);
          this.comparisonList = this.comparisonList.filter(item => item.id !== uni.id);
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
    if (uni && uni.position && this.googleMap) {
      this.googleMap.panTo(uni.position);
      this.center = uni.position;
      this.zoom = 14;
    }
  }

  closeUniversityModal() {
    this.isUniversityModalClosing = true;
    setTimeout(() => {
      this.isUniversityModalOpen = false;
      this.isUniversityModalClosing = false;
      this.selectedUniversity = null;
    }, 300); // 300ms coincide con la animación CSS
  }

  hasSelectedUniversityWebsite(): boolean {
    const url = this.selectedUniversity?.websiteUrl;
    return !!url && url !== '#';
  }

  openSelectedUniversityWebsite(event?: Event) {
    event?.stopPropagation();
    if (!this.hasSelectedUniversityWebsite()) {
      this.toastService.showToast(
        'No tenemos un sitio web validado para esta universidad. Revisa sus fuentes oficiales antes de tomar una decisión.',
        'info',
        'Dato por validar'
      );
      return;
    }

    window.open(this.selectedUniversity.websiteUrl, '_blank', 'noopener,noreferrer');
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

  private toUniversityViewModel(match: LocalUniversityMatchResult, image: string, index: number) {
    const university = match.university;
    return {
      id: university.id,
      name: university.name,
      location: university.address || university.city || 'Ubicación no especificada',
      image: university.logoUrl || image,
      logo: index === 0 ? 'building' : 'graduation-cap',
      tags: [
        `${match.distanceKm} km`,
        match.dataSource,
        ...(match.compatibleAreas.length ? match.compatibleAreas.map(area => this.getAreaLabel(area)) : ['Datos insuficientes'])
      ],
      rating: university.rating || 4.5,
      matchPercentage: match.matchTotal,
      matchVocational: match.matchVocational,
      matchAcademic: match.matchAcademic,
      matchGeographic: match.matchGeographic,
      compatibleCareers: match.compatibleCareers,
      compatibleAreas: match.compatibleAreas,
      dataSourceLabel: match.dataSource,
      warnings: match.warnings,
      career: match.compatibleCareers[0] || this.dominantTraitsStr,
      description: match.reasons.join(' '),
      keyDates: 'Consultar sitio web oficial',
      studyPlan: university.programs.length ? university.programs.join(', ') : 'Datos insuficientes',
      websiteUrl: university.websiteUrl || '#',
      position: university.location
    };
  }

  private applyStructuredFilters(list: any[]): any[] {
    return list.filter(uni => {
      const careerMatches = !this.careerFilter
        || (uni.compatibleCareers || []).some((career: string) => career.toLowerCase().includes(this.careerFilter.toLowerCase()))
        || (uni.career || '').toLowerCase().includes(this.careerFilter.toLowerCase());
      const areaMatches = this.areaFilter === 'todas'
        || (uni.compatibleAreas || []).includes(this.areaFilter);
      const matchMatches = (uni.matchPercentage || 0) >= this.minMatchFilter;
      return careerMatches && areaMatches && matchMatches;
    });
  }

  private getLocalVocationalResult(): LocalVocationalTestResult | null {
    const userId = this.authService.getCurrentUser()?.id || 'guest';
    const rawValue = localStorage.getItem(`test_local_result_${userId}`);
    if (!rawValue) return null;
    try {
      return JSON.parse(rawValue) as LocalVocationalTestResult;
    } catch {
      return null;
    }
  }

  private getAreaLabel(area: SteamAreaId): string {
    const labels: Record<SteamAreaId, string> = {
      ciencia: 'Ciencia',
      tecnologia: 'Tecnología',
      ingenieria: 'Ingeniería',
      arte: 'Arte',
      matematicas: 'Matemáticas'
    };
    return labels[area];
  }
}
