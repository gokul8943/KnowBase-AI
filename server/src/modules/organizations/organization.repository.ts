import { prisma } from '../../config/prisma';
import type { Organization, OrganizationMember, Workspace, MemberRole } from '@prisma/client';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organization.types';

export const organizationRepository = {
  async create(data: CreateOrganizationInput & { slug: string; ownerId: string }): Promise<Organization> {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: data.ownerId,
          role: 'OWNER',
        },
      });

      await tx.workspace.create({
        data: {
          organizationId: organization.id,
          name: 'Default Workspace',
          description: 'Default workspace for this organization',
        },
      });

      return organization;
    });
  },

  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
    });
  },

  async findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { slug },
    });
  },

  async findByIdWithDetails(id: string): Promise<Organization & { members: OrganizationMember[]; workspaces: Workspace[] } | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                emailVerified: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        workspaces: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async findUserOrganizations(userId: string): Promise<(Organization & { members: OrganizationMember[]; workspaces: Workspace[] })[]> {
    return prisma.organization.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          where: { userId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                emailVerified: true,
              },
            },
          },
        },
        workspaces: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: UpdateOrganizationInput): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Organization> {
    return prisma.organization.delete({
      where: { id },
    });
  },

  async slugExists(slug: string): Promise<boolean> {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    return org !== null;
  },

  async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  },

  async isMember(organizationId: string, userId: string): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  },

  async getMemberRole(organizationId: string, userId: string): Promise<MemberRole | null> {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    });
    return member?.role ?? null;
  },

  async countMembers(organizationId: string): Promise<number> {
    return prisma.organizationMember.count({
      where: { organizationId },
    });
  },

  async countOwners(organizationId: string): Promise<number> {
    return prisma.organizationMember.count({
      where: { organizationId, role: 'OWNER' },
    });
  },
};