import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../../db/db.js";
import { users } from "../../../db/schema/schema.js";
import { 
  SignupSchema, 
  VerifyOtpSchema, 
  ResendOtpSchema, 
  LoginSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema 
} from "../dtos/auth.js";
import { 
  signupService, 
  verifyOtpService, 
  resendOtpService, 
  loginService, 
  forgotPasswordService, 
  resetPasswordService 
} from "../services/auth.js";

// Helper to log controller errors
function logAndSendError(res: Response, functionName: string, error: any, defaultMessage: string, statusCode = 400) {
  console.error(`[authController] [${functionName}] [ERROR]`, error);
  const message = error instanceof Error ? error.message : defaultMessage;
  return res.fail(message, error, statusCode);
}

export async function signupController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [signupController] [ENTRY] body:`, { ...req.body, password: "[REDACTED]" });

  try {
    const parsedInput = SignupSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [signupController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    const result = await signupService(parsedInput.data);
    
    console.log(`[authController] [signupController] [EXIT] Signup success for: ${result.email}`);
    return res.success(result, "Registration successful! Verification code sent to your email.");
  } catch (error) {
    return logAndSendError(res, "signupController", error, "Failed to register user");
  }
}

export async function verifyOtpController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [verifyOtpController] [ENTRY] body:`, req.body);

  try {
    const parsedInput = VerifyOtpSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [verifyOtpController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    await verifyOtpService(parsedInput.data);

    console.log(`[authController] [verifyOtpController] [EXIT] OTP verified successfully for: ${parsedInput.data.email}`);
    return res.success(null, "Code verified successfully!");
  } catch (error) {
    return logAndSendError(res, "verifyOtpController", error, "Verification failed");
  }
}

export async function resendOtpController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [resendOtpController] [ENTRY] body:`, req.body);

  try {
    const parsedInput = ResendOtpSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [resendOtpController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    await resendOtpService(parsedInput.data);

    console.log(`[authController] [resendOtpController] [EXIT] OTP resent successfully for: ${parsedInput.data.email}`);
    return res.success(null, "Verification code resent successfully!");
  } catch (error) {
    return logAndSendError(res, "resendOtpController", error, "Failed to resend verification code");
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [loginController] [ENTRY] body:`, { ...req.body, password: "[REDACTED]" });

  try {
    const parsedInput = LoginSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [loginController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    const { token, user } = await loginService(parsedInput.data);

    // Set authorization cookie
    // httpOnly: true, secure: true, sameSite: 'none'
    res.cookie("authorization", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    console.log(`[authController] [loginController] [EXIT] Login cookie set for user: ${user.email}`);
    return res.success({ user }, "Logged in successfully!");
  } catch (error) {
    return logAndSendError(res, "loginController", error, "Login failed", 401);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [forgotPasswordController] [ENTRY] body:`, req.body);

  try {
    const parsedInput = ForgotPasswordSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [forgotPasswordController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    await forgotPasswordService(parsedInput.data);

    console.log(`[authController] [forgotPasswordController] [EXIT] Forgot password OTP dispatched for: ${parsedInput.data.email}`);
    return res.success(null, "Verification code sent to your email.");
  } catch (error) {
    return logAndSendError(res, "forgotPasswordController", error, "Failed to send reset code");
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [resetPasswordController] [ENTRY] body:`, { ...req.body, newPassword: "[REDACTED]" });

  try {
    const parsedInput = ResetPasswordSchema.safeParse(req.body);
    if (!parsedInput.success) {
      console.log(`[authController] [resetPasswordController] [EXIT] Zod validation failed.`);
      return res.fail("Validation failed", parsedInput.error.format(), 400);
    }

    await resetPasswordService(parsedInput.data);

    console.log(`[authController] [resetPasswordController] [EXIT] Password updated for: ${parsedInput.data.email}`);
    return res.success(null, "Password reset successfully! You can now log in.");
  } catch (error) {
    return logAndSendError(res, "resetPasswordController", error, "Failed to reset password");
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [logoutController] [ENTRY]`);

  try {
    res.clearCookie("authorization", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    console.log(`[authController] [logoutController] [EXIT] Authorization cookie cleared.`);
    return res.success(null, "Logged out successfully.");
  } catch (error) {
    return logAndSendError(res, "logoutController", error, "Logout failed");
  }
}

export async function getMeController(req: Request, res: Response, next: NextFunction) {
  console.log(`[authController] [getMeController] [ENTRY] userId: ${req.user?.userId}`);

  try {
    if (!req.user) {
      console.log(`[authController] [getMeController] [EXIT] No authenticated user metadata found.`);
      return res.fail("Unauthorized", null, 401);
    }

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      verified: users.verified,
      uploadLimit: users.uploadLimit,
      searchLimit: users.searchLimit,
      uploadsUsed: users.uploadsUsed,
      searchesUsed: users.searchesUsed,
    })
    .from(users)
    .where(eq(users.id, req.user.userId))
    .limit(1);

    if (!user) {
      console.log(`[authController] [getMeController] [EXIT] User record not found in DB.`);
      return res.fail("User session invalid", null, 401);
    }

    console.log(`[authController] [getMeController] [EXIT] Returned details for user: ${user.email}`);
    return res.success({ user });
  } catch (error) {
    return logAndSendError(res, "getMeController", error, "Failed to fetch user session info", 500);
  }
}
