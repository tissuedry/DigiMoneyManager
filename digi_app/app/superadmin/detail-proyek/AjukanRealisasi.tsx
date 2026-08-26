"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, Search, ChevronRight, Plus } from "lucide-react";
import { useApi } from "@/lib/use-api";
import ConfirmDialog from "@/components/confirm-dialog";
import Toast from "@/components/toast";
import { formatRupiah } from "@/lib/formatters";
import { formatFullRupiah } from "@/lib/format-nominal";

type FlatKeteranganOption = {
  id: string;
  keterangan: string;
  mainNama: string;
  subNama: string;
  nominalAlokasi: number;
  nominalRealisasi: number;
};

export default function AjukanRealisasiModal({
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
  const [selectedPos, setSelectedPos] = useState<FlatKeteranganOption | null>(null);
  
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

  const { data: posData, isLoading: isLoadingPos } = useApi<any>(`/api/proyek/${proyekId}/pos-anggaran`);
  
  const flatOptions: FlatKeteranganOption[] = React.useMemo(() => {
    if (!posData?.posAnggaran) return [];
    return posData.posAnggaran.flatMap((m: any) =>
      (m.subAnggaran || []).flatMap((s: any) =>
        (s.keterangan || []).map((k: any) => ({
          id: String(k.id),
          keterangan: k.keterangan,
          mainNama: m.namaMain,
          subNama: s.namaSub,
          nominalAlokasi: Number(k.nominalAlokasi || 0),
          nominalRealisasi: Number(k.nominalRealisasi || 0),
        }))
      )
    );
  }, [posData]);

  const filteredOptions = searchQuery.trim()
    ? flatOptions.filter((opt) =>
        opt.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (!selectedPos) return alert("Keterangan anggaran wajib dipilih!");
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
      formData.append("keteranganAnggaranId", selectedPos.id);
      formData.append("nominal", cleanNominal);

      formData.append("nama", namaRealisasi);
      formData.append("tipe", "Realisasi Anggaran");
      formData.append("tanggalStruk", new Date().toISOString().split("T")[0]);
      formData.append("kategoriBukti", "Lainnya");

      if (catatan.trim()) formData.append("deskripsi", catatan);
      if (file) formData.append("file", file);

      const res = await fetch("/api/reimbursements", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        onRefresh();
        setShowConfirm(false);
        setShowSuccess(true);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Gagal mengajukan realisasi");
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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[600px] flex flex-col overflow-hidden">
        
        <div className="px-6 pt-5 pb-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-stone-900 leading-tight">Ajukan Realisasi</h2>
            <p className="text-[13px] text-stone-500 mt-0.5">{proyekNama}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-500 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 overflow-y-auto">
          
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-stone-700">Keterangan <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                value={isDropdownOpen ? searchQuery : selectedPos?.keterangan || ""}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setSearchQuery("");
                  setIsDropdownOpen(true);
                }}
                placeholder={isLoadingPos ? "Memuat pos anggaran..." : "Cari keterangan..."}
                disabled={isLoadingPos}
                className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-2.5 text-[13px] font-medium text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition"
              />
              <Search size={14} className="absolute right-3.5 top-3 text-stone-400 pointer-events-none" />
            </div>

            {selectedPos && !isDropdownOpen && (
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] pt-1">
                <span className="font-bold text-stone-400 tracking-wider">MAIN</span>
                <span className="font-bold text-stone-800">· {selectedPos.mainNama}</span>
                <ChevronRight size={10} className="text-stone-300" />
                <span className="font-bold text-stone-400 tracking-wider">SUB</span>
                <span className="font-bold text-stone-800">· {selectedPos.subNama}</span>
                <ChevronRight size={10} className="text-stone-300" />
                <span className="font-bold text-stone-400 tracking-wider">KET</span>
                <span className="font-bold text-stone-600">· {selectedPos.keterangan}</span>
              </div>
            )}

                        {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-stone-400 text-[11px]">Tidak ada yang cocok</div>
                ) : (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedPos(opt);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-stone-50 transition"
                    >
                      <div className="text-[12px] font-bold text-stone-800">{opt.keterangan}</div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {opt.mainNama} {" > "} {opt.subNama}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {(() => {
            const cleanInputNominal = Number(nominal.replace(/\./g, "")) || 0;
            const nominalAlokasi = selectedPos?.nominalAlokasi || 0;
            const nominalRealisasi = (selectedPos?.nominalRealisasi || 0) + cleanInputNominal;
            const sisaRealisasi = nominalAlokasi - nominalRealisasi;
            const isOver = sisaRealisasi < 0;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-[#e6e1d4] rounded-xl px-3.5 py-2.5">
                  <p className="text-[12px] font-semibold text-[#14130f] mb-0.5 truncate" title={selectedPos ? `Total Alokasi · ${selectedPos.keterangan}` : "Total Alokasi Keterangan"}>
                    {selectedPos ? `Total Alokasi · ${selectedPos.keterangan}` : "Total Alokasi Keterangan"}
                  </p>
                  <p className="text-[13.5px] font-normal text-[#000000] ">
                    {selectedPos ? formatFullRupiah(nominalAlokasi) : "Rp 0"}
                  </p>
                </div>
                {isOver ? (
                  <div className="bg-[#fdf3f2] border border-[#f3d1ce] rounded-xl px-3.5 py-2.5">
                    <p className="text-[12px] font-semibold text-[#902f33] mb-0.5 truncate">
                      Kelebihan Realisasi (Overbudget)
                    </p>
                    <p className="text-[13.5px] font-normal text-[#902f33] ">
                      - {formatFullRupiah(Math.abs(sisaRealisasi))}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#e6e1d4] rounded-xl px-3.5 py-2.5">
                    <p className="text-[12px] font-semibold text-[#14130f] mb-0.5 truncate">
                      Sisa yang Belum Terealisasi
                    </p>
                    <p className="text-[13.5px] font-normal text-[#000000] ">
                      {selectedPos ? formatFullRupiah(sisaRealisasi) : "Rp 0"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700">Nama Realisasi <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={namaRealisasi}
                onChange={(e) => setNamaRealisasi(e.target.value)}
                placeholder="cth: Gramedia Merdeka"
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-stone-800 focus:outline-none focus:border-stone-400 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700">Nominal (IDR) <span className="text-red-500">*</span></label>
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

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition ${
              isDragActive ? "border-stone-500 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
            <Upload size={16} className={file ? "text-stone-800" : "text-stone-400"} />
            <span className="text-[12px] font-medium text-stone-600">
              {file ? (
                <span className="text-stone-900 font-bold">{file.name}</span>
              ) : (
                "Klik atau drop untuk upload bukti (opsional)"
              )}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white text-stone-700 text-[12px] font-bold rounded-xl transition hover:bg-stone-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-black text-white text-[12px] font-bold rounded-xl transition shadow-sm disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajukan
            </button>
          </div>
        </form>

      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Ajukan Realisasi"
        description={
          <>
            Apakah Anda yakin ingin mengajukan realisasi <span className="font-semibold text-stone-900">{namaRealisasi}</span> senilai <span className="font-semibold text-stone-900">Rp {nominal || "0"}</span> untuk keterangan <span className="font-semibold text-stone-900">{selectedPos?.keterangan}</span>?
          </>
        }
        confirmLabel="Ajukan"
        isLoading={isSubmitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <Toast
        open={showSuccess}
        message={`Realisasi ${namaRealisasi} berhasil diajukan.`}
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