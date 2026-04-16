import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const token = window.localStorage.getItem("ugirp.token");
  const location = useLocation();

  if (!token) {
    // Not logged in, redirect to login page and preserve the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    // Basic JWT decoding to extract role without verifying signature
    // Since this is frontend, true API security relies on the backend middleware
    const payload = JSON.parse(atob(token.split(".")[1]));
    
    // If no specific roles are required, allow any authenticated user
    if (allowedRoles.length === 0) {
      return <Outlet />;
    }

    // Role-based authorization
    if (allowedRoles.includes(payload.role)) {
      return <Outlet />;
    } else {
      // Authenticated but unauthorized
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
            <svg className="h-12 w-12 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 max-w-md text-slate-600 dark:text-slate-400">
            You don't have permission to access this page. This area requires {allowedRoles.join(" or ")} privileges.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go Back
          </button>
        </div>
      );
    }
  } catch (error) {
    // Invalid or corrupted token
    console.error("Failed to decode token", error);
    window.localStorage.removeItem("ugirp.token");
    return <Navigate to="/login" replace />;
  }
}
