import { prisma } from '../../config/prisma';
import type { Invitation } from '@prisma/client';
import type { CreateInvitationInput } from './invitation.types';

interface InvitedByUser {
  id: string;
  name: string;
  email: string;
}

interface OrganizationBasic {
  id: string;
  name: string;
  slug: string;
}

export const invitationRepository = {
  async create(data: CreateInvitationInput & {
    organizationId: string;
    tokenHash: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<Invitation> {
    return prisma.invitation.create({
      data: {
        organizationId: data.organizationId,
        email: data.email,
        role: data.role,
        tokenHash: data.tokenHash,
        invitedById: data.invitedById,
        expiresAt: data.expiresAt,
      },
    });
  },

  async findByTokenHash(tokenHash: string): Promise<(Invitation & { organization: OrganizationBasic; invitedBy: InvitedByUser }) | null> {
    return prisma.invitation.findUnique({
      where: { tokenHash },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }) as Promise<(Invitation & { organization: OrganizationBasic; invitedBy: InvitedByUser }) | null>;
  },

  async findByOrganization(organizationId: string): Promise<(Invitation & { invitedBy: InvitedByUser })[]> {
    return prisma.invitation.findMany({
      where: { organizationId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<(Invitation & { invitedBy: InvitedByUser })[]>;
  },

  async findById(id: string): Promise<Invitation | null> {
    return prisma.invitation.findUnique({
      where: { id },
    });
  },

  async findByIdWithDetails(id: string): Promise<(Invitation & { organization: OrganizationBasic; invitedBy: InvitedByUser }) | null> {
    return prisma.invitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }) as Promise<(Invitation & { organization: OrganizationBasic; invitedBy: InvitedByUser }) | null>;
  },

  async findActiveByOrganizationAndEmail(organizationId: string, email: string): Promise<Invitation | null> {
    return prisma.invitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async markAsAccepted(id: string): Promise<Invitation> {
    return prisma.invitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  },

  async delete(id: string): Promise<Invitation> {
    return prisma.invitation.delete({
      where: { id },
    });
  },

  async deleteExpired(): Promise<number> {
    const result = await prisma.invitation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        acceptedAt: null,
      },
    });
    return result.count;
  },
};