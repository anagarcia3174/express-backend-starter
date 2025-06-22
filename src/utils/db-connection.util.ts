import mongoose from "mongoose";
import AppError, { ErrorCode } from "./app-error.util";
import { logger } from "./logger.util";
import { StatusCodes } from "http-status-codes";
import { z } from 'zod';

const envSchema = z.object({
  MONGO_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

export const connectDB = async (): Promise<void> => {
  const mongoURL = env.MONGO_URL;
  let retries = 0;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoURL, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info("MongoDB connected successfully");
      retries = 0; // Reset retries on success
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection failed (${retries}/${MAX_RETRIES}):`, error);
      if (retries >= MAX_RETRIES) {
        logger.error("Max retries reached. Could not connect to MongoDB.");
        throw new AppError(
          "Failed to connect to MongoDB after multiple attempts",
          StatusCodes.INTERNAL_SERVER_ERROR,
          ErrorCode.DATABASE_ERROR
        );
      }
      logger.info(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(connectWithRetry, RETRY_INTERVAL);
    }
  };

  // Attach event listeners ONCE
  mongoose.connection.on("error", (error: Error) => {
    logger.error("MongoDB connection error:", error);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
    connectWithRetry().catch((error) => {
      logger.error("Failed to reconnect to MongoDB:", error);
      process.exit(1);
    });
  });

  // Initial connection
  await connectWithRetry();
}; 