import { body, query } from 'express-validator';
import { ErrorCode } from '../utils/app-error.util';

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage(ErrorCode.INVALID_USERNAME_LENGTH)
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(ErrorCode.INVALID_USERNAME),

  body('email')
    .trim()
    .isEmail()
    .withMessage(ErrorCode.INVALID_EMAIL)
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage(ErrorCode.INVALID_PASSWORD_LENGTH)
    .matches(/\d/)
    .withMessage(ErrorCode.INVALID_PASSWORD_NUMBER)
    .matches(/[a-zA-Z]/)
    .withMessage(ErrorCode.INVALID_PASSWORD_LETTER)
];

export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage(ErrorCode.INVALID_EMAIL)
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage(ErrorCode.INVALID_PASSWORD)
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage(ErrorCode.INVALID_PASSWORD),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage(ErrorCode.INVALID_PASSWORD_LETTER)
    .matches(/\d/)
    .withMessage(ErrorCode.INVALID_PASSWORD_NUMBER)
    .matches(/[a-zA-Z]/)
    .withMessage(ErrorCode.INVALID_PASSWORD_LETTER)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('new-password-same');
      }
      return true;
    })
    .withMessage(ErrorCode.INVALID_PASSWORD)
]; 

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage(ErrorCode.INVALID_EMAIL)
    .normalizeEmail()
]

export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long')
  .matches(/\d/)
  .withMessage('Password must contain at least one number')
  .matches(/[a-zA-Z]/)
  .withMessage('Password must contain at least one letter')
];

export const queryTokenValidation = [
  query('token')
    .notEmpty()
    .withMessage(ErrorCode.MISSING_TOKEN)
    .isJWT()
    .withMessage(ErrorCode.INVALID_TOKEN)
]

