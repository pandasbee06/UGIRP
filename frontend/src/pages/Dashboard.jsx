import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  MapPin,
  ShieldAlert,
  Clock,
  CheckCircle,
  Bell,
  User,
  Activity,
  Award,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { apiJson } from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      if (!token) {
        navigate("/login");
        return;
      }
      // apiJson auto-attaches the token now
      const data = await apiJson("/api/dashboard/data");
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      const msg = (err?.message || "").toLowerCase();
      // Redirect to login on auth/session errors (stale token, server restart, etc.)
      if (
        msg.includes("missing token") ||
        msg.includes("invalid token") ||
        msg.includes("unauthorized") ||
        msg.includes("user not found")
      ) {
        window.localStorage.removeItem("ugirp.token"); // clear stale token
        navigate("/login");
      } else {
        setError(err?.message || "Failed to load dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 p-8 max-w-md w-full">
          <p className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Could not load dashboard</p>
          <p className="text-sm text-red-600 dark:text-red-500 mb-6">{error}</p>
          <button
            onClick={loadDashboard}
            className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

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

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* Header Actions */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Citizen Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your activity and civil scores</p>
        </div>
        <motion.button
          onClick={() => navigate('/file-complaint')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <ShieldAlert className="h-5 w-5" />
          File New Complaint
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left Column (Main Content) */}
        <div className="space-y-8 lg:col-span-2">

          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-6 shadow-sm dark:border-white/5 dark:from-slate-900 dark:to-indigo-950/30 sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{dashboardData.user.name || "Citizen"}</span>
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                  You have <strong className="text-indigo-700 dark:text-indigo-300">{dashboardData.complaints.filter(c => c.status !== 'Resolved').length}</strong> pending complaint(s) that need attention. Thank you for actively participating in keeping our community safe and clean!
                </p>
              </div>
              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:bg-slate-800/60 sm:flex">
                <FileText className="h-10 w-10 text-indigo-500" />
              </div>
            </div>
          </motion.div>

          {/* History Highlights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Complaints</h3>
              <Link to="/history" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {dashboardData.complaints.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">No complaints filed yet.</div>
              ) : dashboardData.complaints.map((c, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={c.id}
                  className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/5 dark:bg-slate-900 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getStatusColor(c.status)}`}>
                      {getStatusIcon(c.status)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.type}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.location}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{c.date}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">ID: {c.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:border-none border-t border-slate-100 dark:border-white/5 sm:pt-0 pt-3">
                    <div className="text-xs font-medium uppercase tracking-wide">
                      <span className={c.priority === 'High' ? 'text-red-500' : 'text-slate-500'}>{c.priority} Priority</span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">

          {/* Trust Score */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Award className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Civic Trust Score</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your reliability rating based on genuine reports and community feedback.</p>

            <div className="flex flex-col items-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-inner">
                <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{dashboardData.user.trustScore || 85}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Excellent</span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Score Progress</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Top 15%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Profile Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
                <p className="font-medium text-slate-900 dark:text-white">{dashboardData.user.name || "Citizen Name"}</p>
              </div>
              <div className="border-t border-slate-100 pt-3 dark:border-white/5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Email Contact</p>
                <p className="font-medium text-slate-900 dark:text-white truncate">{dashboardData.user.email || "email@example.com"}</p>
              </div>
              <div className="border-t border-slate-100 pt-3 dark:border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Account Type</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{dashboardData.user.role || "Citizen"}</p>
                </div>
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900 overflow-hidden flex flex-col">
            <div className="p-5 pb-3">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 dark:text-white">
                <Bell className="h-5 w-5 text-amber-500" />
                Notifications
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {dashboardData.notifications.length === 0 ? (
                  <div className="p-5 text-sm text-center text-slate-500">No new notifications.</div>
                ) : dashboardData.notifications.map(n => (
                  <div key={n.id} className={`p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${n.isNew ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${n.isNew ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {n.title}
                      </p>
                      {n.isNew && <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.msg}</p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 text-center">
              <button className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">View All Notifications</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
