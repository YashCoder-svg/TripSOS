import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { Trip } from '../models/Trip.js';
import { ItineraryItem } from '../models/ItineraryItem.js';
import { AppError } from '../types/errors.js';
import {
  createItineraryItemSchema,
  reorderItinerarySchema,
  updateItineraryItemSchema,
} from '../validators/itineraryValidators.js';

export const itineraryRoutes = Router({ mergeParams: true });
itineraryRoutes.use(requireAuth);

function assertObjectId(id: string, errorCode: string, message: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(404, errorCode, message);
  }
}

async function verifyTripOwnership(tripId: string, userId: string) {
  assertObjectId(tripId, 'TRIP_NOT_FOUND', 'Trip not found.');
  const trip = await Trip.findOne({ _id: tripId, owner: userId });
  if (!trip) {
    throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
  }
  return trip;
}

interface ItineraryParams {
  tripId?: string;
  itemId?: string;
}

function getParams(req: { params: unknown }): ItineraryParams {
  return req.params as ItineraryParams;
}

// GET /api/trips/:tripId/itinerary
itineraryRoutes.get('/', async (req, res, next) => {
  try {
    const { tripId = '' } = getParams(req);
    await verifyTripOwnership(tripId, req.auth!.userId);

    const items = await ItineraryItem.find({ trip: tripId }).sort({
      date: 1,
      order: 1,
      startTime: 1,
      createdAt: 1,
    });

    res.json({
      success: true,
      data: {
        items,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips/:tripId/itinerary
itineraryRoutes.post('/', async (req, res, next) => {
  try {
    const { tripId = '' } = getParams(req);
    await verifyTripOwnership(tripId, req.auth!.userId);

    const input = createItineraryItemSchema.parse(req.body);

    let order = input.order;
    if (order === undefined) {
      const lastItem = await ItineraryItem.findOne({ trip: tripId, date: input.date }).sort({
        order: -1,
      });
      order = lastItem ? lastItem.order + 1 : 0;
    }

    const item = await ItineraryItem.create({
      ...input,
      trip: tripId,
      order,
    });

    res.status(201).json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/trips/:tripId/itinerary/reorder
itineraryRoutes.put('/reorder', async (req, res, next) => {
  try {
    const { tripId = '' } = getParams(req);
    await verifyTripOwnership(tripId, req.auth!.userId);

    const { items } = reorderItinerarySchema.parse(req.body);

    const operations = items
      .filter((i) => mongoose.isValidObjectId(i.id))
      .map((i) => ({
        updateOne: {
          filter: { _id: i.id, trip: tripId },
          update: { $set: { order: i.order } },
        },
      }));

    if (operations.length > 0) {
      await ItineraryItem.bulkWrite(operations);
    }

    const updatedItems = await ItineraryItem.find({ trip: tripId }).sort({
      date: 1,
      order: 1,
      startTime: 1,
    });

    res.json({
      success: true,
      data: {
        items: updatedItems,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/trips/:tripId/itinerary/:itemId
itineraryRoutes.patch('/:itemId', async (req, res, next) => {
  try {
    const { tripId = '', itemId = '' } = getParams(req);
    await verifyTripOwnership(tripId, req.auth!.userId);
    assertObjectId(itemId, 'ITEM_NOT_FOUND', 'Itinerary item not found.');

    const input = updateItineraryItemSchema.parse(req.body);

    const item = await ItineraryItem.findOneAndUpdate(
      { _id: itemId, trip: tripId },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!item) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Itinerary item not found.');
    }

    res.json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trips/:tripId/itinerary/:itemId
itineraryRoutes.delete('/:itemId', async (req, res, next) => {
  try {
    const { tripId = '', itemId = '' } = getParams(req);
    await verifyTripOwnership(tripId, req.auth!.userId);
    assertObjectId(itemId, 'ITEM_NOT_FOUND', 'Itinerary item not found.');

    const deleted = await ItineraryItem.findOneAndDelete({ _id: itemId, trip: tripId });
    if (!deleted) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Itinerary item not found.');
    }

    res.json({
      success: true,
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
});
