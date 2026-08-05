"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";

interface TambahAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DUMMY_PROJECTS = [
  { id: 1, nama: "FTTH RANCAMANYAR", status: "AKTIF" },
  { id: 2, nama: "Penyebaran Laptop Daerah Bojongsoang", status: "AKTIF" },
  { id: 3, nama: "QA-Isaaq", status: "AKTIF" },
  { id: 4, nama: "QA-Alif", status: "AKTIF" },
  { id: 5, nama: "QA-Zaini", status: "DONE" },
];

export default function TambahAnggotaModal({ isOpen, onClose }: TambahAnggotaModalProps) {
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleProject = (id: number) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Daftarkan Anggota Baru</h2>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Budi Santoso" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="direktur@digi.com" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Password <span className="text-red-500">*</span></label>
              <input type="password" placeholder="********" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-stone-800">Role <span className="text-red-500">*</span></label>
              <select className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-sm cursor-pointer">
                <option>Karyawan</option>
                <option>Project Manager</option>
                <option>Tim Keuangan</option>
                <option>Direktur / Manajemen</option>
                <option>Superadmin</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Divisi / Jabatan</label>
            <input type="text" placeholder="Contoh: Operasional Lapangan" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-sm" />
          </div>

          {/* Checkbox / Card Grid untuk Assign Proyek */}
          <div className="space-y-2 pt-2">
            <label className="text-[12px] font-bold text-stone-800">Assign ke Proyek (Dapat memilih banyak proyek)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DUMMY_PROJECTS.map((proj) => {
                const isSelected = selectedProjects.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => toggleProject(proj.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected ? "border-[#008f5d] bg-emerald-50/30 shadow-xs" : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12px] font-bold text-stone-800 leading-snug">{proj.nama}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-[#008f5d] border-[#008f5d] text-white" : "border-stone-300 bg-white"
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 mt-2">{proj.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm cursor-pointer"
          >
            Batal
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] rounded-xl hover:bg-[#007a4f] transition shadow-sm cursor-pointer"
          >
            Daftarkan Anggota
          </button>
        </div>

      </div>
    </div>
  );
}