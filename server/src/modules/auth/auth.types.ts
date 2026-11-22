import type { User } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  emailVerified: boolean;
}

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  jti: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export type UserWithTokens = User & {
  refreshTokens: RefreshTokenData[];
};

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
});
