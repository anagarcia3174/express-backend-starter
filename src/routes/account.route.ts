import { Router } from 'express';
import {
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  queryTokenValidation
} from '../middleware/validators.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  verificationLimiter,
  resendVerificationLimiter,
  passwordResetLimiter
} from '../middleware/rate-limiter.middleware';
import { verifyToken } from '../middleware/jwt-verification.middleware';
import {
  verifyEmail,
  resendVerification,
  changePassword,
  forgotPassword,
  resetPassword,
  showResetPasswordForm
} from '../controllers/account.controller';

const router = Router();

// Email Verification Routes
router.post('/verify-email', verificationLimiter, queryTokenValidation, validate, verifyEmail);
router.post('/resend-verification', verifyToken, resendVerificationLimiter, resendVerification);

// Password Management Routes
router.post('/change-password', verifyToken, changePasswordValidation, validate, changePassword);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, validate, resetPassword);
router.get('/reset-password', queryTokenValidation, validate, showResetPasswordForm);

export default router; 