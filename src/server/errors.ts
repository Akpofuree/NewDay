import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { isProduction } from './config';
import { logger } from './logger';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, message: string, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`, 'NOT_FOUND'));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request payload.' });
    return;
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const publicMessage =
    err instanceof AppError && statusCode < 500 ? err.message : 'Something went wrong — please try again';

  logger.error('Request failed', {
    code,
    statusCode,
    method: req.method,
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
    stack: !isProduction && err instanceof Error ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: publicMessage,
    code,
    ...(isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
