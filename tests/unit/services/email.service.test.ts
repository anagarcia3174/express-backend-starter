import { faker } from "@faker-js/faker";
import { StatusCodes } from "http-status-codes";
import * as ejs from "ejs";
import * as emailService from "../../../src/services/email.service";
import * as mailerUtil from "../../../src/utils/mailer.util";
import { logger } from "../../../src/utils/logger.util";
import AppError, { ErrorCode } from "../../../src/utils/app-error.util";
import { emailConfig } from "../../../src/config";

// Mock all dependencies
jest.mock("ejs");
jest.mock("../../../src/utils/mailer.util");
jest.mock("../../../src/utils/logger.util");


// Type the mocked modules
const mockEjs = ejs as jest.Mocked<typeof ejs>;
const mockMailerUtil = mailerUtil as jest.Mocked<typeof mailerUtil>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("EmailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    const mockEmail = faker.internet.email();
    const mockVerificationToken = faker.string.alphanumeric(32);
    const mockDisplayName = faker.person.fullName();
    const mockTemplate = "<html><body>Test verification email</body></html>";

    it("should send verification email successfully", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendVerificationEmail(
        mockEmail,
        mockVerificationToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledTimes(1);
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("views/email/verification.ejs"),
        {
          displayName: mockDisplayName,
          verificationLink: `${emailConfig.verificationLink}?token=${mockVerificationToken}`,
        }
      );

      expect(mockMailerUtil.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockMailerUtil.sendEmail).toHaveBeenCalledWith({
        to: mockEmail,
        subject: "Verify your email address",
        template: mockTemplate,
        from: emailConfig.from,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Verification email sent successfully:",
        { email: mockEmail }
      );
    });

    it("should throw AppError when template rendering fails", async () => {
      // Arrange
      const mockError = new Error("Template rendering failed");
      mockEjs.renderFile.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendVerificationEmail(
          mockEmail,
          mockVerificationToken,
          mockDisplayName
        )
      ).rejects.toThrow(AppError);

      await expect(
        emailService.sendVerificationEmail(
          mockEmail,
          mockVerificationToken,
          mockDisplayName
        )
      ).rejects.toThrow("Failed to generate verification email");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to render verification email template:",
        {
          error: mockError.message,
          email: mockEmail,
          templatePath: expect.stringContaining("views/email/verification.ejs"),
        }
      );

      expect(mockMailerUtil.sendEmail).not.toHaveBeenCalled();
    });

    it("should throw error when email sending fails", async () => {
      // Arrange
      const mockError = new Error("Email sending failed");
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendVerificationEmail(
          mockEmail,
          mockVerificationToken,
          mockDisplayName
        )
      ).rejects.toThrow("Email sending failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send verification email:",
        {
          error: mockError.message,
          email: mockEmail,
        }
      );
    });

    it("should log success when verification email is sent", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendVerificationEmail(
        mockEmail,
        mockVerificationToken,
        mockDisplayName
      );

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Verification email sent successfully:",
        { email: mockEmail }
      );
    });

    it("should log error when verification email fails", async () => {
      // Arrange
      const mockError = new AppError(
        "Email service unavailable",
        StatusCodes.SERVICE_UNAVAILABLE,
        ErrorCode.SERVER_ERROR
      );
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendVerificationEmail(
          mockEmail,
          mockVerificationToken,
          mockDisplayName
        )
      ).rejects.toThrow(mockError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send verification email:",
        {
          error: mockError.message,
          email: mockEmail,
        }
      );
    });

    it("should generate correct verification link with token", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendVerificationEmail(
        mockEmail,
        mockVerificationToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          verificationLink: `${emailConfig.verificationLink}?token=${mockVerificationToken}`,
        })
      );
    });

    it("should use correct template path for verification email", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendVerificationEmail(
        mockEmail,
        mockVerificationToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("views/email/verification.ejs"),
        expect.any(Object)
      );
    });

    it("should pass correct parameters to email template", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendVerificationEmail(
        mockEmail,
        mockVerificationToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(expect.any(String), {
        displayName: mockDisplayName,
        verificationLink: `${emailConfig.verificationLink}?token=${mockVerificationToken}`,
      });
    });
  });

  describe("sendPasswordResetEmail", () => {
    const mockEmail = faker.internet.email();
    const mockResetToken = faker.string.alphanumeric(32);
    const mockDisplayName = faker.person.fullName();
    const mockTemplate = "<html><body>Test password reset email</body></html>";

    it("should send password reset email successfully", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendPasswordResetEmail(
        mockEmail,
        mockResetToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledTimes(1);
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("views/password/password-reset.ejs"),
        {
          displayName: mockDisplayName,
          resetLink: `${emailConfig.resetLink}?token=${mockResetToken}`,
        }
      );

      expect(mockMailerUtil.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockMailerUtil.sendEmail).toHaveBeenCalledWith({
        to: mockEmail,
        subject: "Reset your password",
        template: mockTemplate,
        from: emailConfig.from,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Password reset email sent successfully:",
        { email: mockEmail }
      );
    });

    it("should throw AppError when template rendering fails", async () => {
      // Arrange
      const mockError = new Error("Template rendering failed");
      mockEjs.renderFile.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendPasswordResetEmail(
          mockEmail,
          mockResetToken,
          mockDisplayName
        )
      ).rejects.toThrow(AppError);

      await expect(
        emailService.sendPasswordResetEmail(
          mockEmail,
          mockResetToken,
          mockDisplayName
        )
      ).rejects.toThrow("Failed to generate password reset email");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to render password reset email template:",
        {
          error: mockError.message,
          email: mockEmail,
          templatePath: expect.stringContaining(
            "views/password/password-reset.ejs"
          ),
        }
      );

      expect(mockMailerUtil.sendEmail).not.toHaveBeenCalled();
    });

    it("should throw error when email sending fails", async () => {
      // Arrange
      const mockError = new Error("Email sending failed");
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendPasswordResetEmail(
          mockEmail,
          mockResetToken,
          mockDisplayName
        )
      ).rejects.toThrow("Email sending failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send password reset email:",
        {
          error: mockError.message,
          email: mockEmail,
        }
      );
    });

    it("should log success when password reset email is sent", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendPasswordResetEmail(
        mockEmail,
        mockResetToken,
        mockDisplayName
      );

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Password reset email sent successfully:",
        { email: mockEmail }
      );
    });

    it("should log error when password reset email fails", async () => {
      // Arrange
      const mockError = new AppError(
        "Email service unavailable",
        StatusCodes.SERVICE_UNAVAILABLE,
        ErrorCode.SERVER_ERROR
      );
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        emailService.sendPasswordResetEmail(
          mockEmail,
          mockResetToken,
          mockDisplayName
        )
      ).rejects.toThrow(mockError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to send password reset email:",
        {
          error: mockError.message,
          email: mockEmail,
        }
      );
    });

    it("should generate correct reset link with token", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendPasswordResetEmail(
        mockEmail,
        mockResetToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          resetLink: `${emailConfig.resetLink}?token=${mockResetToken}`,
        })
      );
    });

    it("should use correct template path for password reset email", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendPasswordResetEmail(
        mockEmail,
        mockResetToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining("views/password/password-reset.ejs"),
        expect.any(Object)
      );
    });

    it("should pass correct parameters to email template", async () => {
      // Arrange
      mockEjs.renderFile.mockResolvedValue(mockTemplate);
      mockMailerUtil.sendEmail.mockResolvedValue(undefined);

      // Act
      await emailService.sendPasswordResetEmail(
        mockEmail,
        mockResetToken,
        mockDisplayName
      );

      // Assert
      expect(mockEjs.renderFile).toHaveBeenCalledWith(expect.any(String), {
        displayName: mockDisplayName,
        resetLink: `${emailConfig.resetLink}?token=${mockResetToken}`,
      });
    });
  });
});
