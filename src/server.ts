import mongoose from "mongoose";
import { logger } from "./utils/logger.util";
import app from "./app";
import { appConfig, mongoConfig } from "./config";
import { Server } from "http";

let server: Server;

mongoose.connect(mongoConfig.url).then(() => {
  logger.info("Conected to MongoDB");
  server = app.listen(appConfig.port, () => {
    logger.info(`Server is running on port ${appConfig.port}`);
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