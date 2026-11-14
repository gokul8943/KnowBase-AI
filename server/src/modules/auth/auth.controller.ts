import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authService } from './auth.service';
import { config } from '../../config';
import { ApiResponse } from '../../shared/types';

const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  res.cookie(config.cookie.name, refreshToken, config.cookie.options);
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(config.cookie.name, config.cookie.options);
};

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.signup(req.body);
    setRefreshTokenCookie(res, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
      },
    };
    res.status(201).json(response);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);
    setRefreshTokenCookie(res, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TOKEN_MISSING',
          message: 'Refresh token is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
        },
      };
      res.status(401).json(response);
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);
    setRefreshTokenCookie(res, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    clearRefreshTokenCookie(res);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const user = await authService.me(userId);

    const response: ApiResponse = {
      success: true,
      data: { user },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),
};