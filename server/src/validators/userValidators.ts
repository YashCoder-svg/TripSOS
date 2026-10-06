import { z } from 'zod';

const languageCode = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,2}$/);
const profilePhoto = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use a secure image URL.')
  .nullable();

const travelPreferences = z
  .object({
    travelStyle: z.enum(['adventure', 'culture', 'relaxation', 'nature', 'food', 'mixed']),
    favoriteActivities: z.array(z.string().trim().min(1).max(40)).max(8),
    budgetPreference: z.enum(['budget', 'moderate', 'premium', 'flexible']),
    dietaryPreferences: z.array(z.string().trim().min(1).max(40)).max(8),
  })
  .partial()
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    profilePhoto: profilePhoto.optional(),
    language: languageCode.optional(),
    travelPreferences: travelPreferences.optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one profile field to update.',
  );

export const createEmergencyContactSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, 'Use an international phone number, such as +14155552671.'),
    relationship: z.enum(['family', 'friend', 'partner', 'colleague', 'other']),
    isPrimary: z.boolean().default(false),
  })
  .strict();

export const updateEmergencyContactSchema = createEmergencyContactSchema
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one contact field to update.',
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
