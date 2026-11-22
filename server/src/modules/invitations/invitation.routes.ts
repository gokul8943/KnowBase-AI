import { Router } from 'express';
import { invitationController } from './invitation.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireOrganizationMember, requireAdminOrOwner } from '../organizations/organization.middleware';
import { createInvitationSchema, listInvitationsSchema, invitationIdParamSchema, acceptInvitationSchema } from './invitation.validation';

const router = Router();

router.use(authMiddleware);

router.post('/organizations/:organizationId/invitations', validate(createInvitationSchema), requireOrganizationMember, requireAdminOrOwner, invitationController.create);
router.get('/organizations/:organizationId/invitations', validate(listInvitationsSchema), requireOrganizationMember, invitationController.list);
router.delete('/organizations/:organizationId/invitations/:invitationId', validate(invitationIdParamSchema), requireOrganizationMember, requireAdminOrOwner, invitationController.revoke);
router.post('/invitations/accept', validate(acceptInvitationSchema), invitationController.accept);

export { router as invitationRoutes };