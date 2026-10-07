import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { LocationProvider, PlaceSearchResult } from '../src/services/location/types.js';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-emergency-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { EmergencySession } = await import('../src/models/EmergencySession.js');
const { locationService } = await import('../src/services/location/locationService.js');

const origin = 'http://localhost:5173';

class MockLocationProvider implements LocationProvider {
  readonly name = 'mock-emergency-provider';

  async geocode() {
    return [];
  }
  async reverseGeocode() {
    return null;
  }
  async searchPlaces(): Promise<PlaceSearchResult> {
    return {
      results: [
        {
          provider: 'mock',
          providerId: 'hosp-1',
          name: 'City General Hospital',
          category: 'hospitals',
          latitude: 32.24,
          longitude: 77.18,
          distanceMeters: 450,
          phone: '+91 1902 252 111',
          address: 'Mall Road',
        },
      ],
      center: { latitude: 32.24, longitude: 77.18 },
      source: 'mock-emergency-provider',
    };
  }
  async getPlaceDetails() {
    return null;
  }
}

describe('Emergency API', () => {
  let mongo: MongoMemoryServer;
  let userToken: string;

  beforeAll(async () => {
    locationService.setProvider(new MockLocationProvider());

    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), EmergencySession.init()]);

    const res = await request(app).post('/api/auth/register').set('Origin', origin).send({
      name: 'Safe Traveler',
      email: 'safetraveler@example.com',
      password: 'PassSafe2026',
      confirmPassword: 'PassSafe2026',
    });
    userToken = res.body.data.accessToken as string;
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('allows unauthenticated guests to start an emergency session', async () => {
    const res = await request(app).post('/api/emergency/sessions').set('Origin', origin).send({
      type: 'medical',
      latitude: 32.2396,
      longitude: 77.1887,
      accuracyMeters: 15,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.type).toBe('medical');
    expect(res.body.data.session.status).toBe('active');
    expect(res.body.data.session.user).toBeNull();
  });

  it('associates emergency session with authenticated user when token provided', async () => {
    const res = await request(app)
      .post('/api/emergency/sessions')
      .set('Origin', origin)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'police',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.session.user).not.toBeNull();
    expect(res.body.data.session.type).toBe('police');
  });

  it('updates session status to resolved and sets endedAt timestamp', async () => {
    const startRes = await request(app)
      .post('/api/emergency/sessions')
      .set('Origin', origin)
      .send({ type: 'general' });
    const sessionId = startRes.body.data.session._id;

    const patchRes = await request(app)
      .patch(`/api/emergency/sessions/${sessionId}/status`)
      .set('Origin', origin)
      .send({ status: 'resolved' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.session.status).toBe('resolved');
    expect(patchRes.body.data.session.endedAt).toBeDefined();
  });

  it('returns verified nearby emergency services', async () => {
    const res = await request(app)
      .get('/api/emergency/services?lat=32.2396&lon=77.1887&category=all')
      .set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.services)).toBe(true);
  });

  it('returns authoritative country emergency numbers with source documentation', async () => {
    const res = await request(app)
      .get('/api/emergency/numbers?countryCode=IN')
      .set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.body.data.numbers.general).toBe('112');
    expect(res.body.data.numbers.police).toBe('100');
    expect(res.body.data.numbers.ambulance).toBe('108');
    expect(res.body.data.numbers.source).toContain('Ministry of Home Affairs');
  });

  it('falls back to global standard 112 with documented source for unknown countries', async () => {
    const res = await request(app)
      .get('/api/emergency/numbers?countryCode=XYZ')
      .set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.body.data.numbers.general).toBe('112');
    expect(res.body.data.numbers.source).toContain('International Telecommunication Union');
  });
});
