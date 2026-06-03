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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-main pb-4">
        <div>
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-text-muted" />
            First Information Report (FIR) Registry
          </h2>
          <p className="text-xs text-text-muted mt-1">Browse, search, and audit parsed complaints records.</p>
        </div>
      </div>

      {/* Search & AI Toggle Panel */}
      <div className="bg-bg-surface border border-border-main rounded-xl p-5 shadow-lg space-y-4 transition-colors duration-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints by title, description or incident details..."
              className="w-full bg-bg-panel border border-border-main rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-primary hover:opacity-90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-bg-panel disabled:text-text-muted"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* AI Toggle switches */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-main">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={aiSearch}
                onChange={handleAiToggleChange}
                disabled={!!isSearchLimitReached}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-bg-panel border border-border-main peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-text-muted peer-checked:after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary/20 peer-checked:border-brand-primary/30"></div>
              <span className="ml-2 text-xs font-semibold text-text-main flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${aiSearch ? "text-brand-primary" : "text-text-muted"}`} />
                AI Semantic Search
              </span>
            </label>
          </div>

          {/* Credits indicator / warnings */}
          {aiSearch && (
            <div className="flex items-center gap-2 text-[11px] text-brand-accent font-semibold font-mono bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AI Semantic Search will deduct 1 search credit from your lifetime limit.</span>
            </div>
          )}

          {isSearchLimitReached && (
            <div className="flex items-center gap-2 text-[11px] text-brand-accent font-semibold font-mono bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>AI Search limits exhausted. Semantic queries are disabled.</span>
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints Table */}
      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden shadow-lg transition-colors duration-200">
        {loading && complaints.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Loader className="w-8 h-8 animate-spin text-text-muted mx-auto" />
            <p className="text-xs text-text-muted font-mono">Loading registry records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <FileSpreadsheet className="w-12 h-12 text-text-muted mx-auto" />
            <p className="text-sm font-semibold text-text-main">No FIR records found</p>
            <p className="text-xs text-text-muted">Try adjusting your search filters or upload a complaint letter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-panel/60 border-b border-border-main text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  <th className="py-3.5 px-4 font-mono w-16">ID</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Complainant</th>
                  <th className="py-3.5 px-4">Place of Incident</th>
                  <th className="py-3.5 px-4">Incident Datetime</th>
                  {aiSearch && searchQuery && <th className="py-3.5 px-4 font-mono text-brand-primary">Similarity</th>}
                  <th className="py-3.5 px-4">Date Filed</th>
                  <th className="py-3.5 px-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="hover:bg-bg-panel/50 cursor-pointer transition-colors group text-sm text-text-main"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-text-muted">#{c.id}</td>
                    <td className="py-3.5 px-4 font-bold text-text-main max-w-[150px] truncate">{c.title}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="truncate max-w-[120px]">{c.complainantName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="truncate max-w-[140px]">{c.incidentPlace}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span className="truncate max-w-[150px]">{c.incidentDatetime}</span>
                      </div>
                    </td>
                    {aiSearch && searchQuery && (
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-primary">
                        {c.similarity ? `${(c.similarity * 100).toFixed(1)}%` : "N/A"}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-xs text-text-muted">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted group-hover:text-text-main transition-colors">
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
