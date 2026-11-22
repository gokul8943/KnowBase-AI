import { prisma } from '../../config/prisma';
import type { OrganizationMember, MemberRole } from '@prisma/client';

export interface UserBasic {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
}

export type MemberWithUser = OrganizationMember & { user: UserBasic };

export const memberRepository = {
  async findByOrganization(organizationId: string): Promise<MemberWithUser[]> {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            emailVerified: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    }) as Promise<MemberWithUser[]>;
  },

  async findById(memberId: string): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: { id: memberId },
    });
  },

  async findByIdWithUser(memberId: string): Promise<MemberWithUser | null> {
    return prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            emailVerified: true,
          },
        },
      },
    }) as Promise<MemberWithUser | null>;
  },

  async updateRole(memberId: string, role: MemberRole): Promise<OrganizationMember> {
    return prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
    });
  },

  async delete(memberId: string): Promise<OrganizationMember> {
    return prisma.organizationMember.delete({
      where: { id: memberId },
    });
  },

  async countByRole(organizationId: string, role: MemberRole): Promise<number> {
    return prisma.organizationMember.count({
      where: { organizationId, role },
    });
  },

  async findByUserIdAndOrganization(userId: string, organizationId: string): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  },
};