import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { prisma } from '../../config/prisma';
import { authRepository } from './auth.repository';
import {
  AuthUser,
  TokenPayload,
  Tokens,
  RefreshTokenData,
} from './auth.types';
import {
  AuthenticationError,
  ConflictError,
  TokenError,
  TokenExpiredError,
  TokenReusedError,
  NotFoundError,
} from '../../shared/errors/AppError';
import { SignupInput, LoginInput } from './auth.validation';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateAccessToken(user: AuthUser): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    });
  },

  generateRefreshToken(user: AuthUser): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      }
      throw new TokenError('Invalid access token');
    }
  },

  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh token has expired');
      }
      throw new TokenError('Invalid refresh token');
    }
  },

  hashToken(token: string): string {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  },

  parseExpiry(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  },

  async signup(input: SignupInput): Promise<{ user: AuthUser; tokens: Tokens }> {
    const existingUser = await authRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await this.hashPassword(input.password);
    const user = await authRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const tokens = await this.generateTokenPair(user);
    return { user, tokens };
  },

  async login(input: LoginInput): Promise<{ user: AuthUser; tokens: Tokens }> {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!userWithPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isValid = await this.verifyPassword(input.password, userWithPassword.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = await this.generateTokenPair(user);
    return { user, tokens };
  },

  async generateTokenPair(user: AuthUser): Promise<Tokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = this.parseExpiry(config.jwt.refreshExpiresIn);

    await authRepository.createRefreshToken(user.id, refreshTokenHash, expiresAt);

    return { accessToken, refreshToken };
  },

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new TokenReusedError('Refresh token not found or already revoked');
    }

    if (storedToken.revokedAt) {
      await authRepository.revokeAllUserTokens(storedToken.userId);
      throw new TokenReusedError('Token reuse detected - all sessions revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new TokenExpiredError('Refresh token has expired');
    }

    const user = await authRepository.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or deactivated');
    }

    await authRepository.revokeRefreshToken(storedToken.id);

    return this.generateTokenPair(user);
  },

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (storedToken && !storedToken.revokedAt) {
      await authRepository.revokeRefreshToken(storedToken.id);
    }
  },

  async logoutAll(userId: string): Promise<void> {
    await authRepository.revokeAllUserTokens(userId);
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  },
};