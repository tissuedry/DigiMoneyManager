"use client";

import React, { useState, useRef } from "react";
import { Filter, Download, Check, X as XIcon, Search, CheckCircle2, ChevronDown } from "lucide-react";
import TolakPengajuanModal from "./TolakPengajuanModal"; 

// --- MOCK DATA ---
const PENCAIRAN_DATA = [
  {
    id: "RB-0074",
    title: "Pembelian RPG Controller",
    type: "REIMBURSEMENT",
    typeLabel: "REIMB",
    pengaju: "Muhammad Alvin Ababil",
    tanggal: "4 Ags 2026",
    nominal: "Rp 875.000",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Pengadaan Barang dan Jasa",
    keterangan: "Pembelian Software",
    tglTransaksi: "16 Nov 2019", 
    catatanPengaju: "Pembelian RPG Controller",
    catatanPM: "-",
  },
  {
    id: "RB-0071",
    title: "Gaji Gweh - QA-Alif Week 6",
    type: "REALISASI",
    typeLabel: "REAL",
    pengaju: "Muhammad Zaini",
    tanggal: "3 Ags 2026",
    nominal: "Rp 20.000.000",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Personil",
    keterangan: "Gaji Personil",
    tglTransaksi: "3 Ags 2026",
    catatanPengaju: "-",
    catatanPM: "Auto-approved",
  },
  {
    id: "RB-0070",
    title: "Gaji Alif - QA-Alif",
    type: "REALISASI",
    typeLabel: "REAL",
    pengaju: "Muhammad Zaini",
    tanggal: "3 Ags 2026",
    nominal: "Rp 25.000.000",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Personil",
    keterangan: "Gaji Personil",
    tglTransaksi: "3 Ags 2026",
    catatanPengaju: "-",
    catatanPM: "Auto-approved",
  },
  {
    id: "RB-0049",
    title: "Gaji Sangkuriang - QA-Zaini",
    type: "REALISASI",
    typeLabel: "REAL",
    pengaju: "Muhammad Zaini",
    tanggal: "2 Ags 2026",
    nominal: "Rp 1.000.000",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Personil",
    keterangan: "Gaji Personil",
    tglTransaksi: "2 Ags 2026",
    catatanPengaju: "-",
    catatanPM: "Auto-approved",
  },
  {
    id: "RB-0048",
    title: "Gaji Alvin - QA-Alif",
    type: "REALISASI",
    typeLabel: "REAL",
    pengaju: "Muhammad Zaini",
    tanggal: "2 Ags 2026",
    nominal: "Rp 10.000.000",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Produksi Proyek",
    sub: "Biaya Personil",
    keterangan: "Gaji Personil",
    tglTransaksi: "2 Ags 2026",
    catatanPengaju: "-",
    catatanPM: "Auto-approved",
  },
  {
    id: "RB-0047",
    title: "Beli Cemilan Client - QA-Zaini",
    type: "REIMBURSEMENT",
    typeLabel: "REIMB",
    pengaju: "Muhammad Alvin Ababil",
    tanggal: "2 Ags 2026",
    nominal: "Rp 43.500",
    status: "Menunggu Keuangan",
    proyek: "Penyebaran Laptop Daerah Bojongsoang",
    main: "Biaya Marketing Proyek",
    sub: "Entertain",
    keterangan: "Beli Snack",
    tglTransaksi: "2 Ags 2026",
    catatanPengaju: "Snack untuk meeting",
    catatanPM: "Sesuai",
  }
];

