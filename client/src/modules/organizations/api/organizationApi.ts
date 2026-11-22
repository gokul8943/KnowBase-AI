import { api } from '../../../services/api';
import type {
  OrganizationResponse,
  ListOrganizationsResponse,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMemberResponse,
  ListMembersResponse,
  UpdateMemberRoleInput,
  InvitationResponse,
  ListInvitationsResponse,
  CreateInvitationInput,
  AcceptInvitationInput,
  InvitationWithToken,
} from '../types/organization';

export const organizationApi = {
  async create(data: CreateOrganizationInput): Promise<OrganizationResponse> {
    const response = await api.client.post<{ success: boolean; data: OrganizationResponse }>('/organizations', data);
    return response.data.data;
  },

  async list(): Promise<OrganizationResponse[]> {
    const response = await api.client.get<{ success: boolean; data: ListOrganizationsResponse }>('/organizations');
    return response.data.data.organizations;
  },

  async get(organizationId: string): Promise<OrganizationResponse> {
    const response = await api.client.get<{ success: boolean; data: OrganizationResponse }>(`/organizations/${organizationId}`);
    return response.data.data;
  },

  async update(organizationId: string, data: UpdateOrganizationInput): Promise<OrganizationResponse> {
    const response = await api.client.patch<{ success: boolean; data: OrganizationResponse }>(`/organizations/${organizationId}`, data);
    return response.data.data;
  },

  async delete(organizationId: string): Promise<void> {
    await api.client.delete(`/organizations/${organizationId}`);
  },

  async listMembers(organizationId: string): Promise<OrganizationMemberResponse[]> {
    const response = await api.client.get<{ success: boolean; data: ListMembersResponse }>(`/organizations/${organizationId}/members`);
    return response.data.data.members;
  },

  async updateMemberRole(organizationId: string, memberId: string, data: UpdateMemberRoleInput): Promise<OrganizationMemberResponse> {
    const response = await api.client.patch<{ success: boolean; data: OrganizationMemberResponse }>(`/organizations/${organizationId}/members/${memberId}/role`, data);
    return response.data.data;
  },

  async removeMember(organizationId: string, memberId: string): Promise<void> {
    await api.client.delete(`/organizations/${organizationId}/members/${memberId}`);
  },

  async listInvitations(organizationId: string): Promise<InvitationResponse[]> {
    const response = await api.client.get<{ success: boolean; data: ListInvitationsResponse }>(`/organizations/${organizationId}/invitations`);
    return response.data.data.invitations;
  },

  async createInvitation(organizationId: string, data: CreateInvitationInput): Promise<InvitationWithToken> {
    const response = await api.client.post<{ success: boolean; data: InvitationWithToken }>(`/organizations/${organizationId}/invitations`, data);
    return response.data.data;
  },

  async revokeInvitation(organizationId: string, invitationId: string): Promise<void> {
    await api.client.delete(`/organizations/${organizationId}/invitations/${invitationId}`);
  },

  async acceptInvitation(data: AcceptInvitationInput): Promise<{ organizationId: string; role: string }> {
    const response = await api.client.post<{ success: boolean; data: { organizationId: string; role: string } }>('/invitations/accept', data);
    return response.data.data;
  },
};