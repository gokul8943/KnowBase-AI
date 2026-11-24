import type { DocumentStatus } from '@prisma/client';

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
  size: bigint;
  checksum: string;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
  totalSize: bigint;
  byType: Record<string, number>;
}

export interface UploadDocumentInput {
  workspaceId: string;
  files: Express.Multer.File[];
}

export interface CreateDocumentInput {
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
  size: bigint;
  checksum: string;
  status: DocumentStatus;
}

export interface UpdateDocumentInput {
  name?: string;
  status?: DocumentStatus;
  errorMessage?: string | null;
  deletedAt?: Date | null;
  cloudinaryPublicId?: string;
  cloudinaryResourceType?: string;
}

export interface SupportedFileType {
  extension: string;
  mimeType: string;
}

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  { extension: 'pdf', mimeType: 'application/pdf' },
  { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { extension: 'txt', mimeType: 'text/plain' },
  { extension: 'md', mimeType: 'text/markdown' },
  { extension: 'csv', mimeType: 'text/csv' },
];

export const SUPPORTED_EXTENSIONS = SUPPORTED_FILE_TYPES.map((t) => t.extension);
export const SUPPORTED_MIME_TYPES = SUPPORTED_FILE_TYPES.map((t) => t.mimeType);

export const FILE_SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  docx: [
    [0x50, 0x4B, 0x03, 0x04],
    [0x50, 0x4B, 0x05, 0x06],
    [0x50, 0x4B, 0x07, 0x08],
  ],
};

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILES_PER_UPLOAD = 5;