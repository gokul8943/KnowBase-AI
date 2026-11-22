import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { organizationService } from './organization.service';
import { organizationRepository } from './organization.repository';

vi.mock('../../config/prisma');
vi.mock('../../config/redis');

const mockPrisma = prisma as unknown as Record<string, unknown>;

describe('Organization API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOrganization = {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-organization',
    description: 'Test description',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkspace = {
    id: 'workspace-123',
    organizationId: 'org-123',
    name: 'Default Workspace',
    description: 'Default workspace for this organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('POST /api/organizations', () => {
    it('should successfully create an organization with default workspace', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      mockPrisma.organization.create.mockResolvedValue(mockOrganization);
      mockPrisma.organizationMember.create.mockResolvedValue(mockMember);
      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);

      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          name: 'Test Organization',
          description: 'Test description',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Organization');
      expect(response.body.data.slug).toBe('test-organization');
      expect(response.body.data.role).toBe('OWNER');
      expect(response.body.data.workspaces).toHaveLength(1);
      expect(response.body.data.workspaces[0].name).toBe('Default Workspace');
    });

    it('should reject duplicate organization slug', async () => {
      mockPrisma.organization.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-org', slug: 'test-organization' });

      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          name: 'Test Organization',
          description: 'Test description',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          description: 'Test description',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unauthorized request', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .send({
          name: 'Test Organization',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/organizations', () => {
    it('should list user organizations', async () => {
      mockPrisma.organization.findMany.mockResolvedValue([
        {
          ...mockOrganization,
          members: [mockMember],
          workspaces: [mockWorkspace],
        },
      ]);

      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toHaveLength(1);
      expect(response.body.data.organizations[0].role).toBe('OWNER');
    });

    it('should reject unauthorized request', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/organizations/:organizationId', () => {
    it('should return organization details for member', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        members: [mockMember],
        workspaces: [mockWorkspace],
      });

      const response = await request(app)
        .get('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('org-123');
    });

    it('should reject non-member access', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/organizations/:organizationId', () => {
    it('should allow owner to update organization', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'OWNER' });
      mockPrisma.organization.update.mockResolvedValue({ ...mockOrganization, name: 'Updated Name' });
      mockPrisma.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        name: 'Updated Name',
        members: [mockMember],
        workspaces: [mockWorkspace],
      });

      const response = await request(app)
        .patch('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should reject member trying to update', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'MEMBER' });

      const response = await request(app)
        .patch('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'Updated Name' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/organizations/:organizationId', () => {
    it('should allow owner to delete organization', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'OWNER' });
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      mockPrisma.organization.delete.mockResolvedValue(mockOrganization);

      const response = await request(app)
        .delete('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject non-owner delete', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'ADMIN' });

      const response = await request(app)
        .delete('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject delete when multiple owners exist', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'OWNER' });
      mockPrisma.organizationMember.count.mockResolvedValue(2);

      const response = await request(app)
        .delete('/api/organizations/org-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Organization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization with owner and default workspace in transaction', async () => {
      const mockTx = {
        organization: { create: vi.fn().mockResolvedValue({ id: 'org-123', slug: 'test-org' }) },
        organizationMember: { create: vi.fn().mockResolvedValue({}) },
        workspace: { create: vi.fn().mockResolvedValue({}) },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockTx));

      const result = await organizationService.createOrganization('user-123', {
        name: 'Test Org',
        description: 'Test',
      });

      expect(result.name).toBe('Test Org');
      expect(result.role).toBe('OWNER');
      expect(mockTx.organization.create).toHaveBeenCalled();
      expect(mockTx.organizationMember.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'OWNER', userId: 'user-123' })
      );
      expect(mockTx.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Default Workspace' })
      );
    });
  });

  describe('verifyMembership', () => {
    it('should return member if user is member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-123',
        organizationId: 'org-123',
        userId: 'user-123',
        role: 'MEMBER',
      });

      const member = await organizationRepository.isMember('org-123', 'user-123');
      expect(member).not.toBeNull();
    });

    it('should return null if user is not member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const member = await organizationRepository.isMember('org-123', 'user-123');
      expect(member).toBeNull();
    });
  });
});

describe('Cross-tenant data access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not allow access to organization user is not member of', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/organizations/other-org')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should not allow member to update another organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .patch('/api/organizations/other-org')
      .set('Authorization', 'Bearer valid-access-token')
      .send({ name: 'Hacked' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});