import { z } from 'zod';
import { itineraryCategories } from '../models/ItineraryItem.js';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createItineraryItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title too long'),
  description: z.string().trim().max(500, 'Description too long').optional().default(''),
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  startTime: z
    .string()
    .trim()
    .regex(timeRegex, 'Start time must be HH:MM (24-hour format)')
    .nullable()
    .optional(),
  endTime: z
    .string()
    .trim()
    .regex(timeRegex, 'End time must be HH:MM (24-hour format)')
    .nullable()
    .optional(),
  location: z.string().trim().max(200, 'Location too long').nullable().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  placeProviderId: z.string().trim().max(150).nullable().optional(),
  category: z.enum(itineraryCategories).default('activity'),
  notes: z.string().trim().max(1000, 'Notes too long').optional().default(''),
  status: z.enum(['planned', 'completed']).default('planned'),
  order: z.number().int().min(0).optional(),
});

export const updateItineraryItemSchema = createItineraryItemSchema.partial();

export const reorderItinerarySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    }),
  ),
});

export type CreateItineraryItemInput = z.infer<typeof createItineraryItemSchema>;
export type UpdateItineraryItemInput = z.infer<typeof updateItineraryItemSchema>;
export type ReorderItineraryInput = z.infer<typeof reorderItinerarySchema>;
