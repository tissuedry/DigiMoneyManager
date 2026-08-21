"use client";
import React, { useState } from "react";
import { X, Check, Loader2, Plus, Calendar, DollarSign, FileText, AlertCircle } from "lucide-react";
import { formatRibuan, ribuanToNumber } from "./utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  totalRAB?: number | string;
  onSuccess: () => void;
};

export default function AddPenambaganTermin({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  totalRAB = 0,
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

  const totalNilaiProyekVal =
    typeof totalRAB === "string"
      ? parseFloat(totalRAB.replace(/[^0-9.]/g, "")) || 0
      : Number(totalRAB) || 0;

  const nominalTerminVal = ribuanToNumber(form.nominal) || 0;

  // Auto kalkulasi persentase atau sebaliknya
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRibuan(e.target.value);
    const num = ribuanToNumber(formatted);
    let autoPct = form.persentaseProgress;

    if (totalNilaiProyekVal > 0 && num > 0) {
      autoPct = String(Math.round((num / totalNilaiProyekVal) * 100));
    }

    setForm((prev) => ({ ...prev, nominal: formatted, persentaseProgress: autoPct }));
    setError("");
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pctStr = e.target.value.replace(/[^0-9.]/g, "");
    const pctNum = parseFloat(pctStr) || 0;
    let autoNom = form.nominal;

    if (totalNilaiProyekVal > 0 && pctNum > 0) {
      const calculatedNom = Math.round((pctNum / 100) * totalNilaiProyekVal);
      autoNom = formatRibuan(String(calculatedNom));
    }

    setForm((prev) => ({ ...prev, persentaseProgress: pctStr, nominal: autoNom }));
    setError("");
  };

  const resetForm = () => {
    setForm({ namaTermin: "", nominal: "", persentaseProgress: "", catatan: "" });
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.namaTermin.trim()) {
      setError("Nama Termin wajib diisi");
      return;
    }

    if (!nominalTerminVal || nominalTerminVal <= 0) {
      setError("Nominal termin harus lebih dari 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTermin: form.namaTermin.trim(),
          nominal: nominalTerminVal,
          persentaseProgress: parseFloat(form.persentaseProgress) || 0,
          catatan: form.catatan.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah termin pembayaran");
        return;
      }

      resetForm();
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        style={{
          width: 520,
          background: "white",
          boxShadow: "0px 24px 64px rgba(20, 18, 14, 0.28)",
          overflow: "hidden",
          borderRadius: 22,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "0.80px #E6E1D4 solid",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 700,
                fontSize: 17,
                color: "#14130F",
                lineHeight: "25.50px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Plus size={13} className="text-emerald-700" strokeWidth={2.5} />
              </div>
              Tambah Jadwal Termin Pembayaran
            </div>
            <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 400, fontSize: 12, color: "#9A948B", lineHeight: "18px" }}>
              {proyekNama}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "6px 10px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="hover:bg-stone-100 transition"
          >
            <X size={16} color="#2C2A24" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Nama Termin */}
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-semibold text-stone-900" style={{ fontFamily: "Plus Jakarta Sans" }}>
                Nama / Tahap Termin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Termin 1 (DP 30%), Termin 2 (Progress 50%), Pelunasan"
                value={form.namaTermin}
                onChange={(e) => setForm({ ...form, namaTermin: e.target.value })}
                className="w-full h-11 bg-white border border-[#E6E1D4] focus:border-stone-400 rounded-xl px-3.5 text-[13px] text-stone-900 outline-none font-medium placeholder-stone-400"
              />
            </div>

            {/* Nominal Termin & % Progress */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-8 space-y-1.5">
                <label className="block text-[12.5px] font-semibold text-stone-900" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Nominal Termin (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center w-full h-11 bg-white border border-[#E6E1D4] focus-within:border-stone-400 rounded-xl px-3.5">
                  <span className="text-[13px] font-mono font-bold text-stone-400 mr-2">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={form.nominal}
                    onChange={handleNominalChange}
                    className="w-full bg-transparent border-none outline-none font-mono font-bold text-[14px] text-stone-900"
                  />
                </div>
              </div>

              <div className="col-span-4 space-y-1.5">
                <label className="block text-[12.5px] font-semibold text-stone-900" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Progress Tagihan
                </label>
                <div className="relative flex items-center w-full h-11 bg-white border border-[#E6E1D4] focus-within:border-stone-400 rounded-xl px-3.5">
                  <input
                    type="text"
                    placeholder="0"
                    value={form.persentaseProgress}
                    onChange={handleProgressChange}
                    className="w-full bg-transparent border-none outline-none font-mono font-bold text-[14px] text-stone-900"
                  />
                  <span className="text-[13px] font-mono font-bold text-stone-400 ml-1">%</span>
                </div>
              </div>
            </div>

            {/* Progress Card Real-time */}
            {totalNilaiProyekVal > 0 && (
              <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
                <div className="flex justify-between text-[11.5px] text-stone-600 font-medium">
                  <span>Total Nilai Proyek</span>
                  <span className="font-mono font-bold text-stone-900">Rp {totalNilaiProyekVal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[11.5px] text-stone-600 font-medium">
                  <span>Porsi Termin Ini</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Rp {nominalTerminVal.toLocaleString("id-ID")} ({totalNilaiProyekVal > 0 ? Math.round((nominalTerminVal / totalNilaiProyekVal) * 100) : 0}%)
                  </span>
                </div>
              </div>
            )}

            {/* Catatan / Keterangan */}
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-semibold text-stone-900" style={{ fontFamily: "Plus Jakarta Sans" }}>
                Catatan Syarat Penagihan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Ditagihkan setelah BAST tahap 1 ditandatangani client"
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                className="w-full bg-white border border-[#E6E1D4] focus:border-stone-400 rounded-xl p-3 text-[12.5px] text-stone-900 outline-none placeholder-stone-400 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "0.80px #E6E1D4 solid",
              display: "flex",
              gap: 8,
              background: "white",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: "9px 14px",
                background: "white",
                border: "0.80px solid #E6E1D4",
                borderRadius: 12,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                fontSize: 13,
                color: "#14130F",
                cursor: "pointer",
              }}
              className="hover:bg-stone-50 transition"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "9px 14px",
                background: "black",
                border: "none",
                borderRadius: 12,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                fontSize: 13,
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              className="hover:opacity-80 transition"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
              Simpan Jadwal Termin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}