import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-trip-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');
vi.stubEnv('UNSPLASH_ACCESS_KEY', '');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Trip } = await import('../src/models/Trip.js');
const origin = 'http://localhost:5173';
const registration = {
  name: 'Trip Tester',
  email: '',
  password: 'JourneySafe2026',
  confirmPassword: 'JourneySafe2026',
};
const validTrip = {
  name: 'Mountain Escape',
  destinationName: 'Manali, India',
  destinationCountry: 'India',
  startDate: '2099-10-12',
  endDate: '2099-10-16',
  travelerCount: 4,
  budget: 60000,
  currency: 'INR',
  travelStyle: 'adventure',
  interests: ['nature', 'photography', 'food'],
};

async function createAccount(email: string) {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', origin)
    .send({ ...registration, email });
  return response.body.data.accessToken as string;
}

function withToken(method: 'get' | 'post' | 'patch' | 'delete', path: string, token?: string) {
  const call = request(app)[method](path).set('Origin', origin);
  if (token) call.set('Authorization', `Bearer ${token}`);
  return call;
}

describe('trip API', () => {
  let mongo: MongoMemoryServer;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Trip.init()]);
  }, 120_000);
  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Trip.deleteMany({})]);
  });

  it('requires authentication for every trip endpoint', async () => {
    expect((await withToken('get', '/api/trips')).status).toBe(401);
    expect((await withToken('post', '/api/trips').send(validTrip)).status).toBe(401);
    expect((await withToken('get', `/api/trips/${new mongoose.Types.ObjectId()}`)).status).toBe(
      401,
    );
    expect(
      (
        await withToken('patch', `/api/trips/${new mongoose.Types.ObjectId()}/status`).send({
          status: 'cancelled',
        })
      ).status,
    ).toBe(401);
  });

  it('creates and lists only a user’s trips and derives date status', async () => {
    const owner = await createAccount('trip-owner@example.com');
    const other = await createAccount('trip-other@example.com');
    const created = await withToken('post', '/api/trips', owner).send(validTrip);
    expect(created.status).toBe(201);
    expect(created.headers['cache-control']).toBe('no-store');
    expect(created.body.data.trip).toMatchObject({ ...validTrip, status: 'upcoming' });
    expect(created.body.data.trip).not.toHaveProperty('owner');
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const active = await withToken('post', '/api/trips', owner).send({
      ...validTrip,
      name: 'Today',
      startDate: localToday,
      endDate: localToday,
    });
    expect(active.body.data.trip.status).toBe('active');
    const past = await withToken('post', '/api/trips', owner).send({
      ...validTrip,
      name: 'Past',
      startDate: '2000-01-01',
      endDate: '2000-01-02',
    });
    expect(past.body.data.trip.status).toBe('completed');
    const ownList = await withToken('get', '/api/trips', owner);
    expect(ownList.body.data.trips).toHaveLength(3);
    expect((await withToken('get', '/api/trips', other)).body.data.trips).toHaveLength(0);
  });

  it('supports forward-compatible destination subdocument structure', async () => {
    const owner = await createAccount('trip-dest@example.com');
    const tripWithDest = {
      ...validTrip,
      name: 'Tokyo Dream',
      destinationName: 'Tokyo, Japan',
      destinationCountry: 'Japan',
      destination: {
        name: 'Tokyo',
        city: 'Tokyo',
        country: 'Japan',
        formattedAddress: 'Tokyo, Japan',
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
      },
    };
    const created = await withToken('post', '/api/trips', owner).send(tripWithDest);
    expect(created.status).toBe(201);
    expect(created.body.data.trip.destinationCountry).toBe('Japan');
    expect(created.body.data.trip.destination).toMatchObject({
      city: 'Tokyo',
      country: 'Japan',
    });
  });

  it('rejects invalid dates, traveler counts, budgets, currency, and client-supplied status in creation/update', async () => {
    const token = await createAccount('trip-validation@example.com');
    const cases = [
      { ...validTrip, endDate: '2099-10-11' },
      { ...validTrip, startDate: '2099-02-30' },
      { ...validTrip, travelerCount: 0 },
      { ...validTrip, travelerCount: 31 },
      { ...validTrip, budget: -1 },
      { ...validTrip, budget: 100_000_001 },
      { ...validTrip, currency: 'JPY' },
      { ...validTrip, status: 'cancelled' },
    ];
    for (const input of cases)
      expect((await withToken('post', '/api/trips', token).send(input)).status).toBe(400);
    expect(await Trip.countDocuments()).toBe(0);
  });

  it('reads, edits, and deletes an owned trip, but hides another owner’s resource', async () => {
    const owner = await createAccount('trip-crud-owner@example.com');
    const other = await createAccount('trip-crud-other@example.com');
    const created = await withToken('post', '/api/trips', owner).send(validTrip);
    const id = created.body.data.trip._id as string;
    expect((await withToken('get', `/api/trips/${id}`, owner)).status).toBe(200);
    expect((await withToken('get', `/api/trips/${id}`, other)).status).toBe(404);
    expect(
      (await withToken('patch', `/api/trips/${id}`, other).send({ name: 'Stolen' })).status,
    ).toBe(404);
    expect((await withToken('delete', `/api/trips/${id}`, other)).status).toBe(404);

    const changed = await withToken('patch', `/api/trips/${id}`, owner).send({
      name: 'Northern Escape',
      destinationName: 'Leh, India',
      startDate: '2099-10-13',
    });
    expect(changed.status).toBe(200);
    expect(changed.body.data.trip).toMatchObject({
      name: 'Northern Escape',
      destinationName: 'Leh, India',
      startDate: '2099-10-13',
      endDate: '2099-10-16',
    });
    expect(
      (await withToken('patch', `/api/trips/${id}`, owner).send({ endDate: '2099-10-12' })).status,
    ).toBe(400);
    expect(
      (await withToken('patch', `/api/trips/${id}`, owner).send({ status: 'cancelled' })).status,
    ).toBe(400);
    expect((await withToken('delete', `/api/trips/${id}`, owner)).body.data.deleted).toBe(true);
    expect((await withToken('get', `/api/trips/${id}`, owner)).status).toBe(404);
  });

  it('updates trip status via dedicated status endpoint and enforces ownership and validation', async () => {
    const owner = await createAccount('trip-status-owner@example.com');
    const other = await createAccount('trip-status-other@example.com');
    const created = await withToken('post', '/api/trips', owner).send(validTrip);
    const id = created.body.data.trip._id as string;

    // Cancelling a trip
    const cancelled = await withToken('patch', `/api/trips/${id}/status`, owner).send({
      status: 'cancelled',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.trip.status).toBe('cancelled');

    // Setting status to planning
    const planning = await withToken('patch', `/api/trips/${id}/status`, owner).send({
      status: 'planning',
    });
    expect(planning.status).toBe(200);
    expect(planning.body.data.trip.status).toBe('planning');

    // Rejecting invalid status enum
    const invalid = await withToken('patch', `/api/trips/${id}/status`, owner).send({
      status: 'archived',
    });
    expect(invalid.status).toBe(400);

    // Other user cannot modify status (404 without leaking)
    const forbidden = await withToken('patch', `/api/trips/${id}/status`, other).send({
      status: 'cancelled',
    });
    expect(forbidden.status).toBe(404);
  });

  it('returns not found for malformed or missing trip IDs', async () => {
    const token = await createAccount('trip-id@example.com');
    expect((await withToken('get', '/api/trips/not-an-id', token)).status).toBe(404);
    expect(
      (await withToken('delete', `/api/trips/${new mongoose.Types.ObjectId()}`, token)).status,
    ).toBe(404);
  });
});
