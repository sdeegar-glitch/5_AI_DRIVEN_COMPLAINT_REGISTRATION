import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldAlert, Mail, Key, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { api } from "../lib/axios.js";
import { API_ENDPOINTS } from "../constants/index.js";

export const Verify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialEmail = location.state?.email || "";
  const initialPurpose = location.state?.purpose || "signup";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [purpose] = useState<"signup" | "reset">(initialPurpose);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    console.log(`[Verify Page] Verifying OTP for: ${email}, purpose: ${purpose}`);

    try {
      const response = await api.post(API_ENDPOINTS.VERIFY_OTP, { email, otp, purpose });
      
      if (response.data?.status === "success") {
        console.log("[Verify Page] Verification successful!");
        setSuccessMsg("Verification completed! Redirecting to login page...");
        setTimeout(() => {
          navigate("/login", { state: { email, message: "Email verified successfully! You can now log in." } });
        }, 2000);
      } else {
        setError(response.data?.message || "Verification code is invalid or expired.");
      }
    } catch (err: any) {
      console.error("[Verify Page] Verification failed:", err);
      setError(err.message || "Failed to verify. Please check code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please provide your email address to resend the code.");
      return;
    }
    
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    console.log(`[Verify Page] Requesting OTP resend for: ${email}, purpose: ${purpose}`);

    try {
      const response = await api.post(API_ENDPOINTS.RESEND_OTP, { email, purpose });
      if (response.data?.status === "success") {
        setSuccessMsg("Verification code resent! Please check your email.");
      } else {
        setError(response.data?.message || "Failed to resend code.");
      }
    } catch (err: any) {
      console.error("[Verify Page] Resend request failed:", err);
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-main flex items-center justify-center p-6 font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-bg-surface border border-border-main rounded-xl p-8 shadow-xl space-y-6 transition-colors duration-200">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="bg-brand-accent/10 p-3 rounded-lg border border-brand-accent/20 inline-flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-brand-accent" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Verification Code Required</h2>
          <p className="text-xs text-text-muted">
            {purpose === "signup" 
              ? "Verify your registration to activate account" 
              : "Verify your request to reset password"}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Verify Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!location.state?.email && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-main block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-main block">6-Digit Verification Code</label>
              <button
                type="button"
                disabled={resending || loading}
                onClick={handleResend}
                className="text-xs text-brand-primary font-semibold hover:underline transition-colors cursor-pointer disabled:text-text-muted"
              >
                {resending ? "Resending..." : "Resend Code"}
              </button>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2 text-sm text-text-main tracking-[0.2em] font-mono focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || resending}
            className="w-full bg-brand-primary hover:opacity-90 text-white py-2.5 rounded-lg text-sm font-semibold disabled:bg-bg-panel disabled:text-text-muted transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs text-text-muted hover:text-text-main transition-colors">
            Cancel and Return to Login
          </Link>
        </div>

      </div>
    </div>
  );
};
