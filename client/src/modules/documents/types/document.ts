export type DocumentStatus = 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED' | 'DELETING' | 'DELETED';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface FileWithProgress {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface DocumentResponse {
  id: string;
  organizationId: string;
  workspaceId: string;
  uploadedById: string;
  name: string;
  originalName: string;
  storageProvider: string;
  cloudinaryPublicId: string;
  cloudinaryResourceType: string;
  mimeType: string;
  extension: string;
  size: string;
  checksum: string;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedDocumentsResponse {
  documents: DocumentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentStatsResponse {
  total: number;
  uploaded: number;
  pending: number;
  failed: number;
  totalSize: string;
  byType: Record<string, number>;
}

export interface ListDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  fileType?: string;
  status?: DocumentStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadResponse {
  uploaded: DocumentResponse[];
  failed: Array<{ filename: string; error: string }>;
  total: number;
  successful: number;
  failedCount: number;
}

export interface DownloadResponse {
  downloadUrl: string;
  filename: string;
  mimeType: string;
  size: string;
}

export interface PreviewResponse {
  previewUrl: string;
  filename: string;
  mimeType: string;
  extension: string;
  size: string;
}

export const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'csv'] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export const FILE_TYPE_LABELS: Record<SupportedExtension, string> = {
  pdf: 'PDF',
  docx: 'Word',
  txt: 'Text',
  md: 'Markdown',
  csv: 'CSV',
};

export const FILE_TYPE_ICONS: Record<SupportedExtension, string> = {
  pdf: 'FileText',
  docx: 'FileText',
  txt: 'FileText',
  md: 'FileText',
  csv: 'Table',
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: 'Pending',
  UPLOADING: 'Uploading',
  UPLOADED: 'Uploaded',
  FAILED: 'Failed',
  DELETING: 'Deleting',
  DELETED: 'Deleted',
};

export const STATUS_VARIANTS: Record<DocumentStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'> = {
  PENDING: 'warning',
  UPLOADING: 'info',
  UPLOADED: 'success',
  FAILED: 'destructive',
  DELETING: 'warning',
  DELETED: 'secondary',
};

export function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}