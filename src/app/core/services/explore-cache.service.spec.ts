import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ExploreCacheService } from './explore-cache.service';
import { NearbyDiscoveryResponse, UniversityMatchResponse } from './university.service';

describe('ExploreCacheService', () => {
  let service: ExploreCacheService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        ExploreCacheService,
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ id: 'student-1' }) },
        },
      ],
    });
    service = TestBed.inject(ExploreCacheService);
  });

  afterEach(() => localStorage.clear());

  it('guarda y recupera matches completos por usuario, zona y test', () => {
    const response: UniversityMatchResponse = {
      matches: [],
      generatedAt: '2026-07-18T12:00:00.000Z',
      aiProcessing: false,
    };

    service.setMatches('auto:18.89,-96.93|30|any', 'test-1', response);

    const hit = service.getMatches('auto:18.89,-96.93|30|any', 'test-1');
    expect(hit?.data).toEqual(response);
    expect(hit?.stale).toBeFalse();
    expect(hit?.savedAt).toBeGreaterThan(0);
    expect(service.getMatches('auto:18.89,-96.93|30|any', 'test-2')).toBeNull();
  });

  it('persiste el snapshot progresivo de universidades cercanas', () => {
    const snapshot: NearbyDiscoveryResponse = {
      universities: [],
      processing: true,
      coverageCount: 7,
      verifiedCount: 3,
      updatedAt: '2026-07-18T12:00:00.000Z',
    };

    service.setPlaces('auto:18.89,-96.93|30', snapshot);

    expect(service.getPlaces('auto:18.89,-96.93|30')?.data).toEqual(snapshot);
  });

  it('mantiene la preferencia de radio separada por ubicación', () => {
    service.setSearchRadiusPreference('city:cordoba', 10);
    service.setSearchRadiusPreference('city:orizaba', 50);

    expect(service.getSearchRadiusPreference('city:cordoba')?.radiusKm).toBe(10);
    expect(service.getSearchRadiusPreference('city:orizaba')?.radiusKm).toBe(50);
  });
});
