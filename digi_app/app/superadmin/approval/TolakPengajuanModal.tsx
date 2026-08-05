"use client";

import React, { useState } from "react";

interface TolakPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName?: string;
  pengaju?: string;
  nominal?: string;
  onSubmit?: (alasan: string) => void;
}

export default function TolakPengajuanModal({
  isOpen,
  onClose,
  itemName = "Gramedia Merdeka",
  pengaju = "Alif ihsan",
  nominal = "Rp 150.000",
  onSubmit
}: TolakPengajuanModalProps) {
  const [alasan, setAlasan] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-7 relative">
          
          {/* Header */}
          <h2 className="text-[20px] font-bold text-stone-900 leading-tight">Tolak Pengajuan</h2>
          <p className="text-[14px] text-stone-500 mt-1.5 mb-6">
            {itemName} · {pengaju} · {nominal}
          </p>

          {/* Form Textarea */}
          <div className="space-y-2.5 mb-8">
            <label className="block text-[14px] font-bold text-stone-900">
              Alasan <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Jelaskan alasan penolakan..."
              className="w-full px-4 py-3.5 bg-white border border-stone-200 rounded-2xl text-stone-800 text-[14px] outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition resize-none shadow-sm"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-[14px] font-bold text-stone-800 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition cursor-pointer shadow-sm"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (onSubmit) onSubmit(alasan);
                onClose();
              }}
              className="flex-1 py-3.5 text-[14px] font-bold text-white bg-black rounded-2xl hover:bg-stone-800 transition cursor-pointer shadow-sm"
            >
              Kirim Penolakan
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}