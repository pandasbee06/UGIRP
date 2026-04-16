import { useState, useEffect } from "react";
import { FolderKanban, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, Upload, X, ShieldAlert, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiJson } from "../lib/api";

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [expandedCluster, setExpandedCluster] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [resolutionOutcome, setResolutionOutcome] = useState("Resolved");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const [updating, setUpdating] = useState(false);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = window.localStorage.getItem("ugirp.token");
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      setMyId(payload.userId);
      
      const res = await apiJson("/api/officer/my-complaints", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setComplaints(res.data);
    } catch (err) {
      alert("Failed to fetch assigned complaints.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofFile(file);
        setProofPreview(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const submitResolution = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    setUpdating(true);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      
      // 1. Update text variables
      await apiJson(`/api/officer/update/${selectedTicket._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: {
          status: resolutionOutcome,
          remarks: remarks.trim()
        }
      });
      
      // 2. Upload proof if exists independently
      if (proofPreview) {
         await apiJson(`/api/officer/upload-proof/${selectedTicket._id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: {
            proof: proofPreview
          }
         });
      }
      
      alert("Ticket Resolved successfully!");
      setSelectedTicket(null);
      setRemarks("");
      setResolutionOutcome("Resolved");
      setProofFile(null);
      setProofPreview("");
      fetchData();
    } catch (err) {
      alert("Failed to submit resolution package.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // --- Clustering Algorithm ---
  const clustersData = complaints.reduce((acc, curr) => {
    let loc = curr.location || "Unknown Area";
    if (loc.includes("[Lat:")) {
      loc = loc.split("[Lat:")[0].trim();
    }
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(curr);
    return acc;
  }, {});

  const clusters = Object.keys(clustersData).map(loc => {
    const list = clustersData[loc];
    const hasCritical = list.some(c => c.priority === "Critical");
    const hasHigh = list.some(c => c.priority === "High");
    let priorityMap = "Medium";
    if (hasCritical) priorityMap = "Critical";
    else if (hasHigh) priorityMap = "High";
    return {
      location: loc,
      tickets: list,
      priority: priorityMap
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> Officer Workspace
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Your explicitly assigned civic complaint resolving pipeline.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <ShieldAlert className="h-5 w-5 text-amber-500" /> Active Area Clusters ({clusters.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {clusters.length === 0 ? (
             <div className="p-10 text-center text-slate-500 font-medium">You have zero tickets directly assigned to you right now.</div>
          ) : clusters.map((cluster, idx) => (
             <div key={idx} className="flex flex-col">
               {/* Cluster Header */}
               <div 
                 onClick={() => setExpandedCluster(expandedCluster === idx ? null : idx)}
                 className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition cursor-pointer flex justify-between items-center"
               >
                 <div>
                   <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                     <MapPin className="h-5 w-5 text-indigo-500" /> {cluster.location}
                   </h3>
                   <p className="text-slate-500 text-sm mt-1">{cluster.tickets.length} Registered Complaint{cluster.tickets.length > 1 ? 's' : ''}</p>
                   
                   <div className="mt-2 text-xs font-semibold">
                      <span className={`px-2 py-1 rounded flex w-fit items-center gap-1
                        ${cluster.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}
                      >
                        <AlertTriangle className="h-3 w-3"/> Area Priority: {cluster.priority}
                      </span>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full dark:bg-indigo-500/10 dark:text-indigo-400">
                     View Report
                   </span>
                   {expandedCluster === idx ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                 </div>
               </div>

               {/* Cluster Body Dropdown */}
               <AnimatePresence>
                 {expandedCluster === idx && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-white/5"
                   >
                     <ul className="divide-y divide-slate-100 dark:divide-white/5 pl-4 sm:pl-8">
                       {cluster.tickets.map(c => (
                         <li key={c._id} className="p-4 hover:bg-white dark:hover:bg-slate-800/50 transition cursor-pointer" onClick={() => {
                           setSelectedTicket(c);
                           setRemarks(c.remarks || "");
                           setProofPreview(c.proof || "");
                         }}>
                           <div className="flex justify-between items-center">
                             <div>
                               <h4 className="font-bold text-slate-800 dark:text-slate-200">{c.title}</h4>
                               <p className="text-slate-500 text-xs mt-1 mb-2 font-mono">{c.ticketId} • {new Date(c.createdAt).toLocaleDateString()}</p>
                               <div className="flex gap-2">
                                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold dark:bg-slate-700 dark:text-slate-300">{c.category}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>{c.status}</span>
                               </div>
                             </div>
                             <ChevronRight className="text-slate-300 w-4 h-4 ml-4" />
                           </div>
                         </li>
                       ))}
                     </ul>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          ))}
        </div>
      </div>

      {/* Expanded Ticket View Modal/Drawer */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                  <h2 className="text-xl font-bold dark:text-white">{selectedTicket.ticketId}</h2>
                  <p className="text-sm text-slate-500">{selectedTicket.location}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 flex-1 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Original Complaint</h3>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100 dark:border-white/5">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.status === "Resolved" || selectedTicket.status === "Rejected" ? (
                  <div className={`p-6 rounded-2xl flex items-center gap-4 ${selectedTicket.status === "Rejected" ? "bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20" : "bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"}`}>
                     {selectedTicket.status === "Rejected" ? <X className="h-10 w-10 text-rose-500 flex-shrink-0" /> : <CheckCircle2 className="h-10 w-10 text-emerald-500 flex-shrink-0" />}
                     <div>
                       <h3 className={`font-bold ${selectedTicket.status === "Rejected" ? "text-rose-900 dark:text-rose-400" : "text-emerald-900 dark:text-emerald-400"}`}>
                         {selectedTicket.status === "Rejected" ? "Marked as Rejected / Fake" : "Marked as Resolved!"}
                       </h3>
                       <p className={`text-sm mt-1 ${selectedTicket.status === "Rejected" ? "text-rose-700/80 dark:text-rose-400/80" : "text-emerald-700/80 dark:text-emerald-400/80"}`}>
                         This ticket is closed. Check remarks and proof below.
                       </p>
                     </div>
                  </div>
                ) : (
                  <form onSubmit={submitResolution} className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Resolution & Proof Pipeline</h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Resolution Outcome (Affects Citizen Trust Score)</label>
                      <select
                        value={resolutionOutcome}
                        onChange={(e) => setResolutionOutcome(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white font-semibold"
                      >
                        <option value="Resolved">Genuine Action Built (Resolved)</option>
                        <option value="Rejected">Fake / Spam Flagged (Rejected)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Officer Remarks</label>
                      <textarea
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Detail the actions taken to fix this issue..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white h-32"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attach Photographic Proof</label>
                      <div className="flex items-center justify-center w-full relative">
                          <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition ${proofPreview ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-white/10'}`}>
                              {proofPreview ? (
                                <img src={proofPreview} alt="Proof" className="w-full h-full object-contain p-2 rounded-xl" />
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-slate-400" />
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span></p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG or WEBP</p>
                                </div>
                              )}
                              <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit" 
                        disabled={updating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50"
                      >
                         {updating ? "Committing Resolution..." : <><CheckCircle2 className="h-5 w-5" /> Subnit Official Evaluation</>}
                      </button>
                    </div>
                  </form>
                )}

                {/* Pre-existing proofs display */}
                {(selectedTicket.status === "Resolved" || selectedTicket.status === "Rejected") && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                     <div>
                      <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-widest mb-1">Official Remarks</h4>
                      <p className="text-slate-900 dark:text-white">{selectedTicket.remarks || "No remarks originally provided."}</p>
                     </div>
                     {selectedTicket.proof && (
                       <div>
                         <h4 className="font-semibold text-sm text-slate-500 uppercase tracking-widest mb-2">Photographic Proof</h4>
                         <img src={selectedTicket.proof} alt="Proof of Resolution" className="max-w-xs rounded-xl border border-slate-200 dark:border-white/10 shadow-sm" />
                       </div>
                     )}
                  </div>
                )}
                
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
