import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');

const { app } = await import('../src/app.js');

describe('GET /api/health', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('reports that the API is running', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'tripsos-api' },
    });
    expect(response.body.data.timestamp).toEqual(expect.any(String));
  });
});
