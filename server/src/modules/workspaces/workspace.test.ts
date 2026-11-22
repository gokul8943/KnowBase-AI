import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/prisma';
import { workspaceService } from './workspace.service';


vi.mock('../../config/prisma');
vi.mock('../../config/redis');

const mockPrisma = prisma as unknown as Record<string, unknown>;

describe('Workspace API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMember = {
    id: 'member-123',
    organizationId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
  };

  const mockWorkspace = {
    id: 'workspace-123',
    organizationId: 'org-123',
    name: 'Test Workspace',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: { id: 'org-123', name: 'Test Org', slug: 'test-org' },
  };

  describe('GET /api/organizations/:organizationId/workspaces', () => {
    it('should list workspaces for organization member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.workspace.findMany.mockResolvedValue([mockWorkspace]);

      const response = await request(app)
        .get('/api/organizations/org-123/workspaces')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workspaces).toHaveLength(1);
    });

    it('should reject non-member access', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/organizations/org-123/workspaces')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/workspaces/:workspaceId', () => {
    it('should return workspace for organization member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);

      const response = await request(app)
        .get('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('workspace-123');
    });

    it('should reject access from non-member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject access to workspace in different organization', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        organization: { id: 'other-org', name: 'Other Org', slug: 'other-org' },
      });
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/organizations/:organizationId/workspaces', () => {
    it('should allow owner to create workspace', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);

      const response = await request(app)
        .post('/api/organizations/org-123/workspaces')
        .set('Authorization', 'Bearer valid-access-token')
        .send({
          name: 'New Workspace',
          description: 'New description',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Workspace');
    });

    it('should allow admin to create workspace', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'ADMIN' });
      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);

      const response = await request(app)
        .post('/api/organizations/org-123/workspaces')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'New Workspace' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject member creating workspace', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'MEMBER' });

      const response = await request(app)
        .post('/api/organizations/org-123/workspaces')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'New Workspace' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/workspaces/:workspaceId', () => {
    it('should allow owner to update workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.workspace.update.mockResolvedValue({ ...mockWorkspace, name: 'Updated Workspace' });

      const response = await request(app)
        .patch('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'Updated Workspace' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Workspace');
    });

    it('should reject member updating workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'MEMBER' });

      const response = await request(app)
        .patch('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .send({ name: 'Updated Workspace' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/workspaces/:workspaceId', () => {
    it('should allow owner to delete workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.workspace.delete.mockResolvedValue(mockWorkspace);

      const response = await request(app)
        .delete('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject admin deleting workspace', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue({ ...mockMember, role: 'ADMIN' });

      const response = await request(app)
        .delete('/api/workspaces/workspace-123')
        .set('Authorization', 'Bearer valid-access-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Workspace Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listWorkspaces', () => {
    it('should return workspaces for organization member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);
      mockPrisma.workspace.findMany.mockResolvedValue([mockWorkspace]);

      const result = await workspaceService.listWorkspaces('org-123', 'user-123');
      expect(result).toHaveLength(1);
    });

    it('should throw if user is not member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(workspaceService.listWorkspaces('org-123', 'user-123')).rejects.toThrow('not a member');
    });
  });

  describe('verifyWorkspaceAccess', () => {
    it('should verify workspace belongs to organization user is member of', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(mockMember);

      const result = await workspaceService.verifyWorkspaceAccess('workspace-123', 'user-123');
      expect(result.id).toBe('workspace-123');
    });

    it('should throw if workspace not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(workspaceService.verifyWorkspaceAccess('workspace-123', 'user-123')).rejects.toThrow('not found');
    });

    it('should throw if user not member of workspace organization', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(workspaceService.verifyWorkspaceAccess('workspace-123', 'user-123')).rejects.toThrow('not a member');
    });
  });
});

describe('Cross-tenant workspace access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not allow listing workspaces from other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/organizations/other-org/workspaces')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should not allow accessing workspace from other organization', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValue({
      ...mockWorkspace,
      organization: { id: 'other-org', name: 'Other Org', slug: 'other-org' },
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/workspaces/workspace-123')
      .set('Authorization', 'Bearer valid-access-token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  it('should not allow creating workspace in other organization', async () => {
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/organizations/other-org/workspaces')
      .set('Authorization', 'Bearer valid-access-token')
      .send({ name: 'Hacked Workspace' })
      .expect(403);

    expect(response.body.success).toBe(false);
  });
});