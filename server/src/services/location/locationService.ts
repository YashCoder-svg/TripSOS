import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import type {
  GeocodingResult,
  LocationProvider,
  PlaceCategory,
  PlaceDetails,
  PlaceSearchParams,
  PlaceSearchResult,
} from './types.js';
import { OpenStreetMapProvider } from './providers/osmProvider.js';
import { GeoapifyProvider } from './providers/geoapifyProvider.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class LocationService {
  private provider: LocationProvider;
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs = 5 * 60 * 1000; // 5-minute memory cache

  constructor() {
    this.provider = this.createDefaultProvider();
  }

  private createDefaultProvider(): LocationProvider {
    if (env.LOCATION_PROVIDER === 'geoapify' && env.LOCATION_PROVIDER_API_KEY) {
      logger.info('Using Geoapify as primary location provider');
      return new GeoapifyProvider(env.LOCATION_PROVIDER_API_KEY);
    }
    logger.info('Using OpenStreetMap as primary location provider');
    return new OpenStreetMapProvider();
  }

  setProvider(provider: LocationProvider): void {
    this.provider = provider;
    this.cache.clear();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setInCache<T>(key: string, data: T): void {
    if (this.cache.size > 500) {
      // Purge expired entries when cache grows
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now > v.expiresAt) this.cache.delete(k);
      }
    }
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  async geocode(query: string, limit = 5): Promise<GeocodingResult[]> {
    const trimmed = query.trim().toLowerCase();
    const cacheKey = `geocode:${trimmed}:${limit}`;
    const cached = this.getFromCache<GeocodingResult[]>(cacheKey);
    if (cached) return cached;

    const started = Date.now();
    try {
      const results = await this.provider.geocode(query, limit);
      logger.info(
        {
          provider: this.provider.name,
          query,
          count: results.length,
          durationMs: Date.now() - started,
        },
        'Geocoding resolved',
      );
      this.setInCache(cacheKey, results);
      return results;
    } catch (err) {
      logger.error({ provider: this.provider.name, query, err }, 'Geocoding request failed');
      throw err;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `reverse:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
    const cached = this.getFromCache<GeocodingResult>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.provider.reverseGeocode(latitude, longitude);
      if (result) this.setInCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error(
        { provider: this.provider.name, latitude, longitude, err },
        'Reverse geocoding failed',
      );
      return null;
    }
  }

  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
    const cacheKey = `places:${params.latitude.toFixed(4)}:${params.longitude.toFixed(4)}:${params.category ?? 'all'}:${(params.query ?? '').toLowerCase()}:${params.radiusMeters ?? 5000}:${params.limit ?? 20}`;
    const cached = this.getFromCache<PlaceSearchResult>(cacheKey);
    if (cached) return cached;

    const started = Date.now();
    try {
      const result = await this.provider.searchPlaces(params);
      logger.info(
        {
          provider: this.provider.name,
          category: params.category,
          query: params.query,
          count: result.results.length,
          durationMs: Date.now() - started,
        },
        'Place search resolved',
      );
      this.setInCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error({ provider: this.provider.name, params, err }, 'Place search failed');
      throw err;
    }
  }

  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    radiusMeters = 5000,
    limit = 20,
  ): Promise<PlaceSearchResult> {
    return this.searchPlaces({
      latitude,
      longitude,
      category,
      radiusMeters,
      limit,
    });
  }

  async getPlaceDetails(providerId: string): Promise<PlaceDetails | null> {
    const cacheKey = `details:${providerId}`;
    const cached = this.getFromCache<PlaceDetails>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.provider.getPlaceDetails(providerId);
      if (result) this.setInCache(cacheKey, result);
      return result;
    } catch (err) {
      logger.error({ provider: this.provider.name, providerId, err }, 'Get place details failed');
      return null;
    }
  }
}

export const locationService = new LocationService();
