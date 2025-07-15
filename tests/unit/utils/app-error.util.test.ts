import AppError, { ErrorCode } from '../../../src/utils/app-error.util';
import { StatusCodes } from 'http-status-codes';

describe('AppError Utility', () => {
  describe('AppError Class', () => {
    test('should create AppError with message, statusCode, and errorCode', () => {
      // TODO: Implement test
      const error = new AppError('test', StatusCodes.BAD_REQUEST, ErrorCode.SERVER_ERROR);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('test');
      expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
    });

    test('should extend Error class', () => {
      // TODO: Implement test
      const error = new AppError('test', StatusCodes.BAD_REQUEST, ErrorCode.SERVER_ERROR);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('test');
      expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
    });
  });

  describe('ErrorCode Enum', () => {
    test('should contain all expected error codes', () => {
      // TODO: Implement test
      expect(ErrorCode).toBeDefined();
      expect(Object.values(ErrorCode).length).toBe(21);
      expect(ErrorCode.SERVER_ERROR).toBe('server-error');
      expect(ErrorCode.DATABASE_ERROR).toBe('database-error');
      expect(ErrorCode.TOO_MANY_REQUESTS).toBe('too-many-requests');
      expect(ErrorCode.NOT_FOUND).toBe('not-found');
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('invalid-credentials');
      expect(ErrorCode.NO_USER).toBe('no-user');
      expect(ErrorCode.EMAIL_NOT_VERIFIED).toBe('email-not-verified');
      expect(ErrorCode.INVALID_EMAIL).toBe('invalid-email');
      expect(ErrorCode.INVALID_USERNAME).toBe('invalid-username');
      expect(ErrorCode.INVALID_USERNAME_LENGTH).toBe('invalid-username-length');
      expect(ErrorCode.INVALID_PASSWORD).toBe('invalid-password');
      expect(ErrorCode.INVALID_PASSWORD_LENGTH).toBe('invalid-password-length');
      expect(ErrorCode.INVALID_PASSWORD_NUMBER).toBe('invalid-password-number');
      expect(ErrorCode.INVALID_PASSWORD_LETTER).toBe('invalid-password-letter');
      expect(ErrorCode.NEW_PASSWORD_SAME).toBe('new-password-same');
      expect(ErrorCode.VALIDATION_ERROR).toBe('validation-error');
      expect(ErrorCode.INVALID_TOKEN).toBe('invalid-token');
      expect(ErrorCode.MISSING_TOKEN).toBe('missing-token');
      expect(ErrorCode.EMAIL_TAKEN).toBe('email-taken');
    });
  });
}); 

