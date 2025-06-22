import { Router } from 'express';
import { verifyEmail, resendVerification} from '../controllers/email.controller';
import { resendVerificationLimiter, verificationLimiter } from '../middleware/rate-limiter.middleware';
import { verifyToken } from '../middleware/jwt-verification.middleware';
import { queryTokenValidation } from '../middleware/validators.middleware';
import { validate } from '../middleware/validate.middleware';


const router = Router();

//This is called when user clicks on verify email link in their email
router.get('/verify-email', verificationLimiter, queryTokenValidation, validate ,verifyEmail);

//If access token is valid, user can resend their verification email
router.get('/resend-verification', resendVerificationLimiter, verifyToken, resendVerification);


export default router;