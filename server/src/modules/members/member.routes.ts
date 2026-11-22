import { Router } from 'express';
import { memberController } from './member.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireOrganizationMember, requireAdminOrOwner } from '../organizations/organization.middleware';
import { listMembersSchema, memberIdParamSchema, updateMemberRoleSchema } from './member.validation';

const router = Router();

router.use(authMiddleware);

router.get('/organizations/:organizationId/members', validate(listMembersSchema), requireOrganizationMember, memberController.list);
router.patch('/organizations/:organizationId/members/:memberId/role', validate(updateMemberRoleSchema), requireOrganizationMember, requireAdminOrOwner, memberController.updateRole);
router.delete('/organizations/:organizationId/members/:memberId', validate(memberIdParamSchema), requireOrganizationMember, requireAdminOrOwner, memberController.remove);

export { router as memberRoutes };