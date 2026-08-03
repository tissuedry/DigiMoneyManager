"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

interface ToastProps {
  open: boolean;
  message: string;
  duration?: number;
  onClose: () => void;
}

const EXIT_DURATION = 200;

export default function Toast({ open, message, duration = 3000, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!shouldRender || !mounted) return null;

  return createPortal(
    <div
      className={`fixed top-5 left-1/2 z-[100] transition-all ease-out ${
        isVisible ? "duration-300 opacity-100 -translate-x-1/2 translate-y-0 scale-100" : `duration-200 opacity-0 -translate-x-1/2 -translate-y-3 scale-90`
      }`}
    >
      <div
        className="flex items-center gap-3 shadow-2xl shadow-emerald-900/20 rounded-full pl-2.5 pr-4 py-2.5"
        style={{ backgroundColor: '#D1E9E1' }}
      >
        <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00754c' }}>
          <Check size={15} strokeWidth={3.5} className="text-white" />
        </div>
        <span className="text-[13.5px] font-bold whitespace-nowrap" style={{ color: '#00543a' }}>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="transition cursor-pointer shrink-0"
          style={{ color: '#5a9484' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
}
