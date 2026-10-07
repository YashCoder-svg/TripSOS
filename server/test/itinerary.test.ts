import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-itinerary-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Trip } = await import('../src/models/Trip.js');
const { ItineraryItem } = await import('../src/models/ItineraryItem.js');

const origin = 'http://localhost:5173';

async function register(email: string) {
  const res = await request(app).post('/api/auth/register').set('Origin', origin).send({
    name: 'Traveler Test',
    email,
    password: 'SafePassword2026',
    confirmPassword: 'SafePassword2026',
  });
  return res.body.data.accessToken as string;
}

describe('Itinerary API', () => {
  let mongo: MongoMemoryServer;
  let userToken: string;
  let otherToken: string;
  let tripId: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Trip.init(), ItineraryItem.init()]);

    userToken = await register('traveler1@example.com');
    otherToken = await register('traveler2@example.com');

    // Create a trip for user 1
    const tripRes = await request(app)
      .post('/api/trips')
      .set('Origin', origin)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Himachal Adventure',
        destinationName: 'Manali, India',
        startDate: '2026-10-15',
        endDate: '2026-10-20',
        travelerCount: 2,
        budget: 50000,
        currency: 'INR',
        travelStyle: 'adventure',
        interests: ['nature'],
      });
    tripId = tripRes.body.data.trip._id;
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('enforces authentication on all itinerary routes', async () => {
    const res = await request(app).get(`/api/trips/${tripId}/itinerary`);
    expect(res.status).toBe(401);
  });

  it('forbids other users from viewing or modifying the trip itinerary', async () => {
    const getRes = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(getRes.status).toBe(404);

    const postRes = await request(app)
      .post(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        title: 'Unauthorized activity',
        date: '2026-10-15',
      });
    expect(postRes.status).toBe(404);
  });

  it('creates an itinerary item with order auto-assigned', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Morning Hike to Jogini Waterfall',
        description: 'Take trail from Vashisht village',
        date: '2026-10-15',
        startTime: '08:30',
        endTime: '11:30',
        location: 'Vashisht, Manali',
        category: 'activity',
        notes: 'Carry water and sturdy boots',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.item.title).toBe('Morning Hike to Jogini Waterfall');
    expect(res.body.data.item.order).toBe(0);
    expect(res.body.data.item.status).toBe('planned');
  });

  it('creates a second item on same day and assigns incremented order', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Lunch at Cafe 1947',
        date: '2026-10-15',
        startTime: '12:30',
        category: 'food',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.item.order).toBe(1);
  });

  it('lists itinerary items sorted by date and order', async () => {
    const res = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.items[0].title).toBe('Morning Hike to Jogini Waterfall');
    expect(res.body.data.items[1].title).toBe('Lunch at Cafe 1947');
  });

  it('updates an itinerary item status and details', async () => {
    const listRes = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`);
    const itemId = listRes.body.data.items[0]._id;

    const updateRes = await request(app)
      .patch(`/api/trips/${tripId}/itinerary/${itemId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        status: 'completed',
        notes: 'Beautiful waterfall, reached summit!',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.item.status).toBe('completed');
    expect(updateRes.body.data.item.notes).toBe('Beautiful waterfall, reached summit!');
  });

  it('reorders items successfully', async () => {
    const listRes = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`);
    const items = listRes.body.data.items;

    const reorderRes = await request(app)
      .put(`/api/trips/${tripId}/itinerary/reorder`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [
          { id: items[0]._id, order: 1 },
          { id: items[1]._id, order: 0 },
        ],
      });

    expect(reorderRes.status).toBe(200);
    expect(reorderRes.body.data.items[0]._id).toBe(items[1]._id);
  });

  it('deletes an itinerary item', async () => {
    const listRes = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`);
    const itemId = listRes.body.data.items[0]._id;

    const delRes = await request(app)
      .delete(`/api/trips/${tripId}/itinerary/${itemId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(delRes.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/trips/${tripId}/itinerary`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(checkRes.body.data.items.length).toBe(1);
  });
});
