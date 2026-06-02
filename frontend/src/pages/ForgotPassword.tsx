import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, Mail, Lock, Key, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { api } from "../lib/axios.js";
import { API_ENDPOINTS } from "../constants/index.js";

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // step 1: enter email to send OTP. step 2: enter OTP and new password.
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    console.log("[ForgotPassword Page] Requesting reset OTP for:", email);

    try {
      const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
      if (response.data?.status === "success") {
        console.log("[ForgotPassword Page] Reset OTP dispatched successfully.");
        setSuccessMsg("Reset verification code has been sent to your email.");
        setStep(2);
      } else {
        setError(response.data?.message || "Failed to initiate password reset.");
      }
    } catch (err: any) {
      console.error("[ForgotPassword Page] Forgot password request error:", err);
      setError(err.message || "No user found with this email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    console.log("[ForgotPassword Page] Resetting password for:", email);

    try {
      const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, { email, otp, newPassword });
      if (response.data?.status === "success") {
        console.log("[ForgotPassword Page] Password reset success!");
        setSuccessMsg("Password reset completed successfully!");
        setTimeout(() => {
          navigate("/login", { state: { email, message: "Password updated successfully. Please login with your new password." } });
        }, 2000);
      } else {
        setError(response.data?.message || "Failed to reset password. Verify the code.");
      }
    } catch (err: any) {
      console.error("[ForgotPassword Page] Password reset submission error:", err);
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 inline-flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-xs text-slate-400">Recover your ABHAY account credentials</p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          /* Step 1 Form */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-950 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        ) : (
          /* Step 2 Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">6-Digit Verification Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 tracking-[0.2em] font-mono focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-950 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
