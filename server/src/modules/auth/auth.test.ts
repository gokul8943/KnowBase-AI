import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { authService } from './auth.service';
import { AuthenticationError, ConflictError, TokenExpiredError, TokenReusedError } from '../../shared/errors/AppError';

vi.mock('../../config/prisma');
vi.mock('../../config/redis');

const mockPrisma = prisma as any;
const mockAuthService = authService as any;

describe('Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully signup a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
      });

      mockAuthService.hashPassword.mockResolvedValue('hashed-password');
      mockAuthService.generateAccessToken.mockReturnValue('access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(),
        revokedAt: null,
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.accessToken).toBe('access-token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject mismatched passwords', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Different123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: false,
        passwordHash: 'hashed-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.verifyPassword.mockResolvedValue(true);
      mockAuthService.generateAccessToken.mockReturnValue('access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh-token');
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(),
        revokedAt: null,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBe('access-token');
    });

    it('should reject incorrect password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: false,
        passwordHash: 'hashed-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: false,
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');
      mockAuthService.generateAccessToken.mockReturnValue('new-access-token');
      mockAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({
        id: 'token-456',
        tokenHash: 'new-hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(),
        revokedAt: null,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('new-access-token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_MISSING');
    });

    it('should reject revoked refresh token', async () => {
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=revoked-token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_REUSED');
    });

    it('should reject expired refresh token', async () => {
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 86400000),
        revokedAt: null,
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=expired-token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should detect token reuse and revoke all sessions', async () => {
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=reused-token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_REUSED');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout', async () => {
      const mockStoredToken = {
        id: 'token-123',
        tokenHash: 'hashed-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      };

      mockPrisma.refreshToken.findUnique.mockResolvedValue(mockStoredToken);
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockAuthService.hashToken.mockReturnValue('hashed-refresh-token');

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=valid-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
    });

    it('should handle logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid access token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        isActive: true,
        emailVerified: false,
      };

      mockAuthService.verifyAccessToken.mockReturnValue({
        sub: 'user-123',
        email: 'test@example.com',
        type: 'access',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
    });

    it('should reject missing access token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject expired access token', async () => {
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new TokenExpiredError('Access token has expired');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject invalid access token', async () => {
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});