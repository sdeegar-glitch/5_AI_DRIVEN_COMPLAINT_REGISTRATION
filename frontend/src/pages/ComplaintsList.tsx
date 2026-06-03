import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../lib/axios.js";
import { 
  Search, 
  FileSpreadsheet, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  Loader,
  Calendar,
  MapPin,
  User as UserIcon
} from "lucide-react";

interface Complaint {
  id: number;
  userId: number;
  title: string;
  complainantName: string;
  complainantContact: string;
  incidentDatetime: string;
  incidentPlace: string;
  accusedDetails: string;
  description: string;
  ipcSections: string[];
  imageUrl: string;
  createdAt: string;
  similarity?: number;
}

export const ComplaintsList: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearch, setAiSearch] = useState(false);

  // Load all complaints
  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[ComplaintsList] Fetching complaints list...");
      const response = await api.get("/api/complaints");
      if (response.data?.status === "success") {
        setComplaints(response.data.data.complaints || []);
      }
    } catch (err: any) {
      console.error("[ComplaintsList] Failed to fetch complaints:", err);
      setError(err.message || "Failed to load complaints from registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If empty query, fetch all complaints
    if (!searchQuery.trim()) {
      fetchComplaints();
      return;
    }

    setLoading(true);
    setError(null);

    // Limit check for AI semantic search
    if (aiSearch && user && user.searchesUsed >= user.searchLimit) {
      setError("Search blocked: You have exhausted your lifetime AI search limit.");
      setLoading(false);
      return;
    }

    try {
      console.log("[ComplaintsList] Executing search query:", searchQuery, "aiSearch:", aiSearch);
      const response = await api.get("/api/complaints/search", {
        params: {
          q: searchQuery.trim(),
          ai: aiSearch,
        }
      });

      if (response.data?.status === "success") {
        setComplaints(response.data.data.results || []);
        if (aiSearch) {
          refreshUser(); // Sync footer usage credits immediately
        }
      }
    } catch (err: any) {
      console.error("[ComplaintsList] Search execution failed:", err);
      setError(err.message || "Failed to complete search query.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on toggle switch changes if search query is already typed
  const handleAiToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextToggle = e.target.checked;
    setAiSearch(nextToggle);
  };

  const isSearchLimitReached = user && user.searchesUsed >= user.searchLimit;

  return (
    <div className="flex-1 p-6 md:p-10 space-y-6 max-w-7xl w-full mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
            First Information Report (FIR) Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">Browse, search, and audit parsed complaints records.</p>
        </div>
      </div>

      {/* Search & AI Toggle Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by title, description or incident details..."
              className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-700 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* AI Toggle switches */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-850">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={aiSearch}
                onChange={handleAiToggleChange}
                disabled={!!isSearchLimitReached}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-950 border border-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-white/10 peer-checked:border-white/20"></div>
              <span className="ml-2 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${aiSearch ? "text-indigo-400" : "text-slate-500"}`} />
                AI Semantic Search
              </span>
            </label>
          </div>

          {/* Credits indicator / warnings */}
          {aiSearch && (
            <div className="flex items-center gap-2 text-[11px] text-amber-400 font-semibold font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AI Semantic Search will deduct 1 search credit from your lifetime limit.</span>
            </div>
          )}

          {isSearchLimitReached && (
            <div className="flex items-center gap-2 text-[11px] text-red-400 font-semibold font-mono bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AI Search limits exhausted. Semantic queries are disabled.</span>
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading && complaints.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading registry records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No FIR records found</p>
            <p className="text-xs text-slate-500">Try adjusting your search filters or upload a complaint letter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 font-mono w-16">ID</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Complainant</th>
                  <th className="py-3.5 px-4">Place of Incident</th>
                  <th className="py-3.5 px-4">Incident Datetime</th>
                  {aiSearch && searchQuery && <th className="py-3.5 px-4 font-mono text-indigo-400">Similarity</th>}
                  <th className="py-3.5 px-4">Date Filed</th>
                  <th className="py-3.5 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="hover:bg-slate-850/50 cursor-pointer transition-colors group text-sm text-slate-200"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{c.id}</td>
                    <td className="py-3.5 px-4 font-bold text-white max-w-[150px] truncate">{c.title}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{c.complainantName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{c.incidentPlace}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{c.incidentDatetime}</span>
                      </div>
                    </td>
                    {aiSearch && searchQuery && (
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {c.similarity ? `${(c.similarity * 100).toFixed(1)}%` : "N/A"}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
