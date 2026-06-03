import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { User, Mail, Shield, CheckCircle, Info } from "lucide-react";

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
          <User className="w-5 h-5 text-text-muted" />
          Account Profile
        </h2>
        <p className="text-xs text-text-muted mt-1">Manage and view your user status and system quotas.</p>
      </div>

      <div className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 space-y-6 shadow-lg transition-colors duration-200">
        
        {/* User Card info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-main pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-bg-panel border border-border-main flex items-center justify-center font-mono text-lg font-bold text-text-main uppercase">
              {user?.name.slice(0, 2) || "US"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">{user?.name}</h3>
              <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
            </div>
          </div>
          
          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
            user?.role === "ADMIN" 
              ? "bg-brand-accent/10 text-brand-accent border-brand-accent/20" 
              : "bg-bg-panel text-text-muted border-border-main"
          }`}>
            Role: {user?.role}
          </span>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Personal Information</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5">
                  <span className="text-text-muted">Full Name</span>
                  <span className="text-text-main font-semibold">{user?.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5">
                  <span className="text-text-muted">Email Address</span>
                  <span className="text-text-main font-semibold">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5">
                  <span className="text-text-muted">Role Status</span>
                  <span className="text-text-main font-semibold font-mono capitalize">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5">
                  <span className="text-text-muted">Account Verified</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{user?.verified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">System Usage & Quotas</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Info className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5 font-mono">
                  <span className="text-text-muted">Uploads Limit</span>
                  <span className="text-text-main font-bold">{user?.uploadsUsed} / {user?.uploadLimit}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Info className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex-1 flex justify-between border-b border-border-main pb-1.5 font-mono">
                  <span className="text-text-muted">AI Searches Limit</span>
                  <span className="text-text-main font-bold">{user?.searchesUsed} / {user?.searchLimit}</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-panel border border-border-main rounded-lg p-4 text-[11px] text-text-muted space-y-1">
              <p className="font-semibold text-text-main">Need higher limits?</p>
              <p>Your limits are lifetime limits set by the system base configuration. If you require further uploads or AI searches, please request an administrator to raise your limits.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
