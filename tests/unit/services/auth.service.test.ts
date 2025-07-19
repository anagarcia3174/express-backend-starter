import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';
import { setupTestDB } from '../../setup';
import { UserModel, IUserDocument } from '../../../src/models/user.model';
import { RegisterRequest, LoginRequest, CreateUserData } from '../../../src/types/user.types';
import AppError, { ErrorCode } from '../../../src/utils/app-error.util';
import * as authService from '../../../src/services/auth.service';
import * as userService from '../../../src/services/user.service';
import * as emailService from '../../../src/services/email.service';
import * as jwtUtil from '../../../src/utils/jwt.util';
import { logger } from '../../../src/utils/logger.util';

// Mock all dependencies
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/services/email.service');
jest.mock('../../../src/utils/jwt.util');
jest.mock('../../../src/utils/logger.util');

// Type the mocked modules
const mockUserService = userService as jest.Mocked<typeof userService>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockJwtUtil = jwtUtil as jest.Mocked<typeof jwtUtil>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("AuthService", () => {
  setupTestDB();

  // Helper function to create valid user data
  const createValidUserData = (overrides: Partial<CreateUserData> = {}): CreateUserData => ({
    username: faker.internet.displayName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    ...overrides,
  });

  // Helper function to create register request
  const createRegisterRequest = (overrides: Partial<RegisterRequest> = {}): RegisterRequest => ({
    username: faker.internet.displayName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    ...overrides,
  });

  // Helper function to create login request
  const createLoginRequest = (overrides: Partial<LoginRequest> = {}): LoginRequest => ({
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    ...overrides,
  });

  // Helper function to create mock user
  const createMockUser = (overrides: Partial<IUserDocument> = {}): Partial<IUserDocument> => ({
    id: faker.string.uuid(),
    username: faker.internet.displayName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    isVerified: false,
    refreshTokens: [],
    comparePassword: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should create a user, generate tokens, add refresh token, send verification email, and return auth result", async () => {
      const registerData = createRegisterRequest();
      const mockUser = createMockUser({ id: 'user-id-123' });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const mockVerificationToken = 'verification-token';

      // Mock dependencies
      mockUserService.createUser.mockResolvedValue(mockUser as IUserDocument);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createEmailVerificationToken.mockReturnValue(mockVerificationToken);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await authService.register(registerData);

      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });
      expect(mockJwtUtil.createAuthTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserService.addRefreshToken).toHaveBeenCalledWith(mockUser.id, mockTokens.refreshToken);
      expect(mockJwtUtil.createEmailVerificationToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockVerificationToken,
        mockUser.username
      );
      expect(mockLogger.info).toHaveBeenCalledWith(`User registered successfully: ${mockUser.id}`);
      expect(result).toEqual({
        userId: mockUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it("should throw AppError if createUser throws an AppError (e.g., email/username taken)", async () => {
      const registerData = createRegisterRequest();
      const expectedError = new AppError('Email is already in use.', StatusCodes.CONFLICT, ErrorCode.EMAIL_TAKEN);

      mockUserService.createUser.mockRejectedValue(expectedError);

      await expect(authService.register(registerData)).rejects.toThrow(expectedError);
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });
    });

    it("should throw generic AppError if an unknown error occurs during registration", async () => {
      const registerData = createRegisterRequest();
      const unexpectedError = new Error('Database connection failed');

      mockUserService.createUser.mockRejectedValue(unexpectedError);

      await expect(authService.register(registerData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Error during registration',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          code: ErrorCode.SERVER_ERROR,
        })
      );
    });

    it("should still return success if sending verification email fails (and logs error)", async () => {
      const registerData = createRegisterRequest();
      const mockUser = createMockUser({ id: 'user-id-123' });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const mockVerificationToken = 'verification-token';
      const emailError = new Error('SMTP server unavailable');

      // Mock dependencies
      mockUserService.createUser.mockResolvedValue(mockUser as IUserDocument);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createEmailVerificationToken.mockReturnValue(mockVerificationToken);
      mockEmailService.sendVerificationEmail.mockRejectedValue(emailError);

      const result = await authService.register(registerData);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email to ${mockUser.email}:`,
        emailError
      );
      expect(result).toEqual({
        userId: mockUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });

  describe("login", () => {
    it("should return auth result if credentials are valid and refresh token is rotated", async () => {
      const loginData = createLoginRequest();
      const existingRefreshToken = 'existing-refresh-token';
      const mockUser = createMockUser({ id: 'user-id-123' });
      const mockTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      // Mock user found and password valid
      mockUserService.getUserByEmail.mockResolvedValue(mockUser as IUserDocument);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);
      mockUserService.getUserByRefreshToken.mockResolvedValue(mockUser as IUserDocument);
      mockUserService.removeRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(loginData, existingRefreshToken);

      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(existingRefreshToken);
      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id, existingRefreshToken);
      expect(mockJwtUtil.createAuthTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserService.addRefreshToken).toHaveBeenCalledWith(mockUser.id, mockTokens.refreshToken);
      expect(mockLogger.info).toHaveBeenCalledWith(`User logged in successfully: ${mockUser.id}`);
      expect(result).toEqual({
        userId: mockUser.id,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it("should throw AppError if user is not found by email", async () => {
      const loginData = createLoginRequest();

      mockUserService.getUserByEmail.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid email or password',
          statusCode: StatusCodes.UNAUTHORIZED,
          code: ErrorCode.INVALID_CREDENTIALS,
        })
      );
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
    });

    it("should throw AppError if password comparison fails", async () => {
      const loginData = createLoginRequest();
      const mockUser = createMockUser();

      mockUserService.getUserByEmail.mockResolvedValue(mockUser as IUserDocument);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid email or password',
          statusCode: StatusCodes.UNAUTHORIZED,
          code: ErrorCode.INVALID_CREDENTIALS,
        })
      );
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });

    it("should throw generic AppError if an unknown error occurs during login", async () => {
      const loginData = createLoginRequest();
      const unexpectedError = new Error('Database connection failed');

      mockUserService.getUserByEmail.mockRejectedValue(unexpectedError);

      await expect(authService.login(loginData)).rejects.toThrow(
        expect.objectContaining({
          message: 'Error during login',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          code: ErrorCode.SERVER_ERROR,
        })
      );
    });
  });

  describe("logout", () => {
    it("should do nothing if no refresh token is provided", async () => {
      await authService.logout();

      expect(mockUserService.getUserByRefreshToken).not.toHaveBeenCalled();
      expect(mockUserService.removeRefreshToken).not.toHaveBeenCalled();
    });

    it("should do nothing if no user is found with the given refresh token", async () => {
      const refreshToken = 'invalid-refresh-token';

      mockUserService.getUserByRefreshToken.mockResolvedValue(null);

      await authService.logout(refreshToken);

      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.removeRefreshToken).not.toHaveBeenCalled();
    });

    it("should remove the refresh token if the user is found", async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = createMockUser({ id: 'user-id-123' });

      mockUserService.getUserByRefreshToken.mockResolvedValue(mockUser as IUserDocument);
      mockUserService.removeRefreshToken.mockResolvedValue(undefined);

      await authService.logout(refreshToken);

      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id, refreshToken);
      expect(mockLogger.info).toHaveBeenCalledWith(`User logged out successfully: ${mockUser.id}`);
    });

    it("should throw generic AppError if an unknown error occurs during logout", async () => {
      const refreshToken = 'valid-refresh-token';
      const unexpectedError = new Error('Database connection failed');

      mockUserService.getUserByRefreshToken.mockRejectedValue(unexpectedError);

      await expect(authService.logout(refreshToken)).rejects.toThrow(
        expect.objectContaining({
          message: 'Error during logout',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          code: ErrorCode.SERVER_ERROR,
        })
      );
    });
  });

  describe("refreshTokens", () => {
    it("should refresh tokens and return new tokens if user and token are valid", async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id-123';
      const mockUser = createMockUser({ id: userId });
      const mockNewTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      mockUserService.getUserByRefreshToken.mockResolvedValue(mockUser as IUserDocument);
      mockUserService.removeRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockNewTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens(refreshToken, userId);

      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith(userId, refreshToken);
      expect(mockJwtUtil.createAuthTokens).toHaveBeenCalledWith(userId);
      expect(mockUserService.addRefreshToken).toHaveBeenCalledWith(userId, mockNewTokens.refreshToken);
      expect(mockLogger.info).toHaveBeenCalledWith(`Tokens refreshed successfully: ${userId}`);
      expect(result).toEqual({
        userId: userId,
        accessToken: mockNewTokens.accessToken,
        refreshToken: mockNewTokens.refreshToken,
      });
    });

    it("should throw AppError if token is valid JWT but user not found in DB", async () => {
      const refreshToken = 'valid-jwt-token';
      const userId = 'user-id-123';

      mockUserService.getUserByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshTokens(refreshToken, userId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: StatusCodes.FORBIDDEN,
          code: ErrorCode.INVALID_TOKEN,
        })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Valid refresh token found but no owner in database. Token belonged to user: ${userId}`
      );
    });

    it("should throw AppError if token userId does not match user found in DB", async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenUserId = 'user-id-123';
      const dbUserId = 'user-id-456';
      const mockUser = createMockUser({ id: dbUserId });

      mockUserService.getUserByRefreshToken.mockResolvedValue(mockUser as IUserDocument);

      await expect(authService.refreshTokens(refreshToken, tokenUserId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: StatusCodes.FORBIDDEN,
          code: ErrorCode.INVALID_TOKEN,
        })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Refresh token userId mismatch. Token: ${tokenUserId}, User: ${dbUserId}`
      );
    });

    it("should throw generic AppError if an unknown error occurs during token refresh", async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id-123';
      const unexpectedError = new Error('Database connection failed');

      mockUserService.getUserByRefreshToken.mockRejectedValue(unexpectedError);

      await expect(authService.refreshTokens(refreshToken, userId)).rejects.toThrow(
        expect.objectContaining({
          message: 'Error refreshing tokens',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
          code: ErrorCode.SERVER_ERROR,
        })
      );
    });
  });

  describe("handleRefreshTokenRotation", () => {
    it("should do nothing if no existing refresh token is provided", async () => {
      const userId = 'user-id-123';

      // Since handleRefreshTokenRotation is private, we test it through login
      const loginData = createLoginRequest();
      const mockUser = createMockUser({ id: userId });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserService.getUserByEmail.mockResolvedValue(mockUser as IUserDocument);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);

      await authService.login(loginData); // No existingRefreshToken passed

      expect(mockUserService.getUserByRefreshToken).not.toHaveBeenCalled();
      expect(mockUserService.removeAllRefreshTokens).not.toHaveBeenCalled();
      expect(mockUserService.removeRefreshToken).not.toHaveBeenCalled();
    });

    it("should remove all refresh tokens if token not found in DB", async () => {
      const userId = 'user-id-123';
      const existingRefreshToken = 'suspicious-token';
      const loginData = createLoginRequest();
      const mockUser = createMockUser({ id: userId });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserService.getUserByEmail.mockResolvedValue(mockUser as IUserDocument);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);
      mockUserService.getUserByRefreshToken.mockResolvedValue(null); // Token not found
      mockUserService.removeAllRefreshTokens.mockResolvedValue(undefined);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);

      await authService.login(loginData, existingRefreshToken);

      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(existingRefreshToken);
      expect(mockUserService.removeAllRefreshTokens).toHaveBeenCalledWith(userId);
    });

    it("should remove only the matching refresh token if token is found", async () => {
      const userId = 'user-id-123';
      const existingRefreshToken = 'valid-existing-token';
      const loginData = createLoginRequest();
      const mockUser = createMockUser({ id: userId });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserService.getUserByEmail.mockResolvedValue(mockUser as IUserDocument);
      (mockUser.comparePassword as jest.Mock).mockResolvedValue(true);
      mockUserService.getUserByRefreshToken.mockResolvedValue(mockUser as IUserDocument); // Token found
      mockUserService.removeRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);

      await authService.login(loginData, existingRefreshToken);

      expect(mockUserService.getUserByRefreshToken).toHaveBeenCalledWith(existingRefreshToken);
      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith(userId, existingRefreshToken);
      expect(mockUserService.removeAllRefreshTokens).not.toHaveBeenCalled();
    });
  });

  describe("sendVerificationEmailSafely", () => {
    it("should call sendVerificationEmail with correct params", async () => {
      // Test through register function since sendVerificationEmailSafely is private
      const registerData = createRegisterRequest();
      const mockUser = createMockUser({ id: 'user-id-123' });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const mockVerificationToken = 'verification-token';

      mockUserService.createUser.mockResolvedValue(mockUser as IUserDocument);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createEmailVerificationToken.mockReturnValue(mockVerificationToken);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      await authService.register(registerData);

      expect(mockJwtUtil.createEmailVerificationToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockVerificationToken,
        mockUser.username
      );
    });

    it("should catch and log errors instead of throwing them", async () => {
      // Test through register function since sendVerificationEmailSafely is private
      const registerData = createRegisterRequest();
      const mockUser = createMockUser({ id: 'user-id-123' });
      const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
      const mockVerificationToken = 'verification-token';
      const emailError = new Error('Email service down');

      mockUserService.createUser.mockResolvedValue(mockUser as IUserDocument);
      mockJwtUtil.createAuthTokens.mockReturnValue(mockTokens);
      mockUserService.addRefreshToken.mockResolvedValue(undefined);
      mockJwtUtil.createEmailVerificationToken.mockReturnValue(mockVerificationToken);
      mockEmailService.sendVerificationEmail.mockRejectedValue(emailError);

      // Should not throw error
      const result = await authService.register(registerData);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to send verification email to ${mockUser.email}:`,
        emailError
      );
      expect(result).toBeDefined(); // Registration should still succeed
    });
  });
});
