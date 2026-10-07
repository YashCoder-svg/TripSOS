import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const weatherQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    startDate: z.string().regex(dateRegex, 'Must be YYYY-MM-DD format').optional(),
    endDate: z.string().regex(dateRegex, 'Must be YYYY-MM-DD format').optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be the same day or later than start date',
      path: ['endDate'],
    },
  );

export type WeatherQueryParams = z.infer<typeof weatherQuerySchema>;
