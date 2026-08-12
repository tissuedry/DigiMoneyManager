"use client";
import React, { useState, useEffect } from "react";
import { X, ChevronDown, CalendarDays, Check, Loader2, TrendingUp } from "lucide-react";
import DatePicker from "@/components/date-picker";

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
  const belumDiterima = termin.filter((t) => t.status === "BELUM_DITERIMA");

  const [selectedTerminId, setSelectedTerminId] = useState<string>("");
  const [tanggalPencairan, setTanggalPencairan] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedTerminId(belumDiterima.length > 0 ? String(belumDiterima[0].id) : "");
      setTanggalPencairan(new Date().toISOString().split("T")[0]);
      setError("");
    }
  }, [isOpen]);

  const [someState, setSomeState] = useState(false);

  if (!isOpen) return null;

  const selectedTermin = belumDiterima.find((t) => String(t.id) === selectedTerminId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedTerminId) {
      setError("Pilih termin yang akan dicairkan");
      return;
    }
    if (!tanggalPencairan) {
      setError("Tanggal pencairan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminId: parseInt(selectedTerminId, 10),
          tanggalPencairan,
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
          {/* Pilih Termin */}
          <div>
            <label className="block text-[13px] font-bold text-stone-900 mb-2">
              Pilih Termin <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedTerminId}
                onChange={(e) => { setSelectedTerminId(e.target.value); setError(""); }}
                className="w-full border border-stone-200 rounded-xl px-4 py-3.5 text-[14px] text-stone-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer"
              >
                {/* Teks default jika kosong / belum dipilih */}
                <option value="">Pilih Termin</option>

                {/* Daftar termin dari database */}
                {belumDiterima.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.namaTermin} - {formatRupiahDisplay(t.nominal)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Nominal & Persentase (readonly dari data real) */}
          {selectedTermin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-stone-900 mb-2">Nominal</label>
                <input
                  type="text"
                  readOnly
                  value={formatRupiahDisplay(selectedTermin.nominal)}
                  className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-stone-900 mb-2">Progress</label>
                <input
                  type="text"
                  readOnly
                  value={`${parseFloat(String(selectedTermin.persentaseProgress)) || 0}%`}
                  className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                />
              </div>
            </div>
          )}

          {/* Tanggal Pencairan */}
          <div>
            <div>
              <label className="block text-[13px] font-bold text-stone-900 mb-2">
                Tanggal Pencairan <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={tanggalPencairan}
                onChange={(v: string) => { setTanggalPencairan(v); setError(""); }}
                align="left"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[12px] text-stone-400">
              <span className="text-red-500">*</span> wajib diisi
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
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
          </div>
        </form>
      </div>
    </div>
  );
}