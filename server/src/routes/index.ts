import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { organizationRoutes } from '../modules/organizations/organization.routes';
import { workspaceRoutes } from '../modules/workspaces/workspace.routes';
import { invitationRoutes } from '../modules/invitations/invitation.routes';
import { memberRoutes } from '../modules/members/member.routes';
import { healthRoutes } from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/invitations', invitationRoutes);
router.use('/members', memberRoutes);
router.use('/health', healthRoutes);

export { router as apiRoutes };
