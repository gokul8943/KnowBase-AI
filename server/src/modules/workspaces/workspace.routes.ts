import { Router } from 'express';
import { workspaceController } from './workspace.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireOrganizationMember } from '../organizations/organization.middleware';
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema, organizationIdParamSchema } from './workspace.validation';

const router = Router();

router.use(authMiddleware);

router.get('/organizations/:organizationId/workspaces', validate(organizationIdParamSchema), requireOrganizationMember, workspaceController.list);
router.get('/workspaces/:workspaceId', validate(workspaceIdParamSchema), workspaceController.get);
router.post('/organizations/:organizationId/workspaces', validate(createWorkspaceSchema), requireOrganizationMember, workspaceController.create);
router.patch('/workspaces/:workspaceId', validate(updateWorkspaceSchema), workspaceController.update);
router.delete('/workspaces/:workspaceId', validate(workspaceIdParamSchema), workspaceController.delete);

export { router as workspaceRoutes };