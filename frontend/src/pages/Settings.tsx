import React from "react";
import { useTheme } from "../context/ThemeContext.js";
import { Settings as SettingsIcon, SunMoon, Lock, Info } from "lucide-react";

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-text-muted" />
          System Settings
        </h2>
        <p className="text-xs text-text-muted mt-1">Configure your local device configurations and platform preferences.</p>
      </div>

      <div className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 space-y-6 shadow-lg transition-colors duration-200">
        
        {/* General Preferences section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-main pb-2 flex items-center gap-2">
            <SunMoon className="w-3.5 h-3.5" />
            General Preferences
          </h3>
          
          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-text-main">System Appearance Theme</p>
              <p className="text-xs text-text-muted mt-0.5">Toggle the platform color scheme layout styling.</p>
            </div>
            <select 
              value={theme}
              onChange={toggleTheme}
              className="bg-bg-panel border border-border-main rounded px-2.5 py-1.5 text-xs text-text-main font-semibold cursor-pointer focus:outline-none focus:border-brand-primary transition-all"
            >
              <option value="light">Light Theme (Default)</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-text-main">Interface Audio Alerts</p>
              <p className="text-xs text-text-muted mt-0.5">Play dynamic sound alerts when complaint parses successfully.</p>
            </div>
            <div className="w-9 h-5 bg-bg-panel border border-border-main rounded-full p-0.5 flex items-center justify-start cursor-pointer transition-colors">
              <div className="w-3.5 h-3.5 bg-text-muted rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Security Preferences section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-main pb-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Account Security
          </h3>

          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-text-main">Password Authentication</p>
              <p className="text-xs text-text-muted mt-0.5">Update or reset your active credentials.</p>
            </div>
            <button 
              type="button" 
              onClick={() => alert("Credentials reset can be completed using the 'Forgot Password' link on the logout/sign-in page.")}
              className="bg-bg-panel border border-border-main hover:border-text-muted px-3 py-1.5 rounded text-xs font-semibold text-text-main hover:text-text-main transition-colors cursor-pointer"
            >
              Reset via Email
            </button>
          </div>
        </div>

        {/* About section */}
        <div className="bg-bg-panel border border-border-main rounded-lg p-4 flex gap-3.5 text-xs text-text-muted">
          <Info className="w-5 h-5 text-text-muted shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-text-main">ABHAY Platform Information</p>
            <p>Version: 1.0.0 (Production Build)</p>
            <p>Compliance: Designed in accordance with standard CrPC §154 regulations regarding electronic registries.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
