import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import { setupTestDB } from '../../setup';
import { UserModel, IUserDocument } from '../../../src/models/user.model';
import { CreateUserData } from '../../../src/types/user.types';
import AppError, { ErrorCode } from '../../../src/utils/app-error.util';
import * as userService from '../../../src/services/user.service';

describe("UserService", () => {
  setupTestDB();

  // Helper function to create valid user data
  const createValidUserData = (overrides: Partial<CreateUserData> = {}): CreateUserData => ({
    username: faker.internet.displayName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    ...overrides,
  });

  // Helper function to create a user in the database
  const createUserInDB = async (userData?: Partial<CreateUserData>): Promise<IUserDocument> => {
    const data = createValidUserData(userData);
    const user = new UserModel(data);
    await user.save();
    return user;
  };

  describe("createUser", () => {
    it("should create and return a new user when email and username are unique", async () => {
      const userData = createValidUserData();
      
      const result = await userService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
      expect(result.isVerified).toBe(false);
      expect(result.refreshTokens).toEqual([]);
    });

    it("should throw an AppError if email is already in use", async () => {
      const userData = createValidUserData();
      
      // Create first user
      await createUserInDB(userData);
      
      // Try to create second user with same email
      await expect(userService.createUser(userData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Email is already in use.',
          statusCode: StatusCodes.CONFLICT,
          code: ErrorCode.EMAIL_TAKEN
        })
      );
    });

    it("should throw an AppError if username is already in use", async () => {
      const userData = createValidUserData();
      
      // Create first user
      await createUserInDB(userData);
      
      // Try to create second user with same username but different email
      const newUserData = createValidUserData({ username: userData.username });
      
      await expect(userService.createUser(newUserData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Username is already in use.',
          statusCode: StatusCodes.CONFLICT,
          code: ErrorCode.USERNAME_TAKEN
        })
      );
    });
  });

  describe("getUserByEmail", () => {
    it("should return user with matching email and include password", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      
      const result = await userService.getUserByEmail(userData.email);
      
      expect(result).toBeDefined();
      expect(result!.email).toBe(userData.email);
      expect(result!.username).toBe(userData.username);
      expect(result!.password).toBeDefined(); // Password should be included
      expect(result!.password).not.toBe(userData.password);
      expect(result!.id.toString()).toBe(createdUser.id.toString());
    });

    it("should return null if no user with the given email exists", async () => {
      const result = await userService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });
  });

  describe("getUserById", () => {
    it("should return user when user exists with given ID", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      
      const result = await userService.getUserById(createdUser.id.toString());
      
      expect(result).toBeDefined();
      expect(result.id.toString()).toBe(createdUser.id.toString());
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
    });

    it("should throw an AppError if user does not exist", async () => {
      const fakeId = new Types.ObjectId().toString();
      
      await expect(userService.getUserById(fakeId)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });

  describe("addRefreshToken", () => {
    it("should add a refresh token and save the user", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      const refreshToken = 'test-refresh-token';
      
      await userService.addRefreshToken(createdUser.id.toString(), refreshToken);
      
      const updatedUser = await UserModel.findById(createdUser.id);
      expect(updatedUser!.refreshTokens).toContain(refreshToken);
      expect(updatedUser!.refreshTokens).toHaveLength(1);
    });

    it("should throw an AppError if user is not found", async () => {
      const fakeId = new UserModel().id.toString();
      const refreshToken = 'test-refresh-token';
      
      await expect(userService.addRefreshToken(fakeId, refreshToken)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });

  describe("getUserByRefreshToken", () => {
    it("should return user when refresh token matches", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      const refreshToken = 'test-refresh-token';
      
      await userService.addRefreshToken(createdUser.id.toString(), refreshToken);
      
      const result = await userService.getUserByRefreshToken(refreshToken);
      
      expect(result).toBeDefined();
      expect(result!.id.toString()).toBe(createdUser.id.toString());
      expect(result!.refreshTokens).toContain(refreshToken);
    });

    it("should return null if no user with that refresh token exists", async () => {
      const result = await userService.getUserByRefreshToken('nonexistent-token');
      
      expect(result).toBeNull();
    });
  });

  describe("removeRefreshToken", () => {
    it("should remove the specific refresh token and save the user", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      const refreshToken1 = 'test-refresh-token-1';
      const refreshToken2 = 'test-refresh-token-2';
      
      // Add two tokens
      await userService.addRefreshToken(createdUser.id.toString(), refreshToken1);
      await userService.addRefreshToken(createdUser.id.toString(), refreshToken2);
      
      // Remove one token
      await userService.removeRefreshToken(createdUser.id.toString(), refreshToken1);
      
      const updatedUser = await UserModel.findById(createdUser.id);
      expect(updatedUser!.refreshTokens).not.toContain(refreshToken1);
      expect(updatedUser!.refreshTokens).toContain(refreshToken2);
      expect(updatedUser!.refreshTokens).toHaveLength(1);
    });

    it("should do nothing if the refresh token does not exist in user", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      const existingToken = 'existing-token';
      const nonExistentToken = 'non-existent-token';
      
      // Add one token
      await userService.addRefreshToken(createdUser.id.toString(), existingToken);
      
      // Try to remove non-existent token
      await userService.removeRefreshToken(createdUser.id.toString(), nonExistentToken);
      
      const updatedUser = await UserModel.findById(createdUser.id);
      expect(updatedUser!.refreshTokens).toContain(existingToken);
      expect(updatedUser!.refreshTokens).toHaveLength(1);
    });

    it("should throw an AppError if user is not found", async () => {
      const fakeId = new UserModel().id.toString();
      const refreshToken = 'test-refresh-token';
      
      await expect(userService.removeRefreshToken(fakeId, refreshToken)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });

  describe("removeAllRefreshTokens", () => {
    it("should clear all refresh tokens for the user and save", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      
      // Add multiple tokens
      await userService.addRefreshToken(createdUser.id.toString(), 'token1');
      await userService.addRefreshToken(createdUser.id.toString(), 'token2');
      
      // Remove all tokens
      await userService.removeAllRefreshTokens(createdUser.id.toString());
      
      const updatedUser = await UserModel.findById(createdUser.id);
      expect(updatedUser!.refreshTokens).toEqual([]);
    });

    it("should throw an AppError if user is not found", async () => {
      const fakeId = new UserModel().id.toString();
      
      await expect(userService.removeAllRefreshTokens(fakeId)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });

  describe("updateVerificationStatus", () => {
    it("should update the isVerified field for the user", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      
      // Verify user
      await userService.updateVerificationStatus(createdUser.id.toString(), true);
      
      const updatedUser = await UserModel.findById(createdUser.id);
      expect(updatedUser!.isVerified).toBe(true);
      
      // Unverify user
      await userService.updateVerificationStatus(createdUser.id.toString(), false);
      
      const reUpdatedUser = await UserModel.findById(createdUser.id);
      expect(reUpdatedUser!.isVerified).toBe(false);
    });

    it("should throw an AppError if user is not found", async () => {
      const fakeId = new UserModel().id.toString();
      
      await expect(userService.updateVerificationStatus(fakeId, true)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });

  describe("updateUserPassword", () => {
    it("should update the password field for the user", async () => {
      const userData = createValidUserData();
      const createdUser = await createUserInDB(userData);
      const newPassword = 'newPassword123';
      
      await userService.updateUserPassword(createdUser.id.toString(), newPassword);
      
      const updatedUser = await UserModel.findById(createdUser.id).select('+password');
      expect(updatedUser!.password).toBeDefined();
      // Password should be hashed, so it shouldn't equal the plain text
      expect(updatedUser!.password).not.toBe(newPassword);
      
      // Verify the password can be compared correctly
      const isMatch = await updatedUser!.comparePassword(newPassword);
      expect(isMatch).toBe(true);
    });

    it("should throw an AppError if user is not found", async () => {
      const fakeId = new UserModel().id.toString();
      const newPassword = 'newPassword123';
      
      await expect(userService.updateUserPassword(fakeId, newPassword)).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found.',
          statusCode: StatusCodes.NOT_FOUND,
          code: ErrorCode.NO_USER
        })
      );
    });
  });
});
