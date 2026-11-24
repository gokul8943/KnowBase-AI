import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { documentApi } from '../api/documentApi';
import type { ListDocumentsParams } from '../types/document';

export function useDocuments(params: ListDocumentsParams = {}) {
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;

  return useQuery({
    queryKey: ['documents', workspaceId, params],
    queryFn: () => documentApi.list(workspaceId!, params),
    enabled: !!workspaceId,
    staleTime: 30000,
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentApi.get(documentId),
    enabled: !!documentId,
    staleTime: 60000,
  });
}

export function useDocumentStats(workspaceId: string) {
  return useQuery({
    queryKey: ['documentStats', workspaceId],
    queryFn: () => documentApi.getStats(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60000,
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;

  return useMutation({
    mutationFn: (files: File[]) => documentApi.upload(workspaceId!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['documentStats', workspaceId] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;

  return useMutation({
    mutationFn: (documentId: string) => documentApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['documentStats', workspaceId] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;

  return useMutation({
    mutationFn: ({ documentId, name }: { documentId: string; name: string }) => documentApi.update(documentId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
    },
  });
}

export function useDocumentDownload(documentId: string) {
  return useQuery({
    queryKey: ['documentDownload', documentId],
    queryFn: () => documentApi.download(documentId),
    enabled: !!documentId,
    staleTime: 300000,
  });
}

export function useDocumentPreview(documentId: string) {
  return useQuery({
    queryKey: ['documentPreview', documentId],
    queryFn: () => documentApi.preview(documentId),
    enabled: !!documentId,
    staleTime: 300000,
  });
}