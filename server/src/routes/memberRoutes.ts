import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Router, type Request } from 'express';
import { TripMember } from '../models/TripMember.js';
import { User } from '../models/User.js';
import { AppError } from '../types/errors.js';
import { inviteMemberSchema, joinTripSchema } from '../validators/groupValidators.js';
import { assertTripAccess } from './tripAuthHelper.js';

export const memberRoutes = Router({ mergeParams: true });

function getParams(req: Request): { tripId: string } {
  return req.params as unknown as { tripId: string };
}

// GET /api/trips/:tripId/members
memberRoutes.get('/', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { trip } = await assertTripAccess(tripId, req.auth!.userId);

    // Ensure owner has an active TripMember record
    const ownerMember = await TripMember.findOne({ trip: trip._id, role: 'owner' });
    if (!ownerMember) {
      await TripMember.create({
        trip: trip._id,
        user: trip.owner,
        role: 'owner',
        status: 'active',
        joinedAt: trip.createdAt ?? new Date(),
      });
    }

    const members = await TripMember.find({ trip: trip._id })
      .populate('user', 'name email profilePhoto')
      .sort({ role: 1, createdAt: 1 });

    res.json({
      success: true,
      data: {
        members,
        tripOwnerId: trip.owner.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips/:tripId/members/invite
memberRoutes.post('/invite', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { trip } = await assertTripAccess(tripId, req.auth!.userId, true); // owner only
    const input = inviteMemberSchema.parse(req.body);

    const targetUser = await User.findOne({ email: input.email });
    if (targetUser && targetUser._id.toString() === trip.owner.toString()) {
      throw new AppError(400, 'CANNOT_INVITE_SELF', 'Trip owner is already part of the trip.');
    }

    if (targetUser) {
      const existing = await TripMember.findOne({ trip: trip._id, user: targetUser._id });
      if (existing && existing.status === 'active') {
        throw new AppError(400, 'ALREADY_MEMBER', 'This user is already an active member of the trip.');
      }
    }

    const inviteToken = crypto.randomBytes(24).toString('base64url');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const member = await TripMember.create({
      trip: trip._id,
      user: targetUser?._id ?? null,
      invitedEmail: input.email,
      role: input.role,
      status: 'pending',
      inviteToken,
      inviteExpiresAt,
    });

    res.status(201).json({
      success: true,
      data: {
        member,
        inviteToken,
        inviteLink: `/trips/${trip._id}/group?invite=${inviteToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips/:tripId/members/join
memberRoutes.post('/join', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const input = joinTripSchema.parse(req.body);

    if (!mongoose.isValidObjectId(tripId)) {
      throw new AppError(404, 'TRIP_NOT_FOUND', 'Trip not found.');
    }

    const invitation = await TripMember.findOne({
      trip: tripId,
      inviteToken: input.inviteToken,
      status: 'pending',
    });

    if (!invitation) {
      throw new AppError(404, 'INVITATION_NOT_FOUND', 'Invitation not found or has already been used.');
    }

    if (invitation.inviteExpiresAt && new Date() > invitation.inviteExpiresAt) {
      throw new AppError(410, 'INVITATION_EXPIRED', 'This trip invitation has expired.');
    }

    // Associate current authenticated user
    invitation.user = new mongoose.Types.ObjectId(req.auth!.userId);
    invitation.status = 'active';
    invitation.joinedAt = new Date();
    invitation.inviteToken = null as unknown as string;
    await invitation.save();

    await invitation.populate('user', 'name email profilePhoto');

    res.json({
      success: true,
      data: {
        joined: true,
        member: invitation,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trips/:tripId/members/:memberId
memberRoutes.delete('/:memberId', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { memberId } = req.params;
    const { trip } = await assertTripAccess(tripId, req.auth!.userId, true); // owner only

    if (!memberId || !mongoose.isValidObjectId(memberId)) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found.');
    }

    const member = await TripMember.findOne({ _id: memberId, trip: trip._id });
    if (!member) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found.');
    }

    if (member.role === 'owner') {
      throw new AppError(400, 'CANNOT_REMOVE_OWNER', 'The trip owner cannot be removed.');
    }

    await TripMember.findByIdAndDelete(memberId);

    res.json({
      success: true,
      data: {
        removed: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips/:tripId/members/leave
memberRoutes.post('/leave', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { trip, role } = await assertTripAccess(tripId, req.auth!.userId);

    if (role === 'owner' || trip.owner.toString() === req.auth!.userId) {
      throw new AppError(
        400,
        'OWNER_CANNOT_LEAVE',
        'Trip owners cannot leave the trip. You may delete the trip instead.',
      );
    }

    await TripMember.findOneAndDelete({
      trip: trip._id,
      user: req.auth!.userId,
    });

    res.json({
      success: true,
      data: {
        left: true,
      },
    });
  } catch (error) {
    next(error);
  }
});
