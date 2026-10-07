import { FrankfurterExchangeProvider } from './frankfurterProvider.js';
import type { ExchangeRateProvider, ExchangeRateResult } from './types.js';

interface CacheEntry {
  result: ExchangeRateResult;
  expiresAt: number;
}

export class ExchangeService {
  private provider: ExchangeRateProvider;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttlMs = 60 * 60 * 1000; // 1 hour cache

  constructor(provider?: ExchangeRateProvider) {
    this.provider = provider ?? new FrankfurterExchangeProvider();
  }

  setProvider(provider: ExchangeRateProvider): void {
    this.provider = provider;
    this.cache.clear();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async getExchangeRate(from: string, to: string): Promise<ExchangeRateResult> {
    const fromClean = from.toUpperCase();
    const toClean = to.toUpperCase();

    if (fromClean === toClean) {
      return {
        from: fromClean,
        to: toClean,
        rate: 1.0,
        source: 'Identical currency',
        date: new Date().toISOString().split('T')[0],
      };
    }

    const key = `${fromClean}->${toClean}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const result = await this.provider.getRate(fromClean, toClean);
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.ttlMs,
    });

    return result;
  }
}

export const exchangeService = new ExchangeService();
