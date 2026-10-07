import { z } from 'zod';
import { emergencyCategories } from '../models/EmergencySession.js';

export const createEmergencySessionSchema = z.object({
  type: z.enum(emergencyCategories).default('general'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyMeters: z.number().min(0).max(50000).optional(),
  notes: z.string().trim().max(500).optional().default(''),
});

export const updateEmergencySessionStatusSchema = z.object({
  status: z.enum(['resolved', 'cancelled']),
  notes: z.string().trim().max(500).optional(),
});

export const nearbyEmergencyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  category: z.enum(['hospitals', 'police', 'pharmacies', 'all']).default('all'),
  radius: z.coerce.number().min(500).max(25000).default(5000),
  limit: z.coerce.number().min(1).max(30).default(15),
});

export const emergencyNumbersQuerySchema = z.object({
  country: z.string().trim().max(100).optional(),
  countryCode: z.string().trim().max(10).optional(),
});
