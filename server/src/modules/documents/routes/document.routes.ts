import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { validate } from '../../../middleware/validate';
import { authMiddleware } from '../../../middleware/auth';
import { requireOrganizationMember } from '../../organizations/organization.middleware';
import { workspaceIdParamSchema, documentIdParamSchema, listDocumentsQuerySchema, updateDocumentSchema } from '../validators/document.validation';
import multer from 'multer';
import { config } from '../../../config';

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

router.post(
  '/workspaces/:workspaceId/documents',
  validate(workspaceIdParamSchema),
  requireOrganizationMember,
  upload.array('files', config.upload.maxFilesPerUpload),
  documentController.upload
);

router.get(
  '/workspaces/:workspaceId/documents',
  validate(workspaceIdParamSchema),
  requireOrganizationMember,
  validate(listDocumentsQuerySchema),
  documentController.list
);

router.get(
  '/workspaces/:workspaceId/documents/stats',
  validate(workspaceIdParamSchema),
  requireOrganizationMember,
  documentController.stats
);

router.get(
  '/documents/:documentId',
  validate(documentIdParamSchema),
  documentController.get
);

router.get(
  '/documents/:documentId/download',
  validate(documentIdParamSchema),
  documentController.download
);

router.get(
  '/documents/:documentId/preview',
  validate(documentIdParamSchema),
  documentController.preview
);

router.patch(
  '/documents/:documentId',
  validate(documentIdParamSchema),
  validate(updateDocumentSchema),
  documentController.update
);

router.delete(
  '/documents/:documentId',
  validate(documentIdParamSchema),
  documentController.delete
);

export { router as documentRoutes };