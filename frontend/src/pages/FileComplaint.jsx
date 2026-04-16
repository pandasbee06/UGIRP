import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Navigation, AlertTriangle, UploadCloud, CheckCircle2, ArrowLeft, Camera, X, MonitorSmartphone, Home } from "lucide-react";
import { apiJson } from "../lib/api";

export default function FileComplaint() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      category: "Pothole Repair",
      location: "",
      description: "",
      media: "",
      isEmergency: false,
      isRepeat: false,
      isSensitiveArea: false
    }
  });

  const locationWatch = watch("location");
  const isEmergencyWatch = watch("isEmergency");

  const [busy, setBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionData, setVisionData] = useState(null);
  
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = import("react").then(React => React.useRef(null));
  const canvasRef = import("react").then(React => React.useRef(null));

  const startCamera = async () => {
    setCameraMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const videoEl = document.getElementById("native-video-capture");
      if (videoEl) {
        videoEl.srcObject = stream;
      }
    } catch (e) {
      alert("Camera permission denied or camera not found on this device.");
      setCameraMode(false);
    }
  };

  const stopCamera = () => {
    const videoEl = document.getElementById("native-video-capture");
    if (videoEl && videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraMode(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("native-video-capture");
    const canvas = document.getElementById("native-canvas-capture");
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      
      setValue("media", base64, { shouldValidate: true });
      stopCamera();
      handleAIVision(base64);
    }
  };
  
  const handleAIVision = async (base64) => {
    setVisionLoading(true);
    setVisionData(null);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      const res = await apiJson("/api/ai/analyze-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { imageBase64: base64, location: watch("location") }
      });
      if (res.ok) {
        setVisionData(res.data);
        setValue("isEmergency", res.data.isEmergency || false);
        setValue("isRepeat", res.data.isRepeat || false);
        setValue("isSensitiveArea", res.data.isSensitiveArea || false);
      }
    } catch (e) {
      console.error("Vision AI failed", e);
    } finally {
      setVisionLoading(false);
    }
  };

  // Auto Geolocation Native API
  const handleDetectLocation = () => {
    setLocating(true);
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const latFixed = lat.toFixed(4);
        const lonFixed = lon.toFixed(4);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          const placeName = data.display_name || "Unknown Location";
          setValue("location", `${placeName} [Lat: ${latFixed}, Lon: ${lonFixed}]`, { shouldValidate: true });
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setValue("location", `Auto-detected GPS [Lat: ${latFixed}, Lon: ${lonFixed}]`, { shouldValidate: true });
        }
        setLocating(false);
      },
      () => {
        setMessage("Unable to retrieve location. Please manually enter your address.");
        setLocating(false);
      }
    );
  };

  const handleAiCategorize = async () => {
    const titleVal = watch("title") || "";
    const descVal = watch("description") || "";
    const merged = titleVal + " " + descVal;

    if (merged.trim().length < 10) {
      alert("Please provide at least a brief title or description for the AI to analyze.");
      return;
    }

    setAiLoading(true);
    try {
      const token = window.localStorage.getItem("ugirp.token");
      const res = await apiJson("/api/ai/analyze-complaint", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { text: merged }
      });
      
      if (res.data) {
        setValue("category", res.data.category, { shouldValidate: true });
        // Priority is now calculated backend-side based on traits, so no direct mapping unless we map AI to these traits.
      }
    } catch (e) {
      alert("AI Analysis temporarily offline.");
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    setMessage("");
    
    try {
      const token = window.localStorage.getItem("ugirp.token");
      
      const submitValues = { ...values };
      if (submitValues.category === "Other" && submitValues.otherCategory) {
        submitValues.category = submitValues.otherCategory;
      }

      const res = await apiJson("/api/complaints/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitValues
      });
      setSuccessData(res);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to submit complaint.");
    } finally {
      setBusy(false);
    }
  });

  if (successData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6"
      >
        <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5 w-full">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Complaint Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Thank you for being a proactive citizen. Your issue has been successfully securely transmitted to civic authorities.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 w-full max-w-sm mb-8 border border-slate-200 dark:border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Ticket Reference ID</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
              {successData.ticketId}
            </p>
          </div>

          {successData.data?.isDuplicate && (
            <div className="mb-8 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Repeated Complaint Detected</p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-200/80">
                    Our AI has detected a similar complaint already filed for this location. We have linked this ticket directly to <span className="font-mono font-bold">{successData.data.linkedTicketId}</span> to prioritize resolution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {successData.data?.recurringIssue && (
            <div className="mb-8 w-full max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <div className="text-left">
                  <p className="text-sm font-bold text-rose-900 dark:text-rose-400">Recurring Issue Escalated</p>
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-200/80">
                    This location has experienced multiple similar complaints in the last 30 days. We have automatically increased the priority to <span className="font-bold">CRITICAL</span> and flagged the Executive Administrator.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Link 
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">File a Complaint</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please provide accurate details to help authorities resolve the issue faster.</p>
      </div>

      {message && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/5 dark:bg-slate-900">
        
        {/* Core Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">Issue Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Complaint Title</label>
              <input
                placeholder="Brief summary of the issue..."
                {...register("title", { required: "Title is required" })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                {...register("category", { required: true })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all appearance-none"
              >
                <option value="Pothole Repair">Roads / Potholes</option>
                <option value="Streetlight Outage">Streetlights / Electrical</option>
                <option value="Garbage Collection">Sanitation / Garbage</option>
                <option value="Water Supply">Water Supply / Pipes</option>
                <option value="Public Disturbance">Public Disturbance / Noise</option>
                <option value="Other">Other Issues</option>
              </select>
              
              <AnimatePresence>
                {watch("category") === "Other" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      placeholder="Please specify the other issue..."
                      {...register("otherCategory", { required: watch("category") === "Other" ? "Please specify the issue category" : false })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all"
                    />
                    {errors.otherCategory && <p className="text-xs text-red-500 mt-1">{errors.otherCategory.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1.5 sm:col-span-2 relative">
              <div className="flex justify-between items-end mb-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Detailed Description</label>
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {aiLoading ? "Analyzing..." : "Auto-Categorize (AI)"}
                </button>
              </div>
              <textarea
                placeholder="Provide as much context as possible..."
                rows={4}
                {...register("description", { required: "Description is required", minLength: 10 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all resize-none"
              />
              {errors.description && <p className="text-xs text-red-500">Provide at least 10 characters describing the issue.</p>}
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">Location</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors disabled:opacity-50"
            >
              {locating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /> : <Navigation className="w-4 h-4" />}
              {locating ? "Acquiring GPS..." : "Auto-detect My Location"}
            </button>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
              <input
                placeholder="Or manually type block address, street, or landmark"
                {...register("location", { required: "Location is absolutely required" })}
                className={`w-full rounded-xl border px-10 py-2.5 outline-none transition-all dark:bg-slate-950 dark:text-white
                  ${locationWatch ? "border-indigo-300 bg-indigo-50/30 dark:border-indigo-500/50 dark:bg-indigo-900/10" : "border-slate-200 bg-slate-50 dark:border-white/10"} 
                  focus:ring-2 focus:ring-indigo-500/50`}
              />
            </div>
            {errors.location && <p className="text-xs text-red-500">A physical or GPS location is required to file a ticket.</p>}
          </div>
        </div>

        {/* Media & Prioritization */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Evidence Upload</label>
              
              {watch("media") ? (
                <div className="border-2 border-slate-200 dark:border-white/10 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Image successfully attached for AI Analysis</p>
                    <button 
                      type="button" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setValue("media", ""); 
                        setVisionData(null); 
                        setValue("isEmergency", false);
                        setValue("isRepeat", false);
                        setValue("isSensitiveArea", false);
                      }} 
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Evidence
                    </button>
                  </div>
                </div>
              ) : cameraMode ? (
                <div className="rounded-xl overflow-hidden border-2 border-indigo-500 bg-black relative">
                  <video id="native-video-capture" autoPlay playsInline className="w-full h-48 object-cover"></video>
                  <canvas id="native-canvas-capture" className="hidden"></canvas>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur text-white px-4 py-2 text-xs font-bold rounded-full hover:bg-white/30">Cancel</button>
                    <button type="button" onClick={capturePhoto} className="bg-indigo-600 border-2 border-white text-white px-6 py-2 text-sm font-bold rounded-full shadow-lg hover:bg-indigo-500 hover:scale-105 transition-all flex items-center gap-2"><Camera className="w-4 h-4"/> Snap Photo</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-slate-200 dark:border-white/10 rounded-xl p-5 hover:bg-slate-50 hover:border-indigo-300 dark:hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 text-slate-500 transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Open Camera</span>
                    </button>
                    
                    <label htmlFor="evidence-upload" className="flex flex-col items-center justify-center gap-2 border-2 border-slate-200 dark:border-white/10 rounded-xl p-5 hover:bg-slate-50 hover:border-sky-300 dark:hover:bg-slate-800/50 transition-all cursor-pointer group">
                      <input 
                        type="file" 
                        id="evidence-upload" 
                        accept="image/jpeg, image/png, video/mp4" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert("File too large. Please select a file under 10MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              setValue("media", reader.result, { shouldValidate: true });
                              handleAIVision(reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-sky-100 group-hover:text-sky-600 dark:group-hover:bg-sky-500/20 text-slate-500 transition-colors">
                        <MonitorSmartphone className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Device</span>
                    </label>
                </div>
              )}

              {/* Vision AI Results Display */}
              <AnimatePresence>
                {visionLoading && (
                  <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 flex items-center gap-3">
                    <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-400" />
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">AI Vision is analyzing the image for hazards...</p>
                  </motion.div>
                )}
                
                {visionData && !visionLoading && (
                   <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                       <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">AI Vision Analysis Complete</p>
                     </div>
                     <p className="text-xs text-indigo-700 dark:text-indigo-200/80 leading-relaxed">{visionData.summary}</p>
                     <div className="flex flex-wrap gap-2 mt-1">
                       <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                         {visionData.priority} Priority
                       </span>
                       {visionData.detectedHazards?.map(h => (
                         <span key={h} className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                           {h}
                         </span>
                       ))}
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue Context</label>
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Controlled</span>
              </div>
              
              <label className={`flex items-start gap-4 rounded-xl border p-4 transition-all pointer-events-none opacity-90
                ${watch("isEmergency") ? 'border-red-500/50 bg-red-50 dark:bg-red-500/10' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950'}`}
              >
                <div className="mt-0.5 flex items-center">
                  <input
                    type="checkbox"
                    disabled
                    checked={watch("isEmergency") || false}
                    className="h-5 w-5 rounded border-slate-300 text-red-600 cursor-not-allowed"
                  />
                  <input type="hidden" {...register("isEmergency")} />
                </div>
                <div>
                  <p className={`font-semibold ${watch("isEmergency") ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                    Confirmed Emergency Hazard
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Determined automatically by AI Vision. Escalated to CRITICAL priority.
                  </p>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={`flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer
                    ${watch("isRepeat") ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-500/10' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800'}`}
                  >
                    <input type="checkbox" {...register("isRepeat")} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                    <span className={`text-sm ${watch("isRepeat") ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Repeat Area Complaint (Manual)
                    </span>
                  </label>
                  <AnimatePresence>
                    {watch("isRepeat") && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <input
                          type="text"
                          placeholder="Previous Ticket ID (CMP-...)"
                          {...register("linkedTicketId", { required: watch("isRepeat") ? "Previous Ticket ID is required" : false })}
                          className="w-full text-sm rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-white placeholder:text-amber-700/50 dark:placeholder:text-amber-400/50 font-mono uppercase"
                        />
                        {errors.linkedTicketId && <p className="text-xs text-red-500 mt-1">{errors.linkedTicketId.message}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <label className={`flex items-center gap-3 rounded-xl border p-3 transition-all pointer-events-none opacity-90
                  ${watch("isSensitiveArea") ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950'}`}
                >
                  <input type="checkbox" disabled checked={watch("isSensitiveArea") || false} className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-not-allowed" />
                  <input type="hidden" {...register("isSensitiveArea")} />
                  <span className={`text-sm ${watch("isSensitiveArea") ? 'font-semibold text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Sensitive Infrastructure Near
                  </span>
                </label>
              </div>
            </div>

            {visionData?.isResidential && (
              <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="p-5 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 col-span-1 sm:col-span-2">
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Residential Zone Impact Detected</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400/90 mt-1">
                      {visionData.residentialInfo} This implies an immediate vulnerability to the civilian population, and your ticket has been flagged securely for accelerated response times.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <button
            disabled={busy}
            type="submit"
            className="group w-full sm:w-auto relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            {busy ? "Filing Ticket..." : "Submit Formal Complaint"}
          </button>
        </div>

      </form>
    </div>
  );
}
