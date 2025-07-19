import {
  createAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  createAccessToken,
  createRefreshToken,
} from "../../../src/utils/jwt.util";
import jwt from "jsonwebtoken";
import { appConfig } from "../../../src/config";

describe("JWT Utility", () => {
  const mockUserId = "test-user-id-123";

  describe("createAuthTokens", () => {
    it("should create access and refresh tokens", () => {
      const tokens = createAuthTokens(mockUserId);
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.refreshToken.length).toBeGreaterThan(0);
      expect(tokens.accessToken.length).toBeGreaterThan(0);
    });

    it("should create tokens with correct payload", () => {
      const tokens = createAuthTokens(mockUserId);
      const decodedAccessToken = verifyAccessToken(tokens.accessToken);
      const decodedRefreshToken = verifyRefreshToken(tokens.refreshToken);
      expect(decodedAccessToken).toBeDefined();
      expect(decodedRefreshToken).toBeDefined();
      expect(decodedAccessToken.payload?.userId).toBe(mockUserId);
      expect(decodedRefreshToken.payload?.userId).toBe(mockUserId);
      expect(decodedAccessToken.isExpired).toBe(false);
      expect(decodedRefreshToken.isExpired).toBe(false);
      expect(decodedAccessToken.isValid).toBe(true);
      expect(decodedRefreshToken.isValid).toBe(true);
      expect(decodedAccessToken.error).toBeUndefined();
      expect(decodedRefreshToken.error).toBeUndefined();
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify valid access token", () => {
      const accessToken = createAccessToken(mockUserId);
      const decodedAccessToken = verifyAccessToken(accessToken);
      expect(decodedAccessToken).toBeDefined();
      expect(decodedAccessToken.payload?.userId).toBe(mockUserId);
      expect(decodedAccessToken.isExpired).toBe(false);
      expect(decodedAccessToken.isValid).toBe(true);
      expect(decodedAccessToken.error).toBeUndefined();
    });

    it("should reject invalid access token", () => {
      const accessToken = createAccessToken(mockUserId);
      const invalidAccessToken = accessToken + "invalid-token";
      const decodedAccessToken = verifyAccessToken(invalidAccessToken);
      expect(decodedAccessToken).toBeDefined();
      expect(decodedAccessToken.payload).toBeUndefined();
      expect(decodedAccessToken.isExpired).toBe(false);
      expect(decodedAccessToken.isValid).toBe(false);
      expect(decodedAccessToken.error).toBe("invalid");
    });

    it("should detect expired access token", async () => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(
        { userId: mockUserId },
        appConfig.accessTokenSecret,
        { expiresIn: "1ms" }
      );

      // Wait for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const decodedAccessToken = verifyAccessToken(expiredToken);
      expect(decodedAccessToken).toBeDefined();
      expect(decodedAccessToken.payload).toBeUndefined();
      expect(decodedAccessToken.isExpired).toBe(true);
      expect(decodedAccessToken.isValid).toBe(false);
      expect(decodedAccessToken.error).toBe("expired");
    });

    it("should handle malformed token", () => {
      const malformedToken = "not.a.valid.jwt.token";
      const decodedAccessToken = verifyAccessToken(malformedToken);
      expect(decodedAccessToken).toBeDefined();
      expect(decodedAccessToken.payload).toBeUndefined();
      expect(decodedAccessToken.isExpired).toBe(false);
      expect(decodedAccessToken.isValid).toBe(false);
      expect(decodedAccessToken.error).toBe("invalid");
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify valid refresh token", () => {
      const refreshToken = createRefreshToken(mockUserId);
      const decodedRefreshToken = verifyRefreshToken(refreshToken);
      expect(decodedRefreshToken).toBeDefined();
      expect(decodedRefreshToken.payload?.userId).toBe(mockUserId);
      expect(decodedRefreshToken.isExpired).toBe(false);
      expect(decodedRefreshToken.isValid).toBe(true);
      expect(decodedRefreshToken.error).toBeUndefined();
    });

    it("should reject invalid refresh token", () => {
      const refreshToken = createRefreshToken(mockUserId);
      const invalidRefreshToken = refreshToken + "invalid-token";
      const decodedRefreshToken = verifyRefreshToken(invalidRefreshToken);
      expect(decodedRefreshToken).toBeDefined();
      expect(decodedRefreshToken.payload).toBeUndefined();
      expect(decodedRefreshToken.isExpired).toBe(false);
      expect(decodedRefreshToken.isValid).toBe(false);
      expect(decodedRefreshToken.error).toBe("invalid");
    });

    it("should detect expired refresh token", async () => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(
        { userId: mockUserId },
        appConfig.refreshTokenSecret,
        { expiresIn: "1ms" }
      );

      // Wait for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const decodedRefreshToken = verifyRefreshToken(expiredToken);
      expect(decodedRefreshToken).toBeDefined();
      expect(decodedRefreshToken.payload).toBeUndefined();
      expect(decodedRefreshToken.isExpired).toBe(true);
      expect(decodedRefreshToken.isValid).toBe(false);
      expect(decodedRefreshToken.error).toBe("expired");
    });
  });

  describe("createEmailVerificationToken", () => {
    it("should create email verification token", () => {
      const token = createEmailVerificationToken(mockUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should create token with correct payload", () => {
      const token = createEmailVerificationToken(mockUserId);
      const decoded = verifyEmailVerificationToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.payload?.userId).toBe(mockUserId);
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(true);
      expect(decoded.error).toBeUndefined();
    });
  });

  describe("verifyEmailVerificationToken", () => {
    it("should verify valid email verification token", () => {
      const token = createEmailVerificationToken(mockUserId);
      const decoded = verifyEmailVerificationToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.payload?.userId).toBe(mockUserId);
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(true);
      expect(decoded.error).toBeUndefined();
    });

    it("should reject invalid email verification token", () => {
      const token = createEmailVerificationToken(mockUserId);
      const invalidToken = token + "invalid-token";
      const decoded = verifyEmailVerificationToken(invalidToken);
      expect(decoded).toBeDefined();
      expect(decoded.payload).toBeUndefined();
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(false);
      expect(decoded.error).toBe("invalid");
    });

    it("should detect expired email verification token", async () => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(
        { userId: mockUserId },
        appConfig.emailVerificationTokenSecret,
        { expiresIn: "1ms" }
      );

      // Wait for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const decoded = verifyEmailVerificationToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded.payload).toBeUndefined();
      expect(decoded.isExpired).toBe(true);
      expect(decoded.isValid).toBe(false);
      expect(decoded.error).toBe("expired");
    });
  });

  describe("createPasswordResetToken", () => {
    it("should create password reset token", () => {
      const token = createPasswordResetToken(mockUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should create token with correct payload", () => {
      const token = createPasswordResetToken(mockUserId);
      const decoded = verifyPasswordResetToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.payload?.userId).toBe(mockUserId);
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(true);
      expect(decoded.error).toBeUndefined();
    });
  });

  describe("verifyPasswordResetToken", () => {
    it("should verify valid password reset token", () => {
      const token = createPasswordResetToken(mockUserId);
      const decoded = verifyPasswordResetToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.payload?.userId).toBe(mockUserId);
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(true);
      expect(decoded.error).toBeUndefined();
    });

    it("should reject invalid password reset token", () => {
      const token = createPasswordResetToken(mockUserId);
      const invalidToken = token + "invalid-token";
      const decoded = verifyPasswordResetToken(invalidToken);
      expect(decoded).toBeDefined();
      expect(decoded.payload).toBeUndefined();
      expect(decoded.isExpired).toBe(false);
      expect(decoded.isValid).toBe(false);
      expect(decoded.error).toBe("invalid");
    });

    it("should detect expired password reset token", async () => {
      // Create a token with immediate expiration
      const expiredToken = jwt.sign(
        { userId: mockUserId },
        appConfig.resetPasswordTokenSecret,
        { expiresIn: "1ms" }
      );

      // Wait for the token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const decoded = verifyPasswordResetToken(expiredToken);
      expect(decoded).toBeDefined();
      expect(decoded.payload).toBeUndefined();
      expect(decoded.isExpired).toBe(true);
      expect(decoded.isValid).toBe(false);
      expect(decoded.error).toBe("expired");
    });
  });

  describe("Token Integration", () => {
    it("should work with real token creation and verification flow", () => {
      // Test complete auth flow
      const authTokens = createAuthTokens(mockUserId);
      const accessTokenResult = verifyAccessToken(authTokens.accessToken);
      const refreshTokenResult = verifyRefreshToken(authTokens.refreshToken);

      expect(accessTokenResult.isValid).toBe(true);
      expect(refreshTokenResult.isValid).toBe(true);
      expect(accessTokenResult.payload?.userId).toBe(mockUserId);
      expect(refreshTokenResult.payload?.userId).toBe(mockUserId);

      // Test email verification flow
      const emailToken = createEmailVerificationToken(mockUserId);
      const emailVerificationResult = verifyEmailVerificationToken(emailToken);

      expect(emailVerificationResult.isValid).toBe(true);
      expect(emailVerificationResult.payload?.userId).toBe(mockUserId);

      // Test password reset flow
      const resetToken = createPasswordResetToken(mockUserId);
      const resetVerificationResult = verifyPasswordResetToken(resetToken);

      expect(resetVerificationResult.isValid).toBe(true);
      expect(resetVerificationResult.payload?.userId).toBe(mockUserId);
    });

    it("should handle cross-token verification failures", () => {
      // Test that tokens created for one purpose don't work for another
      const accessToken = createAccessToken(mockUserId);
      const refreshToken = createRefreshToken(mockUserId);
      const emailToken = createEmailVerificationToken(mockUserId);
      const resetToken = createPasswordResetToken(mockUserId);

      // Access token should not verify as refresh token
      const accessAsRefresh = verifyRefreshToken(accessToken);
      expect(accessAsRefresh.isValid).toBe(false);
      expect(accessAsRefresh.error).toBe("invalid");

      // Refresh token should not verify as access token
      const refreshAsAccess = verifyAccessToken(refreshToken);
      expect(refreshAsAccess.isValid).toBe(false);
      expect(refreshAsAccess.error).toBe("invalid");

      // Email token should not verify as password reset token
      const emailAsReset = verifyPasswordResetToken(emailToken);
      expect(emailAsReset.isValid).toBe(false);
      expect(emailAsReset.error).toBe("invalid");

      // Reset token should not verify as email token
      const resetAsEmail = verifyEmailVerificationToken(resetToken);
      expect(resetAsEmail.isValid).toBe(false);
      expect(resetAsEmail.error).toBe("invalid");
    });

    it("should handle empty and null tokens", () => {
      // Test empty string
      const emptyAccessToken = verifyAccessToken("");
      expect(emptyAccessToken.isValid).toBe(false);
      expect(emptyAccessToken.error).toBe("invalid");

      // Test null (cast to string)
      const nullAccessToken = verifyAccessToken(null as any);
      expect(nullAccessToken.isValid).toBe(false);
      expect(nullAccessToken.error).toBe("invalid");

      // Test undefined (cast to string)
      const undefinedAccessToken = verifyAccessToken(undefined as any);
      expect(undefinedAccessToken.isValid).toBe(false);
      expect(undefinedAccessToken.error).toBe("invalid");
    });

    it("should handle different user IDs consistently", () => {
      const userId1 = "user-1";
      const userId2 = "user-2";

      const token1 = createAccessToken(userId1);
      const token2 = createAccessToken(userId2);

      const decoded1 = verifyAccessToken(token1);
      const decoded2 = verifyAccessToken(token2);

      expect(decoded1.payload?.userId).toBe(userId1);
      expect(decoded2.payload?.userId).toBe(userId2);
      expect(decoded1.payload?.userId).not.toBe(decoded2.payload?.userId);
    });
  });
});
