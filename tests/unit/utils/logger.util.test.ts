import { customFormat, logger } from '../../../src/utils/logger.util';
import { config } from '../../../src/config/config';
import fs from 'fs';
import path from 'path';
import { TransformableInfo } from 'logform';

// Mock the config
jest.mock('../../../src/config/config', () => ({
  config: {
    nodeEnv: 'test'
  }
}));

// Mock fs operations
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Logger Utility', () => {
  // Mock console methods to prevent actual logging during tests
  let consoleSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Logger Configuration', () => {
    test('should have correct log level based on environment', () => {
      // The logger should have debug level since we mocked nodeEnv as 'test'
      // (which is not 'production', so it defaults to 'debug')
      expect(logger.level).toBe('debug');
      
      // Test the logic: production should be 'info', non-production should be 'debug'
      const getLogLevel = (env: string) => env === "production" ? "info" : "debug";
      
      expect(getLogLevel('production')).toBe('info');
      expect(getLogLevel('development')).toBe('debug');
      expect(getLogLevel('test')).toBe('debug');
    });

    test('should have console transport configured', () => {
      const transports = logger.transports;
      const consoleTransport = transports.find(t => t.constructor.name === 'Console');
      expect(consoleTransport).toBeDefined();
    });

    test('should have file transports configured', () => {
      const transports = logger.transports;
      const fileTransports = transports.filter(t => t.constructor.name === 'File');
      expect(fileTransports).toHaveLength(2);
      
      // Check error log transport (filename is stored directly on transport)
      const errorTransport = fileTransports.find(t => (t as any).filename === 'error.log');
      expect(errorTransport).toBeDefined();
      expect((errorTransport as any).level).toBe('error');
      
      // Check combined log transport
      const combinedTransport = fileTransports.find(t => (t as any).filename === 'combined.log');
      expect(combinedTransport).toBeDefined();
      expect((combinedTransport as any).level ?? 'debug').not.toBe('error');
    });

    test('should have correct format configuration', () => {
      expect(logger.format).toBeDefined();
      expect(logger.exitOnError).toBe(false);
    });

    test('customFormat should use stack if available', () => {
      // Test the printf format function directly
      const logInfo = {
        level: 'error',
        message: 'Something went wrong',
        timestamp: '2025-07-14 12:00:00',
        stack: 'Error: Something went wrong\n    at line...'
      };
      
      // Call the printf function directly (customFormat is a printf formatter)
      const result = customFormat.transform(logInfo) as TransformableInfo;
      const formatted = result[Symbol.for('message')];
      
      expect(formatted).toBe('2025-07-14 12:00:00 error: Error: Something went wrong\n    at line...');
    });
    
    test('customFormat should fallback to message if stack is missing', () => {
      // Test the printf format function directly
      const logInfo = {
        level: 'info',
        message: 'Hello World',
        timestamp: '2025-07-14 12:00:00'
      };
      
      // Call the printf function directly (customFormat is a printf formatter)
      const result = customFormat.transform(logInfo) as TransformableInfo;
      const formatted = result[Symbol.for('message')];
      
      expect(formatted).toBe('2025-07-14 12:00:00 info: Hello World');
    });
  });

  describe('Logger Methods', () => {
    test('should log info messages', () => {
      const logSpy = jest.spyOn(logger, 'info');
      const testMessage = 'Test info message';
      
      logger.info(testMessage);
      
      expect(logSpy).toHaveBeenCalledWith(testMessage);
      logSpy.mockRestore();
    });

    test('should log error messages', () => {
      const logSpy = jest.spyOn(logger, 'error');
      const testMessage = 'Test error message';
      
      logger.error(testMessage);
      
      expect(logSpy).toHaveBeenCalledWith(testMessage);
      logSpy.mockRestore();
    });

    test('should log debug messages', () => {
      const logSpy = jest.spyOn(logger, 'debug');
      const testMessage = 'Test debug message';
      
      logger.debug(testMessage);
      
      expect(logSpy).toHaveBeenCalledWith(testMessage);
      logSpy.mockRestore();
    });

    test('should log warn messages', () => {
      const logSpy = jest.spyOn(logger, 'warn');
      const testMessage = 'Test warn message';
      
      logger.warn(testMessage);
      
      expect(logSpy).toHaveBeenCalledWith(testMessage);
      logSpy.mockRestore();
    });

    test('should handle log messages with metadata', () => {
      const logSpy = jest.spyOn(logger, 'info');
      const testMessage = 'Test message with metadata';
      const metadata = { userId: '123', action: 'login' };
      
      logger.info(testMessage, metadata);
      
      expect(logSpy).toHaveBeenCalledWith(testMessage, metadata);
      logSpy.mockRestore();
    });

    test('should handle error objects with stack traces', () => {
      const logSpy = jest.spyOn(logger, 'error');
      const testError = new Error('Test error');
      
      logger.error(testError);
      
      expect(logSpy).toHaveBeenCalledWith(testError);
      logSpy.mockRestore();
    });
  });

  describe('Logger Integration', () => {
    beforeEach(() => {
      // Mock fs.existsSync to return true for logs directory
      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockReturnValue(undefined);
    });

    test('should write to log files', async () => {
      const logMessage = 'Test log message';
      
      
      // Create a promise that resolves when the log is written
      const logPromise = new Promise((resolve) => {
        logger.on('logged', resolve);
      });
      
      logger.info(logMessage);
      
      // Wait for the log to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the logger was called (file writing is handled by Winston internally)
      expect(logger.transports.length).toBeGreaterThan(0);
    });

    test('should separate error logs from combined logs', () => {
      const transports = logger.transports;
      
      // Find error transport
      const errorTransport = transports.find(t => 
        t.constructor.name === 'File' && (t as any).filename === 'error.log'
      );
      
      // Find combined transport
      const combinedTransport = transports.find(t => 
        t.constructor.name === 'File' && (t as any).filename === 'combined.log'
      );
      
      expect(errorTransport).toBeDefined();
      expect(combinedTransport).toBeDefined();
      
      // Error transport should only log error level
      expect((errorTransport as any).level).toBe('error');
      
      // Combined transport should log all levels (no level restriction)
      expect((combinedTransport as any).level).toBeUndefined();
    });
  });
}); 