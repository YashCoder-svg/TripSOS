import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/errors.js';
import { logger } from '../config/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  void _next;
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues,
        },
      });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }
  logger.error({ err: error }, 'Unhandled request error');
  const production = process.env.NODE_ENV === 'production';
  res
    .status(500)
    .json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: production
          ? 'An unexpected error occurred'
          : error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    });
};
