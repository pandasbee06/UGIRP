import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Activity, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { apiJson } from "../lib/api";

export default function ComplaintHistory() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const token = window.localStorage.getItem("ugirp.token");
        if (!token) {
          navigate("/login");
          return;
        }
        const res = await apiJson("/api/complaints", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setComplaints(res.data);
        }
      } catch (err) {
        console.error("Failed to load complaints history", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComplaints();
  }, [navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
      case "In Progress": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
      default: return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved": return <CheckCircle className="h-4 w-4" />;
      case "In Progress": return <Activity className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Complaint History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A complete record of all the civic reports you have filed.</p>
        </div>
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white dark:border-white/5 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">No complaints filed yet.</p>
          </div>
        ) : complaints.map((c, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            key={c._id || c.ticketId} 
            className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/5 dark:bg-slate-900 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getStatusColor(c.status)}`}>
                {getStatusIcon(c.status)}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.category}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">ID: {c.ticketId}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:border-none border-t border-slate-100 dark:border-white/5 sm:pt-0 pt-3">
              <div className="text-xs font-medium uppercase tracking-wide">
                <span className={c.priority === 'High' || c.priority === 'Critical' ? 'text-red-500' : 'text-slate-500'}>{c.priority} Priority</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(c.status)}`}>
                {c.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
