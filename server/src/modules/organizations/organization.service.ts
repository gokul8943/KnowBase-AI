import { organizationRepository } from './organization.repository';
import type { Organization, OrganizationMember, Workspace, MemberRole } from '@prisma/client';
import type { CreateOrganizationInput, UpdateOrganizationInput, OrganizationResponse, WorkspaceResponse } from './organization.types';
import { NotFoundError, AuthorizationError } from '../../shared/errors/AppError';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

export const organizationService = {
  async createOrganization(userId: string, input: CreateOrganizationInput): Promise<OrganizationResponse> {
    const baseSlug = generateSlug(input.name);
    const slug = await organizationRepository.generateUniqueSlug(baseSlug);

    const organization = await organizationRepository.create({
      ...input,
      slug,
      ownerId: userId,
    });

    const orgWithDetails = await organizationRepository.findByIdWithDetails(organization.id);
    if (!orgWithDetails) {
      throw new NotFoundError('Organization');
    }

    return this.mapToResponse(orgWithDetails, userId);
  },

  async listUserOrganizations(userId: string): Promise<OrganizationResponse[]> {
    const organizations = await organizationRepository.findUserOrganizations(userId);

    return organizations.map((org) => this.mapToResponse(org, userId));
  },

  async getOrganizationDetails(organizationId: string, userId: string): Promise<OrganizationResponse> {
    await this.verifyMembership(organizationId, userId);

    const organization = await organizationRepository.findByIdWithDetails(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization');
    }

    return this.mapToResponse(organization, userId);
  },

  async updateOrganization(organizationId: string, userId: string, input: UpdateOrganizationInput): Promise<OrganizationResponse> {
    const role = await organizationRepository.getMemberRole(organizationId, userId);
    if (!role || !['OWNER', 'ADMIN'].includes(role)) {
      throw new AuthorizationError('Only owners and admins can update organization');
    }

    await organizationRepository.update(organizationId, input);
    const orgWithDetails = await organizationRepository.findByIdWithDetails(organizationId);
    if (!orgWithDetails) {
      throw new NotFoundError('Organization');
    }

    return this.mapToResponse(orgWithDetails, userId);
  },

  async deleteOrganization(organizationId: string, userId: string): Promise<void> {
    const role = await organizationRepository.getMemberRole(organizationId, userId);
    if (role !== 'OWNER') {
      throw new AuthorizationError('Only owners can delete organization');
    }

    const ownerCount = await organizationRepository.countOwners(organizationId);
    if (ownerCount > 1) {
      throw new AuthorizationError('Cannot delete organization with multiple owners. Transfer ownership first.');
    }

    await organizationRepository.delete(organizationId);
  },

  async verifyMembership(organizationId: string, userId: string): Promise<OrganizationMember> {
    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member) {
      throw new AuthorizationError('You are not a member of this organization');
    }
    return member;
  },

  async requireRole(organizationId: string, userId: string, allowedRoles: MemberRole[]): Promise<OrganizationMember> {
    const member = await this.verifyMembership(organizationId, userId);
    if (!allowedRoles.includes(member.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    return member;
  },

  mapToResponse(org: Organization & { members: OrganizationMember[]; workspaces: Workspace[] }, userId: string): OrganizationResponse {
    const userMember = org.members.find((m) => m.userId === userId);
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      role: userMember?.role ?? 'MEMBER',
      workspaces: org.workspaces.map((w): WorkspaceResponse => ({
        id: w.id,
        name: w.name,
        description: w.description,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    };
  },
};