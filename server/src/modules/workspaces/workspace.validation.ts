import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    workspaceId: z.string().cuid('Invalid workspace ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const workspaceIdParamSchema = z.object({
  params: z.object({
    workspaceId: z.string().cuid('Invalid workspace ID'),
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>['body'];
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>['params'];
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>['params'];