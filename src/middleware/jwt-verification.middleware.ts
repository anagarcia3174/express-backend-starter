import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/config";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { verifyAccessToken } from "../utils/jwt.util";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
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
