import mongoose from "mongoose";
import { logger } from "./utils/logger.util";
import app from "./app";
import { config } from "./config/config";
import { Server } from "http";
import { mongoConfig } from "./config/mongo.config";

let server: Server;

mongoose.connect(mongoConfig.url).then(() => {
  logger.info("Conected to MongoDB");
  server = app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
  })
})

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});