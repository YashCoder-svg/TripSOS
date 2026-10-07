export interface ExchangeRateResult {
  from: string;
  to: string;
  rate: number;
  source: string;
  date?: string;
}

export interface ExchangeRateProvider {
  readonly name: string;
  getRate(from: string, to: string): Promise<ExchangeRateResult>;
}
