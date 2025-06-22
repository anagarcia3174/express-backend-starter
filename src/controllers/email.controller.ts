import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import {
  updateVerificationStatus,
  getUserById,
} from "../services/user.service";
import { ApiResponse } from "../types/api.types";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { sendVerificationEmail } from "../services/email.service";
import { createEmailVerificationToken, verifyEmailVerificationToken } from "../utils/jwt.util";

export const verifyEmail = async(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.query.token as string;
      if (!token) {
        throw new AppError("Verification token is required", StatusCodes.BAD_REQUEST, ErrorCode.MISSING_TOKEN);
      }
      const result = verifyEmailVerificationToken(token);

      

      if(result.isValid && !result.isExpired && result.payload?.userId){
        await updateVerificationStatus(result.payload?.userId, true);

        logger.info(`User email verified successfully: ${result.payload.userId}`);
          
        return res.status(200).render('email/verification-success');
      }else{
          return res.status(400).render('email/verification-expired');
      }
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(new AppError("Error verifying email", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
    }
  }
  
  export const resendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
  
      if (!userId){
        throw new AppError("User not found", StatusCodes.UNAUTHORIZED, ErrorCode.NO_USER);
  
      }
  
      const user = await getUserById(userId);
      if(!user){
        throw new AppError("User not found", StatusCodes.NOT_FOUND, ErrorCode.NO_USER)
      }
  
      if (user.isVerified){
        throw new AppError("Email already verified", StatusCodes.BAD_REQUEST, ErrorCode.EMAIL_ALREADY_VERIFIED);
      }
  
      const verificationToken = createEmailVerificationToken(
        user.id
      );
  
      await sendVerificationEmail(user.email, verificationToken, user.username);
  
      logger.info(`Verification email resent successfully: ${user.id}`);
  
      const response: ApiResponse = {
        status: "success",
      };
  
      res.status(200).json(response);
    }catch(error){
      if (error instanceof AppError) {
        next(error);
        return;
      }
      next(new AppError("Error resending verification email", StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
    }
  }