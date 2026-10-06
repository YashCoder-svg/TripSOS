import { z } from 'zod';
import { placeCategories } from '../services/location/types.js';

export const geocodeQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty.')
    .max(100, 'Search query is too long.'),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const reverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  lon: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
});

export const placeSearchSchema = z.object({
  q: z.string().trim().max(100, 'Search query is too long.').optional(),
  lat: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  lon: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  radius: z.coerce
    .number()
    .min(100, 'Radius must be at least 100m.')
    .max(50_000, 'Radius cannot exceed 50km.')
    .default(5000),
  category: z.enum(placeCategories).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const placeNearbySchema = z.object({
  lat: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  lon: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  category: z.enum(placeCategories).default('hospitals'),
  radius: z.coerce
    .number()
    .min(100, 'Radius must be at least 100m.')
    .max(50_000, 'Radius cannot exceed 50km.')
    .default(5000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type GeocodeQueryParams = z.infer<typeof geocodeQuerySchema>;
export type PlaceSearchParamsInput = z.infer<typeof placeSearchSchema>;
