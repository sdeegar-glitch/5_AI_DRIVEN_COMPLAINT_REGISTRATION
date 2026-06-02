import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

interface PrivateRouteProps {
  allowedRoles?: Array<"USER" | "ADMIN">;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[PrivateRoute] User unauthorized, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`[PrivateRoute] User role '${user.role}' not permitted, redirecting to home`);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
