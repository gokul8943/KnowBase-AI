import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    logoUrl: z.string().url('Invalid URL').max(500, 'URL too long').optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export const getOrganizationDetailsSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>['body'];
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>['params'];