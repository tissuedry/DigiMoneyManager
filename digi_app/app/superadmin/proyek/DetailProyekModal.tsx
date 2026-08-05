"use client";

import React, { useState } from "react";
import { X, Settings, Wallet } from "lucide-react";
import EditNilaiProyekModal from "./EditNilaiProyekModal";
import EditProyekModal from "./EditProyekModal";
import SetNilaiProyekModal from "./SetNilaiProyekModal";

interface DetailProyekModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
}

const DUMMY_BUDGET_ITEMS = [
  { nama: "Material Interior", kategori: "POS-201", nilai: "Rp 685.0 jt", dari: "Rp 720.0 jt", persen: 95, sisa: "Rp 35.0 jt", color: "bg-red-500" },
  { nama: "Tenaga Kerja", kategori: "POS-202", nilai: "Rp 462.0 jt", dari: "Rp 480.0 jt", persen: 96, sisa: "Rp 18.0 jt", color: "bg-red-500" },
  { nama: "Furnitur & Perabot", kategori: "POS-203", nilai: "Rp 240.0 jt", dari: "Rp 280.0 jt", persen: 86, sisa: "Rp 40.0 jt", color: "bg-amber-500" },
  { nama: "Transportasi", kategori: "POS-204", nilai: "Rp 58.0 jt", dari: "Rp 80.0 jt", persen: 73, sisa: "Rp 22.0 jt", color: "bg-emerald-500" },
  { nama: "Konsumsi Tim", kategori: "POS-205", nilai: "Rp 28.0 jt", dari: "Rp 50.0 jt", persen: 56, sisa: "Rp 22.0 jt", color: "bg-emerald-500" },
];

export default function DetailProyekModal({ isOpen, onClose, projectData }: DetailProyekModalProps) {
  const [activeTab, setActiveTab] = useState<"Ringkasan" | "Anggaran" | "Tim">("Ringkasan");
  const [isEditNilaiOpen, setIsEditNilaiOpen] = useState(false);
  const [isEditProyekOpen, setIsEditProyekOpen] = useState(false);
  const [isSetNilaiOpen, setIsSetNilaiOpen] = useState(false);

  if (!isOpen || !projectData) return null;

  const isBudgetUninitialized = projectData.status === "Planning" || (projectData.status === "Canceled" && projectData.isBudgetEmpty);

  return (
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
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TAB RINGKASAN (Sesuai Referensi Gambar Anda) */}
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

              {/* Realisasi Anggaran Card */}
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

              {/* Reimbursement Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                  <span className="text-[11px] font-bold text-[#117a5b]">Sudah Reimburse (2)</span>
                  <p className="text-[16px] font-extrabold text-[#117a5b] mt-1">Rp 264.0 jt</p>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                  <span className="text-[11px] font-bold text-amber-700">Belum Reimburse (2)</span>
                  <p className="text-[16px] font-extrabold text-amber-700 mt-1">Rp 735 rb</p>
                </div>
              </div>

              {/* Arus Kas Real-Time Card */}
              <div className="p-5 border border-stone-200 rounded-2xl bg-white shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[13px] font-bold text-stone-800">Arus Kas Real-Time</h4>
                  <div className="flex bg-stone-100 p-1 rounded-lg text-[11px] font-bold text-stone-500">
                    <button className="px-2.5 py-1">4M</button>
                    <button className="px-2.5 py-1 bg-white rounded-md shadow-xs text-stone-800">12M</button>
                    <button className="px-2.5 py-1">YTD</button>
                  </div>
                </div>
                <div className="h-36 flex items-end justify-between gap-1 pt-4 border-b border-stone-100 pb-2">
                  {[40, 60, 45, 75, 85, 95, 70, 80, 90, 100, 85, 30].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div style={{ height: `${h}%` }} className="w-1.5 bg-[#008f5d] rounded-t-sm" />
                        <div style={{ height: `${h * 0.7}%` }} className="w-1.5 bg-[#d4af37] rounded-t-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex gap-4 font-medium text-stone-600">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#008f5d] rounded-full" /> Inflow Rp 3.6 M</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#d4af37] rounded-full" /> Outflow Rp 3.2 M</span>
                  </div>
                  <span className="font-bold text-[#008f5d]">Net cash +Rp 340 jt</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB ANGGARAN (Rincian Pos Anggaran & Edit RAB) */}
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
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditNilaiOpen(true)} className="px-4 py-2 bg-white text-stone-700 text-[12px] font-bold rounded-xl border border-stone-200 shadow-xs hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer">
                      <Settings size={14} /> Edit RAB
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {DUMMY_BUDGET_ITEMS.map((item, idx) => (
                      <div key={idx} className="p-4 border border-stone-200 rounded-2xl bg-white shadow-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-stone-400 tracking-wider block">{item.kategori}</span>
                            <h5 className="text-[13px] font-bold text-stone-900 mt-0.5">{item.nama}</h5>
                          </div>
                          <div className="text-right">
                            <span className="text-[13px] font-bold text-stone-900">{item.nilai}</span>
                            <span className="text-[11px] text-stone-400 block font-medium">dari {item.dari}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div style={{ width: `${item.persen}%` }} className={`h-full ${item.color}`} />
                        </div>
                        <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                          <span>{item.persen}% terpakai</span>
                          <span>Sisa <b>{item.sisa}</b></span>
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
            <div className="p-8 text-center text-stone-400 text-[13px] font-medium">
              Daftar anggota tim yang ditugaskan pada proyek ini akan muncul di sini.
            </div>
          )}
        </div>

        {/* Footer Drawer */}
        <div className="px-8 py-4 border-t border-stone-200 bg-[#f9f8f4] flex justify-between items-center shrink-0">
          <button onClick={() => setIsEditProyekOpen(true)} className="px-4 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer">
            <Settings size={14} /> Edit Proyek
          </button>
          
          <div className="flex gap-2">
            {projectData.status === "Canceled" && (
              <button onClick={() => alert("Proyek diaktifkan kembali")} className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] rounded-xl hover:bg-[#007a4f] transition cursor-pointer">
                Aktifkan Kembali
              </button>
            )}
            <button onClick={onClose} className="px-6 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer">
              Tutup
            </button>
          </div>
        </div>

      </div>

      <EditNilaiProyekModal isOpen={isEditNilaiOpen} onClose={() => setIsEditNilaiOpen(false)} projectData={projectData} />
      <EditProyekModal isOpen={isEditProyekOpen} onClose={() => setIsEditProyekOpen(false)} projectData={projectData} />
      <SetNilaiProyekModal isOpen={isSetNilaiOpen} onClose={() => setIsSetNilaiOpen(false)} projectData={projectData} />
    </div>
  );
}