import { api } from '../../../services/api';
import type {
  DocumentResponse,
  PaginatedDocumentsResponse,
  DocumentStatsResponse,
  ListDocumentsParams,
  UploadResponse,
  DownloadResponse,
  PreviewResponse,
} from '../types/document';

export const documentApi = {
  async upload(workspaceId: string, files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await api.client.post<{ success: boolean; data: UploadResponse }>(
      `/workspaces/${workspaceId}/documents`,
      formData,
      {
        // Don't set Content-Type - browser will set it with boundary
        onUploadProgress: () => {
          // Progress handled by the hook
        },
      }
    );
    return response.data.data;
  },

  async list(workspaceId: string, params: ListDocumentsParams = {}): Promise<PaginatedDocumentsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.fileType) searchParams.set('fileType', params.fileType);
    if (params.status) searchParams.set('status', params.status);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const response = await api.client.get<{ success: boolean; data: PaginatedDocumentsResponse }>(
      `/workspaces/${workspaceId}/documents?${searchParams.toString()}`
    );
    return response.data.data;
  },

  async get(documentId: string): Promise<DocumentResponse> {
    const response = await api.client.get<{ success: boolean; data: DocumentResponse }>(`/documents/${documentId}`);
    return response.data.data;
  },

  async download(documentId: string): Promise<DownloadResponse> {
    const response = await api.client.get<{ success: boolean; data: DownloadResponse }>(`/documents/${documentId}/download`);
    return response.data.data;
  },

  async preview(documentId: string): Promise<PreviewResponse> {
    const response = await api.client.get<{ success: boolean; data: PreviewResponse }>(`/documents/${documentId}/preview`);
    return response.data.data;
  },

  async update(documentId: string, name: string): Promise<DocumentResponse> {
    const response = await api.client.patch<{ success: boolean; data: DocumentResponse }>(`/documents/${documentId}`, { name });
    return response.data.data;
  },

  async delete(documentId: string): Promise<void> {
    await api.client.delete(`/documents/${documentId}`);
  },

  async getStats(workspaceId: string): Promise<DocumentStatsResponse> {
    const response = await api.client.get<{ success: boolean; data: DocumentStatsResponse }>(`/workspaces/${workspaceId}/documents/stats`);
    return response.data.data;
  },
};