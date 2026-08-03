"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  isLoading = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#008f5d] hover:bg-[#00754c]";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-6 relative">
        <h3 className="text-lg font-bold text-[#14130F] mb-2">{title}</h3>
        <div className="text-sm text-stone-600 mb-6">{description}</div>

        <div className="flex justify-end gap-3">
          <button
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
