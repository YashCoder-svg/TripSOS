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
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues.map(({ code, path, message }) => ({ code, path, message })),
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
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  if (
    ['MongooseServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError'].includes(
      errorName,
    ) ||
    (errorName === 'MongooseError' &&
      error instanceof Error &&
      error.message.includes('buffering timed out'))
  ) {
    logger.error({ errorType: errorName }, 'Database is unavailable');
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable.' },
    });
    return;
  }
  logger.error({ errorType: errorName }, 'Unhandled request error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
  });
};
