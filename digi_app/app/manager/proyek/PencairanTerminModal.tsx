"use client";
import React, { useState, useEffect } from "react";
import { X, Check, Loader2, TrendingUp } from "lucide-react";

type Termin = {
  id: number;
  namaTermin: string;
  nominal: string | number;
  persentaseProgress: string | number;
  status: string;
  urutan: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  termin: Termin[];
  onSuccess: () => void;
};

function formatRupiahDisplay(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

export default function PencairanTerminModal({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  termin,
  onSuccess,
}: Props) {
  const belumDiterima = termin
    .filter((t) => t.status === "BELUM_DITERIMA")
    .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));

  const nextTermin = belumDiterima.length > 0 ? belumDiterima[0] : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset error saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nextTermin) {
      setError("Semua termin sudah dicairkan");
      return;
    }

    const tanggalHariIni = new Date().toLocaleDateString('en-CA');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminId: nextTermin.id,
          tanggalPencairan: tanggalHariIni,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal melakukan pencairan termin");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-7 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-1 text-stone-400 hover:text-stone-700 transition rounded-md hover:bg-stone-100"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-emerald-700" strokeWidth={2.5} />
            </div>
            <h2 className="text-[20px] font-bold text-stone-900 tracking-tight">Pencairan Termin</h2>
          </div>
          <p className="text-[13px] text-stone-500 mt-0.5 truncate">{proyekNama}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left flex-1">
          {/* Termin (Read Only) */}
          <div>
            <label className="block text-[13px] font-bold text-stone-900 mb-2">
              Termin
            </label>
            <input
              type="text"
              readOnly
              value={nextTermin ? nextTermin.namaTermin : "Semua termin sudah dicairkan"}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[14px] text-stone-800 bg-[#F8F7F4] font-medium outline-none cursor-default"
            />
          </div>

          {/* Grid: Nominal & Persentase (readonly dari data real) */}
          {nextTermin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-stone-900 mb-2">Nominal</label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiahDisplay(nextTermin.nominal)}
                  className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-stone-900 mb-2">Progress</label>
                <input
                  type="text"
                  readOnly
                  value={`${parseFloat(String(nextTermin.persentaseProgress)) || 0}%`}
                  className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !nextTermin}
              className="px-5 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-semibold rounded-xl hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} strokeWidth={3} />
              )}
              Konfirmasi Pencairan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}