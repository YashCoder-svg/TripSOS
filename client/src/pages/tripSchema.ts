import { z } from 'zod';
import { tripInterests, travelStyles } from '../types/trip';

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day
  );
}

export const tripFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Add a name for your trip.')
      .max(80, 'Keep the trip name under 80 characters.'),
    destinationName: z
      .string()
      .trim()
      .min(1, 'Add a destination.')
      .max(120, 'Keep the destination under 120 characters.'),
    startDate: z.string().refine(isRealDate, 'Enter a valid start date.'),
    endDate: z.string().refine(isRealDate, 'Enter a valid end date.'),
    travelerCount: z
      .number()
      .int('Use a whole number of travelers.')
      .min(1, 'At least one traveler is required.')
      .max(30, 'Trips can have up to 30 travelers.'),
    budget: z
      .number()
      .finite()
      .min(0, 'Budget cannot be negative.')
      .max(100_000_000, 'Budget must be under 100,000,000.'),
    currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
    travelStyle: z.enum(travelStyles),
    interests: z.array(z.enum(tripInterests)).max(9),
  })
  .refine((values) => values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'End date must be the same day or later than the start date.',
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;
