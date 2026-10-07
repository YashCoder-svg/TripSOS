import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { optionalAuth } from '../middleware/requireAuth.js';
import { EmergencySession } from '../models/EmergencySession.js';
import { LocationShare } from '../models/LocationShare.js';
import { locationService } from '../services/location/locationService.js';
import { lookupEmergencyNumbers } from '../services/emergency/authoritativeNumbers.js';
import { AppError } from '../types/errors.js';
import {
  createEmergencySessionSchema,
  createLocationShareSchema,
  emergencyNumbersQuerySchema,
  nearbyEmergencyQuerySchema,
  tokenParamSchema,
  updateEmergencySessionStatusSchema,
} from '../validators/emergencyValidators.js';
import type { PlaceCategory, PlaceSummary } from '../services/location/types.js';

export const emergencyRoutes = Router();

// Dedicated rate limiting for emergency endpoints (high limit to prevent blocking emergency actions)
emergencyRoutes.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment.',
      },
    },
  }),
);

// POST /api/emergency/sessions (Starts an emergency session, open to guests & logged-in users)
emergencyRoutes.post('/sessions', optionalAuth, async (req, res, next) => {
  try {
    const input = createEmergencySessionSchema.parse(req.body);
    const locationSnapshot =
      typeof input.latitude === 'number' && typeof input.longitude === 'number'
        ? {
            latitude: input.latitude,
            longitude: input.longitude,
            accuracyMeters: input.accuracyMeters,
          }
        : undefined;

    const session = await EmergencySession.create({
      user: req.auth?.userId ?? null,
      type: input.type,
      locationSnapshot,
      notes: input.notes,
      startedAt: new Date(),
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/emergency/sessions/:sessionId/status (Resolve or cancel emergency session)
emergencyRoutes.patch('/sessions/:sessionId/status', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Emergency session not found.');
    }

    const input = updateEmergencySessionStatusSchema.parse(req.body);

    const session = await EmergencySession.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          status: input.status,
          endedAt: new Date(),
          ...(input.notes ? { notes: input.notes } : {}),
        },
      },
      { new: true },
    );

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Emergency session not found.');
    }

    res.json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/services?lat=...&lon=...&category=...&radius=...
emergencyRoutes.get('/services', async (req, res, next) => {
  try {
    const params = nearbyEmergencyQuerySchema.parse(req.query);

    let services: PlaceSummary[] = [];

    if (params.category === 'all') {
      const categoriesToSearch: PlaceCategory[] = ['hospitals', 'police', 'pharmacies'];
      const searchResults = await Promise.all(
        categoriesToSearch.map((cat) =>
          locationService
            .getNearbyPlaces(params.lat, params.lon, cat, params.radius, 10)
            .then((r) => r.results)
            .catch(() => [] as PlaceSummary[]),
        ),
      );

      // Flatten and sort by distance
      services = searchResults
        .flat()
        .sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999))
        .slice(0, params.limit);
    } else {
      const result = await locationService.getNearbyPlaces(
        params.lat,
        params.lon,
        params.category as PlaceCategory,
        params.radius,
        params.limit,
      );
      services = result.results;
    }

    res.json({
      success: true,
      data: {
        services,
        source: locationService.getProviderName(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/numbers?country=...&countryCode=...
emergencyRoutes.get('/numbers', (req, res, next) => {
  try {
    const params = emergencyNumbersQuerySchema.parse(req.query);
    const countryQuery = params.countryCode || params.country;
    const numbers = lookupEmergencyNumbers(countryQuery);

    res.json({
      success: true,
      data: {
        numbers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/emergency/share (Explicit user-triggered location sharing)
emergencyRoutes.post('/share', optionalAuth, async (req, res, next) => {
  try {
    const input = createLocationShareSchema.parse(req.body);

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + input.durationMinutes * 60 * 1000);

    let sessionObjectId: mongoose.Types.ObjectId | null = null;
    if (input.sessionId && mongoose.isValidObjectId(input.sessionId)) {
      sessionObjectId = new mongoose.Types.ObjectId(input.sessionId);
    }

    const share = await LocationShare.create({
      token,
      user: req.auth?.userId ?? null,
      sessionId: sessionObjectId,
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters ?? null,
        address: input.address ?? null,
      },
      note: input.note || 'Emergency SOS location snapshot',
      durationMinutes: input.durationMinutes,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: {
        token: share.token,
        sharePath: `/emergency/share/${share.token}`,
        durationMinutes: share.durationMinutes,
        expiresAt: share.expiresAt,
        location: share.location,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/emergency/share/:token/revoke (Revoke active location share link)
emergencyRoutes.post('/share/:token/revoke', optionalAuth, async (req, res, next) => {
  try {
    const { token } = tokenParamSchema.parse(req.params);

    const share = await LocationShare.findOne({ token });
    if (!share) {
      throw new AppError(404, 'SHARE_NOT_FOUND', 'Emergency location share link not found.');
    }

    // If caller is authenticated and share is tied to a user, enforce ownership
    if (share.user && req.auth?.userId && share.user.toString() !== req.auth.userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to revoke this share link.');
    }

    if (!share.revokedAt) {
      share.revokedAt = new Date();
      await share.save();
    }

    res.json({
      success: true,
      data: {
        revoked: true,
        revokedAt: share.revokedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/share/:token (Publicly view shared emergency location - minimal safe data only)
emergencyRoutes.get('/share/:token', async (req, res, next) => {
  try {
    const { token } = tokenParamSchema.parse(req.params);

    const share = await LocationShare.findOne({ token });
    if (!share) {
      throw new AppError(
        404,
        'SHARE_NOT_FOUND',
        'This emergency location share link was not found.',
      );
    }

    if (share.revokedAt) {
      throw new AppError(
        410,
        'SHARE_REVOKED',
        'This emergency location share link has been revoked by the sender.',
      );
    }

    if (new Date() > share.expiresAt) {
      throw new AppError(410, 'SHARE_EXPIRED', 'This emergency location share link has expired.');
    }

    if (!share.location) {
      throw new AppError(
        404,
        'SHARE_NOT_FOUND',
        'This emergency location share link has no valid coordinates.',
      );
    }

    // Expose ONLY minimal necessary location info. No user account data or contacts.
    res.json({
      success: true,
      data: {
        location: {
          latitude: share.location.latitude,
          longitude: share.location.longitude,
          accuracyMeters: share.location.accuracyMeters,
          address: share.location.address,
        },
        note: share.note,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        durationMinutes: share.durationMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
});
