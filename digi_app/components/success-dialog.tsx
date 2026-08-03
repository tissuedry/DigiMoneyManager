"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

interface SuccessDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  closeLabel?: string;
  onClose: () => void;
}

export default function SuccessDialog({
  open,
  title,
  description,
  closeLabel = "Selesai",
  onClose,
}: SuccessDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-6 relative text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Check size={24} className="text-[#008f5d]" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-bold text-[#14130F] mb-2">{title}</h3>
        {description && <div className="text-sm text-stone-600 mb-6">{description}</div>}

        <button
          type="button"
          onClick={onClose}
          className={`${description ? "" : "mt-2"} w-full px-4 py-2.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-sm font-semibold rounded-xl transition-all cursor-pointer`}
        >
          {closeLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}
