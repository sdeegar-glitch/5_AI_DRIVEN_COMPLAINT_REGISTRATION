import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../lib/axios.js";
import { 
  ShieldAlert, 
  LogOut, 
  Upload, 
  Search, 
  CheckCircle2, 
  User as UserIcon, 
  Loader, 
  AlertTriangle,
  X,
  Plus,
  Send,
  Sparkles,
  FileSpreadsheet
} from "lucide-react";

interface ParsedDraft {
  complainantName: string;
  complainantContact: string;
  incidentDateTime: string;
  incidentPlace: string;
  accusedDetails: string;
  complaintDescription: string;
  ipcSections: string[];
  title: string;
}

export const Home: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core App states
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Draft review states
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [newIpcTag, setNewIpcTag] = useState("");

  // Restore draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("abhay_draft_backup");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.draft) {
          console.log("[Home Page] Restored draft backup from LocalStorage.");
          setDraft(parsed.draft);
          setImageUrl(parsed.imageUrl || null);
          setFileType(parsed.fileType || null);
        }
      }
    } catch (err) {
      console.error("[Home Page] Failed to restore draft backup:", err);
    }
  }, []);

  // Backup draft to LocalStorage on change
  useEffect(() => {
    try {
      if (draft) {
        localStorage.setItem(
          "abhay_draft_backup",
          JSON.stringify({ draft, imageUrl, fileType })
        );
      } else {
        localStorage.removeItem("abhay_draft_backup");
      }
    } catch (err) {
      console.error("[Home Page] Failed to save draft backup:", err);
    }
  }, [draft, imageUrl, fileType]);

  const handleLogout = async () => {
    console.log("[Home Page] Triggering logout...");
    await logout();
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (user && user.uploadsUsed >= user.uploadLimit) {
      setError("You have reached your lifetime limit of image uploads. Please contact an Admin to increase your limit.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const previewUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(previewUrl);
        setFileType(file.type);
        handleUpload(file);
      } else {
        setError("Invalid file format. Please upload a valid JPEG, PNG, or PDF file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user && user.uploadsUsed >= user.uploadLimit) {
      setError("You have reached your lifetime limit of image uploads. Please contact an Admin to increase your limit.");
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const previewUrl = URL.createObjectURL(file);
        setLocalPreviewUrl(previewUrl);
        setFileType(file.type);
        handleUpload(file);
      } else {
        setError("Invalid file format. Please upload a valid JPEG, PNG, or PDF file.");
      }
    }
  };

  // Upload and parse image
  const handleUpload = async (file: File) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    console.log("[Home Page] Starting image upload & AI parse for file:", file.name);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("/api/complaints/parse", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.status === "success") {
        const { imageUrl, draft: aiDraft } = response.data.data;
        setImageUrl(imageUrl);
        
        setDraft({
          complainantName: aiDraft.complainantName || "",
          complainantContact: aiDraft.complainantContact || "",
          incidentDateTime: aiDraft.incidentDateTime || "",
          incidentPlace: aiDraft.incidentPlace || "",
          accusedDetails: aiDraft.accusedDetails || "",
          complaintDescription: aiDraft.complaintDescription || "",
          ipcSections: aiDraft.ipcSections || [],
          title: aiDraft.title || "",
        });

        setSuccess("Complaint image uploaded and parsed successfully! Review the draft below.");
        refreshUser(); // sync quota counts
      } else {
        setError(response.data?.message || "Failed to process image.");
      }
    } catch (err: any) {
      console.error("[Home Page] File parsing failed:", err);
      setError(err.message || "An unexpected error occurred during image parsing.");
    } finally {
      setLoading(false);
    }
  };

  // Form field update
  const updateDraftField = (key: keyof ParsedDraft, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [key]: value,
    });
  };

  // IPC tags management
  const addIpcTag = () => {
    if (!draft || !newIpcTag.trim()) return;
    
    let tag = newIpcTag.trim();
    if (!tag.toUpperCase().startsWith("IPC ")) {
      tag = `IPC ${tag}`;
    }

    if (!draft.ipcSections.includes(tag)) {
      setDraft({
        ...draft,
        ipcSections: [...draft.ipcSections, tag],
      });
    }
    setNewIpcTag("");
  };

  const removeIpcTag = (tagToRemove: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      ipcSections: draft.ipcSections.filter((t) => t !== tagToRemove),
    });
  };

  // Submit finalised draft to DB
  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !imageUrl) return;

    setError(null);
    setSuccess(null);
    setLoading(true);
    console.log("[Home Page] Submitting finalised FIR draft...");

    try {
      const response = await api.post("/api/complaints", {
        title: draft.title,
        complainantName: draft.complainantName,
        complainantContact: draft.complainantContact,
        incidentDatetime: draft.incidentDateTime,
        incidentPlace: draft.incidentPlace,
        accusedDetails: draft.accusedDetails,
        description: draft.complaintDescription,
        ipcSections: draft.ipcSections,
        imageUrl,
      });

      if (response.data?.status === "success") {
        setSuccess("Complaint filed successfully! Relational embedding generated and saved.");
        
        // Reset states
        setDraft(null);
        setImageUrl(null);
        setFileType(null);
        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl);
        }
        setLocalPreviewUrl(null);
        
        refreshUser(); // sync limits
      } else {
        setError(response.data?.message || "Failed to save complaint.");
      }
    } catch (err: any) {
      console.error("[Home Page] Failed to save complaint:", err);
      setError(err.message || "An unexpected error occurred while saving the complaint.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReview = () => {
    setDraft(null);
    setImageUrl(null);
    setFileType(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    setError(null);
    setSuccess(null);
  };

  const isLimitReached = user && user.uploadsUsed >= user.uploadLimit;

  return (
    <div className="min-h-screen bg-bg-base text-text-main flex flex-col font-sans transition-colors duration-200">
      {/* Premium Dashboard Header */}
      <header className="border-b border-border-main bg-bg-surface/70 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
              ABHAY
              <span className="text-[10px] bg-bg-panel text-text-muted border border-border-main px-1.5 py-0.5 rounded font-mono font-normal">
                Workspace
              </span>
            </h1>
            <p className="text-xs text-text-muted">AI-Based Helpdesk for Assistance & Your Complaints</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-bg-panel border border-border-main px-3 py-1.5 rounded-lg">
            <UserIcon className="w-4 h-4 text-text-muted" />
            <div className="text-left leading-tight">
              <p className="text-xs font-semibold text-text-main">{user?.name}</p>
              <p className="text-[10px] text-text-muted font-mono capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold bg-bg-panel border border-border-main px-3 py-2 rounded-lg hover:bg-bg-base hover:text-text-main transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-text-muted" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Primary Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-6">
        
        {/* Success/Error Banners */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* View switching logic */}
        {!draft ? (
          /* File Upload Zone Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Upload form block */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 space-y-6 shadow-lg transition-colors duration-200">
                <div>
                  <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-primary" />
                    AI-Driven FIR Draft Generation
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    Upload your complaint letter image (printed or handwritten). Our multi-modal AI parser will automatically generate structured legal complaint drafts.
                  </p>
                </div>

                {/* Upload drag drop box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !isLimitReached && !loading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-16 text-center transition-all relative ${
                    dragActive ? "border-text-main bg-bg-panel/40" : "border-border-main bg-bg-panel/20"
                  } ${
                    isLimitReached 
                      ? "opacity-50 cursor-not-allowed border-brand-accent/20 bg-brand-accent/5" 
                      : "cursor-pointer hover:border-text-muted"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={!!isLimitReached || loading}
                  />

                  {loading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mx-auto animate-spin">
                        <Loader className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-main animate-pulse">Uploading & Parsing complaint with OpenAI...</p>
                        <p className="text-xs text-text-muted">Connecting to Responses API. Please hold...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto transition-colors ${
                        isLimitReached ? "bg-brand-accent/10 border border-brand-accent/20" : "bg-bg-panel border border-border-main"
                      }`}>
                        <Upload className={`w-5 h-5 ${isLimitReached ? "text-brand-accent" : "text-text-muted"}`} />
                      </div>
                      
                      {isLimitReached ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-brand-accent">Upload Limit Reached</p>
                          <p className="text-xs text-text-muted">Please request an administrator to expand your usage limits.</p>
                        </div>
                      ) : (
                        <div className="space-y-1 block">
                          <p className="text-sm font-semibold text-text-main">Drag & drop complaint image, or click to browse</p>
                          <p className="text-xs text-text-muted">Supports JPEG, PNG, or PDF formats (Max 10MB)</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quota Limits side block */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-bg-surface border border-border-main rounded-xl p-6 space-y-6 shadow-lg transition-colors duration-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-main pb-3">
                  Account Limits & Status
                </h3>

                <div className="space-y-4">
                  {/* Upload limit bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-semibold flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-text-muted" />
                        Image Uploads
                      </span>
                      <span className="font-mono text-text-main font-bold">{user?.uploadsUsed} / {user?.uploadLimit}</span>
                    </div>
                    <div className="h-2 bg-bg-panel rounded-full overflow-hidden border border-border-main">
                      <div 
                        className={`h-full rounded-full transition-all ${isLimitReached ? "bg-brand-accent" : "bg-brand-primary"}`}
                        style={{ width: `${Math.min(100, ((user?.uploadsUsed || 0) / (user?.uploadLimit || 5)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Search limit bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-semibold flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-text-muted" />
                        AI Semantic Searches
                      </span>
                      <span className="font-mono text-text-main font-bold">{user?.searchesUsed} / {user?.searchLimit}</span>
                    </div>
                    <div className="h-2 bg-bg-panel rounded-full overflow-hidden border border-border-main">
                      <div 
                        className="h-full bg-brand-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((user?.searchesUsed || 0) / (user?.searchLimit || 10)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-panel border border-border-main rounded-lg p-3.5 text-[11px] text-text-muted space-y-1.5">
                  <p className="font-semibold text-text-main flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650 dark:text-emerald-500" />
                    Secure FIR Registry Active
                  </p>
                  <p>All finalized complaints generate vector embeddings automatically for legal search indexation.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Side-by-side Draft Review Form Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Document preview */}
            <div className="lg:col-span-5 bg-bg-surface border border-border-main rounded-xl p-4 shadow-lg space-y-4 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-main">Original Document Preview</h3>
                {(localPreviewUrl || imageUrl) && (
                  <a 
                    href={localPreviewUrl || imageUrl || undefined} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs text-brand-primary hover:opacity-85 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open in new tab
                  </a>
                )}
              </div>
              <div className="border border-border-main rounded-lg overflow-hidden bg-bg-panel flex items-center justify-center min-h-[300px] max-h-[500px]">
                {fileType === "application/pdf" || (imageUrl && imageUrl.toLowerCase().includes(".pdf")) ? (
                  <iframe
                    src={localPreviewUrl || imageUrl || undefined}
                    title="Original PDF preview"
                    className="w-full h-[480px] border-0"
                  />
                ) : (
                  <img
                    src={localPreviewUrl || imageUrl || undefined}
                    alt="Original complaint scan"
                    className="object-contain max-h-[480px] w-full"
                  />
                )}
              </div>
            </div>

            {/* Right Column: Editable Draft Form */}
            <div className="lg:col-span-7 bg-bg-surface border border-border-main rounded-xl p-6 md:p-8 shadow-lg transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-border-main pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Review & Correct FIR Draft
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">Correct parsed fields before committing to database records.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelReview}
                  className="text-xs bg-bg-panel border border-border-main hover:border-text-muted px-3 py-1.5 rounded-lg text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  Discard Draft
                </button>
              </div>

              <form onSubmit={handleSaveComplaint} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Action-Phrase Title (Max 12 Chars)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={draft.title}
                    onChange={(e) => updateDraftField("title", e.target.value)}
                    placeholder="e.g. Theft"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Complainant Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Complainant Name</label>
                  <input
                    type="text"
                    required
                    value={draft.complainantName}
                    onChange={(e) => updateDraftField("complainantName", e.target.value)}
                    placeholder="Complainant full name"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Complainant Contact/Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Complainant Contact / Address</label>
                  <textarea
                    required
                    rows={2}
                    value={draft.complainantContact}
                    onChange={(e) => updateDraftField("complainantContact", e.target.value)}
                    placeholder="Address, Phone or Email details"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors resize-none"
                  />
                </div>

                {/* Date & Time of Incident */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Date & Time of Incident</label>
                  <input
                    type="text"
                    required
                    value={draft.incidentDateTime}
                    onChange={(e) => updateDraftField("incidentDateTime", e.target.value)}
                    placeholder="Date time description"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Place of Incident */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Place of Incident (District/PS)</label>
                  <input
                    type="text"
                    required
                    value={draft.incidentPlace}
                    onChange={(e) => updateDraftField("incidentPlace", e.target.value)}
                    placeholder="e.g. Sector-62, Noida PS"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Accused Suspect Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Accused / Suspect Details</label>
                  <input
                    type="text"
                    required
                    value={draft.accusedDetails}
                    onChange={(e) => updateDraftField("accusedDetails", e.target.value)}
                    placeholder="Names, descriptions or 'Unknown'"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-main block">Complaint Description</label>
                  <textarea
                    required
                    rows={4}
                    value={draft.complaintDescription}
                    onChange={(e) => updateDraftField("complaintDescription", e.target.value)}
                    placeholder="Chronological event summary details"
                    className="w-full bg-bg-panel border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {/* Suggested IPC Tags Multiselect */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-main block">IPC Sections Suggested</label>
                  
                  {/* Tag List */}
                  <div className="flex flex-wrap gap-2 min-h-8 p-2 bg-bg-panel border border-border-main rounded-lg">
                    {draft.ipcSections.length === 0 ? (
                      <span className="text-xs text-text-muted font-mono italic p-1">No IPC tags added yet.</span>
                    ) : (
                      draft.ipcSections.map((tag) => (
                        <span 
                          key={tag} 
                          className="bg-bg-surface border border-border-main text-xs px-2.5 py-1 rounded-full text-brand-primary flex items-center gap-1.5 font-semibold font-mono"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeIpcTag(tag)}
                            className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Tag Row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newIpcTag}
                      onChange={(e) => setNewIpcTag(e.target.value)}
                      placeholder="e.g. IPC 379"
                      className="bg-bg-panel border border-border-main rounded-lg px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-brand-primary transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={addIpcTag}
                      className="bg-bg-panel border border-border-main hover:border-text-muted text-text-main px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add IPC Tag
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-4 border-t border-border-main">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-brand-primary hover:opacity-90 text-white py-2.5 rounded-lg text-sm font-semibold disabled:bg-bg-panel disabled:text-text-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Generating embeddings & filing FIR...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Save Complaint & Generate Embedding
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelReview}
                    className="bg-bg-panel border border-border-main hover:border-text-muted px-5 py-2.5 rounded-lg text-sm font-semibold text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
