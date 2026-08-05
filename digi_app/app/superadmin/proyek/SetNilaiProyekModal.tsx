"use client";

import React, { useState } from "react";
import { X, Trash2 } from "lucide-react";

interface SetNilaiProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
}

export default function SetNilaiProyekModal({ isOpen, onClose, projectData }: SetNilaiProyekModalProps) {
  const [posList, setPosList] = useState([{ nama: "", alokasi: "" }]);

  if (!isOpen || !projectData) return null;

  const addPos = () => {
    setPosList([...posList, { nama: "", alokasi: "" }]);
  };

  const removePos = (index: number) => {
    setPosList(posList.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Set Nilai Proyek</h2>
            <p className="text-[12px] text-stone-500 mt-0.5">{projectData.nama}</p>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Total Nilai Proyek (Rupiah) <span className="text-red-500">*</span></label>
            <input type="text" placeholder="cth. 850000000" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-stone-800">Breakdown Pos Anggaran Main</label>
              <button 
                type="button" 
                onClick={addPos}
                className="px-3 py-1.5 bg-emerald-50 text-[#008f5d] text-[11px] font-bold rounded-lg hover:bg-emerald-100 transition cursor-pointer"
              >
                + Tambah Main
              </button>
            </div>

            <div className="space-y-2">
              {posList.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Nama pos main (cth. Akomodasi & Transportasi...)" 
                    className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2 text-[12px] outline-none focus:border-[#008f5d]" 
                  />
                  <input 
                    type="text" 
                    placeholder="Alokasi (Rp)" 
                    className="w-44 border border-stone-200 rounded-xl px-3.5 py-2 text-[12px] outline-none focus:border-[#008f5d]" 
                  />
                  {posList.length > 1 && (
                    <button onClick={() => removePos(index)} className="p-2 text-stone-400 hover:text-red-600 transition cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-stone-400 block">* wajib diisi</span>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Batal</button>
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-black transition cursor-pointer">Simpan Nilai</button>
        </div>

      </div>
    </div>
  );
}