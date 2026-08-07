"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import {
  Calendar, Filter, Download, ArrowUp, ArrowDown, Check, BookOpen, ChevronDown, X,
} from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import DatePicker from '@/components/date-picker';

type JournalLine = {
  type: "Dr" | "Cr";
  kode: string;
  akun: string;
  debit: string | null;
  kredit: string | null;
};

type JournalEntry = {
  id: string;
  tanggal: string;
  keterangan: string;
  ref: string;
  lines: JournalLine[];
};



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

function JurnalAkuntansiContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPeriode, setShowPeriode] = useState(false);
  const [draftStart, setDraftStart] = useState("2026-05-01");
  const [draftEnd, setDraftEnd] = useState("2026-06-30");
  const [appliedStart, setAppliedStart] = useState("2026-05-01");
  const [appliedEnd, setAppliedEnd] = useState("2026-06-30");
  const [selectedRangeOption, setSelectedRangeOption] = useState<string>("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const periodeRef = useRef<HTMLDivElement>(null);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleQuickRange = (option: string) => {
    const end = new Date();
    const start = new Date();
    
    if (option === "1 Minggu") {
      start.setDate(end.getDate() - 7);
    } else if (option === "1 Bulan") {
      start.setMonth(end.getMonth() - 1);
    } else if (option === "3 Bulan") {
      start.setMonth(end.getMonth() - 3);
    } else if (option === "6 Bulan") {
      start.setMonth(end.getMonth() - 6);
    } else if (option === "1 Tahun") {
      start.setFullYear(end.getFullYear() - 1);
    }

    const startStr = getLocalDateString(start);
    const endStr = getLocalDateString(end);

    setDraftStart(startStr);
    setDraftEnd(endStr);
    setAppliedStart(startStr);
    setAppliedEnd(endStr);
    setSelectedRangeOption(option);
    setShowPeriode(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/laporan?type=buku-besar');
      const data = await res.json();
      if (data.report) {
        setReportData(data.report);
      }
    } catch (e) {
      console.error("Error fetching ledger report:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (periodeRef.current && !periodeRef.current.contains(e.target as Node)) {
        setShowPeriode(false);
      }
    }
    if (showPeriode) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPeriode]);

  // Client-side date filter for General Ledger (buku-besar) data
  const filteredReport = useMemo(() => {
    return reportData.filter((item) => {
      if (!item.Tanggal || item.Tanggal === 'N/A') return true;
      if (appliedStart && item.Tanggal < appliedStart) return false;
      if (appliedEnd && item.Tanggal > appliedEnd) return false;
      return true;
    });
  }, [reportData, appliedStart, appliedEnd]);

  // Parse reportData into Journal Entries
  const journalEntries = useMemo(() => {
    return filteredReport.map((item) => {
      const [dbCode, ...dbNameParts] = item['Akun Debit'].split(' - ');
      const dbName = dbNameParts.join(' - ');

      const [crCode, ...crNameParts] = item['Akun Kredit'].split(' - ');
      const crName = crNameParts.join(' - ');

      const formattedNominal = Number(item.Nominal).toLocaleString('id-ID');

      const entry: JournalEntry = {
        id: `JE-${String(item.ID).substring(0, 8).toUpperCase()}`,
        tanggal: formatTanggal(item.Tanggal),
        keterangan: item.Keterangan,
        ref: `RB-${String(item.ID).substring(0, 8).toUpperCase()}`,
        lines: [
          { type: "Dr", kode: dbCode, akun: dbName, debit: formattedNominal, kredit: null },
          { type: "Cr", kode: crCode, akun: crName, debit: null, kredit: formattedNominal }
        ]
      };
      return entry;
    });
  }, [filteredReport]);


  const parseFormattedNumber = (val: string | null): number => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, "").replace(/,/g, ".")) || 0;
  };

  // Compute Metrics
  const totalDebit = useMemo(() => {
    return journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.debit) {
          return lineSum + parseFormattedNumber(line.debit);
        }
        return lineSum;
      }, 0);
    }, 0);
  }, [journalEntries]);

  const totalKredit = useMemo(() => {
    return journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lineSum, line) => {
        if (line.kredit) {
          return lineSum + parseFormattedNumber(line.kredit);
        }
        return lineSum;
      }, 0);
    }, 0);
  }, [journalEntries]);

  const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01;
  const selisih = Math.abs(totalDebit - totalKredit);

  const formatRupiahShort = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)} M`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)} Jt`;
    } else {
      return value.toLocaleString('id-ID');
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    const url = `/api/laporan?type=buku-besar&export=${format}`;
    window.open(url, '_blank');
    setIsExporting(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#f4f2ec] text-stone-800 overflow-hidden">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Judul Halaman */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#14130F]">Riwayat Pencairan</h1>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Pencatatan jurnal umum otomatis dari setiap transaksi pencairan. Sesuai standar PSAK.
            </p>
          </div>

          {/* Kartu Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

            {/* Kartu 1: Total Jurnal */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Jurnal</span>
                <div className="w-7 h-7 border border-stone-300 rounded flex items-center justify-center">
                  <BookOpen size={13} className="text-stone-500 stroke-[1.75]" />
                </div>
              </div>
              <p className="text-[32px] font-bold text-stone-900 leading-none">{journalEntries.length}</p>
              <p className="text-[11px] text-stone-400 mt-2">Periode Terpilih</p>
            </div>

            {/* Kartu 2: Total Debit */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Debit</span>
                <ArrowUp size={18} className="text-emerald-500 stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-stone-400 mb-0.5">Rp</p>
              <p className="text-[28px] font-bold text-stone-900 leading-none">{formatRupiahShort(totalDebit)}</p>
            </div>

            {/* Kartu 3: Total Kredit */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Kredit</span>
                <ArrowDown size={18} className="text-red-500 stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-stone-400 mb-0.5">Rp</p>
              <p className="text-[28px] font-bold text-stone-900 leading-none">{formatRupiahShort(totalKredit)}</p>
            </div>

            {/* Kartu 4: Saldo */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Status Saldo</span>
                {isBalanced ? (
                  <div className="w-7 h-7 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                    <Check size={13} className="text-emerald-600 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center">
                    <X size={13} className="text-rose-600 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className={`text-[22px] font-bold leading-none ${isBalanced ? "text-stone-900" : "text-rose-600"}`}>
                {isBalanced ? "Seimbang" : "Tidak Seimbang"}
              </p>
              {isBalanced ? (
                <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <Check size={10} className="stroke-[3.5]" />
                  Dr = Cr (Seimbang)
                </p>
              ) : (
                <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1">
                  <X size={10} className="stroke-[3.5]" />
                  Selisih: Rp {selisih.toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* Kontrol Periode + Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 mb-4">
            <div />

            <div className="flex items-center gap-2 flex-wrap">
              {/* Wrapper unified Ref container */}
              <div ref={periodeRef} className="relative flex items-center gap-2 shrink-0">
                {/* Label Periode */}
                <button
                  onClick={() => setShowPeriode((v) => !v)}
                  className="flex items-center gap-2 text-[12px] font-medium text-stone-600 border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg shrink-0 hover:bg-stone-100 transition cursor-pointer"
                >
                  <Calendar size={13} className="text-stone-400 shrink-0" />
                  <span>{periodeLabel(appliedStart, appliedEnd)}</span>
                </button>

                {/* Tombol Filter + Dropdown Periode */}
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

                      {/* Pilihan Cepat */}
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
                          className="text-[12px] font-medium text-stone-400 hover:text-stone-600 transition"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => {
                            setAppliedStart(draftStart);
                            setAppliedEnd(draftEnd);
                            setShowPeriode(false);
                          }}
                          className="text-[12px] font-semibold text-white bg-stone-900 hover:bg-stone-700 transition px-4 py-1.5 rounded-lg"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 text-[12px] font-medium text-stone-700 border border-stone-200 bg-white px-3 py-1.5 rounded-lg hover:bg-stone-50 transition shrink-0 cursor-pointer"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Panel Tabel */}
          <div className="bg-white border border-stone-200/80 rounded-xl shadow-sm overflow-hidden">

            {/* Tabel Jurnal Umum */}
            {(
              <div className="overflow-x-auto">
                <table className="w-full min-w-200">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#fafaf9]">
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-6 py-3.5 uppercase">
                        No. Jurnal
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase whitespace-nowrap">
                        Tanggal
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase">
                        Keterangan
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase">
                        Akun
                      </th>
                      <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase">
                        Debit
                      </th>
                      <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase">
                        Kredit
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-6 py-3.5 uppercase">
                        Ref
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-400 font-medium text-xs">
                          Memuat data jurnal...
                        </td>
                      </tr>
                    ) : journalEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-stone-400 font-medium text-xs">
                          Tidak ada catatan jurnal pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      journalEntries.map((entry, entryIdx) =>
                        entry.lines.map((line, lineIdx) => (
                          <tr
                            key={`${entry.id}-${lineIdx}`}
                            className={`${
                              lineIdx < entry.lines.length - 1
                                ? "border-b border-stone-100"
                                : entryIdx < journalEntries.length - 1
                                ? "border-b-2 border-stone-200"
                                : ""
                            } hover:bg-stone-50/30 transition-colors`}
                          >
                            {lineIdx === 0 && (
                              <td
                                rowSpan={entry.lines.length}
                                className="px-6 py-3 align-top text-[12px] font-mono font-semibold text-stone-800 whitespace-nowrap"
                              >
                                {entry.id}
                              </td>
                            )}
                            {lineIdx === 0 && (
                              <td
                                rowSpan={entry.lines.length}
                                className="px-4 py-3 align-top text-[12px] text-stone-600 whitespace-nowrap"
                              >
                                {entry.tanggal}
                              </td>
                            )}
                            {lineIdx === 0 && (
                              <td
                                rowSpan={entry.lines.length}
                                className="px-4 py-3 align-top text-[12px] text-stone-600 max-w-60"
                              >
                                {entry.keterangan}
                              </td>
                            )}
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2 text-[12px] font-mono text-stone-700">
                                <span
                                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    line.type === "Dr"
                                      ? "bg-[#d1fae5] text-[#065f46]"
                                      : "bg-[#fee2e2] text-[#991b1b]"
                                  }`}
                                >
                                  {line.type}
                                </span>
                                <span className="text-stone-400">{line.kode}</span>
                                <span className="text-stone-700">{line.akun}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                              {line.debit ? `Rp ${line.debit}` : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                              {line.kredit ? `Rp ${line.kredit}` : "—"}
                            </td>
                            {lineIdx === 0 && (
                              <td
                                rowSpan={entry.lines.length}
                                className="px-6 py-3 align-top text-[12px] font-mono text-[#0277bd] font-medium whitespace-nowrap"
                              >
                                {entry.ref}
                              </td>
                            )}
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                  {!isLoading && journalEntries.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-stone-200 bg-[#fafaf9]">
                        <td colSpan={4} className="px-6 py-3.5 text-right text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                          Total
                        </td>
                        <td className="px-4 py-3.5 text-right text-[12px] font-mono font-bold text-stone-900 whitespace-nowrap">
                          Rp {totalDebit.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[12px] font-mono font-bold text-stone-900 whitespace-nowrap">
                          Rp {totalKredit.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-3.5"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default function JurnalAkuntansiPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f6f4f0]">
        <div className="text-stone-400 font-medium text-xs">Memuat halaman...</div>
      </div>
    }>
      <JurnalAkuntansiContent />
    </Suspense>
  );
}
