import { z } from 'zod';

export const aiChatSchema = z.object({
  tripId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .max(20)
    .optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

export const aiActionExecuteSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  actionType: z.enum(['add_itinerary_item']),
  data: z.record(z.string(), z.unknown()),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiActionExecuteInput = z.infer<typeof aiActionExecuteSchema>;
