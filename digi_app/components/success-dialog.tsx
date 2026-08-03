"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertTriangle } from "lucide-react";
import { useDialogBehavior } from "@/hooks/use-dialog-behavior";

interface SuccessDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  closeLabel?: string;
  variant?: "success" | "warning";
  onClose: () => void;
}

const VARIANT_STYLES = {
  success: {
    iconBg: "bg-emerald-50 border-emerald-100",
    icon: Check,
    iconColor: "text-[#008f5d]",
    button: "bg-[#008f5d] hover:bg-[#00754c]",
  },
  warning: {
    iconBg: "bg-amber-50 border-amber-100",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700",
  },
};

const EXIT_DURATION = 150;

export default function SuccessDialog({
  open,
  title,
  description,
  closeLabel = "Selesai",
  variant = "success",
  onClose,
}: SuccessDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

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
    if (isVisible) closeRef.current?.focus();
  }, [isVisible]);

  useDialogBehavior(open, onClose);

  if (!shouldRender || !mounted) return null;

  const styles = VARIANT_STYLES[variant];
  const Icon = styles.icon;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-dialog-title"
        className={`w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-6 relative text-center transition-all duration-150 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full border flex items-center justify-center ${styles.iconBg}`}>
          <Icon size={24} className={styles.iconColor} strokeWidth={2.5} />
        </div>
        <h3 id="success-dialog-title" className="text-lg font-bold text-[#14130F] mb-2">
          {title}
        </h3>
        {description && <div className="text-sm text-stone-600 mb-6">{description}</div>}

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={`${description ? "" : "mt-2"} w-full px-4 py-2.5 ${styles.button} text-white text-sm font-semibold rounded-xl transition-all cursor-pointer`}
        >
          {closeLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}
