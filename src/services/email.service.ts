import path from "path";
import { emailConfig } from "../config";
import { sendEmail } from "../utils/mailer.util";
import ejs from "ejs";
import { logger } from "../utils/logger.util";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";

/**
 * Sends a verification email to the user
 * @param email - The email address to send the verification email to
 * @param verificationToken - The verification token to include in the email link
 * @param displayName - The display name of the user
 * @throws {AppError} If email sending fails
 */
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  displayName: string
): Promise<void> => {
  try {
    const verificationLink = `${emailConfig.verificationLink}?token=${verificationToken}`;
    const subject = "Verify your email address";
    
    const templatePath = path.join(
      __dirname,
      "../views/email/verification.ejs"
    );

    let template;
    try {
      template = await ejs.renderFile(templatePath, { displayName, verificationLink });
    } catch (error: any) {
      logger.error('Failed to render verification email template:', {
        error: error.message,
        email,
        templatePath
      });
      throw new AppError(
        'Failed to generate verification email',
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      );
    }

    await sendEmail({
      to: email,
      subject,
      template,
      from: emailConfig.from,
    });

    logger.info('Verification email sent successfully:', { email });
  } catch (error) {
    logger.error('Failed to send verification email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email
    });
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Sends a password reset email to the user
 * @param email - The email address to send the reset email to
 * @param resetToken - The reset token to include in the email link
 * @param displayName - The display name of the user
 * @throws {AppError} If email sending fails
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  displayName: string
): Promise<void> => {
  try {
    const resetLink = `${emailConfig.resetLink}?token=${resetToken}`;
    const subject = "Reset your password";
    
    const templatePath = path.join(
      __dirname,
      "../views/password/password-reset.ejs"
    );

    let template;
    try {
      template = await ejs.renderFile(templatePath, { displayName, resetLink });
    } catch (error: any) {
      logger.error('Failed to render password reset email template:', {
        error: error.message,
        email,
        templatePath
      });
      throw new AppError(
        'Failed to generate password reset email',
        StatusCodes.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR
      );
    }

    await sendEmail({
      to: email,
      subject,
      template,
      from: emailConfig.from,
    });

    logger.info('Password reset email sent successfully:', { email });
  } catch (error) {
    logger.error('Failed to send password reset email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email
    });
    throw error; // Re-throw the error to be handled by the caller
  }
};

