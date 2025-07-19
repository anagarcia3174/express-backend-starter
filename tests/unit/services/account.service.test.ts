
import * as accountService from '../../../src/services/account.service';
import * as userService from '../../../src/services/user.service';
import * as emailService from '../../../src/services/email.service';
import * as jwtUtil from '../../../src/utils/jwt.util';
import { logger } from '../../../src/utils/logger.util';
import AppError, { ErrorCode } from '../../../src/utils/app-error.util';
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

// Mock dependencies
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/services/email.service');
jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/utils/logger.util');
jest.mock('bcrypt');

// Type the mocked modules
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const mockedJwtUtil = jwtUtil as jest.Mocked<typeof jwtUtil>;
const mockedLogger = logger as jest.Mocked<typeof logger>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock data
const mockUser = {
  id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  isVerified: false,
  refreshTokens: [],
  comparePassword: jest.fn()
} as any;

const mockVerifiedUser = {
  ...mockUser,
  isVerified: true
} as any;

const mockUserWithPassword = {
  ...mockUser,
  password: 'hashedPassword123',
  comparePassword: jest.fn()
} as any;

const mockVerificationToken = 'valid-verification-token-123';
const mockPasswordResetToken = 'valid-reset-token-123';
const mockExpiredToken = 'expired-token-123';
const mockInvalidToken = 'invalid-token-123';

const mockTokenPayload = {
  userId: mockUser.id,
  type: 'verification'
};

const mockValidTokenResult = {
  isValid: true,
  isExpired: false,
  payload: mockTokenPayload
};

const mockExpiredTokenResult = {
  isValid: true,
  isExpired: true,
  payload: mockTokenPayload
};

const mockInvalidTokenResult = {
  isValid: false,
  isExpired: false,
  payload: undefined
};

const mockHashedPassword = 'hashed-new-password-123';

