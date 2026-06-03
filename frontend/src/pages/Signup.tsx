import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, User, Mail, Lock, AlertCircle, Loader } from "lucide-react";
import { api } from "../lib/axios.js";
import { API_ENDPOINTS } from "../constants/index.js";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    console.log("[Signup Page] Submitting signup form for:", email);

    try {
      const response = await api.post(API_ENDPOINTS.SIGNUP, { name, email, password });
      
      if (response.data?.status === "success") {
        console.log("[Signup Page] Signup successful, navigating to verify OTP...");
        navigate("/verify", { state: { email } });
      } else {
        setError(response.data?.message || "Failed to register account.");
      }
    } catch (err: any) {
      console.error("[Signup Page] Signup request failed:", err);
      
      let displayError = err.message || "An unexpected error occurred during registration.";
      if (err.error) {
        const fieldErrors: string[] = [];
        Object.entries(err.error).forEach(([field, details]: [string, any]) => {
          if (details && typeof details === "object" && "_errors" in details) {
            const errors = (details as any)._errors;
            if (Array.isArray(errors) && errors.length > 0) {
              fieldErrors.push(`${field}: ${errors.join(", ")}`);
            }
          }
        });
        if (fieldErrors.length > 0) {
          displayError = `Validation failed - ${fieldErrors.join("; ")}`;
        }
      }
      setError(displayError);
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold tracking-tight text-text-main">Create your ABHAY Account</h2>
          <p className="text-xs text-text-muted">AI-Based Helpdesk for Assistance & Your Complaints</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent p-3 rounded-lg flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-main block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:opacity-90 text-white py-2.5 rounded-lg text-sm font-semibold disabled:bg-bg-panel disabled:text-text-muted transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Registering account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Redirection link */}
        <div className="text-center pt-2">
          <p className="text-xs text-text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
