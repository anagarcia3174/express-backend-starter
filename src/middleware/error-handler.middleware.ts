import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import AppError from "../utils/app-error.util";
import { logger } from "../utils/logger.util";
import { ApiResponse } from "../types/api.types";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    // Log expected errors at info level with context
    logger.info(`Expected error occurred: ${err.message}`, {
      errorCode: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.userId
    });

    const response: ApiResponse = {
      status: "error",
      error: {
        message: err.message,
        code: err.code,
      },
    };

    res.status(err.statusCode).json(response);
  }

  // Log unexpected errors at error level with full context
  logger.error(`Unexpected error occurred: ${err.message}`, {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    body: req.body,
    query: req.query,
    params: req.params
  });

  const response: ApiResponse = {
    status: "error",
    error: {
      message: "Internal server error",
      code: "server-error",
    },
  };

  res.status(500).json(response);
};
