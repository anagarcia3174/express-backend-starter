import { Request, Response, NextFunction } from "express";
import {
  addRefreshToken,
  createUser,
  getUserByEmail,
  getUserByRefreshToken,
  removeAllRefreshTokens,
  removeRefreshToken,
  getUserById,
} from "../services/user.service";
import { RegisterRequest, LoginRequest } from "../types/user.types";
import { ApiResponse, AuthResponse, AuthStatusResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { sendVerificationEmail } from "../services/email.service";
import { StatusCodes } from "http-status-codes";
import { createAccessToken, createRefreshToken, createEmailVerificationToken } from "../utils/jwt.util";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password }: RegisterRequest = req.body;

    // Create user
    const user = await createUser({
      username,
      email,
      password,
    });

    // Generate JWT token
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);
    const verificationToken = createEmailVerificationToken(user.id);

    await addRefreshToken(user.id, refreshToken);

    logger.info(`User registered successfully: ${user.id}`);

    await sendVerificationEmail(email, verificationToken, username);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: user.id,
        accessToken,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during registration", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;
    const cookies = req.cookies;
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

    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    if (cookies?.jwt) {
      const tokenUser = await getUserByRefreshToken(cookies.jwt);
      if (!tokenUser) {
        await removeAllRefreshTokens(user.id);
      } else {
        await removeRefreshToken(user.id, cookies.jwt);
      }

      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
    }

    await addRefreshToken(user.id, refreshToken);

    logger.info(`User logged in successfully: ${user.id}`);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });

    const response: ApiResponse<AuthResponse> = {
      status: "success",
      data: {
        userId: user.id,
        accessToken,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during login", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
  }
};




export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookies = req.cookies;

    if (!cookies?.jwt){
        res.sendStatus(204);
        return;
    }

    const refreshToken = cookies.jwt;

    const foundUser = await getUserByRefreshToken(refreshToken);
    if(!foundUser){
      res.clearCookie("jwt", {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: true,
      });
       res.sendStatus(204);
       return;
    }

    await removeRefreshToken(foundUser.id, refreshToken);
    res.clearCookie("jwt", {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: true,
    });
    
    logger.info(`User logged out successfully: ${foundUser.id}`);

    res.sendStatus(204);
    return;

    
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error during logout", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
  }
};





export const getAuthStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      const response: ApiResponse<AuthStatusResponse> = {
        status: "success",
        data: {
          isAuthenticated: false
        }
      };
      res.status(200).json(response);
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      const response: ApiResponse<AuthStatusResponse> = {
        status: "success",
        data: {
          isAuthenticated: false
        }
      };
      res.status(200).json(response);
      return;
    }

    const response: ApiResponse<AuthStatusResponse> = {
      status: "success",
      data: {
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError("Error checking auth status", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
  }
};