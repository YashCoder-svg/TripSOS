import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.body.password',
    'req.body.confirmPassword',
    '*.password',
    '*.confirmPassword',
    '*.passwordHash',
    '*.token',
    '*.refreshToken',
    '*.accessToken',
    '*.phone',
    '*.contacts',
    '*.emergencyContacts',
    '*.location',
  ],
});
