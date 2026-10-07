import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { WeatherData, WeatherProvider } from '../src/services/weather/types.js';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-weather-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');
const { weatherService } = await import('../src/services/weather/weatherService.js');

const mockWeatherData: WeatherData = {
  provider: 'mock-weather-provider',
  location: { latitude: 32.2396, longitude: 77.1887 },
  current: {
    temperature: 18.5,
    apparentTemperature: 17.8,
    humidity: 62,
    windSpeed: 10.5,
    precipitation: 0,
    condition: 'Mainly clear',
    weatherCode: 1,
    icon: 'clear',
  },
  daily: [
    {
      date: '2026-10-07',
      temperatureMax: 21.0,
      temperatureMin: 11.5,
      apparentTemperatureMax: 20.2,
      precipitationProbability: 10,
      windSpeedMax: 12.0,
      condition: 'Clear sky',
      weatherCode: 0,
      icon: 'clear',
    },
    {
      date: '2026-10-08',
      temperatureMax: 20.0,
      temperatureMin: 10.5,
      apparentTemperatureMax: 19.5,
      precipitationProbability: 25,
      windSpeedMax: 14.0,
      condition: 'Partly cloudy',
      weatherCode: 2,
      icon: 'partly_cloudy',
    },
  ],
  forecastAvailableForDates: true,
};

class MockWeatherProvider implements WeatherProvider {
  readonly name = 'mock-weather-provider';
  callCount = 0;
  shouldFail = false;

  async getWeather(
    latitude: number,
    longitude: number,
    startDate?: string,
    endDate?: string,
  ): Promise<WeatherData> {
    void endDate;
    this.callCount++;
    if (this.shouldFail) throw new Error('Weather API connection failure');

    let tripForecast = mockWeatherData.daily;
    let forecastAvailableForDates = true;
    let message: string | undefined;

    if (startDate && startDate > '2026-10-15') {
      tripForecast = [];
      forecastAvailableForDates = false;
      message = 'Forecast will become available closer to your trip.';
    }

    return {
      ...mockWeatherData,
      location: { latitude, longitude },
      tripForecast,
      forecastAvailableForDates,
      message,
    };
  }
}

describe('Weather API', () => {
  let mockProvider: MockWeatherProvider;

  beforeEach(() => {
    mockProvider = new MockWeatherProvider();
    weatherService.setProvider(mockProvider);
  });

  it('rejects missing or invalid coordinates with 400', async () => {
    const res1 = await request(app).get('/api/weather');
    expect(res1.status).toBe(400);

    const res2 = await request(app).get('/api/weather?lat=95&lon=77');
    expect(res2.status).toBe(400);

    const res3 = await request(app).get('/api/weather?lat=32&lon=200');
    expect(res3.status).toBe(400);

    const res4 = await request(app).get(
      '/api/weather?lat=32&lon=77&startDate=2026-10-10&endDate=2026-10-05',
    );
    expect(res4.status).toBe(400);
  });

  it('returns normalized weather for valid coordinates', async () => {
    const res = await request(app).get('/api/weather?lat=32.2396&lon=77.1887');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.location.latitude).toBeCloseTo(32.2396);
    expect(res.body.data.current.temperature).toBe(18.5);
    expect(res.body.data.current.condition).toBe('Mainly clear');
    expect(res.body.data.daily.length).toBe(2);
  });

  it('handles distant trip dates without fabricating forecasts', async () => {
    const res = await request(app).get(
      '/api/weather?lat=32.2396&lon=77.1887&startDate=2026-11-01&endDate=2026-11-05',
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.forecastAvailableForDates).toBe(false);
    expect(res.body.data.message).toBe('Forecast will become available closer to your trip.');
  });

  it('serves repeated requests from memory cache', async () => {
    await request(app).get('/api/weather?lat=32.2396&lon=77.1887');
    expect(mockProvider.callCount).toBe(1);

    await request(app).get('/api/weather?lat=32.2396&lon=77.1887');
    expect(mockProvider.callCount).toBe(1);
  });

  it('handles provider failures gracefully', async () => {
    mockProvider.shouldFail = true;
    const res = await request(app).get('/api/weather?lat=12.9716&lon=77.5946');
    expect(res.status).toBe(500);
  });
});
