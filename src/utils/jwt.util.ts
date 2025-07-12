import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export interface TokenInterface {
  userId: string;
}

export interface TokenVerificationResult {
  isValid: boolean;
  isExpired: boolean;
  payload?: TokenInterface;
  error?: "expired" | "invalid";
}

/**
 * Creates a JWT token
 * @param userId - The payload to include in the token
 * @param secret - The secret key to sign the token with
 * @param expiresIn - Token expiration time (e.g., '1h', '7d', '30m')
 * @returns The signed JWT token
 */
const createToken = (
  userId: string,
  secret: string,
  expiresIn: number
): string => {
  return jwt.sign({userId}, secret, {expiresIn});
};

export const createAccessToken = (userId: string): string => {
  return createToken(userId, config.accessTokenSecret, 24 * 60 * 60);
}

export const createRefreshToken = (userId: string): string => {
  return createToken(userId, config.refreshTokenSecret, 30 * 24 * 60 * 60);
}

export const createEmailVerificationToken = (userId: string): string => {
  return createToken(userId, config.emailVerificationTokenSecret, 15 * 60);
}

export const createPasswordResetToken = (userId: string): string => {
  return createToken(userId, config.resetPasswordTokenSecret, 30 * 60);
}
/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @param secret - The secret key used to sign the token
 * @returns TokenVerificationResult containing verification status and payload
 */
export const verifyToken = (token: string, secret: string): TokenVerificationResult => {
  try {
    const decoded = jwt.verify(token, secret) as TokenInterface;
    return {
      isValid: true,
      isExpired: false,
      payload: decoded
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isValid: false,
        isExpired: true,
        error: 'expired'
      };
    }
    return {
      isValid: false,
      isExpired: false,
      error: 'invalid'
    };
  }
};

/**
 * Verifies an access token
 * @param token - The access token to verify
 * @returns TokenVerificationResult containing verification status and payload
 */
export const verifyAccessToken = (token: string): TokenVerificationResult => {
  return verifyToken(token, config.accessTokenSecret);
};

/**
 * Verifies a refresh token
 * @param token - The refresh token to verify
 * @returns TokenVerificationResult containing verification status and payload
 */
export const verifyRefreshToken = (token: string): TokenVerificationResult => {
  return verifyToken(token, config.refreshTokenSecret);
};

/**
 * Verifies an email verification token
 * @param token - The email verification token to verify
 * @returns TokenVerificationResult containing verification status and payload
 */
export const verifyEmailVerificationToken = (token: string): TokenVerificationResult => {
  return verifyToken(token, config.emailVerificationTokenSecret);
};

/**
 * Verifies a password reset token
 * @param token - The password reset token to verify
 * @returns TokenVerificationResult containing verification status and payload
 */
export const verifyPasswordResetToken = (token: string): TokenVerificationResult => {
  return verifyToken(token, config.resetPasswordTokenSecret);
};

export const createAuthTokens = (userId: string) => {
  const accessToken = createAccessToken(userId);
  const refreshToken = createRefreshToken(userId);
  return { accessToken, refreshToken };
}