import { useTheme } from "./useTheme";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className={`relative flex h-8 w-14 items-center rounded-full transition-colors duration-500 shadow-inner focus:outline-none ${
        isDark ? "bg-slate-700 border border-slate-600" : "bg-sky-200 border border-sky-300"
      }`}
      aria-label="Toggle Theme"
    >
      {/* Background static icons layer (positioned over the sliding thumb) */}
      <div className="absolute inset-0 flex w-full justify-between items-center px-2 pointer-events-none z-20">
        <Sun 
          className={`h-4 w-4 transition-colors duration-300 ${isDark ? "text-slate-400" : "text-amber-500"}`} 
        />
        <Moon 
          className={`h-4 w-4 transition-colors duration-300 ${isDark ? "text-slate-800" : "text-sky-600/50"}`} 
        />
      </div>
      
      {/* Sliding white thumb layer (goes underneath the icons) */}
      <motion.div
        className="z-10 h-6 w-6 rounded-full bg-white shadow-md mx-1"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

