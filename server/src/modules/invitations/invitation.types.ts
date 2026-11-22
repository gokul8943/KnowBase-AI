import type { MemberRole } from '@prisma/client';

export interface InvitationResponse {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface CreateInvitationInput {
  email: string;
  role: MemberRole;
}

export interface AcceptInvitationInput {
  token: string;
}

export interface InvitationWithToken extends InvitationResponse {
  token?: string;
  acceptUrl?: string;
}

export interface ListInvitationsResponse {
  invitations: InvitationResponse[];
}

export const INVITATION_EXPIRY_HOURS = 48;
export const INVITATION_TOKEN_LENGTH = 32;