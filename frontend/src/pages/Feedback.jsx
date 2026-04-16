import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { MessageSquareHeart, CheckCircle2, Star, Send, Upload, FileCheck2, X } from "lucide-react";

export default function Feedback() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onSubmit = async (data) => {
    setBusy(true);
    // Simulate network latency for submission
    setTimeout(() => {
      setBusy(false);
      setIsSubmitted(true);
      reset();
      setRating(0);
      setSelectedFile(null);
    }, 1200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const clearFile = (e) => {
    e.preventDefault();
    setSelectedFile(null);
    // Reset the hidden input value so the same file can be re-selected
    const input = document.getElementById("feedback-doc");
    if (input) input.value = "";
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full flex-col items-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-white/5"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Thank you for your Feedback!</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            Your insights help us improve the Urban Grievance Platform. Our team will review your comments shortly.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
          >
            Submit Another Response
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:px-6">
      
      <div className="text-center md:text-left mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
          <MessageSquareHeart className="w-8 h-8 text-indigo-500" /> Platform Feedback
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto md:mx-0">
          How was your experience using our smart civic portal today? Please share your thoughts so we can build a better platform for everyone.
        </p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)} 
        className="flex flex-col gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/5 dark:bg-slate-900"
      >
        
        {/* Rating Section */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <label className="text-base font-semibold text-slate-900 dark:text-white">
            Rate your experience
          </label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 transition-colors duration-200 ${
                    star <= (hoveredRating || rating)
                      ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                      : "fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating === 0 && <p className="text-xs text-amber-500 mt-2 font-medium">Please select a rating to continue</p>}
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">What is your feedback related to?</label>
          <select
            {...register("category")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all appearance-none"
          >
            <option value="general">General Experience</option>
            <option value="ai">AI Image Vision Feature</option>
            <option value="complaint">Complaint Filing Process</option>
            <option value="officer">Officer Dashboard / Resolution</option>
            <option value="bug">Report a Technical Bug</option>
          </select>
        </div>

        {/* Written Feedback */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your comments</label>
          <textarea
            rows={5}
            placeholder="Tell us what you loved, or what we could do better..."
            {...register("comments", { required: "Please tell us your thoughts!" })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:border-white/10 dark:bg-slate-950 dark:text-white transition-all resize-none"
          />
          {errors.comments && <p className="text-xs text-red-500 font-medium">{errors.comments.message}</p>}
        </div>

        {/* Document Upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Complaint Completion Document</label>
          <div className="flex items-center justify-center w-full relative">
            {selectedFile ? (
              /* ── File selected: success state ── */
              <div className="flex items-center justify-between w-full px-4 py-4 border-2 border-emerald-400 dark:border-emerald-500/60 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <div className="flex items-center gap-3 min-w-0">
                  <FileCheck2 className="w-7 h-7 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="ml-3 shrink-0 rounded-full p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* ── No file yet: upload prompt ── */
              <label
                htmlFor="feedback-doc"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 transition ${
                  errors.document ? 'border-red-400 dark:border-red-500/50' : 'border-slate-300 dark:border-white/10'
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-6 h-6 mb-3 ${errors.document ? 'text-red-400' : 'text-slate-400'}`} />
                  <p className="mb-1 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload document</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF, PNG, JPG</p>
                </div>
              </label>
            )}
            <input
              id="feedback-doc"
              type="file"
              className="hidden"
              accept=".pdf,image/*"
              {...register("document", { required: "Please upload a completion document" })}
              onChange={(e) => {
                register("document").onChange(e); // keep react-hook-form in sync
                handleFileChange(e);
              }}
            />
          </div>
          {errors.document && <p className="text-xs text-red-500 font-medium">{errors.document.message}</p>}
        </div>

        {/* Email Context */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
          <input
            type="email"
            placeholder="For follow-up questions..."
            {...register("email", { required: "A valid email is required" })}
            className={`w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 dark:bg-slate-950 dark:text-white transition-all ${errors.email ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10'}`}
          />
          {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          <p className="text-xs text-slate-500 hidden md:block">We will never share your email with third parties.</p>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-end items-center gap-4">
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            Cancel
          </Link>
          <button
            disabled={busy || rating === 0}
            type="submit"
            className="group w-full md:w-auto relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? (
              "Sending..."
            ) : (
              <>
                Submit Feedback <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </motion.form>
    </div>
  );
}
