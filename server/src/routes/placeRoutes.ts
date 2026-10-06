import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { locationService } from '../services/location/locationService.js';
import { AppError } from '../types/errors.js';
import {
  geocodeQuerySchema,
  placeNearbySchema,
  placeSearchSchema,
  reverseGeocodeSchema,
} from '../validators/placeValidators.js';

export const placeRoutes = Router();

// Dedicated rate limiting for place discovery endpoints
placeRoutes.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many search requests. Please wait a moment.',
      },
    },
  }),
);

// GET /api/places/geocode?q=Manali
placeRoutes.get('/geocode', async (req, res, next) => {
  try {
    const { q, limit } = geocodeQuerySchema.parse(req.query);
    const results = await locationService.geocode(q, limit);
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    res.json({
      success: true,
      data: {
        results,
        source: locationService.getProviderName(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/places/reverse?lat=32.24&lon=77.18
placeRoutes.get('/reverse', async (req, res, next) => {
  try {
    const { lat, lon } = reverseGeocodeSchema.parse(req.query);
    const result = await locationService.reverseGeocode(lat, lon);
    if (!result) {
      throw new AppError(404, 'LOCATION_NOT_FOUND', 'Could not resolve location address.');
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      data: {
        result,
        source: locationService.getProviderName(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/places/search?lat=...&lon=...&q=...&category=...&radius=...
placeRoutes.get('/search', async (req, res, next) => {
  try {
    const params = placeSearchSchema.parse(req.query);
    const result = await locationService.searchPlaces({
      latitude: params.lat,
      longitude: params.lon,
      query: params.q,
      category: params.category,
      radiusMeters: params.radius,
      limit: params.limit,
    });
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/places/nearby?lat=...&lon=...&category=hospital&radius=...
placeRoutes.get('/nearby', async (req, res, next) => {
  try {
    const params = placeNearbySchema.parse(req.query);
    const result = await locationService.getNearbyPlaces(
      params.lat,
      params.lon,
      params.category,
      params.radius,
      params.limit,
    );
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/places/:providerId
placeRoutes.get('/:providerId', async (req, res, next) => {
  try {
    const providerId = req.params.providerId;
    if (!providerId || providerId.length > 120) {
      throw new AppError(400, 'INVALID_PROVIDER_ID', 'Invalid place identifier.');
    }
    const details = await locationService.getPlaceDetails(providerId);
    if (!details) {
      throw new AppError(404, 'PLACE_NOT_FOUND', 'Place details unavailable.');
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      data: {
        place: details,
        source: locationService.getProviderName(),
      },
    });
  } catch (error) {
    next(error);
  }
});
