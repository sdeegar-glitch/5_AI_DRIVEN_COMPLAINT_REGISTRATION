import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { User, Mail, Shield, CheckCircle, Info } from "lucide-react";

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-slate-400" />
          Account Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage and view your user status and system quotas.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6 shadow-lg">
        
        {/* User Card info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-lg font-bold text-white uppercase">
              {user?.name.slice(0, 2) || "US"}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>
          
          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
            user?.role === "ADMIN" 
              ? "bg-red-500/10 text-red-500 border-red-500/20" 
              : "bg-slate-950 text-slate-400 border-slate-800"
          }`}>
            Role: {user?.role}
          </span>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-400">Full Name</span>
                  <span className="text-white font-semibold">{user?.name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-400">Email Address</span>
                  <span className="text-white font-semibold">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-400">Role Status</span>
                  <span className="text-white font-semibold font-mono capitalize">{user?.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-400">Account Verified</span>
                  <span className="text-emerald-400 font-semibold">{user?.verified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Usage & Quotas</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5 font-mono">
                  <span className="text-slate-400">Uploads Limit</span>
                  <span className="text-white font-bold">{user?.uploadsUsed} / {user?.uploadLimit}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 flex justify-between border-b border-slate-850 pb-1.5 font-mono">
                  <span className="text-slate-400">AI Searches Limit</span>
                  <span className="text-white font-bold">{user?.searchesUsed} / {user?.searchLimit}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-white">Need higher limits?</p>
              <p>Your limits are lifetime limits set by the system base configuration. If you require further uploads or AI searches, please request an administrator to raise your limits.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
