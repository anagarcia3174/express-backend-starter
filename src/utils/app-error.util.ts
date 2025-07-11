import { StatusCodes } from "http-status-codes";

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid-credentials',
  NO_USER = 'no-user',
  EMAIL_NOT_VERIFIED = 'email-not-verified',

  // Validation errors
  INVALID_EMAIL = 'invalid-email',
  INVALID_USERNAME = 'invalid-username',
  INVALID_USERNAME_LENGTH = 'invalid-username-length',
  INVALID_PASSWORD = 'invalid-password',
  INVALID_PASSWORD_LENGTH = 'invalid-password-length',
  INVALID_PASSWORD_NUMBER = 'invalid-password-number',
  INVALID_PASSWORD_LETTER = 'invalid-password-letter',
  NEW_PASSWORD_SAME = 'new-password-same',
  VALIDATION_ERROR = 'validation-error',

  // Token errors
  INVALID_TOKEN = 'invalid-token',
  MISSING_TOKEN = 'missing-token',

  // User errors
  EMAIL_TAKEN = 'email-taken',
  USERNAME_TAKEN = 'username-taken',
  EMAIL_ALREADY_VERIFIED = 'email-already-verified',

  // Server errors
  SERVER_ERROR = 'server-error',
  DATABASE_ERROR = 'database-error',
  TOO_MANY_REQUESTS = 'too-many-requests',
  NOT_FOUND = 'not-found',
}

class AppError extends Error {
    code: ErrorCode;
    message: string;
    statusCode: number;

    constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, code: ErrorCode){
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;
