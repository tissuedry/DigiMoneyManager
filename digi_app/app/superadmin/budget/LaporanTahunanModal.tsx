"use client";

import { useState } from "react";
import { Loader2, AlertCircle, X, FileSpreadsheet } from "lucide-react";

export default function LaporanTahunanModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsExporting(true);
    try {
      const res = await fetch(`/api/laporan/tahunan?tahun=${tahun}`);
      if (!res.ok) throw new Error("Gagal export excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Tahunan_Perusahaan_${tahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error("Export error", error);
      setError("Gagal mengunduh Excel. Pastikan data valid atau coba lagi nanti.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-stone-900">Buat Laporan Tahunan</h3>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleExport} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-stone-600 mb-1 uppercase tracking-wide">
              Pilih Tahun
            </label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              required
              min={2000}
              max={2100}
              placeholder="Mis: 2026"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[14px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
            />
            <p className="text-[11px] text-stone-500 mt-2">
              Laporan akan merekap seluruh realisasi dari semua proyek pada tahun ini.
            </p>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-[12px] p-3 rounded-lg flex items-start gap-1.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition cursor-pointer">
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              {isExporting ? "Mengunduh..." : "Download Excel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
