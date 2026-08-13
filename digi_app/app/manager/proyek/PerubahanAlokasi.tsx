"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";

const THEME_COLORS: Record<string, { primary: string; hover: string; bgLight: string }> = {
  konstruksi: { primary: "bg-amber-600", hover: "hover:bg-amber-700", bgLight: "bg-amber-50" },
  digital: { primary: "bg-indigo-600", hover: "hover:bg-indigo-700", bgLight: "bg-indigo-50" },
  event: { primary: "bg-rose-600", hover: "hover:bg-rose-700", bgLight: "bg-rose-50" },
  general: { primary: "bg-[#00966c]", hover: "hover:bg-[#007f5a]", bgLight: "bg-[#f2f9f6]" },
};

function formatFullCurrency(num: number): string {
  const n = Number(num) || 0;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatRpInput(val: number): string {
  if (!val && val !== 0) return "";
  return Math.round(val).toLocaleString("id-ID");
}

export default function PerubahanAlokasiModal({
  proyekId,
  main,
  subId,
  totalRAB,
  sumLain,
  sumSub,
  kategoriProyek = "general",
  isBlocked = false,
  onClose,
  onSuccess,
}: {
  proyekId: number;
  main: { id: number; nama: string; alokasi: number };
  subId?: number | null;
  totalRAB: number;
  sumLain: number;
  sumSub: number;
  kategoriProyek?: "konstruksi" | "digital" | "event" | "general";
  isBlocked?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alokasiBaru, setAlokasiBaru] = useState<number>(main.alokasi);
  const [inputStr, setInputStr] = useState<string>(formatRpInput(main.alokasi));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentTheme = THEME_COLORS[kategoriProyek] || THEME_COLORS.general;
  const maxAlokasi = Math.max(main.alokasi, totalRAB - sumLain);
  const isInvalid = alokasiBaru < sumSub || sumLain + alokasiBaru > totalRAB;
  const isUnchanged = alokasiBaru === main.alokasi;
  
  useEffect(() => {
    setAlokasiBaru(main.alokasi);
    setInputStr(formatRpInput(main.alokasi));
  }, [main.alokasi]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value.replace(/[^0-9]/g, "");
    if (!rawStr) {
      setInputStr("");
      setAlokasiBaru(0);
      return;
    }
    const num = parseInt(rawStr, 10) || 0;
    const clamped = Math.min(num, maxAlokasi);
    const formattedInputStr = clamped.toLocaleString("id-ID");
    const caretPos = e.target.selectionStart ?? 0;
    const digitsBefore = e.target.value.slice(0, caretPos).replace(/[^0-9]/g, "").length;
    let caret = 0;
    let digits = 0;
    for (let i = 0; i < formattedInputStr.length && digits < digitsBefore; i++) {
      caret++;
      if (/[0-9]/.test(formattedInputStr[i])) digits++;
    }

    setInputStr(formattedInputStr);
    setAlokasiBaru(clamped);
    requestAnimationFrame(() => {
      e.target.setSelectionRange(caret, caret);
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAlokasiBaru(val);
    setInputStr(formatRpInput(val));
  };

  const barAlokasiPct = maxAlokasi > 0 ? Math.min(100, Math.max(0, (alokasiBaru / maxAlokasi) * 100)) : 0;

  const handleSave = () => {
    if (isInvalid) return;
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
  setSubmitting(true);
  setError("");
  try {
    const res = await fetch(`/api/proyek/${proyekId}/alokasi-pemasukan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mainAnggaranId: main.id,
        alokasiBaru,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Menangkap pesan error dari 'throw new Error' di backend
      setError(data.message || "Gagal memperbarui alokasi.");
      setShowConfirm(false);
      return;
    }

    // Jika berhasil
    setShowConfirm(false);
    setShowSuccess(true);
  } catch (err) {
    setError("Terjadi kesalahan koneksi ke server.");
    setShowConfirm(false);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[600px] p-7 relative border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header Diperbarui ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                Edit Alokasi
              </h3>
              {kategoriProyek !== "general" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentTheme.bgLight} text-stone-700`}>
                  {kategoriProyek}
                </span>
              )}
            </div>
            <p className="text-[12px] font-medium text-stone-600 mt-0.5">
              <span className="font-bold text-stone-800 uppercase tracking-wide">MAIN</span>
              <span className="mx-1.5 text-stone-400">·</span>
              {main.nama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded-full transition text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Peringatan Pengajuan PENDING ── */}
        {isBlocked && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <span className="text-[13px]">⚠</span>
            <span className="text-[12.5px] font-semibold text-amber-800">
              Main Anggaran ini memiliki Pengajuan yang belum disetujui. Ajukan perubahan lain setelah pengajuan ini diproses.
            </span>
          </div>
        )}

        {/* ── Kotak Informasi Atas (Total Pemasukan Teralokasi & Sisa) ── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-stone-50/50">
            <p className="text-[11px] font-medium text-stone-500 mb-1 leading-tight">
              Total Pemasukan Teralokasi
            </p>
            <p className="text-[15px] font-semibold text-stone-900 tracking-tight">
              {formatFullCurrency(totalRAB)}
            </p>
          </div>
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-stone-50/50">
            <p className="text-[11px] font-medium text-stone-500 mb-1 leading-tight">
              Sisa Pemasukan Belum Dialokasikan
            </p>
            <p className="text-[15px] font-semibold text-stone-900 tracking-tight">
              {formatFullCurrency(Math.max(0, totalRAB - sumLain - main.alokasi))}
            </p>
          </div>
        </div>

        {/* ── Label Instruksi ── */}
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
          KETIK ATAU GESER UNTUK MENGURANGI / MENAMBAH ALOKASI
        </p>

        {/* ── Text Input Alokasi Baru ── */}
        <div className="mb-4">
          <span className="text-[12px] font-medium text-stone-500 block mb-1.5">
            Alokasi baru
          </span>
          <div
            className={`border rounded-2xl px-4 py-3 shadow-2xs transition flex items-center ${
              isInvalid
                ? "bg-[#FDF3F2] border-[#902F33]"
                : "bg-white border-stone-200 focus-within:border-stone-400"
            }`}
          >
            <span
              className={`mr-2 text-[14px] font-normal ${
                isInvalid ? "text-[#902F33]" : "text-stone-500"
              }`}
            >
              Rp
            </span>
            <input
              type="text"
              value={inputStr}
              onChange={handleInputChange}
              placeholder="0"
              className={`w-full text-[15px] font-medium outline-none bg-transparent ${
                isInvalid ? "text-[#902F33]" : "text-stone-900"
              }`}
            />
          </div>
        </div>

        {/* ── Single Unified Interactive Slider Bar ── */}
        <div className="relative w-full h-10 rounded-2xl border-2 border-stone-950 bg-[#4F9D6E] overflow-hidden flex items-center mb-4 cursor-pointer select-none">
          <div
            className="h-full bg-[#3B82F6] transition-all duration-75 relative shrink-0"
            style={{ width: `${barAlokasiPct}%` }}
          />
          <div
            className="absolute z-10 w-2 h-7 rounded-full bg-white shadow-sm border border-stone-300 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${barAlokasiPct}% - 4px)`,
            }}
          />
          <input
            type="range"
            min={0}
            max={maxAlokasi}
            step={Math.max(1, Math.round(maxAlokasi / 100))}
            value={alokasiBaru}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-6 mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#3B82F6] border border-stone-950 shrink-0" />
            <span className="text-[12px] font-bold text-stone-900">Alokasi Baru:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-[#4F9D6E] border border-stone-950 shrink-0" />
            <span className="text-[12px] font-bold text-stone-900">Sisa Main</span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <p className="text-[12px] text-rose-600 mb-4 font-semibold text-center">{error}</p>
        )}

        {/* ── Action Buttons & Warning Inline ── */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
          {isInvalid ? (
            <span className="text-[11px] font-normal text-[#902F33] bg-[#FDF3F2] border border-[#902F33] px-2.5 py-1 rounded-lg">
              <span className="mr-1.5">⚠</span>
              {alokasiBaru < sumSub
                ? `Alokasi baru kurang dari total sub (${formatFullCurrency(sumSub)})`
                : "Melebihi sisa Nilai Proyek"}
            </span>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || isInvalid || isBlocked || isUnchanged}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-stone-900 hover:bg-stone-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? "Menyimpan..." : "Terapkan"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Ajukan Perubahan Alokasi"
        description={
          <>
            Apakah Anda yakin ingin mengajukan perubahan alokasi{" "}
            <span className="font-semibold text-stone-900">{main.nama}</span> dari{" "}
            <span className="font-semibold text-stone-900">
              {formatFullCurrency(main.alokasi)}
            </span>{" "}
            menjadi{" "}
            <span className="font-semibold text-stone-900">
              {formatFullCurrency(alokasiBaru)}
            </span>
            ? Pengajuan ini akan masuk ke antrian persetujuan Direktur.
          </>
        }
        confirmLabel="Ajukan"
        isLoading={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
      />

      <SuccessDialog
        open={showSuccess}
        title="Pengajuan Terkirim"
        description={
          <>
            Perubahan alokasi{" "}
            <span className="font-semibold text-[#14130F]">{main.nama}</span> menunggu
            persetujuan Direktur.
          </>
        }
        onClose={() => {
          setShowSuccess(false);
          onSuccess();
        }}
      />
    </div>
  );
}