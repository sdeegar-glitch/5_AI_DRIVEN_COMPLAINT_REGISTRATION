import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db } from "../../../db/db.js";
import { users, otps } from "../../../db/schema/schema.js";
import { sendOtpEmail } from "../../../utils/email.js";
import { env } from "../../../config/env.js";
import { 
  SignupInput, 
  VerifyOtpInput, 
  ResendOtpInput, 
  LoginInput, 
  ForgotPasswordInput, 
  ResetPasswordInput 
} from "../dtos/auth.js";

// Helper to generate a 6-digit random code
function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signupService(input: SignupInput): Promise<{ userId: number; email: string }> {
  console.log(`[signupService] [ENTRY] input email: ${input.email}`);
  
  try {
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existingUser) {
      console.log(`[signupService] [EXIT] User already exists: ${input.email}`);
      throw new Error("A user with this email address already exists.");
    }

    // Hash the password with bcrypt (cost 12)
    console.log(`[signupService] Hashing password for user...`);
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Insert user as unverified
    const [newUser] = await db.insert(users).values({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "USER",
      verified: false,
    }).returning({ id: users.id, email: users.email });

    console.log(`[signupService] Created user record (unverified) with ID: ${newUser.id}`);

    // Generate 6-digit OTP
    const otp = generate6DigitOtp();
    console.log(`[signupService] Generated OTP for user: ${newUser.id}`);
    
    // Hash the OTP with bcrypt (cost 12)
    const otpHash = await bcrypt.hash(otp, 12);
    
    // Set 5 minutes expiration TTL
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store in DB
    await db.insert(otps).values({
      userId: newUser.id,
      otpHash,
      purpose: "signup",
      expiresAt,
    });
    console.log(`[signupService] Stored OTP in database.`);

    // Send verification email via Resend
    await sendOtpEmail(newUser.email, otp, "signup");

    console.log(`[signupService] [EXIT] Successful signup flow completed for user: ${newUser.email}`);
    return { userId: newUser.id, email: newUser.email };
  } catch (error) {
    console.error(`[signupService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}

export async function verifyOtpService(input: VerifyOtpInput): Promise<void> {
  console.log(`[verifyOtpService] [ENTRY] email: ${input.email}, purpose: ${input.purpose}`);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      console.log(`[verifyOtpService] [EXIT] User not found: ${input.email}`);
      throw new Error("No user registered with this email address.");
    }

    // Fetch active OTPs for this user and purpose
    const activeOtps = await db.select().from(otps).where(
      and(
        eq(otps.userId, user.id),
        eq(otps.purpose, input.purpose)
      )
    );

    console.log(`[verifyOtpService] Found ${activeOtps.length} active OTP record(s) for user ID: ${user.id}`);

    let validOtpFound = false;
    const now = new Date();

    for (const record of activeOtps) {
      // Check expiration
      if (record.expiresAt < now) {
        continue;
      }

      // Verify bcrypt hash
      const isMatch = await bcrypt.compare(input.otp, record.otpHash);
      if (isMatch) {
        validOtpFound = true;
        break;
      }
    }

    if (!validOtpFound) {
      console.log(`[verifyOtpService] [EXIT] Invalid or expired OTP code for ${input.email}`);
      throw new Error("Invalid or expired verification code.");
    }

    // If verified, delete OTPs
    await db.delete(otps).where(eq(otps.userId, user.id));
    console.log(`[verifyOtpService] Deleted active OTP records for user ID: ${user.id}`);

    if (input.purpose === "signup") {
      // Flip user verification flag
      await db.update(users).set({ verified: true }).where(eq(users.id, user.id));
      console.log(`[verifyOtpService] User ${user.email} marked as verified.`);
    }

    console.log(`[verifyOtpService] [EXIT] OTP verification successful.`);
  } catch (error) {
    console.error(`[verifyOtpService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}

export async function resendOtpService(input: ResendOtpInput): Promise<void> {
  console.log(`[resendOtpService] [ENTRY] email: ${input.email}, purpose: ${input.purpose}`);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      console.log(`[resendOtpService] [EXIT] User not found: ${input.email}`);
      throw new Error("No user registered with this email address.");
    }

    if (user.verified && input.purpose === "signup") {
      console.log(`[resendOtpService] [EXIT] User is already verified: ${input.email}`);
      throw new Error("Account is already verified. Please login.");
    }

    // Delete existing active OTPs for the user and purpose
    await db.delete(otps).where(
      and(
        eq(otps.userId, user.id),
        eq(otps.purpose, input.purpose)
      )
    );
    console.log(`[resendOtpService] Cleared previous OTP records.`);

    // Generate fresh OTP
    const otp = generate6DigitOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save fresh OTP
    await db.insert(otps).values({
      userId: user.id,
      otpHash,
      purpose: input.purpose,
      expiresAt,
    });
    console.log(`[resendOtpService] Generated & stored new OTP in DB.`);

    // Send email
    await sendOtpEmail(user.email, otp, input.purpose);

    console.log(`[resendOtpService] [EXIT] OTP successfully resent.`);
  } catch (error) {
    console.error(`[resendOtpService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}

export async function loginService(input: LoginInput): Promise<{ token: string; user: { id: number; name: string; email: string; role: "USER" | "ADMIN"; verified: boolean } }> {
  console.log(`[loginService] [ENTRY] email: ${input.email}`);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      console.log(`[loginService] [EXIT] Invalid credentials (user not found): ${input.email}`);
      throw new Error("Invalid email or password.");
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      console.log(`[loginService] [EXIT] Invalid credentials (incorrect password): ${input.email}`);
      throw new Error("Invalid email or password.");
    }

    // Check if verified
    if (!user.verified) {
      console.log(`[loginService] [EXIT] Blocked login: user account is unverified: ${input.email}`);
      throw new Error("Your account is unverified. Please verify your email before logging in.");
    }

    // Generate JWT token (1-day expiration)
    console.log(`[loginService] Generating 1-day JWT token...`);
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`[loginService] [EXIT] Successful login for user: ${user.email}`);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
      }
    };
  } catch (error) {
    console.error(`[loginService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}

export async function forgotPasswordService(input: ForgotPasswordInput): Promise<void> {
  console.log(`[forgotPasswordService] [ENTRY] email: ${input.email}`);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      console.log(`[forgotPasswordService] [EXIT] User not found: ${input.email}`);
      // Security best practice: Don't reveal to potential attackers whether a user exists.
      // But according to prompt.md: "Forgot-password via OTP (same flow, purpose reset)"
      // and "Forgot password: user not found -> throw error". Let's throw the error.
      throw new Error("No user registered with this email address.");
    }

    // Clear previous reset OTPs
    await db.delete(otps).where(
      and(
        eq(otps.userId, user.id),
        eq(otps.purpose, "reset")
      )
    );
    console.log(`[forgotPasswordService] Cleared previous reset OTPs.`);

    // Generate reset OTP
    const otp = generate6DigitOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save in DB
    await db.insert(otps).values({
      userId: user.id,
      otpHash,
      purpose: "reset",
      expiresAt,
    });
    console.log(`[forgotPasswordService] Saved reset OTP in DB.`);

    // Send email
    await sendOtpEmail(user.email, otp, "reset");

    console.log(`[forgotPasswordService] [EXIT] Reset OTP successfully dispatched.`);
  } catch (error) {
    console.error(`[forgotPasswordService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}

export async function resetPasswordService(input: ResetPasswordInput): Promise<void> {
  console.log(`[resetPasswordService] [ENTRY] email: ${input.email}`);

  try {
    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user) {
      console.log(`[resetPasswordService] [EXIT] User not found: ${input.email}`);
      throw new Error("No user registered with this email address.");
    }

    // Fetch reset OTP records
    const activeOtps = await db.select().from(otps).where(
      and(
        eq(otps.userId, user.id),
        eq(otps.purpose, "reset")
      )
    );

    let validOtpFound = false;
    const now = new Date();

    for (const record of activeOtps) {
      if (record.expiresAt < now) {
        continue;
      }
      const isMatch = await bcrypt.compare(input.otp, record.otpHash);
      if (isMatch) {
        validOtpFound = true;
        break;
      }
    }

    if (!validOtpFound) {
      console.log(`[resetPasswordService] [EXIT] Invalid or expired reset OTP code for ${input.email}`);
      throw new Error("Invalid or expired verification code.");
    }

    // Hash the new password (cost 12)
    console.log(`[resetPasswordService] Hashing new password...`);
    const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

    // Update user password and mark verified (forgot password OTP verification should imply verified)
    await db.update(users).set({ 
      passwordHash: newPasswordHash,
      verified: true // In case they reset password before verifying signup
    }).where(eq(users.id, user.id));
    console.log(`[resetPasswordService] Updated user password in DB.`);

    // Clean up OTPs
    await db.delete(otps).where(eq(otps.userId, user.id));
    console.log(`[resetPasswordService] Cleared OTP records.`);

    console.log(`[resetPasswordService] [EXIT] Password reset successfully finished.`);
  } catch (error) {
    console.error(`[resetPasswordService] [ERROR] Exception thrown:`, error);
    throw error;
  }
}
