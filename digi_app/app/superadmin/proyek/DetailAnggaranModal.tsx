"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface DetailAnggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

// --- MOCK DATA ---
const DETAIL_ANGGARAN = [
  {
    id: "POS-201",
    main: "Biaya Administrasi Proyek",
    total: "Rp 20.000.000",
    terpakai: "Rp 0",
    persen: 0,
    sisa: "Rp 20.000.000",
    subs: [
      { nama: "Biaya Garansi", total: "Rp 10.000.000", terpakai: "Rp 0", sisa: "Rp 10.000.000" },
      { nama: "Biaya Perizinan", total: "Rp 10.000.000", terpakai: "Rp 0", sisa: "Rp 10.000.000" }
    ]
  },
  {
    id: "POS-202",
    main: "Biaya Marketing Proyek",
    total: "Rp 10.000.000",
    terpakai: "Rp 0",
    persen: 0,
    sisa: "Rp 10.000.000",
    subs: [
      { nama: "Entertain Klien", total: "Rp 10.000.000", terpakai: "Rp 0", sisa: "Rp 10.000.000" }
    ]
  },
  {
    id: "POS-203",
    main: "Biaya Produksi Proyek",
    total: "Rp 20.000.000",
    terpakai: "Rp 117.000",
    persen: 1,
    sisa: "Rp 19.883.000",
    subs: [
      { nama: "Pengadaan Material Konstruksi", total: "Rp 15.000.000", terpakai: "Rp 117.000", sisa: "Rp 14.883.000" },
      { nama: "Upah Tenaga Kerja", total: "Rp 5.000.000", terpakai: "Rp 0", sisa: "Rp 5.000.000" }
    ]
  }
];

export default function DetailAnggaranModal({ isOpen, onClose, projectName }: DetailAnggaranModalProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["POS-203"]); // Default buka satu

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0 bg-[#f9f8f4]">
          <div>
            <h2 className="text-[20px] font-bold text-stone-900 leading-tight">Detail Anggaran Proyek</h2>
            <p className="text-[13px] text-stone-500 mt-1">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 bg-white border border-stone-200 rounded-full transition shadow-xs">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-4">
            {DETAIL_ANGGARAN.map((item) => {
              const isExpanded = expandedItems.includes(item.id);

              return (
                <div key={item.id} className="border border-stone-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  
                  {/* Main Header Item */}
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg transition-transform duration-300 ${isExpanded ? "rotate-180 bg-stone-200 text-stone-800" : "bg-stone-100 text-stone-500"}`}>
                        <ChevronDown size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">{item.id}</span>
                        <h3 className="text-[14px] font-bold text-stone-900 mt-0.5">{item.main}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 text-right shrink-0">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 block mb-0.5">TERPAKAI</span>
                        <span className="text-[13px] font-bold text-[#008f5d]">{item.terpakai}</span>
                      </div>
                      <div className="w-px h-8 bg-stone-200"></div>
                      <div className="min-w-[100px]">
                        <span className="text-[10px] font-bold text-stone-400 block mb-0.5">TOTAL POS</span>
                        <span className="text-[13px] font-bold text-stone-900">{item.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sub Items */}
                  {isExpanded && (
                    <div className="bg-stone-50/50 border-t border-stone-100 p-4 pl-[72px] pr-5 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                      {item.subs.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                            <span className="text-[12px] font-medium text-stone-700">{sub.nama}</span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-right">
                            <span className="text-[12px] text-stone-500 w-24">
                              Pakai: <b className="text-stone-800">{sub.terpakai}</b>
                            </span>
                            <span className="text-[12px] text-stone-500 w-24">
                              Sisa: <b className="text-stone-800">{sub.sisa}</b>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Progress Bar di Bawah Tiap Pos */}
                  <div className="h-1 w-full bg-stone-100">
                    <div style={{ width: `${Math.max(item.persen, 0.5)}%` }} className={`h-full ${item.persen > 0 ? "bg-[#008f5d]" : "bg-transparent"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-stone-100 flex justify-end shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-stone-800 transition shadow-sm cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}