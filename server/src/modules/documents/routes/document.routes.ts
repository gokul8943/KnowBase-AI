import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { validate } from '../../../middleware/validate';
import { authMiddleware } from '../../../middleware/auth';
import { documentIdParamSchema, updateDocumentSchema } from '../validators/document.validation';

const router = Router();

router.use(authMiddleware);

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