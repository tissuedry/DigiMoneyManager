"use client";

import React, { useState } from "react";
import { X, Settings, Wallet, FileText, Eye } from "lucide-react";
import EditNilaiProyekModal from "./EditNilaiProyekModal";
import EditProyekModal from "./EditProyekModal";
import SetNilaiProyekModal from "./SetNilaiProyekModal";
import PengajuanPosModal from "./PengajuanPosModal";
import DetailAnggaranModal from "./DetailAnggaranModal"; // <-- Import Modal Baru

interface DetailProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
}

const NEW_BUDGET_ITEMS = [
  { nama: "Biaya Administrasi Proyek", kategori: "POS-201", nilai: "Rp 0", dari: "Rp 20 jt", persen: 0, sisa: "Rp 20 jt" },
  { nama: "Biaya Marketing Proyek", kategori: "POS-202", nilai: "Rp 0", dari: "Rp 10 jt", persen: 0, sisa: "Rp 10 jt" },
  { nama: "Biaya Produksi Proyek", kategori: "POS-203", nilai: "Rp 117 rb", dari: "Rp 20 jt", persen: 1, sisa: "Rp 20 jt" },
];

export default function DetailProyekModal({ isOpen, onClose, projectData }: DetailProyekModalProps) {
  const [activeTab, setActiveTab] = useState<"Ringkasan" | "Anggaran" | "Tim">("Ringkasan");
  
  // State Modals
  const [isEditNilaiOpen, setIsEditNilaiOpen] = useState(false);
  const [isEditProyekOpen, setIsEditProyekOpen] = useState(false);
  const [isSetNilaiOpen, setIsSetNilaiOpen] = useState(false);
  const [isPengajuanPosOpen, setIsPengajuanPosOpen] = useState(false);
  const [isDetailAnggaranOpen, setIsDetailAnggaranOpen] = useState(false); // <-- State Modal Baru

  if (!isOpen || !projectData) return null;

  const isBudgetUninitialized = projectData.status === "Planning" || (projectData.status === "Canceled" && projectData.isBudgetEmpty);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-[750px] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header Drawer */}
          <div className="px-8 pt-8 pb-4 border-b border-stone-200 bg-[#f9f8f4] shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-xs">
                  {projectData.id}
                </span>
                <h2 className="text-xl font-bold text-stone-900 mt-1 leading-snug">{projectData.nama}</h2>
                <p className="text-[12px] text-stone-500 mt-0.5 font-medium">{projectData.deskripsi}</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 bg-white border border-stone-200 rounded-full transition cursor-pointer shadow-xs">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mt-6 border-b border-stone-200 -mb-4 px-1">
              {(["Ringkasan", "Anggaran", "Tim"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[13px] font-bold transition border-b-2 cursor-pointer ${
                    activeTab === tab ? "border-[#008f5d] text-[#008f5d]" : "border-transparent text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            
            {/* TAB RINGKASAN */}
            {activeTab === "Ringkasan" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                  <div>
                    <span className="text-[11px] text-stone-400 font-bold uppercase">Status</span>
                    <p className="mt-0.5">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${projectData.badgeColor}`}>
                        {projectData.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 font-bold uppercase">Project Manager</span>
                    <p className="text-[13px] font-bold text-stone-800 mt-1">Muhammad Zaini</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 font-bold uppercase">Tanggal Mulai</span>
                    <p className="text-[13px] font-bold text-stone-800 mt-0.5">12 Januari 2026</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-400 font-bold uppercase">Tanggal Selesai</span>
                    <p className="text-[13px] font-bold text-stone-800 mt-0.5">30 September 2026</p>
                  </div>
                </div>

                <div className="p-5 border border-stone-200 rounded-2xl space-y-3 bg-white shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-stone-800">Realisasi Anggaran</span>
                    <span className="text-[13px] font-bold text-[#008f5d]">35%</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#008f5d] w-[35%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                    <span>Nilai Proyek <b>Rp 6.2 M</b></span>
                    <span>Realisasi <b>Rp 2.2 M</b></span>
                    <span>Sisa <b>Rp 4.0 M</b></span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB ANGGARAN */}
            {activeTab === "Anggaran" && (
              <div className="space-y-4">
                {isBudgetUninitialized ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-stone-800">Nilai Proyek belum diinisialisasi.</p>
                      <p className="text-[12px] text-stone-400 mt-0.5">Silakan tetapkan nilai dan pos anggaran untuk proyek ini.</p>
                    </div>
                    <button 
                      onClick={() => setIsSetNilaiOpen(true)}
                      className="mt-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-[12px] font-bold rounded-xl hover:bg-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      + Set Nilai
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Toolbar Anggaran */}
                    <div className="flex gap-3 mb-3">
                      <button 
                        onClick={() => setIsPengajuanPosOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-stone-200 rounded-2xl text-[12px] font-bold text-stone-700 hover:bg-stone-50 shadow-xs transition cursor-pointer"
                      >
                        <FileText size={16} /> Pengajuan Pos PM
                        <span className="w-5 h-5 rounded-full bg-[#008f5d] text-white flex items-center justify-center text-[10px]">3</span>
                      </button>
                      <button 
                        onClick={() => setIsEditNilaiOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-stone-200 rounded-2xl text-[12px] font-bold text-stone-700 hover:bg-stone-50 shadow-xs transition cursor-pointer"
                      >
                        <Settings size={16} /> Edit Nilai Proyek
                      </button>
                    </div>
                    
                    {/* Tombol Lihat Detail Anggaran */}
                    <button 
                      onClick={() => setIsDetailAnggaranOpen(true)} // <-- Memicu Modal
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-stone-200 rounded-2xl text-[12px] font-bold text-stone-700 hover:bg-stone-50 shadow-xs transition mb-8 cursor-pointer"
                    >
                      <Eye size={16} /> Lihat Detail Anggaran
                    </button>

                    {/* List Pos Anggaran Utama */}
                    <div className="space-y-6 pt-2">
                      {NEW_BUDGET_ITEMS.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-[15px] font-bold text-stone-900 leading-tight">{item.nama}</h5>
                              <span className="text-[11px] font-bold text-stone-400 tracking-wider uppercase">{item.kategori}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[15px] font-bold text-stone-900 block">{item.nilai}</span>
                              <span className="text-[11px] text-stone-400 font-medium">dari {item.dari}</span>
                            </div>
                          </div>
                          
                          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden my-1">
                            <div style={{ width: `${Math.max(item.persen, 0.5)}%` }} className={`h-full ${item.persen > 0 ? "bg-[#008f5d]" : "bg-transparent"}`} />
                          </div>
                          
                          <div className="flex justify-between text-[12px] font-bold">
                            <span className="text-[#008f5d]">{item.persen}% terpakai</span>
                            <span className="text-stone-400 font-medium">Sisa <b className="text-stone-800">{item.sisa}</b></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB TIM */}
            {activeTab === "Tim" && (
              <div className="p-8 text-center text-stone-400 text-[13px] font-medium border border-stone-200 border-dashed rounded-2xl">
                Belum ada tim yang ditugaskan pada proyek ini.
              </div>
            )}
          </div>

          {/* Footer Drawer */}
          <div className="px-8 py-5 border-t border-stone-200 bg-white flex justify-between items-center shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            <button onClick={() => setIsEditProyekOpen(true)} className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-xs flex items-center gap-2 cursor-pointer">
              <Settings size={14} /> Edit Proyek
            </button>
            
            <div className="flex gap-3">
              {projectData.status === "Canceled" && (
                <button className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] rounded-xl hover:bg-[#007a4f] transition cursor-pointer">
                  Aktifkan Kembali
                </button>
              )}
              <button onClick={onClose} className="px-8 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer">
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Render All Secondary Modals */}
      <EditNilaiProyekModal isOpen={isEditNilaiOpen} onClose={() => setIsEditNilaiOpen(false)} projectData={projectData} />
      <EditProyekModal isOpen={isEditProyekOpen} onClose={() => setIsEditProyekOpen(false)} projectData={projectData} />
      <SetNilaiProyekModal isOpen={isSetNilaiOpen} onClose={() => setIsSetNilaiOpen(false)} projectData={projectData} />
      <PengajuanPosModal isOpen={isPengajuanPosOpen} onClose={() => setIsPengajuanPosOpen(false)} projectName={projectData.nama} />
      <DetailAnggaranModal isOpen={isDetailAnggaranOpen} onClose={() => setIsDetailAnggaranOpen(false)} projectName={projectData.nama} />
    </>
  );
}