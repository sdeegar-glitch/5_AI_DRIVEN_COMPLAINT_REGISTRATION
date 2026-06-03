import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useTheme } from "../context/ThemeContext.js";
import { 
  ShieldAlert, 
  Home as HomeIcon, 
  FileSpreadsheet, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  LogOut, 
  Upload, 
  Search,
  Sun,
  Moon
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex min-h-screen bg-bg-base text-text-main font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border-main bg-bg-surface flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40 transition-colors duration-200">
        <div className="flex flex-col space-y-6 p-6">
          {/* Logo Brand and Theme Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-brand-accent" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight text-text-main flex items-center gap-1.5">
                  ABHAY
                  {isAdmin && (
                    <span className="text-[8px] bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-1 rounded font-mono font-bold">
                      ADMIN
                    </span>
                  )}
                </h1>
                <p className="text-[9px] text-text-muted leading-none mt-0.5 truncate">Helpdesk & FIR Registry</p>
              </div>
            </div>

            {/* Dark/Light Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-border-main bg-bg-panel hover:bg-bg-base text-text-muted hover:text-text-main transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-text-main" />
              ) : (
                <Sun className="w-4 h-4 text-brand-accent" />
              )}
            </button>
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
                        ? "bg-brand-primary text-white shadow-sm"
                        : "text-text-muted hover:text-text-main hover:bg-bg-panel"
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
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-text-muted hover:text-text-main hover:bg-bg-panel"
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
        <div className="p-4 border-t border-border-main space-y-4">
          {/* Credits chip */}
          {user && (
            <div className="bg-bg-panel/60 border border-border-main rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-border-main pb-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[11px] font-bold text-text-main font-mono truncate">{user.email}</p>
              </div>
              
              {/* Uploads limits bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Upload className="w-3 h-3 text-text-muted" />
                    Uploads
                  </span>
                  <span>{user.uploadsUsed} / {user.uploadLimit}</span>
                </div>
                <div className="h-1 bg-bg-base rounded-full overflow-hidden border border-border-main">
                  <div 
                    className={`h-full rounded-full transition-all ${user.uploadsUsed >= user.uploadLimit ? "bg-brand-accent" : "bg-brand-primary"}`}
                    style={{ width: `${Math.min(100, (user.uploadsUsed / user.uploadLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Searches limits bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-text-muted font-semibold font-mono">
                  <span className="flex items-center gap-1">
                    <Search className="w-3 h-3 text-text-muted" />
                    AI Searches
                  </span>
                  <span>{user.searchesUsed} / {user.searchLimit}</span>
                </div>
                <div className="h-1 bg-bg-base rounded-full overflow-hidden border border-border-main">
                  <div 
                    className={`h-full rounded-full transition-all ${user.searchesUsed >= user.searchLimit ? "bg-brand-accent" : "bg-brand-primary"}`}
                    style={{ width: `${Math.min(100, (user.searchesUsed / user.searchLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-text-muted hover:text-brand-accent hover:bg-bg-panel transition-all cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-bg-base flex flex-col transition-colors duration-200">
        {children}
      </main>
    </div>
  );
};
