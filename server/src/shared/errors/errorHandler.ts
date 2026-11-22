import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from './AppError';
import type { ApiResponse } from '../types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] [${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let response: ApiResponse;

  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      meta: { timestamp, requestId },
    };
    res.status(400).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      response = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${target} already exists`,
        },
        meta: { timestamp, requestId },
      };
      res.status(409).json(response);
      return;
    }
    if (err.code === 'P2025') {
      response = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
        meta: { timestamp, requestId },
      };
      res.status(404).json(response);
      return;
    }
  }

  if (err instanceof AppError) {
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: { timestamp, requestId },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    response = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON payload',
      },
      meta: { timestamp, requestId },
    };
    res.status(400).json(response);
    return;
  }

  response = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    },
    meta: { timestamp, requestId },
  };
  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const timestamp = new Date().toISOString();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: { timestamp, requestId },
  };
  res.status(404).json(response);
};
