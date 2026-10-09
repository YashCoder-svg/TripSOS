import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/requireAuth.js';
import { Notification } from '../models/Notification.js';
import { AppError } from '../types/errors.js';

export const notificationRoutes = Router();
notificationRoutes.use(requireAuth);

notificationRoutes.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.auth!.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.auth!.userId,
      read: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

notificationRoutes.patch('/:id/read', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.auth!.userId },
      { $set: { read: true } },
      { new: true },
    );

    if (!notification) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
});

notificationRoutes.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.auth!.userId, read: false },
      { $set: { read: true } },
    );

    res.json({
      success: true,
      data: { markedAllRead: true },
    });
  } catch (error) {
    next(error);
  }
});