describe('Account Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockedUserService.getUserById.mockResolvedValue(mockUser);
    mockedUserService.getUserByEmail.mockResolvedValue(mockUserWithPassword);
    mockedUserService.updateVerificationStatus.mockResolvedValue(undefined);
    mockedUserService.updateUserPassword.mockResolvedValue(undefined);
    mockedUserService.removeAllRefreshTokens.mockResolvedValue(undefined);
    
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);
    
    mockedJwtUtil.createEmailVerificationToken.mockReturnValue(mockVerificationToken);
    mockedJwtUtil.createPasswordResetToken.mockReturnValue(mockPasswordResetToken);
    mockedJwtUtil.verifyEmailVerificationToken.mockReturnValue(mockValidTokenResult);
    mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(mockValidTokenResult);
    
    mockedBcrypt.hash.mockResolvedValue(mockHashedPassword as never);
    
    mockUserWithPassword.comparePassword.mockResolvedValue(true);
    
    // Setup logger mocks
    mockedLogger.info = jest.fn();
    mockedLogger.error = jest.fn();
  });
      describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const result = await accountService.verifyEmail(mockVerificationToken);

      expect(result).toEqual({
        success: true,
        userId: mockUser.id
      });
      expect(mockedJwtUtil.verifyEmailVerificationToken).toHaveBeenCalledWith(mockVerificationToken);
      expect(mockedUserService.updateVerificationStatus).toHaveBeenCalledWith(mockUser.id, true);
      expect(mockedLogger.info).toHaveBeenCalledWith(`User email verified successfully: ${mockUser.id}`);
    });

    it('should return success false for invalid token', async () => {
      mockedJwtUtil.verifyEmailVerificationToken.mockReturnValue(mockInvalidTokenResult);

      const result = await accountService.verifyEmail(mockInvalidToken);

      expect(result).toEqual({ success: false });
      expect(mockedUserService.updateVerificationStatus).not.toHaveBeenCalled();
    });

    it('should return success false for expired token', async () => {
      mockedJwtUtil.verifyEmailVerificationToken.mockReturnValue(mockExpiredTokenResult);

      const result = await accountService.verifyEmail(mockExpiredToken);

      expect(result).toEqual({ success: false });
      expect(mockedUserService.updateVerificationStatus).not.toHaveBeenCalled();
    });

    it('should throw AppError when token is missing', async () => {
      await expect(accountService.verifyEmail('')).rejects.toThrow(
        new AppError('Verification token is required', StatusCodes.BAD_REQUEST, ErrorCode.MISSING_TOKEN)
      );
    });

    it('should throw AppError when token is null or undefined', async () => {
      await expect(accountService.verifyEmail(null as any)).rejects.toThrow(
        new AppError('Verification token is required', StatusCodes.BAD_REQUEST, ErrorCode.MISSING_TOKEN)
      );
    });

    it('should update user verification status when verification succeeds', async () => {
      await accountService.verifyEmail(mockVerificationToken);

      expect(mockedUserService.updateVerificationStatus).toHaveBeenCalledWith(mockUser.id, true);
    });

    it('should handle database errors gracefully', async () => {
      mockedUserService.updateVerificationStatus.mockRejectedValue(new Error('Database error'));

      await expect(accountService.verifyEmail(mockVerificationToken)).rejects.toThrow(
        new AppError('Error verifying email', StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR)
      );
    });

    it('should log successful email verification', async () => {
      await accountService.verifyEmail(mockVerificationToken);

      expect(mockedLogger.info).toHaveBeenCalledWith(`User email verified successfully: ${mockUser.id}`);
    });
  });
  
      describe('resendVerification', () => {
    it('should successfully resend verification email', async () => {
      await accountService.resendVerification(mockUser.id);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(mockedJwtUtil.createEmailVerificationToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockVerificationToken,
        mockUser.username
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(`Verification email resent successfully: ${mockUser.id}`);
    });

    it('should throw AppError when user is not found', async () => {
      mockedUserService.getUserById.mockResolvedValue(null as any);

      await expect(accountService.resendVerification('nonexistent-user')).rejects.toThrow(
        new AppError('User not found', StatusCodes.NOT_FOUND, ErrorCode.NO_USER)
      );
    });

    it('should throw AppError when email is already verified', async () => {
      mockedUserService.getUserById.mockResolvedValue(mockVerifiedUser);

      await expect(accountService.resendVerification(mockUser.id)).rejects.toThrow(
        new AppError('Email already verified', StatusCodes.BAD_REQUEST, ErrorCode.EMAIL_ALREADY_VERIFIED)
      );
    });

    it('should create new verification token', async () => {
      await accountService.resendVerification(mockUser.id);

      expect(mockedJwtUtil.createEmailVerificationToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('should send verification email with correct parameters', async () => {
      await accountService.resendVerification(mockUser.id);

      expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockVerificationToken,
        mockUser.username
      );
    });

    it('should log successful email resend', async () => {
      await accountService.resendVerification(mockUser.id);

      expect(mockedLogger.info).toHaveBeenCalledWith(`Verification email resent successfully: ${mockUser.id}`);
    });

    it('should handle email service errors gracefully', async () => {
      mockedEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email service error'));

      await expect(accountService.resendVerification(mockUser.id)).rejects.toThrow(
        new AppError('Error resending verification email', StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR)
      );
    });
  });
  
      describe('changePassword', () => {
    it('should successfully change password with valid current password', async () => {
      await accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123');

      expect(mockedUserService.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(mockedUserService.getUserByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockUserWithPassword.comparePassword).toHaveBeenCalledWith('currentPassword');
      expect(mockedUserService.updateUserPassword).toHaveBeenCalledWith(mockUser.id, 'newPassword123');
      expect(mockedUserService.removeAllRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockedLogger.info).toHaveBeenCalledWith(`User password changed successfully: ${mockUser.id}`);
    });

    it('should throw AppError when user is not found', async () => {
      mockedUserService.getUserById.mockResolvedValue(null as any);

      await expect(accountService.changePassword('nonexistent-user', 'currentPassword', 'newPassword123'))
        .rejects.toThrow(new AppError('User not found', StatusCodes.NOT_FOUND, ErrorCode.NO_USER));
    });

    it('should throw AppError when current password is incorrect', async () => {
      mockUserWithPassword.comparePassword.mockResolvedValue(false);

      await expect(accountService.changePassword(mockUser.id, 'wrongPassword', 'newPassword123'))
        .rejects.toThrow(new AppError('Current password is incorrect', StatusCodes.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS));
    });

    it('should hash the new password before updating', async () => {
      await accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123');

      expect(mockedUserService.updateUserPassword).toHaveBeenCalledWith(mockUser.id, 'newPassword123');
    });

    it('should remove all refresh tokens after password change', async () => {
      await accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123');

      expect(mockedUserService.removeAllRefreshTokens).toHaveBeenCalledWith(mockUser.id);
    });

    it('should verify current password before updating', async () => {
      await accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123');

      expect(mockUserWithPassword.comparePassword).toHaveBeenCalledWith('currentPassword');
    });

    it('should log successful password change', async () => {
      await accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123');

      expect(mockedLogger.info).toHaveBeenCalledWith(`User password changed successfully: ${mockUser.id}`);
    });

    it('should handle database errors gracefully', async () => {
      mockedUserService.updateUserPassword.mockRejectedValue(new Error('Database error'));

      await expect(accountService.changePassword(mockUser.id, 'currentPassword', 'newPassword123'))
        .rejects.toThrow(new AppError('Error changing password', StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR));
    });
  });
  
      describe('forgotPassword', () => {
    it('should successfully send password reset email', async () => {
      await accountService.forgotPassword(mockUser.email);

      expect(mockedUserService.getUserByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(mockedJwtUtil.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockPasswordResetToken,
        mockUser.username
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(`Password reset email sent to: ${mockUser.email}`);
    });

    it('should throw AppError when user is not found', async () => {
      mockedUserService.getUserByEmail.mockResolvedValue(null as any);

      await expect(accountService.forgotPassword('nonexistent@example.com')).rejects.toThrow(
        new AppError('User not found', StatusCodes.NOT_FOUND, ErrorCode.NO_USER)
      );
    });

    it('should create password reset token', async () => {
      await accountService.forgotPassword(mockUser.email);

      expect(mockedJwtUtil.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('should send password reset email with correct parameters', async () => {
      await accountService.forgotPassword(mockUser.email);

      expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockPasswordResetToken,
        mockUser.username
      );
    });

    it('should log successful password reset email send', async () => {
      await accountService.forgotPassword(mockUser.email);

      expect(mockedLogger.info).toHaveBeenCalledWith(`Password reset email sent to: ${mockUser.email}`);
    });

    it('should handle email service errors gracefully', async () => {
      mockedEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service error'));

      await expect(accountService.forgotPassword(mockUser.email)).rejects.toThrow(
        new AppError('Error sending password reset email', StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR)
      );
    });
  });
  
      describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      await accountService.resetPassword(mockPasswordResetToken, 'newPassword123');

      expect(mockedJwtUtil.verifyPasswordResetToken).toHaveBeenCalledWith(mockPasswordResetToken);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockedUserService.updateUserPassword).toHaveBeenCalledWith(mockUser.id, mockHashedPassword);
      expect(mockedLogger.info).toHaveBeenCalledWith(`Password reset successful for user: ${mockUser.id}`);
    });

    it('should throw AppError when token is missing', async () => {
      await expect(accountService.resetPassword('', 'newPassword123')).rejects.toThrow(
        new AppError('Reset token is required', StatusCodes.BAD_REQUEST, ErrorCode.MISSING_TOKEN)
      );
    });

    it('should throw AppError when token is invalid', async () => {
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(mockInvalidTokenResult);

      await expect(accountService.resetPassword(mockInvalidToken, 'newPassword123')).rejects.toThrow(
        new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST, ErrorCode.INVALID_TOKEN)
      );
    });

    it('should throw AppError when token is expired', async () => {
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(mockExpiredTokenResult);

      await expect(accountService.resetPassword(mockExpiredToken, 'newPassword123')).rejects.toThrow(
        new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST, ErrorCode.INVALID_TOKEN)
      );
    });

    it('should throw AppError when token payload is missing userId', async () => {
      const tokenWithoutUserId = {
        isValid: true,
        isExpired: false,
        payload: { type: 'reset' }
      };
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(tokenWithoutUserId as any);

      await expect(accountService.resetPassword(mockPasswordResetToken, 'newPassword123')).rejects.toThrow(
        new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST, ErrorCode.INVALID_TOKEN)
      );
    });

    it('should hash the new password before storing', async () => {
      await accountService.resetPassword(mockPasswordResetToken, 'newPassword123');

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockedUserService.updateUserPassword).toHaveBeenCalledWith(mockUser.id, mockHashedPassword);
    });

    it('should update user password in database', async () => {
      await accountService.resetPassword(mockPasswordResetToken, 'newPassword123');

      expect(mockedUserService.updateUserPassword).toHaveBeenCalledWith(mockUser.id, mockHashedPassword);
    });

    it('should log successful password reset', async () => {
      await accountService.resetPassword(mockPasswordResetToken, 'newPassword123');

      expect(mockedLogger.info).toHaveBeenCalledWith(`Password reset successful for user: ${mockUser.id}`);
    });

    it('should handle database errors gracefully', async () => {
      mockedUserService.updateUserPassword.mockRejectedValue(new Error('Database error'));

      await expect(accountService.resetPassword(mockPasswordResetToken, 'newPassword123')).rejects.toThrow(
        new AppError('Error resetting password', StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.SERVER_ERROR)
      );
    });
  });
  
      describe('validateResetToken', () => {
    it('should return true for valid and non-expired token', () => {
      const result = accountService.validateResetToken(mockPasswordResetToken);

      expect(result).toBe(true);
      expect(mockedJwtUtil.verifyPasswordResetToken).toHaveBeenCalledWith(mockPasswordResetToken);
    });

    it('should return false for invalid token', () => {
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(mockInvalidTokenResult);

      const result = accountService.validateResetToken(mockInvalidToken);

      expect(result).toBe(false);
    });

    it('should return false for expired token', () => {
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(mockExpiredTokenResult);

      const result = accountService.validateResetToken(mockExpiredToken);

      expect(result).toBe(false);
    });

    it('should return false when token is missing', () => {
      const result = accountService.validateResetToken('');

      expect(result).toBe(false);
    });

    it('should return false when token is null or undefined', () => {
      expect(accountService.validateResetToken(null as any)).toBe(false);
      expect(accountService.validateResetToken(undefined as any)).toBe(false);
    });

    it('should return false when token payload is missing userId', () => {
      const tokenWithoutUserId = {
        isValid: true,
        isExpired: false,
        payload: { type: 'reset' }
      };
      mockedJwtUtil.verifyPasswordResetToken.mockReturnValue(tokenWithoutUserId as any);

      const result = accountService.validateResetToken(mockPasswordResetToken);

      expect(result).toBe(false);
    });

    it('should return false when token verification throws error', () => {
      mockedJwtUtil.verifyPasswordResetToken.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      const result = accountService.validateResetToken(mockPasswordResetToken);

      expect(result).toBe(false);
    });
  });
  });
  