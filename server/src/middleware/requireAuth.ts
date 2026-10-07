import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../types/errors.js';
import { verifyAccessToken } from '../services/authService.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    next(new AppError(401, 'UNAUTHORIZED', 'Sign in to continue.'));
    return;
  }
  try {
    req.auth = { userId: verifyAccessToken(match[1]!) };
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    next();
    return;
  }
  try {
    req.auth = { userId: verifyAccessToken(match[1]!) };
  } catch {
    // If token invalid/expired, continue as unauthenticated guest
  }
  next();
};

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin');
  if (origin && origin !== env.CLIENT_URL) {
    next(new AppError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed.'));
    return;
  }
  next();
};