export default function AntrianPencairanPage() {
  const [activeTab, setActiveTab] = useState("Diteruskan");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(PENCAIRAN_DATA[0]);
  const [catatanKeuangan, setCatatanKeuangan] = useState("");
  
  // State Filter Proyek
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("Semua Proyek");
  const filterRef = useRef<HTMLDivElement>(null);

  // State Modal Tolak
  const [isTolakModalOpen, setIsTolakModalOpen] = useState(false);

  // List Proyek Unik
  const uniqueProjects = [
    "Semua Proyek",
    ...Array.from(new Set(PENCAIRAN_DATA.map((item) => item.proyek)))
  ];

  // Filter Data List
  const filteredData = PENCAIRAN_DATA.filter((item) => {
    // 1. Pencarian Teks
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.pengaju.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.proyek.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Filter Status (Tab)
    const matchTab = activeTab === "Diteruskan" ? item.status === "Menunggu Keuangan" : item.status !== "Menunggu Keuangan";
    
    // 3. Filter Proyek
    const matchProject = selectedProjectFilter === "Semua Proyek" || item.proyek === selectedProjectFilter;
    
    return matchSearch && matchTab && matchProject;
  });

  // Effect untuk select item pertama ketika data difilter
  React.useEffect(() => {
    if (filteredData.length > 0) {
      const isStillInList = filteredData.some((item) => item.id === selectedItem?.id);
      if (!isStillInList) setSelectedItem(filteredData[0]);
    } else {
      setSelectedItem(null);
    }
  }, [searchQuery, activeTab, selectedProjectFilter]);

  // Effect untuk click outside filter dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const renderTypeBadge = (typeLabel: string) => {
    if (typeLabel === "REAL") return <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-extrabold rounded text-[9px]">REAL</span>;
    return <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 font-extrabold rounded text-[9px]">REIMB</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] p-6 lg:p-8 bg-[#fdfcf9] overflow-hidden">
      
      {/* Page Title & Desc */}
      <div className="mb-6 shrink-0">
        <h1 className="text-[24px] font-bold text-stone-900 mb-1">Antrian Pencairan</h1>
        <p className="text-[13px] text-stone-500">
          Pengajuan yang telah divalidasi PM dan siap dicairkan. Jurnal Debit-Kredit akan ter-generate otomatis.
        </p>
      </div>

      {/* Tabs & Controls */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
          {["Diteruskan", "Selesai"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab} 
              {tab === "Diteruskan" && <span className="bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">{filteredData.length}</span>}
              {tab === "Selesai" && <span className="px-1.5 py-0.5 text-stone-400 text-[10px]">31</span>}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Input Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cari nama pengaju atau proyek..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-stone-200 rounded-full text-[12px] w-[260px] focus:outline-none focus:border-stone-400 transition"
            />
          </div>

          {/* Dropdown Filter Proyek */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-full text-[12px] font-bold transition shadow-xs cursor-pointer ${
                selectedProjectFilter !== "Semua Proyek" 
                  ? "bg-sky-50 border-sky-200 text-[#0277bd]" 
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Filter size={14} /> 
              <span className="max-w-[120px] truncate">
                {selectedProjectFilter === "Semua Proyek" ? "Filter Proyek" : selectedProjectFilter}
              </span>
              <ChevronDown size={14} className={selectedProjectFilter !== "Semua Proyek" ? "text-[#0277bd]" : "text-stone-400"} />
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
                        selectedProjectFilter === proj ? "bg-sky-50/50 text-[#0277bd] font-bold" : "text-stone-700 font-medium"
                      }`}
                    >
                      <span className="truncate">{proj}</span>
                      {selectedProjectFilter === proj && <Check size={14} className="text-[#0277bd] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Content Layout */}
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
                    ? "bg-[#f5fbfa] border-sky-200 shadow-xs" 
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
                        <h3 className="text-[12px] font-bold text-stone-900 leading-tight line-clamp-1">{item.title}</h3>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">{item.pengaju} · {item.id}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 font-bold rounded-full text-[10px]">
                    {item.status}
                  </span>
                  <p className="text-[12px] font-bold text-stone-900">{item.nominal}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white border border-stone-200 rounded-2xl border-dashed">
              <p className="text-stone-400 text-[12px] font-medium">Tidak ada data ditemukan.</p>
            </div>
          )}
        </div>

        {/* Detail Column */}
        {selectedItem ? (
          <div className="flex-1 flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs relative">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              
              {/* Detail Header */}
              <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-bold text-stone-400">{selectedItem.id}</span>
                    <span className="px-1.5 py-0.5 bg-sky-50 text-sky-600 font-extrabold rounded text-[9px] border border-sky-100">{selectedItem.type}</span>
                  </div>
                  <h2 className="text-[24px] font-bold text-stone-900 mb-1">{selectedItem.title}</h2>
                  <p className="text-[13px] text-stone-500">diajukan oleh <b className="text-stone-800">{selectedItem.pengaju}</b> pada {selectedItem.tanggal}</p>
                </div>
                <div>
                  <span className="px-3 py-1 bg-sky-50 text-sky-600 border border-sky-100 font-bold rounded-full text-[11px]">
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
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
                  <span className="font-bold text-stone-800 text-right">{selectedItem.tglTransaksi}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Pengaju</span>
                  <span className="font-bold text-stone-800 text-right">{selectedItem.pengaju}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <span className="text-stone-400">Nominal</span>
                  <span className="font-black text-stone-900 text-right text-[15px]">{selectedItem.nominal}</span>
                </div>
              </div>

              {/* Bukti Struk */}
              <div className="mb-10">
                <span className="text-[13px] font-bold text-stone-800 mb-3 block">Bukti Struk</span>
                <div className="w-full max-w-[400px] h-64 bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
                  <div className="bg-white w-full h-full border border-stone-200 rounded p-4 text-[9px] font-mono text-stone-600 flex flex-col shadow-sm">
                    <p className="text-center font-bold text-[11px] text-stone-900">SURYA ELEKTRONIK</p>
                    <p className="text-center border-b border-stone-200 pb-2 mb-2">Jl. Veteran Utara No. 248B<br/>Sabtu, 16 November 2019</p>
                    <div className="flex justify-between"><span>PPG</span><span>500.000</span></div>
                    <div className="flex justify-between"><span>Pulse Sensor</span><span>150.000</span></div>
                    <div className="flex justify-between"><span>Pointer</span><span>225.000</span></div>
                    <div className="mt-auto border-t border-dashed border-stone-300 pt-2 flex justify-between font-bold text-stone-900">
                      <span>Total Belanja</span><span>{selectedItem.nominal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Jurnal Akuntansi */}
              <div className="mb-10">
                <span className="text-[13px] font-bold text-stone-800 mb-3 block">Preview Jurnal Akuntansi (Auto-generated)</span>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 shadow-sm">
                  <div className="text-[11px] font-mono text-stone-500 mb-2">JE-2026-0074</div>
                  <p className="text-[13px] text-stone-800 mb-5 font-medium">
                    Pencairan {selectedItem.type.toLowerCase()} {selectedItem.pengaju} - {selectedItem.keterangan}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-[#008f5d] w-6">Dr</span>
                      <select className="flex-1 p-2.5 bg-white border border-stone-200 rounded-lg text-[12px] text-stone-700 outline-none focus:border-stone-400">
                        <option>-- Pilih Akun Debit (Beban) --</option>
                        <option>Biaya Pengadaan Barang & Jasa</option>
                        <option>Biaya Personil</option>
                      </select>
                      <span className="text-[13px] font-bold text-stone-900 w-24 text-right">{selectedItem.nominal}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-rose-600 w-6">Cr</span>
                      <select className="flex-1 p-2.5 bg-white border border-stone-200 rounded-lg text-[12px] text-stone-700 outline-none focus:border-stone-400">
                        <option>-- Pilih Akun Kredit (Kas/Bank) --</option>
                        <option>Kas Kecil Proyek</option>
                        <option>Bank Mandiri - Pusat</option>
                      </select>
                      <span className="text-[13px] font-bold text-stone-900 w-24 text-right">{selectedItem.nominal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Sections */}
              <div className="space-y-6 mb-10">
                <div>
                  <span className="text-[12px] font-medium text-stone-500 mb-2 block">Catatan dari Pengaju</span>
                  <div className="p-3.5 bg-stone-50 border border-stone-100 rounded-xl text-[13px] text-stone-700 italic">
                    {selectedItem.catatanPengaju}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] font-medium text-stone-500 mb-2 block">Catatan dari Project Manager</span>
                  <div className="p-3.5 bg-stone-50 border border-stone-100 rounded-xl text-[13px] text-stone-700 italic">
                    {selectedItem.catatanPM}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] font-medium text-stone-500 mb-2 block">Catatan dari Keuangan (opsional)</span>
                  <textarea 
                    rows={3}
                    placeholder="Tambahkan catatan jika ada..."
                    value={catatanKeuangan}
                    onChange={(e) => setCatatanKeuangan(e.target.value)}
                    className="w-full p-3.5 bg-white border border-stone-200 rounded-xl text-[13px] text-stone-800 outline-none focus:border-stone-400 resize-none"
                  />
                </div>
              </div>

              {/* Timeline / Alur Approval */}
              <div className="mb-4">
                <span className="text-[14px] font-bold text-stone-900 mb-5 block">Alur Approval</span>
                <div className="flex flex-col relative pl-1">
                  <div className="flex gap-4 relative pb-6">
                    <div className="absolute left-[13px] top-7 bottom-0 w-[2px] bg-[#008f5d]" />
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-[#008f5d] text-white flex items-center justify-center">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex flex-col pt-1">
                      <p className="text-[14px] font-medium text-stone-900 leading-none">Pengajuan dikirim</p>
                      <p className="text-[12px] text-stone-500 mt-1.5">{selectedItem.pengaju} • 4 Ags 2026</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative pb-6">
                    <div className="absolute left-[13px] top-7 bottom-0 w-[2px] bg-[#008f5d]" />
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-[#008f5d] text-white flex items-center justify-center">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex flex-col pt-1">
                      <p className="text-[14px] font-medium text-stone-900 leading-none">Validasi Project Manager</p>
                      <p className="text-[12px] text-stone-500 mt-1.5">Muhammad Zaini • 4 Ags 2026</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative pb-6">
                    <div className="absolute left-[13px] top-7 bottom-0 w-[2px] bg-stone-200" />
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-[#0277bd] text-white flex items-center justify-center text-[13px] font-bold shadow-sm">
                        3
                      </div>
                    </div>
                    <div className="flex flex-col pt-1">
                      <p className="text-[14px] font-medium text-stone-900 leading-none">Verifikasi Tim Keuangan</p>
                      <p className="text-[12px] text-stone-400 mt-1.5">Menunggu • -</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative">
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full border border-dashed border-stone-300 bg-[#fafafa] text-stone-400 flex items-center justify-center text-[13px] font-medium">
                        4
                      </div>
                    </div>
                    <div className="flex flex-col pt-1">
                      <p className="text-[14px] font-medium text-stone-400 leading-none">Dicairkan</p>
                      <p className="text-[12px] text-stone-400 mt-1.5">Jurnal otomatis • -</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Bar Sticky Bottom */}
            <div className="p-5 bg-white border-t border-stone-100 shrink-0 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <button className="flex items-center gap-2 px-5 py-2.5 border border-stone-200 rounded-xl text-[13px] font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer shadow-xs">
                <Download size={16} /> Download bukti
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsTolakModalOpen(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-[13px] font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition cursor-pointer shadow-xs"
                >
                  <XIcon size={16} /> Tolak
                </button>
                <button 
                  className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] border border-[#008f5d] rounded-xl hover:bg-[#007a4f] transition cursor-pointer shadow-xs"
                >
                  <Check size={16} /> Cairkan & Generate Jurnal
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-stone-50/50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 p-8 border-dashed">
            <CheckCircle2 size={48} className="mb-4 text-stone-300" />
            <p className="text-[14px] font-bold text-stone-500">Pilih pengajuan untuk melihat detail pencairan</p>
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
          console.log("Penolakan oleh Keuangan untuk ID:", selectedItem?.id, "dengan alasan:", alasan);
        }}
      />
    </div>
  );
}