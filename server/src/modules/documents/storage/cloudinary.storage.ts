import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryFolder } from '../../../config/cloudinary';
import type {
  IStorageProvider,
  StorageMetadata,
  UploadOptions,
  DeleteOptions,
  SecureUrlOptions,
  FileMetadata,
} from './storage.interface';
import { AppError } from '../../../shared/errors/AppError';

export class CloudinaryStorage implements IStorageProvider {
  private readonly folder: string;

  constructor() {
    this.folder = getCloudinaryFolder();
  }

  async upload(options: UploadOptions): Promise<StorageMetadata> {
    try {
      const { filePath, originalName, mimeType, folder, publicId } = options;

      const uploadFolder = folder || this.folder;
      const uploadPublicId = publicId || this.generatePublicId(originalName);

      const resourceType = this.getResourceType(mimeType);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: uploadFolder,
        public_id: uploadPublicId,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        context: {
          original_name: originalName,
        },
      });

      return {
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        url: result.url,
        secureUrl: result.secure_url,
        createdAt: result.created_at,
        etag: result.etag,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STORAGE_UPLOAD_FAILED', 'Failed to upload file to storage', 500);
    }
  }

  async delete(options: DeleteOptions): Promise<void> {
    try {
      const { publicId, resourceType } = options;

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STORAGE_DELETE_FAILED', 'Failed to delete file from storage', 500);
    }
  }

  async getSecureUrl(options: SecureUrlOptions): Promise<string> {
    try {
      const { publicId, resourceType, expiresIn = 3600, attachment = false, filename } = options;

      const signOptions: Record<string, unknown> = {
        resource_type: resourceType,
        type: 'upload',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      };

      if (attachment && filename) {
        signOptions.flags = 'attachment';
        signOptions.attachment = filename;
      }

      const url = cloudinary.url(publicId, signOptions);
      return url;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STORAGE_URL_FAILED', 'Failed to generate secure URL', 500);
    }
  }

  async getFileMetadata(publicId: string, resourceType: string): Promise<FileMetadata> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return {
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        etag: result.etag,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STORAGE_METADATA_FAILED', 'Failed to retrieve file metadata', 500);
    }
  }

  private getResourceType(mimeType: string): 'raw' | 'image' | 'video' | 'auto' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  private generatePublicId(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const sanitizedName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    return `${sanitizedName}_${timestamp}_${random}`;
  }
}

export const cloudinaryStorage = new CloudinaryStorage();