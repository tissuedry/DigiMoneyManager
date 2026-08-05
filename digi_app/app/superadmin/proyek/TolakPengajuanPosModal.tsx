"use client";

import React, { useState } from "react";

interface TolakPengajuanPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
}

export default function TolakPengajuanPosModal({ isOpen, onClose, count }: TolakPengajuanPosModalProps) {
  const [alasan, setAlasan] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        
        <h2 className="text-[18px] font-bold text-stone-900 mb-1">Tolak Pengajuan</h2>
        <p className="text-[13px] text-stone-500 mb-6">{count} pos dipilih</p>

        <div className="mb-8">
          <label className="block text-[12px] font-bold text-stone-900 mb-2">
            Alasan <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Jelaskan alasan penolakan..."
            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 outline-none focus:border-stone-400 resize-none transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={() => {
              console.log("Ditolak dengan alasan:", alasan);
              onClose();
            }} 
            className="flex-1 py-2.5 text-[13px] font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-black transition cursor-pointer"
          >
            Kirim Penolakan
          </button>
        </div>

      </div>
    </div>
  );
}