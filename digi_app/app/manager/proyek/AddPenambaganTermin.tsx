"use client";
import React, { useState } from "react";
import { X, Check, Loader2, Plus } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  onSuccess: () => void;
};

export default function AddPenambaganTermin({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    namaTermin: "",
    nominal: "",
    persentaseProgress: "",
    catatan: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  // Format angka dengan titik ribuan saat input
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
    setForm((prev) => ({ ...prev, nominal: formatted }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nominalRaw = parseFloat(form.nominal.replace(/\./g, "").replace(",", "."));
    if (!form.namaTermin.trim()) {
      setError("Nama termin wajib diisi");
      return;
    }
    if (!nominalRaw || nominalRaw <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTermin: form.namaTermin.trim(),
          nominal: nominalRaw,
          persentaseProgress: form.persentaseProgress ? parseFloat(form.persentaseProgress) : 0,
          catatan: form.catatan.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah termin");
        return;
      }

      // Reset form dan tutup modal
      setForm({ namaTermin: "", nominal: "", persentaseProgress: "", catatan: "" });
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ namaTermin: "", nominal: "", persentaseProgress: "", catatan: "" });
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
              <Plus size={13} className="text-emerald-700" strokeWidth={2.5} />
            </div>
            <h2 className="text-[20px] font-bold text-stone-900 tracking-tight">Tambah Termin</h2>
          </div>
          <p className="text-[13px] text-stone-500 mt-0.5 truncate">{proyekNama}</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left flex-1">
          {/* Nama Termin */}
          <div>
            <label className="block text-[13px] font-bold text-stone-900 mb-1.5">
              Nama Termin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="namaTermin"
              value={form.namaTermin}
              onChange={handleChange}
              placeholder="Cth: Termin 1 — Uang Muka"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[14px] text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition"
            />
          </div>

          {/* Grid: Nominal & Persentase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-stone-900 mb-1.5">
                Nominal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[13px] font-semibold">Rp</span>
                <input
                  type="text"
                  name="nominal"
                  value={form.nominal}
                  onChange={handleNominalChange}
                  placeholder="0"
                  className="w-full border border-stone-200 rounded-xl pl-9 pr-3 py-3 text-[14px] text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-stone-900 mb-1.5">
                Progress (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="persentaseProgress"
                  value={form.persentaseProgress}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full border border-stone-200 rounded-xl px-3 pr-8 py-3 text-[14px] text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-[13px] font-semibold">%</span>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[13px] font-bold text-stone-900 mb-1.5">
              Catatan <span className="text-stone-400 font-normal">(opsional)</span>
            </label>
            <textarea
              name="catatan"
              value={form.catatan}
              onChange={handleChange}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
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
                  <Check size={14} strokeWidth={2.5} />
                )}
                Simpan Termin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}