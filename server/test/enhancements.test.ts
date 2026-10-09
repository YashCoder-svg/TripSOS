import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-enhancements-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');
vi.stubEnv('UNSPLASH_ACCESS_KEY', '');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Trip } = await import('../src/models/Trip.js');
const { SavedPlace } = await import('../src/models/SavedPlace.js');
const { Notification } = await import('../src/models/Notification.js');
const origin = 'http://localhost:5173';

async function createAccount(email: string, name = 'Test User') {
  const response = await request(app)
    .post('/api/auth/register')
    .set('Origin', origin)
    .send({
      name,
      email,
      password: 'SafePassword2026',
      confirmPassword: 'SafePassword2026',
    });
  return response.body.data.accessToken as string;
}

function withToken(method: 'get' | 'post' | 'patch' | 'delete', path: string, token?: string) {
  const call = request(app)[method](path).set('Origin', origin);
  if (token) call.set('Authorization', `Bearer ${token}`);
  return call;
}

describe('TripSOS Platform Enhancements', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Trip.init(), SavedPlace.init(), Notification.init()]);
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key]!.deleteMany({});
    }
  });

  it('generates a unique tripCode and allows friends to join via /api/trips/join-code', async () => {
    const ownerToken = await createAccount('owner@tripsos.org', 'Alice Owner');
    const friendToken = await createAccount('friend@tripsos.org', 'Bob Friend');

    // Create trip
    const createRes = await withToken('post', '/api/trips', ownerToken).send({
      name: 'Kyoto Journey',
      destinationName: 'Kyoto, Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      travelerCount: 2,
      budget: 150000,
      currency: 'INR',
      travelStyle: 'balanced',
      interests: ['food', 'culture'],
    });

    expect(createRes.status).toBe(201);
    const trip = createRes.body.data.trip;
    expect(trip.tripCode).toMatch(/^TRP-[A-Z0-9]{4,6}$/);

    // Friend joins via tripCode
    const joinRes = await withToken('post', '/api/trips/join-code', friendToken).send({
      code: trip.tripCode,
    });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.trip.name).toBe('Kyoto Journey');
    expect(joinRes.body.data.role).toBe('member');

    // Owner joining own trip returns alreadyMember: true
    const ownerJoinRes = await withToken('post', '/api/trips/join-code', ownerToken).send({
      code: trip.tripCode,
    });
    expect(ownerJoinRes.status).toBe(200);
    expect(ownerJoinRes.body.data.alreadyMember).toBe(true);
  });

  it('records and retrieves group chat messages and announcements', async () => {
    const ownerToken = await createAccount('chatowner@tripsos.org', 'Charlie Owner');
    const createRes = await withToken('post', '/api/trips', ownerToken).send({
      name: 'Manali Trek',
      destinationName: 'Manali, India',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      travelerCount: 3,
      budget: 30000,
      currency: 'INR',
      travelStyle: 'adventure',
      interests: ['nature'],
    });

    const tripId = createRes.body.data.trip._id;

    // Post an announcement
    const announceRes = await withToken(
      'post',
      `/api/trips/${tripId}/messages`,
      ownerToken,
    ).send({
      content: 'Flight departs at 06:00 AM sharp! Don’t be late.',
      type: 'announcement',
      pinned: true,
    });

    expect(announceRes.status).toBe(201);
    expect(announceRes.body.data.message.content).toBe(
      'Flight departs at 06:00 AM sharp! Don’t be late.',
    );
    expect(announceRes.body.data.message.pinned).toBe(true);

    // Post regular chat message
    const chatRes = await withToken(
      'post',
      `/api/trips/${tripId}/messages`,
      ownerToken,
    ).send({
      content: 'Anyone bringing a first aid kit?',
      type: 'chat',
    });

    expect(chatRes.status).toBe(201);

    // List messages
    const listRes = await withToken('get', `/api/trips/${tripId}/messages`, ownerToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.messages.length).toBe(2);
  });

  it('saves, retrieves, and removes places in /api/saved-places', async () => {
    const userToken = await createAccount('traveler@tripsos.org', 'Daisy Traveler');

    // Save a restaurant
    const saveRes = await withToken('post', '/api/saved-places', userToken).send({
      name: 'Café 1947',
      category: 'cafes',
      address: 'Old Manali, Himachal Pradesh',
      coordinates: { latitude: 32.2541, longitude: 77.1783 },
      phone: '+91 98160 00000',
      userNotes: 'Must try their trout and wood-fired pizza.',
    });

    expect(saveRes.status).toBe(201);
    const placeId = saveRes.body.data.place._id;

    // List saved places
    const listRes = await withToken('get', '/api/saved-places', userToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.places.length).toBe(1);
    expect(listRes.body.data.places[0].name).toBe('Café 1947');

    // Delete saved place
    const delRes = await withToken('delete', `/api/saved-places/${placeId}`, userToken);
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.deleted).toBe(true);

    const emptyRes = await withToken('get', '/api/saved-places', userToken);
    expect(emptyRes.body.data.places.length).toBe(0);
  });

  it('handles in-app notifications and mark-as-read in /api/notifications', async () => {
    const userToken = await createAccount('notify@tripsos.org', 'Evan Recipient');
    const user = await User.findOne({ email: 'notify@tripsos.org' });

    // Seed a notification
    await Notification.create({
      recipient: user!._id,
      type: 'emergency_alert',
      title: 'Safety Check-in',
      message: 'All members of your trip are accounted for.',
    });

    const listRes = await withToken('get', '/api/notifications', userToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.notifications.length).toBe(1);
    expect(listRes.body.data.unreadCount).toBe(1);

    const notifId = listRes.body.data.notifications[0]._id;

    // Mark as read
    const readRes = await withToken('patch', `/api/notifications/${notifId}/read`, userToken);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.read).toBe(true);

    const afterRes = await withToken('get', '/api/notifications', userToken);
    expect(afterRes.body.data.unreadCount).toBe(0);
  });

  it('records expenses with percentage split', async () => {
    const ownerToken = await createAccount('pctowner@tripsos.org', 'Fiona');
    const friendToken = await createAccount('pctfriend@tripsos.org', 'George');
    const ownerUser = await User.findOne({ email: 'pctowner@tripsos.org' });
    const friendUser = await User.findOne({ email: 'pctfriend@tripsos.org' });

    const createTrip = await withToken('post', '/api/trips', ownerToken).send({
      name: 'Goa Holiday',
      destinationName: 'Goa, India',
      startDate: '2026-11-15',
      endDate: '2026-11-20',
      travelerCount: 2,
      budget: 50000,
      currency: 'INR',
      travelStyle: 'comfort',
      interests: ['food'],
    });

    const tripId = createTrip.body.data.trip._id;

    // Friend joins
    await withToken('post', '/api/trips/join-code', friendToken).send({
      code: createTrip.body.data.trip.tripCode,
    });

    // Record expense: 60% Fiona, 40% George
    const expenseRes = await withToken('post', `/api/trips/${tripId}/expenses`, ownerToken).send({
      amount: 10000,
      currency: 'INR',
      description: 'Beach Resort Stay',
      category: 'hotel',
      date: '2026-11-16',
      splitMethod: 'percentage',
      participants: [
        { user: ownerUser!._id.toString(), percentage: 60 },
        { user: friendUser!._id.toString(), percentage: 40 },
      ],
    });

    expect(expenseRes.status).toBe(201);
    expect(expenseRes.body.data.expense.splitMethod).toBe('percentage');
    expect(expenseRes.body.data.expense.participants[0].shareAmount).toBe(6000);
    expect(expenseRes.body.data.expense.participants[1].shareAmount).toBe(4000);
  });
});
