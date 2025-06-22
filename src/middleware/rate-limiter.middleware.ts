import rateLimit from 'express-rate-limit';
import AppError, { ErrorCode } from '../utils/app-error.util';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger.util';

interface RateLimiterConfig {
  windowMs: number;
  max: number;
  message?: string | object;
  useAppError?: boolean;
}

const createRateLimiter = ({
  windowMs,
  max,
  message = 'Too many requests, please try again later',
  useAppError = false,
}: RateLimiterConfig) => {
  return rateLimit({
    windowMs,
    max,
    message,
    handler: useAppError
      ? (req, res, next) => {
          logger.warn(`Rate limit exceeded for ${req.ip}`, {
            path: req.path,
            method: req.method,
            windowMs,
            max
          });
          throw new AppError(
            typeof message === 'string' ? message : 'Too many requests, please try again later',
            StatusCodes.TOO_MANY_REQUESTS,
            ErrorCode.TOO_MANY_REQUESTS
          );
        }
      : undefined,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limiter for auth routes
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many requests, please try again after 15 minutes',
  useAppError: true,
});

export const verificationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    status: "error",
    error: {
      message: "Too many verification attempts. Please try again later.",
      code: "too-many-requests"
    }
  }
});

export const resendVerificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    status: "error",
    error: {
      message: "Too many resend attempts. Please try again later.",
      code: "too-many-requests"
    }
  }
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    status: "error",
    error: {
      message: "Too many password reset attempts. Please try again later.",
      code: "too-many-requests"
    }
  }
});

export const tokenRefreshLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    status: "error",
    error: {
      message: "Too many token refresh attempts. Please try again later.",
      code: "too-many-requests"
    }
  }
}); 