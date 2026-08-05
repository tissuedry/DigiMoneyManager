"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2, Plus, AlertCircle, Check } from "lucide-react";

interface PosAnggaran {
  id: string;
  nama: string;
  nominal: number | string;
}

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
  initialTotal?: string;
}

export default function EditBudgetModal({
  isOpen,
  onClose,
  projectName = "QA-Alif Week 6",
  initialTotal = "Rp 100.00 jt"
}: EditBudgetModalProps) {
  const [posList, setPosList] = useState<PosAnggaran[]>([
    { id: "1", nama: "Biaya Marketing Proyek", nominal: 10000000 },
    { id: "2", nama: "Biaya Administrasi Proyek", nominal: 10000000 },
    { id: "3", nama: "Biaya Produksi Proyek", nominal: 80000000 },
  ]);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setPosList([
        { id: "1", nama: "Biaya Marketing Proyek", nominal: 10000000 },
        { id: "2", nama: "Biaya Administrasi Proyek", nominal: 10000000 },
        { id: "3", nama: "Biaya Produksi Proyek", nominal: 80000000 },
      ]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddPos = () => {
    setPosList([
      ...posList,
      { id: Math.random().toString(36).substr(2, 9), nama: "", nominal: "" }
    ]);
  };

  const handleRemovePos = (id: string) => {
    setPosList(posList.filter(pos => pos.id !== id));
  };

  const handleChangePos = (id: string, field: keyof PosAnggaran, value: string | number) => {
    setPosList(posList.map(pos => pos.id === id ? { ...pos, [field]: value } : pos));
  };

  // Kalkulasi total
  const totalNominal = posList.reduce((acc, pos) => {
    const val = Number(pos.nominal) || 0;
    return acc + val;
  }, 0);

  // Format currency untuk preview total (Sederhana)
  const formatCurrency = (val: number) => {
    if (val >= 1000000 && val < 1000000000) return `Rp ${(val / 1000000).toFixed(2)} jt`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-[640px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[20px] font-bold text-stone-900 leading-tight">Perbarui Budget Proyek</h2>
            <p className="text-[14px] text-stone-500 mt-1">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-8 overflow-y-auto custom-scrollbar flex-1 pb-4">
          
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Pos Anggaran</h3>
            <p className="text-[13px] text-stone-500">
              Total: <span className="font-bold text-stone-900">{formatCurrency(totalNominal)}</span>
            </p>
          </div>

          <div className="space-y-3 mb-4">
            {posList.map((pos) => (
              <div key={pos.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={pos.nama}
                  onChange={(e) => handleChangePos(pos.id, "nama", e.target.value)}
                  placeholder="Nama Pos Anggaran"
                  className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 text-[14px] outline-none focus:border-stone-400 transition"
                />
                <input
                  type="number"
                  value={pos.nominal}
                  onChange={(e) => handleChangePos(pos.id, "nominal", e.target.value)}
                  placeholder="Nominal"
                  className="w-[180px] px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 text-[14px] outline-none focus:border-stone-400 transition"
                />
                <button 
                  onClick={() => handleRemovePos(pos.id)}
                  className="p-3 text-stone-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={handleAddPos}
            className="flex items-center gap-2 text-[13px] font-bold text-[#008f5d] hover:bg-emerald-50 px-3 py-2 rounded-lg transition -ml-3 mb-6"
          >
            <Plus size={16} /> Tambah Pos Anggaran
          </button>

          {/* Summary Box */}
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-6 flex justify-between items-center mb-6">
            <div>
              <p className="text-[13px] text-stone-500 mb-1">Total RAB</p>
              <p className="text-[13px] text-stone-500">Jumlah Pos</p>
            </div>
            <div className="text-right">
              <p className="text-[16px] font-bold text-stone-900 mb-0.5">{formatCurrency(totalNominal)}</p>
              <p className="text-[13px] text-stone-600">{posList.length} pos anggaran</p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-[#fff9e6] border border-amber-200 rounded-xl p-4 flex gap-3 mb-2">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-800 leading-relaxed">
              Proyek ini sudah memiliki budget. Menyimpan akan <strong className="text-amber-900 font-bold">menghapus dan mengganti</strong> semua pos anggaran yang belum dipakai.
            </p>
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="px-8 py-6 border-t border-stone-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[14px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition cursor-pointer shadow-sm"
          >
            Batal
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 flex items-center gap-2 text-[14px] font-bold text-white bg-[#307c5a] border border-[#307c5a] rounded-xl hover:bg-[#256347] transition cursor-pointer shadow-sm"
          >
            <Check size={16} /> Perbarui Budget
          </button>
        </div>

      </div>
    </div>
  );
}