import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/config";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt.util";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      refreshToken?: string;
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = (req.headers.authorization ||
      req.headers.Authorization) as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "No token provided, authorization denied",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.MISSING_TOKEN
      );
    }

    const token = authHeader.split(" ")[1];

    const result = verifyAccessToken(token);

    if (!result.isValid || result.isExpired) {
      throw new AppError(
        "Invalid Token",
        StatusCodes.FORBIDDEN,
        ErrorCode.INVALID_TOKEN
      );
    }

    if (result.isValid && result.payload?.userId) {
      req.user = { userId: result.payload.userId };
    } else {
      throw new AppError(
        "Invalid Token",
        StatusCodes.FORBIDDEN,
        ErrorCode.INVALID_TOKEN
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const verifyRefreshTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.jwt;

    if (!refreshToken) {
      throw new AppError(
        "No refresh token provided",
        StatusCodes.UNAUTHORIZED,
        ErrorCode.MISSING_TOKEN
      );
    }

    // Verify the JWT token validity
    const tokenResult = verifyRefreshToken(refreshToken);
    
    // Check if token is valid and not expired
    if (!tokenResult.isValid || tokenResult.isExpired) {
      throw new AppError(
        "Invalid or expired refresh token",
        StatusCodes.FORBIDDEN,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Add validated refresh token to request for service to use
    req.refreshToken = refreshToken;
    req.user = { userId: tokenResult.payload?.userId || "" };

    next();
  } catch (error) {
    next(error);
  }
};
