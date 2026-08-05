"use client";

import React, { useState } from "react";
import { Search, Plus, Settings, Calendar } from "lucide-react";
import TambahProyekModal from "./TambahProyekModal";
import DetailProyekModal from "./DetailProyekModal";
import SetNilaiProyekModal from "./SetNilaiProyekModal";

const PROYEK_DATA = [
  {
    id: "PRJ-008",
    nama: "Tes Proyek Planning",
    deskripsi: "Deskripsi",
    tanggal: "1 Jul 2026 - 31 Des 2026",
    totalNilai: "RAB belum diinisialisasi",
    sisaBudget: "-",
    status: "Planning",
    isBudgetEmpty: true,
    badgeColor: "bg-amber-50 text-amber-700 border border-amber-200"
  },
  {
    id: "PRJ-001",
    nama: "Pembangunan Gudang Cikarang Fase 2",
    deskripsi: "PT. Sinar Logistik Nusantara",
    tanggal: "12 Jan 2026 - 30 Sep 2026",
    totalNilai: "Rp 4.800.000.000",
    sisaBudget: "Rp 4.000.000.000",
    status: "Active",
    isBudgetEmpty: false,
    badgeColor: "bg-emerald-50 text-[#008f5d] border border-emerald-200"
  },
  {
    id: "PRJ-007",
    nama: "Pengembangan Aplikasi Internal HR",
    deskripsi: "Aplikasi manajemen SDM berbasis web untuk kebutuhan internal perusahaan.",
    tanggal: "1 Jul 2026 - —",
    totalNilai: "Rp 850.000.000",
    sisaBudget: "Rp 850.000.000",
    status: "Done",
    isBudgetEmpty: false,
    badgeColor: "bg-blue-50 text-blue-700 border border-blue-200"
  },
  {
    id: "PRJ-006",
    nama: "Audit IT PT Cahaya Niaga",
    deskripsi: "PT. Cahaya Niaga",
    tanggal: "10 Okt 2025 - 28 Feb 2026",
    totalNilai: "Rp 480.000.000",
    sisaBudget: "Rp 68.000.000",
    status: "Canceled",
    isBudgetEmpty: false,
    badgeColor: "bg-red-50 text-red-600 border border-red-200"
  }
];

export default function KelolaProyekPage() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isSetNilaiOpen, setIsSetNilaiOpen] = useState(false);
  const [targetProjectForSet, setTargetProjectForSet] = useState<any>(null);

  const filteredProyek = PROYEK_DATA.filter(p => {
    const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeFilter === "Semua" || p.status.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const handleOpenSetNilai = (e: React.MouseEvent, proyek: any) => {
    e.stopPropagation();
    setTargetProjectForSet(proyek);
    setIsSetNilaiOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4] relative">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Kelola Proyek</h1>
            <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[11px] font-bold rounded-md">Direktur</span>
          </div>
          <p className="text-stone-500 mt-1 text-[14px]">
            Pantau daftar proyek, tambahkan proyek baru, assign anggota tim, dan konfigurasi alokasi dana proyek.
          </p>
        </div>

        <button 
          onClick={() => setIsTambahOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#008f5d] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#007a4f] transition cursor-pointer shrink-0 w-fit"
        >
          <Plus size={16} strokeWidth={3} />
          Tambah Proyek
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Cari proyek, klien, atau ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-[#008f5d] transition shadow-xs"
          />
        </div>

        <div className="flex bg-stone-200/50 p-1 rounded-xl w-fit overflow-x-auto">
          {["Semua", "Planning", "Active", "Done", "Canceled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-lg text-[12px] font-bold transition cursor-pointer whitespace-nowrap ${
                activeFilter === tab ? "bg-white text-stone-800 shadow-xs" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Kartu Proyek */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProyek.map((proyek) => (
          <div key={proyek.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition">
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">{proyek.id}</span>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${proyek.badgeColor}`}>{proyek.status}</span>
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-stone-900 leading-snug">{proyek.nama}</h3>
                <p className="text-[12px] text-stone-500 mt-1 line-clamp-2">{proyek.deskripsi}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                <Calendar size={13} />
                <span>{proyek.tanggal}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-stone-100 space-y-4">
              {proyek.isBudgetEmpty ? (
                <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-800">RAB belum diinisialisasi</span>
                  <button 
                    onClick={(e) => handleOpenSetNilai(e, proyek)}
                    className="px-3 py-1.5 bg-[#1a1a1a] text-white text-[11px] font-bold rounded-lg hover:bg-black transition cursor-pointer shadow-xs"
                  >
                    Set RAB
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Total Nilai Proyek</span>
                    <p className="text-[13px] font-extrabold text-stone-800 mt-0.5 truncate">{proyek.totalNilai}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Sisa Budget</span>
                    <p className="text-[13px] font-extrabold text-[#008f5d] mt-0.5 truncate">{proyek.sisaBudget}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedProject(proyek)}
                  className="flex-1 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-xl text-[12px] font-bold transition shadow-xs cursor-pointer text-center"
                >
                  Detail Proyek
                </button>
                <button 
                  onClick={() => setSelectedProject(proyek)}
                  className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* --- RENDERING MODAL --- */}
      <TambahProyekModal 
        isOpen={isTambahOpen} 
        onClose={() => setIsTambahOpen(false)} 
      />

      <DetailProyekModal 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        projectData={selectedProject} 
      />

      <SetNilaiProyekModal 
        isOpen={isSetNilaiOpen} 
        onClose={() => setIsSetNilaiOpen(false)} 
        projectData={targetProjectForSet} 
      />

    </div>
  );
}