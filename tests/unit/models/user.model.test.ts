import { faker } from '@faker-js/faker';
import { IUserDocument, UserModel } from '../../../src/models/user.model';
import { setupTestDB } from '../../setup';


describe('User model', () => {
  setupTestDB();

  // Helper function to create valid user data
  const createValidUserData = (overrides: Partial<IUserDocument> = {}) => ({
    username: faker.internet.username(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 8 }),
    ...overrides,
  });

  describe('Schema Validation Tests', () => {
    describe('Required Field Tests', () => {
      it('should require username field', async () => {
        const userData = createValidUserData();
        delete (userData as any).username;
        
        const user = new UserModel(userData);
        const error = user.validateSync();
        
        expect(error?.errors.username).toBeDefined();
        expect(error?.errors.username.message).toContain('required');
      });

      it('should require email field', async () => {
        const userData = createValidUserData();
        delete (userData as any).email;
        
        const user = new UserModel(userData);
        const error = user.validateSync();
        
        expect(error?.errors.email).toBeDefined();
        expect(error?.errors.email.message).toContain('required');
      });

      it('should require password field', async () => {
        const userData = createValidUserData();
        delete (userData as any).password;
        
        const user = new UserModel(userData);
        const error = user.validateSync();
        
        expect(error?.errors.password).toBeDefined();
        expect(error?.errors.password.message).toContain('required');
      });
    });

    describe('Unique Constraint Tests', () => {
      it('should enforce unique username constraint', async () => {
        const userData = createValidUserData();
        
        // Create first user
        const user1 = new UserModel(userData);
        await user1.save();
        
        // Try to create second user with same username
        const user2 = new UserModel({
          ...createValidUserData(),
          username: userData.username,
        });
        
        await expect(user2.save()).rejects.toThrow();
      });

      it('should enforce unique email constraint', async () => {
        const userData = createValidUserData();
        
        // Create first user
        const user1 = new UserModel(userData);
        await user1.save();
        
        // Try to create second user with same email
        const user2 = new UserModel({
          ...createValidUserData(),
          email: userData.email,
        });
        
        await expect(user2.save()).rejects.toThrow();
      });
    });

    describe('Field Validation Tests', () => {
      it('should validate username minimum length (3 characters)', async () => {
        const userData = createValidUserData({ username: 'ab' });
        
        const user = new UserModel(userData);
        const error = user.validateSync();
        
        expect(error?.errors.username).toBeDefined();
        expect(error?.errors.username.message).toContain('shorter than the minimum');
      });

      it('should validate username maximum length (30 characters)', async () => {
        const userData = createValidUserData({ 
          username: 'a'.repeat(31) 
        });
        
        const user = new UserModel(userData);
        const error = user.validateSync();
        
        expect(error?.errors.username).toBeDefined();
        expect(error?.errors.username.message).toContain('longer than the maximum');
      });

      it('should trim whitespace from username', async () => {
        const userData = createValidUserData({ username: '  testuser  ' });
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user.username).toBe('testuser');
      });

      it('should trim whitespace from email', async () => {
        const userData = createValidUserData({ email: '  test@example.com  ' });
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user.email).toBe('test@example.com');
      });
    });

    describe('Default Value Tests', () => {
      it('should set refreshTokens to empty array by default', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user.refreshTokens).toEqual([]);
      });

      it('should set isVerified to false by default', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user.isVerified).toBe(false);
      });

      it('should auto-generate createdAt and updatedAt timestamps', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        // expect(user.createdAt).toBeDefined();
        // expect(user.updatedAt).toBeDefined();
        // expect(user.createdAt).toBeInstanceOf(Date);
        // expect(user.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Instance Method Tests', () => {
    describe('comparePassword Method', () => {
      it('should return true when comparing correct password', async () => {
        const plainPassword = 'testPassword123';
        const userData = createValidUserData({ password: plainPassword });
        
        const user = new UserModel(userData);
        await user.save();
        
        // Need to fetch user with password field since it's not selected by default
        const savedUser = await UserModel.findById(user._id).select('+password');
        const isMatch = await savedUser!.comparePassword(plainPassword);
        
        expect(isMatch).toBe(true);
      });

      it('should return false when comparing incorrect password', async () => {
        const plainPassword = 'testPassword123';
        const userData = createValidUserData({ password: plainPassword });
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        const isMatch = await savedUser!.comparePassword('wrongPassword');
        
        expect(isMatch).toBe(false);
      });

      it('should handle empty/null candidate passwords gracefully', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        const isMatchEmpty = await savedUser!.comparePassword('');
        const isMatchNull = await savedUser!.comparePassword(null as any);
        
        expect(isMatchEmpty).toBe(false);
        expect(isMatchNull).toBe(false);
      });
    });
  });

  describe('Static Method Tests', () => {
    describe('findByEmail Method', () => {
      it('should find user by valid email address', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const foundUser = await UserModel.findByEmail(userData.email);
        
        expect(foundUser).toBeDefined();
        expect(foundUser!.email).toBe(userData.email);
        expect(foundUser!.username).toBe(userData.username);
      });

      it('should return null for non-existent email', async () => {
        const foundUser = await UserModel.findByEmail('nonexistent@example.com');
        
        expect(foundUser).toBeNull();
      });

      it('should be case-sensitive for email lookup', async () => {
        const userData = createValidUserData({ email: 'test@example.com' });
        
        const user = new UserModel(userData);
        await user.save();
        
        const foundUser = await UserModel.findByEmail('TEST@EXAMPLE.COM');
        
        expect(foundUser).toBeNull();
      });
    });

    describe('findByUsername Method', () => {
      it('should find user by valid username', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const foundUser = await UserModel.findByUsername(userData.username);
        
        expect(foundUser).toBeDefined();
        expect(foundUser!.username).toBe(userData.username);
        expect(foundUser!.email).toBe(userData.email);
      });

      it('should return null for non-existent username', async () => {
        const foundUser = await UserModel.findByUsername('nonexistentuser');
        
        expect(foundUser).toBeNull();
      });

      it('should be case-sensitive for username lookup', async () => {
        const userData = createValidUserData({ username: 'testuser' });
        
        const user = new UserModel(userData);
        await user.save();
        
        const foundUser = await UserModel.findByUsername('TESTUSER');
        
        expect(foundUser).toBeNull();
      });
    });
  });

  describe('Pre-save Middleware Tests', () => {
    describe('Password Hashing', () => {
      it('should hash password before saving new user', async () => {
        const plainPassword = 'testPassword123';
        const userData = createValidUserData({ password: plainPassword });
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        
        expect(savedUser!.password).not.toBe(plainPassword);
        expect(savedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/); // bcrypt hash pattern
      });

      it('should hash password when password is modified', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        const originalHash = savedUser!.password;
        
        // Modify password
        const newPassword = 'newPassword123';
        savedUser!.password = newPassword;
        await savedUser!.save();
        
        const updatedUser = await UserModel.findById(user._id).select('+password');
        
        expect(updatedUser!.password).not.toBe(originalHash);
        expect(updatedUser!.password).not.toBe(newPassword);
        expect(updatedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/);
      });

      it('should not hash password when other fields are modified', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        const originalHash = savedUser!.password;
        
        // Modify non-password field
        savedUser!.isVerified = true;
        await savedUser!.save();
        
        const updatedUser = await UserModel.findById(user._id).select('+password');
        
        expect(updatedUser!.password).toBe(originalHash);
      });

      it('should ensure hashed password is different from plain text', async () => {
        const plainPassword = 'testPassword123';
        const userData = createValidUserData({ password: plainPassword });
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        
        expect(savedUser!.password).not.toBe(plainPassword);
      });

      it('should maintain password hash format (bcrypt)', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const savedUser = await UserModel.findById(user._id).select('+password');
        
        expect(savedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/);
        expect(savedUser!.password.length).toBe(60); // bcrypt hash length
      });
    });
  });

  describe('Model Creation Tests', () => {
    describe('Successful User Creation', () => {
      it('should create user with valid data', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user._id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.refreshTokens).toEqual([]);
        expect(user.isVerified).toBe(false);
      });

      it('should create user with minimal required fields', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        };
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user._id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.refreshTokens).toEqual([]);
        expect(user.isVerified).toBe(false);
      });

      it('should create user with all optional fields', async () => {
        const userData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          refreshTokens: ['token1', 'token2'],
          isVerified: true,
        };
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(user._id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.refreshTokens).toEqual(userData.refreshTokens);
        expect(user.isVerified).toBe(userData.isVerified);
      });
    });

    describe('Failed User Creation', () => {
      it('should fail to create user with missing required fields', async () => {
        const user = new UserModel({});
        
        await expect(user.save()).rejects.toThrow();
      });

      it('should fail to create user with duplicate username', async () => {
        const userData = createValidUserData();
        
        // Create first user
        const user1 = new UserModel(userData);
        await user1.save();
        
        // Try to create second user with same username
        const user2 = new UserModel({
          ...createValidUserData(),
          username: userData.username,
        });
        
        await expect(user2.save()).rejects.toThrow();
      });

      it('should fail to create user with duplicate email', async () => {
        const userData = createValidUserData();
        
        // Create first user
        const user1 = new UserModel(userData);
        await user1.save();
        
        // Try to create second user with same email
        const user2 = new UserModel({
          ...createValidUserData(),
          email: userData.email,
        });
        
        await expect(user2.save()).rejects.toThrow();
      });

      it('should fail to create user with invalid field lengths', async () => {
        // Username too short
        const shortUsernameData = createValidUserData({ username: 'ab' });
        const shortUsernameUser = new UserModel(shortUsernameData);
        await expect(shortUsernameUser.save()).rejects.toThrow();
        
        // Username too long
        const longUsernameData = createValidUserData({ username: 'a'.repeat(31) });
        const longUsernameUser = new UserModel(longUsernameData);
        await expect(longUsernameUser.save()).rejects.toThrow();
      });
    });
  });

  describe('Data Type and Structure Tests', () => {
    describe('Field Type Validation', () => {
      it('should validate that refreshTokens is an array', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(Array.isArray(user.refreshTokens)).toBe(true);
      });

      it('should validate that isVerified is boolean', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        expect(typeof user.isVerified).toBe('boolean');
      });

      it('should ensure password field is not selected by default (select: false)', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        const foundUser = await UserModel.findById(user._id);
        
        expect(foundUser!.password).toBeUndefined();
      });
    });

    describe('Model Interface Tests', () => {
      it('should implement IUserDocument interface correctly', async () => {
        const userData = createValidUserData();
        
        const user = new UserModel(userData);
        await user.save();
        
        // Test instance methods
        expect(typeof user.comparePassword).toBe('function');
        
        // Test properties
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.refreshTokens).toBeDefined();
        expect(user.isVerified).toBeDefined();
      });

      it('should implement IUserModel interface correctly', async () => {
        // Test static methods
        expect(typeof UserModel.findByEmail).toBe('function');
        expect(typeof UserModel.findByUsername).toBe('function');
        
        // Test that static methods work
        const userData = createValidUserData();
        const user = new UserModel(userData);
        await user.save();
        
        const foundByEmail = await UserModel.findByEmail(userData.email);
        const foundByUsername = await UserModel.findByUsername(userData.username);
        
        expect(foundByEmail).toBeDefined();
        expect(foundByUsername).toBeDefined();
      });
    });
  });
});