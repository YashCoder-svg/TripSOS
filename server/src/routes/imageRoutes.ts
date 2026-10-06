import { Router } from 'express';
import { z } from 'zod';
import { getPhotoForSlot, isPhotoSlot } from '../services/imageProviderService.js';
import { AppError } from '../types/errors.js';

export const imageRoutes = Router();
const querySchema = z.object({ slot: z.string().min(1).max(20) });

imageRoutes.get('/random', async (req, res, next) => {
  try {
    const { slot } = querySchema.parse(req.query);
    if (!isPhotoSlot(slot)) throw new AppError(400, 'VALIDATION_ERROR', 'Unknown photography slot');
    const photo = await getPhotoForSlot(slot);
    res.status(200).json({ success: true, data: { photo } });
  } catch (error) {
    if (error instanceof AppError && error.code.startsWith('IMAGE_PROVIDER_')) {
      res.status(200).json({ success: true, data: { photo: null } });
      return;
    }
    next(error);
  }
});
