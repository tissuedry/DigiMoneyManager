"use client";

import React, { useState } from "react";
import { X, Search, UploadCloud } from "lucide-react";

interface AjukanRealisasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export default function AjukanRealisasiModal({
  isOpen,
  onClose,
  projectName,
}: AjukanRealisasiModalProps) {
  const [searchKet, setSearchKet] = useState("");
  const [namaRealisasi, setNamaRealisasi] = useState("Gramedia Merdeka");
  const [nominal, setNominal] = useState("Rp 450.000");
  const [catatan, setCatatan] = useState(
    "Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site."
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[720px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Ajukan Realisasi</h2>
            <p className="text-[12px] text-stone-500 mt-0.5">{projectName || "Pembangunan Gudang Cikarang Fase 2"}</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-[12px]">
          
          {/* Input Keterangan Pencarian */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800">
              Keterangan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchKet}
                onChange={(e) => setSearchKet(e.target.value)}
                placeholder="Cari keterangan..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-[12px] outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition shadow-xs"
              />
            </div>
          </div>

          {/* Breadcrumb Path Pos */}
          <div className="text-[11px] text-stone-500 font-medium bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            <span className="font-bold text-stone-400">MAIN</span> · Biaya Produksi Proyek <span className="text-stone-300">›</span> <span className="font-bold text-stone-400">SUB</span> · Biaya Garansi <span className="text-stone-300">›</span> <span className="font-bold text-stone-400">KET</span> · <span className="font-bold text-stone-800">Gaji Personil</span>
          </div>

          {/* Form Grid Nama & Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block font-bold text-stone-800">
                Nama Realisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaRealisasi}
                onChange={(e) => setNamaRealisasi(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-[12px] font-medium outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-stone-800">
                Nominal (IDR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-[12px] font-medium outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition shadow-xs"
              />
            </div>
          </div>

          {/* Catatan Area */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-800">Catatan</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 text-[12px] outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition shadow-xs resize-none"
            />
          </div>

          {/* Upload Bukti Dropzone */}
          <div className="border-2 border-dashed border-stone-200 hover:border-stone-300 rounded-2xl p-5 text-center transition cursor-pointer bg-stone-50/50 flex items-center justify-center gap-2.5 text-stone-500">
            <UploadCloud size={18} className="text-stone-400" />
            <span className="font-medium">Klik atau drop untuk upload bukti (opsional)</span>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer shadow-xs"
          >
            Batal
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            + Ajukan
          </button>
        </div>

      </div>
    </div>
  );
}