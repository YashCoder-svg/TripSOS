import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { weatherService } from '../services/weather/weatherService.js';
import { weatherQuerySchema } from '../validators/weatherValidators.js';

export const weatherRoutes = Router();

weatherRoutes.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many weather requests. Please wait a moment.',
      },
    },
  }),
);

// GET /api/weather?lat=...&lon=...&startDate=...&endDate=...
weatherRoutes.get('/', async (req, res, next) => {
  try {
    const params = weatherQuerySchema.parse(req.query);
    const data = await weatherService.getWeather(
      params.lat,
      params.lon,
      params.startDate,
      params.endDate,
    );
    res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});
