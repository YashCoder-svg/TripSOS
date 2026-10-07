import mongoose from 'mongoose';
import { Trip, type TripRecord } from '../models/Trip.js';
import { TripMember, type TripMemberRecord } from '../models/TripMember.js';
import { AppError } from '../types/errors.js';

export interface TripAccessContext {
  trip: mongoose.HydratedDocument<TripRecord>;
  role: 'owner' | 'member';
  membership?: mongoose.HydratedDocument<TripMemberRecord>;
}

export async function assertTripAccess(
  tripId: string,
  userId: string,
  requireOwner = false,
): Promise<TripAccessContext> {
  if (!mongoose.isValidObjectId(tripId)) {
    throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
  }

  // Check direct owner
  if (trip.owner.toString() === userId) {
    return { trip, role: 'owner' };
  }

  if (requireOwner) {
    throw new AppError(403, 'FORBIDDEN', 'Only the trip owner can perform this action.');
  }

  // Check active trip membership
  const member = await TripMember.findOne({
    trip: trip._id,
    user: userId,
    status: 'active',
  });

  if (!member) {
    throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
  }

  return { trip, role: member.role, membership: member ?? undefined };
}
