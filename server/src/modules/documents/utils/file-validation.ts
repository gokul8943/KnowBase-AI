import { readFileSync } from 'fs';
import { SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES, SUPPORTED_FILE_TYPES, FILE_SIGNATURES } from '../types/document.types';
import { AppError } from '../../../shared/errors/AppError';
import { config } from '../../../config';

export interface ValidatedFile {
  file: Express.Multer.File;
  extension: string;
  mimeType: string;
}

export const validateFileCount = (files: Express.Multer.File[]): void => {
  const maxFiles = config.upload.maxFilesPerUpload;
  if (files.length > maxFiles) {
    throw new AppError('TOO_MANY_FILES', `Maximum ${maxFiles} files allowed per upload`, 400);
  }
  if (files.length === 0) {
    throw new AppError('NO_FILES', 'No files provided', 400);
  }
};

export const validateFileSize = (file: Express.Multer.File): void => {
  const maxSizeBytes = config.upload.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new AppError('FILE_TOO_LARGE', `File "${file.originalname}" exceeds maximum size of ${config.upload.maxFileSizeMb}MB`, 400);
  }
  if (file.size === 0) {
    throw new AppError('EMPTY_FILE', `File "${file.originalname}" is empty`, 400);
  }
};

export const validateExtension = (file: Express.Multer.File): string => {
  const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
  if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new AppError('INVALID_EXTENSION', `File "${file.originalname}" has unsupported extension. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`, 400);
  }
  return extension;
};

export const validateMimeType = (file: Express.Multer.File, extension: string): string => {
  const expectedMimeType = SUPPORTED_FILE_TYPES.find((t) => t.extension === extension)?.mimeType;
  if (!expectedMimeType) {
    throw new AppError('INVALID_FILE_TYPE', `File "${file.originalname}" has unknown type`, 400);
  }
  if (file.mimetype !== expectedMimeType && !SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    throw new AppError('INVALID_MIME_TYPE', `File "${file.originalname}" has mismatched MIME type`, 400);
  }
  return expectedMimeType;
};

export const validateFileSignature = (file: Express.Multer.File, extension: string): void => {
  const signatures = FILE_SIGNATURES[extension];
  if (!signatures) {
    return;
  }

  try {
    const buffer = readFileSync(file.path);
    const header = Array.from(buffer.slice(0, 8));

    const matches = signatures.some((sig) => sig.every((byte, i) => header[i] === byte));
    if (!matches) {
      throw new AppError('INVALID_FILE_SIGNATURE', `File "${file.originalname}" does not match expected format for .${extension}`, 400);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('FILE_READ_ERROR', `Failed to validate file "${file.originalname}"`, 500);
  }
};

export const validateFilename = (filename: string): void => {
  if (filename.length > 255) {
    throw new AppError('FILENAME_TOO_LONG', 'Filename exceeds 255 characters', 400);
  }
  const dangerousPatterns = [
    /\.\./,
    /[<>:"|?*]/,
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
  ];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      throw new AppError('INVALID_FILENAME', 'Filename contains invalid characters', 400);
    }
  }
};

export const validateFile = (file: Express.Multer.File): ValidatedFile => {
  validateFileSize(file);
  validateFilename(file.originalname);
  const extension = validateExtension(file);
  const mimeType = validateMimeType(file, extension);
  validateFileSignature(file, extension);

  return { file, extension, mimeType };
};

export const validateFiles = (files: Express.Multer.File[]): ValidatedFile[] => {
  validateFileCount(files);
  return files.map(validateFile);
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"|?*]/g, '_')
    .replace(/\.\.+/g, '.')
    .trim();
};