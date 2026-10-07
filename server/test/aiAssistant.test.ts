import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type {
  LocationProvider,
  PlaceSearchParams,
  PlaceSearchResult,
} from '../src/services/location/types.js';
import type { WeatherData, WeatherProvider } from '../src/services/weather/types.js';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-ai-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');
const { Trip } = await import('../src/models/Trip.js');
const { User } = await import('../src/models/User.js');
const { ItineraryItem } = await import('../src/models/ItineraryItem.js');
const { Expense } = await import('../src/models/Expense.js');
const { locationService } = await import('../src/services/location/locationService.js');
const { weatherService } = await import('../src/services/weather/weatherService.js');
const { detectPlaceCategory, pickPlanDate } =
  await import('../src/services/ai/aiAssistantService.js');

class MockLocationProvider implements LocationProvider {
  readonly name = 'mock-ai-location';
  async geocode() {
    return [];
  }
  async reverseGeocode() {
    return null;
  }
  async getPlaceDetails() {
    return null;
  }
  async searchPlaces(params: PlaceSearchParams): Promise<PlaceSearchResult> {
    const cat = params.category ?? 'all';
    return {
      center: { latitude: params.latitude, longitude: params.longitude },
      source: 'Mock OpenStreetMap',
      results: [1, 2].map((n) => ({
        provider: 'mock',
        providerId: `${cat}-${n}`,
        name: `${cat} place ${n}`,
        category: cat,
        latitude: params.latitude + n * 0.001,
        longitude: params.longitude,
        distanceMeters: n * 300,
        address: `Mall Road ${n}`,
      })),
    };
  }
}

class MockWeatherProvider implements WeatherProvider {
  readonly name = 'mock-ai-weather';
  async getWeather(latitude: number, longitude: number, startDate?: string): Promise<WeatherData> {
    const day = {
      date: startDate ?? '2026-10-10',
      temperatureMax: 19,
      temperatureMin: 8,
      precipitationProbability: 20,
      condition: 'Partly cloudy',
      weatherCode: 2,
      icon: 'partly_cloudy' as const,
    };
    return {
      provider: 'Mock Weather',
      location: { latitude, longitude },
      current: {
        temperature: 15.2,
        apparentTemperature: 14,
        humidity: 60,
        windSpeed: 8,
        condition: 'Mainly clear',
        weatherCode: 1,
        icon: 'clear',
      },
      daily: [day],
      tripForecast: startDate ? [day] : undefined,
      forecastAvailableForDates: true,
    };
  }
}

let mongo: MongoMemoryServer;
let userAToken: string;
let userBToken: string;
let tripAId: string;

