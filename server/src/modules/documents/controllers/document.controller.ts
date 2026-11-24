import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/utils/asyncHandler';
import { documentService } from '../services/document.service';
import type { ApiResponse } from '../../../shared/types';
import { validateFiles } from '../utils/file-validation';
import crypto from 'crypto';
import type { DocumentStatus } from '@prisma/client';

const generateRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || crypto.randomUUID();
};

export const documentController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId;
    const userId = req.user!.id;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NO_FILES', message: 'No files provided' },
        meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
      };
      return res.status(400).json(response);
    }

    const validatedFiles = validateFiles(files);

    const results = await documentService.uploadDocuments({ workspaceId, userId, files: validatedFiles });

    const successful = results.filter((r) => r.success).map((r) => documentService.mapToResponse(r.document));
    const failed = results.filter((r) => !r.success).map((r) => ({
      filename: r.document?.originalName || 'unknown',
      error: r.error,
    }));

    const response: ApiResponse = {
      success: successful.length > 0,
      data: {
        uploaded: successful,
        failed,
        total: results.length,
        successful: successful.length,
        failedCount: failed.length,
      },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    if (successful.length === 0 && failed.length > 0) {
      return res.status(400).json(response);
    }

    if (failed.length > 0) {
      return res.status(207).json(response);
    }

    return res.status(201).json(response);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId;
    const userId = req.user!.id;

    const { page = 1, limit = 10, search, fileType, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

const result = await documentService.listDocuments(workspaceId, userId, {
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      fileType: fileType as string,
      status: status as DocumentStatus | undefined,
      sortBy: sortBy as 'createdAt' | 'updatedAt' | 'name' | 'size',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    const response: ApiResponse = {
      success: true,
      data: {
        documents: result.documents.map(documentService.mapToResponse),
        pagination: result.pagination,
      },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const userId = req.user!.id;

    const document = await documentService.getDocument(documentId, userId);

    const response: ApiResponse = {
      success: true,
      data: documentService.mapToResponse(document),
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const userId = req.user!.id;

    const document = await documentService.getDocumentForDownload(documentId, userId);
    const downloadUrl = await documentService.generateDownloadUrl(document);

    const response: ApiResponse = {
      success: true,
      data: {
        downloadUrl,
        filename: document.originalName,
        mimeType: document.mimeType,
        size: document.size.toString(),
      },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  preview: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const userId = req.user!.id;

    const document = await documentService.getDocumentForPreview(documentId, userId);
    const previewUrl = await documentService.generatePreviewUrl(document);

    const response: ApiResponse = {
      success: true,
      data: {
        previewUrl,
        filename: document.originalName,
        mimeType: document.mimeType,
        extension: document.extension,
        size: document.size.toString(),
      },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const userId = req.user!.id;
    const { name } = req.body;

    const document = await documentService.updateDocument(documentId, userId, name);

    const response: ApiResponse = {
      success: true,
      data: documentService.mapToResponse(document),
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const documentId = req.params.documentId;
    const userId = req.user!.id;

    await documentService.deleteDocument(documentId, userId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Document deleted successfully' },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId;
    const userId = req.user!.id;

    const stats = await documentService.getDocumentStats(workspaceId, userId);

    const response: ApiResponse = {
      success: true,
      data: {
        ...stats,
        totalSize: stats.totalSize.toString(),
      },
      meta: { timestamp: new Date().toISOString(), requestId: generateRequestId(req) },
    };

    res.json(response);
  }),
};