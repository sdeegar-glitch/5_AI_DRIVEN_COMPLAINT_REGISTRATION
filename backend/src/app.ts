import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRouter from "./apps/auth/route.js";
import complaintsRouter from "./apps/complaints/route.js";

console.log("[app.ts] [ENTRY] Bootstrapping backend server application...");

const app = express();

// Hardcoded CORS origins allowed
const ALLOWED_ORIGINS = [
  "http://localhost:6001",
  "http://127.0.0.1:6001",
];

// Mount HTTP Request Logger (Morgan)
app.use(morgan("dev"));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked request from origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Base envelope format helper middlewares
app.use((req, res, next) => {
  res.success = (data: any, message = "Success") => {
    res.json({ status: "success", message, data });
  };
  res.fail = (message: string, error?: any, statusCode = 400) => {
    res.status(statusCode).json({ status: "fail", message, error });
  };
  next();
});

// Mount Domain Route Modules
app.use("/api/auth", authRouter);
app.use("/api/complaints", complaintsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.success({ uptime: process.uptime() }, "Backend is healthy and running!");
});

// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 [Global Error Handler] Caught unhandled exception:", err);
  
  const status = err.status || 500;
  const message = err.message || "An internal server error occurred.";
  
  res.status(status).json({
    status: "fail",
    message,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
  });
});

app.listen(env.PORT, () => {
  console.log(`🚀 ABHAY Backend running on port ${env.PORT}`);
});

export default app;
