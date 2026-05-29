"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar, Filter, Download, ArrowUp, ArrowDown, Check, BookOpen, ChevronDown,
} from "lucide-react";
import Sidebar from "@/components/sidebar-keuangan";
import Header from "@/components/header-keuangan";

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

const journalEntries: JournalEntry[] = [
  {
    id: "JE-2026-0892",
    tanggal: "18/05/2026",
    keterangan: "Pencairan reimbursement Alif Ihsan - Perlengkapan & ATK",
    ref: "RB-2026-0138",
    lines: [
      { type: "Dr", kode: "5-5101", akun: "Beban Material Proyek", debit: "1.875.000", kredit: null },
      { type: "Cr", kode: "1-1102", akun: "Bank BCA - Operasional", debit: null, kredit: "1.875.000" },
    ],
  },
  {
    id: "JE-2026-0891",
    tanggal: "15/05/2026",
    keterangan: "Pencairan reimbursement Budi Santoso - Transportasi & Akomodasi",
    ref: "RB-2026-0137",
    lines: [
      { type: "Dr", kode: "5-5103", akun: "Beban Transportasi Proyek", debit: "600.000", kredit: null },
      { type: "Cr", kode: "1-1102", akun: "Bank BCA - Operasional", debit: null, kredit: "600.000" },
    ],
  },
];

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
};

const bukuBesarData: LedgerAccount[] = [
  {
    kode: "5-5101",
    nama: "Beban Material Proyek",
    saldo: "6.695.000",
    transaksi: [
      { tanggal: "10 Mei", keterangan: "RB-0134 Kabel CCTV", debit: "4.820.000", kredit: null },
      { tanggal: "13 Mei", keterangan: "RB-0134 Kabel CCTV", debit: "1.875.000", kredit: null },
    ],
  },
  {
    kode: "5-5201",
    nama: "Beban Transportasi Proyek",
    saldo: "68.000",
    transaksi: [
      { tanggal: "11 Mei", keterangan: "RB-0135 Gojek site visit", debit: "68.000", kredit: null },
    ],
  },
  {
    kode: "1-1102",
    nama: "Bank BCA - Operasional",
    saldo: "8.003.000",
    transaksi: [
      { tanggal: "10 Mei", keterangan: "Pembayaran RB-0134", debit: null, kredit: "4.820.000" },
      { tanggal: "11 Mei", keterangan: "RB-0135 Gojek site visit", debit: null, kredit: "68.000" },
      { tanggal: "12 Mei", keterangan: "RB-0135 Gojek site visit", debit: null, kredit: "1.240.000" },
      { tanggal: "13 Mei", keterangan: "RB-0135 Gojek site visit", debit: null, kredit: "1.875.000" },
    ],
  },
];

const tabs = ["Jurnal Umum", "Buku Besar", "Neraca", "Laba Rugi"];

function formatTanggal(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  return `${parseInt(d)} ${bulan[parseInt(m) - 1]} ${y}`;
}

function periodeLabel(start: string, end: string) {
  if (start && end) return `${formatTanggal(start)} – ${formatTanggal(end)}`;
  if (start) return `Dari ${formatTanggal(start)}`;
  if (end) return `Sampai ${formatTanggal(end)}`;
  return "Pilih Periode";
}

