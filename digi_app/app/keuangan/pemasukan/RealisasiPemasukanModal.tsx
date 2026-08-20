"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Upload, Loader2, Search, ChevronRight, Plus } from "lucide-react";
import { useApi } from "@/lib/use-api";
import ConfirmDialog from "@/components/confirm-dialog";
import Toast from "@/components/toast";

function formatRupiah(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

type FlatPosOption = {
  id: string;
  subId?: string;
  nama: string;
  mainNama: string;
  subNama: string;
  tipe?: string;
};

export default function RealisasiPemasukanModal({
  proyekId,
  proyekNama,
  onClose,
  onRefresh,
}: {
  proyekId: number;
  proyekNama: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [namaRealisasi, setNamaRealisasi] = useState("");
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");
  const [selectedPos, setSelectedPos] = useState<FlatPosOption | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ambil data tree Pos Anggaran proyek khusus sub_anggaran pemasukan
  const { data: posData, isLoading: isLoadingPos } = useApi<any>(`/api/proyek/${proyekId}/pos-anggaran`);

  const flatOptions: FlatPosOption[] = useMemo(() => {
    const list: FlatPosOption[] = [];
    const seenKeys = new Set<string>();

    if (posData?.posAnggaran && Array.isArray(posData.posAnggaran)) {
      posData.posAnggaran
        .filter((m: any) => m.tipe === "pemasukan" || !m.tipe)
        .forEach((m: any) => {
          (m.subAnggaran || [])
            .filter((s: any) => s.tipe === "pemasukan" || !s.tipe || m.tipe === "pemasukan")
            .forEach((s: any) => {
              const key = `${m.namaMain}-${s.namaSub}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                list.push({
                  id: String(s.id),
                  subId: String(s.id),
                  nama: s.namaSub,
                  mainNama: m.namaMain,
                  subNama: s.namaSub,
                  tipe: "pemasukan",
                });
              }
            });
        });
    }

    return list;
  }, [posData]);

  const filteredOptions = searchQuery.trim()
    ? flatOptions.filter(
        (opt) =>
          opt.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.mainNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.subNama.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : flatOptions;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateAndSetFile = (f: File) => {
    setFile(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPos) return alert("Sub / Kategori pemasukan wajib dipilih!");
    if (!namaRealisasi.trim()) return alert("Nama realisasi wajib diisi!");

    const cleanNominal = nominal.replace(/\./g, "");
    if (!cleanNominal || Number(cleanNominal) <= 0) return alert("Nominal tidak valid!");

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedPos) return;
    const cleanNominal = nominal.replace(/\./g, "");

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proyekId", String(proyekId));
      formData.append("subCoaId", selectedPos.subId || selectedPos.id);
      formData.append("kategori", selectedPos.subNama || selectedPos.nama);
      formData.append("namaRealisasi", namaRealisasi);
      formData.append("nominal", cleanNominal);
      formData.append("tanggalTransaksi", new Date().toISOString().split("T")[0]);

      if (catatan.trim()) formData.append("keterangan", catatan);
      if (file) formData.append("file", file);

      const res = await fetch("/api/pemasukan", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onRefresh();
        setShowConfirm(false);
        setShowSuccess(true);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Gagal mencatat realisasi pemasukan");
        setShowConfirm(false);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan jaringan.");
      setShowConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingPos;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[600px] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-stone-900 leading-tight">Realisasi Pemasukan</h2>
            <p className="text-[13px] text-stone-500 mt-0.5">{proyekNama}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-full text-stone-500 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 overflow-y-auto">
          {/* Pencarian Keterangan / Sub Pemasukan */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-stone-700">
              Keterangan / Sub Pemasukan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={isDropdownOpen ? searchQuery : selectedPos?.nama || ""}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setSearchQuery("");
                  setIsDropdownOpen(true);
                }}
                placeholder={isLoading ? "Memuat opsi pemasukan..." : "Cari keterangan..."}
                disabled={isLoading}
                className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-2.5 text-[13px] font-medium text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
              />
              <Search size={14} className="absolute right-3.5 top-3 text-stone-400 pointer-events-none" />
            </div>

            {/* Breadcrumb Terpilih (Sesuai Gambar 3) */}
            {selectedPos && !isDropdownOpen && (
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] pt-1">
                <span className="font-bold text-stone-400 tracking-wider">MAIN</span>
                <span className="font-bold text-stone-800">· {selectedPos.mainNama}</span>
                <ChevronRight size={10} className="text-stone-300" />
                <span className="font-bold text-stone-400 tracking-wider">SUB</span>
                <span className="font-bold text-stone-800">· {selectedPos.subNama}</span>
              </div>
            )}

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-stone-400 text-[11px]">Tidak ada sub yang cocok</div>
                ) : (
                  filteredOptions.map((opt, idx) => (
                    <button
                      key={`${opt.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedPos(opt);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-50 transition"
                    >
                      <div className="text-[12px] font-bold text-stone-800">{opt.nama}</div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {opt.mainNama} {" > "} {opt.subNama}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700">
                Nama Realisasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaRealisasi}
                onChange={(e) => setNamaRealisasi(e.target.value)}
                placeholder="cth: Gramedia Merdeka"
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-stone-800 focus:outline-none focus:border-stone-400 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700">
                Nominal (IDR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[13px] font-medium text-stone-400">Rp</span>
                <input
                  type="text"
                  value={nominal}
                  onChange={(e) => setNominal(formatRupiah(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-[13px] font-medium text-stone-800 focus:outline-none focus:border-stone-400 transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-700">Catatan</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-stone-800 resize-none focus:outline-none focus:border-stone-400 transition"
            />
          </div>

          {/* Area Drag & Drop File */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`group relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition ${
              isDragActive
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-stone-200 bg-stone-50/50 hover:border-emerald-500 hover:bg-emerald-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf"
            />
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
            <Upload
              size={16}
              className={
                file || isDragActive
                  ? "text-emerald-600"
                  : "text-stone-400 group-hover:text-emerald-600"
              }
            />
            <span className="text-[12px] font-medium text-stone-600">
              {file ? (
                <span className="text-stone-900 font-bold">{file.name}</span>
              ) : (
                "Klik atau drop untuk upload bukti (opsional)"
              )}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white text-stone-700 text-[12px] font-bold rounded-xl transition hover:bg-stone-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-black text-white text-[12px] font-bold rounded-xl transition shadow-sm disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajukan
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Realisasi Pemasukan"
        description={
          <>
            Apakah Anda yakin ingin merealisasikan pemasukan{" "}
            <span className="font-semibold text-stone-900">{namaRealisasi}</span> senilai{" "}
            <span className="font-semibold text-stone-900">Rp {nominal || "0"}</span> untuk kategori{" "}
            <span className="font-semibold text-stone-900">{selectedPos?.nama}</span>?
          </>
        }
        confirmLabel="Ajukan"
        isLoading={isSubmitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Toast
        open={showSuccess}
        message={`Realisasi pemasukan ${namaRealisasi} berhasil dicatat.`}
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />

      <Toast
        open={!!errorMessage}
        variant="error"
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
}
