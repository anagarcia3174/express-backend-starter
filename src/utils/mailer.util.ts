import nodemailer from "nodemailer";
import { ses } from "../config/aws.config";
import AppError, { ErrorCode } from "./app-error.util";
import { StatusCodes } from "http-status-codes";
import { emailConfig } from "../config/email.config";

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  from?: string; // Optional since we have a default from address
}

/**
 * Sends an email using AWS SES
 * @param options Email options including recipient, subject, HTML content, and sender
 * @throws {AppError} If email sending fails
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const { to, subject, template, from } = options;

  // Create transporter with SES configuration
  const transporter = nodemailer.createTransport({
    SES: ses.sesClient,
    sendingRate: 1, // Number of messages per second
    maxConnections: 1, // Maximum number of simultaneous connections
  });

  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: from || emailConfig.from,
      to,
      subject,
      html: template,
    };

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    // Generic error
    throw new AppError(
      "Failed to send email",
      StatusCodes.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
  }
};
