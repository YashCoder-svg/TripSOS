import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid travel date.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year!, month! - 1, day!));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month! - 1 &&
      date.getUTCDate() === day
    );
  }, 'Enter a valid travel date.');

const coordinateSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  })
  .strict();

const destinationDetailSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    formattedAddress: z.string().trim().max(250).optional(),
    city: z.string().trim().max(120).optional(),
    region: z.string().trim().max(120).optional(),
    country: z.string().trim().max(120).optional(),
    providerId: z.string().trim().max(120).optional(),
    coordinates: coordinateSchema.optional(),
  })
  .strict();

const tripFields = {
  name: z.string().trim().min(1, 'Add a name for your trip.').max(80),
  destination: destinationDetailSchema.nullable().optional(),
  destinationName: z.string().trim().min(1, 'Add a destination.').max(120),
  destinationCountry: z.string().trim().max(120).nullable().optional(),
  destinationCoordinates: coordinateSchema.nullable().optional(),
  startDate: dateOnly,
  endDate: dateOnly,
  travelerCount: z.number().int().min(1).max(30),
  budget: z.number().finite().min(0).max(100_000_000),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  travelStyle: z.enum(['budget', 'balanced', 'comfort', 'adventure', 'family', 'backpacking']),
  interests: z
    .array(
      z.enum([
        'nature',
        'food',
        'adventure',
        'history',
        'shopping',
        'photography',
        'nightlife',
        'family',
        'culture',
      ]),
    )
    .max(9),
};

export const createTripSchema = z
  .object(tripFields)
  .strict()
  .refine((trip) => trip.endDate >= trip.startDate, {
    path: ['endDate'],
    message: 'End date must be the same day or later than the start date.',
  });

export const updateTripSchema = z
  .object(tripFields)
  .partial()
  .strict()
  .refine((trip) => Object.keys(trip).length > 0, 'Provide at least one trip field to update.');

export const updateTripStatusSchema = z
  .object({
    status: z.enum(['planning', 'upcoming', 'active', 'completed', 'cancelled']),
  })
  .strict();

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
