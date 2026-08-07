"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useDialogBehavior } from "@/hooks/use-dialog-behavior";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "default";
  maxWidthClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const EXIT_DURATION = 150;

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  isLoading = false,
  variant = "default",
  maxWidthClass = "max-w-md",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

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
    if (isVisible) cancelRef.current?.focus();
  }, [isVisible]);

  useDialogBehavior(open, () => {
    if (!isLoading) onCancel();
  });

  if (!shouldRender || !mounted) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#008f5d] hover:bg-[#00754c]";

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => !isLoading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`w-full ${maxWidthClass} bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-6 relative transition-all duration-150 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-2">
          {variant === "danger" && (
            <div className="w-9 h-9 shrink-0 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" strokeWidth={2.5} />
            </div>
          )}
          <h3 id="confirm-dialog-title" className="text-lg font-bold text-[#14130F]">
            {title}
          </h3>
        </div>
        <div className="text-sm text-stone-600 mb-6">{description}</div>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-stone-200 hover:bg-gray-50 text-sm font-semibold rounded-xl text-[#6A6660] cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 ${confirmClasses} disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
