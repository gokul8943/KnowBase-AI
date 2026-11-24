import crypto from 'crypto';
import type { Request, Response, CookieOptions } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { authService } from './auth.service';
import { config } from '../../config';
import type { ApiResponse } from '../../shared/types';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  path: '/',
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  const accessCookieOptions: CookieOptions = {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  };
  const refreshCookieOptions: CookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie(config.cookie.name, refreshToken, refreshCookieOptions);
};

const clearAuthCookies = (res: Response): void => {
  const cookieOptions: CookieOptions = {
    ...baseCookieOptions,
    maxAge: 0,
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie(config.cookie.name, cookieOptions);
};

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.signup(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      },
    };
    res.status(201).json(response);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
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
          requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
        },
      };
      res.status(401).json(response);
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    clearAuthCookies(res);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Logged out successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
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
        requestId: (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      },
    };
    res.json(response);
  }),
};
