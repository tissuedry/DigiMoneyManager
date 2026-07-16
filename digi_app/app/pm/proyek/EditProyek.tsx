"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

type ProyekDataMinimal = {
  nama: string;
  deskripsi?: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export default function EditProyekModal({
  proyek,
  onClose,
  onSave,
}: {
  proyek: ProyekDataMinimal;
  onClose: () => void;
  onSave: (updated: {
    nama: string;
    deskripsi: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    status: string;
  }) => void;
}) {
  // Helper to convert "12 Jan 2026" to "2026-01-12"
  const parseMockDate = (dStr: string): string => {
    if (!dStr) return "";
    const parts = dStr.split(" ");
    if (parts.length < 3) return dStr;
    const day = parts[0].padStart(2, "0");
    const indonesianMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const englishMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let monthIdx = indonesianMonths.indexOf(parts[1]);
    if (monthIdx === -1) {
      monthIdx = englishMonths.indexOf(parts[1]);
    }
    const month = (monthIdx === -1 ? 0 : monthIdx + 1).toString().padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  };

  // Helper to convert "2026-01-12" back to "12 Jan 2026"
  const formatMockDate = (dStr: string): string => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    if (parts.length < 3) return dStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const indonesianMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const month = indonesianMonths[monthIdx] || "Jan";
    const day = parseInt(parts[2], 10).toString();
    return `${day} ${month} ${year}`;
  };

  const [nama, setNama] = useState(proyek.nama || "");
  const [deskripsi, setDeskripsi] = useState(proyek.deskripsi || "Deskripsi singkat tujuan dan lingkup proyek...");
  const [status, setStatus] = useState(proyek.status || "Aktif");
  const [tanggalMulai, setTanggalMulai] = useState(() => parseMockDate(proyek.tanggalMulai));
  const [tanggalSelesai, setTanggalSelesai] = useState(() => parseMockDate(proyek.tanggalSelesai));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !tanggalMulai) {
      alert("Nama Proyek dan Tanggal Mulai wajib diisi!");
      return;
    }
    onSave({
      nama,
      deskripsi,
      status,
      tanggalMulai: formatMockDate(tanggalMulai),
      tanggalSelesai: formatMockDate(tanggalSelesai),
    });
  };

  const statusOptions = [
    { value: "Aktif", label: "Active" },
    { value: "Planning", label: "Planning" },
    { value: "Done", label: "Done" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-[15px] text-stone-900">Edit Proyek</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-800 font-medium"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {statusOptions.map((opt) => {
                const isSelected = status.toLowerCase() === opt.value.toLowerCase();
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-3.5 py-1.5 text-[12px] font-bold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#008f5d] bg-[#e6f4ea] text-[#005836]"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai *</label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white text-stone-800 font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai (Opsional)</label>
              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white text-stone-800 font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 font-medium">
              <span className="text-red-500">*</span> wajib diisi
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-200 rounded-xl text-[12px] font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-950 text-white text-[12px] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check size={14} />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
