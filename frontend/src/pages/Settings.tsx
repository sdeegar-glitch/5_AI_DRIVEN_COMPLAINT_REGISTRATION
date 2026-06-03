import React from "react";
import { Settings as SettingsIcon, Moon, Lock, Info } from "lucide-react";

export const Settings: React.FC = () => {
  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-400" />
          System Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Configure your local device configurations and platform preferences.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6 shadow-lg">
        
        {/* General Preferences section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-850 pb-2 flex items-center gap-2">
            <Moon className="w-3.5 h-3.5" />
            General Preferences
          </h3>
          
          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-white">System Appearance Theme</p>
              <p className="text-xs text-slate-500 mt-0.5">Force standard platform color scheme styling.</p>
            </div>
            <select disabled className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-semibold cursor-not-allowed">
              <option>Dark Mode (Default)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-white">Interface Audio Alerts</p>
              <p className="text-xs text-slate-500 mt-0.5">Play dynamic sound alerts when complaint parses successfully.</p>
            </div>
            <div className="w-9 h-5 bg-slate-950 border border-slate-800 rounded-full p-0.5 flex items-center justify-start cursor-pointer transition-colors">
              <div className="w-3.5 h-3.5 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Security Preferences section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-850 pb-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Account Security
          </h3>

          <div className="flex items-center justify-between py-2 text-sm">
            <div>
              <p className="font-semibold text-white">Password Authentication</p>
              <p className="text-xs text-slate-500 mt-0.5">Update or reset your active credentials.</p>
            </div>
            <button 
              type="button" 
              onClick={() => alert("Credentials reset can be completed using the 'Forgot Password' link on the logout/sign-in page.")}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Reset via Email
            </button>
          </div>
        </div>

        {/* About section */}
        <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 flex gap-3.5 text-xs text-slate-400">
          <Info className="w-5 h-5 text-slate-500 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-white">ABHAY Platform Information</p>
            <p>Version: 1.0.0 (Production Build)</p>
            <p>Compliance: Designed in accordance with standard CrPC §154 regulations regarding electronic registries.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
