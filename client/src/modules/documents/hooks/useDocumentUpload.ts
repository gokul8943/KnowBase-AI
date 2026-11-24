import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useOrganization } from '../../../context/OrganizationContext';
import { documentApi } from '../api/documentApi';
import type { UploadResponse } from '../types/document';
import type { FileWithProgress } from '../types/document';

interface UseDocumentUploadOptions {
  onSuccess?: (data: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useDocumentUpload(options: UseDocumentUploadOptions = {}) {
  const { activeOrganization } = useOrganization();
  const workspaceId = activeOrganization?.id;
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (filesToUpload: File[]) => documentApi.upload(workspaceId!, filesToUpload),
    onSuccess: (data) => {
      setIsUploading(false);
      setFiles((prev) => prev.map((f) => ({ ...f, progress: 100, status: 'success' as const })));
      options.onSuccess?.(data);
    },
    onError: (error) => {
      setIsUploading(false);
      setFiles((prev) =>
        prev.map((f) => (f.status === 'uploading' ? { ...f, status: 'error' as const, error: error.message } : f))
      );
      options.onError?.(error as Error);
    },
  });

  const addFiles = useCallback((newFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = newFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...filesWithProgress]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const startUpload = useCallback(() => {
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setFiles((prev) =>
      prev.map((f) => (pendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: 'uploading' as const } : f))
    );

    uploadMutation.mutate(pendingFiles.map((f) => f.file));
  }, [files, uploadMutation]);

  const retryFile = useCallback(
    (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file || file.status !== 'error') return;

      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'pending' as const, error: undefined } : f)));
    },
    [files]
  );

  const canUpload = files.some((f) => f.status === 'pending' || f.status === 'error') && !isUploading;

  return {
    files,
    isUploading: isUploading || uploadMutation.isPending,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    retryFile,
    canUpload,
    error: uploadMutation.error,
  };
}