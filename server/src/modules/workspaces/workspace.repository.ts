import { prisma } from '../../config/prisma';
import type { Workspace } from '@prisma/client';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from './workspace.types';

export const workspaceRepository = {
  async create(organizationId: string, data: CreateWorkspaceInput): Promise<Workspace> {
    return prisma.workspace.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
      },
    });
  },

  async findById(id: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({
      where: { id },
    });
  },

  async findByIdWithOrganization(id: string): Promise<(Workspace & { organization: { id: string; name: string; slug: string } }) | null> {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  },

  async findByOrganization(organizationId: string): Promise<Workspace[]> {
    return prisma.workspace.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  },

  async update(id: string, data: UpdateWorkspaceInput): Promise<Workspace> {
    return prisma.workspace.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Workspace> {
    return prisma.workspace.delete({
      where: { id },
    });
  },

  async belongsToOrganization(workspaceId: string, organizationId: string): Promise<boolean> {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId },
      select: { id: true },
    });
    return workspace !== null;
  },
};