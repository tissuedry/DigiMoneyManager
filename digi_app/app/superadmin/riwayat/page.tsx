"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Filter, Eye, Check, ChevronDown } from "lucide-react";
import DetailRiwayatModal from "./DetailRiwayatModal"; // Import modal yang baru dibuat

// --- MOCK DATA ---
const RIWAYAT_DATA = [
  {
    id: "RB-2026-004",
    tanggal: "18/05/2026",
    nama: "Gramedia Merdeka",
    proyek: "Pembangunan Gudang Fase 2",
    keterangan: "Perlengkapan & ATK",
    nominal: "Rp 150.000",
    status: "Menunggu PM",
  },
  {
    id: "RB-2026-003",
    tanggal: "19/04/2026",
    nama: "SPBU Pertamina 34.121",
    proyek: "Pembangunan Gudang Fase 2",
    keterangan: "Transportasi & Logistik",
    nominal: "Rp 450.000",
    status: "Verifikasi Keuangan",
  },
  {
    id: "RB-2026-002",
    tanggal: "5/04/2026",
    nama: "Solaria Resto Bandung",
    proyek: "Pembangunan Gudang Fase 2",
    keterangan: "Transportasi & Logistik",
    nominal: "Rp 150.000",
    status: "Dicairkan",
  },
  {
    id: "RB-2026-001",
    tanggal: "12/03/2026",
    nama: "Indomaret Bandung",
    proyek: "QA-Alif Week 6",
    keterangan: "Konsumsi",
    nominal: "Rp 150.000",
    status: "Ditolak",
  },
  {
    id: "RB-2026-005",
    tanggal: "20/05/2026",
    nama: "Beli Material Kabel",
    proyek: "FTTH RANCAMANYAR",
    keterangan: "Material Proyek",
    nominal: "Rp 1.200.000",
    status: "Menunggu PM",
  }
];

export default function RiwayatPengajuanPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  
  // State Filter Proyek
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("Semua Proyek");
  const filterRef = useRef<HTMLDivElement>(null);

  // State Detail Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailData, setSelectedDetailData] = useState<any>(null);

  const TABS = ["Semua", "Menunggu PM", "Menunggu Keuangan", "Dicairkan", "Ditolak"];

  const mapTabToStatus = (tab: string) => {
    if (tab === "Menunggu Keuangan") return "Verifikasi Keuangan";
    return tab;
  };

  const uniqueProjects = [
    "Semua Proyek",
    ...Array.from(new Set(RIWAYAT_DATA.map((item) => item.proyek)))
  ];

  const filteredData = RIWAYAT_DATA.filter((item) => {
    const matchTab = activeTab === "Semua" || item.status === mapTabToStatus(activeTab);
    const matchProject = selectedProject === "Semua Proyek" || item.proyek === selectedProject;
    return matchTab && matchProject;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Buka Modal
  const handleOpenDetail = (item: any) => {
    setSelectedDetailData(item);
    setIsDetailOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Menunggu PM":
        return <span className="px-3 py-1 bg-[#ffedd5] text-[#c2410c] font-bold rounded-full text-[11px] whitespace-nowrap">Menunggu PM</span>;
      case "Verifikasi Keuangan":
      case "Menunggu Keuangan":
        return <span className="px-3 py-1 bg-[#e0f2fe] text-[#0369a1] font-bold rounded-full text-[11px] whitespace-nowrap">Verifikasi Keuangan</span>;
      case "Dicairkan":
        return <span className="px-3 py-1 bg-[#d1fae5] text-[#047857] font-bold rounded-full text-[11px] whitespace-nowrap">Dicairkan</span>;
      case "Ditolak":
        return <span className="px-3 py-1 bg-[#ffe4e6] text-[#be123c] font-bold rounded-full text-[11px] whitespace-nowrap">Ditolak</span>;
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-600 font-bold rounded-full text-[11px] whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-auto bg-[#fdfcf9] custom-scrollbar">
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[26px] font-bold text-stone-900">Riwayat Pengajuan</h1>
            <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md">Karyawan</span>
          </div>
          <p className="text-[13px] text-stone-500">
            Semua reimbursement yang pernah kamu ajukan, lengkap dengan status dan jejak audit.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-1 bg-white border border-stone-200 p-1 rounded-full shadow-sm overflow-x-auto custom-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition duration-200 whitespace-nowrap ${
                  activeTab === tab 
                    ? "bg-stone-100 text-stone-900" 
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-[12px] font-bold text-stone-700 hover:bg-stone-50 transition shadow-sm whitespace-nowrap">
              <ArrowUpDown size={14} /> Urutan: Terbaru
            </button>
            
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full text-[12px] font-bold transition shadow-sm ${
                  selectedProject !== "Semua Proyek" 
                    ? "bg-stone-900 border-stone-900 text-white" 
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Filter size={14} /> 
                <span className="max-w-[120px] truncate">
                  {selectedProject === "Semua Proyek" ? "Filter" : selectedProject}
                </span>
                {selectedProject !== "Semua Proyek" && <ChevronDown size={14} />}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
                  <div className="p-3 border-b border-stone-100 bg-[#fdfcf9] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Filter Proyek
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {uniqueProjects.map((proj) => (
                      <button
                        key={proj}
                        onClick={() => {
                          setSelectedProject(proj);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] transition flex items-center justify-between cursor-pointer hover:bg-stone-50 ${
                          selectedProject === proj ? "text-stone-900 font-bold bg-stone-50" : "text-stone-700 font-medium"
                        }`}
                      >
                        <span className="truncate">{proj}</span>
                        {selectedProject === proj && <Check size={14} className="text-[#008f5d] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white border border-stone-200 rounded-[20px] shadow-sm overflow-hidden mb-6">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[950px] text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">ID PENGAJUAN</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">TANGGAL</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider min-w-[180px]">NAMA REIMBURSEMENT</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider min-w-[200px]">PROYEK</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider">KETERANGAN</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">NOMINAL</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-stone-400 uppercase tracking-wider">STATUS</th>
                  <th className="py-4 px-6 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-100 last:border-0 hover:bg-[#faf9f5] transition duration-150">
                      <td className="px-6 py-5 text-[12px] font-mono text-stone-500 whitespace-nowrap">{item.id}</td>
                      <td className="px-6 py-5 text-[12px] font-medium text-stone-700 whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-6 py-5 text-[12px] font-bold text-stone-900">{item.nama}</td>
                      <td className="px-6 py-5 text-[12px] font-medium text-stone-600">{item.proyek}</td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-[11px] font-medium whitespace-nowrap inline-block">
                          {item.keterangan}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[12px] font-bold text-stone-900 whitespace-nowrap">{item.nominal}</td>
                      <td className="px-6 py-5">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleOpenDetail(item)}
                          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-[13px] text-stone-500 font-medium">
                      Tidak ada data pengajuan yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex justify-center items-center">
          <p className="text-[12px] text-stone-400 font-medium">
            Menampilkan {filteredData.length} dari {RIWAYAT_DATA.length} item
          </p>
        </div>

      </div>

      {/* Render Drawer Modal */}
      <DetailRiwayatModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedDetailData}
      />

    </div>
  );
}