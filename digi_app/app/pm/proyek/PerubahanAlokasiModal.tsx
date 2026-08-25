"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import { formatFullRupiah as formatFullCurrency } from "@/lib/format-nominal";
import { formatRibuan } from "@/lib/proyek-utils";

function formatRpInput(val: number): string {
  if (!val && val !== 0) return "";
  return Math.round(val).toLocaleString("id-ID");
}

export default function PerubahanAlokasiModal({
  proyekId,
  main,
  totalRAB,
  sumLain,
  sumSub,
  isBlocked = false,
  onClose,
  onSuccess,
}: {
  proyekId: number;
  main: { id: number; nama: string; alokasi: number };
  totalRAB: number;
  sumLain: number;
  sumSub: number;
  isBlocked?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alokasiBaru, setAlokasiBaru] = useState<number>(main.alokasi);
  const [inputStr, setInputStr] = useState<string>(formatRpInput(main.alokasi));
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

    if (clamped !== num) {
      // Melebihi batas: tampilkan nilai yang sudah di-clamp, karet di akhir
      const shown = formatRpInput(clamped);
      setInputStr(shown);
      setAlokasiBaru(clamped);
      requestAnimationFrame(() => {
        e.target.setSelectionRange(shown.length, shown.length);
      });
      return;
    }

    // Pemformatan ribuan + pemulihan posisi kursor via helper bersama
    const caretPos = e.target.selectionStart ?? 0;
    const { formatted, caret } = formatRibuan(e.target.value, caretPos);
    setInputStr(formatted);
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
      const res = await fetch(`/api/proyek/${proyekId}/pengajuan-anggaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainAnggaranId: main.id,
          alokasiBaru,
          catatan: catatan.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Gagal mengajukan perubahan alokasi.");
        setShowConfirm(false);
        return;
      }
      setShowConfirm(false);
      setShowSuccess(true);
    } catch {
      setError("Terjadi kesalahan jaringan.");
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[540px] p-7 relative border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-stone-900 tracking-tight">
              Perubahan Alokasi Anggaran
            </h3>
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

        {/* ── Anggaran Saat Ini vs Anggaran Baru ── */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-stone-50">
            <p className="text-[11px] font-bold text-stone-500 mb-1 leading-tight">
              Anggaran Saat Ini
            </p>
            <p className="text-[15px] font-normal text-stone-500 tracking-tight">
              {formatFullCurrency(main.alokasi)}
            </p>
          </div>
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-[#F1F7F4]">
            <p className="text-[11px] font-bold text-[#1f6245] mb-1 leading-tight">
              Anggaran Baru
            </p>
            <p className="text-[15px] font-bold text-[#005836] tracking-tight">
              {formatFullCurrency(alokasiBaru)}
            </p>
          </div>
        </div>

        {/* ── Info Batasan ── */}
        <div className="flex flex-row justify-between mb-6">
          <span className="text-[11px] text-stone-500">
            Total sub alokasi:{" "}
            <span className="font-bold text-stone-700">{formatFullCurrency(sumSub)}</span>
          </span>
          <span className="text-[11px] text-stone-500">
            Sisa Nilai Proyek:{" "}
            <span className="font-bold text-stone-700">
              {formatFullCurrency(Math.max(0, totalRAB - sumLain - main.alokasi))}
            </span>
          </span>
        </div>

        {/* ── Label ── */}
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
          MASUKKAN ALOKASI BARU
        </p>

        {/* ── Text Input ── */}
        <div
          className={`flex items-center gap-3 mb-5 ${
            isInvalid ? "" : "cursor-pointer"
          }`}
        >
          <span className="text-[12px] font-medium text-stone-500 shrink-0">
            Alokasi baru
          </span>
          <div
            className={`flex-1 border rounded-2xl px-4 py-2.5 shadow-2xs transition flex items-center ${
              isInvalid
                ? "bg-[#FDF3F2] border-[#902F33]"
                : "bg-white border-stone-200 focus-within:border-stone-400"
            }`}
          >
            <span
              className={`mr-2 text-[14px] font-normal ${
                isInvalid ? "text-[#902F33]" : "text-stone-900"
              }`}
            >
              Rp
            </span>
            <input
              type="text"
              value={inputStr}
              onChange={handleInputChange}
              placeholder="0"
              className={`w-full text-[14px] font-normal outline-none bg-transparent ${
                isInvalid ? "text-[#902F33]" : "text-stone-900"
              }`}
            />
          </div>
        </div>

        {/* ── Single Unified Interactive Slider Bar ── */}
        <div className="relative w-full h-11 rounded-2xl border-2 border-stone-950 bg-[#4F9D6E] overflow-hidden flex items-center mb-4 cursor-pointer select-none">
          {/* Left Fill: Alokasi Baru (Blue #4F8EF7) */}
          <div
            className="h-full bg-[#4F8EF7] transition-all duration-75 relative shrink-0"
            style={{ width: `${barAlokasiPct}%` }}
          />

          <div
            className="absolute z-10 w-2.5 h-7 rounded-full bg-white shadow-sm border border-stone-200 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${barAlokasiPct}% - 5px)`,
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
        <div className="flex items-center justify-between mb-8 px-1">
          <span className="flex items-center gap-2 text-[12px] font-bold text-stone-900">
            <span className="w-4 h-4 rounded-md bg-[#4F8EF7] border border-stone-800 shrink-0" />
            Alokasi Baru
          </span>
          <span className="flex items-center gap-2 text-[12px] font-bold text-stone-900">
            <span className="w-4 h-4 rounded-md bg-[#4F9D6E] border border-stone-800 shrink-0" />
            Sisa Main
          </span>
        </div>

        {/* ── Catatan (opsional) ── */}
        <div className="mb-5">
          <span className="text-[12px] font-medium text-stone-500 block mb-1.5">
            Catatan (opsional)
          </span>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={2}
            placeholder="Alasan perubahan alokasi…"
            className="w-full border border-stone-200 rounded-2xl px-4 py-2.5 shadow-2xs transition text-[13px] font-normal outline-none focus:border-stone-400 text-stone-900 resize-none"
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <p className="text-[12px] text-rose-600 mb-4 font-semibold text-center">{error}</p>
        )}

        {/* ── Action Buttons & Warning Inline ── */}
        <div className="flex items-center justify-between gap-3">
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
              className="px-6 py-2.5 rounded-2xl text-[13px] font-semibold text-stone-800 border border-stone-300 hover:bg-stone-50 transition cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || isInvalid || isBlocked || isUnchanged}
              className="px-6 py-2.5 rounded-2xl text-[13px] font-bold text-white bg-[#008f5d] hover:bg-[#00754c] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? "Mengajukan..." : "Ajukan"}
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
