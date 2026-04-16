import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { apiJson } from "../lib/api";

const linkBase =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-white";

const linkActive = "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white";

export default function Navbar() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const dropdownRef = useRef(null);

  const isAuthenticated = !!window.localStorage.getItem("ugirp.token");

  // Decode role from JWT (no lib needed — frontend only, signature not verified here)
  const getUserRole = () => {
    const token = window.localStorage.getItem("ugirp.token");
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]))?.role ?? null;
    } catch { return null; }
  };
  const userRole = getUserRole();
  const dashboardPath =
    userRole === "admin" ? "/admin-dashboard" :
    userRole === "officer" ? "/officer-dashboard" :
    "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiJson("/api/notifications");
      if (res.ok) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => n.isNew).length);
      }
    } catch (e) {
      console.error("Failed to load notifications");
    }
  };

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await apiJson("/api/notifications/read", { method: "PUT" });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    } catch (e) { }
  };

  const handleDropdownToggle = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      markAsRead();
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("ugirp.token");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <span className="text-sm font-bold">U</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">UGIRP</div>
            <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Unified Grievance Portal
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
            Home
          </NavLink>
          <a href="/#features" className={linkBase}>
            Features
          </a>
          <NavLink to="/track" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
            Track Status
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
            Live Map
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
            AI Assistant
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
            Feedback
          </NavLink>
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
                Login
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
                Signup
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">

          {/* Dashboard Button */}
          {isAuthenticated && (
            <Link
              to={dashboardPath}
              className="hidden sm:inline-flex items-center rounded-xl bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 shadow-sm border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 dark:border-indigo-500/20"
            >
              Dashboard
            </Link>
          )}

          {/* Notification Bell */}
          {isAuthenticated && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleDropdownToggle}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 dark:border-white/5">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1 space-y-1 mt-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`rounded-xl p-3 text-sm transition-colors ${n.isNew ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <div className="font-semibold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="ml-2 hidden items-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/30 dark:bg-red-500/10 dark:hover:bg-red-500/20 md:flex"
            >
              Logout
            </button>
          )}

          <div className="md:hidden">
            <a
              href="/#features"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-white/5"
            >
              Features
            </a>
          </div>
          {/* <ThemeToggle /> */}
        </div>
      </div>

      <div className="border-t border-slate-200/60 bg-white/60 px-4 py-2 dark:border-white/10 dark:bg-slate-950/40 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <NavLink to="/" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Home
          </NavLink>
          <NavLink to="/track" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Track
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Map
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Assistant
          </NavLink>
          <NavLink to="/feedback" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
            Feedback
          </NavLink>
          {isAuthenticated && (
            <NavLink to={dashboardPath} className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
              Dashboard
            </NavLink>
          )}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                Login
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => `whitespace-nowrap text-xs ${isActive ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                Signup
              </NavLink>
            </>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="whitespace-nowrap text-xs font-semibold text-red-600 dark:text-red-400"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
