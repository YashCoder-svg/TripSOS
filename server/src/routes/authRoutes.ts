import { Router, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import {
  login,
  publicUser,
  refreshCookieName,
  refreshLifetimeMs,
  register,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../services/authService.js';
import { AppError } from '../types/errors.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';
import { requireAuth, requireTrustedOrigin } from '../middleware/requireAuth.js';
import { User } from '../models/User.js';

export const authRoutes = Router();

const authLimiter = (limit: number) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.NODE_ENV === 'test' ? 1000 : limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again later.' },
      }),
  });
const registrationLimiter = authLimiter(5);
const loginLimiter = authLimiter(10);
const refreshLimiter = authLimiter(30);
const logoutLimiter = authLimiter(20);

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.COOKIE_SAME_SITE,
  path: '/api/auth',
  maxAge: refreshLifetimeMs,
};

function getRefreshCookie(req: Request) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== refreshCookieName) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(refreshCookieName, token, cookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    path: '/api/auth',
  });
}

authRoutes.post('/register', registrationLimiter, requireTrustedOrigin, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await register(input);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      next(
        new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.'),
      );
      return;
    }
    next(error);
  }
});

authRoutes.post('/login', loginLimiter, requireTrustedOrigin, async (req, res, next) => {
  try {
    const result = await login(loginSchema.parse(req.body));
    setRefreshCookie(res, result.refreshToken);
    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken } });
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/refresh', refreshLimiter, requireTrustedOrigin, async (req, res, next) => {
  try {
    const token = getRefreshCookie(req);
    if (!token) {
      res.json({ success: true, data: { authenticated: false } });
      return;
    }
    const result = await rotateRefreshToken(token);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      success: true,
      data: { authenticated: true, user: result.user, accessToken: result.accessToken },
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) clearRefreshCookie(res);
    next(error);
  }
});

authRoutes.post('/logout', logoutLimiter, requireTrustedOrigin, async (req, res, next) => {
  try {
    await revokeRefreshToken(getRefreshCookie(req));
    clearRefreshCookie(res);
    res.json({ success: true, data: { loggedOut: true } });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
});

authRoutes.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth!.userId);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Sign in to continue.');
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});
