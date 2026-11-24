import { documentRepository } from '../repositories/document.repository';
import { workspaceService } from '../../workspaces/workspace.service';
import { organizationRepository } from '../../organizations/organization.repository';
import { cloudinaryStorage } from '../storage/cloudinary.storage';
import { calculateChecksum } from '../utils/file-checksum';
import { sanitizeFilename } from '../utils/file-validation';
import { NotFoundError, AuthorizationError } from '../../../shared/errors/AppError';
import type { Document, DocumentStatus } from '@prisma/client';
import type { ValidatedFile } from '../utils/file-validation';
import { getCloudinaryFolder } from '../../../config/cloudinary';

interface UploadResult {
  document: Document;
  success: boolean;
  error?: string;
}

interface UploadOptions {
  workspaceId: string;
  userId: string;
  files: ValidatedFile[];
}

export const documentService = {
  async uploadDocuments({ workspaceId, userId, files }: UploadOptions): Promise<UploadResult[]> {
    const workspace = await workspaceService.verifyWorkspaceAccess(workspaceId, userId);
    const organizationId = workspace.organization.id;

    const member = await organizationRepository.isMember(organizationId, userId);
    if (!member) {
      throw new AuthorizationError('You are not a member of this organization');
    }

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(member.role)) {
      throw new AuthorizationError('Insufficient permissions to upload documents');
    }

    const results: UploadResult[] = [];

    for (const { file, extension, mimeType } of files) {
      try {
        const checksum = calculateChecksum(file.path);

        const existing = await documentRepository.findByChecksum(workspaceId, checksum);
        if (existing) {
          results.push({
            document: existing,
            success: false,
            error: `File "${file.originalname}" already exists (duplicate content)`,
          });
          continue;
        }

        const originalName = sanitizeFilename(file.originalname);
        const name = originalName.replace(/\.[^/.]+$/, '');

        const pendingDoc = await documentRepository.create({
          organizationId,
          workspaceId,
          uploadedById: userId,
          name,
          originalName,
          storageProvider: 'cloudinary',
          cloudinaryPublicId: '',
          cloudinaryResourceType: '',
          mimeType,
          extension,
          size: BigInt(file.size),
          checksum,
          status: 'UPLOADING',
        });

        await documentRepository.updateStatus(pendingDoc.id, 'UPLOADING');

        const storageMetadata = await cloudinaryStorage.upload({
          filePath: file.path,
          originalName,
          mimeType,
          folder: getCloudinaryFolder(),
        });

        const uploadedDoc = await documentRepository.update(pendingDoc.id, {
          cloudinaryPublicId: storageMetadata.publicId,
          cloudinaryResourceType: storageMetadata.resourceType,
          status: 'UPLOADED',
        });

        results.push({ document: uploadedDoc, success: true });
      } catch (error) {
        console.error(`Upload failed for ${file.originalname}:`, error);
        results.push({
          document: null as unknown as Document,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    return results;
  },

  async listDocuments(
    workspaceId: string,
    userId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      fileType?: string;
      status?: DocumentStatus;
      sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const workspace = await workspaceService.verifyWorkspaceAccess(workspaceId, userId);
    await organizationRepository.isMember(workspace.organization.id, userId);

    return documentRepository.findByWorkspace(workspaceId, params);
  },

  async getDocument(documentId: string, userId: string) {
    const document = await documentRepository.findByIdWithDetails(documentId);
    if (!document) {
      throw new NotFoundError('Document');
    }

    await organizationRepository.isMember(document.workspace.organizationId, userId);

    return document;
  },

  async getDocumentForDownload(documentId: string, userId: string) {
    const document = await this.getDocument(documentId, userId);

    if (document.status !== 'UPLOADED') {
      throw new AuthorizationError('Document is not available for download');
    }

    return document;
  },

  async getDocumentForPreview(documentId: string, userId: string) {
    const document = await this.getDocument(documentId, userId);

    if (document.status !== 'UPLOADED') {
      throw new AuthorizationError('Document is not available for preview');
    }

    return document;
  },

  async generateDownloadUrl(document: Document): Promise<string> {
    return cloudinaryStorage.getSecureUrl({
      publicId: document.cloudinaryPublicId,
      resourceType: document.cloudinaryResourceType,
      expiresIn: 3600,
      attachment: true,
      filename: document.originalName,
    });
  },

  async generatePreviewUrl(document: Document): Promise<string> {
    return cloudinaryStorage.getSecureUrl({
      publicId: document.cloudinaryPublicId,
      resourceType: document.cloudinaryResourceType,
      expiresIn: 3600,
      attachment: false,
    });
  },

  async updateDocument(documentId: string, userId: string, name: string) {
    const document = await this.getDocument(documentId, userId);

    const member = await organizationRepository.isMember(document.workspace.organizationId, userId);
    if (!member || (member.role === 'MEMBER' && document.uploadedById !== userId)) {
      throw new AuthorizationError('You can only rename your own documents');
    }

    return documentRepository.update(documentId, { name });
  },

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getDocument(documentId, userId);

    const member = await organizationRepository.isMember(document.workspace.organizationId, userId);
    if (!member) {
      throw new AuthorizationError('You are not a member of this organization');
    }

    const canDelete = member.role === 'OWNER' || member.role === 'ADMIN' || document.uploadedById === userId;
    if (!canDelete) {
      throw new AuthorizationError('You can only delete your own documents');
    }

    await documentRepository.updateStatus(documentId, 'DELETING');

    try {
      await cloudinaryStorage.delete({
        publicId: document.cloudinaryPublicId,
        resourceType: document.cloudinaryResourceType,
      });
      await documentRepository.softDelete(documentId);
    } catch (error) {
      await documentRepository.updateStatus(documentId, 'FAILED', error instanceof Error ? error.message : 'Deletion failed');
      throw error;
    }
  },

  async getDocumentStats(workspaceId: string, userId: string) {
    const workspace = await workspaceService.verifyWorkspaceAccess(workspaceId, userId);
    await organizationRepository.isMember(workspace.organization.id, userId);

    return documentRepository.getStats(workspaceId);
  },

  mapToResponse(document: Document & { uploadedBy?: { id: string; name: string; email: string } }) {
    return {
      id: document.id,
      organizationId: document.organizationId,
      workspaceId: document.workspaceId,
      uploadedById: document.uploadedById,
      name: document.name,
      originalName: document.originalName,
      storageProvider: document.storageProvider,
      cloudinaryPublicId: document.cloudinaryPublicId,
      cloudinaryResourceType: document.cloudinaryResourceType,
      mimeType: document.mimeType,
      extension: document.extension,
      size: document.size,
      checksum: document.checksum,
      status: document.status,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
      uploadedBy: document.uploadedBy,
    };
  },
};