"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, AlertCircle } from "lucide-react";

interface ToastProps {
  open: boolean;
  message: string;
  duration?: number;
  variant?: "success" | "error";
  onClose: () => void;
}

const EXIT_DURATION = 200;

const VARIANT_STYLES = {
  success: {
    bg: "#D1E9E1",
    iconBg: "#00754c",
    text: "#00543a",
    closeText: "#5a9484",
    shadow: "shadow-emerald-900/20",
    icon: Check,
  },
  error: {
    bg: "#F9D8D6",
    iconBg: "#c0392b",
    text: "#7a1f1f",
    closeText: "#c08a87",
    shadow: "shadow-red-900/20",
    icon: AlertCircle,
  },
};

export default function Toast({ open, message, duration = 3000, variant = "success", onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [open]);

  const startTimer = (ms: number) => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(onClose, ms);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      clearTimer();
      return;
    }
    remainingRef.current = duration;
    startTimer(duration);
    return clearTimer;
  }, [open, duration]);

  const handleMouseEnter = () => {
    if (!timerRef.current) return;
    clearTimer();
    remainingRef.current -= Date.now() - startedAtRef.current;
  };

  const handleMouseLeave = () => {
    if (remainingRef.current <= 0) {
      onClose();
      return;
    }
    startTimer(remainingRef.current);
  };

  if (!shouldRender || !mounted) return null;

  const styles = VARIANT_STYLES[variant];
  const Icon = styles.icon;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 left-1/2 z-[100] max-w-[calc(100vw-2.5rem)] sm:max-w-sm transition-all ease-out ${
        isVisible ? "duration-300 opacity-100 -translate-x-1/2 translate-y-0 scale-100" : `duration-200 opacity-0 -translate-x-1/2 -translate-y-3 scale-90`
      }`}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`flex items-start gap-3 shadow-2xl ${styles.shadow} rounded-2xl pl-2.5 pr-4 py-2.5`}
        style={{ backgroundColor: styles.bg }}
      >
        <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: styles.iconBg }}>
          <Icon size={15} strokeWidth={3.5} className="text-white" />
        </div>
        <span className="text-[13.5px] font-bold leading-snug break-words py-1" style={{ color: styles.text }}>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="transition cursor-pointer shrink-0 mt-1.5"
          style={{ color: styles.closeText }}
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}
