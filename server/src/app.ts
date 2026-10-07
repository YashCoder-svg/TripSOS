import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { imageRoutes } from './routes/imageRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { tripRoutes } from './routes/tripRoutes.js';
import { placeRoutes } from './routes/placeRoutes.js';
import { weatherRoutes } from './routes/weatherRoutes.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(['/api/auth', '/api/users'], (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use('/api/trips', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const path = req.originalUrl
      .split('?')[0]!
      .replace(/(\/emergency-contacts\/)[^/]+/g, '$1:redacted');
    logger.info(
      {
        method: req.method,
        path,
        statusCode: res.statusCode,
        responseTimeMs: Date.now() - startedAt,
      },
      'HTTP request completed',
    );
  });
  next();
});
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);
app.use('/api/health', healthRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/weather', weatherRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
