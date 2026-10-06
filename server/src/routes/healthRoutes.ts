import { Router } from 'express';

export const healthRoutes = Router();
healthRoutes.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', service: 'tripsos-api', timestamp: new Date().toISOString() },
  });
});
