import { Router } from 'express';
import { registerValidation, loginValidation} from '../middleware/validators.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rate-limiter.middleware';
import { login, logout, register } from '../controllers/auth.controller';

const router = Router();

// Auth routes
router.post('/register', authLimiter,registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

//This is called when user clicks logout button on frontend
router.post('/logout', logout);




export default router;