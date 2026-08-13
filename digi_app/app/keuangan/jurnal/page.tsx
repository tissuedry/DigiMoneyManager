"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import {
  Calendar, Filter, Download, ArrowUp, ArrowDown, Check, BookOpen, ChevronDown, X,
} from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import DatePicker from '@/components/date-picker';
import CompactNominal from '@/components/compact-nominal';

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
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
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
  const [showFilter, setShowFilter] = useState(false);
  const [periodeStart, setPeriodeStart] = useState("");
  const [periodeEnd, setPeriodeEnd] = useState("");
  const [selectedRangeOption, setSelectedRangeOption] = useState<string>("");
  const [filterTipe, setFilterTipe] = useState("");
  const [filterKaryawan, setFilterKaryawan] = useState("");
  const [filterProyek, setFilterProyek] = useState("");
  const [filterMin, setFilterMin] = useState("");
  const [filterMax, setFilterMax] = useState("");
  const [sortKey, setSortKey] = useState<string>("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const periodeRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

    setPeriodeStart(startStr);
    setPeriodeEnd(endStr);
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
      const target = e.target as Node;
      if ((target as HTMLElement)?.closest?.('.datepicker-popup')) return;
      if (periodeRef.current && !periodeRef.current.contains(target)) {
        setShowPeriode(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setShowFilter(false);
      }
    }
    if (showPeriode || showFilter) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPeriode, showFilter]);

  const filteredReport = useMemo(() => {
    return reportData.filter((item) => {
      if (!item.Tanggal || item.Tanggal === 'N/A') return true;
      if (periodeStart && item.Tanggal < periodeStart) return false;
      if (periodeEnd && item.Tanggal > periodeEnd) return false;
      return true;
    });
  }, [reportData, periodeStart, periodeEnd]);

  const tipeOptions = useMemo(() => {
    const set = new Set<string>();
    reportData.forEach((item) => {
      if (item.TipePencairan) set.add(item.TipePencairan);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData]);

  const karyawanOptions = useMemo(() => {
    const set = new Set<string>();
    reportData.forEach((item) => {
      if (item.Karyawan && item.Karyawan !== '-') set.add(item.Karyawan);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData]);

  const proyekOptions = useMemo(() => {
    const set = new Set<string>();
    reportData.forEach((item) => {
      if (item.Proyek && item.Proyek !== '-') set.add(item.Proyek);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [reportData]);

  const filteredByAll = useMemo(() => {
    const min = filterMin ? parseFloat(filterMin.replace(/\D/g, "")) || 0 : 0;
    const max = filterMax ? parseFloat(filterMax.replace(/\D/g, "")) || 0 : 0;
    return filteredReport.filter((item) => {
      if (filterTipe && item.TipePencairan !== filterTipe) return false;
      if (filterKaryawan && item.Karyawan !== filterKaryawan) return false;
      if (filterProyek && item.Proyek !== filterProyek) return false;
      if (min && Number(item.Nominal) < min) return false;
      if (max && Number(item.Nominal) > max) return false;
      return true;
    });
  }, [filteredReport, filterTipe, filterKaryawan, filterProyek, filterMin, filterMax]);

  const sortedReport = useMemo(() => {
    const arr = [...filteredByAll];
    arr.sort((a, b) => {
      const sortValue = (item: any): string | number => {
        switch (sortKey) {
          case "tanggal": return item.Tanggal || "";
          case "jurnal": return Number(item.ID) || 0;
          case "keterangan": return (item.Keterangan || "").toLowerCase();
          case "debit": return Number(item.Nominal) || 0;
          case "kredit": return Number(item.Nominal) || 0;
          default: return item.Tanggal || "";
        }
      };
      const va = sortValue(a);
      const vb = sortValue(b);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredByAll, sortKey, sortDir]);

  const journalEntries = useMemo(() => {
    return sortedReport.map((item) => {
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
  }, [sortedReport]);

  // Entries based on all data (ignores all filters) — for summary cards
  const summaryEntries = useMemo(() => {
    return reportData.map((item) => {
      const formattedNominal = Number(item.Nominal).toLocaleString('id-ID');
      return {
        id: `JE-${String(item.ID).substring(0, 8).toUpperCase()}`,
        lines: [
          { type: "Dr" as const, kode: "", akun: "", debit: formattedNominal, kredit: null },
          { type: "Cr" as const, kode: "", akun: "", debit: null, kredit: formattedNominal }
        ]
      };
    });
  }, [reportData]);


  const parseFormattedNumber = (val: string | null): number => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, "").replace(/,/g, ".")) || 0;
  };

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

  const summaryTotalDebit = useMemo(() => {
    return summaryEntries.reduce((sum, entry) => sum + parseFormattedNumber(entry.lines[0].debit), 0);
  }, [summaryEntries]);

  const summaryTotalKredit = useMemo(() => {
    return summaryEntries.reduce((sum, entry) => sum + parseFormattedNumber(entry.lines[1].kredit), 0);
  }, [summaryEntries]);

  const isBalanced = Math.abs(summaryTotalDebit - summaryTotalKredit) < 0.01;
  const selisih = Math.abs(summaryTotalDebit - summaryTotalKredit);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const formatRupiahShort = (value: number): string => {
    if (value >= 1_000_000_000_000) {
      const val = value / 1_000_000_000_000;
      const rounded = Math.round(val * 100) / 100;
      return `${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace('.', ',')} T`;
    } else if (value >= 1_000_000_000) {
      const val = value / 1_000_000_000;
      const rounded = Math.round(val * 100) / 100;
      return `${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace('.', ',')} M`;
    } else if (value >= 1_000_000) {
      const val = value / 1_000_000;
      const rounded = Math.round(val * 100) / 100;
      return `${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace('.', ',')} jt`;
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
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[124px] transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-stone-500 font-medium">Total Jurnal</span>
                <div className="w-7 h-7 border border-stone-300 rounded-lg flex items-center justify-center">
                  <BookOpen size={13} className="text-stone-500 stroke-[1.75]" />
                </div>
              </div>
              <div>
                <p className="text-[28px] font-bold text-stone-900 leading-none">{summaryEntries.length}</p>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">Semua Data</p>
              </div>
            </div>

            {/* Kartu 2: Total Debit */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[124px] transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-stone-500 font-medium">Total Debit</span>
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <ArrowUp size={15} className="text-emerald-600 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <div className="text-[22px] font-bold text-stone-900 leading-none">
                  <CompactNominal value={summaryTotalDebit} compactThreshold={100_000_000_000} />
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">{summaryEntries.length} entri jurnal</p>
              </div>
            </div>

            {/* Kartu 3: Total Kredit */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[124px] transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[12px] text-stone-500 font-medium">Total Kredit</span>
                <div className="w-7 h-7 bg-rose-50 rounded-lg flex items-center justify-center">
                  <ArrowDown size={15} className="text-rose-600 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <div className="text-[22px] font-bold text-stone-900 leading-none">
                  <CompactNominal value={summaryTotalKredit} compactThreshold={100_000_000_000} />
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">{summaryEntries.length} entri jurnal</p>
              </div>
            </div>

            {/* Kartu 4: Saldo */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[124px] transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-start">
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
              <div>
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
          </div>

          {/* Kontrol Periode + Filter + Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 mb-4">
            <div />

            <div className="flex items-center gap-2 flex-wrap">
              {/* Wrapper Periode */}
              <div ref={periodeRef} className="relative flex items-center gap-2 shrink-0">
                {/* Label Periode */}
                <button
                  onClick={() => setShowPeriode((v) => !v)}
                  className="flex items-center gap-2 text-[12px] font-medium text-stone-600 border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg shrink-0 hover:bg-stone-100 transition cursor-pointer"
                >
                  <Calendar size={13} className="text-stone-400 shrink-0" />
                  <span>{periodeLabel(periodeStart, periodeEnd)}</span>
                </button>

                {/* Dropdown Periode */}
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
                            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${selectedRangeOption === opt
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
                          value={periodeStart}
                          onChange={(v) => {
                            setPeriodeStart(v);
                            setSelectedRangeOption("");
                          }}
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-stone-400 mb-1 block">Sampai</label>
                        <DatePicker
                          value={periodeEnd}
                          min={periodeStart}
                          onChange={(v) => {
                            setPeriodeEnd(v);
                            setSelectedRangeOption("");
                          }}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-3 border-t border-stone-100">
                      <button
                        onClick={() => {
                          setPeriodeStart("");
                          setPeriodeEnd("");
                          setSelectedRangeOption("");
                        }}
                        className="text-[12px] font-medium text-stone-400 hover:text-stone-600 transition"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Filter */}
              <div ref={filterRef} className="relative shrink-0">
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className={`flex items-center gap-1.5 text-[12px] font-medium border px-3 py-1.5 rounded-lg transition cursor-pointer ${showFilter || filterTipe || filterKaryawan || filterProyek || filterMin || filterMax
                    ? "bg-stone-100 border-stone-300 text-stone-800"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                >
                  <Filter size={13} className="text-stone-400" />
                  <span>Filter</span>
                  {(filterTipe ? 1 : 0) + (filterKaryawan ? 1 : 0) + (filterProyek ? 1 : 0) + (filterMin ? 1 : 0) + (filterMax ? 1 : 0) > 0 && (
                    <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[9px] font-bold flex items-center justify-center">
                      {(filterTipe ? 1 : 0) + (filterKaryawan ? 1 : 0) + (filterProyek ? 1 : 0) + (filterMin ? 1 : 0) + (filterMax ? 1 : 0)}
                    </span>
                  )}
                  <ChevronDown size={12} className={`text-stone-400 transition-transform ${showFilter ? "rotate-180" : ""}`} />
                </button>

                {showFilter && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-stone-200 rounded-xl shadow-lg p-4 w-80 max-h-[80vh] overflow-y-auto">
                    <p className="text-[12px] font-semibold text-stone-700 mb-3">Filter Data Jurnal</p>

                    <div className="space-y-3">
                      {/* Filter Jenis Pencairan */}
                      <div>
                        <label className="text-[11px] font-medium text-stone-400 mb-1 block">Jenis Pencairan</label>
                        <div className="relative">
                          <select
                            value={filterTipe}
                            onChange={(e) => setFilterTipe(e.target.value)}
                            className="w-full appearance-none px-3 py-2 text-[12px] bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60 transition text-stone-800 pr-8 cursor-pointer"
                          >
                            <option value="">Semua Jenis</option>
                            {tipeOptions.map((tipe) => (
                              <option key={tipe} value={tipe}>{tipe}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Filter Karyawan */}
                      <div>
                        <label className="text-[11px] font-medium text-stone-400 mb-1 block">Karyawan / Pengaju</label>
                        <div className="relative">
                          <select
                            value={filterKaryawan}
                            onChange={(e) => setFilterKaryawan(e.target.value)}
                            className="w-full appearance-none px-3 py-2 text-[12px] bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60 transition text-stone-800 pr-8 cursor-pointer"
                          >
                            <option value="">Semua Karyawan</option>
                            {karyawanOptions.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Filter Proyek */}
                      <div>
                        <label className="text-[11px] font-medium text-stone-400 mb-1 block">Proyek</label>
                        <div className="relative">
                          <select
                            value={filterProyek}
                            onChange={(e) => setFilterProyek(e.target.value)}
                            className="w-full appearance-none px-3 py-2 text-[12px] bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60 transition text-stone-800 pr-8 cursor-pointer"
                          >
                            <option value="">Semua Proyek</option>
                            {proyekOptions.map((proyek) => (
                              <option key={proyek} value={proyek}>{proyek}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Filter Nominal Range */}
                      <div>
                        <label className="text-[11px] font-medium text-stone-400 mb-1 block">Range Nominal (Rp)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={filterMin}
                            onChange={(e) => setFilterMin(e.target.value)}
                            placeholder="Min"
                            className="w-full px-3 py-2 text-[12px] bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60 transition placeholder:text-stone-400 text-stone-800"
                          />
                          <span className="text-stone-400 text-[12px]">–</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={filterMax}
                            onChange={(e) => setFilterMax(e.target.value)}
                            placeholder="Max"
                            className="w-full px-3 py-2 text-[12px] bg-white border border-stone-200 rounded-lg outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200/60 transition placeholder:text-stone-400 text-stone-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-3 border-t border-stone-100">
                      <button
                        onClick={() => {
                          setFilterTipe("");
                          setFilterKaryawan("");
                          setFilterProyek("");
                          setFilterMin("");
                          setFilterMax("");
                        }}
                        className="text-[12px] font-medium text-stone-400 hover:text-stone-600 transition"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
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
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-6 py-3.5 uppercase cursor-pointer select-none hover:text-stone-700 transition min-w-[140px]"
                        onClick={() => toggleSort("jurnal")}>
                        <span className="inline-flex items-center gap-1">
                          No. Jurnal
                          <span className="w-[11px] shrink-0">
                            {sortKey === "jurnal" && (sortDir === "asc" ? <ArrowUp size={11} className="text-stone-700" /> : <ArrowDown size={11} className="text-stone-700" />)}
                          </span>
                        </span>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase whitespace-nowrap cursor-pointer select-none hover:text-stone-700 transition"
                        onClick={() => toggleSort("tanggal")}>
                        <span className="inline-flex items-center gap-1">
                          Tanggal
                          <span className="w-[11px] shrink-0">
                            {sortKey === "tanggal" && (sortDir === "asc" ? <ArrowUp size={11} className="text-stone-700" /> : <ArrowDown size={11} className="text-stone-700" />)}
                          </span>
                        </span>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase cursor-pointer select-none hover:text-stone-700 transition"
                        onClick={() => toggleSort("keterangan")}>
                        <span className="inline-flex items-center gap-1">
                          Keterangan
                          <span className="w-[11px] shrink-0">
                            {sortKey === "keterangan" && (sortDir === "asc" ? <ArrowUp size={11} className="text-stone-700" /> : <ArrowDown size={11} className="text-stone-700" />)}
                          </span>
                        </span>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase">
                        Akun
                      </th>
                      <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase cursor-pointer select-none hover:text-stone-700 transition"
                        onClick={() => toggleSort("debit")}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          Debit
                          <span className="w-[11px] shrink-0">
                            {sortKey === "debit" && (sortDir === "asc" ? <ArrowUp size={11} className="text-stone-700" /> : <ArrowDown size={11} className="text-stone-700" />)}
                          </span>
                        </span>
                      </th>
                      <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3.5 uppercase cursor-pointer select-none hover:text-stone-700 transition"
                        onClick={() => toggleSort("kredit")}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          Kredit
                          <span className="w-[11px] shrink-0">
                            {sortKey === "kredit" && (sortDir === "asc" ? <ArrowUp size={11} className="text-stone-700" /> : <ArrowDown size={11} className="text-stone-700" />)}
                          </span>
                        </span>
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
                            className={`${lineIdx < entry.lines.length - 1
                              ? "border-b border-stone-100"
                              : entryIdx < journalEntries.length - 1
                                ? "border-b-2 border-stone-200"
                                : ""
                              } hover:bg-stone-50/30 transition-colors`}
                          >
                            {lineIdx === 0 && (
                              <td
                                rowSpan={entry.lines.length}
                                className="px-7 py-3 align-top text-[12px] font-mono font-semibold text-stone-800 whitespace-nowrap min-w-[130px]"
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
                                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${line.type === "Dr"
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
                              {line.debit ? <CompactNominal value={line.debit} compactThreshold={100_000_000_000_000} /> : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                              {line.kredit ? <CompactNominal value={line.kredit} compactThreshold={100_000_000_000_000} /> : "—"}
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
