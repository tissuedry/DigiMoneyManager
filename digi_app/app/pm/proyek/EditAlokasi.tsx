"use client";

import React, { useState, useCallback } from "react";
import { X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditTarget = {
  type: "main" | "sub" | "ket";
  id: number;
  nama: string;
  parentNama?: string;
  currentAlokasi: number;
  totalRAB: number;
  totalTeralokasi: number; // sum of all allocations at this level (including self)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFullCurrency(num: number): string {
  const n = Number(num) || 0;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatRpInput(val: number): string {
  if (!val && val !== 0) return "";
  return Math.round(val).toLocaleString("id-ID");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditAlokasiModal({
  target,
  proyekId,
  onClose,
  onSuccess,
}: {
  target: EditTarget;
  proyekId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Nominal alokasi item lain di level yang sama
  const otherAlokasi = Math.max(0, target.totalTeralokasi - target.currentAlokasi);
  
  // Total RAB proyek / parent allocation limit
  const totalRAB = Math.max(target.totalRAB || 0, target.totalTeralokasi || 0, target.currentAlokasi || 0);

  // Maksimum alokasi yang bisa diberikan ke pos ini = totalRAB - alokasi pos-pos lainnya
  const maxAlokasi = Math.max(target.currentAlokasi, totalRAB - otherAlokasi);

  const [alokasiBaru, setAlokasiBaru] = useState<number>(target.currentAlokasi);
  const [inputStr, setInputStr] = useState<string>(formatRpInput(target.currentAlokasi));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Live total teralokasi & sisa nilai proyek / main / sub
  const liveTotalTeralokasi = otherAlokasi + alokasiBaru;
  const liveSisaBelumDialokasikan = Math.max(0, totalRAB - liveTotalTeralokasi);

  const updateValue = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(val, maxAlokasi));
      setAlokasiBaru(clamped);
      setInputStr(formatRpInput(clamped));
    },
    [maxAlokasi]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    if (!rawStr) {
      setInputStr("");
      setAlokasiBaru(0);
      return;
    }
    const num = parseInt(rawStr, 10) || 0;
    const clamped = Math.min(num, maxAlokasi);
    setInputStr(clamped.toLocaleString("id-ID"));
    setAlokasiBaru(clamped);
  };

  const handleInputBlur = () => {
    updateValue(alokasiBaru);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    updateValue(val);
  };

  // Persentase untuk visual slider tunggal
  const barAlokasiPct = maxAlokasi > 0 ? Math.min(100, Math.max(0, (alokasiBaru / maxAlokasi) * 100)) : 0;

  const typeLabel =
    target.type === "main" ? "Main" : target.type === "sub" ? "Sub" : "Keterangan";

  const parentLabel =
    target.type === "main" ? "Nilai Proyek" : target.type === "sub" ? "Main" : "Sub";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/proyek/${proyekId}/budget`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: target.type,
          id: target.id,
          nominalAlokasi: alokasiBaru,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Gagal menyimpan.");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
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
              Edit Alokasi {typeLabel}
            </h3>
            <p className="text-[12px] font-medium text-stone-600 mt-0.5">
              {target.type === "sub" && target.parentNama ? (
                <>
                  <span className="font-bold text-stone-800 uppercase tracking-wide">MAIN</span>
                  <span className="mx-1 text-stone-600">· {target.parentNama}</span>
                  <span className="mx-1.5 text-stone-400">&gt;</span>
                  <span className="font-bold text-stone-800 uppercase tracking-wide">SUB</span>
                  <span className="mx-1 text-stone-600">· {target.nama}</span>
                </>
              ) : target.type === "ket" && target.parentNama ? (
                <>
                  <span className="font-bold text-stone-800 uppercase tracking-wide">SUB</span>
                  <span className="mx-1 text-stone-600">· {target.parentNama}</span>
                  <span className="mx-1.5 text-stone-400">&gt;</span>
                  <span className="font-bold text-stone-800 uppercase tracking-wide">KET</span>
                  <span className="mx-1 text-stone-600">· {target.nama}</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-stone-800 uppercase tracking-wide">
                    {typeLabel.toUpperCase()}
                  </span>
                  <span className="mx-1.5 text-stone-400">·</span>
                  {target.nama}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded-full transition text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Info Cards (Live Updates) ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-white shadow-2xs">
            <p className="text-[11px] font-bold text-stone-700 mb-1 leading-tight">
              Total {parentLabel} Teralokasi
            </p>
            <p className="text-[15px] font-normal text-stone-900 tracking-tight">
              {formatFullCurrency(liveTotalTeralokasi)}
            </p>
          </div>
          <div className="border border-stone-200/80 rounded-2xl p-4 bg-white shadow-2xs">
            <p className="text-[11px] font-bold text-stone-700 mb-1 leading-tight">
              Sisa {parentLabel} Belum Dialokasikan
            </p>
            <p className="text-[15px] font-normal text-stone-900 tracking-tight">
              {formatFullCurrency(liveSisaBelumDialokasikan)}
            </p>
          </div>
        </div>

        {/* ── Label ── */}
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
          KETIK ATAU GESER UNTUK MENGURANGI / MENAMBAH ALOKASI
        </p>

        {/* ── Text Input ── */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[12px] font-medium text-stone-500 shrink-0">
            Alokasi baru
          </span>
          <div className="flex-1 border border-stone-200 rounded-2xl px-4 py-2.5 bg-white shadow-2xs focus-within:border-stone-400 transition flex items-center">
            <span className="mr-2 text-[14px] font-normal text-stone-900">Rp</span>
            <input
              type="text"
              value={inputStr}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="0"
              className="w-full text-[14px] font-normal text-stone-900 outline-none bg-transparent"
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

          {/* White vertical oblong handle thumb centered at boundary */}
          <div
            className="absolute z-10 w-2.5 h-7 rounded-full bg-white shadow-sm border border-stone-200 pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${barAlokasiPct}% - 5px)`,
            }}
          />

          {/* Actual Range Input overlay covering the bar */}
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
            Sisa {parentLabel}
          </span>
        </div>

        {/* ── Error ── */}
        {error && (
          <p className="text-[12px] text-rose-600 mb-4 font-semibold text-center">{error}</p>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-[13px] font-semibold text-stone-800 border border-stone-300 hover:bg-stone-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl text-[13px] font-bold text-white bg-stone-950 hover:bg-stone-800 transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {saving ? "Menyimpan..." : "Terapkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
