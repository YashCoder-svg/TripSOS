import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');
const { app } = await import('../src/app.js');

describe('GET /api/images/random', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns a clean fallback response when the image provider is not configured', async () => {
    const response = await request(app).get('/api/images/random?slot=hero');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { photo: null } });
  });

  it('rejects unknown image slots', async () => {
    const response = await request(app).get('/api/images/random?slot=unknown');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });
});
