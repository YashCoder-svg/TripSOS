import type { ExchangeRateProvider, ExchangeRateResult } from './types.js';

export class FrankfurterExchangeProvider implements ExchangeRateProvider {
  readonly name = 'European Central Bank (Frankfurter)';

  async getRate(from: string, to: string): Promise<ExchangeRateResult> {
    if (from.toUpperCase() === to.toUpperCase()) {
      return {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate: 1.0,
        source: this.name,
        date: new Date().toISOString().split('T')[0],
      };
    }

    const url = `https://api.frankfurter.dev/v1/latest?from=${encodeURIComponent(
      from.toUpperCase(),
    )}&to=${encodeURIComponent(to.toUpperCase())}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Frankfurter API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        amount: number;
        base: string;
        date: string;
        rates: Record<string, number>;
      };

      const rate = data.rates[to.toUpperCase()];
      if (typeof rate !== 'number') {
        throw new Error(`Rate from ${from} to ${to} was not returned.`);
      }

      return {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        source: this.name,
        date: data.date,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
