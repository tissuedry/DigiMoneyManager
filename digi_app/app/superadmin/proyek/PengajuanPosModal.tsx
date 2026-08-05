"use client";

import React, { useState } from "react";
import { X, ChevronRight, Check } from "lucide-react";
import TolakPengajuanPosModal from "./TolakPengajuanPosModal";

interface PengajuanPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export default function PengajuanPosModal({ isOpen, onClose, projectName }: PengajuanPosModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTolakOpen, setIsTolakOpen] = useState(false);

  if (!isOpen) return null;

  // Hardcoded IDs untuk simulasi mock data
  const ALL_IDS = ["pos-1", "pos-2", "pos-3"];
  const isAllSelected = selectedIds.length === ALL_IDS.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...ALL_IDS]);
    }
  };

  // Komponen Helper untuk Checkbox Kustom
  const CustomCheckbox = ({ id, checked }: { id: string, checked: boolean }) => (
    <div 
      onClick={() => toggleSelect(id)}
      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
        checked ? "bg-[#008f5d] border-[#008f5d]" : "bg-white border-stone-300 hover:border-stone-400"
      }`}
    >
      {checked && <Check size={12} strokeWidth={3} className="text-white" />}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-[18px] font-bold text-stone-900 leading-tight">Pengajuan Pos PM</h2>
              <p className="text-[13px] text-stone-500 mt-1">{projectName}</p>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 rounded-full transition">
              <X size={20} />
            </button>
          </div>

          {/* Action Atas (Pilih Semua) */}
          <div className="px-6 py-3 flex justify-end shrink-0">
            <button 
              onClick={handleSelectAllToggle}
              className={`text-[12px] font-bold transition px-3 py-1.5 rounded-lg border ${
                isAllSelected 
                  ? "text-[#008f5d] border-[#008f5d] bg-emerald-50 hover:bg-emerald-100" 
                  : "text-[#008f5d] border-transparent hover:bg-emerald-50"
              }`}
            >
              {isAllSelected ? `Batalkan Semua (${ALL_IDS.length})` : `Pilih Semua (${ALL_IDS.length})`}
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              
              {/* Grup Material Konstruksi */}
              <div className="bg-stone-50/50 p-4 border-b border-stone-200">
                <h3 className="text-[13px] font-bold text-stone-900">Material Konstruksi</h3>
              </div>
              
              <div className="divide-y divide-stone-100">
                {/* Item Non-aktif / Readonly */}
                <div className="flex items-center justify-between p-4 bg-white text-[12px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-stone-400" /> Beton & Semen
                  </div>
                  <span>Rp 1.200.000.000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white text-[12px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-stone-400" /> Baja & Besi
                  </div>
                  <span>Rp 900.000.000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white text-[12px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-stone-400" /> Material Lainnya
                  </div>
                  <span>Rp 300.000.000</span>
                </div>

                {/* Item Interaktif (Menunggu Approval) */}
                <div className={`flex items-start justify-between p-4 transition-colors ${selectedIds.includes("pos-1") ? "bg-emerald-50/60" : "bg-white"}`}>
                  <div className="flex gap-3">
                    <CustomCheckbox id="pos-1" checked={selectedIds.includes("pos-1")} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[#e0f2fe] text-[#0277bd] text-[9px] font-bold rounded">SUB BARU</span>
                        <span className="text-[13px] font-bold text-stone-900">Waterproofing & Insulasi</span>
                        <span className="px-1.5 py-0.5 bg-[#ffedd5] text-[#c2410c] text-[9px] font-bold rounded">MENUNGGU</span>
                      </div>
                      <p className="text-[11px] text-stone-500">Diajukan oleh <b>Budi</b> · 8 Jul 2026</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-stone-900">Rp 85.000.000</span>
                </div>

                <div className={`flex items-start justify-between p-4 transition-colors ${selectedIds.includes("pos-2") ? "bg-emerald-50/60" : "bg-white"}`}>
                  <div className="flex gap-3">
                    <CustomCheckbox id="pos-2" checked={selectedIds.includes("pos-2")} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[#e0f2fe] text-[#0277bd] text-[9px] font-bold rounded">SUB BARU</span>
                        <span className="text-[13px] font-bold text-stone-900">Batu Bata</span>
                        <span className="px-1.5 py-0.5 bg-[#ffedd5] text-[#c2410c] text-[9px] font-bold rounded">MENUNGGU</span>
                      </div>
                      <p className="text-[11px] text-stone-500">Diajukan oleh <b>Budi</b> · 11 Jul 2026</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-stone-900">Rp 50.000</span>
                </div>

                {/* Sub-item / Keterangan Baru */}
                <div className={`flex items-start justify-between p-4 pl-12 transition-colors ${selectedIds.includes("pos-3") ? "bg-emerald-50/60" : "bg-white"}`}>
                  <div className="flex gap-3">
                    <CustomCheckbox id="pos-3" checked={selectedIds.includes("pos-3")} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[#dbeafe] text-[#1e40af] text-[9px] font-bold rounded">KETERANGAN BARU</span>
                        <span className="text-[13px] font-bold text-stone-900">Batu Bata Tipe A</span>
                        <span className="px-1.5 py-0.5 bg-[#ffedd5] text-[#c2410c] text-[9px] font-bold rounded">MENUNGGU</span>
                      </div>
                      <p className="text-[11px] text-stone-500">Diajukan oleh <b>Budi</b> · 11 Jul 2026</p>
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-stone-900">Rp 20.000</span>
                </div>
              </div>

              {/* Grup Kategori Lainnya (Statik) */}
              <div className="bg-stone-50/50 p-4 border-y border-stone-200">
                <h3 className="text-[13px] font-bold text-stone-900">Tenaga Kerja Lapangan</h3>
              </div>
              <div className="divide-y divide-stone-100">
                <div className="flex items-center justify-between p-4 bg-white text-[12px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-stone-400" /> Upah Tim Lapangan
                  </div>
                  <span>Rp 800.000.000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white text-[12px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-stone-400" /> Tunjangan
                  </div>
                  <span>Rp 400.000.000</span>
                </div>
              </div>

              <div className="bg-stone-50/50 p-4 border-y border-stone-200">
                <h3 className="text-[13px] font-bold text-stone-900">Sewa Alat Berat</h3>
              </div>
              <div className="bg-stone-50/50 p-4 border-b border-stone-200">
                <h3 className="text-[13px] font-bold text-stone-900">Transportasi & Logistik</h3>
              </div>
            </div>
          </div>

          {/* Action Bar Seleksi */}
          {selectedIds.length > 0 && (
            <div className="bg-[#e6f4ef] px-6 py-4 flex items-center justify-between shrink-0">
              <span className="text-[13px] font-bold text-[#008f5d]">{selectedIds.length} pos dipilih</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsTolakOpen(true)}
                  className="px-5 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-[12px] font-bold hover:bg-stone-50 transition shadow-sm"
                >
                  Tolak Terpilih ({selectedIds.length})
                </button>
                <button 
                  className="px-5 py-2.5 bg-black text-white border border-black rounded-xl text-[12px] font-bold hover:bg-stone-800 transition shadow-sm"
                >
                  Setujui Terpilih ({selectedIds.length})
                </button>
              </div>
            </div>
          )}

          {/* Regular Footer (Tutup) */}
          <div className="px-6 py-4 bg-white border-t border-stone-100 flex justify-end shrink-0">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 font-bold text-[13px] rounded-xl hover:bg-stone-50 transition shadow-xs"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      <TolakPengajuanPosModal 
        isOpen={isTolakOpen}
        onClose={() => setIsTolakOpen(false)}
        count={selectedIds.length}
      />
    </>
  );
}