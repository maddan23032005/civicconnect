import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

/* ---------------- Button ---------------- */

const BUTTON_VARIANTS = {
  primary:
    "bg-navy-500 text-white hover:bg-navy-400 shadow-lg shadow-navy-500/25",
  saffron:
    "bg-saffron-500 text-ink-950 font-semibold hover:bg-saffron-400 shadow-lg shadow-saffron-500/25",
  ghost:
    "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
  outline:
    "border border-navy-500/50 text-navy-300 hover:bg-navy-500/10",
  danger:
    "bg-rose-500 text-white hover:bg-rose-500/85",
};

const BUTTON_SIZES = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
}

/* ---------------- Card ---------------- */

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.25 }}
      className={`glass rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Input ---------------- */

export function Input({ label, error, hint, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border bg-ink-800/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 ${
          error ? "border-rose-500/60" : "border-white/10"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, error, hint, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        className={`w-full resize-y rounded-xl border bg-ink-800/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 ${
          error ? "border-rose-500/60" : "border-white/10"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3 text-slate-100 outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

/* ---------------- Badge ---------------- */

const BADGE_TONES = {
  neutral: "bg-white/8 text-slate-300 border-white/12",
  navy: "bg-navy-500/15 text-navy-300 border-navy-500/30",
  saffron: "bg-saffron-500/15 text-saffron-400 border-saffron-500/30",
  mint: "bg-mint-500/15 text-mint-500 border-mint-500/30",
  rose: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

export function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const SEVERITY_TONE = {
  critical: "rose",
  high: "saffron",
  medium: "navy",
  low: "neutral",
};

export const STATUS_TONE = {
  submitted: "neutral",
  triaged: "navy",
  in_progress: "saffron",
  resolved: "mint",
  rejected: "rose",
};

/* ---------------- Skeleton ---------------- */

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/* ---------------- Empty state ---------------- */

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-white/5 p-4">
          <Icon size={28} className="text-slate-500" />
        </div>
      )}
      <h3 className="mb-1.5 font-display text-lg font-semibold text-slate-200">
        {title}
      </h3>
      {message && <p className="mb-5 max-w-sm text-sm text-slate-500">{message}</p>}
      {action}
    </div>
  );
}

/* ---------------- Section heading ---------------- */

export function SectionHeading({ eyebrow, title, subtitle, center = false }) {
  return (
    <div className={`mb-12 ${center ? "mx-auto max-w-2xl text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-saffron-500">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 leading-relaxed text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
