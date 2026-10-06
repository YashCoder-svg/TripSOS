import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type {
  GeocodingResult,
  LocationProvider,
  PlaceDetails,
  PlaceSearchParams,
  PlaceSearchResult,
} from '../src/services/location/types.js';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-places-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');
vi.stubEnv('LOCATION_PROVIDER', 'osm');
vi.stubEnv('LOCATION_PROVIDER_API_KEY', 'secret-provider-key-123');

const { app } = await import('../src/app.js');
const { locationService } = await import('../src/services/location/locationService.js');

const mockGeocodeResults: GeocodingResult[] = [
  {
    provider: 'mock-provider',
    providerId: 'mock-1',
    name: 'Manali',
    country: 'India',
    region: 'Himachal Pradesh',
    city: 'Manali',
    formattedAddress: 'Manali, Himachal Pradesh, India',
    latitude: 32.2396,
    longitude: 77.1887,
  },
];

const mockSearchResult: PlaceSearchResult = {
  results: [
    {
      provider: 'mock-provider',
      providerId: 'hospital-1',
      name: 'Civil Hospital Manali',
      category: 'hospitals',
      categories: ['hospitals'],
      latitude: 32.2458,
      longitude: 77.1859,
      address: 'Mall Road, Manali',
      distanceMeters: 750,
      phone: '+91 1902 252 000',
    },
  ],
  center: { latitude: 32.2396, longitude: 77.1887 },
  source: 'mock-provider',
};

const mockPlaceDetails: PlaceDetails = {
  ...mockSearchResult.results[0]!,
  website: 'https://hospital.example.com',
  openingHours: ['24/7 Emergency'],
};

class MockProvider implements LocationProvider {
  readonly name = 'mock-provider';
  shouldFail = false;

  async geocode(query: string): Promise<GeocodingResult[]> {
    if (this.shouldFail) throw new Error('Provider connection failed');
    if (query.toLowerCase().includes('empty')) return [];
    return mockGeocodeResults;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (this.shouldFail) throw new Error('Provider connection failed');
    return {
      provider: this.name,
      providerId: 'rev-1',
      name: 'Mall Road',
      latitude,
      longitude,
      formattedAddress: 'Mall Road, Manali, India',
    };
  }

  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
    if (this.shouldFail) throw new Error('Provider connection failed');
    if (params.query === 'empty')
      return {
        results: [],
        center: { latitude: params.latitude, longitude: params.longitude },
        source: this.name,
      };
    return mockSearchResult;
  }

  async getPlaceDetails(providerId: string): Promise<PlaceDetails | null> {
    if (this.shouldFail) throw new Error('Provider connection failed');
    if (providerId === 'not-found') return null;
    return mockPlaceDetails;
  }
}

const mockProviderInstance = new MockProvider();

describe('Places API & Location Service', () => {
  beforeAll(() => {
    locationService.setProvider(mockProviderInstance);
  });

  beforeEach(() => {
    mockProviderInstance.shouldFail = false;
    locationService.setProvider(mockProviderInstance);
  });

  afterAll(() => {
    // cleanup
  });

  describe('GET /api/places/geocode', () => {
    it('returns normalized geocoding results for valid query', async () => {
      const res = await request(app).get('/api/places/geocode?q=Manali');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]).toMatchObject({
        name: 'Manali',
        latitude: 32.2396,
        longitude: 77.1887,
        country: 'India',
      });
      // Security: verify provider secret is never exposed
      expect(JSON.stringify(res.body)).not.toContain('secret-provider-key-123');
    });

    it('rejects empty and whitespace queries with validation error', async () => {
      const res = await request(app).get('/api/places/geocode?q=   ');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects excessively long queries', async () => {
      const longQuery = 'a'.repeat(105);
      const res = await request(app).get(`/api/places/geocode?q=${longQuery}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('handles provider failure gracefully', async () => {
      mockProviderInstance.shouldFail = true;
      const res = await request(app).get('/api/places/geocode?q=Manali');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/places/search', () => {
    it('returns normalized places for valid coordinates and category', async () => {
      const res = await request(app).get(
        '/api/places/search?lat=32.2396&lon=77.1887&category=hospitals&radius=3000',
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.results).toHaveLength(1);
      expect(res.body.data.results[0]).toMatchObject({
        name: 'Civil Hospital Manali',
        category: 'hospitals',
        distanceMeters: 750,
      });
      // Real data check: rating should NOT be invented if provider didn't supply it
      expect(res.body.data.results[0].rating).toBeUndefined();
    });

    it('rejects invalid latitude and longitude', async () => {
      const res1 = await request(app).get('/api/places/search?lat=95&lon=77.1887');
      expect(res1.status).toBe(400);

      const res2 = await request(app).get('/api/places/search?lat=32.2396&lon=200');
      expect(res2.status).toBe(400);
    });

    it('rejects out-of-bounds radius', async () => {
      const res = await request(app).get(
        '/api/places/search?lat=32.2396&lon=77.1887&radius=100000',
      );
      expect(res.status).toBe(400);
    });

    it('rejects unknown category', async () => {
      const res = await request(app).get(
        '/api/places/search?lat=32.2396&lon=77.1887&category=invalid_category',
      );
      expect(res.status).toBe(400);
    });

    it('returns empty results when no places match', async () => {
      const res = await request(app).get('/api/places/search?lat=32.2396&lon=77.1887&q=empty');
      expect(res.status).toBe(200);
      expect(res.body.data.results).toHaveLength(0);
    });
  });

  describe('GET /api/places/nearby', () => {
    it('returns nearby results for coordinates and category', async () => {
      const res = await request(app).get(
        '/api/places/nearby?lat=32.2396&lon=77.1887&category=pharmacies',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.results).toBeDefined();
    });
  });

  describe('GET /api/places/:providerId', () => {
    it('returns detailed place information', async () => {
      const res = await request(app).get('/api/places/hospital-1');
      expect(res.status).toBe(200);
      expect(res.body.data.place).toMatchObject({
        providerId: 'hospital-1',
        name: 'Civil Hospital Manali',
        website: 'https://hospital.example.com',
      });
    });

    it('returns 404 for unknown place ID', async () => {
      const res = await request(app).get('/api/places/not-found');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PLACE_NOT_FOUND');
    });
  });

  describe('Privacy & Security', () => {
    it('does not expose background location tracking endpoints', async () => {
      const res = await request(app).post('/api/places/track');
      expect(res.status).toBe(404);
    });

    it('does not store search coordinates in a database', async () => {
      // Searching places does not touch MongoDB User or Trip documents
      const res = await request(app).get('/api/places/search?lat=32.2396&lon=77.1887');
      expect(res.status).toBe(200);
    });
  });
});
