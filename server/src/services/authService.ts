import argon2 from 'argon2';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { User } from '../models/User.js';
import { AppError } from '../types/errors.js';
import type { LoginInput, RegisterInput } from '../validators/authValidators.js';

const issuer = 'tripsos-api';
const audience = 'tripsos-client';
export const refreshCookieName = 'tripsos_refresh';
export const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const unauthorized = () =>
  new AppError(401, 'INVALID_SESSION', 'Your session is invalid or has expired.');

export function publicUser(user: {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  profilePhoto?: string | null;
  language: string;
  travelPreferences?: unknown;
  createdAt: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto ?? null,
    language: user.language,
    travelPreferences: user.travelPreferences,
    createdAt: user.createdAt,
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function tokenMatches(token: string, expectedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  return timingSafeEqual(Buffer.from(hashToken(token), 'hex'), Buffer.from(expectedHash, 'hex'));
}

function signRefreshToken(userId: string, sessionId: string, jti: string): string {
  return jwt.sign({ sub: userId, sid: sessionId, jti, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer,
    audience,
  });
}

export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer,
      audience,
    }) as JwtPayload;
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') throw unauthorized();
    return payload.sub;
  } catch {
    throw unauthorized();
  }
}

function createAccessToken(userId: string): string {
  return jwt.sign({ typ: 'access' }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: '15m',
    issuer,
    audience,
  });
}

async function createSession(userId: string) {
  const jti = randomUUID();
  const session = new RefreshSession({
    userId,
    familyId: randomUUID(),
    tokenHash: 'pending',
    currentJti: jti,
    expiresAt: new Date(Date.now() + refreshLifetimeMs),
  });
  const refreshToken = signRefreshToken(userId, session.id, jti);
  session.tokenHash = hashToken(refreshToken);
  await session.save();
  return { refreshToken, accessToken: createAccessToken(userId) };
}

export async function register(input: RegisterInput) {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  const user = await User.create({ name: input.name, email: input.email, passwordHash });
  try {
    const tokens = await createSession(user.id);
    return { user: publicUser(user), ...tokens };
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  const tokens = await createSession(user.id);
  return { user: publicUser(user), ...tokens };
}

function verifyRefreshToken(token: string, ignoreExpiration = false): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer,
      audience,
      ignoreExpiration,
    }) as JwtPayload;
  } catch {
    return null;
  }
}

export async function rotateRefreshToken(token: string) {
  const claims = verifyRefreshToken(token);
  if (
    !claims ||
    claims.typ !== 'refresh' ||
    typeof claims.sub !== 'string' ||
    typeof claims.sid !== 'string' ||
    typeof claims.jti !== 'string' ||
    !mongoose.isValidObjectId(claims.sid)
  ) {
    throw unauthorized();
  }

  const session = await RefreshSession.findById(claims.sid).select(
    '+tokenHash +currentJti +previousJti',
  );
  if (
    !session ||
    session.status !== 'active' ||
    session.userId.toString() !== claims.sub ||
    session.expiresAt.getTime() <= Date.now()
  ) {
    throw unauthorized();
  }

  const matches = session.currentJti === claims.jti && tokenMatches(token, session.tokenHash);
  if (!matches) {
    if (session.previousJti === claims.jti) {
      await RefreshSession.updateOne(
        { _id: session._id, status: 'active' },
        { $set: { status: 'revoked', revokedAt: new Date() } },
      );
    }
    throw unauthorized();
  }

  const nextJti = randomUUID();
  const nextToken = signRefreshToken(claims.sub, session.id, nextJti);
  const updated = await RefreshSession.findOneAndUpdate(
    {
      _id: session._id,
      status: 'active',
      currentJti: claims.jti,
      tokenHash: hashToken(token),
    },
    {
      $set: {
        tokenHash: hashToken(nextToken),
        currentJti: nextJti,
        previousJti: claims.jti,
        expiresAt: new Date(Date.now() + refreshLifetimeMs),
      },
    },
    { new: true },
  );
  if (!updated) {
    const latest = await RefreshSession.findById(session._id).select('+previousJti');
    if (latest?.previousJti === claims.jti) {
      await RefreshSession.updateOne(
        { _id: session._id, status: 'active' },
        { $set: { status: 'revoked', revokedAt: new Date() } },
      );
    }
    throw unauthorized();
  }

  const user = await User.findById(claims.sub);
  if (!user) {
    await RefreshSession.updateOne(
      { _id: session._id },
      { $set: { status: 'revoked', revokedAt: new Date() } },
    );
    throw unauthorized();
  }
  return {
    user: publicUser(user),
    refreshToken: nextToken,
    accessToken: createAccessToken(user.id),
  };
}

export async function revokeRefreshToken(token: string | undefined): Promise<void> {
  if (!token) return;
  const claims = verifyRefreshToken(token, true);
  if (
    !claims ||
    claims.typ !== 'refresh' ||
    typeof claims.sub !== 'string' ||
    typeof claims.sid !== 'string' ||
    !mongoose.isValidObjectId(claims.sid)
  ) {
    return;
  }
  await RefreshSession.updateOne(
    { _id: claims.sid, userId: claims.sub, status: 'active' },
    { $set: { status: 'revoked', revokedAt: new Date() } },
  );
}
