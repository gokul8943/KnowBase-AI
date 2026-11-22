import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { memberService } from './member.service';


vi.mock('../../config/prisma');
vi.mock('../../config/redis');

const mockPrisma = prisma as unknown as Record<string, unknown>;

describe('Member API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOwner = {
    id: 'owner-123',
    email: 'owner@example.com',
    name: 'Owner',
    isActive: true,
    emailVerified: true,
  };

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin',
    isActive: true,
    emailVerified: true,
  };

  const mockMember = {
    id: 'member-123',
    email: 'member@example.com',
    name: 'Member',
    isActive: true,
    emailVerified: true,
  };

  const ownerMember = {
    id: 'om-1',
    organizationId: 'org-123',
    userId: 'owner-123',
    role: 'OWNER' as const,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminMember = {
    id: 'om-2',
    organizationId: 'org-123',
    userId: 'admin-123',
    role: 'ADMIN' as const,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularMember = {
    id: 'om-3',
    organizationId: 'org-123',
    userId: 'member-123',
    role: 'MEMBER' as const,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/organizations/:organizationId/members', () => {
    it('should list members for organization member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(ownerMember);
      mockPrisma.organizationMember.findMany.mockResolvedValue([
        { ...ownerMember, user: mockOwner },
        { ...adminMember, user: mockAdmin },
        { ...regularMember, user: mockMember },
      ]);

      const response = await request(app)
        .get('/api/organizations/org-123/members')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(3);
    });

    it('should reject non-member access', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/organizations/org-123/members')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/organizations/:organizationId/members/:memberId/role', () => {
    it('should allow owner to promote member to admin', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce({ ...regularMember, user: mockMember, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organizationMember.update.mockResolvedValue({ ...regularMember, role: 'ADMIN' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...regularMember, role: 'ADMIN', user: mockMember });

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-3/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('ADMIN');
    });

    it('should allow owner to promote member to owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce({ ...regularMember, user: mockMember, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organizationMember.update.mockResolvedValue({ ...regularMember, role: 'OWNER' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...regularMember, role: 'OWNER', user: mockMember });

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-3/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'OWNER' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('OWNER');
    });

    it('should reject admin trying to promote to owner', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(adminMember);

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-3/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'OWNER' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject admin trying to demote owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(adminMember)
        .mockResolvedValueOnce({ ...ownerMember, user: mockOwner, organizationId: 'org-123' });

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-1/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'MEMBER' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject member trying to change roles', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(regularMember);

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-2/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'ADMIN' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent owner from demoting themselves when only owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce({ ...ownerMember, user: mockOwner, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);

      const response = await request(app)
        .patch('/api/organizations/org-123/members/om-1/role')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ role: 'ADMIN' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/organizations/:organizationId/members/:memberId', () => {
    it('should allow owner to remove member', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce({ ...regularMember, user: mockMember, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organizationMember.delete.mockResolvedValue(regularMember);

      const response = await request(app)
        .delete('/api/organizations/org-123/members/om-3')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow admin to remove member', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(adminMember)
        .mockResolvedValueOnce({ ...regularMember, user: mockMember, organizationId: 'org-123' });
      mockPrisma.organizationMember.delete.mockResolvedValue(regularMember);

      const response = await request(app)
        .delete('/api/organizations/org-123/members/om-3')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject admin trying to remove owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(adminMember)
        .mockResolvedValueOnce({ ...ownerMember, user: mockOwner, organizationId: 'org-123' });

      const response = await request(app)
        .delete('/api/organizations/org-123/members/om-1')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject member trying to remove anyone', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(regularMember)
        .mockResolvedValueOnce({ ...adminMember, user: mockAdmin, organizationId: 'org-123' });

      const response = await request(app)
        .delete('/api/organizations/org-123/members/om-2')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent owner from removing themselves when only owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce(ownerMember)
        .mockResolvedValueOnce({ ...ownerMember, user: mockOwner, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/organizations/org-123/members/om-1')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Member Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateMemberRole', () => {
    it('should enforce owner permissions', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ ...ownerMember, role: 'OWNER' })
        .mockResolvedValueOnce({ ...regularMember, role: 'MEMBER', user: mockMember, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organizationMember.update.mockResolvedValue({ ...regularMember, role: 'ADMIN' });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...regularMember, role: 'ADMIN', user: mockMember });

      const result = await memberService.updateMemberRole('org-123', 'owner-123', 'om-3', 'ADMIN');
      expect(result.role).toBe('ADMIN');
    });

    it('should reject admin promoting to owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ ...adminMember, role: 'ADMIN' })
        .mockResolvedValueOnce({ ...regularMember, role: 'MEMBER', user: mockMember, organizationId: 'org-123' });

      await expect(
        memberService.updateMemberRole('org-123', 'admin-123', 'om-3', 'OWNER')
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('removeMember', () => {
    it('should enforce owner can remove admin', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ ...ownerMember, role: 'OWNER' })
        .mockResolvedValueOnce({ ...adminMember, role: 'ADMIN', user: mockAdmin, organizationId: 'org-123' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organizationMember.delete.mockResolvedValue(adminMember);

      await memberService.removeMember('org-123', 'owner-123', 'om-2');
      expect(mockPrisma.organizationMember.delete).toHaveBeenCalledWith({ where: { id: 'om-2' } });
    });

    it('should reject admin removing owner', async () => {
      mockPrisma.organizationMember.findUnique
        .mockResolvedValueOnce({ ...adminMember, role: 'ADMIN' })
        .mockResolvedValueOnce({ ...ownerMember, role: 'OWNER', user: mockOwner, organizationId: 'org-123' });

      await expect(
        memberService.removeMember('org-123', 'admin-123', 'om-1')
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('canManageMember', () => {
    it('should allow owner to manage all roles', () => {
      expect(memberService.canManageMember('OWNER', 'OWNER', 'ADMIN')).toBe(true);
      expect(memberService.canManageMember('OWNER', 'ADMIN', 'MEMBER')).toBe(true);
      expect(memberService.canManageMember('OWNER', 'MEMBER', 'OWNER')).toBe(true);
    });

    it('should allow admin to manage members only', () => {
      expect(memberService.canManageMember('ADMIN', 'MEMBER', 'ADMIN')).toBe(false);
      expect(memberService.canManageMember('ADMIN', 'MEMBER', 'MEMBER')).toBe(true);
      expect(memberService.canManageMember('ADMIN', 'ADMIN', 'MEMBER')).toBe(false);
      expect(memberService.canManageMember('ADMIN', 'OWNER', 'MEMBER')).toBe(false);
    });

    it('should not allow member to manage anyone', () => {
      expect(memberService.canManageMember('MEMBER', 'MEMBER', 'ADMIN')).toBe(false);
      expect(memberService.canManageMember('MEMBER', 'ADMIN', 'MEMBER')).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    it('should allow owner to remove anyone', () => {
      expect(memberService.canRemoveMember('OWNER', 'OWNER')).toBe(true);
      expect(memberService.canRemoveMember('OWNER', 'ADMIN')).toBe(true);
      expect(memberService.canRemoveMember('OWNER', 'MEMBER')).toBe(true);
    });

    it('should allow admin to remove members only', () => {
      expect(memberService.canRemoveMember('ADMIN', 'MEMBER')).toBe(true);
      expect(memberService.canRemoveMember('ADMIN', 'ADMIN')).toBe(false);
      expect(memberService.canRemoveMember('ADMIN', 'OWNER')).toBe(false);
    });

    it('should not allow member to remove anyone', () => {
      expect(memberService.canRemoveMember('MEMBER', 'MEMBER')).toBe(false);
    });
  });
});

describe('Cross-tenant member access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not allow listing members from other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/organizations/other-org/members')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should not allow changing role in other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .patch('/api/organizations/other-org/members/om-3/role')
      .set('Authorization', 'Bearer valid-access-token')
      .send({ role: 'ADMIN' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});