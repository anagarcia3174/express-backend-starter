import { IUserDocument, UserModel } from "../models/user.model";
import AppError, { ErrorCode } from "../utils/app-error.util";
import { StatusCodes } from "http-status-codes";
import { CreateUserData } from "../types/user.types";


export const createUser = async (data: CreateUserData): Promise<IUserDocument> => {
  const existingEmail = await UserModel.findByEmail(data.email);
  if (existingEmail) {
    throw new AppError('Email is already in use.', StatusCodes.CONFLICT, ErrorCode.EMAIL_TAKEN);
  }

  const existingUsername = await UserModel.findByUsername(data.username);
  if (existingUsername) {
    throw new AppError('Username is already in use.', StatusCodes.CONFLICT, ErrorCode.USERNAME_TAKEN);
  }

  const user = await UserModel.create(data);
  return user;
}

export const getUserByEmail = async (email: string): Promise<IUserDocument | null> => {
  return UserModel.findOne({ email }).select("+password");

};

export const getUserById = async (userId: string): Promise<IUserDocument> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }

  return user;
};

export const addRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }

  user.refreshTokens.push(refreshToken);
  await user.save();
  return;
};

export const getUserByRefreshToken = async (
  refreshToken: string
): Promise<IUserDocument | null> => {
  const user = await UserModel.findOne({ refreshTokens: refreshToken });
  return user;
};

export const removeRefreshToken = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }

  user.refreshTokens = user.refreshTokens.filter(
    (token: string) => token !== refreshToken
  );
  await user.save();
  return;
};

export const removeAllRefreshTokens = async (
  userId: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }

  user.refreshTokens = [];
  await user.save();
  return;
};

export const updateVerificationStatus = async (
  userId: string,
  isVerified: boolean
): Promise<void> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { isVerified },
    { new: true }
  );
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }
  return;
};

export const updateUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND,ErrorCode.NO_USER);
  }
  
  user.password = newPassword;
  await user.save();
  return;
};
