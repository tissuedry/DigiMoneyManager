"use client";

import React from "react";
import { X, Trash2 } from "lucide-react";

interface EditNilaiProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
}

const DUMMY_BREAKDOWN = [
  { nama: "PEKERJAAN PERSIAPAN & STRUKTUR BAWAH", alokasi: "Rp 728.000.000" },
  { nama: "PEKERJAAN STRUKTUR UTAMA & DINDING", alokasi: "Rp 480.000.000" },
  { nama: "PEKERJAAN ATAP & DRAINASE GUDANG", alokasi: "Rp 280.000.000" },
  { nama: "PEKERJAAN MEKANIKAL & ELEKTRIKAL (MEP)", alokasi: "Rp 80.000.000" },
  { nama: "PEKERJAAN EXTERNAL & PENGUJIAN", alokasi: "Rp 50.000.000" },
];

export default function EditNilaiProyekModal({ isOpen, onClose, projectData }: EditNilaiProyekModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Edit Nilai Proyek</h2>
            <p className="text-[12px] text-stone-500 mt-0.5">{projectData?.nama}</p>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-stone-800">Total Nilai Proyek (Rupiah) <span className="text-red-500">*</span></label>
            <input type="text" defaultValue="Rp 6.200.000.000" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] font-bold text-stone-800 outline-none focus:border-[#008f5d]" />
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <div className="flex justify-between text-[12px] font-bold text-stone-700">
              <span>Realisasi Anggaran</span>
              <span className="text-[#008f5d]">35%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#008f5d] w-[35%]" />
            </div>
            <div className="flex justify-between text-[11px] text-stone-500 font-medium">
              <span>Nilai Proyek Rp 6.2 M</span>
              <span>Realisasi Rp 2.2 M</span>
              <span>Sisa Rp 4.0 M</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-stone-900">Breakdown Pos Anggaran Main</h3>
              <button type="button" className="px-3 py-1.5 bg-emerald-50 text-[#008f5d] text-[11px] font-bold rounded-lg hover:bg-emerald-100 transition cursor-pointer">+ Tambah Main</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Total Pos Teralokasi</span>
                <p className="text-[13px] font-bold text-stone-800">Rp 6.200.000.000</p>
              </div>
              <div>
                <span className="text-[10px] text-red-600 font-bold uppercase">Kelebihan Alokasi (Overbudget)</span>
                <p className="text-[13px] font-bold text-red-600">Rp -4.590.000.000</p>
              </div>
            </div>

            <div className="space-y-2">
              {DUMMY_BREAKDOWN.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" defaultValue={item.nama} className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-stone-50 outline-none" />
                  <input type="text" defaultValue={item.alokasi} className="w-40 border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-stone-50 outline-none font-medium" />
                  <button className="p-2 text-stone-400 hover:text-red-600 transition cursor-pointer"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer">Batal</button>
          <button onClick={onClose} className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-black transition cursor-pointer">Simpan Perubahan</button>
        </div>

      </div>
    </div>
  );
}