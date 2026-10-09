import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/requireAuth.js';
import { SavedPlace } from '../models/SavedPlace.js';
import { AppError } from '../types/errors.js';
import { z } from 'zod';

export const savedPlaceRoutes = Router();
savedPlaceRoutes.use(requireAuth);

const savePlaceSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  address: z.string().max(250).optional().default(''),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  providerId: z.string().max(120).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  website: z.string().max(250).optional().nullable(),
  userNotes: z.string().max(500).optional().default(''),
  tripId: z.string().optional().nullable(),
});

savedPlaceRoutes.get('/', async (req, res, next) => {
  try {
    const query: Record<string, unknown> = { user: req.auth!.userId };
    if (req.query.tripId && mongoose.isValidObjectId(req.query.tripId as string)) {
      query.trip = req.query.tripId;
    }
    if (req.query.category && typeof req.query.category === 'string') {
      query.category = req.query.category;
    }

    const places = await SavedPlace.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        places: places.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
          category: p.category,
          address: p.address,
          coordinates: p.coordinates,
          providerId: p.providerId,
          phone: p.phone,
          website: p.website,
          userNotes: p.userNotes,
          tripId: p.trip ? p.trip.toString() : null,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

savedPlaceRoutes.post('/', async (req, res, next) => {
  try {
    const input = savePlaceSchema.parse(req.body);

    // If already saved with same providerId or name + coords for this user
    let existing = null;
    if (input.providerId) {
      existing = await SavedPlace.findOne({
        user: req.auth!.userId,
        providerId: input.providerId,
      });
    }

    if (existing) {
      if (input.userNotes) {
        existing.userNotes = input.userNotes;
        await existing.save();
      }
      return res.json({
        success: true,
        data: { place: existing, alreadySaved: true },
      });
    }

    const created = await SavedPlace.create({
      user: req.auth!.userId,
      trip: input.tripId && mongoose.isValidObjectId(input.tripId) ? input.tripId : null,
      name: input.name,
      category: input.category,
      address: input.address,
      coordinates: input.coordinates,
      providerId: input.providerId ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      userNotes: input.userNotes ?? '',
    });

    res.status(201).json({
      success: true,
      data: { place: created },
    });
  } catch (error) {
    next(error);
  }
});

savedPlaceRoutes.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError(404, 'PLACE_NOT_FOUND', 'Saved place not found.');
    }

    const deleted = await SavedPlace.findOneAndDelete({
      _id: req.params.id,
      user: req.auth!.userId,
    });

    if (!deleted) {
      throw new AppError(404, 'PLACE_NOT_FOUND', 'Saved place not found.');
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
});
