import { Router } from 'express';
import { refreshToken } from '../controllers/token.controller';
import { tokenRefreshLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

//If refresh token is valid, user recieves new access and refresh tokens
router.get('/refreshToken', tokenRefreshLimiter, refreshToken);

export default router;