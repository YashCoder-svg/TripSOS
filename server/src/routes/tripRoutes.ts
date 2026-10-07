import mongoose from 'mongoose';
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { Trip } from '../models/Trip.js';
import { AppError } from '../types/errors.js';
import {
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
} from '../validators/tripValidators.js';
import { itineraryRoutes } from './itineraryRoutes.js';
import { memberRoutes } from './memberRoutes.js';
import { expenseRoutes } from './expenseRoutes.js';
import { TripMember } from '../models/TripMember.js';
import { assertTripAccess } from './tripAuthHelper.js';

export const tripRoutes = Router();
tripRoutes.use(requireAuth);
tripRoutes.use('/:tripId/itinerary', itineraryRoutes);
tripRoutes.use('/:tripId/members', memberRoutes);
tripRoutes.use('/:tripId/expenses', expenseRoutes);

function dateStatus(
  startDate: string,
  endDate: string,
  now = new Date(),
): 'upcoming' | 'active' | 'completed' {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'completed';
  return 'active';
}

function serializeTrip(trip: { toObject(): Record<string, unknown> }) {
  const record = trip.toObject();
  const publicRecord = { ...record };
  delete publicRecord.owner;
  const currentStatus = record.status as string | undefined;
  const derived =
    currentStatus === 'cancelled' || currentStatus === 'planning'
      ? currentStatus
      : dateStatus(record.startDate as string, record.endDate as string);
  return {
    ...publicRecord,
    status: derived,
  };
}

function assertTripId(tripId: string): void {
  if (!mongoose.isValidObjectId(tripId))
    throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
}

tripRoutes.post('/', async (req, res, next) => {
  try {
    const input = createTripSchema.parse(req.body);
    const trip = await Trip.create({ ...input, owner: req.auth!.userId });
    await TripMember.create({
      trip: trip._id,
      user: req.auth!.userId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });
    res.status(201).json({ success: true, data: { trip: serializeTrip(trip) } });
  } catch (error) {
    next(error);
  }
});

tripRoutes.get('/', async (req, res, next) => {
  try {
    const memberTripIds = await TripMember.find({
      user: req.auth!.userId,
      status: 'active',
    }).distinct('trip');

    const trips = await Trip.find({
      $or: [{ owner: req.auth!.userId }, { _id: { $in: memberTripIds } }],
    }).sort({
      startDate: 1,
      createdAt: -1,
    });
    res.json({ success: true, data: { trips: trips.map(serializeTrip) } });
  } catch (error) {
    next(error);
  }
});

tripRoutes.get('/:tripId', async (req, res, next) => {
  try {
    assertTripId(req.params.tripId!);
    const { trip } = await assertTripAccess(req.params.tripId!, req.auth!.userId);
    res.json({ success: true, data: { trip: serializeTrip(trip) } });
  } catch (error) {
    next(error);
  }
});

tripRoutes.patch('/:tripId/status', async (req, res, next) => {
  try {
    assertTripId(req.params.tripId!);
    const input = updateTripStatusSchema.parse(req.body);
    const trip = await Trip.findOne({ _id: req.params.tripId, owner: req.auth!.userId });
    if (!trip) throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
    trip.status = input.status;
    await trip.save();
    res.json({ success: true, data: { trip: serializeTrip(trip) } });
  } catch (error) {
    next(error);
  }
});

tripRoutes.patch('/:tripId', async (req, res, next) => {
  try {
    assertTripId(req.params.tripId!);
    const input = updateTripSchema.parse(req.body);
    const trip = await Trip.findOne({ _id: req.params.tripId, owner: req.auth!.userId });
    if (!trip) throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
    const nextStart = input.startDate ?? trip.startDate;
    const nextEnd = input.endDate ?? trip.endDate;
    if (nextEnd < nextStart)
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'End date must be the same day or later than the start date.',
      );
    Object.assign(trip, input);
    await trip.save();
    res.json({ success: true, data: { trip: serializeTrip(trip) } });
  } catch (error) {
    next(error);
  }
});

tripRoutes.delete('/:tripId', async (req, res, next) => {
  try {
    assertTripId(req.params.tripId!);
    const deleted = await Trip.findOneAndDelete({
      _id: req.params.tripId,
      owner: req.auth!.userId,
    });
    if (!deleted) throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});
