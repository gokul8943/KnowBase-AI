import type { Organization, OrganizationMember, Workspace, MemberRole } from '@prisma/client';

export interface OrganizationWithDetails extends Organization {
  members?: OrganizationMemberWithUser[];
  workspaces?: Workspace[];
  _count?: {
    members: number;
    workspaces: number;
  };
}

export interface OrganizationMemberWithUser extends OrganizationMember {
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    emailVerified: boolean;
  };
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  role: MemberRole;
  workspaces: WorkspaceResponse[];
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrganizationsResponse {
  organizations: OrganizationResponse[];
}

export interface SlugGenerationOptions {
  maxLength?: number;
  separator?: string;
}