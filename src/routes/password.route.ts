import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { forgotPasswordValidation, resetPasswordValidation, changePasswordValidation, queryTokenValidation } from "../middleware/validators.middleware";
import { verifyToken } from "../middleware/jwt-verification.middleware";
import { changePassword, forgotPassword, resetPassword, showResetPasswordForm } from '../controllers/password.controller';
import { passwordResetLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

//If access token is valid, user can change password
router.post('/change-password', passwordResetLimiter, verifyToken, changePasswordValidation, validate, changePassword);

//This is called when user clicks forgot password button on frontend
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);

//This is called when user clicks on reset password link in email after clicking forgot password button
router.get('/reset-password', queryTokenValidation, validate, showResetPasswordForm);

//This is called when user submits new password after they click on reset password link in email.
router.post('/reset-password', passwordResetLimiter, queryTokenValidation,resetPasswordValidation, validate, resetPassword);

export default router;