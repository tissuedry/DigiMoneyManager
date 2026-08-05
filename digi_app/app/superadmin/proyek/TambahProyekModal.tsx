"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface TambahProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TambahProyekModal({ isOpen, onClose }: TambahProyekModalProps) {
  const [status, setStatus] = useState("Active");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[550px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <h2 className="text-lg font-bold text-stone-900 leading-tight">Tambah Proyek Baru</h2>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Nama Proyek <span className="text-red-500">*</span></label>
            <input type="text" placeholder="cth. Pembangunan Gudang Surabaya" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Deskripsi Proyek</label>
            <textarea rows={3} placeholder="Deskripsi singkat tujuan dan lingkup proyek..." className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Status Proyek</label>
            <div className="flex flex-wrap gap-2">
              {["Active", "Planning", "Done", "Canceled"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold border transition cursor-pointer ${
                    status === s ? "bg-emerald-50 text-[#008f5d] border-[#008f5d]" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Done & Canceled dapat diubah via Edit Proyek</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Tanggal Mulai <span className="text-red-500">*</span></label>
              <input type="date" className="w-full border border-stone-200 rounded-xl px-4 py-2 text-[13px] outline-none focus:border-[#008f5d]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Tanggal Selesai (Opsional)</label>
              <input type="date" className="w-full border border-stone-200 rounded-xl px-4 py-2 text-[13px] outline-none focus:border-[#008f5d]" />
            </div>
          </div>
          <span className="text-[10px] text-stone-400 block">* wajib diisi</span>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Batal</button>
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-black transition cursor-pointer flex items-center gap-1.5">+ Simpan Proyek</button>
        </div>

      </div>
    </div>
  );
}