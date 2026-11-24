import { z } from 'zod';
import { DocumentStatus } from '@prisma/client';

export const workspaceIdParamSchema = z.object({
  params: z.object({
    workspaceId: z.string().cuid('Invalid workspace ID'),
  }),
});

export const documentIdParamSchema = z.object({
  params: z.object({
    documentId: z.string().cuid('Invalid document ID'),
  }),
});

export const listDocumentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().max(200).optional(),
    fileType: z.string().max(50).optional(),
    status: z.nativeEnum(DocumentStatus).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'size']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({
    documentId: z.string().cuid('Invalid document ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
});

export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;
export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;