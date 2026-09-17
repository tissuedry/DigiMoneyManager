"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { X, UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import SuccessDialog from "@/components/success-dialog";

type Props = {
  open: boolean;
  proyekId: number;
  proyekNama: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImportAnggaranModal({
  open,
  proyekId,
  proyekNama,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catatan, setCatatan] = useState(
    "Pengajuan perubahan alokasi dari Import Excel"
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileSelect = (selectedFile: File | null) => {
    setError(null);
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      setError("Hanya file Excel (.xlsx / .xls) yang diperbolehkan.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file Excel terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (catatan.trim()) {
        formData.append("catatan", catatan.trim());
      }

      const res = await fetch(`/api/proyek/${proyekId}/budget/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || "Gagal mengimpor file Excel ke dalam anggaran."
        );
      }

      setSuccessMsg(
        data.message ||
          "Data detail biaya anggaran berhasil diimpor dan diperbarui."
      );
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-[#14120E]/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200"
        onClick={loading ? undefined : onClose}
      >
        <div
          className="bg-white rounded-[24px] shadow-[0px_24px_64px_rgba(20,18,14,0.30)] w-full max-w-[560px] flex flex-col overflow-hidden text-left border border-[#E6E1D4] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E6E1D4] flex items-start justify-between shrink-0 bg-white">
            <div className="flex flex-col">
              <h3 className="text-[18px] font-bold text-[#14130F] leading-tight font-sans">
                Import Anggaran Excel
              </h3>
              <p className="text-[12.5px] text-[#6A6660] mt-1 font-sans">
                {proyekNama || "Proyek"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 text-[#2C2A24] hover:bg-[#F1EEE6] rounded-xl transition cursor-pointer disabled:opacity-40"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
            {/* Informasi & Petunjuk */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-amber-900 text-[12px] leading-relaxed">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950">
                  Petunjuk Import Excel:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                  <li>
                    Gunakan file hasil <b>Export Excel</b> (sheet <i>Biaya Proyek</i>) sebagai acuan.
                  </li>
                  <li>
                    Perubahan alokasi <b>Sub & Keterangan</b> langsung diperbarui ke database.
                  </li>
                  <li>
                    Perubahan alokasi <b>Main Pos</b> otomatis <b>diajukan ke Direktur</b> dan berstatus <i>Menunggu ACC</i>.
                  </li>
                  <li>
                    Nilai <b>Realisasi (reimbursement) terkunci</b> dan tidak akan diubah dari Excel.
                  </li>
                  <li>
                    Total alokasi biaya <b>tidak boleh melebihi batas distribusi nilai proyek</b>.
                  </li>
                </ul>
              </div>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50"
                  : file
                  ? "border-emerald-300 bg-[#F1F7F4]/50"
                  : "border-stone-200 hover:border-stone-400 bg-[#FAF8F5]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleFileSelect(e.target.files ? e.target.files[0] : null)
                }
              />

              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center mb-3 text-emerald-700">
                {file ? (
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                ) : (
                  <UploadCloud size={24} className="text-stone-500" />
                )}
              </div>

              {file ? (
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-stone-900 break-all">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {(file.size / 1024).toFixed(1)} KB · Klik untuk mengganti file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-stone-800">
                    Klik untuk memilih file atau seret file ke sini
                  </p>
                  <p className="text-[11.5px] text-stone-500">
                    Format file yang didukung: .xlsx, .xls
                  </p>
                </div>
              )}
            </div>

            {/* Catatan Pengajuan Alokasi Main */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-stone-700 block">
                Catatan Pengajuan Alokasi (Jika ada perubahan Main Pos)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan / keterangan pengajuan..."
                rows={2}
                className="w-full text-[12.5px] px-3.5 py-2.5 rounded-xl border border-[#E6E1D4] focus:outline-none focus:border-emerald-600 bg-white placeholder:text-stone-400 text-stone-800 resize-none"
              />
              <p className="text-[11px] text-stone-500">
                Catatan ini akan otomatis tercantum pada pengajuan alokasi yang dikirimkan ke Direktur.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-800 text-[12px] leading-snug">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#E6E1D4] flex items-center justify-end gap-2.5 shrink-0 bg-stone-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{loading ? "Mengimpor..." : "Mulai Import"}</span>
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <SuccessDialog
          open={showSuccess}
          title="Import Anggaran Berhasil"
          description={successMsg}
          onClose={() => {
            setShowSuccess(false);
            onClose();
            onSuccess();
          }}
        />
      )}
    </>
  );
}
