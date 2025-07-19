import { sendEmail } from '../../../src/utils/mailer.util';
import AppError, { ErrorCode } from '../../../src/utils/app-error.util';
import { StatusCodes } from 'http-status-codes';
import * as nodemailer from 'nodemailer';
import { emailConfig } from '../../../src/config';

// Mock nodemailer
jest.mock('nodemailer');

const mockCreateTransport = nodemailer.createTransport as unknown as jest.Mock;
const mockSendMail = jest.fn();

mockCreateTransport.mockReturnValue({
  sendMail: mockSendMail,
});


describe('Mailer Utility - sendEmail', () => {
  const baseEmailOptions = {
    to: 'test@example.com',
    subject: 'Test Subject',
    template: '<p>This is a test email</p>',
  };

  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
          it('should send an email with the correct options', async () => {
        mockSendMail.mockResolvedValueOnce({}); // mock successful send

        await sendEmail(baseEmailOptions);

        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledWith({
          to: baseEmailOptions.to,
          subject: baseEmailOptions.subject,
          html: baseEmailOptions.template,
          from: emailConfig.from, // Should use default from emailConfig
        });
      });

      it('should use the provided "from" address when specified', async () => {
      // Arrange
      mockSendMail.mockResolvedValue(undefined);
      const customFrom = 'custom@example.com';
      const emailOptions = {
        ...baseEmailOptions,
        from: customFrom,
      };

      // Act
      await sendEmail(emailOptions);

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith({
        from: customFrom,
        to: baseEmailOptions.to,
        subject: baseEmailOptions.subject,
        html: baseEmailOptions.template,
      });
    });

    it('should handle missing "from" field gracefully (default behavior)', async () => {
      // Arrange
      mockSendMail.mockResolvedValue(undefined);

      // Act
      await sendEmail(baseEmailOptions);

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith({
        from: emailConfig.from, // Should use default from emailConfig
        to: baseEmailOptions.to,
        subject: baseEmailOptions.subject,
        html: baseEmailOptions.template,
      });
    });
  });

  describe('Failure Cases', () => {
    it('should throw AppError when sendMail fails', async () => {
      // Arrange
      const sendMailError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(sendMailError);

      // Act & Assert
      await expect(sendEmail(baseEmailOptions)).rejects.toThrow(AppError);
      await expect(sendEmail(baseEmailOptions)).rejects.toThrow('Failed to send email');
       
      // Verify the AppError properties
      try {
        await sendEmail(baseEmailOptions);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect((error as AppError).code).toBe(ErrorCode.SERVER_ERROR);
      }
    });
  });
});