export default function JurnalAkuntansiPage() {
  const [activeTab, setActiveTab] = useState("Jurnal Umum");
  const [showPeriode, setShowPeriode] = useState(false);
  const [draftStart, setDraftStart] = useState("2026-05-01");
  const [draftEnd, setDraftEnd] = useState("2026-05-31");
  const [appliedStart, setAppliedStart] = useState("2026-05-01");
  const [appliedEnd, setAppliedEnd] = useState("2026-05-31");
  const periodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (periodeRef.current && !periodeRef.current.contains(e.target as Node)) {
        setShowPeriode(false);
      }
    }
    if (showPeriode) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showPeriode]);

  return (
    <div className="flex h-screen w-full bg-[#f4f2ec] font-sans text-stone-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0]">
        <Header />

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Judul Halaman */}
          <div className="mb-6">
            <h1 className="text-[22px] font-bold text-stone-900">Jurnal Akuntansi</h1>
            <p className="text-[13px] text-stone-500 mt-1.5">
              Pencatatan Debit-Kredit otomatis dari setiap transaksi sistem. Sesuai standar PSAK.
            </p>
          </div>

          {/* Kartu Ringkasan */}
          <div className="grid grid-cols-4 gap-4 mb-6">

            {/* Kartu 1: Total Jurnal */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Jurnal</span>
                <div className="w-7 h-7 border border-stone-300 rounded flex items-center justify-center">
                  <BookOpen size={13} className="text-stone-500 stroke-[1.75]" />
                </div>
              </div>
              <p className="text-[32px] font-bold text-stone-900 leading-none">2</p>
              <p className="text-[11px] text-stone-400 mt-2">Mei 2026</p>
            </div>

            {/* Kartu 2: Total Debit */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Debit</span>
                <ArrowUp size={18} className="text-emerald-500 stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-stone-400 mb-0.5">Rp</p>
              <p className="text-[28px] font-bold text-stone-900 leading-none">1.3 M</p>
            </div>

            {/* Kartu 3: Total Kredit */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Total Kredit</span>
                <ArrowDown size={18} className="text-red-500 stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-stone-400 mb-0.5">Rp</p>
              <p className="text-[28px] font-bold text-stone-900 leading-none">1.3 M</p>
            </div>

            {/* Kartu 4: Saldo */}
            <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] text-stone-500 font-medium">Saldo</span>
                <div className="w-7 h-7 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                  <Check size={13} className="text-emerald-600 stroke-[3]" />
                </div>
              </div>
              <p className="text-[22px] font-bold text-stone-900 leading-none">Seimbang</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Check size={10} className="stroke-[3.5]" />
                Dr = Cr
              </p>
            </div>
          </div>

          {/* Panel Tabel */}
          <div className="bg-white border border-stone-200/80 rounded-xl shadow-sm">

            {/* Baris Tab + Kontrol */}
            <div className="flex items-center justify-between px-6 border-b border-stone-200 bg-white rounded-t-xl">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-4 text-[13px] font-medium transition border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-stone-900 text-stone-900 font-semibold"
                        : "border-transparent text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Label Periode (statis) */}
                <div className="flex items-center gap-2 text-[12px] font-medium text-stone-600 border border-stone-200 bg-stone-50 px-3 py-1.5 rounded-lg">
                  <Calendar size={13} className="text-stone-400 shrink-0" />
                  <span>{periodeLabel(appliedStart, appliedEnd)}</span>
                </div>

                {/* Tombol Filter + Dropdown Periode */}
                <div ref={periodeRef} className="relative">
                  <button
                    onClick={() => setShowPeriode((v) => !v)}
                    className={`flex items-center gap-1.5 text-[12px] font-medium border px-3 py-1.5 rounded-lg transition ${
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

                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-medium text-stone-400 mb-1 block">Dari</label>
                          <input
                            type="date"
                            value={draftStart}
                            onChange={(e) => setDraftStart(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-[12px] text-stone-700 bg-stone-50 focus:outline-none focus:border-stone-400 focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-stone-400 mb-1 block">Sampai</label>
                          <input
                            type="date"
                            value={draftEnd}
                            min={draftStart}
                            onChange={(e) => setDraftEnd(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-[12px] text-stone-700 bg-stone-50 focus:outline-none focus:border-stone-400 focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
                        <button
                          onClick={() => { setDraftStart(""); setDraftEnd(""); }}
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
                <button className="flex items-center gap-1.5 text-[12px] font-medium text-stone-700 border border-stone-200 bg-white px-3 py-1.5 rounded-lg hover:bg-stone-50 transition">
                  <Download size={13} />
                  <span>Export Excel</span>
                </button>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-stone-900 hover:bg-stone-800 transition px-3 py-1.5 rounded-lg">
                  <Download size={13} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Tabel Jurnal */}
            {activeTab === "Jurnal Umum" && (
              <div className="overflow-x-auto overflow-hidden rounded-b-xl">
                <table className="w-full">
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
                    {journalEntries.map((entry, entryIdx) =>
                      entry.lines.map((line, lineIdx) => (
                        <tr
                          key={`${entry.id}-${lineIdx}`}
                          className={`${
                            lineIdx < entry.lines.length - 1
                              ? "border-b border-stone-100"
                              : entryIdx < journalEntries.length - 1
                              ? "border-b-2 border-stone-200"
                              : ""
                          }`}
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
                              className="px-4 py-3 align-top text-[12px] text-stone-600 max-w-[240px]"
                            >
                              {entry.keterangan}
                            </td>
                          )}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 text-[12px] font-mono text-stone-700">
                              <span
                                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
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
                            {line.debit ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                            {line.kredit ?? "—"}
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
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Buku Besar */}
            {activeTab === "Buku Besar" && (
              <div className="bg-[#f6f4f0] p-5 space-y-4 rounded-b-xl">
                {bukuBesarData.map((account) => (
                  <div key={account.kode} className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-5 py-4 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[12px] font-mono text-stone-400">{account.kode}</span>
                        <span className="text-[13px] font-semibold text-stone-800">{account.nama}</span>
                      </div>
                      <span className="text-[12px] text-stone-500">
                        Saldo:{" "}
                        <span className="font-mono font-semibold text-stone-800">{account.saldo}</span>
                      </span>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#fafaf9] border-b border-stone-200">
                          <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-5 py-3 uppercase w-32">
                            Tanggal
                          </th>
                          <th className="text-left text-[11px] font-semibold text-stone-400 tracking-wider px-4 py-3 uppercase">
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
                            className={i < account.transaksi.length - 1 ? "border-b border-stone-100" : ""}
                          >
                            <td className="px-5 py-3 text-[12px] text-stone-500 whitespace-nowrap">
                              {tx.tanggal}
                            </td>
                            <td className="px-4 py-3 text-[12px] text-stone-700">
                              {tx.keterangan}
                            </td>
                            <td className="px-4 py-3 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                              {tx.debit ?? "—"}
                            </td>
                            <td className="px-5 py-3 text-right text-[12px] font-mono text-stone-800 whitespace-nowrap">
                              {tx.kredit ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Placeholder untuk tab lainnya */}
            {activeTab !== "Jurnal Umum" && activeTab !== "Buku Besar" && (
              <div className="flex items-center justify-center h-48 text-[13px] text-stone-400 rounded-b-xl">
                {activeTab} belum tersedia.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
