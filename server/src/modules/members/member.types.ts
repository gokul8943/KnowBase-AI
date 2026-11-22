import type { MemberRole } from '@prisma/client';

export interface MemberResponse {
  id: string;
  organizationId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
  };
  role: MemberRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateMemberRoleInput {
  role: MemberRole;
}

export interface ListMembersResponse {
  members: MemberResponse[];
}

export type MemberRoleValue = 'OWNER' | 'ADMIN' | 'MEMBER';