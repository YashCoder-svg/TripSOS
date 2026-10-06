import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '4000');
vi.stubEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/tripsos-test');
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-long-enough-123');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-long-enough-123');
vi.stubEnv('CLIENT_URL', 'http://localhost:5173');
vi.stubEnv('UNSPLASH_ACCESS_KEY', '');

const { app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { RefreshSession } = await import('../src/models/RefreshSession.js');
const { EmergencyContact } = await import('../src/models/EmergencyContact.js');

const trustedOrigin = 'http://localhost:5173';
const validRegistration = {
  name: 'Alex Traveler',
  email: 'Alex@example.com',
  password: 'JourneySafe2026',
  confirmPassword: 'JourneySafe2026',
};

function post(path: string, body?: unknown) {
  const result = request(app).post(path).set('Origin', trustedOrigin);
  return body === undefined ? result : result.send(body);
}

function refreshCookie(response: request.Response): string {
  const cookie = response.headers['set-cookie']?.find((value: string) =>
    value.startsWith('tripsos_refresh='),
  );
  if (!cookie) throw new Error('Expected refresh cookie.');
  return cookie.split(';', 1)[0]!;
}

async function registerAndGetSession(email = validRegistration.email) {
  const response = await post('/api/auth/register', { ...validRegistration, email });
  return {
    response,
    cookie: refreshCookie(response),
    token: response.body.data.accessToken as string,
  };
}

describe('authentication and account APIs', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), RefreshSession.init(), EmergencyContact.init()]);
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    vi.unstubAllEnvs();
  });

  it('registers with an Argon2id hash and an HTTP-only refresh cookie', async () => {
    const { response, cookie, token } = await registerAndGetSession();
    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      name: 'Alex Traveler',
      email: 'alex@example.com',
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('refreshToken');
    expect(token).toEqual(expect.any(String));
    expect(cookie).toContain('tripsos_refresh=');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    const user = await User.findOne({ email: 'alex@example.com' }).select('+passwordHash');
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user?.passwordHash).not.toBe(validRegistration.password);
    expect(await RefreshSession.countDocuments({ userId: user?._id, status: 'active' })).toBe(1);
    const session = await RefreshSession.findOne({ userId: user?._id }).select('+tokenHash');
    expect(session?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(session?.tokenHash).not.toBe(cookie.slice('tripsos_refresh='.length));
  });

  it('rejects duplicate normalized emails and mismatched passwords', async () => {
    await registerAndGetSession('duplicate@example.com');
    const duplicate = await post('/api/auth/register', {
      ...validRegistration,
      email: ' DUPLICATE@example.com ',
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect((await User.find({ email: 'duplicate@example.com' })).length).toBe(1);

    const mismatch = await post('/api/auth/register', {
      ...validRegistration,
      email: 'mismatch@example.com',
      confirmPassword: 'DifferentPass2026',
    });
    expect(mismatch.status).toBe(400);
    expect(JSON.stringify(mismatch.body)).not.toContain(validRegistration.password);
    expect(mismatch.body.error.details[0]).not.toHaveProperty('input');
  });

  it('uses the same generic login error for unknown email and wrong password', async () => {
    await registerAndGetSession('login@example.com');
    const wrongPassword = await post('/api/auth/login', {
      email: 'login@example.com',
      password: 'IncorrectPass2026',
    });
    const unknownEmail = await post('/api/auth/login', {
      email: 'nobody@example.com',
      password: 'IncorrectPass2026',
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Invalid email or password.');
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('logs in with normalized email and exposes only an access token in JSON', async () => {
    await registerAndGetSession('signin@example.com');
    const response = await post('/api/auth/login', {
      email: '  SIGNIN@example.com  ',
      password: validRegistration.password,
    });
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('signin@example.com');
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data).not.toHaveProperty('refreshToken');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('rejects requests from an untrusted browser origin', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://attacker.example')
      .send({ ...validRegistration, email: 'csrf@example.com' });
    expect(response.status).toBe(403);
    expect(await User.exists({ email: 'csrf@example.com' })).toBeNull();
  });

  it('rotates refresh credentials and revokes a session when its previous token is reused', async () => {
    const { cookie, response } = await registerAndGetSession('rotate@example.com');
    const rotated = await post('/api/auth/refresh').set('Cookie', cookie);
    expect(rotated.status).toBe(200);
    expect(rotated.body.data.accessToken).toEqual(expect.any(String));
    const currentCookie = refreshCookie(rotated);
    expect(currentCookie).not.toBe(cookie);

    const replay = await post('/api/auth/refresh').set('Cookie', cookie);
    expect(replay.status).toBe(401);
    const currentAttempt = await post('/api/auth/refresh').set('Cookie', currentCookie);
    expect(currentAttempt.status).toBe(401);
    expect(
      await RefreshSession.countDocuments({ userId: response.body.data.user.id, status: 'active' }),
    ).toBe(0);
  });

  it('reports the normal signed-out state without an error when no refresh cookie exists', async () => {
    const response = await post('/api/auth/refresh');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ authenticated: false });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('logs out the refresh session and clears its cookie', async () => {
    const { cookie } = await registerAndGetSession('logout@example.com');
    const response = await post('/api/auth/logout').set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toContain('tripsos_refresh=;');
    expect(
      await post('/api/auth/refresh')
        .set('Cookie', cookie)
        .then((result) => result.status),
    ).toBe(401);
  });

  it('rejects a session whose server-side refresh expiry has elapsed', async () => {
    const { cookie, response } = await registerAndGetSession('expired@example.com');
    await RefreshSession.updateOne(
      { userId: response.body.data.user.id },
      { $set: { expiresAt: new Date(Date.now() - 1_000) } },
    );
    expect((await post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });

  it('requires a valid access token and updates only permitted profile fields', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const { token } = await registerAndGetSession('profile@example.com');
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.headers['cache-control']).toBe('no-store');
    expect(me.body.data.user).not.toHaveProperty('passwordHash');

    const updated = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Alex North',
        language: 'en-US',
        travelPreferences: { travelStyle: 'nature' },
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user).toMatchObject({
      name: 'Alex North',
      email: 'profile@example.com',
      language: 'en-US',
      travelPreferences: { travelStyle: 'nature' },
    });
    const forbidden = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'changed@example.com', role: 'admin' });
    expect(forbidden.status).toBe(400);
    expect((await User.findOne({ email: 'profile@example.com' }))?.email).toBe(
      'profile@example.com',
    );
  });

  it('keeps emergency contacts private, enforces ownership, and supports contact CRUD', async () => {
    const owner = await registerAndGetSession('owner@example.com');
    const other = await registerAndGetSession('other@example.com');
    expect((await request(app).get('/api/users/me/emergency-contacts')).status).toBe(401);
    const invalidPhone = await request(app)
      .post('/api/users/me/emergency-contacts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Morgan', phone: '555-0123', relationship: 'friend' });
    expect(invalidPhone.status).toBe(400);
    const created = await request(app)
      .post('/api/users/me/emergency-contacts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Morgan', phone: '+14155552671', relationship: 'friend' });
    expect(created.status).toBe(201);
    expect(created.body.data.contact.isPrimary).toBe(true);
    expect(created.body.data.contact).not.toHaveProperty('userId');
    const id = created.body.data.contact._id as string;

    const ownerMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${owner.token}`);
    expect(JSON.stringify(ownerMe.body)).not.toContain('Morgan');
    const privateList = await request(app)
      .get('/api/users/me/emergency-contacts')
      .set('Authorization', `Bearer ${other.token}`);
    expect(privateList.headers['cache-control']).toBe('no-store');
    expect(privateList.body.data.contacts).toHaveLength(0);

    const unauthorizedRead = await request(app)
      .patch(`/api/users/me/emergency-contacts/${id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ name: 'Changed' });
    expect(unauthorizedRead.status).toBe(404);
    const unauthorizedDelete = await request(app)
      .delete(`/api/users/me/emergency-contacts/${id}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(unauthorizedDelete.status).toBe(404);

    const second = await request(app)
      .post('/api/users/me/emergency-contacts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Sam', phone: '+442071838750', relationship: 'family', isPrimary: true });
    expect(second.status).toBe(201);
    expect(
      await EmergencyContact.countDocuments({
        userId: owner.response.body.data.user.id,
        isPrimary: true,
      }),
    ).toBe(1);
    const edited = await request(app)
      .patch(`/api/users/me/emergency-contacts/${id}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Morgan Lee' });
    expect(edited.body.data.contact.name).toBe('Morgan Lee');
    const deleted = await request(app)
      .delete(`/api/users/me/emergency-contacts/${id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(deleted.status).toBe(200);
    expect(await EmergencyContact.exists({ _id: id })).toBeNull();
  });
});
