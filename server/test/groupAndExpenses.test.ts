import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { ExchangeRateProvider, ExchangeRateResult } from '../src/services/exchange/types.js';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-group-expenses-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Trip } = await import('../src/models/Trip.js');
const { TripMember } = await import('../src/models/TripMember.js');
const { Expense } = await import('../src/models/Expense.js');
const { exchangeService } = await import('../src/services/exchange/exchangeService.js');

const origin = 'http://localhost:5173';

class MockExchangeProvider implements ExchangeRateProvider {
  readonly name = 'Mock European Central Bank';
  async getRate(from: string, to: string): Promise<ExchangeRateResult> {
    const rates: Record<string, number> = {
      'USD->INR': 83.5,
      'EUR->INR': 90.2,
      'GBP->INR': 105.4,
      'INR->USD': 0.012,
    };
    const key = `${from.toUpperCase()}->${to.toUpperCase()}`;
    return {
      from,
      to,
      rate: rates[key] ?? 1.5,
      source: this.name,
      date: '2026-10-07',
    };
  }
}

describe('Group Travel & Expenses API', () => {
  let mongo: MongoMemoryServer;
  let ownerToken: string;
  let ownerId: string;
  let friendToken: string;
  let friendId: string;
  let strangerToken: string;
  let tripId: string;

  beforeAll(async () => {
    exchangeService.setProvider(new MockExchangeProvider());

    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Trip.init(), TripMember.init(), Expense.init()]);

    // Create Owner
    const ownerRes = await request(app).post('/api/auth/register').set('Origin', origin).send({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'PassGroup2026',
      confirmPassword: 'PassGroup2026',
    });
    ownerToken = ownerRes.body.data.accessToken;
    ownerId = ownerRes.body.data.user.id;

    // Create Friend
    const friendRes = await request(app).post('/api/auth/register').set('Origin', origin).send({
      name: 'Vaishnavi Rao',
      email: 'vaishnavi@example.com',
      password: 'PassGroup2026',
      confirmPassword: 'PassGroup2026',
    });
    friendToken = friendRes.body.data.accessToken;
    friendId = friendRes.body.data.user.id;

    // Create Stranger
    const strangerRes = await request(app).post('/api/auth/register').set('Origin', origin).send({
      name: 'Uninvited User',
      email: 'stranger@example.com',
      password: 'PassGroup2026',
      confirmPassword: 'PassGroup2026',
    });
    strangerToken = strangerRes.body.data.accessToken;

    // Create a shared Trip by Owner
    const tripRes = await request(app)
      .post('/api/trips')
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Himachal Adventure',
        destinationName: 'Manali',
        destinationCountry: 'India',
        destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
        startDate: '2026-11-01',
        endDate: '2026-11-07',
        travelerCount: 3,
        budget: 45000,
        currency: 'INR',
        travelStyle: 'adventure',
        interests: ['nature', 'adventure'],
      });
    tripId = tripRes.body.data.trip._id;
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('automatically sets trip creator as active owner member', async () => {
    const res = await request(app)
      .get(`/api/trips/${tripId}/members`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.members).toHaveLength(1);
    expect(res.body.data.members[0].role).toBe('owner');
    expect(res.body.data.members[0].status).toBe('active');
  });

  it('allows owner to generate secure invite token for a friend', async () => {
    const inviteRes = await request(app)
      .post(`/api/trips/${tripId}/members/invite`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: 'vaishnavi@example.com',
        role: 'member',
      });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.inviteToken).toBeDefined();
    expect(inviteRes.body.data.member.status).toBe('pending');
    expect(inviteRes.body.data.inviteLink).toContain(inviteRes.body.data.inviteToken);

    // Stranger cannot join without valid token
    const badJoinRes = await request(app)
      .post(`/api/trips/${tripId}/members/join`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ inviteToken: 'invalid-token-12345678' });
    expect(badJoinRes.status).toBe(404);

    // Friend joins with token
    const joinRes = await request(app)
      .post(`/api/trips/${tripId}/members/join`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${friendToken}`)
      .send({ inviteToken: inviteRes.body.data.inviteToken });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.joined).toBe(true);
    expect(joinRes.body.data.member.status).toBe('active');
  });

  it('permits active joined member to view the trip and its group members', async () => {
    const viewTripRes = await request(app)
      .get(`/api/trips/${tripId}`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${friendToken}`);

    expect(viewTripRes.status).toBe(200);
    expect(viewTripRes.body.data.trip.name).toBe('Himachal Adventure');

    const membersRes = await request(app)
      .get(`/api/trips/${tripId}/members`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${friendToken}`);

    expect(membersRes.status).toBe(200);
    expect(membersRes.body.data.members).toHaveLength(2);
  });

  it('prohibits uninvited stranger from accessing private trip or members', async () => {
    const res = await request(app)
      .get(`/api/trips/${tripId}`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(404);

    const membersRes = await request(app)
      .get(`/api/trips/${tripId}/members`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(membersRes.status).toBe(404);
  });

  it('records expenses with equal and custom splits and converts foreign currency via provider', async () => {
    // 1. Owner pays 3000 INR for hotel, split equally
    const exp1 = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amount: 3000,
        currency: 'INR',
        description: 'Riverside Cottage Stay',
        category: 'accommodation',
        date: '2026-11-02',
        splitMethod: 'equal',
        participants: [{ user: ownerId }, { user: friendId }],
      });

    expect(exp1.status).toBe(201);
    expect(exp1.body.data.expense.convertedAmount).toBe(3000);
    expect(exp1.body.data.expense.participants[0].shareAmount).toBe(1500);
    expect(exp1.body.data.expense.participants[1].shareAmount).toBe(1500);

    // 2. Friend pays $20 USD for rafting gear (Mock rate: 83.5 -> 1670 INR), split equally
    const exp2 = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${friendToken}`)
      .send({
        amount: 20,
        currency: 'USD',
        description: 'Rafting helmets and gear',
        category: 'activities',
        date: '2026-11-03',
        splitMethod: 'equal',
        participants: [{ user: ownerId }, { user: friendId }],
      });

    expect(exp2.status).toBe(201);
    expect(exp2.body.data.expense.exchangeRate).toBe(83.5);
    expect(exp2.body.data.expense.convertedAmount).toBe(1670);
    expect(exp2.body.data.expense.exchangeRateSource).toContain('Mock European Central Bank');
  });

  it('computes deterministic balance breakdown and settlement suggestions', async () => {
    const res = await request(app)
      .get(`/api/trips/${tripId}/expenses`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    const { expenses, summary } = res.body.data;
    expect(expenses.length).toBeGreaterThanOrEqual(2);
    // Total expense: 3000 + 1670 = 4670 INR
    expect(summary.totalExpense).toBe(4670);
    expect(summary.currency).toBe('INR');

    // Rahul paid 3000, consumed 1500 + 835 = 2335 -> Net: +665 INR (is owed 665)
    // Vaishnavi paid 1670, consumed 1500 + 835 = 2335 -> Net: -665 INR (owes 665)
    expect(summary.settlements).toHaveLength(1);
    const settlement = summary.settlements[0];
    expect(settlement.from.userId).toBe(friendId);
    expect(settlement.to.userId).toBe(ownerId);
    expect(settlement.amount).toBe(665);
    expect(settlement.currency).toBe('INR');
  });

  it('prevents unauthorized members from deleting others expenses', async () => {
    // Owner creates expense
    const exp = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        amount: 500,
        currency: 'INR',
        description: 'Highway tolls',
        category: 'transport',
        date: '2026-11-01',
      });
    const expId = exp.body.data.expense._id;

    // Friend tries to delete owner expense
    const delRes = await request(app)
      .delete(`/api/trips/${tripId}/expenses/${expId}`)
      .set('Origin', origin)
      .set('Authorization', `Bearer ${friendToken}`);

    expect(delRes.status).toBe(403);
  });
});
