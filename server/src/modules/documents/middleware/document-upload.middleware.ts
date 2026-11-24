import type { Request, Response, NextFunction } from 'express';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppError } from '../../../shared/errors/AppError';

export const cleanupUploadedFiles = (req: Request, res: Response, next: NextFunction): void => {
  const files = req.files as Express.Multer.File[] | undefined;
  const file = req.file as Express.Multer.File | undefined;

  const cleanup = (filePath: string) => {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup errors
    }
  };

  const originalSend = res.send;
  res.send = function (body?: unknown): Response {
    if (files) {
      files.forEach((f) => cleanup(f.path));
    }
    if (file) {
      cleanup(file.path);
    }
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    if (files) {
      files.forEach((f) => cleanup(f.path));
    }
    if (file) {
      cleanup(file.path);
    }
  });

  res.on('close', () => {
    if (files) {
      files.forEach((f) => cleanup(f.path));
    }
    if (file) {
      cleanup(file.path);
    }
  });

  next();
};

export const handleMulterError = (err: Error, _req: Request, _res: Response, next: NextFunction): void => {
  if (err.name === 'MulterError') {
    switch (err.message) {
      case 'File too large':
        return next(new AppError('FILE_TOO_LARGE', `File exceeds maximum size of ${process.env.MAX_FILE_SIZE_MB || 20}MB`, 400));
      case 'Too many files':
        return next(new AppError('TOO_MANY_FILES', `Maximum ${process.env.MAX_FILES_PER_UPLOAD || 5} files allowed`, 400));
      case 'Unexpected field':
        return next(new AppError('UNEXPECTED_FIELD', 'Unexpected file field', 400));
      default:
        return next(new AppError('UPLOAD_ERROR', err.message, 400));
    }
  }
  if (err.message === 'Unsupported file type') {
    return next(new AppError('INVALID_FILE_TYPE', 'Unsupported file type', 400));
  }
  next(err);
};

export const ensureUploadsDir = (): void => {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
};