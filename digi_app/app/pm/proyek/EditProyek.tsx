"use client";

import React, { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

type ProyekDataMinimal = {
  id: number;
  nama: string;
  deskripsi?: string;
  tanggalMulai: string; // ISO string
  tanggalSelesai?: string | null;
  status: string;
};

export default function EditProyekModal({
  proyek,
  onClose,
  onSave,
}: {
  proyek: ProyekDataMinimal;
  onClose: () => void;
  onSave: () => void;
}) {
  const toDateInput = (isoOrDateStr?: string | null): string => {
    if (!isoOrDateStr) return "";
    // Backend now sends "YYYY-MM-DD" — use directly
    return isoOrDateStr.slice(0, 10);
  };

  const [nama, setNama] = useState(proyek.nama || "");
  const [deskripsi, setDeskripsi] = useState(proyek.deskripsi || "");
  const [status, setStatus] = useState(proyek.status || "AKTIF");
  const [tanggalMulai, setTanggalMulai] = useState(() => toDateInput(proyek.tanggalMulai));
  const [tanggalSelesai, setTanggalSelesai] = useState(() => toDateInput(proyek.tanggalSelesai));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nama || !tanggalMulai) {
      setError("Nama Proyek dan Tanggal Mulai wajib diisi!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyek.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          deskripsi: deskripsi || null,
          status,
          tanggalMulai: new Date(tanggalMulai).toISOString(),
          tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal memperbarui proyek");
        return;
      }
      onSave();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "AKTIF", label: "Active" },
    { value: "PLANNING", label: "Planning" },
    { value: "DONE", label: "Done" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="font-bold text-[15px] text-stone-900">Edit Proyek</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[12px] font-medium text-red-700">
              {error}
            </div>
          )}

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
                const isSelected = status === opt.value;
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
              <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai</label>
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
                disabled={submitting}
                className="px-4 py-2 border border-stone-200 rounded-xl text-[12px] font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-950 text-white text-[12px] font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
