import express from "express";
import { config } from "./config/config";
import { connectDB } from "./utils/db-connection.util";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.middleware";
import authRoutes from "./routes/auth.route";
import emailRoutes from "./routes/email.route";
import passwordRoutes from "./routes/password.route";
import tokenRoutes from "./routes/token.route";
import cookieParser from "cookie-parser";
import path from "path";
import { logger } from "./utils/logger.util";

connectDB();

const app = express();
const port = config.port || 3000;


app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));


// Other Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  cors({
    credentials: true,
    origin: config.clientUrl || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/token", tokenRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
