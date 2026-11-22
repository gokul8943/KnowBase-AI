import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { invitationService } from './invitation.service';


vi.mock('../../config/prisma');
vi.mock('../../config/redis');

const mockPrisma = prisma as unknown as Record<string, unknown>;

describe('Invitation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'owner@example.com',
    name: 'Owner User',
    isActive: true,
    emailVerified: true,
  };

  const mockMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
  };

  const mockInvitation = {
    id: 'inv-123',
    organizationId: 'org-123',
    email: 'newuser@example.com',
    role: 'MEMBER' as const,
    tokenHash: 'hashed-token',
    invitedById: 'user-123',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date(),
    invitedBy: mockUser,
    organization: { id: 'org-123', name: 'Test Org', slug: 'test-org' },
  };

  describe('POST /api/organizations/:organizationId/invitations', () => {
    it('should create invitation as owner', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-123', name: 'Test Org', slug: 'test-org' });
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.organizationMember.findUnique.mockResolvedValueOnce(mockMember).mockResolvedValueOnce(null);
      mockPrisma.invitation.create.mockResolvedValue(mockInvitation);

      const response = await request(app)
        .post('/api/organizations/org-123/invitations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          email: 'newuser@example.com',
          role: 'MEMBER',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.acceptUrl).toContain('/invitations/accept?token=');
    });

    it('should reject creating invitation as member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'MEMBER' });

      const response = await request(app)
        .post('/api/organizations/org-123/invitations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          email: 'newuser@example.com',
          role: 'MEMBER',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject duplicate active invitation', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.invitation.findFirst.mockResolvedValue({ ...mockInvitation, acceptedAt: null });

      const response = await request(app)
        .post('/api/organizations/org-123/invitations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          email: 'newuser@example.com',
          role: 'MEMBER',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should reject inviting existing member', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce({ id: 'existing-member', userId: 'other-user', role: 'MEMBER' });

      const response = await request(app)
        .post('/api/organizations/org-123/invitations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          email: 'existing@example.com',
          role: 'MEMBER',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/organizations/:organizationId/invitations', () => {
    it('should list invitations for organization member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.invitation.findMany.mockResolvedValue([mockInvitation]);

      const response = await request(app)
        .get('/api/organizations/org-123/invitations')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toHaveLength(1);
    });
  });

  describe('DELETE /api/organizations/:organizationId/invitations/:invitationId', () => {
    it('should revoke invitation as owner', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.invitation.findUnique.mockResolvedValue({ ...mockInvitation, acceptedAt: null });
      mockPrisma.invitation.delete.mockResolvedValue(mockInvitation);

      const response = await request(app)
        .delete('/api/organizations/org-123/invitations/inv-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject revoking accepted invitation', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.invitation.findUnique.mockResolvedValue({ ...mockInvitation, acceptedAt: new Date() });

      const response = await request(app)
        .delete('/api/organizations/org-123/invitations/inv-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/invitations/accept', () => {
    it('should accept valid invitation', async () => {
      const token = 'valid-token';
      const tokenHash = invitationService.hashToken(token);

      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        tokenHash,
        acceptedAt: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email: 'newuser@example.com' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
      mockPrisma.organizationMember.create.mockResolvedValue({});
      mockPrisma.invitation.update.mockResolvedValue({ ...mockInvitation, acceptedAt: new Date() });
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          organizationMember: { create: vi.fn().mockResolvedValue({}) },
          invitation: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const response = await request(app)
        .post('/api/invitations/accept')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizationId).toBe('org-123');
    });

    it('should reject invalid token', async () => {
      mockPrisma.invitation.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/invitations/accept')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ token: 'invalid-token' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject expired invitation', async () => {
      const token = 'expired-token';
      const tokenHash = invitationService.hashToken(token);

      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        tokenHash,
        acceptedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      const response = await request(app)
        .post('/api/invitations/accept')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ token })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject reused token', async () => {
      const token = 'used-token';
      const tokenHash = invitationService.hashToken(token);

      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        tokenHash,
        acceptedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/invitations/accept')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ token })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should reject mismatched email', async () => {
      const token = 'valid-token';
      const tokenHash = invitationService.hashToken(token);

      mockPrisma.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        tokenHash,
        acceptedAt: null,
        email: 'different@example.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email: 'owner@example.com' });

      const response = await request(app)
        .post('/api/invitations/accept')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ token })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Invitation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate cryptographically secure token', () => {
      const token1 = invitationService.generateToken();
      const token2 = invitationService.generateToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should consistently hash the same token', () => {
      const token = 'test-token';
      const hash1 = invitationService.hashToken(token);
      const hash2 = invitationService.hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = invitationService.hashToken('token1');
      const hash2 = invitationService.hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createInvitation', () => {
    it('should create invitation with hashed token', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-123',
        organizationId: 'org-123',
        userId: 'user-123',
        role: 'OWNER',
      });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org-123', name: 'Test Org', slug: 'test-org' });
      mockPrisma.invitation.findFirst.mockResolvedValue(null);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
      mockPrisma.invitation.create.mockResolvedValue({
        id: 'inv-123',
        organizationId: 'org-123',
        email: 'new@example.com',
        role: 'MEMBER',
        tokenHash: 'hashed-token',
        invitedById: 'user-123',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        acceptedAt: null,
        createdAt: new Date(),
        invitedBy: { id: 'user-123', name: 'Owner', email: 'owner@example.com' },
      });

      const result = await invitationService.createInvitation('org-123', 'user-123', {
        email: 'new@example.com',
        role: 'MEMBER',
      });

      expect(result.token).toBeDefined();
      expect(result.acceptUrl).toContain('/invitations/accept?token=');
      expect(result.tokenHash).not.toBe(result.token);
    });
  });
});

describe('Cross-tenant invitation access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not allow listing invitations from other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/organizations/other-org/invitations')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should not allow creating invitation for other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/organizations/other-org/invitations')
      .set('Authorization', 'Bearer valid-access-token')
      .send({ email: 'test@example.com', role: 'MEMBER' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});