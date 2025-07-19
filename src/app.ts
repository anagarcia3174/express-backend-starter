import express from "express";
import { appConfig } from "./config";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.middleware";
import authRoutes from "./routes/auth.route";
import accountRoutes from "./routes/account.route";
import cookieParser from "cookie-parser";
import path from "path";
import AppError, { ErrorCode } from "./utils/app-error.util";
import { StatusCodes } from "http-status-codes";



const app = express();
const port = appConfig.port || 3000;


app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));


// Other Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  cors({
    credentials: true,
    origin: appConfig.clientUrl || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);


app.use((req, res, next) => {
  next(new AppError(
    "This route is not found",
    StatusCodes.NOT_FOUND,
    ErrorCode.NOT_FOUND
  ))
});

// Error handling
app.use(errorHandler);

export default app;