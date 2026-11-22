import { api } from '../../../services/api';
import type {
  WorkspaceResponse,
  ListWorkspacesResponse,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from '../types/workspace';

export const workspaceApi = {
  async list(organizationId: string): Promise<WorkspaceResponse[]> {
    const response = await api.client.get<{ success: boolean; data: ListWorkspacesResponse }>(`/organizations/${organizationId}/workspaces`);
    return response.data.data.workspaces;
  },

  async get(workspaceId: string): Promise<WorkspaceResponse> {
    const response = await api.client.get<{ success: boolean; data: WorkspaceResponse }>(`/workspaces/${workspaceId}`);
    return response.data.data;
  },

  async create(organizationId: string, data: CreateWorkspaceInput): Promise<WorkspaceResponse> {
    const response = await api.client.post<{ success: boolean; data: WorkspaceResponse }>(`/organizations/${organizationId}/workspaces`, data);
    return response.data.data;
  },

  async update(workspaceId: string, data: UpdateWorkspaceInput): Promise<WorkspaceResponse> {
    const response = await api.client.patch<{ success: boolean; data: WorkspaceResponse }>(`/workspaces/${workspaceId}`, data);
    return response.data.data;
  },

  async delete(workspaceId: string): Promise<void> {
    await api.client.delete(`/workspaces/${workspaceId}`);
  },
};