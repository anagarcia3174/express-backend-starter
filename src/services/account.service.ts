import {
  updateVerificationStatus,
  getUserById,
  getUserByEmail,
  removeAllRefreshTokens,
  updateUserPassword,
} from "./user.service";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";
import {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/jwt.util";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";

export interface EmailVerificationResult {
  success: boolean;
  userId?: string;
}

/**
 * Verify user email with verification token
 * @param token - Email verification token
 * @returns Verification result
 */
export const verifyEmail = async (token: string): Promise<EmailVerificationResult> => {
  try {
    if (!token) {
      throw new AppError(
        "Verification token is required",
        StatusCodes.BAD_REQUEST,
        ErrorCode.MISSING_TOKEN
      );
    }

    const result = verifyEmailVerificationToken(token);

    if (result.isValid && !result.isExpired && result.payload?.userId) {
      await updateVerificationStatus(result.payload.userId, true);
      logger.info(`User email verified successfully: ${result.payload.userId}`);
      
      return {
        success: true,
        userId: result.payload.userId,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error verifying email",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Resend verification email to user
 * @param userId - User ID
 */
export const resendVerification = async (userId: string): Promise<void> => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new AppError(
        "User not found",
        StatusCodes.NOT_FOUND,
        ErrorCode.NO_USER
      );
    }

    if (user.isVerified) {
      throw new AppError(
        "Email already verified",
        StatusCodes.BAD_REQUEST,
        ErrorCode.EMAIL_ALREADY_VERIFIED
      );
    }

    const verificationToken = createEmailVerificationToken(user.id);
    await sendVerificationEmail(user.email, verificationToken, user.username);

    logger.info(`Verification email resent successfully: ${user.id}`);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error resending verification email",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Change user password (requires current password)
 * @param userId - User ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Get user with password field
    const user = await getUserById(userId);
    if (!user) {
      throw new AppError(
        "User not found",
        StatusCodes.NOT_FOUND,
        ErrorCode.NO_USER
      );
    }

    // Need to fetch the password separately since it's not selected by default
    const userWithPassword = await getUserByEmail(user.email);
    if (!userWithPassword) {
      throw new AppError(
        "User not found",
        StatusCodes.NOT_FOUND,
        ErrorCode.NO_USER
      );
    }

    // Verify current password
    const isPasswordValid = await userWithPassword.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(
        "Current password is incorrect",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await updateUserPassword(userId, hashedPassword);

    // Remove all refresh tokens to force re-login on all devices
    await removeAllRefreshTokens(userId);

    logger.info(`User password changed successfully: ${userId}`);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error changing password",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Initiate forgot password flow by sending reset email
 * @param email - User email address
 */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError(
        "User not found",
        StatusCodes.NOT_FOUND,
        ErrorCode.NO_USER
      );
    }

    const resetToken = createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, resetToken, user.username);

    logger.info(`Password reset email sent to: ${user.email}`);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error sending password reset email",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Reset user password using reset token
 * @param token - Password reset token
 * @param newPassword - New password
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    if (!token) {
      throw new AppError(
        "Reset token is required",
        StatusCodes.BAD_REQUEST,
        ErrorCode.MISSING_TOKEN
      );
    }

    const result = verifyPasswordResetToken(token);

    if (!result.isValid || result.isExpired || !result.payload?.userId) {
      throw new AppError(
        "Invalid or expired reset token",
        StatusCodes.BAD_REQUEST,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Hash the new password before storing
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await updateUserPassword(result.payload.userId, hashedPassword);
    
    logger.info(`Password reset successful for user: ${result.payload.userId}`);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error resetting password",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};

/**
 * Validate password reset token
 * @param token - Password reset token
 * @returns Whether token is valid and not expired
 */
export const validateResetToken = (token: string): boolean => {
  try {
    if (!token) {
      return false;
    }

    const result = verifyPasswordResetToken(token);
    return result.isValid && !result.isExpired && !!result.payload?.userId;
  } catch (error) {
    return false;
  }
};
