"use client";

import React, { useState, useEffect } from "react";
import { Upload, Plus, Settings, ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";

// Import Modal
import EditMainModal from "./EditMainModal";
import EditSubModal from "./EditSubModal";
import TambahKategoriModal from "./TambahKategoriModal";
import DeleteModal from "./DeleteModal";

type TabType = "Semua" | "Aset" | "Beban";
type ModalType = "editMain" | "editSub" | "tambahMain" | "tambahSub" | "deleteMain" | "deleteSub" | null;

export default function MasterCoAPage() {
  const [activeTab, setActiveTab] = useState<TabType>("Semua");
  const [expandedMains, setExpandedMains] = useState<string[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: ModalType; data: any }>({
    isOpen: false, type: null, data: null,
  });

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const resMaster = await fetch("/api/master?type=all", { cache: "no-store" });
      if (resMaster.ok) {
        const json = await resMaster.json();
        const result = Array.isArray(json) ? json : json.data || [];
        setMasterData(Array.isArray(result) ? result : []);
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

  const openModal = (type: ModalType, data: any = null) => setModalConfig({ isOpen: true, type, data });
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null });

  // Filter master data berdasarkan tab aktif (Aset = pemasukan, Beban = pengeluaran, Semua = all)
  const filteredMasterData = masterData.filter((item) => {
    if (activeTab === "Aset") {
      return item.tipe === "pemasukan";
    }
    if (activeTab === "Beban") {
      return item.tipe === "pengeluaran";
    }
    return true;
  });

  const getDeleteType = (type: ModalType) => {
    if (type === 'deleteMain') return 'main';
    if (type === 'deleteSub') return 'sub';
    return null;
  };

  const getTabLabel = () => {
    if (activeTab === "Aset") return "Revenue / Pemasukan";
    if (activeTab === "Beban") return "Expense / Pengeluaran";
    return "Semua Kategori";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Chart of Accounts & Master Anggaran</h1>
        <p className="text-stone-500 mt-1 text-[15px]">Kelola referensi akun pemasukan/revenue serta pengeluaran/expense proyek dalam struktur Main dan Sub.</p>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-stone-200/50 p-1 rounded-xl w-fit">
          {(["Semua", "Aset", "Beban"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                activeTab === tab ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab === "Aset" ? "Revenue (Pemasukan)" : tab === "Beban" ? "Expense (Pengeluaran)" : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => openModal('tambahMain', { tipe: activeTab === 'Aset' ? 'pemasukan' : 'pengeluaran' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#008f5d] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#007a4f] transition cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> Tambah Main {activeTab === 'Aset' ? 'Pemasukan' : activeTab === 'Beban' ? 'Pengeluaran' : ''}
          </button>
        </div>
      </div>

      {/* HIRARKI TREE MASTER MAIN & SUB */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="bg-[#f5f4ef] border-b border-stone-200 px-6 py-4 flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0">
          <span>Struktur Master {getTabLabel()} (Main - Sub)</span>
          <span>{filteredMasterData.length} Main Items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingData ? (
            <div className="text-center py-12 text-stone-400">
              <Loader2 className="animate-spin mx-auto mb-2" size={24} />
              Memuat data master...
            </div>
          ) : filteredMasterData.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              Belum ada data master terdaftar untuk kategori ini. Silakan tambahkan Main baru.
            </div>
          ) : (
            filteredMasterData.map((mainItem) => {
              const isMainOpen = expandedMains.includes(String(mainItem.id));
              const isPemasukan = mainItem.tipe === 'pemasukan';

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
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPemasukan ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {isPemasukan ? "Revenue / Pemasukan" : "Expense / Pengeluaran"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal('editMain', { ...mainItem, main: mainItem.nama }); }} 
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
                    <div className="p-4 pl-8 border-t border-stone-200 space-y-3">
                      {mainItem.MasterSub && mainItem.MasterSub.length > 0 ? (
                        mainItem.MasterSub.map((subItem: any) => (
                          <div key={subItem.id} className="flex items-center justify-between py-1 px-2 hover:bg-stone-50 rounded-lg group">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-stone-400">SUB</span>
                              <span className="font-bold text-stone-700 text-[12px]">{subItem.nama}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openModal('editSub', { ...subItem, main: mainItem.nama, sub: subItem.nama })}
                                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                <Settings size={14} />
                              </button>
                              <button 
                                onClick={() => openModal('deleteSub', subItem)} 
                                className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-stone-400 italic">Belum ada Sub pada Main ini.</div>
                      )}

                      <div className="pl-2 pt-1 border-t border-stone-100 mt-2">
                        <button 
                          onClick={() => openModal('tambahSub', { parentId: mainItem.id, main: mainItem.nama, tipe: mainItem.tipe })}
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

      {/* RENDER MODAL */}
      <EditMainModal isOpen={modalConfig.isOpen && modalConfig.type === 'editMain'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <EditSubModal isOpen={modalConfig.isOpen && modalConfig.type === 'editSub'} onClose={closeModal} data={modalConfig.data} onRefresh={fetchData} />
      <TambahKategoriModal isOpen={modalConfig.isOpen && (modalConfig.type === 'tambahMain' || modalConfig.type === 'tambahSub')} onClose={closeModal} type={modalConfig.type} data={modalConfig.data} onRefresh={fetchData} />
      <DeleteModal 
        isOpen={modalConfig.isOpen && ['deleteMain', 'deleteSub'].includes(modalConfig.type as string)}
        onClose={closeModal}
        data={modalConfig.data}
        type={getDeleteType(modalConfig.type)}
        onRefresh={fetchData}
      />
    </div>
  );
}