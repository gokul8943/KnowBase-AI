import { Router } from 'express';
import { workspaceController } from './workspace.controller';
import { documentController } from '../documents/controllers/document.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { requireOrganizationMember, requireWorkspaceMember } from '../organizations/organization.middleware';
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema, organizationIdParamSchema } from './workspace.validation';
import { listDocumentsQuerySchema } from '../documents/validators/document.validation';
import multer from 'multer';
import { config } from '../../config';

const router = Router();

router.use(authMiddleware);

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: config.upload.maxFilesPerUpload,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

router.get('/organizations/:organizationId/workspaces', validate(organizationIdParamSchema), requireOrganizationMember, workspaceController.list);
router.get('/:workspaceId', validate(workspaceIdParamSchema), workspaceController.get);
router.post('/organizations/:organizationId/workspaces', validate(createWorkspaceSchema), requireOrganizationMember, workspaceController.create);
router.patch('/:workspaceId', validate(updateWorkspaceSchema), workspaceController.update);
router.delete('/:workspaceId', validate(workspaceIdParamSchema), workspaceController.delete);

router.post(
  '/:workspaceId/documents',
  validate(workspaceIdParamSchema),
  requireWorkspaceMember,
  upload.array('files', config.upload.maxFilesPerUpload),
  documentController.upload
);

router.get(
  '/:workspaceId/documents',
  validate(workspaceIdParamSchema),
  requireWorkspaceMember,
  validate(listDocumentsQuerySchema),
  documentController.list
);

router.get(
  '/:workspaceId/documents/stats',
  validate(workspaceIdParamSchema),
  requireWorkspaceMember,
  documentController.stats
);

export { router as workspaceRoutes };