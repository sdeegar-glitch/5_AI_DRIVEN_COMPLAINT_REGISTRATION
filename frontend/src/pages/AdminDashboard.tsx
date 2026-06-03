import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../lib/axios.js";
import { 
  ShieldCheck, 
  Search, 
  User as UserIcon, 
  Edit3, 
  Upload, 
  Search as SearchIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Loader,
  X
} from "lucide-react";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  verified: boolean;
  uploadLimit: number;
  searchLimit: number;
  uploadsUsed: number;
  searchesUsed: number;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal / panel states
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newUploadLimit, setNewUploadLimit] = useState(5);
  const [newSearchLimit, setNewSearchLimit] = useState(10);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Load all users / search
  const fetchUsers = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      console.log("[AdminDashboard] Fetching user records list, query:", query);
      const response = await api.get("/api/admin/users", {
        params: {
          q: query.trim() || undefined
        }
      });
      if (response.data?.status === "success") {
        setUsers(response.data.data.users || []);
      }
    } catch (err: any) {
      console.error("[AdminDashboard] Failed to retrieve users list:", err);
      setError(err.message || "Failed to load registered user details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setNewUploadLimit(user.uploadLimit);
    setNewSearchLimit(user.searchLimit);
    setError(null);
    setSuccess(null);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`[AdminDashboard] Updating limits for user ID: ${editingUser.id}`);
      const response = await api.put(`/api/admin/users/${editingUser.id}/limits`, {
        uploadLimit: newUploadLimit,
        searchLimit: newSearchLimit,
      });

      if (response.data?.status === "success") {
        setSuccess(`Successfully updated limits for ${editingUser.name}.`);
        
        // Update user record in list locally
        const updatedUser = response.data.data;
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...updatedUser } : u)));

        // If the admin updated their own limits, refresh their Auth session
        if (editingUser.id === currentUser?.id) {
          refreshUser();
        }

        // Close form panel
        setEditingUser(null);
      }
    } catch (err: any) {
      console.error("[AdminDashboard] Failed to update user limits:", err);
      setError(err.message || "Failed to adjust user limits.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-6 max-w-7xl w-full mx-auto relative">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            Admin Operations Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit platform accounts and adjust lifetime credit limits.</p>
        </div>
      </div>

      {/* Banner Notifications */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* User Search Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Look up registered users by name or email address..."
              className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Search Users"}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading && users.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading user directories...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <UserIcon className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No user accounts found</p>
            <p className="text-xs text-slate-500">No users match your query parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Verified</th>
                  <th className="py-3.5 px-4">Image Uploads Quota</th>
                  <th className="py-3.5 px-4">AI Searches Quota</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-850/30 transition-colors text-sm text-slate-200"
                  >
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1 py-0.2 rounded font-mono font-normal">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        u.role === "ADMIN" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-semibold ${u.verified ? "text-emerald-400" : "text-amber-400"}`}>
                        {u.verified ? "Verified" : "Pending OTP"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 max-w-[120px]">
                        <div className="flex items-center justify-between text-xs font-semibold font-mono">
                          <span>{u.uploadsUsed} / {u.uploadLimit}</span>
                          <span className="text-slate-500">used</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full ${u.uploadsUsed >= u.uploadLimit ? "bg-red-500" : "bg-white"}`}
                            style={{ width: `${Math.min(100, (u.uploadsUsed / u.uploadLimit) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5 max-w-[120px]">
                        <div className="flex items-center justify-between text-xs font-semibold font-mono">
                          <span>{u.searchesUsed} / {u.searchLimit}</span>
                          <span className="text-slate-500">used</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full ${u.searchesUsed >= u.searchLimit ? "bg-red-500" : "bg-white"}`}
                            style={{ width: `${Math.min(100, (u.searchesUsed / u.searchLimit) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Limits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Limits Overlay Dialog Panel */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Adjust Account Limits
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify absolute limits for {editingUser.name}</p>
              </div>
              <button 
                onClick={handleCloseEdit}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Limits Form */}
            <form onSubmit={handleUpdateLimits} className="space-y-4">
              <div className="space-y-2 bg-slate-950/60 border border-slate-850 p-3 rounded-lg text-xs text-slate-400 font-mono">
                <p className="text-white font-semibold">Current Usage Metrics:</p>
                <p>• Image Uploads Used: {editingUser.uploadsUsed} / {editingUser.uploadLimit}</p>
                <p>• AI Searches Used: {editingUser.searchesUsed} / {editingUser.searchLimit}</p>
              </div>

              {/* Upload limit input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  New Uploads Limit
                </label>
                <input
                  type="number"
                  required
                  min={editingUser.uploadsUsed}
                  value={newUploadLimit}
                  onChange={(e) => setNewUploadLimit(parseInt(e.target.value, 10))}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors font-mono"
                />
                <p className="text-[10px] text-slate-500">Must be at least the number of uploads already used ({editingUser.uploadsUsed}).</p>
              </div>

              {/* Search limit input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <SearchIcon className="w-3.5 h-3.5 text-slate-500" />
                  New AI Searches Limit
                </label>
                <input
                  type="number"
                  required
                  min={editingUser.searchesUsed}
                  value={newSearchLimit}
                  onChange={(e) => setNewSearchLimit(parseInt(e.target.value, 10))}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors font-mono"
                />
                <p className="text-[10px] text-slate-500">Must be at least the number of AI searches already used ({editingUser.searchesUsed}).</p>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="flex-1 bg-white hover:bg-slate-200 text-slate-950 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-850 disabled:text-slate-500"
                >
                  {updateLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Limits"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
