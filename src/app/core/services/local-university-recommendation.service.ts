import { Injectable } from '@angular/core';
import { MOCK_NEARBY_STEAM_UNIVERSITIES } from '../data/vocational-steam.mock';
import { matchNearbyUniversities } from '../algorithms/university-match.algorithm';
import type { University } from '../models/university.model';
import type {
  LocalUniversityMatchResult,
  LocalVocationalTestResult,
  NearbySteamUniversity
} from '../models/vocational-steam.models';

@Injectable({
  providedIn: 'root'
})
export class LocalUniversityRecommendationService {
  buildMatches(
    universities: University[],
    userPosition: google.maps.LatLngLiteral,
    localResult: LocalVocationalTestResult | null,
    radiusKm: number
  ): LocalUniversityMatchResult[] {
    if (!localResult) return [];
    const nearbyUniversities = universities.map((university) =>
      this.toNearbyUniversity(university, userPosition)
    );

    return matchNearbyUniversities({
      universities: nearbyUniversities,
      profile: localResult.strengthProfile,
      careerRecommendations: localResult.careerRecommendations.recommendations,
      radiusKm
    });
  }

  private toNearbyUniversity(
    university: University,
    userPosition: google.maps.LatLngLiteral
  ): NearbySteamUniversity {
    const mockMatch = this.findMockUniversity(university.name);
    const distanceKm = this.calculateDistanceKm(userPosition, university.location);

    // Enriquecimiento temporal local/mock: solo agrega oferta cuando hay una coincidencia conocida.
    // No modifica endpoints ni presenta estos programas como datos definitivos.
    return {
      id: university.id || normalize(university.name),
      name: university.name,
      location: university.location,
      address: university.address,
      city: mockMatch?.city || university.address || 'Ciudad no especificada',
      state: mockMatch?.state,
      country: mockMatch?.country || 'México',
      programs: university.programs?.length ? university.programs : (mockMatch?.programs || []),
      websiteUrl: university.contactUrl || mockMatch?.websiteUrl,
      rating: university.rating,
      userRatingsTotal: university.userRatingsTotal,
      logoUrl: university.logoUrl,
      isOpen: university.isOpen,
      dataSource: university.programs?.length ? 'api' : (mockMatch ? 'mock' : 'api'),
      distanceKm
    };
  }

  private findMockUniversity(name: string): NearbySteamUniversity | undefined {
    const normalizedName = normalize(name);
    return MOCK_NEARBY_STEAM_UNIVERSITIES.find((university) => {
      const normalizedMock = normalize(university.name);
      return normalizedName.includes(normalizedMock) || normalizedMock.includes(normalizedName);
    });
  }

  private calculateDistanceKm(
    from: google.maps.LatLngLiteral,
    to: google.maps.LatLngLiteral
  ): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);
    const lat1 = toRadians(from.lat);
    const lat2 = toRadians(to.lat);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toRadians(value: number): number {
  return value * Math.PI / 180;
}
