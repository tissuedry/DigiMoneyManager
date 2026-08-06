"use client";

import React, { useState, useEffect } from "react";
import { Upload, Plus, MoreHorizontal, Settings, X, ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";

// Import semua Modal yang sudah terhubung backend
import EditMainModal from "./EditMainModal";
import EditSubModal from "./EditSubModal";
import EditKetModal from "./EditKetModal";
import TambahAkunModal from "./TambahAkunModal";
import TambahKategoriModal from "./TambahKategoriModal";
import EditAkunModal from "./EditAkunModal";
import DeleteModal from "./DeleteModal";

type TabType = "Semua" | "Aset" | "Beban";
type ModalType = "editMain" | "editSub" | "editKet" | "tambahMain" | "tambahSub" | "tambahKet" | "tambahAkun" | "editAkun" | "deleteAkun" | "deleteMain" | "deleteSub" | "deleteKet" | null;

export default function MasterCoAPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Semua");
  const [expandedMains, setExpandedMains] = useState<string[]>([]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);

  const [masterData, setMasterData] = useState<any[]>([]);
  const [coaData, setCoaData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: ModalType; data: any }>({
    isOpen: false, type: null, data: null,
  });

  // Fungsi untuk mengambil data Master (Beban) dan COA (Aset/Akun) dari backend
  const fetchData = async () => {
    setLoadingData(true);
    try {
      // PERBAIKAN: Gunakan cache: "no-store" agar selalu memuat data terbaru
      const resMaster = await fetch("/api/master?type=all", { cache: "no-store" });
      if (resMaster.ok) {
        const json = await resMaster.json();
        const result = Array.isArray(json) ? json : json.data || [];
        setMasterData(Array.isArray(result) ? result : []);
      }

      // PERBAIKAN: Gunakan cache: "no-store"
      const resCoa = await fetch("/api/coa", { cache: "no-store" });
      if (resCoa.ok) {
        const jsonCoa = await resCoa.json();
        const resultCoa = Array.isArray(jsonCoa) ? jsonCoa : jsonCoa.coa || jsonCoa.data || jsonCoa.accounts || [];
        setCoaData(Array.isArray(resultCoa) ? resultCoa : []);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleMain = (id: string | number) => {
    const stringId = String(id);
    setExpandedMains(prev => prev.includes(stringId) ? prev.filter(m => m !== stringId) : [...prev, stringId]);
  };

  const toggleSub = (id: string | number) => {
    const stringId = String(id);
    setExpandedSubs(prev => prev.includes(stringId) ? prev.filter(s => s !== stringId) : [...prev, stringId]);
  };

  const openModal = (type: ModalType, data: any = null) => setModalConfig({ isOpen: true, type, data });
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null });

  // Filter data COA berdasarkan tab aktif (Aset vs Semua)
  const filteredCoaData = coaData.filter((item) => {
    if (activeTab === "Aset") {
      return item.tipe?.toLowerCase() === "aset" || item.tipe?.toLowerCase() === "asset";
    }
    return true; // Tab "Semua" menampilkan seluruh Chart of Accounts
  });

  // Fungsi helper untuk meneruskan tipe ke DeleteModal
  const getDeleteType = (type: ModalType) => {
    if (type === 'deleteAkun') return 'akun';
    if (type === 'deleteMain') return 'main';
    if (type === 'deleteSub') return 'sub';
    if (type === 'deleteKet') return 'ket';
    return null;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Chart of Accounts & Master Anggaran</h1>
        <p className="text-stone-500 mt-1 text-[15px]">Kelola referensi akun aset pada COA serta struktur rincian beban/anggaran proyek.</p>
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
          {activeTab !== "Beban" && (
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
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Standar</th>
                  <th className="px-6 py-4">Saldo Normal</th>
                  <th className="px-6 py-4 text-right w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-stone-400">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Memuat data akun aset...
                    </td>
                  </tr>
                ) : filteredCoaData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-stone-400 text-sm">
                      Belum ada data Chart of Accounts untuk kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredCoaData.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-stone-50 transition text-[13px]">
                      <td className="px-6 py-4 font-bold text-stone-800">{item.nomorAkun || item.no}</td>
                      <td className="px-6 py-4 font-medium text-stone-700">{item.namaAkun || item.nama}</td>
                      <td><span className="px-2.5 py-1 bg-[#e6f4ea] text-[#117a5b] text-[11px] font-bold rounded-md">{item.tipe}</span></td>
                      <td className="px-6 py-4 text-stone-500 font-medium">{item.standar || "PSAK"}</td>
                      <td className="px-6 py-4 text-stone-500 font-medium">{item.saldoNormal || item.saldo || "Debit"}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openModal('editAkun', item)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer border border-stone-200 shadow-sm bg-white"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => openModal('deleteAkun', item)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-stone-200 shadow-sm bg-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB BEBAN */}
      {activeTab === "Beban" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="bg-[#f5f4ef] border-b border-stone-200 px-6 py-4 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
            <span>Struktur Master Beban & Anggaran (Main - Sub - Keterangan)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingData ? (
              <div className="text-center py-12 text-stone-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Memuat struktur master beban...
              </div>
            ) : masterData.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                Belum ada data master beban terdaftar. Silakan tambahkan Main baru.
              </div>
            ) : (
              masterData.map((mainItem) => {
                const isMainOpen = expandedMains.includes(String(mainItem.id));
                return (
                  <div key={mainItem.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                    <div 
                      className="bg-[#f5f4ef] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#eae8e0] transition"
                      onClick={() => toggleMain(mainItem.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isMainOpen ? <ChevronDown size={16} className="text-stone-500" /> : <ChevronRight size={16} className="text-stone-500" />}
                        <span className="text-[10px] font-bold text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200 shadow-sm">MAIN</span>
                        <span className="font-bold text-stone-800 text-[13px]">{mainItem.nama}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal('editMain', mainItem); }} 
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition bg-white border border-stone-200 shadow-sm cursor-pointer"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal('deleteMain', mainItem); }} 
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition bg-white border border-stone-200 shadow-sm cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isMainOpen && (
                      <div className="p-4 pl-8 border-t border-stone-200 space-y-5">
                        {mainItem.MasterSub && mainItem.MasterSub.map((subItem: any) => {
                          const isSubOpen = expandedSubs.includes(String(subItem.id));
                          return (
                            <div key={subItem.id}>
                              <div className="flex items-center justify-between cursor-pointer group" onClick={() => toggleSub(subItem.id)}>
                                <div className="flex items-center gap-2">
                                  {isSubOpen ? <ChevronDown size={14} className="text-stone-400" /> : <ChevronRight size={14} className="text-stone-400" />}
                                  <span className="text-[9px] font-bold text-stone-400">SUB</span>
                                  <span className="font-bold text-stone-700 text-[12px] group-hover:text-stone-900 transition">{subItem.nama}</span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openModal('editSub', subItem); }} 
                                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                                  >
                                    <Settings size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openModal('deleteSub', subItem); }} 
                                    className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {isSubOpen && (
                                <div className="pl-5 mt-2 space-y-1">
                                  {subItem.MasterKeterangan && subItem.MasterKeterangan.map((ketItem: any) => (
                                    <div key={ketItem.id} className="flex items-center justify-between py-1.5 group">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-stone-400">KET</span>
                                        <span className="text-[12px] text-stone-600">{ketItem.nama}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                        <button 
                                          onClick={() => openModal('editKet', ketItem)}
                                          className="text-stone-400 hover:text-stone-700 cursor-pointer"
                                        >
                                          <Settings size={12} />
                                        </button>
                                        <button 
                                          onClick={() => openModal('deleteKet', ketItem)}
                                          className="text-stone-400 hover:text-red-600 cursor-pointer"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <button 
                                    onClick={() => openModal('tambahKet', { parentId: subItem.id, main: mainItem.nama, sub: subItem.nama })}
                                    className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2 cursor-pointer"
                                  >
                                    <Plus size={12} strokeWidth={3} /> Tambah Keterangan
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                          <button 
                            onClick={() => openModal('tambahSub', { parentId: mainItem.id, main: mainItem.nama })}
                            className="text-[11px] font-bold text-[#008f5d] hover:text-[#006b45] flex items-center gap-1 transition mt-2 cursor-pointer"
                          >
                            <Plus size={12} strokeWidth={3} /> Tambah Sub
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RENDER MODAL */}
      <EditMainModal isOpen={modalConfig.isOpen && modalConfig.type === 'editMain'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <EditSubModal isOpen={modalConfig.isOpen && modalConfig.type === 'editSub'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <EditKetModal isOpen={modalConfig.isOpen && modalConfig.type === 'editKet'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <TambahAkunModal isOpen={modalConfig.isOpen && modalConfig.type === 'tambahAkun'} onClose={closeModal} onRefresh={fetchData} />
      <TambahKategoriModal isOpen={modalConfig.isOpen && (modalConfig.type === 'tambahMain' || modalConfig.type === 'tambahSub' || modalConfig.type === 'tambahKet')} onClose={closeModal} type={modalConfig.type} data={modalConfig.data} onRefresh={fetchData} />
      <EditAkunModal isOpen={modalConfig.isOpen && modalConfig.type === 'editAkun'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <DeleteModal 
        isOpen={modalConfig.isOpen && ['deleteAkun', 'deleteMain', 'deleteSub', 'deleteKet'].includes(modalConfig.type as string)}
        onClose={closeModal}
        data={modalConfig.data}
        type={getDeleteType(modalConfig.type)}
        onRefresh={fetchData}
      />
    </div>
  );
}