import { useState, useEffect } from "react";
import { ShieldAlert, Users, FolderKanban, CheckCircle2, Search, Shield, AlertTriangle, Download, Sheet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiJson } from "../lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detailed Modal State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = window.localStorage.getItem("ugirp.token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [mRes, uRes, oRes] = await Promise.all([
        apiJson("/api/admin/stats", { headers }),
        apiJson("/api/admin/users", { headers }),
        apiJson("/api/admin/officers", { headers })
      ]);
      
      setMetrics(mRes.data);
      setUsers(uRes.data);
      setOfficers(oRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load admin parameters");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
      
      const token = window.localStorage.getItem("ugirp.token");
      await apiJson(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: { role: newRole }
      });
      
      fetchData(); // Reload UI
    } catch (err) {
      alert("Failed to update role. Insufficient privileges or network error.");
    }
  };

  const handleAssign = async (complaintId, officerId) => {
    try {
      if (!officerId) return;
      const token = window.localStorage.getItem("ugirp.token");
      await apiJson(`/api/admin/assign/${complaintId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: { officerId }
      });
      fetchData();
    } catch (err) {
      alert("Failed to assign ticket.");
    }
  };

  const viewTicketDetails = async (ticketId) => {
    setSelectedTicketId(ticketId);
    setDetailLoading(true);
    setTicketDetails(null);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      const res = await apiJson(`/api/complaints/track/${ticketId}`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTicketDetails(res.data);
      }
    } catch (e) {
      alert("Failed to fetch full ticket details");
    } finally {
      setDetailLoading(false);
    }
  };

  const exportPDF = () => {
    if (!metrics) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("UGIRP Executive Analytics Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);

    // Summary Metric Grid
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Global Status Summary", 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Total Complaints', 'Pending', 'Resolved', 'Emergency Active', 'Total Users']],
      body: [[
        metrics.complaints?.total || 0,
        (metrics.complaints?.pending || 0) + (metrics.complaints?.inProgress || 0),
        metrics.complaints?.resolved || 0,
        metrics.complaints?.emergency || 0,
        metrics.users?.total || 0
      ]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const categoryY = doc.lastAutoTable.finalY + 15;
    doc.text("Category Distribution", 14, categoryY);

    const categoryBody = metrics.categories?.map(c => [c.name, c.count]) || [];
    autoTable(doc, {
      startY: categoryY + 5,
      head: [['Issue Category', 'Volume Registered']],
      body: categoryBody,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
    });

    const recentY = doc.lastAutoTable.finalY + 15;
    doc.text("Latest Complaint Log", 14, recentY);

    const recentBody = metrics.recentComplaints?.map(r => [r.id, r.category, r.status, r.date]) || [];
    autoTable(doc, {
      startY: recentY + 5,
      head: [['Ticket ID', 'Category', 'Status', 'Date Filed']],
      body: recentBody,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`UGIRP_Report_${new Date().getTime()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      const token = window.localStorage.getItem("ugirp.token");
      const res = await apiJson("/api/admin/export-excel", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok || !res.data) {
        alert("Failed to fetch Excel data");
        return;
      }

      // Convert pure aggregated JSON output to worksheet
      const worksheet = XLSX.utils.json_to_sheet(res.data);
      
      // Auto-size columns mathematically
      const colWidths = [
        { wch: 25 }, // Department
        { wch: 35 }, // Location
        { wch: 20 }, // Total Complaints
        { wch: 15 }, // Resolved
        { wch: 15 }, // Emergency Active
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Department Location Metrics");
      
      XLSX.writeFile(workbook, `UGIRP_Dept_Regional_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch(err) {
      alert("Error generating Excel report: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-rose-600 dark:text-rose-500" /> Executive Analytics Hub
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Advanced municipality performance metrics and role-based access pipeline.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportExcel}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
          >
            <Sheet className="h-4 w-4" /> Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* Hero Metrics Hub */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 border-t-4 border-t-indigo-500">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Total Complaints</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.complaints?.total || 0}</h3>
            <FolderKanban className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 border-t-4 border-t-amber-500">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Pending / Active</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {(metrics?.complaints?.pending || 0) + (metrics?.complaints?.inProgress || 0)}
            </h3>
            <Activity className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 border-t-4 border-t-emerald-500">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Resolved Fixed</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics?.complaints?.resolved || 0}</h3>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-rose-50 p-5 shadow-sm dark:border-rose-900/30 dark:bg-rose-950/20 border-t-4 border-t-rose-500">
          <p className="text-xs font-semibold uppercase text-rose-500 dark:text-rose-400 mb-1">Emergency Flags</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-rose-700 dark:text-rose-400">{metrics?.complaints?.emergency || 0}</h3>
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Registered Users</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.users?.total || 0}</h3>
            <Users className="h-5 w-5 text-blue-400" />
          </div>
        </div>

      </div>

      {/* Advanced Rechart Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Bar Chart Categorical */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Complaints By Category</h2>
          <div className="h-72 w-full">
            {metrics?.categories?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Chart 2: Spline Line Trends */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Ticket Volume (Monthly Trends)</h2>
          <div className="h-72 w-full">
            {metrics?.trends?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Line type="monotone" dataKey="complaints" stroke="#ec4899" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">No data available</div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Table 1: Recent Complaints */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Complaints Table</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Assignment</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {metrics?.recentComplaints?.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <button 
                         onClick={() => viewTicketDetails(ticket.ticketId || ticket.id)} 
                         className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                         {ticket.ticketId || ticket.id}
                      </button>
                    </td>
                    <td className="px-6 py-4">{ticket.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold
                        ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.status !== 'Resolved' ? (
                        <select
                          value={ticket.assignedOfficer || ""}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-white/10 dark:text-white"
                        >
                          <option value="">Unassigned</option>
                          {officers.map(off => (
                            <option key={off._id} value={off._id}>{off.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">Closed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500">{ticket.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: User RBAC Grid */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" /> RBAC Permissions
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">USER</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">ROLE</th>
                  <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">PROMOTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {users.slice(0, 5).map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase
                        ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' : 
                          u.role === 'officer' ? 'bg-indigo-100 text-indigo-700' : 
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:border-white/10 dark:text-white"
                      >
                        <option value="citizen">CITIZEN</option>
                        <option value="officer">OFFICER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* TICKET DETAILS MODAL */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Ticket View</h2>
                 <p className="text-xs text-slate-500 font-mono mt-1">{selectedTicketId}</p>
               </div>
               <button onClick={() => setSelectedTicketId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                 <ShieldAlert className="w-5 h-5 opacity-0 absolute" /> {/* Placeholder for alignment */}
                 ✕
               </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               {detailLoading ? (
                 <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div></div>
               ) : ticketDetails ? (
                 <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Issue Overview</h4>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{ticketDetails.title}</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">{ticketDetails.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="border border-slate-100 dark:border-white/5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                         <p className="text-xs text-slate-500">Priority</p>
                         <p className={`font-bold ${ticketDetails.priority === 'Critical' || ticketDetails.priority === 'High' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                           {ticketDetails.priority}
                         </p>
                       </div>
                       <div className="border border-slate-100 dark:border-white/5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                         <p className="text-xs text-slate-500">Location</p>
                         <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{ticketDetails.location}</p>
                       </div>
                    </div>

                    {ticketDetails.media ? (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evidentiary Image Attached</h4>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black max-h-80 flex items-center justify-center">
                          <img src={ticketDetails.media} alt="Evidence" className="max-w-full max-h-80 object-contain" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-sm text-slate-500">
                         No media evidence attached to this ticket.
                      </div>
                    )}
                 </div>
               ) : (
                 <p className="text-center text-slate-500 p-8">Unable to load ticket details.</p>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Ensure Activity component from Lucide is mapped if we haven't imported
function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
