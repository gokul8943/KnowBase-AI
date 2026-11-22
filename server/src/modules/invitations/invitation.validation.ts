import { z } from 'zod';

export const createInvitationSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    role: z.enum(['ADMIN', 'MEMBER'], { errorMap: () => ({ message: 'Role must be ADMIN or MEMBER' }) }),
  }),
});

export const listInvitationsSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export const invitationIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
    invitationId: z.string().cuid('Invalid invitation ID'),
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>['body'];
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>['body'];