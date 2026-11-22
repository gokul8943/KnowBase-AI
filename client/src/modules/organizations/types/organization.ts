export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  role: MemberRole;
  workspaces: WorkspaceResponse[];
}

export interface ListOrganizationsResponse {
  organizations: OrganizationResponse[];
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface OrganizationMemberResponse {
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
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMembersResponse {
  members: OrganizationMemberResponse[];
}

export interface UpdateMemberRoleInput {
  role: MemberRole;
}

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
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface ListInvitationsResponse {
  invitations: InvitationResponse[];
}

export interface CreateInvitationInput {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface AcceptInvitationInput {
  token: string;
}

export interface InvitationWithToken extends InvitationResponse {
  token?: string;
  acceptUrl?: string;
}