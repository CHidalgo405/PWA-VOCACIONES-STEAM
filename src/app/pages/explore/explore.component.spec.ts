import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { ExploreComponent } from './explore.component';
import { AuthService } from '../../core/services/auth.service';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import {
  NearbyDiscoveryResponse,
  UniversityMatchResponse,
  UniversityService,
} from '../../core/services/university.service';
import { ExploreCacheService } from '../../core/services/explore-cache.service';

describe('ExploreComponent', () => {
  let component: ExploreComponent;
  let fixture: ComponentFixture<ExploreComponent>;
  let universityService: jasmine.SpyObj<UniversityService>;
  let exploreCache: ExploreCacheService;

  const finalMatchResponse: UniversityMatchResponse = {
    matches: [],
    generatedAt: '2026-07-18T12:00:00.000Z',
    aiProvider: 'Groq',
    aiProcessing: false,
  };

  const prepareUniversityLoading = (): string => {
    component.hasTakenTest = true;
    component.userPosition = { lat: 19.4326, lng: -99.1332 };
    component.distanceSelectionConfirmed = true;
    (component as any).locationReady = true;
    (component as any).distanceLocationKey = 'auto:19.43,-99.13';
    (component as any).testMarker = 'test-1';
    return 'auto:19.43,-99.13|30|any';
  };

  beforeEach(async () => {
    localStorage.clear();
    const currentUser$ = new BehaviorSubject<null>(null);
    universityService = jasmine.createSpyObj<UniversityService>(
      'UniversityService',
      ['matchUniversities', 'discoverNearby', 'getNearbyUniversities'],
    );
    universityService.matchUniversities.and.returnValue(of(finalMatchResponse));
    await TestBed.configureTestingModule({
      imports: [ExploreComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser$,
            getCurrentUser: () => null,
          },
        },
        {
          provide: GoogleMapsLoaderService,
          // Mantiene la inicialización del mapa pendiente: esta prueba no debe
          // acceder a geolocalización ni a servicios externos.
          useValue: { loadMapScript: () => new Promise<void>(() => undefined) },
        },
        { provide: UniversityService, useValue: universityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreComponent);
    component = fixture.componentInstance;
    exploreCache = TestBed.inject(ExploreCacheService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('conserva las tarjetas visibles mientras actualiza en segundo plano', () => {
    component.apiMatches = [{ id: 'u1', name: 'Universidad Uno' }];
    component.isRefreshingMatches = true;

    expect(component.hasUniversityData).toBeTrue();
    expect(component.showInitialUniversitySkeleton).toBeFalse();
    expect(component.hasBackgroundWork).toBeTrue();
  });

  it('revalida automáticamente un ranking determinista al vencer su backoff corto', fakeAsync(() => {
    const key = prepareUniversityLoading();
    exploreCache.setMatches(key, 'test-1', {
      ...finalMatchResponse,
      aiProvider: 'deterministic',
    });

    component.loadApiMatches();

    expect(universityService.matchUniversities).not.toHaveBeenCalled();
    tick(3 * 60_000 - 1);
    expect(universityService.matchUniversities).not.toHaveBeenCalled();
    tick(2);
    flushMicrotasks();
    expect(universityService.matchUniversities).toHaveBeenCalledTimes(1);
  }));

  it('revalida automáticamente un ranking parcial después de un minuto', fakeAsync(() => {
    const key = prepareUniversityLoading();
    exploreCache.setMatches(key, 'test-1', {
      ...finalMatchResponse,
      aiProvider: 'Groq (parcial)',
      aiAnalyzedCount: 2,
      candidateCount: 8,
    });

    component.loadApiMatches();

    expect(universityService.matchUniversities).not.toHaveBeenCalled();
    tick(60_001);
    flushMicrotasks();
    expect(universityService.matchUniversities).toHaveBeenCalledTimes(1);
  }));

  it('recalcula A8 cuando el primer snapshot de Places es posterior al match local', () => {
    prepareUniversityLoading();
    (component as any).lastMatchKey = 'auto:19.43,-99.13|30|any';
    (component as any).lastMatchesSavedAt = 100;
    const loadMatches = spyOn(component, 'loadApiMatches');
    const snapshot: NearbyDiscoveryResponse = {
      universities: [
        {
          id: 'u1',
          name: 'Universidad Uno',
          distanceKm: 3,
          steamPrograms: [
            { name: 'Ingeniería de Software', area: 'technology' },
          ],
        },
      ],
      processing: false,
      coverageCount: 1,
      verifiedCount: 1,
      updatedAt: '2026-07-18T12:00:00.000Z',
    };

    (component as any).applyNearbySnapshot(
      snapshot,
      'auto:19.43,-99.13|30',
      true,
      200,
    );

    expect(loadMatches).toHaveBeenCalledOnceWith(true, true);
  });

  it('detecta el cambio de un snapshot vacío al primer lote de universidades', () => {
    prepareUniversityLoading();
    const loadMatches = spyOn(component, 'loadApiMatches');
    const emptySnapshot: NearbyDiscoveryResponse = {
      universities: [],
      processing: true,
      coverageCount: 0,
      verifiedCount: 0,
      updatedAt: '2026-07-18T12:00:00.000Z',
    };
    const populatedSnapshot: NearbyDiscoveryResponse = {
      ...emptySnapshot,
      universities: [{ id: 'u1', name: 'Universidad Uno', distanceKm: 3 }],
      coverageCount: 1,
      processing: false,
    };

    (component as any).applyNearbySnapshot(
      emptySnapshot,
      'auto:19.43,-99.13|30',
      false,
      100,
    );
    (component as any).applyNearbySnapshot(
      populatedSnapshot,
      'auto:19.43,-99.13|30',
      false,
      101,
    );

    expect(loadMatches).toHaveBeenCalledOnceWith(true, true);
  });

  it('muestra el caché incompleto y respeta retryAt incluso si la ronda dejó un aviso', fakeAsync(() => {
    prepareUniversityLoading();
    const retryAt = new Date(Date.now() + 30_000).toISOString();
    const incompleteSnapshot: NearbyDiscoveryResponse = {
      universities: [{ id: 'u1', name: 'Universidad Uno', distanceKm: 3 }],
      processing: false,
      complete: false,
      coverageCount: 1,
      verifiedCount: 0,
      updatedAt: new Date().toISOString(),
      retryAt,
      error: 'La última verificación no pudo completarse',
    };
    exploreCache.setPlaces('auto:19.43,-99.13|30', incompleteSnapshot);
    universityService.discoverNearby.and.returnValue(
      of({ ...incompleteSnapshot, complete: true }),
    );

    component.triggerPlacesSearch();

    expect(component.nearbyUniversities.length).toBe(1);
    expect(component.nearbyDiscoveryComplete).toBeFalse();
    expect(universityService.discoverNearby).not.toHaveBeenCalled();
    tick(29_999);
    expect(universityService.discoverNearby).not.toHaveBeenCalled();
    tick(300);
    flushMicrotasks();
    expect(universityService.discoverNearby).toHaveBeenCalledTimes(1);
  }));

  it('programa retryAt cuando una actualización completa conservó un aviso', fakeAsync(() => {
    prepareUniversityLoading();
    const snapshot: NearbyDiscoveryResponse = {
      universities: [{ id: 'u1', name: 'Universidad Uno', distanceKm: 3 }],
      processing: false,
      complete: true,
      coverageCount: 15,
      verifiedCount: 15,
      updatedAt: new Date().toISOString(),
      retryAt: new Date(Date.now() + 10_000).toISOString(),
      error: 'La actualización opcional no pudo completarse',
    };
    exploreCache.setPlaces('auto:19.43,-99.13|30', snapshot);
    universityService.discoverNearby.and.returnValue(
      of({ ...snapshot, retryAt: undefined, error: undefined }),
    );

    component.triggerPlacesSearch();

    expect(universityService.discoverNearby).not.toHaveBeenCalled();
    expect((component as any).nearbyRefreshTimer).not.toBeNull();
    tick(9_999);
    expect(universityService.discoverNearby).not.toHaveBeenCalled();
    tick(300);
    flushMicrotasks();
    expect(universityService.discoverNearby).toHaveBeenCalledTimes(1);
  }));

  it('coalesce un poll A8 y un cambio de catálogo mientras hay una petición activa', fakeAsync(() => {
    prepareUniversityLoading();
    const firstResponse = new Subject<UniversityMatchResponse>();
    universityService.matchUniversities.and.returnValues(
      firstResponse.asObservable(),
      of(finalMatchResponse),
    );

    component.loadApiMatches();
    component.loadApiMatches(true, true);

    expect(universityService.matchUniversities).toHaveBeenCalledTimes(1);
    firstResponse.next(finalMatchResponse);
    firstResponse.complete();
    flushMicrotasks();
    tick(400);
    expect(universityService.matchUniversities).toHaveBeenCalledTimes(2);
  }));

  it('reintenta una falla transitoria de A8 sin recargar la página', fakeAsync(() => {
    prepareUniversityLoading();
    universityService.matchUniversities.and.returnValues(
      throwError(() => new Error('red temporalmente no disponible')),
      of(finalMatchResponse),
    );

    component.loadApiMatches();

    expect(universityService.matchUniversities).toHaveBeenCalledTimes(1);
    tick(2_999);
    expect(universityService.matchUniversities).toHaveBeenCalledTimes(1);
    tick(2);
    flushMicrotasks();
    expect(universityService.matchUniversities).toHaveBeenCalledTimes(2);
    expect(component.matchLoadError).toBeNull();
  }));

  it('cancela los timers de polling al quedar sin conexión', fakeAsync(() => {
    const matchKey = prepareUniversityLoading();
    const nearbyKey = 'auto:19.43,-99.13|30';
    (component as any).lastMatchKey = matchKey;
    (component as any).lastDbNearbyKey = nearbyKey;
    (component as any).scheduleAiRefresh(matchKey);
    (component as any).scheduleNearbyRefresh(nearbyKey);

    expect((component as any).aiRefreshTimer).not.toBeNull();
    expect((component as any).nearbyRefreshTimer).not.toBeNull();
    (component as any).handleOffline();
    tick(6_000);

    expect((component as any).aiRefreshTimer).toBeNull();
    expect((component as any).nearbyRefreshTimer).toBeNull();
    expect(universityService.matchUniversities).not.toHaveBeenCalled();
    expect(universityService.discoverNearby).not.toHaveBeenCalled();
  }));

  it('sale del estado de ubicación aunque el fallback por IP no responda', fakeAsync(() => {
    component.hasTakenTest = false;
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(
      (_success, error) =>
        error?.({ message: 'Permiso denegado' } as GeolocationPositionError),
    );
    spyOn(window, 'fetch').and.callFake(
      (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Abortado', 'AbortError')),
          );
        }),
    );

    component.getUserLocation();
    expect(component.isLocating).toBeTrue();
    tick(8_001);
    flushMicrotasks();

    expect(component.isLocating).toBeFalse();
    expect((component as any).locationReady).toBeTrue();
    expect(component.locationLoadError).toBeTrue();
  }));
});
