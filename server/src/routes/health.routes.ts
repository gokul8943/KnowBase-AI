import type { Request, Response } from 'express';
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { asyncHandler } from '../shared/utils/asyncHandler';
import type { ApiResponse } from '../shared/types';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      },
    };
    res.json(response);
  })
);

router.get(
  '/ready',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();

      const response: ApiResponse = {
        success: true,
        data: {
          status: 'ready',
          checks: {
            database: 'connected',
            redis: 'connected',
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
        },
      };
      res.json(response);
    } catch {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service not ready',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
        },
      };
      res.status(503).json(response);
    }
  })
);

export { router as healthRoutes };
