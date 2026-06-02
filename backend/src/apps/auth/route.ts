import { Router } from "express";
import { authMiddleware } from "../../utils/authMiddleware.js";
import {
  signupController,
  verifyOtpController,
  resendOtpController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  logoutController,
  getMeController
} from "./controllers/auth.js";

console.log("[Auth Routes] Registering auth module routing...");

const router = Router();

router.post("/signup", signupController);
router.post("/verify-otp", verifyOtpController);
router.post("/resend-otp", resendOtpController);
router.post("/login", loginController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, getMeController);

export default router;
