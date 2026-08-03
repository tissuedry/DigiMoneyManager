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

export default function Toast({ open, message, duration = 3000, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 bg-white shadow-lg shadow-stone-900/10 rounded-full pl-2 pr-3 py-2 max-w-md">
        <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={13} className="text-white" strokeWidth={3} />
        </div>
        <span className="text-[13px] font-medium text-[#14130F] whitespace-nowrap">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-300 hover:text-stone-500 transition cursor-pointer shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>,
    document.body
  );
}
