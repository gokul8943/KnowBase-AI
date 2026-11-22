import { z } from 'zod';

export const listMembersSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export const memberIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
    memberId: z.string().cuid('Invalid member ID'),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
    memberId: z.string().cuid('Invalid member ID'),
  }),
  body: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER'], { errorMap: () => ({ message: 'Role must be OWNER, ADMIN, or MEMBER' }) }),
  }),
});

export const organizationIdParamSchema = z.object({
  params: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>['body'];
export type MemberIdParam = z.infer<typeof memberIdParamSchema>['params'];