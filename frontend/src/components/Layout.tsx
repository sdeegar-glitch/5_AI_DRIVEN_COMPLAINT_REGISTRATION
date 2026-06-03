import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { 
  ShieldAlert, 
  Home as HomeIcon, 
  FileSpreadsheet, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  LogOut, 
  Upload, 
  Search 
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("[Layout] Triggering sign out...");
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/complaints", label: "Complaints", icon: FileSpreadsheet },
    { to: "/profile", label: "Profile", icon: UserIcon },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col space-y-6 p-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ABHAY
                {isAdmin && (
                  <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 rounded font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Helpdesk & FIR Registry</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}

            {/* Admin Dashboard link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`
                }
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </NavLink>
            )}
          </nav>
        </div>

        {/* Footer Profile Limits Chip & Logout */}
        <div className="p-4 border-t border-slate-900 space-y-4">
          {/* Credits chip */}
          {user && (
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[11px] font-bold text-white font-mono truncate">{user.email}</p>
              </div>
              
              {/* Uploads limits bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Upload className="w-3 h-3 text-slate-500" />
                    Uploads
                  </span>
                  <span>{user.uploadsUsed} / {user.uploadLimit}</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className={`h-full rounded-full transition-all ${user.uploadsUsed >= user.uploadLimit ? "bg-red-500" : "bg-white"}`}
                    style={{ width: `${Math.min(100, (user.uploadsUsed / user.uploadLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Searches limits bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Search className="w-3 h-3 text-slate-500" />
                    AI Searches
                  </span>
                  <span>{user.searchesUsed} / {user.searchLimit}</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className={`h-full rounded-full transition-all ${user.searchesUsed >= user.searchLimit ? "bg-red-500" : "bg-white"}`}
                    style={{ width: `${Math.min(100, (user.searchesUsed / user.searchLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-all cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-slate-950 flex flex-col">
        {children}
      </main>
    </div>
  );
};
