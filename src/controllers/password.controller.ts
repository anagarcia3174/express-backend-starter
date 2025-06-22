import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import {
  getUserByEmail,
  removeAllRefreshTokens,
  updateUserPassword,
} from "../services/user.service";
import { ApiResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { sendPasswordResetEmail } from "../services/email.service";
import { StatusCodes } from "http-status-codes";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/jwt.util";

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(
        "User not found.",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.NO_USER
      );
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await getUserByEmail(userId);
    if (!user) {
      throw new AppError("User not found.", StatusCodes.NOT_FOUND, ErrorCode.NO_USER);
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(
        "Current password is incorrect.",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await updateUserPassword(userId, hashedPassword);

    // Remove all refresh tokens to force re-login
    await removeAllRefreshTokens(userId);

    logger.info(`User password changed successfully: ${userId}`);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(
      new AppError(
        "Error changing password",
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      )
    );
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      throw new AppError("User not found.", StatusCodes.NOT_FOUND, ErrorCode.NO_USER);
    }

    const resetToken = createPasswordResetToken(user.id);

    await sendPasswordResetEmail(user.email, resetToken, user.username);

    logger.info(`Password reset email sent to: ${user.email}`);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(
      new AppError(
        "Error sending password reset email",
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      )
    );
  }
};

export const showResetPasswordForm = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError(
        "Reset token is required",
        StatusCodes.BAD_REQUEST,
        ErrorCode.MISSING_TOKEN
      );
    }

    const result = verifyPasswordResetToken(token);

    if (result.isValid && !result.isExpired && result.payload?.userId) {
      return res.status(200).render('password/reset-password');
    } else {
      return res.status(400).render('password/reset-password-expired');
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(
      new AppError(
        "Error showing reset password form",
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      )
    );
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token) {
      throw new AppError(
        "Reset token is required",
        StatusCodes.BAD_REQUEST,
        ErrorCode.MISSING_TOKEN
      );
    }

    const result = verifyPasswordResetToken(token);

    if (result.isValid && !result.isExpired && result.payload?.userId) {
      await updateUserPassword(result.payload.userId, password);
      logger.info(
        `Password reset successful for user: ${result.payload.userId}`
      );

      const response: ApiResponse = {
        status: "success",
      };

      res.status(200).json(response);
      return;
    } else {
      throw new AppError(
        "Invalid or expired reset token",
        StatusCodes.BAD_REQUEST,
        ErrorCode.INVALID_TOKEN
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(
      new AppError(
        "Error resetting password",
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      )
    );
  }
};
