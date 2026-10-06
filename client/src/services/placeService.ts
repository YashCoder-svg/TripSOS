import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  GeocodingResult,
  PlaceCategory,
  PlaceDetails,
  PlaceSearchParams,
  PlaceSearchResult,
} from '../types/place';

export const placeKeys = {
  all: ['places'] as const,
  geocode: (query: string) => ['places', 'geocode', query] as const,
  search: (params: PlaceSearchParams) => ['places', 'search', params] as const,
  nearby: (lat: number, lon: number, category: PlaceCategory, radius?: number) =>
    ['places', 'nearby', lat.toFixed(4), lon.toFixed(4), category, radius] as const,
  details: (id: string) => ['places', 'details', id] as const,
};

export const placeService = {
  geocode: (query: string, limit = 5) => {
    const trimmed = query.trim();
    if (!trimmed) return Promise.resolve([]);
    return apiRequest<{ results: GeocodingResult[] }>(
      `/places/geocode?q=${encodeURIComponent(trimmed)}&limit=${limit}`,
    ).then((data) => data.results);
  },

  reverseGeocode: (latitude: number, longitude: number) => {
    return apiRequest<{ result: GeocodingResult }>(
      `/places/reverse?lat=${latitude}&lon=${longitude}`,
    ).then((data) => data.result);
  },

  search: (params: PlaceSearchParams) => {
    const searchParams = new URLSearchParams({
      lat: String(params.latitude),
      lon: String(params.longitude),
    });
    if (params.query?.trim()) searchParams.set('q', params.query.trim());
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params.radiusMeters) searchParams.set('radius', String(params.radiusMeters));
    if (params.limit) searchParams.set('limit', String(params.limit));

    return apiRequest<PlaceSearchResult>(`/places/search?${searchParams.toString()}`);
  },

  nearby: (
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    radiusMeters = 5000,
    limit = 20,
  ) => {
    const searchParams = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      category,
      radius: String(radiusMeters),
      limit: String(limit),
    });
    return apiRequest<PlaceSearchResult>(`/places/nearby?${searchParams.toString()}`);
  },

  getDetails: (providerId: string) => {
    return apiRequest<{ place: PlaceDetails }>(`/places/${encodeURIComponent(providerId)}`).then(
      (data) => data.place,
    );
  },
};

export function useGeocode(query: string, options?: { enabled?: boolean }) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: placeKeys.geocode(trimmed),
    queryFn: () => placeService.geocode(trimmed),
    enabled: Boolean(trimmed && (options?.enabled ?? true)),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaceSearch(params: PlaceSearchParams, options?: { enabled?: boolean }) {
  const hasCoords =
    typeof params.latitude === 'number' &&
    !isNaN(params.latitude) &&
    typeof params.longitude === 'number' &&
    !isNaN(params.longitude);

  return useQuery({
    queryKey: placeKeys.search(params),
    queryFn: () => placeService.search(params),
    enabled: hasCoords && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

export function useNearbyPlaces(
  latitude: number,
  longitude: number,
  category: PlaceCategory,
  options?: { enabled?: boolean; radiusMeters?: number; limit?: number },
) {
  const hasCoords =
    typeof latitude === 'number' &&
    !isNaN(latitude) &&
    typeof longitude === 'number' &&
    !isNaN(longitude);

  return useQuery({
    queryKey: placeKeys.nearby(latitude, longitude, category, options?.radiusMeters),
    queryFn: () =>
      placeService.nearby(latitude, longitude, category, options?.radiusMeters, options?.limit),
    enabled: hasCoords && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

export function usePlaceDetails(providerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: placeKeys.details(providerId),
    queryFn: () => placeService.getDetails(providerId),
    enabled: Boolean(providerId && (options?.enabled ?? true)),
    staleTime: 5 * 60 * 1000,
  });
}
