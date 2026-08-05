"use client";

import React, { useState } from "react";
import { X, ChevronRight, ChevronDown, Plus } from "lucide-react";

interface AjukanPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export default function AjukanPosModal({ isOpen, onClose, projectName }: AjukanPosModalProps) {
  const [activeSubAccordion, setActiveSubAccordion] = useState(true);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [isAddingKet, setIsAddingKet] = useState(false);
  const [subName, setSubName] = useState("");
  const [ketName, setKetName] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[750px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Ajukan Pos</h2>
            <p className="text-[12px] text-stone-500 mt-0.5">{projectName || "Pembangunan Gudang Cikarang Fase 2"}</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Konten */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          
          {/* Card Realisasi Anggaran */}
          <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-[12px] font-bold text-stone-800">
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

          <p className="text-[12px] text-stone-600 font-medium">
            Anggaran Proyek — klik <b>"+ Tambah"</b> untuk mengajukan Sub / Keterangan baru
          </p>

          {/* Hierarki Anggaran Proyek */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
            
            {/* MAIN: Material Konstruksi */}
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-[#fdfcf9]">
              <span className="text-[13px] font-bold text-stone-900">Material Konstruksi</span>
              <span className="text-[13px] font-bold text-stone-600">Rp 2.4 M</span>
            </div>

            <div className="p-4 space-y-4">
              
              {/* SUB: Beton & Semen */}
              <div className="space-y-3">
                <div 
                  onClick={() => setActiveSubAccordion(!activeSubAccordion)}
                  className="flex justify-between items-center cursor-pointer text-[13px] font-bold text-stone-800"
                >
                  <div className="flex items-center gap-2">
                    {activeSubAccordion ? <ChevronDown size={14} className="text-stone-500" /> : <ChevronRight size={14} className="text-stone-500" />}
                    <span>Beton & Semen</span>
                  </div>
                  <span className="text-stone-600">Rp 1.2 M</span>
                </div>

                {activeSubAccordion && (
                  <div className="pl-6 space-y-2.5 pt-1">
                    <div className="flex justify-between text-[12px] text-stone-600">
                      <span>Semen Portland 500 sak</span>
                      <span className="text-stone-400 font-medium">Rp 400.0 jt</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-stone-600">
                      <span>Beton Ready Mix K-350</span>
                      <span className="text-stone-400 font-medium">Rp 600.0 jt</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-stone-600">
                      <span>Bahan aditif & campuran</span>
                      <span className="text-stone-400 font-medium">Rp 200.0 jt</span>
                    </div>

                    {/* Jika Keterangan Baru Ditambahkan */}
                    {submittedCount >= 2 && (
                      <div className="flex justify-between items-center text-[12px] text-stone-700 bg-emerald-50/40 p-2 rounded-xl">
                        <span className="font-medium">Keterangan Baru: <b>Batu Bata Tipe A</b></span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#007a4f] text-[10px] font-bold rounded">MENUNGGU</span>
                          <span className="font-bold">Rp 20 rb</span>
                        </div>
                      </div>
                    )}

                    {/* Form Tambah Keterangan */}
                    {isAddingKet ? (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3 mt-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Batu Bata Tipe A"
                            value={ketName}
                            onChange={(e) => setKetName(e.target.value)}
                            className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                          />
                          <input 
                            type="text" 
                            placeholder="Rp 20.000" 
                            className="w-32 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setSubmittedCount(2); setIsAddingKet(false); }}
                            className="px-3 py-1 bg-[#008f5d] text-white text-[11px] font-bold rounded-lg hover:bg-[#007a4f] transition cursor-pointer"
                          >
                            Simpan Draft
                          </button>
                          <button onClick={() => setIsAddingKet(false)} className="text-[11px] text-stone-500 hover:text-stone-700 font-medium">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingKet(true)}
                        className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition pt-1 cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={3} /> Tambah Keterangan
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SUB Lainnya */}
              <div className="flex justify-between items-center text-[13px] font-bold text-stone-800 pt-1 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <ChevronRight size={14} className="text-stone-400" />
                  <span>Baja & Besi</span>
                </div>
                <span className="text-stone-600">Rp 900.0 jt</span>
              </div>

              {/* Jika Sub Baru Ditambahkan */}
              {submittedCount >= 1 && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-stone-800">Sub Baru: <span className="text-[#008f5d]">Batu Bata</span></span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-[#007a4f] text-[10px] font-bold rounded">MENUNGGU</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-white border border-stone-200 rounded-lg text-[11px]">
                      <span className="text-stone-400 block">Total SUB Teralokasi</span>
                      <b className="text-stone-800">Rp 0</b>
                    </div>
                    <div className="p-2.5 bg-white border border-stone-200 rounded-lg text-[11px]">
                      <span className="text-stone-400 block">Sisa SUB Belum Dialokasikan</span>
                      <b className="text-stone-800">Rp 4.590.000.000</b>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Keterangan Baru" className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none" />
                    <input type="text" placeholder="Alokasi" className="w-28 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setSubmittedCount(2)} className="px-3 py-1 bg-[#008f5d] text-white text-[11px] font-bold rounded-lg">Simpan Draft</button>
                    <button onClick={() => setSubmittedCount(0)} className="text-[11px] text-stone-500">Batal</button>
                  </div>
                </div>
              )}

              {/* Form Tambah Sub */}
              {isAddingSub ? (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nama Sub baru" 
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none focus:border-[#008f5d]"
                    />
                    <input type="text" placeholder="Alokasi" className="w-28 border border-stone-200 rounded-lg px-3 py-1.5 text-[12px] bg-white outline-none" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSubmittedCount(1); setIsAddingSub(false); }}
                      className="px-3 py-1 bg-[#008f5d] text-white text-[11px] font-bold rounded-lg hover:bg-[#007a4f] transition cursor-pointer"
                    >
                      Simpan Draft
                    </button>
                    <button onClick={() => setIsAddingSub(false)} className="text-[11px] text-stone-500 font-medium">Batal</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingSub(true)}
                  className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition cursor-pointer pt-1"
                >
                  <Plus size={13} strokeWidth={3} /> Tambah Sub
                </button>
              )}

            </div>
          </div>

          {/* Banner Status Pengajuan */}
          {submittedCount > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[12px] font-bold text-[#117a5b]">
              <span>{submittedCount} pos menunggu diajukan</span>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-between">
          <span className="text-[11px] text-stone-400 italic">* setiap pos wajib punya alasan</span>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              + Ajukan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}