import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[authMiddleware] [ENTRY] Request URL: ${req.originalUrl}`);

  try {
    const token = req.cookies?.authorization;

    if (!token) {
      console.log(`[authMiddleware] [EXIT] No authorization cookie found.`);
      return res.fail("Authentication required. Please login.", null, 401);
    }

    console.log(`[authMiddleware] Verifying JWT token...`);
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number; role: "USER" | "ADMIN" };
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    console.log(`[authMiddleware] [EXIT] Authentication successful for userId: ${decoded.userId}, role: ${decoded.role}`);
    next();
  } catch (error: any) {
    console.error(`[authMiddleware] [ERROR] JWT verification failed:`, error.message);
    return res.fail("Invalid or expired session. Please login again.", error.message, 401);
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[adminMiddleware] [ENTRY] Checking admin privileges for userId: ${req.user?.userId}`);

  if (!req.user || req.user.role !== "ADMIN") {
    console.log(`[adminMiddleware] [EXIT] Access denied: non-admin account.`);
    return res.fail("Access denied. Administrator privileges required.", null, 403);
  }

  console.log(`[adminMiddleware] [EXIT] Access granted.`);
  next();
}
