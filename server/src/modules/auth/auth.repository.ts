import { prisma } from '../../config/prisma';
import { AuthUser, RefreshTokenData } from './auth.types';

export const authRepository = {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? { id: user.id, email: user.email, name: user.name, isActive: user.isActive, emailVerified: user.emailVerified } : null;
  },

  async findById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? { id: user.id, email: user.email, name: user.name, isActive: user.isActive, emailVerified: user.emailVerified } : null;
  },

  async create(data: { name: string; email: string; passwordHash: string }): Promise<AuthUser> {
    const user = await prisma.user.create({
      data,
    });
    return { id: user.id, email: user.email, name: user.name, isActive: user.isActive, emailVerified: user.emailVerified };
  },

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshTokenData> {
    const token = await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      userId: token.userId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    };
  },

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenData | null> {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return token ? {
      id: token.id,
      tokenHash: token.tokenHash,
      userId: token.userId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    } : null;
  },

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  },
};