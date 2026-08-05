"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, Download, Check, X as XIcon, ChevronDown, Clock } from "lucide-react";
import TolakPengajuanModal from "./TolakPengajuanModal"; // Pastikan path ini sesuai

// --- MOCK DATA ---
const APPROVAL_DATA = [
  {
    id: "RB-65",
    title: "Beli Kertas A4",
    type: "REIMBURSEMENT",
    typeLabel: "REIMB",
    pengaju: "Alif ihsan",
    tanggal: "05 Aug 2026, 09:00",
    nominal: "Rp 150.000",
    status: "Menunggu",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Administrasi Proyek",
    sub: "ATK",
    keterangan: "Beli Kertas A4",
    catatanPengaju: "Untuk print laporan lapangan",
    catatanPM: "-",
    catatanKeuangan: "-",
  },
  {
    id: "RB-64",
    title: "Gaji Alif",
    type: "REALISASI",
    typeLabel: "REAL",
    pengaju: "Muhammad Zaini",
    tanggal: "30 Jul 2026, 10:15",
    nominal: "Rp 40.000.000",
    status: "Dicairkan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Personil",
    keterangan: "Gaji Personil",
    catatanPengaju: "-",
    catatanPM: "Auto-approved (Pengajuan langsung oleh Project Manager)",
    catatanKeuangan: "Tidak ada catatan dari Tim Keuangan.",
  },
  {
    id: "RB-61",
    title: "Traktir Karyawan",
    type: "REIMBURSEMENT",
    typeLabel: "REIMB",
    pengaju: "Muhammad Alvin Ababil",
    tanggal: "29 Jul 2026, 13:32",
    nominal: "Rp 38.000",
    status: "Ditolak",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Marketing Proyek",
    sub: "Entertain",
    keterangan: "Makan Siang",
    catatanPengaju: "Makan siang bersama tim di lapangan",
    catatanPM: "Ditolak. Tidak sesuai dengan budget harian.",
    catatanKeuangan: "-",
  }
];

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState("Menunggu Saya");
  const [selectedItem, setSelectedItem] = useState<any>(APPROVAL_DATA[0]);
  
  // State untuk fitur Filter Proyek
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("Semua Proyek");
  const filterRef = useRef<HTMLDivElement>(null);

  // State untuk Modal Tolak
  const [isTolakModalOpen, setIsTolakModalOpen] = useState(false);

  // Filter List (Filter berdasarkan Tab & Proyek)
  const filteredData = APPROVAL_DATA.filter((item) => {
    const projectMatch = selectedProjectFilter === "Semua Proyek" || item.proyek === selectedProjectFilter;
    let tabMatch = true;
    if (activeTab === "Menunggu Saya") tabMatch = item.status === "Menunggu";
    else if (activeTab === "Selesai") tabMatch = item.status === "Dicairkan" || item.status === "Ditolak";
    else tabMatch = false; 
    return projectMatch && tabMatch;
  });

  const uniqueProjects = [
    "Semua Proyek",
    ...Array.from(new Set(APPROVAL_DATA.map((item) => item.proyek)))
  ];

  useEffect(() => {
    if (filteredData.length > 0) {
      const isStillInList = filteredData.some((item) => item.id === selectedItem?.id);
      if (!isStillInList) setSelectedItem(filteredData[0]);
    } else {
      setSelectedItem(null);
    }
  }, [selectedProjectFilter, activeTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const renderTypeBadge = (type: string) => {
    if (type === "REAL") return <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-extrabold rounded text-[9px]">REAL</span>;
    return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-extrabold rounded text-[9px]">REIMB</span>;
  };

  const renderStatusBadge = (status: string) => {
    if (status === "Dicairkan") return <span className="px-2 py-0.5 bg-emerald-50 text-[#008f5d] border border-emerald-200 font-bold rounded-full text-[10px]">Dicairkan</span>;
    if (status === "Menunggu") return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full text-[10px]">Menunggu</span>;
    return <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-full text-[10px]">Ditolak</span>;
  };

  // Helper untuk men-generate Alur Timeline secara dinamis berdasarkan status item
  const getTimelineSteps = (item: any) => {
    const isMenunggu = item.status === "Menunggu";
    const isDitolak = item.status === "Ditolak";
    const isDicairkan = item.status === "Dicairkan";

    return [
      {
        id: 1,
        title: "Pengajuan dikirim",
        subtitle: `${item.pengaju} • ${item.tanggal}`,
        state: "done"
      },
      {
        id: 2,
        title: "Validasi Project Manager",
        // Menyesuaikan nama untuk visual seperti di desain saat ditolak
        subtitle: isDicairkan 
          ? `Project Manager • ${item.tanggal}` 
          : (isDitolak ? `Muhammad Alvin Ababil • 13 April 2026, 08:14` : "Menunggu • -"),
        state: isDicairkan ? "done" : (isDitolak ? "rejected" : "pending")
      },
      {
        id: 3,
        title: "Verifikasi Tim Keuangan",
        subtitle: isDicairkan ? `Tim Keuangan • ${item.tanggal}` : "Menunggu • -",
        state: isDicairkan ? "done" : "pending"
      },
      {
        id: 4,
        title: "Dicairkan",
        subtitle: isDicairkan ? `Jurnal otomatis • ${item.tanggal}` : "Jurnal otomatis • -",
        state: isDicairkan ? "done" : "pending"
      }
    ];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] p-6 lg:p-8 bg-[#fdfcf9] overflow-hidden">
      
      {/* Page Title & Desc */}
      <div className="mb-6 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[24px] font-bold text-stone-900">Antrian Approval</h1>
          <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md">Project Manager</span>
        </div>
        <p className="text-[13px] text-stone-500">
          Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
        </p>
      </div>

      {/* Tabs & Filter */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
          {["Menunggu Saya", "Diteruskan", "Selesai"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab} 
              {tab === "Menunggu Saya" && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">1</span>}
              {tab === "Diteruskan" && <span className="text-stone-400">0</span>}
              {tab === "Selesai" && <span className="px-1.5 py-0.5 bg-stone-200 rounded text-[10px]">2</span>}
            </button>
          ))}
        </div>
        
        {/* Dropdown Filter Proyek */}
        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-[12px] font-bold transition shadow-xs cursor-pointer ${
              selectedProjectFilter !== "Semua Proyek" 
                ? "bg-emerald-50 border-emerald-200 text-[#008f5d]" 
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Filter size={14} /> 
            <span className="max-w-[120px] truncate">
              {selectedProjectFilter === "Semua Proyek" ? "Filter Proyek" : selectedProjectFilter}
            </span>
            <ChevronDown size={14} className={selectedProjectFilter !== "Semua Proyek" ? "text-[#008f5d]" : "text-stone-400"} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-3 border-b border-stone-100 bg-[#fdfcf9] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Filter berdasarkan Proyek
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {uniqueProjects.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      setSelectedProjectFilter(proj);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[12px] transition flex items-center justify-between cursor-pointer hover:bg-stone-50 ${
                      selectedProjectFilter === proj ? "bg-emerald-50/50 text-[#008f5d] font-bold" : "text-stone-700 font-medium"
                    }`}
                  >
                    <span className="truncate">{proj}</span>
                    {selectedProjectFilter === proj && <Check size={14} className="text-[#008f5d] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Layout (List & Detail) */}
      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* List Column */}
        <div className="w-[380px] flex flex-col gap-3 overflow-y-auto pr-2 pb-4 scrollbar-hide shrink-0">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-4 border rounded-2xl cursor-pointer transition ${
                  selectedItem?.id === item.id 
                    ? "bg-emerald-50/50 border-emerald-200 shadow-xs" 
                    : "bg-white border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                      {item.pengaju.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {renderTypeBadge(item.typeLabel)}
                        <h3 className="text-[13px] font-bold text-stone-900">{item.title}</h3>
                      </div>
                      <p className="text-[11px] text-stone-400">{item.pengaju} · {item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-stone-900 mb-1">{item.nominal}</p>
                    {renderStatusBadge(item.status)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-2xl border-dashed">
              <p className="text-stone-400 text-[12px] font-medium">Tidak ada data di tab ini.</p>
            </div>
          )}
        </div>

        {/* Detail Column */}
        {selectedItem ? (
          <div className="flex-1 flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs relative">
            <div className="flex-1 overflow-y-auto p-8">
              
              {/* Detail Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-stone-400">{selectedItem.id}</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-extrabold rounded text-[9px]">{selectedItem.type}</span>
                  </div>
                  <h2 className="text-[24px] font-bold text-stone-900 mb-1">{selectedItem.title}</h2>
                  <p className="text-[12px] text-stone-500">diajukan oleh <b>{selectedItem.pengaju}</b> pada {selectedItem.tanggal.split(',')[0]}</p>
                </div>
                <div>
                  {renderStatusBadge(selectedItem.status)}
                </div>
              </div>

              {/* Total Box */}
              <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center mb-8">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 block">Total Pengajuan</span>
                <p className="text-[32px] font-black text-stone-900">{selectedItem.nominal}</p>
              </div>

              {/* Detail Info Grid */}
              <div className="space-y-4 text-[13px] mb-8">
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Proyek</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.proyek}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Main</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.main}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Sub</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.sub}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Keterangan</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.keterangan}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Tanggal Transaksi</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.tanggal.split(',')[0]}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Pengaju</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.pengaju}</span>
                </div>
              </div>

              {/* Bukti Struk */}
              <div className="mb-8">
                <span className="text-[12px] font-bold text-stone-500 mb-3 block">Bukti Struk</span>
                <div className="w-48 h-48 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center relative">
                  <img src="/api/placeholder/200/200" alt="Bukti Struk" className="object-cover w-full h-full" />
                </div>
              </div>

              {/* Catatan Section */}
              <div className="space-y-6 mb-10">
                <div>
                  <span className="text-[12px] font-bold text-stone-500 mb-2 block">Catatan dari Pengaju</span>
                  <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl text-[12px] text-stone-700 min-h-[44px]">
                    {selectedItem.catatanPengaju}
                  </div>
                </div>
                {selectedItem.status !== "Menunggu" && (
                  <>
                    <div>
                      <span className="text-[12px] font-bold text-stone-500 mb-2 block">Catatan dari Project Manager</span>
                      <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl text-[12px] text-stone-700 min-h-[44px]">
                        {selectedItem.catatanPM}
                      </div>
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-stone-500 mb-2 block">Catatan dari Keuangan</span>
                      <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl text-[12px] text-stone-700 min-h-[44px]">
                        {selectedItem.catatanKeuangan}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Alur Approval (Timeline Dynamis) */}
              <div className="mb-6">
                <span className="text-[15px] font-medium text-stone-900 mb-5 block">Alur Approval</span>
                <div className="flex flex-col relative pl-1">
                  {getTimelineSteps(selectedItem).map((step, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const isDone = step.state === "done";
                    const isRejected = step.state === "rejected";
                    const isPending = step.state === "pending";

                    return (
                      <div key={step.id} className={`flex gap-4 relative ${!isLast ? "pb-6" : ""}`}>
                        {/* Garis Penghubung Vertical */}
                        {!isLast && (
                          <div 
                            className={`absolute left-[13px] top-7 bottom-0 w-[2px] ${isDone ? "bg-[#008f5d]" : "bg-stone-200"}`} 
                          />
                        )}

                        {/* Indikator Lingkaran */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {isDone && (
                            <div className="w-7 h-7 rounded-full bg-[#008f5d] text-white flex items-center justify-center">
                              <Check size={16} strokeWidth={2.5} />
                            </div>
                          )}
                          {isRejected && (
                            <div className="w-7 h-7 rounded-full bg-[#9e2a2b] text-white flex items-center justify-center">
                              <XIcon size={16} strokeWidth={2.5} />
                            </div>
                          )}
                          {isPending && (
                            <div className="w-7 h-7 rounded-full border border-dashed border-stone-300 bg-[#fafafa] text-stone-400 flex items-center justify-center text-[13px] font-medium">
                              {step.id}
                            </div>
                          )}
                        </div>

                        {/* Teks Status */}
                        <div className="flex flex-col pt-1">
                          <p className="text-[14px] text-stone-800 leading-none">{step.title}</p>
                          <p className="text-[12px] text-stone-400 mt-1.5">{step.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Bar & Buttons - Sticky Bottom */}
            <div className="p-6 bg-white border-t border-stone-100 shrink-0">
              {selectedItem.status === "Menunggu" ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsTolakModalOpen(true)}
                    className="flex-1 py-3 text-[13px] font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition cursor-pointer shadow-xs"
                  >
                    Tolak
                  </button>
                  <button 
                    className="flex-1 py-3 text-[13px] font-bold text-white bg-[#008f5d] border border-[#008f5d] rounded-xl hover:bg-[#007a4f] transition cursor-pointer shadow-xs"
                  >
                    Setujui
                  </button>
                </div>
              ) : (
                <button className="flex items-center justify-center w-full gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer shadow-xs">
                  <Download size={16} /> Download bukti
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-stone-50/50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 p-8 border-dashed">
            <Clock size={48} className="mb-4 text-stone-300" />
            <p className="text-[14px] font-bold text-stone-500">Pilih pengajuan untuk melihat detail</p>
          </div>
        )}
      </div>

      {/* Render Modal Tolak */}
      <TolakPengajuanModal 
        isOpen={isTolakModalOpen}
        onClose={() => setIsTolakModalOpen(false)}
        itemName={selectedItem?.title}
        pengaju={selectedItem?.pengaju}
        nominal={selectedItem?.nominal}
        onSubmit={(alasan) => {
          console.log("Penolakan untuk ID:", selectedItem?.id, "dengan alasan:", alasan);
        }}
      />
    </div>
  );
}