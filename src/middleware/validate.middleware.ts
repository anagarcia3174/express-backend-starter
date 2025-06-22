import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import AppError, { ErrorCode } from '../utils/app-error.util';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger.util';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorMessages,
      body: req.body
    });
    throw new AppError(
      errorMessages.join(', '),
      StatusCodes.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }
  next();
}; 