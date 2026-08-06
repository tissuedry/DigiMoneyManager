"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Download, ArrowUp, ArrowDown, Check, BookOpen, X } from "lucide-react";
import PeriodeSelector from "./PeriodeSelector"; // Pastikan path ini sesuai dengan lokasimu

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

type LedgerTransaction = {
  tanggal: string;
  keterangan: string;
  debit: string | null;
  kredit: string | null;
};

type LedgerAccount = {
  kode: string;
  nama: string;
  saldo: string;
  transaksi: LedgerTransaction[];
  totalDebit: number;
  totalKredit: number;
};

const tabs = ["Jurnal Umum", "Buku Besar", "Neraca", "Laba Rugi"];

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function JurnalAkuntansiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get("tab");
  const initialTab = tabs.includes(tabParam ?? "") ? tabParam! : "Jurnal Umum";

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${encodeURIComponent(tab)}`, { scroll: false });
  };

  const [appliedStart, setAppliedStart] = useState("2026-05-01");
  const [appliedEnd, setAppliedEnd] = useState("2026-06-30");
  const [reportData, setReportData] = useState<any[]>([]);
  const [neracaData, setNeracaData] = useState<any[]>([]);
  const [labaRugiData, setLabaRugiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  const fetchNeraca = async () => {
    try {
      const res = await fetch('/api/laporan?type=neraca');
      const data = await res.json();
      if (data.report) {
        setNeracaData(data.report);
      }
    } catch (e) {
      console.error("Error fetching neraca report:", e);
    }
  };

  const fetchLabaRugi = async () => {
    try {
      const res = await fetch('/api/laporan?type=laba-rugi');
      const data = await res.json();
      if (data.report) {
        setLabaRugiData(data.report);
      }
    } catch (e) {
      console.error("Error fetching laba rugi report:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "Neraca") {
      fetchNeraca();
    } else if (activeTab === "Laba Rugi") {
      fetchLabaRugi();
    }
  }, [activeTab]);

  // Client-side date filter for General Ledger (buku-besar) data
  const filteredReport = useMemo(() => {
    return reportData.filter((item: any) => {
      if (!item.Tanggal || item.Tanggal === 'N/A') return true;
      if (appliedStart && item.Tanggal < appliedStart) return false;
      if (appliedEnd && item.Tanggal > appliedEnd) return false;
      return true;
    });
  }, [reportData, appliedStart, appliedEnd]);

  // Parse reportData into Journal Entries
  const journalEntries = useMemo(() => {
    return filteredReport.map((item: any) => {
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

  // Parse reportData into Buku Besar Accounts
  const bukuBesarData = useMemo(() => {
    const ledgerMap: { [kode: string]: { nama: string; transaksi: LedgerTransaction[]; totalDebit: number; totalKredit: number } } = {};

    filteredReport.forEach((item: any) => {
      const [dbCode, ...dbNameParts] = item['Akun Debit'].split(' - ');
      const dbName = dbNameParts.join(' - ');

      const [crCode, ...crNameParts] = item['Akun Kredit'].split(' - ');
      const crName = crNameParts.join(' - ');

      const nominal = Number(item.Nominal);
      const formattedNominal = nominal.toLocaleString('id-ID');

      // Debit entry
      if (!ledgerMap[dbCode]) {
        ledgerMap[dbCode] = { nama: dbName, transaksi: [], totalDebit: 0, totalKredit: 0 };
      }
      ledgerMap[dbCode].transaksi.push({
        tanggal: formatTanggal(item.Tanggal),
        keterangan: item.Keterangan,
        debit: formattedNominal,
        kredit: null
      });
      ledgerMap[dbCode].totalDebit += nominal;

      // Credit entry
      if (!ledgerMap[crCode]) {
        ledgerMap[crCode] = { nama: crName, transaksi: [], totalDebit: 0, totalKredit: 0 };
      }
      ledgerMap[crCode].transaksi.push({
        tanggal: formatTanggal(item.Tanggal),
        keterangan: item.Keterangan,
        debit: null,
        kredit: formattedNominal
      });
      ledgerMap[crCode].totalKredit += nominal;
    });

    return Object.keys(ledgerMap).map((kode) => {
      const acc = ledgerMap[kode];
      const firstChar = kode.trim()[0];
      let balance = 0;
      if (firstChar === '1' || firstChar === '5') {
        balance = acc.totalDebit - acc.totalKredit;
      } else {
        balance = acc.totalKredit - acc.totalDebit;
      }

      return {
        kode,
        nama: acc.nama,
        saldo: Math.abs(balance).toLocaleString('id-ID'),
        transaksi: acc.transaksi,
        totalDebit: acc.totalDebit,
        totalKredit: acc.totalKredit
      };
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
    let typeParam = 'buku-besar';
    if (activeTab === 'Neraca') typeParam = 'neraca';
    if (activeTab === 'Laba Rugi') typeParam = 'laba-rugi';

    const url = `/api/laporan?type=${typeParam}&export=${format}`;
    window.open(url, '_blank');
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f4f0] text-stone-800 flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">

        {/* Judul Halaman */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#14130F]">History Pencairan</h1>
          <p className="text-[13px] text-stone-500 mt-1.5">
            Pencatatan Debit-Kredit otomatis dari setiap transaksi sistem. Sesuai standar PSAK.
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

        {/* Baris Tab + Kontrol */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0 mb-4">
          <div className="p-1 bg-[#F1EEE6] rounded-xl border border-[#E6E1D4] inline-flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer shrink-0 ${
                  activeTab === tab
                    ? "bg-white text-[#14130F] shadow-sm font-semibold border border-[#E4E0D9]/40"
                    : "text-[#6A6660] hover:text-[#14130F] hover:bg-white/20"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Menggunakan Komponen Pemilih Periode yang Diekstrak dengan penambahan Type string eksplisit */}
            <PeriodeSelector
              appliedStart={appliedStart}
              appliedEnd={appliedEnd}
              onApply={(start: string, end: string) => {
                setAppliedStart(start);
                setAppliedEnd(end);
              }}
            />
            
            <button 
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-1.5 text-[12px] font-medium text-stone-700 border border-stone-200 bg-white px-3 py-1.5 rounded-lg hover:bg-stone-50 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Panel Tabel */}
        <div className={activeTab === "Buku Besar" ? "" : "bg-white border border-stone-200/80 rounded-xl shadow-sm overflow-hidden"}>

          {/* Tabel Jurnal Umum */}
          {activeTab === "Jurnal Umum" && (
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

          {/* Buku Besar */}
          {activeTab === "Buku Besar" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-stone-400 font-medium text-xs">
                  Memuat data Buku Besar...
                </div>
              ) : bukuBesarData.length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-medium text-xs">
                  Tidak ada transaksi Buku Besar pada periode ini.
                </div>
              ) : (
                bukuBesarData.map((account) => (
                  <div key={account.kode} className="border border-stone-200 rounded-xl overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-3.5 border-b border-stone-100 bg-white">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-mono text-stone-400">{account.kode}</span>
                        <span className="text-[13px] font-semibold text-stone-800">{account.nama}</span>
                      </div>
                      <span className="text-[12px] text-stone-500 font-medium">
                        Saldo Akhir:{" "}
                        <span className="font-mono font-bold text-stone-900">Rp {account.saldo}</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-[#fafaf9] border-b border-stone-200">
                            <th className="text-[11px] font-semibold text-stone-400 tracking-wider px-5 py-3 uppercase w-32">
                              Tanggal
                            </th>
                            <th className="text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3 uppercase">
                              Keterangan
                            </th>
                            <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3 uppercase w-36">
                              Debit
                            </th>
                            <th className="text-right text-[11px] font-semibold text-stone-400 tracking-wider px-5 py-3 uppercase w-36">
                              Kredit
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {account.transaksi.map((tx, i) => (
                            <tr
                              key={i}
                              className={`bg-white hover:bg-stone-50/20 transition-colors ${
                                i < account.transaksi.length - 1 ? "border-b border-stone-100" : ""
                              }`}
                            >
                              <td className="px-5 py-3 text-[12px] text-stone-500 whitespace-nowrap">
                                {tx.tanggal}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-stone-700">
                                {tx.keterangan}
                              </td>
                              <td className="px-4 py-3 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                                {tx.debit ? `Rp ${tx.debit}` : "—"}
                              </td>
                              <td className="px-5 py-3 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                                {tx.kredit ? `Rp ${tx.kredit}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-stone-200 bg-stone-50">
                            <td colSpan={2} className="px-5 py-3 text-right text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                              Total
                            </td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono font-bold text-stone-900 whitespace-nowrap">
                              Rp {account.totalDebit.toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-3 text-right text-[12px] font-mono font-bold text-stone-900 whitespace-nowrap">
                              Rp {account.totalKredit.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Neraca */}
          {activeTab === "Neraca" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#fafaf9] text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Proyek</th>
                    <th className="px-4 py-3.5 text-right">Kas / Sisa Budget (Asset)</th>
                    <th className="px-4 py-3.5 text-right">Biaya Terpakai (Asset/Cost)</th>
                    <th className="px-4 py-3.5 text-right font-bold">Total Aset</th>
                    <th className="px-4 py-3.5 text-right">Utang Reimbursement (Liabilitas)</th>
                    <th className="px-4 py-3.5 text-right">Modal RAB (Ekuitas)</th>
                    <th className="px-6 py-3.5 text-right font-bold">Total Liabilitas & Ekuitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[12px]">
                  {neracaData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-stone-400 font-medium">
                        Memuat data Neraca...
                      </td>
                    </tr>
                  ) : (
                    neracaData.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition">
                        <td className="px-6 py-3 font-semibold text-stone-850">{item.Proyek}</td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">Rp {Number(item['Kas / Sisa Budget (Asset)']).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">Rp {Number(item['Biaya Terpakai (Asset/Cost)']).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-800">Rp {Number(item['Total Aset']).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">Rp {Number(item['Utang Reimbursement (Liabilitas)']).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-mono text-stone-600">Rp {Number(item['Modal RAB (Ekuitas)']).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-stone-800">Rp {Number(item['Total Liabilitas & Ekuitas']).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Laba Rugi */}
          {activeTab === "Laba Rugi" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#fafaf9] text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Proyek</th>
                    <th className="px-4 py-3.5 text-right">Pendapatan / Alokasi RAB</th>
                    <th className="px-4 py-3.5 text-right">Total Beban / Pengeluaran</th>
                    <th className="px-6 py-3.5 text-right font-bold">Laba (Rugi) Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[12px]">
                  {labaRugiData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-stone-400 font-medium">
                        Memuat data Laba Rugi...
                      </td>
                    </tr>
                  ) : (
                    labaRugiData.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition">
                        <td className="px-6 py-3 font-semibold text-stone-850">{item.Proyek}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">Rp {Number(item['Pendapatan / Alokasi RAB']).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-650 font-semibold">Rp {Number(item['Total Beban / Pengeluaran']).toLocaleString('id-ID')}</td>
                        <td className={`px-6 py-3 text-right font-mono font-bold ${
                          Number(item['Laba (Rugi) Bersih']) >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          Rp {Number(item['Laba (Rugi) Bersih']).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
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