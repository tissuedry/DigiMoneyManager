"use client";

import React, { useState } from "react";
import { Check, Download, ChevronDown, Wallet } from "lucide-react";
import EditBudgetModal from "./EditBudgetModal"; // Pastikan berada di folder yang sama

// --- MOCK DATA ---
const BUDGET_DATA = [
  {
    id: "P-01",
    title: "QA-Alif Week 6",
    status: "DONE",
    date: "4 Agu 2026",
    rabTotal: "Rp 100.00 jt",
    terpakaiAmount: "Rp 0",
    terpakaiPercent: 0,
    sisaAmount: "Rp 100.00 jt",
    posCount: 3,
    posList: [
      { nama: "Biaya Marketing Proyek", terpakai: "Rp 0", total: "Rp 10.00 jt" },
      { nama: "Biaya Administrasi Proyek", terpakai: "Rp 0", total: "Rp 10.00 jt" },
      { nama: "Biaya Produksi Proyek", terpakai: "Rp 0", total: "Rp 80.00 jt" },
    ]
  },
  {
    id: "P-02",
    title: "FTTH RANCAMANYAR",
    status: "AKTIF",
    date: "30 Jul 2026",
    rabTotal: "Rp 50.00 jt",
    terpakaiAmount: "Rp 117.000",
    terpakaiPercent: 0,
    sisaAmount: "Rp 49.88 jt",
    posCount: 3,
    posList: [
      { nama: "Biaya Material Fiber", terpakai: "Rp 117.000", total: "Rp 25.00 jt" },
      { nama: "Biaya Jasa Penarikan", terpakai: "Rp 0", total: "Rp 15.00 jt" },
      { nama: "Biaya Perizinan", terpakai: "Rp 0", total: "Rp 10.00 jt" },
    ]
  },
  {
    id: "P-03",
    title: "Penyebaran Laptop Daerah Bojongsoang",
    status: "AKTIF",
    date: "30 Jul 2026",
    rabTotal: "Rp 5.00 M",
    terpakaiAmount: "Rp 594.00 jt",
    terpakaiPercent: 12,
    sisaAmount: "Rp 4.41 M",
    posCount: 3,
    posList: [
      { nama: "Biaya Produksi Proyek", terpakai: "Rp 500.00 jt", total: "Rp 4.00 M" },
      { nama: "Biaya Administrasi Proyek", terpakai: "Rp 44.00 jt", total: "Rp 500.00 jt" },
      { nama: "Biaya Marketing Proyek", terpakai: "Rp 50.00 jt", total: "Rp 500.00 jt" },
    ]
  },
  {
    id: "P-04",
    title: "QA-Alif",
    status: "AKTIF",
    date: "28 Jul 2026",
    rabTotal: "Rp 1.00 jt",
    terpakaiAmount: "Rp 649.950",
    terpakaiPercent: 65,
    sisaAmount: "Rp 350.050",
    posCount: 3,
    posList: [
      { nama: "Biaya Operasional", terpakai: "Rp 400.000", total: "Rp 500.000" },
      { nama: "Biaya Konsumsi", terpakai: "Rp 249.950", total: "Rp 300.000" },
      { nama: "Biaya Lain-lain", terpakai: "Rp 0", total: "Rp 200.000" },
    ]
  }
];

export default function BudgetProyekPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // State untuk menyimpan ID proyek mana saja yang sedang di-expand (dibuka pos anggarannya)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderStatusBadge = (status: string) => {
    if (status === "DONE") {
      return <span className="px-2 py-0.5 bg-stone-100 text-stone-600 font-bold rounded text-[10px]">DONE</span>;
    }
    return <span className="px-2 py-0.5 bg-emerald-50 text-[#008f5d] font-bold rounded text-[10px]">AKTIF</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] overflow-y-auto bg-[#fdfcf9] custom-scrollbar">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
        
        {/* Page Title & Desc */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-stone-900 mb-2">Manajemen Budget Proyek</h1>
          <p className="text-[13px] text-stone-500">
            Inisialisasi dan kelola RAB (Rencana Anggaran Biaya) per proyek. Budget yang diinisialisasi memungkinkan PM menambah pos anggaran.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[13px] font-medium text-stone-500 mb-3">Total Proyek</h3>
            <p className="text-[32px] font-bold text-stone-900">4</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[13px] font-medium text-stone-500 mb-3">Budget Belum Diinisialisasi</h3>
            <p className="text-[32px] font-bold text-[#008f5d]">0</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[13px] font-medium text-stone-500 mb-3">Budget Aktif</h3>
            <p className="text-[32px] font-bold text-[#008f5d]">4</p>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2 mb-6">
          <Check size={18} className="text-[#008f5d]" />
          <h2 className="text-[14px] font-bold text-stone-900">Budget Aktif (4)</h2>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
          {BUDGET_DATA.map((project) => {
            const isExpanded = expandedCards[project.id];

            return (
              <div key={project.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 self-start">
                
                {/* Card Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e6f4ef] flex items-center justify-center shrink-0">
                      <Wallet size={20} className="text-[#008f5d]" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-stone-900 mb-1.5">{project.title}</h3>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(project.status)}
                        <span className="text-[12px] text-stone-400">{project.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#008f5d] text-[#008f5d] hover:bg-[#e6f4ef] rounded-lg text-[12px] font-bold transition">
                      <Download size={14} /> Export
                    </button>
                    <button 
                      onClick={() => openEditModal(project)}
                      className="px-4 py-1.5 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg text-[12px] font-bold transition"
                    >
                      Edit Budget
                    </button>
                  </div>
                </div>

                {/* RAB Total */}
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[13px] text-stone-500">RAB Total</span>
                  <span className="text-[16px] font-bold text-stone-900">{project.rabTotal}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-stone-100 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#00cf83] rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${project.terpakaiPercent}%` }}
                  />
                </div>

                {/* Terpakai & Sisa */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[12px] text-stone-400">
                    Terpakai: <span className="text-stone-500">{project.terpakaiAmount} ({project.terpakaiPercent}%)</span>
                  </span>
                  <span className="text-[12px] text-stone-400">
                    Sisa: <span className="text-stone-500">{project.sisaAmount}</span>
                  </span>
                </div>

                {/* Accordion Trigger */}
                <button 
                  onClick={() => toggleExpand(project.id)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-800 transition outline-none cursor-pointer"
                >
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`} 
                  /> 
                  {isExpanded ? "Tutup pos anggaran" : `Lihat pos anggaran (${project.posCount})`}
                </button>

                {/* Accordion Content (List Pos Anggaran) */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {project.posList.map((pos, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[12px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                          <span className="text-stone-600 font-medium">{pos.nama}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-stone-900 font-bold">{pos.terpakai}</span>
                          <span className="text-stone-400"> / {pos.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            );
          })}
        </div>

      </div>

      {/* Render Edit Budget Modal */}
      <EditBudgetModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        projectName={selectedProject?.title}
        initialTotal={selectedProject?.rabTotal}
      />

    </div>
  );
}