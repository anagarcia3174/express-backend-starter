module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Set the test environment to Node.js
  testEnvironment: 'node',
  
  // Define the root directory for Jest
  rootDir: '.',
  
  // Define where test files are located
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  
  setupFiles: ["<rootDir>/jest.setup.ts"],
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Ignore these patterns when looking for tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/logs/'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude server entry point
    '!src/app.ts' // Exclude app setup
  ],
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds (optional - adjust as needed)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Clear mocks after each test
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Timeout for tests (30 seconds to account for database operations)
  testTimeout: 30000,
}; 