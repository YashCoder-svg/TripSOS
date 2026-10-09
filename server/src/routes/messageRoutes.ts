import { Router, type Request } from 'express';
import mongoose from 'mongoose';
import { assertTripAccess } from './tripAuthHelper.js';
import { TripMessage } from '../models/TripMessage.js';
import { User } from '../models/User.js';
import { AppError } from '../types/errors.js';
import { getIO } from '../sockets/socketServer.js';

export const messageRoutes = Router({ mergeParams: true });

function getParams(req: Request): { tripId: string; messageId?: string } {
  return req.params as unknown as { tripId: string; messageId?: string };
}

messageRoutes.get('/', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    await assertTripAccess(tripId, req.auth!.userId);

    const messages = await TripMessage.find({ trip: tripId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        messages: messages.map((m) => ({
          _id: m._id.toString(),
          tripId: m.trip.toString(),
          senderId: m.sender.toString(),
          senderName: m.senderName,
          type: m.type,
          content: m.content,
          pinned: m.pinned,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

messageRoutes.post('/', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { role } = await assertTripAccess(tripId, req.auth!.userId);

    const { content, type = 'chat', pinned = false } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      throw new AppError(400, 'INVALID_MESSAGE', 'Message content cannot be empty.');
    }

    const user = await User.findById(req.auth!.userId).select('name');
    const senderName = user?.name || 'Traveler';

    const message = await TripMessage.create({
      trip: tripId,
      sender: req.auth!.userId,
      senderName,
      type: ['chat', 'announcement', 'alert', 'system'].includes(type) ? type : 'chat',
      content: content.trim(),
      pinned: role === 'owner' ? Boolean(pinned) : false,
    });

    const serialized = {
      _id: message._id.toString(),
      tripId,
      senderId: req.auth!.userId,
      senderName,
      type: message.type,
      content: message.content,
      pinned: message.pinned,
      createdAt: message.createdAt,
    };

    // Broadcast to room if socket server is initialized
    getIO()?.to(`trip:${tripId}`).emit('chat:message', serialized);

    res.status(201).json({
      success: true,
      data: { message: serialized },
    });
  } catch (error) {
    next(error);
  }
});

messageRoutes.patch('/:messageId/pin', async (req, res, next) => {
  try {
    const { tripId, messageId } = getParams(req);
    await assertTripAccess(tripId, req.auth!.userId, true); // Owner only

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Message not found.');
    }

    const message = await TripMessage.findOne({ _id: messageId, trip: tripId });
    if (!message) {
      throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Message not found.');
    }

    message.pinned = !message.pinned;
    await message.save();

    res.json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
});
