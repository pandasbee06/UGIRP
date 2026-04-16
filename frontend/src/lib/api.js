const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function apiJson(path, options = {}) {
  // Auto-attach auth token from localStorage on every request
  const token = window.localStorage.getItem("ugirp.token");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),  // allow callers to override if needed
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      data && typeof data === "object" && data.message
        ? data.message
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function register(payload) {
  return apiJson("/api/auth/register", { method: "POST", body: payload });
}

export async function signup(payload) {
  return apiJson("/api/auth/signup", { method: "POST", body: payload });
}

export async function login(payload) {
  return apiJson("/api/auth/login", { method: "POST", body: payload });
}

export async function verifyOtp(payload) {
  return apiJson("/api/auth/verify-otp", { method: "POST", body: payload });
}

export async function resendOtp(payload) {
  return apiJson("/api/auth/resend-otp", { method: "POST", body: payload });
}

export async function forgotPassword(payload) {
  return apiJson("/api/auth/forgot-password", { method: "POST", body: payload });
}

export async function resetPassword(payload) {
  return apiJson("/api/auth/reset-password", { method: "POST", body: payload });
}

