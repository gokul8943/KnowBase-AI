import type { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { AuthenticationError, TokenExpiredError } from '../shared/errors/AppError';
import type { AuthenticatedUser } from '../shared/types';

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }

    const payload = authService.verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    const user = await authService.me(payload.sub);
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      role: 'user',
    };

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AuthenticationError('Access token has expired', 'TOKEN_EXPIRED');
    }
    next(err);
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;
    
    if (!token) {
      next();
      return;
    }

    const payload = authService.verifyAccessToken(token);

    if (payload.type !== 'access') {
      next();
      return;
    }

    const user = await authService.me(payload.sub);
    if (user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        role: 'user',
      };
    }

    next();
  } catch {
    next();
  }
};
