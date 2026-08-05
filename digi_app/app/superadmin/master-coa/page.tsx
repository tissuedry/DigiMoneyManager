"use client";

import React, { useState } from "react";
import { Upload, Plus, MoreHorizontal, Settings, X, ChevronDown, ChevronRight } from "lucide-react";

// Import semua Modal dari folder yang sama
import EditMainModal from "./EditMainModal";
import EditSubModal from "./EditSubModal";
import EditKetModal from "./EditKetModal";
import TambahAkunModal from "./TambahAkunModal";
import TambahKategoriModal from "./TambahKategoriModal";

type TabType = "Semua" | "Aset" | "Beban";
type ModalType = "editMain" | "editSub" | "editKet" | "tambahMain" | "tambahSub" | "tambahKet" | "tambahAkun" | null;

const COA_DATA = [
  { no: "1-1101", nama: "Kas", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1102", nama: "Bank BCA - Operasional", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1103", nama: "Bank Mandiri - Payroll", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1201", nama: "Piutang Usaha", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
  { no: "1-1301", nama: "Persediaan Material", tipe: "Aset", standar: "PSAK", saldo: "Debit" },
];

export default function MasterCoAPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Semua");
  const [expandedMains, setExpandedMains] = useState<string[]>(["produksi"]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>(["produksi-1", "produksi-2", "produksi-3"]);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: ModalType; data: any }>({
    isOpen: false, type: null, data: null,
  });

  const toggleMain = (id: string) => setExpandedMains(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const toggleSub = (id: string) => setExpandedSubs(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const openModal = (type: ModalType, data: any = null) => setModalConfig({ isOpen: true, type, data });
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Chart of Accounts</h1>
        <p className="text-stone-500 mt-1 text-[15px]">Daftar akun yang menjadi referensi seluruh jurnal sistem. Sesuai standar PSAK / IFRS.</p>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-stone-200/50 p-1 rounded-xl w-fit">
          {(["Semua", "Aset", "Beban"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                activeTab === tab ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "Semua" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-xl text-sm font-bold shadow-sm hover:bg-stone-50 transition cursor-pointer">
              <Upload size={16} /> Import
            </button>
          )}
          
          <button 
            onClick={() => openModal(activeTab === "Beban" ? 'tambahMain' : 'tambahAkun')}
            className="flex items-center gap-2 px-4 py-2 bg-[#008f5d] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#007a4f] transition cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> {activeTab === "Beban" ? "Tambah Main" : "Tambah Akun"}
          </button>
        </div>
      </div>

      {/* TAB SEMUA / ASET */}
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
                    {activeTab === "Semua" && <td><span className="px-2.5 py-1 bg-[#e6f4ea] text-[#117a5b] text-[11px] font-bold rounded-md">{item.tipe}</span></td>}
                    {activeTab === "Semua" && <td className="px-6 py-4 text-stone-500 font-medium">{item.standar}</td>}
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

      {/* TAB BEBAN (Hierarchical) */}
      {activeTab === "Beban" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="bg-[#f5f4ef] border-b border-stone-200 px-6 py-4 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            <span>Main - Sub - Keterangan</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* --- MAIN: Biaya Produksi Proyek --- */}
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
                  <button 
                    onClick={(e) => { e.stopPropagation(); openModal('editMain', { main: 'Biaya Produksi Proyek' }) }} 
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition bg-white border border-stone-200 shadow-sm cursor-pointer"
                  >
                    <Settings size={14} />
                  </button>
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
                         <button 
                            onClick={(e) => { e.stopPropagation(); openModal('editSub', { main: 'Biaya Produksi Proyek', sub: 'Biaya Personil' }) }} 
                            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            <Settings size={14} />
                         </button>
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
                              <button 
                                onClick={() => openModal('editKet', { main: 'Biaya Produksi Proyek', sub: 'Biaya Personil', ket: 'Gaji Personil' })}
                                className="text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <Settings size={12} />
                              </button>
                              <button className="text-stone-400 hover:text-red-600"><X size={12} /></button>
                           </div>
                        </div>
                        <button 
                          onClick={() => openModal('tambahKet', { main: 'Biaya Produksi Proyek', sub: 'Biaya Personil' })}
                          className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2 cursor-pointer"
                        >
                          <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tambah Sub Button */}
                  <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                     <button 
                      onClick={() => openModal('tambahSub', { main: 'Biaya Produksi Proyek' })}
                      className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2 cursor-pointer"
                     >
                        <Plus size={12} strokeWidth={3} /> Tambah Sub
                      </button>
                  </div>
                </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC MODALS SECARA TERPISAH */}
      <EditMainModal isOpen={modalConfig.isOpen && modalConfig.type === 'editMain'} onClose={closeModal} data={modalConfig.data} />
      <EditSubModal isOpen={modalConfig.isOpen && modalConfig.type === 'editSub'} onClose={closeModal} data={modalConfig.data} />
      <EditKetModal isOpen={modalConfig.isOpen && modalConfig.type === 'editKet'} onClose={closeModal} data={modalConfig.data} />
      <TambahAkunModal isOpen={modalConfig.isOpen && modalConfig.type === 'tambahAkun'} onClose={closeModal} />
      <TambahKategoriModal isOpen={modalConfig.isOpen && (modalConfig.type === 'tambahMain' || modalConfig.type === 'tambahSub' || modalConfig.type === 'tambahKet')} onClose={closeModal} type={modalConfig.type} data={modalConfig.data} />

    </div>
  );
}