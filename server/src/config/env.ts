import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    CLIENT_URL: z.string().url(),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    UNSPLASH_ACCESS_KEY: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(1).optional(),
    ),
  })
  .refine((values) => values.JWT_ACCESS_SECRET !== values.JWT_REFRESH_SECRET, {
    message: 'JWT access and refresh secrets must be different',
  })
  .refine((values) => values.COOKIE_SAME_SITE !== 'none' || values.NODE_ENV === 'production', {
    message: 'SameSite=None cookies require production HTTPS.',
  });

export const env = envSchema.parse(process.env);
