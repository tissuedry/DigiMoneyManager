'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, ChevronDown } from 'lucide-react';
import DatePicker from '@/components/date-picker';

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");

  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;

  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function periodeLabel(start: string, end: string) {
  if (start && end) return `${formatTanggal(start)} – ${formatTanggal(end)}`;
  if (start) return `Dari ${formatTanggal(start)}`;
  if (end) return `Sampai ${formatTanggal(end)}`;
  return "Pilih Periode";
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface PeriodeSelectorProps {
  appliedStart: string;
  appliedEnd: string;
  onApply: (start: string, end: string) => void;
}

export default function PeriodeSelector({ appliedStart, appliedEnd, onApply }: PeriodeSelectorProps) {
  const [showPeriode, setShowPeriode] = useState(false);
  const [draftStart, setDraftStart] = useState(appliedStart);
  const [draftEnd, setDraftEnd] = useState(appliedEnd);
  const [selectedRangeOption, setSelectedRangeOption] = useState<string>("");
  const periodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPeriode) {
      setDraftStart(appliedStart);
      setDraftEnd(appliedEnd);
    }
  }, [showPeriode, appliedStart, appliedEnd]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (periodeRef.current && !periodeRef.current.contains(e.target as Node)) {
        setShowPeriode(false);
      }
    }
    if (showPeriode) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPeriode]);

  const handleQuickRange = (option: string) => {
    const end = new Date();
    const start = new Date();

    if (option === "1 Minggu") start.setDate(end.getDate() - 7);
    else if (option === "1 Bulan") start.setMonth(end.getMonth() - 1);
    else if (option === "3 Bulan") start.setMonth(end.getMonth() - 3);
    else if (option === "6 Bulan") start.setMonth(end.getMonth() - 6);
    else if (option === "1 Tahun") start.setFullYear(end.getFullYear() - 1);

    const startStr = getLocalDateString(start);
    const endStr = getLocalDateString(end);

    setDraftStart(startStr);
    setDraftEnd(endStr);
    setSelectedRangeOption(option);
  };

  return (
    <div ref={periodeRef} className="relative flex items-center gap-2 shrink-0">
      {/* Label Periode Terpilih */}
      <button
        onClick={() => setShowPeriode((v) => !v)}
        className="flex items-center gap-2 text-[12px] font-medium text-stone-600 border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg shrink-0 hover:bg-stone-100 transition cursor-pointer"
      >
        <Calendar size={13} className="text-stone-400 shrink-0" />
        <span>{periodeLabel(appliedStart, appliedEnd)}</span>
      </button>

      {/* Tombol Filter + Dropdown Popup */}
      <div className="relative">
        <button
          onClick={() => setShowPeriode((v) => !v)}
          className={`flex items-center gap-1.5 text-[12px] font-medium border px-3 py-1.5 rounded-lg transition cursor-pointer ${
            showPeriode
              ? "bg-stone-100 border-stone-300 text-stone-800"
              : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          <Filter size={13} className="text-stone-400" />
          <span>Filter</span>
          <ChevronDown size={12} className={`text-stone-400 transition-transform ${showPeriode ? "rotate-180" : ""}`} />
        </button>

        {showPeriode && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-4 w-72">
            <p className="text-[12px] font-semibold text-stone-700 mb-3">Pilih Rentang Periode</p>

            <div className="mb-4">
              <p className="text-[11px] font-medium text-stone-400 mb-2">Pilihan Cepat</p>
              <div className="flex flex-wrap gap-1.5">
                {["1 Minggu", "1 Bulan", "3 Bulan", "6 Bulan", "1 Tahun"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleQuickRange(opt)}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                      selectedRangeOption === opt
                        ? "bg-stone-900 text-white"
                        : "border border-stone-200 text-stone-600 hover:bg-stone-50 bg-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-stone-100 my-3" />

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-stone-400 mb-1 block">Dari</label>
                <DatePicker
                  value={draftStart}
                  onChange={(v) => {
                    setDraftStart(v);
                    setSelectedRangeOption("");
                  }}
                  size="sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-stone-400 mb-1 block">Sampai</label>
                <DatePicker
                  value={draftEnd}
                  min={draftStart}
                  onChange={(v) => {
                    setDraftEnd(v);
                    setSelectedRangeOption("");
                  }}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
              <button
                onClick={() => {
                  setDraftStart("");
                  setDraftEnd("");
                  setSelectedRangeOption("");
                }}
                className="text-[12px] font-medium text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  onApply(draftStart, draftEnd);
                  setShowPeriode(false);
                }}
                className="text-[12px] font-semibold text-white bg-stone-900 hover:bg-stone-700 transition px-4 py-1.5 rounded-lg cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}