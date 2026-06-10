"use client";

import React, { useState } from "react";
import { Filter, Download, X, Check } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

// ─── Types ───────────────────────────────────────────────────────────────────

type ApprovalStatus = "Menunggu PM" | "Verifikasi Keuangan" | "Dicairkan" | "Ditolak";

type ApprovalStep = {
  label: string;
  sublabel: string;
  state: "done" | "active" | "pending" | "rejected";
};

type Submission = {
  id: string;
  date: string; // tanggal transaksi
  submittedAt: string; // waktu pengajuan untuk alur approval
  merchant: string;
  project: string;
  pos: string;
  amount: string;
  amountRaw: number;
  status: ApprovalStatus;
  pengaju: string;
  pengajuInitials: string;
  keterangan: string;
  steps: ApprovalStep[];
};

// ─── Data Dummy ───────────────────────────────────────────────────────────────

const allSubmissions: Submission[] = [
  // === MENUNGGU SAYA ===
  {
    id: "RB-2026-004",
    date: "18 Mei 2026",
    submittedAt: "18 Mei 2026, 13:32",
    merchant: "Gramedia Merdeka",
    project: "Renovasi Kantor Cabang Bandung",
    pos: "Perlengkapan & ATK",
    amount: "Rp 150.000",
    amountRaw: 150000,
    status: "Menunggu PM",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 18 Mei 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • Menunggu", state: "active" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • –", state: "pending" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • –", state: "pending" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "19 April 2026, 13:32",
    merchant: "SPBU Pertamina 34.121",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Menunggu PM",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"BBM kendaraan operasional pertengahan April".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 19 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • Menunggu", state: "active" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • –", state: "pending" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • –", state: "pending" },
    ],
  },

  // === DITERUSKAN (Verifikasi Keuangan) ===
  {
    id: "RB-2026-004",
    date: "18 Mei 2026",
    submittedAt: "19 April 2026, 13:32",
    merchant: "Gramedia Merdeka",
    project: "Renovasi Kantor Cabang Bandung",
    pos: "Perlengkapan & ATK",
    amount: "Rp 150.000",
    amountRaw: 150000,
    status: "Verifikasi Keuangan",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 19 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 20 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • –", state: "active" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • –", state: "pending" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "19 April 2026, 13:32",
    merchant: "SPBU Pertamina 34.121",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Verifikasi Keuangan",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"BBM kendaraan operasional pertengahan April".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 19 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 20 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • –", state: "active" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • –", state: "pending" },
    ],
  },

  // === SELESAI ===
  {
    id: "RB-2026-004",
    date: "18 Mei 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Gramedia Merdeka",
    project: "Renovasi Kantor Cabang Bandung",
    pos: "Perlengkapan & ATK",
    amount: "Rp 150.000",
    amountRaw: 150000,
    status: "Dicairkan",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "12 Maret 2026, 13:32",
    merchant: "SPBU Pertamina 34.121",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Ditolak",
    pengaju: "Alif Ihsan",
    pengajuInitials: "AI",
    keterangan: '"BBM kendaraan operasional pertengahan April".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Alif Ihsan • 12 Maret 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 13 April 2026, 08:14", state: "rejected" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • –", state: "pending" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • –", state: "pending" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Taraka Yumna Sarwoko",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Dicairkan",
    pengaju: "Taraka Yumna Sarwoko",
    pengajuInitials: "TYS",
    keterangan: '"Pembelian alat tulis untuk keperluan lapangan Gudang Fase 2".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Taraka Yumna Sarwoko • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Ghanif Hadiyana Akbar",
    project: "Pembangunan Gudang Fase 2",
    pos: "Konsumsi",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Dicairkan",
    pengaju: "Ghanif Hadiyana Akbar",
    pengajuInitials: "GHA",
    keterangan: '"Konsumsi rapat koordinasi mingguan tim lapangan".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Ghanif Hadiyana Akbar • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Bimantara Ardi Winata",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Dicairkan",
    pengaju: "Bimantara Ardi Winata",
    pengajuInitials: "BAW",
    keterangan: '"Transportasi pengiriman material ke lokasi gudang".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Bimantara Ardi Winata • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Damar Muharram",
    project: "Pembangunan Gudang Fase 2",
    pos: "Perlengkapan & ATK",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Dicairkan",
    pengaju: "Damar Muharram",
    pengajuInitials: "DM",
    keterangan: '"Pembelian perlengkapan keselamatan kerja untuk tim gudang".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Damar Muharram • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
  {
    id: "RB-2026-003",
    date: "19 April 2026",
    submittedAt: "6 April 2026, 13:32",
    merchant: "Daisaq Hadya Albar",
    project: "Pembangunan Gudang Fase 2",
    pos: "Transportasi & Logistik",
    amount: "Rp 450.000",
    amountRaw: 450000,
    status: "Dicairkan",
    pengaju: "Daisaq Hadya Albar",
    pengajuInitials: "DHA",
    keterangan: '"Sewa kendaraan operasional minggu pertama April".',
    steps: [
      { label: "Pengajuan dikirim", sublabel: "Daisaq Hadya Albar • 6 April 2026, 13:32", state: "done" },
      { label: "Validasi Project Manager", sublabel: "Muhammad Alvin Ababil • 7 April 2026, 08:14", state: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Muhammad Zaini • 9 April 2026, 23:49", state: "done" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • 9 April 2026, 23:50", state: "done" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusBadge = (status: ApprovalStatus) => {
  switch (status) {
    case "Menunggu PM":
      return "bg-[#fdf3e6] text-[#b46b2b]";
    case "Verifikasi Keuangan":
      return "bg-[#e1f5fe] text-[#0277bd]";
    case "Dicairkan":
      return "bg-[#e2f1eb] text-[#117a5b]";
    case "Ditolak":
      return "bg-[#fee2e2] text-[#be123c]";
    default:
      return "bg-stone-100 text-stone-600";
  }
};

// Warna avatar inisial
const getAvatarColor = (initials: string) => {
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const idx = initials.charCodeAt(0) % colors.length;
  return colors[idx];
};

// Step icon dalam alur approval
const StepIcon = ({ state, number }: { state: ApprovalStep["state"]; number: number }) => {
  if (state === "done")
    return (
      <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "rejected")
    return (
      <div className="w-7 h-7 rounded-full bg-[#be123c] flex items-center justify-center flex-shrink-0">
        <X size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "active")
    return (
      <div className="w-7 h-7 rounded-full bg-[#b46b2b] flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] font-bold text-white">{number}</span>
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-stone-400">{number}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "Menunggu Saya" | "Diteruskan" | "Selesai";

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Menunggu Saya");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter data berdasarkan tab
  const filteredData = allSubmissions.filter((item) => {
    if (activeTab === "Menunggu Saya") return item.status === "Menunggu PM";
    if (activeTab === "Diteruskan") return item.status === "Verifikasi Keuangan";
    if (activeTab === "Selesai") return item.status === "Dicairkan" || item.status === "Ditolak";
    return false;
  });

  // Reset pilihan saat tab berganti
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedIndex(0);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const selected = filteredData[selectedIndex] ?? null;

  const tabCounts: Record<Tab, number> = {
    "Menunggu Saya": allSubmissions.filter((s) => s.status === "Menunggu PM").length,
    Diteruskan: allSubmissions.filter((s) => s.status === "Verifikasi Keuangan").length,
    Selesai: allSubmissions.filter((s) => s.status === "Dicairkan" || s.status === "Ditolak").length,
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={closeSidebar}
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={openSidebar} />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Judul */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Approval</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
            </p>
          </div>

          {/* Tab + Filter */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
                {(["Menunggu Saya", "Diteruskan", "Selesai"] as Tab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === tab
                        ? "bg-white text-stone-900 font-semibold shadow-sm"
                        : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                    }`}
                >
                    {tab}
                    <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === tab ? "bg-stone-100 text-stone-600" : "bg-stone-200/70 text-stone-400"
                    }`}
                    >
                    {tabCounts[tab]}
                    </span>
                </button>
                ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition">
                <Filter size={14} className="text-stone-500" /> Filter
            </button>
        </div>

          {/* Layout dua kolom */}
          <div className="flex gap-5 items-start">
            {/* ── Kolom Kiri: Daftar ── */}
            <div className="w-[340px] flex-shrink-0 flex flex-col gap-2">
              {filteredData.length === 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl px-6 py-10 text-center text-stone-400 text-[13px]">
                  Tidak ada data.
                </div>
              )}
              {filteredData.map((item, idx) => (
                <button
                  key={`${item.id}-${item.pengaju}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150 ${
                    selectedIndex === idx
                      ? "bg-[#e8f4ef] border-[#a8d5be] shadow-sm"
                      : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar inisial */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${getAvatarColor(
                        item.pengajuInitials
                      )}`}
                    >
                      {item.pengajuInitials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[12px] font-bold text-stone-800 truncate">
                          {item.pengaju}{" "}
                          <span className="font-normal text-stone-400">· {item.id}</span>
                        </p>
                        <p className="text-[12px] font-bold text-stone-800 flex-shrink-0">
                          {item.amount}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-stone-400 truncate">
                          {item.merchant} · {item.project}
                        </p>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Kolom Kanan: Detail ── */}
            {selected && (
              <div className="flex-1 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header detail */}
                <div className="px-6 pt-6 pb-4 border-b border-stone-100">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[12px] text-stone-400 font-medium">{selected.id}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(
                        selected.status
                      )}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <h2 className="text-[22px] font-bold text-stone-900">{selected.merchant}</h2>
                  <p className="text-[13px] text-stone-400 mt-0.5">
                    oleh{" "}
                    <span className="font-semibold text-stone-600">{selected.pengaju}</span> ·{" "}
                    {selected.submittedAt}
                  </p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">
                  {/* Nominal */}
                  <div className="bg-[#f5f4ef] rounded-xl px-5 py-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                      Total Pengajuan
                    </p>
                    <p className="text-[32px] font-bold text-stone-900">{selected.amount}</p>
                  </div>

                  {/* Info baris */}
                  {[
                    { label: "Proyek", value: selected.project },
                    { label: "Pos Anggaran", value: selected.pos },
                    { label: "Tanggal Transaksi", value: selected.date },
                    { label: "Pengaju", value: selected.pengaju },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-stone-400">{label}</span>
                      <span className="font-semibold text-stone-800 text-right max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Keterangan */}
                  <div>
                    <p className="text-[13px] text-stone-500 mb-2">Keterangan dari pengaju</p>
                    <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                      {selected.keterangan}
                    </div>
                  </div>

                  {/* Catatan opsional — hanya tampil jika status Menunggu PM */}
                  {selected.status === "Menunggu PM" && (
                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan untuk Keuangan (opsional)</p>
                      <textarea
                        rows={3}
                        placeholder="Misal: 'Pengajuan sesuai dengan jadwal site visit minggu ini.'"
                        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[13px] text-stone-700 placeholder:text-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                      />
                    </div>
                  )}

                  {/* Alur Approval */}
                  <div>
                    <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                    <div className="flex flex-col gap-0">
                      {selected.steps.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          {/* Ikon + garis vertikal */}
                          <div className="flex flex-col items-center">
                            <StepIcon state={step.state} number={i + 1} />
                            {i < selected.steps.length - 1 && (
                              <div
                                className={`w-px flex-1 my-1 ${
                                  step.state === "done" ? "bg-[#2d6a4f]" : "bg-stone-200"
                                }`}
                                style={{ minHeight: "20px" }}
                              />
                            )}
                          </div>
                          {/* Teks */}
                          <div className="pb-4">
                            <p
                              className={`text-[13px] font-semibold ${
                                step.state === "pending" ? "text-stone-400" : "text-stone-800"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-0.5">{step.sublabel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tombol aksi */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition">
                      <Download size={14} /> Download bukti
                    </button>

                    {selected.status === "Menunggu PM" && (
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#fee2e2] text-[#be123c] rounded-full text-[13px] font-semibold hover:bg-[#fecaca] transition">
                          <X size={14} /> Tolak
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-full text-[13px] font-semibold hover:bg-[#245c43] transition shadow-sm">
                          <Check size={14} /> Teruskan ke Keuangan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}