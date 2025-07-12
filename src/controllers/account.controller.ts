import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";
import * as accountService from "../services/account.service";

// Email Verification Operations

/**
 * Verify user email with token
 * Route: POST /verify-email
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.query.token as string;
    
    const result = await accountService.verifyEmail(token);

    if (result.success) {
      res.status(200).render('email/verification-success');
    } else {
      res.status(400).render('email/verification-expired');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email to authenticated user
 * Route: POST /resend-verification
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(
        "User not found",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.NO_USER
      );
    }

    await accountService.resendVerification(userId);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Password Management Operations

/**
 * Change password for authenticated user
 * Route: POST /change-password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(
        "User not found",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.NO_USER
      );
    }

    const { currentPassword, newPassword } = req.body;

    await accountService.changePassword(userId, currentPassword, newPassword);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate forgot password flow
 * Route: POST /forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    await accountService.forgotPassword(email);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using reset token
 * Route: POST /reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    await accountService.resetPassword(token, password);

    const response: ApiResponse = {
      status: "success",
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Show reset password form
 * Route: GET /reset-password
 */
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

    const isValidToken = accountService.validateResetToken(token);

    if (isValidToken) {
      res.status(200).render('password/reset-password');
    } else {
      res.status(400).render('password/reset-password-expired');
    }
  } catch (error) {
    next(error);
  }
};
