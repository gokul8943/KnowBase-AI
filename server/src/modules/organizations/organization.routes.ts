import { Router } from 'express';
import { organizationController } from './organization.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { createOrganizationSchema, updateOrganizationSchema, organizationIdParamSchema, getOrganizationDetailsSchema } from './organization.validation';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrganizationSchema), organizationController.create);
router.get('/', organizationController.list);
router.get('/:organizationId', validate(getOrganizationDetailsSchema), organizationController.getDetails);
router.patch('/:organizationId', validate(updateOrganizationSchema), organizationController.update);
router.delete('/:organizationId', validate(organizationIdParamSchema), organizationController.delete);

export { router as organizationRoutes };