beforeAll(async () => {
  locationService.setProvider(new MockLocationProvider());
  weatherService.setProvider(new MockWeatherProvider());
  mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.init(), Trip.init(), ItineraryItem.init(), Expense.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Trip.deleteMany({});
  await ItineraryItem.deleteMany({});
  await Expense.deleteMany({});

  const resA = await request(app).post('/api/auth/register').send({
    name: 'Vaishnavi',
    email: 'vaishnavi@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });
  userAToken = resA.body.data.accessToken;

  const resB = await request(app).post('/api/auth/register').send({
    name: 'Rohan',
    email: 'rohan@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });
  userBToken = resB.body.data.accessToken;

  const tripRes = await request(app)
    .post('/api/trips')
    .set('Authorization', `Bearer ${userAToken}`)
    .send({
      name: 'Manali Expedition',
      destinationName: 'Manali, Himachal Pradesh',
      destinationCountry: 'India',
      destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
      startDate: '2026-10-10',
      endDate: '2026-10-15',
      travelerCount: 2,
      budget: 25000,
      currency: 'INR',
      travelStyle: 'adventure',
      interests: ['nature'],
    });
  tripAId = tripRes.body.data.trip._id;
});

describe('Phase 10: AI Travel Assistant', () => {
  it('triggers emergency safeguard with authoritative numbers for anonymous users with location', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: 'I am hurt and there is an emergency! Where is the hospital?',
        location: { latitude: 32.2396, longitude: 77.1887 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('URGENT SAFETY NOTICE');
    expect(res.body.data.reply).toContain('112');
    // Hospitals come only from the (mocked) provider
    expect(res.body.data.reply).toContain('hospitals place 1');

    const emergencyTool = res.body.data.toolCalls.find(
      (tc: { tool: string }) => tc.tool === 'getEmergencyServices',
    );
    expect(emergencyTool).toBeDefined();
  });

  it('never exposes private trip context to anonymous callers', async () => {
    const res = await request(app).post('/api/ai/chat').send({
      tripId: tripAId,
      message: 'How much have we spent on this trip?',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).not.toContain('Manali');
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getTrip')).toBe(
      false,
    );
  });

  it('never exposes a trip to an authenticated non-member', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ tripId: tripAId, message: 'How much have we spent?' });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).not.toContain('Total trip expenses');
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getTrip')).toBe(
      false,
    );
  });

  it('provides grounded weather forecasts via weather tool', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        tripId: tripAId,
        message: 'What is the weather forecast for our trip?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('Weather for Manali');
    expect(res.body.data.reply).toContain('Mainly clear');
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getWeather')).toBe(
      true,
    );
  });

  it('does not treat "train" as a weather question', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ tripId: tripAId, message: 'Where is the nearest train?' });

    expect(res.status).toBe(200);
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getWeather')).toBe(
      false,
    );
    const placeCall = res.body.data.toolCalls.find(
      (tc: { tool: string }) => tc.tool === 'getNearbyPlaces',
    );
    expect(placeCall.parameters.category).toBe('transport');
  });

  it('calculates deterministic trip expense totals and member settlements', async () => {
    // Record an expense first
    await request(app)
      .post(`/api/trips/${tripAId}/expenses`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        description: 'Cabin stay',
        amount: 5000,
        currency: 'INR',
        category: 'accommodation',
        date: '2026-10-11',
        splitMethod: 'equal',
      });

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        tripId: tripAId,
        message: 'How much have we spent so far on this trip?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('5,000');
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getExpenses')).toBe(
      true,
    );
  });

  it('suggests a grounded itinerary plan with structured, valid action proposals', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        tripId: tripAId,
        message: 'Plan tomorrow for me in Manali',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('Plan for');
    expect(res.body.data.toolCalls.some((tc: { tool: string }) => tc.tool === 'getItinerary')).toBe(
      true,
    );
    const actions = res.body.data.suggestedActions as Array<{
      data: { category: string; date: string; title: string };
    }>;
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) {
      expect(a.data.category).toBe('food');
      expect(a.data.date >= '2026-10-10' && a.data.date <= '2026-10-15').toBe(true);
    }

    // A suggested action round-trips through the confirmation endpoint
    const exec = await request(app)
      .post('/api/ai/action/execute')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ tripId: tripAId, actionType: 'add_itinerary_item', data: actions[0]!.data });
    expect(exec.status).toBe(201);
    expect(exec.body.data.item.title).toBe(actions[0]!.data.title);
  });

  it('does not modify the itinerary without explicit approval', async () => {
    await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ tripId: tripAId, message: 'Plan tomorrow for me' });

    expect(await ItineraryItem.countDocuments({ trip: tripAId })).toBe(0);
  });

  it('allows user to approve and execute a suggested itinerary action', async () => {
    const executeRes = await request(app)
      .post('/api/ai/action/execute')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        tripId: tripAId,
        actionType: 'add_itinerary_item',
        data: {
          title: 'Morning Trek to Jogini Falls',
          description: 'Hike through apple orchards',
          date: '2026-10-11',
          startTime: '09:00',
          endTime: '12:00',
          location: 'Jogini Falls',
          category: 'activity',
        },
      });

    expect(executeRes.status).toBe(201);
    expect(executeRes.body.success).toBe(true);
    expect(executeRes.body.data.executed).toBe(true);
    expect(executeRes.body.data.item.title).toBe('Morning Trek to Jogini Falls');

    // Verify persisted in database
    const saved = await ItineraryItem.findOne({
      trip: tripAId,
      title: 'Morning Trek to Jogini Falls',
    });
    expect(saved).not.toBeNull();
  });

  it('blocks unauthorized users from executing AI actions on other users trips', async () => {
    const executeRes = await request(app)
      .post('/api/ai/action/execute')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        tripId: tripAId,
        actionType: 'add_itinerary_item',
        data: {
          title: 'Unauthorized Action',
          date: '2026-10-11',
          startTime: '10:00',
          category: 'activity',
        },
      });

    expect(executeRes.status).toBe(404);
  });
});

describe('AI assistant helpers', () => {
  it('maps text to supported provider categories only', () => {
    expect(detectPlaceCategory('find a vegetarian restaurant near me')).toBe('food');
    expect(detectPlaceCategory('any good coffee around?')).toBe('cafes');
    expect(detectPlaceCategory('i need a pharmacy')).toBe('pharmacies');
    expect(detectPlaceCategory('what a great view')).toBeNull();
  });

  it('keeps plan dates inside the trip range', () => {
    const now = new Date('2026-10-12T08:00:00Z');
    expect(pickPlanDate('plan tomorrow', '2026-10-10', '2026-10-15', now)).toBe('2026-10-13');
    expect(pickPlanDate('plan tomorrow', '2026-11-01', '2026-11-05', now)).toBe('2026-11-01');
    expect(pickPlanDate('plan today', '2026-10-01', '2026-10-05', now)).toBe('2026-10-01');
  });
});
