import { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import { ZodError } from 'zod';

const logger = pino({ name: 'thapar-error-handler' });

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Request validation failed',
      details: err.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  const anyErr = err as { code?: number; message?: string; statusCode?: number };
  if (anyErr && anyErr.code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate institutional record (email or roll number already exists in MongoDB Atlas).',
    });
    return;
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled API Error');
  res.status(anyErr?.statusCode || 500).json({
    success: false,
    error: anyErr?.message || 'Internal Server Error in ThaparElectiveAI Cloud API',
  });
}

