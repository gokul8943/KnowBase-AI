export interface StorageMetadata {
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
  secureUrl: string;
  createdAt: string;
  etag: string;
}

export interface UploadOptions {
  filePath: string;
  originalName: string;
  mimeType: string;
  folder?: string;
  publicId?: string;
}

export interface DeleteOptions {
  publicId: string;
  resourceType: string;
}

export interface SecureUrlOptions {
  publicId: string;
  resourceType: string;
  expiresIn?: number;
  attachment?: boolean;
  filename?: string;
}

export interface FileMetadata {
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: string;
  etag: string;
}

export interface IStorageProvider {
  upload(options: UploadOptions): Promise<StorageMetadata>;
  delete(options: DeleteOptions): Promise<void>;
  getSecureUrl(options: SecureUrlOptions): Promise<string>;
  getFileMetadata(publicId: string, resourceType: string): Promise<FileMetadata>;
}

export const STORAGE_PROVIDER = 'cloudinary';