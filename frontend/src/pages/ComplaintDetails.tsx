import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { api } from "../lib/axios.js";
import { 
  FileSpreadsheet, 
  ArrowLeft, 
  Trash2, 
  MapPin, 
  Calendar, 
  User as UserIcon, 
  Info,
  Loader,
  AlertTriangle,
  FileText
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
}

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchComplaintDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`[ComplaintDetails] Fetching details for ID: ${id}`);
        const response = await api.get(`/api/complaints/${id}`);
        if (response.data?.status === "success") {
          setComplaint(response.data.data.complaint || null);
        }
      } catch (err: any) {
        console.error("[ComplaintDetails] Failed to fetch details:", err);
        setError(err.message || "Failed to load complaint details.");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaintDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!complaint) return;
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete this complaint record and its vector embeddings? This action is permanent.");
    if (!confirmDelete) return;

    setDeleteLoading(true);
    setError(null);
    try {
      console.log(`[ComplaintDetails] Deleting complaint ID: ${complaint.id}`);
      const response = await api.delete(`/api/complaints/${complaint.id}`);
      if (response.data?.status === "success") {
        navigate("/complaints");
      }
    } catch (err: any) {
      console.error("[ComplaintDetails] Delete request failed:", err);
      setError(err.message || "Failed to delete complaint record.");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-slate-500 mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="flex-1 p-6 md:p-10 max-w-4xl w-full mx-auto space-y-6">
        <Link to="/complaints" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </Link>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl flex items-start gap-4 text-sm shadow-lg">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Failed to load details</p>
            <p>{error || "The requested complaint record does not exist or you do not have permission to view it."}</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine if file is PDF
  const isPdf = complaint.imageUrl.toLowerCase().includes(".pdf");

  return (
    <div className="flex-1 p-6 md:p-10 space-y-6 max-w-7xl w-full mx-auto">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="space-y-1">
          <Link to="/complaints" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to FIR Registry
          </Link>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            FIR Draft: {complaint.title}
            <span className="text-xs font-mono font-normal bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
              Record #{complaint.id}
            </span>
          </h2>
        </div>

        {/* Delete action button */}
        {(user?.role === "ADMIN" || user?.id === complaint.userId) && (
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:bg-slate-850 disabled:text-slate-500"
          >
            {deleteLoading ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Delete Record
          </button>
        )}
      </div>

      {/* Side-by-side details layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image/PDF original document */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">Original Document Preview</h3>
            <a 
              href={complaint.imageUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              Open in new tab
            </a>
          </div>
          <div className="border border-slate-850 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[500px]">
            {isPdf ? (
              <iframe
                src={complaint.imageUrl}
                title="Original PDF preview"
                className="w-full h-[480px] border-0"
              />
            ) : (
              <img
                src={complaint.imageUrl}
                alt="Original complaint scan"
                className="object-contain max-h-[480px] w-full"
              />
            )}
          </div>
        </div>

        {/* Right Column: Display of the 7 FIR fields */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-lg space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Boiled-Down FIR Fields</h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Complainant Name */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                Complainant Name
              </span>
              <p className="text-sm text-white font-semibold bg-slate-950 border border-slate-850 rounded-lg px-3 py-2">
                {complaint.complainantName}
              </p>
            </div>

            {/* Complainant Contact/Address */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Complainant Contact & Address
              </span>
              <p className="text-sm text-white font-medium bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 whitespace-pre-wrap">
                {complaint.complainantContact}
              </p>
            </div>

            {/* Date & Time of Incident */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date & Time of Incident
              </span>
              <p className="text-sm text-white font-semibold bg-slate-950 border border-slate-850 rounded-lg px-3 py-2">
                {complaint.incidentDatetime}
              </p>
            </div>

            {/* Place of Incident */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Place of Incident (District/PS)
              </span>
              <p className="text-sm text-white font-semibold bg-slate-950 border border-slate-850 rounded-lg px-3 py-2">
                {complaint.incidentPlace}
              </p>
            </div>

            {/* Accused Suspect Details */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Accused / Suspect Details
              </span>
              <p className="text-sm text-white font-medium bg-slate-950 border border-slate-850 rounded-lg px-3 py-2">
                {complaint.accusedDetails}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Complaint Description
              </span>
              <p className="text-sm text-white font-medium bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-3 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* IPC Sections */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                IPC Sections Suggested & Applied
              </span>
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-950 border border-slate-850 rounded-lg min-h-10">
                {complaint.ipcSections.length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono italic p-1">No IPC tags applied to this record.</span>
                ) : (
                  complaint.ipcSections.map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-slate-900 border border-slate-800 text-xs px-3 py-1 rounded-full text-indigo-300 font-bold font-mono"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
