import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.validation';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authMiddleware, authController.me);

export { router as authRoutes };