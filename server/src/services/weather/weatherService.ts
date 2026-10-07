import { logger } from '../../config/logger.js';
import type { WeatherData, WeatherProvider } from './types.js';
import { OpenMeteoProvider } from './providers/openMeteoProvider.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class WeatherService {
  private provider: WeatherProvider;
  private cache = new Map<string, CacheEntry<WeatherData>>();
  private readonly ttlMs = 15 * 60 * 1000; // 15-minute weather cache

  constructor(provider?: WeatherProvider) {
    this.provider = provider ?? new OpenMeteoProvider();
  }

  setProvider(provider: WeatherProvider): void {
    this.provider = provider;
    this.cache.clear();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  private getFromCache(key: string): WeatherData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setInCache(key: string, data: WeatherData): void {
    if (this.cache.size > 200) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now > v.expiresAt) this.cache.delete(k);
      }
    }
    this.cache.set(key, { data, expiresAt: Date.now() + this.ttlMs });
  }

  async getWeather(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
  ): Promise<WeatherData> {
    const cacheKey = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${startDate ?? ''}:${endDate ?? ''}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const started = Date.now();
    try {
      const data = await this.provider.getWeather(latitude, longitude, startDate, endDate);
      logger.info(
        {
          provider: this.provider.name,
          latitude,
          longitude,
          startDate,
          endDate,
          durationMs: Date.now() - started,
        },
        'Weather retrieved successfully',
      );
      this.setInCache(cacheKey, data);
      return data;
    } catch (err) {
      logger.error(
        { provider: this.provider.name, latitude, longitude, err },
        'Failed to fetch weather data',
      );
      throw err;
    }
  }
}

export const weatherService = new WeatherService();
