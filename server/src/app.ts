import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/healthRoutes.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
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
app.use(notFoundHandler);
app.use(errorHandler);
