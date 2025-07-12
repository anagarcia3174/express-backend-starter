import { Router } from 'express';
import { registerValidation, loginValidation } from '../middleware/validators.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter, tokenRefreshLimiter } from '../middleware/rate-limiter.middleware';
import { verifyRefreshTokenMiddleware } from '../middleware/jwt-verification.middleware';
import { login, logout, register, refresh } from '../controllers/auth.controller';

const router = Router();

// Auth routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', logout);
router.post('/refresh', tokenRefreshLimiter, verifyRefreshTokenMiddleware, refresh);

export default router;