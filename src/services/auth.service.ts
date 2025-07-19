import { 
  addRefreshToken, 
  createUser, 
  getUserByEmail, 
  getUserByRefreshToken, 
  removeAllRefreshTokens, 
  removeRefreshToken, 
} from "./user.service";
import { sendVerificationEmail } from "./email.service";
import { 
  createAuthTokens,
  createEmailVerificationToken 
} from "../utils/jwt.util";
import { RegisterRequest, LoginRequest } from "../types/user.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";

export interface AuthResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 * @param userData - User registration data
 * @returns Auth result with tokens
 */
export const register = async (userData: RegisterRequest): Promise<AuthResult> => {
  try {
    const { username, email, password } = userData;

    // Create user
    const user = await createUser({
      username,
      email,
      password,
    });

    // Generate tokens
    const { accessToken, refreshToken } = createAuthTokens(user.id);
    
    // Add refresh token to user
    await addRefreshToken(user.id, refreshToken);

    // Send verification email
    await sendVerificationEmailSafely(user.email, user.id, user.username);

    logger.info(`User registered successfully: ${user.id}`);

    return {
      userId: user.id,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error during registration", 
      StatusCodes.INTERNAL_SERVER_ERROR, 
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Login user with email and password
 * @param credentials - Login credentials
 * @param existingRefreshToken - Existing refresh token from cookies
 * @returns Auth result with tokens
 */
export const login = async (credentials: LoginRequest, existingRefreshToken?: string): Promise<AuthResult> => {
  try {
    const { email, password } = credentials;

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError(
        "Invalid email or password",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Handle refresh token rotation
    await handleRefreshTokenRotation(user.id, existingRefreshToken);

    // Generate new tokens
    const { accessToken, refreshToken } = createAuthTokens(user.id);
    
    // Add new refresh token
    await addRefreshToken(user.id, refreshToken);

    logger.info(`User logged in successfully: ${user.id}`);

    return {
      userId: user.id,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error during login", 
      StatusCodes.INTERNAL_SERVER_ERROR, 
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Logout user by removing refresh token
 * @param refreshToken - Refresh token to remove
 * @returns void
 */
export const logout = async (refreshToken?: string): Promise<void> => {
  try {
    if (!refreshToken) {
      return; // No token to logout
    }

    const foundUser = await getUserByRefreshToken(refreshToken);
    if (!foundUser) {
      return; // Token not found, already logged out
    }

    await removeRefreshToken(foundUser.id, refreshToken);
    logger.info(`User logged out successfully: ${foundUser.id}`);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error during logout", 
      StatusCodes.INTERNAL_SERVER_ERROR, 
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Refresh access token using refresh token
 * Note: JWT token validation is handled by middleware
 * @param refreshToken - Current refresh token (already validated by middleware)
 * @param userId - User ID from validated token (from middleware)
 * @returns New auth result with tokens
 */
export const refreshTokens = async (refreshToken: string, userId: string): Promise<AuthResult> => {
  try {
    // Find user who owns this token
    const user = await getUserByRefreshToken(refreshToken);
    
    if (!user) {
      // Token is valid JWT but not found in database
      // This could mean token was revoked or user deleted
      logger.warn(
        `Valid refresh token found but no owner in database. Token belonged to user: ${userId}`
      );
      throw new AppError(
        "Invalid refresh token",
        StatusCodes.FORBIDDEN,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Verify that the token's userId matches the database user
    if (userId !== user.id) {
      logger.warn(
        `Refresh token userId mismatch. Token: ${userId}, User: ${user.id}`
      );
      throw new AppError(
        "Invalid refresh token",
        StatusCodes.FORBIDDEN,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Remove old refresh token
    await removeRefreshToken(user.id, refreshToken);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = createAuthTokens(user.id);
    
    // Add new refresh token
    await addRefreshToken(user.id, newRefreshToken);

    logger.info(`Tokens refreshed successfully: ${user.id}`);

    return {
      userId: user.id,
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error refreshing tokens", 
      StatusCodes.INTERNAL_SERVER_ERROR, 
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Handle refresh token rotation during login
 * This is a security measure to prevent token reuse attacks
 * @param userId - User ID
 * @param existingRefreshToken - Existing refresh token
 */
const handleRefreshTokenRotation = async (userId: string, existingRefreshToken?: string): Promise<void> => {
  if (!existingRefreshToken) {
    return;
  }

  const tokenUser = await getUserByRefreshToken(existingRefreshToken);
  if (!tokenUser) {
    // Token not found in database - could be stolen/invalid
    // Clear all refresh tokens for security
    await removeAllRefreshTokens(userId);
  } else {
    // Token belongs to this user - remove it (normal rotation)
    await removeRefreshToken(userId, existingRefreshToken);
  }
};

/**
 * Send verification email to user
 * This function doesn't throw errors to avoid failing user registration
 * @param email - User email
 * @param userId - User ID
 * @param username - Username
 */
const sendVerificationEmailSafely = async (email: string, userId: string, username: string): Promise<void> => {
  try {
    const verificationToken = createEmailVerificationToken(userId);
    await sendVerificationEmail(email, verificationToken, username);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    // Don't throw error here - user registration should still succeed
    // even if email sending fails
  }
};

