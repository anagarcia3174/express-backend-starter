import { Request, Response, NextFunction } from "express";
import { RegisterRequest, LoginRequest } from "../types/user.types";
import { ApiResponse, AuthResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";
import * as authService from "../services/auth.service";

// Cookie options for refresh token
const refreshTokenCookieOptions = {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: true,
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userData: RegisterRequest = req.body;

    const result = await authService.register(userData);

    // Set refresh token as httpOnly cookie
    res.cookie("jwt", result.refreshToken, refreshTokenCookieOptions);

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: result.userId,
        accessToken: result.accessToken,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const credentials: LoginRequest = req.body;
    const existingRefreshToken = req.cookies?.jwt;

    const result = await authService.login(credentials, existingRefreshToken);

    // Clear existing cookie first
    if (existingRefreshToken) {
      res.clearCookie("jwt", refreshTokenCookieOptions);
    }

    // Set new refresh token as httpOnly cookie
    res.cookie("jwt", result.refreshToken, refreshTokenCookieOptions);

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: result.userId,
        accessToken: result.accessToken,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.jwt;

    await authService.logout(refreshToken);

    // Clear the cookie
    if (refreshToken) {
      res.clearCookie("jwt", refreshTokenCookieOptions);
    }

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Token validation is handled by middleware
    const refreshToken = req.refreshToken!; // Guaranteed to exist due to middleware
    const userId = req.user!.userId; // Guaranteed to exist due to middleware

    // Clear existing cookie
    res.clearCookie("jwt", refreshTokenCookieOptions);

    const result = await authService.refreshTokens(refreshToken, userId);

    // Set new refresh token as httpOnly cookie
    res.cookie("jwt", result.refreshToken, refreshTokenCookieOptions);

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: result.userId,
        accessToken: result.accessToken,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};