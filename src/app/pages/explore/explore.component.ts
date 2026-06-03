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

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideIconComponent, HeaderComponent, GoogleMapsModule],
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

  private router = inject(Router);

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
    if (navigator.geolocation) {
      this.isLocating = true;
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
            
            // Intentamos disparar la búsqueda de Places si ya tenemos el test cargado
            this.triggerPlacesSearch();
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.warn('Error obteniendo ubicación o permiso denegado:', error);
            this.isLocating = false;
          });
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    } else {
      console.warn('Geolocalización no soportada por el navegador.');
    }
  }

  loadRecommendations() {
    this.isLoading = true;
    this.testService.getLatestTest().subscribe({
      next: (latestTest: TestDetail | null) => {
        if (latestTest) {
          this.hasTakenTest = true;
          this.dominantTraitsStr = latestTest.dominantTraits || 'STEAM';
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

  triggerPlacesSearch() {
    // Solo procedemos si ya tomamos el test, y ya tenemos la ubicación
    if (!this.hasTakenTest || !this.userPosition) return;

    // Si el mapa aún no está listo en la vista, lo intentamos en un breve timeout
    if (!this.googleMap || !this.googleMap.googleMap) {
      setTimeout(() => this.triggerPlacesSearch(), 300);
      return;
    }

    // El keyword se basa en el resultado dominante (ej. Tecnología) + universidad
    const searchQuery = this.dominantTraitsStr + ' universidad';

    this.universityService.searchNearbyUniversities(this.googleMap.googleMap, this.userPosition, 30000, searchQuery).subscribe({
      next: (results) => {
        const defaultImages = [
          'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000'
        ];

        this.universities = results.map((place, index) => {
          const matchPct = Math.max(70, 95 - (index * 2));
          return {
            id: place.id,
            name: place.name,
            location: place.address || 'Ubicación no especificada',
            image: place.logoUrl || defaultImages[index % defaultImages.length],
            logo: index === 0 ? 'building' : 'graduation-cap', 
            tags: [this.dominantTraitsStr, 'Google Places'],
            rating: place.rating || 4.5,
            matchPercentage: matchPct,
            career: this.dominantTraitsStr,
            description: place.isOpen ? 'Abierto en este momento.' : 'Cerrado en este momento.',
            keyDates: 'Consultar sitio web',
            studyPlan: 'Programas de ' + this.dominantTraitsStr,
            position: place.location // ¡Para el mapa!
          };
        });

        this.processData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error buscando en Google Places", err);
        this.isLoading = false;
        this.processData();
      }
    });
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
    this.isUniversityModalOpen = true;
    if (uni && uni.position && this.googleMap) {
      this.googleMap.panTo(uni.position);
      this.center = uni.position;
      this.zoom = 14;
    }
  }

  closeUniversityModal() {
    this.isUniversityModalOpen = false;
    setTimeout(() => {
      this.selectedUniversity = null;
    }, 300);
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