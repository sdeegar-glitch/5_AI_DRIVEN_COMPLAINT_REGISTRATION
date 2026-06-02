import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const VerifyOtpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  purpose: z.enum(["signup", "reset"]),
});

export const ResendOtpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  purpose: z.enum(["signup", "reset"]),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
});

export const ResetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
