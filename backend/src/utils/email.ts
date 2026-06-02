import { Resend } from "resend";
import { env } from "../config/env.js";

console.log("[Email Util] [ENTRY] Initializing Resend client...");
const resend = new Resend(env.RESEND_API_KEY);
console.log("[Email Util] [EXIT] Resend client initialized.");

/**
 * Sends a 6-digit OTP to the user's email address.
 * 
 * @param email Recipient email address
 * @param otp The 6-digit verification code
 * @param purpose The purpose of the OTP ('signup' or 'reset')
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: "signup" | "reset"
): Promise<void> {
  const subject = purpose === "signup" 
    ? "Verify Your ABHAY Account" 
    : "Reset Your ABHAY Password";
    
  const bodyText = purpose === "signup"
    ? `Welcome to ABHAY! Your account verification code is: ${otp}. This code is valid for 5 minutes.`
    : `You requested a password reset for your ABHAY account. Your verification code is: ${otp}. This code is valid for 5 minutes.`;

  const htmlContent = purpose === "signup"
    ? `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
        <h2 style="color: #111827; margin-bottom: 16px;">Verify Your ABHAY Account</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">Thank you for registering on <strong>ABHAY</strong> (AI-Based Helpdesk for Assistance & Your Complaints). Please use the verification code below to activate your account:</p>
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">Note: This verification code is valid for <strong>5 minutes</strong>. If you did not sign up for this account, please ignore this email.</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
        <h2 style="color: #111827; margin-bottom: 16px;">Reset Your ABHAY Password</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">We received a request to reset your password for your <strong>ABHAY</strong> account. Please use the verification code below to authorize this request:</p>
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">Note: This verification code is valid for <strong>5 minutes</strong>. If you did not request a password reset, please secure your account.</p>
      </div>
    `;

  console.log(`[Email Util] [ENTRY] Sending ${purpose} email to: ${email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [email],
      subject,
      text: bodyText,
      html: htmlContent,
    });

    if (error) {
      console.error(`[Email Util] [ERROR] Failed to send email via Resend API:`, error);
      throw new Error(`Resend API Error: ${error.message}`);
    }

    console.log(`[Email Util] [EXIT] Email successfully sent to ${email}. ID: ${data?.id}`);
  } catch (error) {
    console.error(`[Email Util] [ERROR] Exception caught in sendOtpEmail for ${email}:`, error);
    throw error;
  }
}
