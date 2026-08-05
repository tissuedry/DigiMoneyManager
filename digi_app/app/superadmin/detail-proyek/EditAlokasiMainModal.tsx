"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditAlokasiMainModalProps {
  isOpen: boolean;
  onClose: () => void;
  mainTitle?: string;
  totalProjectValue?: number; // Contoh: 4590000000 (Rp 4.59 M)
  initialAllocation?: number; // Alokasi awal item ini
  onSave?: (newValue: number) => void;
}

export default function EditAlokasiMainModal({
  isOpen,
  onClose,
  mainTitle = "Biaya Produksi Proyek",
  totalProjectValue = 4590000000,
  initialAllocation = 1800000000,
  onSave,
}: EditAlokasiMainModalProps) {
  const [allocation, setAllocation] = useState<number>(initialAllocation);
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAllocation(initialAllocation);
      setInputValue(formatRupiah(initialAllocation));
    }
  }, [isOpen, initialAllocation]);

  if (!isOpen) return null;

  // Sisa nilai proyek yang belum dialokasikan (Total Proyek - Alokasi Saat Ini)
  const remainingValue = totalProjectValue - allocation;
  const isOverBudget = remainingValue < 0;

  // Helper format ke Rupiah string (misal: Rp 1.800.000.000)
  function formatRupiah(num: number): string {
    return "Rp " + num.toLocaleString("id-ID");
  }

  // Handle perubahan input text manual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const num = raw === "" ? 0 : parseInt(raw, 10);
    setAllocation(num);
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setInputValue(formatRupiah(allocation));
  };

  // Handle perubahan slider (range 0 sampai totalProjectValue)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    setAllocation(num);
    setInputValue(formatRupiah(num));
  };

  // Persentase untuk warna progress bar slider (Alokasi Baru vs Sisa Nilai Proyek)
  const percentage = Math.min(Math.max((allocation / totalProjectValue) * 100, 0), 100);

  const handleSave = () => {
    if (onSave) onSave(allocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[540px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-base font-bold text-stone-900 leading-tight">Edit Alokasi Main</h2>
            <div className="flex items-center gap-1.5 text-[12px] text-stone-500 mt-0.5">
              <span className="font-bold text-stone-700">MAIN</span>
              <span>·</span>
              <span>{mainTitle}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-5 text-[12px]">
          
          {/* Info Cards atas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Total Nilai Proyek Teralokasi</p>
              <p className="text-[14px] font-bold text-stone-900 tabular-nums">{formatRupiah(allocation)}</p>
            </div>
            <div className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-1 shadow-xs">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Sisa Nilai Proyek Belum Dialokasikan</p>
              <p className={`text-[14px] font-bold tabular-nums ${isOverBudget ? "text-rose-600" : "text-stone-900"}`}>
                {formatRupiah(remainingValue)}
              </p>
            </div>
          </div>

          {/* Bagian Geser / Ketik */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wide">
              Ketik atau Geser untuk Mengurangi / Menambah Alokasi
            </label>

            {/* Input Angka */}
            <div>
              <span className="text-[11px] font-medium text-stone-500 mb-1 block">Alokasi baru</span>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-[13px] font-bold text-stone-800 outline-none transition-all tabular-nums shadow-xs ${
                  isOverBudget 
                    ? "border-rose-300 text-rose-600 focus:ring-2 focus:ring-rose-100" 
                    : "border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                }`}
              />
            </div>

            {/* Custom Interactive Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="relative w-full h-8 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60 shadow-inner">
                  <div 
                    className="h-full bg-[#008f5d] transition-all duration-75" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {/* Native Range Input transparan di atas track */}
                <input
                  type="range"
                  min={0}
                  max={totalProjectValue}
                  step={1000000} // step 1 juta
                  value={allocation}
                  onChange={handleSliderChange}
                  className="absolute inset-w-full w-full h-8 opacity-0 cursor-pointer z-10"
                />
              </div>

              {/* Legend Indikator Warna */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block shadow-xs" />
                  <span>Alokasi Baru</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#008f5d] rounded-sm inline-block shadow-xs" />
                  <span>Sisa Nilai Proyek</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-end gap-2.5">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-[12px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer shadow-xs"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-[12px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer shadow-xs"
          >
            Terapkan
          </button>
        </div>

      </div>
    </div>
  );
}