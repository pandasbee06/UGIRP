import { useState } from "react";
import { Search, MapPin, AlertTriangle, FileText, CheckCircle2, Clock, Activity, Shield, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiJson } from "../lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TrackComplaint() {
  const [ticketId, setTicketId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Calculate dynamic ETA based on priority
  const calculateETA = (createdAt, priority) => {
    const created = new Date(createdAt);
    const hours = { "Critical": 24, "High": 48, "Medium": 168, "Low": 336 }[priority] || 168; // 168h = 7d
    const etaDate = new Date(created.getTime() + hours * 60 * 60 * 1000);
    return etaDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const generatePDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("UGIRP Civic Receipt", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Unified Grievance Intelligence & Resolution Platform", 14, 26);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Ticket Reference:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(data.ticketId, 55, 45);

    doc.setFont("helvetica", "bold");
    doc.text("Date Filed:", 14, 52);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(data.createdAt).toLocaleDateString(), 55, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Citizen Name:", 14, 59);
    doc.setFont("helvetica", "normal");
    doc.text(data.userId?.name || "Anonymous", 55, 59);

    doc.setFont("helvetica", "bold");
    doc.text("Category:", 110, 45);
    doc.setFont("helvetica", "normal");
    doc.text(data.category, 140, 45);

    doc.setFont("helvetica", "bold");
    doc.text("Priority:", 110, 52);
    doc.setFont("helvetica", "normal");
    doc.text(data.priority, 140, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Current Status:", 110, 59);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(data.status === 'Resolved' ? 22 : 0, data.status === 'Resolved' ? 163 : 0, data.status === 'Resolved' ? 74 : 0);
    doc.text(data.status, 140, 59);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Location:", 14, 75);
    doc.setFont("helvetica", "normal");
    
    const splitLocation = doc.splitTextToSize(data.location, 170);
    doc.text(splitLocation, 14, 82);

    const descY = 82 + (splitLocation.length * 6) + 4;
    doc.setFont("helvetica", "bold");
    doc.text("Description:", 14, descY);
    doc.setFont("helvetica", "normal");
    
    const splitDesc = doc.splitTextToSize(data.description, 170);
    doc.text(splitDesc, 14, descY + 7);

    // Timeline Table
    const tableY = descY + 7 + (splitDesc.length * 6) + 10;
    
    // Simulate table data from timestamps
    const tableBody = [
      ["Registered & Verified", new Date(data.createdAt).toLocaleString()]
    ];
    
    if (data.status === "In Progress" || data.status === "Resolved") {
      tableBody.push(["Assigned & In Progress", new Date(data.updatedAt).toLocaleString()]);
    }
    if (data.status === "Resolved") {
      tableBody.push(["Successfully Resolved", new Date(data.updatedAt).toLocaleString()]);
    }

    autoTable(doc, {
      startY: tableY,
      head: [['Event Status', 'Timestamp']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = doc.lastAutoTable.finalY || tableY + 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("System Generated Receipt - Do not reply to this document.", 14, finalY + 15);

    doc.save(`UGIRP_Receipt_${data.ticketId}.pdf`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    
    setLoading(true);
    setError("");
    setData(null);

    try {
      // The track endpoint is public, no auth token required strictly, but we'll pass if it exists
      const token = window.localStorage.getItem("ugirp.token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await apiJson(`/api/complaints/track/${ticketId.trim()}`, { headers });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      if (!token) throw new Error("You must be logged in to reopen tickets.");

      const res = await apiJson(`/api/complaints/${data._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: { status: "Pending" }
      });
      setData(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reopen");
    } finally {
      setActionLoading(false);
    }
  };

  const getStepStatus = (stepIndex, currentStatus) => {
    const statuses = ["Pending", "In Progress", "Resolved"];
    const currentIndex = statuses.indexOf(currentStatus);
    
    if (currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-12 sm:px-6">
      
      {/* Hero Search */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-3">Track Your Complaint</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Enter your official Ticket Reference ID below to view the real-time status and resolution pipeline of your civic report.</p>
        
        <form onSubmit={handleSearch} className="mt-8 relative max-w-xl mx-auto flex items-center">
          <div className="absolute left-4 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value.toUpperCase())}
            placeholder="e.g. CMP-A8B9C2"
            className="w-full rounded-full border-2 border-slate-200 bg-white py-4 pl-12 pr-32 text-lg font-medium outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={loading || !ticketId.trim()}
            className="absolute right-2 top-2 bottom-2 rounded-full bg-slate-900 px-6 font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 max-w-xl mx-auto w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/30 dark:bg-red-900/10"
          >
            <p className="font-semibold text-red-600 dark:text-red-400">Ticket Not Found</p>
            <p className="text-sm text-red-500/80 mt-1 dark:text-red-400/80">Please check the ID and try again, or ensure it is correctly formatted.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900 dark:shadow-none overflow-hidden"
          >
            
            {/* Header Block */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-6 dark:border-white/5 dark:bg-slate-800/20 sm:px-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Ticket Reference</p>
                <h2 className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{data.ticketId}</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold 
                ${data.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                  data.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 
                  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'}`}
              >
                <AlertTriangle className="h-4 w-4" />
                {data.priority} Priority
              </span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 py-3 px-6 sm:px-10 flex justify-end">
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors px-4 py-2 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
              >
                <Download className="w-4 h-4" /> Download Official Receipt (PDF)
              </button>
            </div>

            <div className="p-6 sm:p-10 space-y-12">
              
              {/* Visual Pipeline Stepper */}
              <div className="relative">
                <div className="absolute left-[38px] top-10 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 sm:left-auto sm:right-10 sm:top-[38px] sm:bottom-auto sm:h-0.5 sm:w-[calc(100%-80px)] sm:-translate-y-1/2" />
                
                <div className="relative flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-0">
                  {/* Step 1: Pending */}
                  <div className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-4 sm:w-1/3 z-10">
                    <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 bg-white transition-colors duration-500 dark:bg-slate-900 
                      ${getStepStatus(0, data.status) === 'completed' || getStepStatus(0, data.status) === 'active' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-slate-200 text-slate-400 dark:border-slate-800'}`}
                    >
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="pt-5 sm:pt-0 sm:text-center text-left">
                      <p className={`font-bold ${getStepStatus(0, data.status) !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Submitted</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[150px] mx-auto">Ticket received by the digital system.</p>
                    </div>
                  </div>

                  {/* Step 2: In Progress */}
                  <div className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-4 sm:w-1/3 z-10">
                    <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 bg-white transition-colors duration-500 dark:bg-slate-900 
                      ${getStepStatus(1, data.status) === 'completed' ? 'border-amber-500 text-amber-500' : 
                        getStepStatus(1, data.status) === 'active' ? 'border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-200 text-slate-400 dark:border-slate-800'}`}
                    >
                      <Activity className="h-8 w-8" />
                    </div>
                    <div className="pt-5 sm:pt-0 sm:text-center text-left">
                      <p className={`font-bold ${getStepStatus(1, data.status) !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>In Progress</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[150px] mx-auto">Authorities have begun resolving the issue.</p>
                    </div>
                  </div>

                  {/* Step 3: Resolved */}
                  <div className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-4 sm:w-1/3 z-10">
                    <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 bg-white transition-colors duration-500 dark:bg-slate-900 
                      ${getStepStatus(2, data.status) === 'active' ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-slate-200 text-slate-400 dark:border-slate-800'}`}
                    >
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="pt-5 sm:pt-0 sm:text-center text-left">
                      <p className={`font-bold ${getStepStatus(2, data.status) !== 'pending' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>Resolved</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[150px] mx-auto">Issue has been fully fixed and closed.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Issue Category</p>
                    <p className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-500" /> {data.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Precise Location</p>
                    <p className="text-base text-slate-800 dark:text-slate-200 flex items-start gap-2 max-w-sm">
                      <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" /> 
                      {data.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Submitted On</p>
                    <p className="text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-400 shrink-0" /> 
                      {new Date(data.createdAt).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Assigned Officer Block */}
                  <div className="rounded-2xl bg-indigo-50/50 p-5 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Assigned Officer</p>
                    {data.assignedOfficer ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                          {data.assignedOfficer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{data.assignedOfficer.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{data.assignedOfficer.role}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Activity className="h-5 w-5" />
                        <span className="text-sm font-medium">Pending Assignment</span>
                      </div>
                    )}
                  </div>
                  
                  {/* ETA Block */}
                  {data.status !== "Resolved" && (
                    <div className="rounded-2xl bg-amber-50/50 p-5 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-1">Estimated Resolution ETA</p>
                        <p className="text-lg font-medium text-amber-700 dark:text-amber-400">{calculateETA(data.createdAt, data.priority)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-amber-200 dark:text-amber-700/50" />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Citizens Report Description</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    {data.description}
                  </p>
                  {data.media && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Attached Evidence</p>
                      <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                        <img 
                          src={data.media.startsWith('http') || data.media.startsWith('data:') ? data.media : 'https://placehold.co/600x400?text=Attached+Image+Proof'} 
                          alt="Citizen Proof"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reopen Action */}
              {data.status === "Resolved" && (
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">Are you unsatisfied with the resolution, or did the civic hazard persist?</p>
                  <button 
                    onClick={handleReopen}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {actionLoading ? "Processing..." : "Reopen Complaint Ticket"}
                  </button>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 max-w-sm text-center">
                    Note: You must be securely logged in to the account that created this ticket to request a reopening.
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
