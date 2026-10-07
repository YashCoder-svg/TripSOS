import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js';
import { aiAssistantService } from '../services/ai/aiAssistantService.js';
import { aiChatSchema, aiActionExecuteSchema } from '../validators/aiValidators.js';
import { assertTripAccess } from './tripAuthHelper.js';
import { createItineraryItemSchema } from '../validators/itineraryValidators.js';
import { ItineraryItem } from '../models/ItineraryItem.js';
import { AppError } from '../types/errors.js';

export const aiRoutes = Router();

// POST /api/ai/chat
aiRoutes.post('/chat', optionalAuth, async (req, res, next) => {
  try {
    const input = aiChatSchema.parse(req.body);
    const result = await aiAssistantService.processMessage({
      message: input.message,
      tripId: input.tripId,
      userId: req.auth?.userId,
      location: input.location,
      history: input.history,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/action/execute
aiRoutes.post('/action/execute', requireAuth, async (req, res, next) => {
  try {
    const input = aiActionExecuteSchema.parse(req.body);
    await assertTripAccess(input.tripId, req.auth!.userId);

    if (input.actionType === 'add_itinerary_item') {
      const validatedData = createItineraryItemSchema.parse(input.data);

      let order = validatedData.order;
      if (order === undefined) {
        const lastItem = await ItineraryItem.findOne({
          trip: input.tripId,
          date: validatedData.date,
        }).sort({ order: -1 });
        order = lastItem ? lastItem.order + 1 : 0;
      }

      const item = await ItineraryItem.create({
        ...validatedData,
        trip: input.tripId,
        order,
      });

      return res.status(201).json({
        success: true,
        data: {
          executed: true,
          actionType: input.actionType,
          item,
        },
      });
    }

    throw new AppError(400, 'UNSUPPORTED_ACTION', `Action ${input.actionType} is not supported.`);
  } catch (error) {
    next(error);
  }
});
