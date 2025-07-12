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
    .withMessage(ErrorCode.INVALID_PASSWORD_LENGTH)
    .matches(/\d/)
    .withMessage(ErrorCode.INVALID_PASSWORD_NUMBER)
    .matches(/[a-zA-Z]/)
    .withMessage(ErrorCode.INVALID_PASSWORD_LETTER)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error(ErrorCode.NEW_PASSWORD_SAME);
      }
      return true;
    })
    .withMessage(ErrorCode.NEW_PASSWORD_SAME)
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
    .withMessage(ErrorCode.MISSING_TOKEN),
  body('password')
  .isLength({ min: 6 })
  .withMessage(ErrorCode.INVALID_PASSWORD_LENGTH)
  .matches(/\d/)
  .withMessage(ErrorCode.INVALID_PASSWORD_NUMBER)
  .matches(/[a-zA-Z]/)
  .withMessage(ErrorCode.INVALID_PASSWORD_LETTER)
];

export const queryTokenValidation = [
  query('token')
    .notEmpty()
    .withMessage(ErrorCode.MISSING_TOKEN)
    .isJWT()
    .withMessage(ErrorCode.INVALID_TOKEN)
]

