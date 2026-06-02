import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { ShieldAlert, Mail, Lock, AlertCircle, CheckCircle2, Loader, ArrowRight } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const initialEmail = location.state?.email || "";
  const initialMessage = location.state?.message || null;

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    console.log("[Login Page] Logging in user:", email);

    try {
      await login(email, password);
      console.log("[Login Page] Login success, navigating to dashboard...");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("[Login Page] Login error catch:", err);
      // Retrieve the message from the thrown fail envelope
      const message = err.message || "Invalid email or password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isUnverifiedError = error?.toLowerCase().includes("unverified");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 inline-flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to ABHAY</h2>
          <p className="text-xs text-slate-400">AI-Based Helpdesk for Assistance & Your Complaints</p>
        </div>

        {/* Info Alert (e.g. redirected from verify with success) */}
        {infoMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex flex-col gap-2 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {isUnverifiedError && (
              <button
                type="button"
                onClick={() => navigate("/verify", { state: { email, purpose: "signup" } })}
                className="text-left font-bold text-white hover:underline flex items-center gap-1 mt-1 cursor-pointer pl-6.5"
              >
                Go to Verification Page
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Password</label>
              <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Signup Redirect */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-slate-300 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
