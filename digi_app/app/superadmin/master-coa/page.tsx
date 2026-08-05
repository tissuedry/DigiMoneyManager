"use client";

import React, { useState } from "react";
import { Upload, Plus, MoreHorizontal, Settings, X, ChevronDown, ChevronRight } from "lucide-react";

type TabType = "Semua" | "Aset" | "Beban";

// Dummy Data untuk Tab Semua & Aset
const COA_DATA = [
  { no: "1-1101", nama: "Kas", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1102", nama: "Bank BCA - Operasional", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1103", nama: "Bank Mandiri - Payroll", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1201", nama: "Piutang Usaha", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1301", nama: "Persediaan Material", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
];

export default function MasterCoAPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Semua");

  // State untuk mengontrol Accordion pada tab "Beban" (default terbuka semua)
  const [expandedMains, setExpandedMains] = useState<string[]>(["marketing", "admin", "produksi"]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>(["marketing-1", "marketing-2", "admin-1", "admin-2", "admin-3", "produksi-1", "produksi-2", "produksi-3", "produksi-4"]);

  const toggleMain = (id: string) => {
    setExpandedMains(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const toggleSub = (id: string) => {
    setExpandedSubs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Chart of Accounts</h1>
        <p className="text-stone-500 mt-1 text-[15px]">
          Daftar akun yang menjadi referensi seluruh jurnal sistem. Sesuai standar PSAK / IFRS.
        </p>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        
        {/* Tabs */}
        <div className="flex bg-stone-200/50 p-1 rounded-xl w-fit">
          {(["Semua", "Aset", "Beban"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeTab === "Semua" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-50 transition cursor-pointer">
              <Upload size={16} />
              Import
            </button>
          )}
          
          <button className="flex items-center gap-2 px-4 py-2 bg-[#008f5d] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#007a4f] transition cursor-pointer">
            <Plus size={16} strokeWidth={3} />
            {activeTab === "Beban" ? "Tambah Main" : "Tambah Akun"}
          </button>
        </div>
      </div>

      {/* TAMPILAN UNTUK TAB "Semua" DAN "Aset" */}
      {(activeTab === "Semua" || activeTab === "Aset") && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f4ef] border-b border-stone-200 text-stone-500 text-[11px] uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Nomor Akun</th>
                  <th className="px-6 py-4">Nama Akun</th>
                  {activeTab === "Semua" && <th className="px-6 py-4">Tipe</th>}
                  {activeTab === "Semua" && <th className="px-6 py-4">Standar</th>}
                  <th className="px-6 py-4">Saldo Normal</th>
                  <th className="px-6 py-4 text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {COA_DATA.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition text-[13px]">
                    <td className="px-6 py-4 font-bold text-stone-800">{item.no}</td>
                    <td className="px-6 py-4 font-medium text-stone-700">{item.nama}</td>
                    
                    {activeTab === "Semua" && (
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#e6f4ea] text-[#117a5b] text-[11px] font-bold rounded-md">
                          {item.tipe}
                        </span>
                      </td>
                    )}
                    
                    {activeTab === "Semua" && (
                      <td className="px-6 py-4 text-stone-500 font-medium">{item.standar}</td>
                    )}
                    
                    <td className="px-6 py-4 text-stone-500 font-medium">{item.saldo}</td>
                    
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer border border-stone-200 shadow-sm bg-white">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* TAMPILAN UNTUK TAB "Beban" (Hierarchical) */}
      {activeTab === "Beban" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          
          {/* Header Tabel Beban */}
          <div className="bg-[#f5f4ef] border-b border-stone-200 px-6 py-4 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            <span>Main - Sub - Keterangan</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* --- MAIN: Biaya Marketing Proyek --- */}
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="bg-[#f5f4ef] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#eae8e0] transition"
                onClick={() => toggleMain("marketing")}
              >
                <div className="flex items-center gap-2">
                  {expandedMains.includes("marketing") ? <ChevronDown size={16} className="text-stone-500" /> : <ChevronRight size={16} className="text-stone-500" />}
                  <span className="text-[10px] font-bold text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200 shadow-sm">MAIN</span>
                  <span className="font-bold text-stone-800 text-[13px]">Biaya Marketing Proyek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                  <button className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                </div>
              </div>

              {expandedMains.includes("marketing") && (
                <div className="p-4 pl-8 border-t border-stone-200 space-y-4">
                  {/* SUB 1 */}
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSub("marketing-1")}
                    >
                      <div className="flex items-center gap-2">
                        {expandedSubs.includes("marketing-1") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Marketing Proyek</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                    {expandedSubs.includes("marketing-1") && (
                      <div className="pl-6 pt-2 pb-1">
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUB 2 */}
                   <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => toggleSub("marketing-2")}
                    >
                      <div className="flex items-center gap-2">
                        {expandedSubs.includes("marketing-2") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Marketing Proyek Lainnya</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                    {expandedSubs.includes("marketing-2") && (
                      <div className="pl-6 pt-2 pb-1">
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                     <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                        <Plus size={12} strokeWidth={3} /> Tambah Sub
                      </button>
                  </div>
                </div>
              )}
            </div>

            {/* --- MAIN: Biaya Administrasi Proyek --- */}
             <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="bg-[#f5f4ef] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#eae8e0] transition"
                onClick={() => toggleMain("admin")}
              >
                <div className="flex items-center gap-2">
                  {expandedMains.includes("admin") ? <ChevronDown size={16} className="text-stone-500" /> : <ChevronRight size={16} className="text-stone-500" />}
                  <span className="text-[10px] font-bold text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200 shadow-sm">MAIN</span>
                  <span className="font-bold text-stone-800 text-[13px]">Biaya Administrasi Proyek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                  <button className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                </div>
              </div>

               {expandedMains.includes("admin") && (
                <div className="p-4 pl-8 border-t border-stone-200 space-y-4">
                  
                  {/* SUB Jaminan */}
                  <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("admin-1")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("admin-1") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Jaminan Proyek</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                     {expandedSubs.includes("admin-1") && (
                      <div className="pl-6 pt-2 pb-1">
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                   {/* SUB Kontrak */}
                  <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("admin-2")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("admin-2") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Pembuatan Dokumen Kontrak</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                     {expandedSubs.includes("admin-2") && (
                      <div className="pl-6 pt-2 pb-1">
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUB Lainnya */}
                   <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("admin-3")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("admin-3") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Administrasi Proyek Lainnya</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                     {expandedSubs.includes("admin-3") && (
                      <div className="pl-6 pt-2 pb-1">
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                     <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                        <Plus size={12} strokeWidth={3} /> Tambah Sub
                      </button>
                  </div>
                </div>
               )}
             </div>

            {/* --- MAIN: Biaya Produksi Proyek (Expanded with items) --- */}
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="bg-[#f5f4ef] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#eae8e0] transition"
                onClick={() => toggleMain("produksi")}
              >
                <div className="flex items-center gap-2">
                  {expandedMains.includes("produksi") ? <ChevronDown size={16} className="text-stone-500" /> : <ChevronRight size={16} className="text-stone-500" />}
                  <span className="text-[10px] font-bold text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200 shadow-sm">MAIN</span>
                  <span className="font-bold text-stone-800 text-[13px]">Biaya Produksi Proyek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                  <button className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition bg-white border border-stone-200 shadow-sm" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                </div>
              </div>

               {expandedMains.includes("produksi") && (
                <div className="p-4 pl-8 border-t border-stone-200 space-y-5">
                  
                  {/* SUB Personil */}
                  <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("produksi-1")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("produksi-1") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Personil</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                    {expandedSubs.includes("produksi-1") && (
                      <div className="pl-5 mt-2 space-y-1">
                        <div className="flex items-center justify-between py-1.5 group">
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] text-stone-400">KET</span>
                              <span className="text-[12px] text-stone-600">Gaji Personil</span>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                              <button className="text-stone-400 hover:text-stone-700"><Settings size={12} /></button>
                              <button className="text-stone-400 hover:text-red-600"><X size={12} /></button>
                           </div>
                        </div>
                        <div className="flex items-center justify-between py-1.5 group">
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] text-stone-400">KET</span>
                              <span className="text-[12px] text-stone-600">Biaya Personil Lainnya</span>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                              <button className="text-stone-400 hover:text-stone-700"><Settings size={12} /></button>
                              <button className="text-stone-400 hover:text-red-600"><X size={12} /></button>
                           </div>
                        </div>
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SUB Non Personil */}
                   <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("produksi-2")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("produksi-2") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Non Personil</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                    {expandedSubs.includes("produksi-2") && (
                      <div className="pl-5 mt-2 space-y-1">
                        {["Biaya Perjalanan Dinas", "Biaya Pembahasan / Presentasi", "Biaya Pelaporan", "Biaya Pelatihan", "Biaya Sosialisasi", "Biaya Non Personil Lainnya"].map((ket, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 group">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-stone-400">KET</span>
                                <span className="text-[12px] text-stone-600">{ket}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                <button className="text-stone-400 hover:text-stone-700"><Settings size={12} /></button>
                                <button className="text-stone-400 hover:text-red-600"><X size={12} /></button>
                            </div>
                          </div>
                        ))}
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                   {/* SUB Pengadaan Barang dan Jasa */}
                   <div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub("produksi-3")}>
                      <div className="flex items-center gap-2">
                         {expandedSubs.includes("produksi-3") ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                        <span className="text-[9px] font-bold text-stone-400">SUB</span>
                        <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">Biaya Pengadaan Barang dan Jasa</span>
                      </div>
                       <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                         <button className="p-1 text-stone-400 hover:text-stone-700" onClick={(e) => e.stopPropagation()}><Settings size={14} /></button>
                         <button className="p-1 text-stone-400 hover:text-red-600" onClick={(e) => e.stopPropagation()}><X size={14} /></button>
                      </div>
                    </div>
                    {expandedSubs.includes("produksi-3") && (
                      <div className="pl-5 mt-2 space-y-1">
                        {["Pembelian Barang Kena Pajak", "Pembelian Jasa Kena Pajak", "Pembelian Software", "Pengadaan Jaringan"].map((ket, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 group">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-stone-400">KET</span>
                                <span className="text-[12px] text-stone-600">{ket}</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                <button className="text-stone-400 hover:text-stone-700"><Settings size={12} /></button>
                                <button className="text-stone-400 hover:text-red-600"><X size={12} /></button>
                            </div>
                          </div>
                        ))}
                        <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>


                  <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                     <button className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2">
                        <Plus size={12} strokeWidth={3} /> Tambah Sub
                      </button>
                  </div>

                </div>
               )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}