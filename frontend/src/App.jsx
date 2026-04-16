import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FileComplaint from "./pages/FileComplaint";
import TrackComplaint from "./pages/TrackComplaint";
import ComplaintMap from "./pages/ComplaintMap";
import Chatbot from "./pages/Chatbot";
import ComplaintHistory from "./pages/ComplaintHistory";
import Feedback from "./pages/Feedback";
import { login, register as registerUser, verifyOtp } from "./lib/api";

function About() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">About</h2>
      <p className="text-slate-600 dark:text-slate-300">
        This is the starter project structure. Add your pages and API integration next.
      </p>
      <Link className="text-sm text-sky-600 hover:underline dark:text-sky-300" to="/">
        Back
      </Link>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "", aadhaar: "" },
  });
  
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = handleSubmit(async (values) => {

    setBusy(true);
    setMessage("");
    try {
      const res = await login({ email: values.email, password: values.password });
      window.localStorage.setItem("ugirp.token", res.token);
      setMessage(`Welcome ${res.user?.name || "user"}! Login successful.`);
      if (res.user?.role === "admin") {
        navigate("/admin-dashboard");
      } else if (res.user?.role === "officer") {
        navigate("/officer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Login</h2>
      <p className="text-slate-600 dark:text-slate-300">Sign in with your registered email and password.</p>
      <form onSubmit={onSubmit} className="max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
        <input
          placeholder="Email"
          type="email"
          {...register("email", { required: "Email is required" })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
        <input
          placeholder="Password"
          type="password"
          {...register("password", { required: "Password is required" })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.password ? <p className="text-xs text-red-500">{errors.password.message}</p> : null}
        <input
          placeholder="Aadhaar (UI only)"
          type="text"
          {...register("aadhaar")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />

        <button
          disabled={busy}
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
        >
          {busy ? "Signing in..." : "Login"}
        </button>
        {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
      </form>
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      role: "citizen",
      aadhaar: "",
    },
  });
  const email = watch("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const onSignup = handleSubmit(async (values) => {
    setBusy(true);
    setMessage("");
    try {
      const res = await registerUser({
        name: values.fullName,
        email: values.email,
        mobile: values.mobile,
        password: values.password,
        role: values.role,
        aadhaar: values.aadhaar,
      });
      // OTP is removed, user is instantly verified
      window.localStorage.setItem("ugirp.token", res.token);
      setMessage(res.message || "Signup successful! Returning to Dashboard...");
      if (res.user?.role === "admin") {
        navigate("/admin-dashboard");
      } else if (res.user?.role === "officer") {
        navigate("/officer-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Signup</h2>
      <p className="text-slate-600 dark:text-slate-300">Create your UGIRP account securely.</p>
      <form onSubmit={onSignup} className="max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
        <input
          placeholder="Full name"
          type="text"
          {...register("fullName", { required: "Full name is required" })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.fullName ? <p className="text-xs text-red-500">{errors.fullName.message}</p> : null}
        <input
          placeholder="Email"
          type="email"
          {...register("email", { required: "Email is required" })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.email ? <p className="text-xs text-red-500">{errors.email.message}</p> : null}
        <input
          placeholder="Mobile"
          type="tel"
          {...register("mobile", { required: "Mobile is required" })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.mobile ? <p className="text-xs text-red-500">{errors.mobile.message}</p> : null}
        <input
          placeholder="Aadhaar (UI)"
          type="text"
          {...register("aadhaar")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        <input
          placeholder="Password"
          type="password"
          {...register("password", { required: "Password is required", minLength: 6 })}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring dark:border-white/10 dark:bg-slate-950"
        />
        {errors.password ? <p className="text-xs text-red-500">Password must be at least 6 characters</p> : null}
        <button
          disabled={busy}
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 w-full mt-2"
        >
          {busy ? "Please wait..." : "Create Account & Login"}
        </button>
        {message ? <p className="text-sm text-center text-slate-600 dark:text-slate-300 py-2">{message}</p> : null}
      </form>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/map" element={<ComplaintMap />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/file-complaint" element={<FileComplaint />} />
          <Route path="/history" element={<ComplaintHistory />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>

      <Footer />
    </div>
  );
}
