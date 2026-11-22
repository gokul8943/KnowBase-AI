import { workspaceRepository } from './workspace.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { Workspace } from '@prisma/client';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceResponse } from './workspace.types';
import { NotFoundError, AuthorizationError } from '../../shared/errors/AppError';

export const workspaceService = {
  async listWorkspaces(organizationId: string, userId: string): Promise<WorkspaceResponse[]> {
    await organizationRepository.isMember(organizationId, userId);

    const workspaces = await workspaceRepository.findByOrganization(organizationId);
    return workspaces.map(this.mapToResponse);
  },

  async getWorkspace(workspaceId: string, userId: string): Promise<WorkspaceResponse> {
    const workspace = await workspaceRepository.findByIdWithOrganization(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    await organizationRepository.isMember(workspace.organization.id, userId);

    return this.mapToResponse(workspace);
  },

  async createWorkspace(organizationId: string, userId: string, input: CreateWorkspaceInput): Promise<WorkspaceResponse> {
    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new AuthorizationError('Only owners and admins can create workspaces');
    }

    const workspace = await workspaceRepository.create(organizationId, input);
    return this.mapToResponse(workspace);
  },

  async updateWorkspace(workspaceId: string, userId: string, input: UpdateWorkspaceInput): Promise<WorkspaceResponse> {
    const workspace = await workspaceRepository.findByIdWithOrganization(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    const member = await organizationRepository.isMember(workspace.organization.id, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new AuthorizationError('Only owners and admins can update workspaces');
    }

    const updated = await workspaceRepository.update(workspaceId, input);
    return this.mapToResponse(updated);
  },

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await workspaceRepository.findByIdWithOrganization(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    const member = await organizationRepository.isMember(workspace.organization.id, userId);
    if (!member || member.role !== 'OWNER') {
      throw new AuthorizationError('Only owners can delete workspaces');
    }

    await workspaceRepository.delete(workspaceId);
  },

  async verifyWorkspaceAccess(workspaceId: string, userId: string): Promise<Workspace & { organization: { id: string } }> {
    const workspace = await workspaceRepository.findByIdWithOrganization(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace');
    }

    await organizationRepository.isMember(workspace.organization.id, userId);

    return workspace;
  },

  mapToResponse(workspace: Workspace & { organization?: { id: string; name: string; slug: string } }): WorkspaceResponse {
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      organizationId: workspace.organizationId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  },
};