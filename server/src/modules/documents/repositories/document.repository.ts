import { prisma } from '../../../config/prisma';
import type { Document, DocumentStatus, Prisma } from '@prisma/client';
import type { CreateDocumentInput, UpdateDocumentInput, ListDocumentsParams, PaginatedDocumentsResponse, DocumentStatsResponse } from '../types/document.types';

export const documentRepository = {
  async create(data: CreateDocumentInput): Promise<Document> {
    return prisma.document.create({
      data: {
        organizationId: data.organizationId,
        workspaceId: data.workspaceId,
        uploadedById: data.uploadedById,
        name: data.name,
        originalName: data.originalName,
        storageProvider: data.storageProvider,
        cloudinaryPublicId: data.cloudinaryPublicId,
        cloudinaryResourceType: data.cloudinaryResourceType,
        mimeType: data.mimeType,
        extension: data.extension,
        size: data.size,
        checksum: data.checksum,
        status: data.status,
      },
    });
  },

  async createMany(data: CreateDocumentInput[]): Promise<Document[]> {
    return prisma.$transaction(
      data.map((d) =>
        prisma.document.create({
          data: {
            organizationId: d.organizationId,
            workspaceId: d.workspaceId,
            uploadedById: d.uploadedById,
            name: d.name,
            originalName: d.originalName,
            storageProvider: d.storageProvider,
            cloudinaryPublicId: d.cloudinaryPublicId,
            cloudinaryResourceType: d.cloudinaryResourceType,
            mimeType: d.mimeType,
            extension: d.extension,
            size: d.size,
            checksum: d.checksum,
            status: d.status,
          },
        })
      )
    );
  },

  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id },
    });
  },

  async findByIdWithDetails(id: string): Promise<(Document & { workspace: { organizationId: string }; uploadedBy: { id: string; name: string; email: string } }) | null> {
    return prisma.document.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { organizationId: true },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async findByWorkspace(
    workspaceId: string,
    params: ListDocumentsParams
  ): Promise<PaginatedDocumentsResponse> {
    const { page = 1, limit = 10, search, fileType, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fileType) {
      where.extension = fileType;
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async update(id: string, data: UpdateDocumentInput): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data,
    });
  },

  async updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? undefined,
      },
    });
  },

  async softDelete(id: string): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  },

  async hardDelete(id: string): Promise<Document> {
    return prisma.document.delete({
      where: { id },
    });
  },

  async findByChecksum(workspaceId: string, checksum: string): Promise<Document | null> {
    return prisma.document.findFirst({
      where: {
        workspaceId,
        checksum,
        deletedAt: null,
      },
    });
  },

  async getStats(workspaceId: string): Promise<DocumentStatsResponse> {
    const [total, uploaded, pending, failed, sizeResult, byType] = await Promise.all([
      prisma.document.count({ where: { workspaceId, deletedAt: null } }),
      prisma.document.count({ where: { workspaceId, status: 'UPLOADED', deletedAt: null } }),
      prisma.document.count({ where: { workspaceId, status: 'PENDING', deletedAt: null } }),
      prisma.document.count({ where: { workspaceId, status: 'FAILED', deletedAt: null } }),
      prisma.document.aggregate({
        where: { workspaceId, deletedAt: null, status: 'UPLOADED' },
        _sum: { size: true },
      }),
      prisma.document.groupBy({
        by: ['extension'],
        where: { workspaceId, deletedAt: null },
        _count: { extension: true },
      }),
    ]);

    return {
      total,
      uploaded,
      pending,
      failed,
      totalSize: sizeResult._sum.size ?? 0n,
      byType: byType.reduce((acc, item) => {
        acc[item.extension] = item._count.extension;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  async countByWorkspace(workspaceId: string): Promise<number> {
    return prisma.document.count({
      where: { workspaceId, deletedAt: null },
    });
  },

  async exists(id: string, workspaceId: string): Promise<boolean> {
    const doc = await prisma.document.findFirst({
      where: { id, workspaceId, deletedAt: null },
      select: { id: true },
    });
    return doc !== null;
  },

  async verifyWorkspaceAccess(documentId: string, userId: string): Promise<Document & { workspace: { organizationId: string } } | null> {
    return prisma.document.findFirst({
      where: {
        id: documentId,
        deletedAt: null,
        workspace: {
          organization: {
            members: {
              some: { userId },
            },
          },
        },
      },
      include: {
        workspace: {
          select: { organizationId: true },
        },
      },
    });
  },
};