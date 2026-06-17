"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Notebook,
  Check,
  Zap,
  SquareMinus,
  ChevronRight,
  X,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)} rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatRupiahFull(amount: number): string {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function formatTanggal(iso: string | null): string {
  if (!iso) return "-";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getCurrentMonthName(): string {
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return bulan[new Date().getMonth()];
}

interface DashboardMetrics {
  pendingDisbursementsNominal: number;
  pendingDisbursementCount: number;
  disbursedTodayNominal: number;
  disbursedTodayCount: number;
  jurnalCountThisMonth: number;
  totalDebitKredit: number;
  totalDebit: number;
  totalKredit: number;
}

interface PencairanItem {
  id: number;
  nominal: number;
  status: string;
  user: { nama: string; divisi: string | null };
  proyek: { nama: string };
}

interface JurnalItem {
  jeId: string;
  tanggal: string | null;
  keterangan: string;
  debitKode: string;
  debitNama: string;
  kreditKode: string;
  kreditNama: string;
  nominal: number;
}

export default function KeuanganDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pencairanList, setPencairanList] = useState<PencairanItem[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    pendingDisbursementsNominal: 0,
    pendingDisbursementCount: 0,
    disbursedTodayNominal: 0,
    disbursedTodayCount: 0,
    jurnalCountThisMonth: 0,
    totalDebitKredit: 0,
    totalDebit: 0,
    totalKredit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("API not ready");

        const data = await res.json();
        const dashboard = data.dashboard;

        if (dashboard?.metrics) {
          setMetrics({
            pendingDisbursementsNominal: dashboard.metrics.pendingDisbursementsNominal ?? 0,
            pendingDisbursementCount: dashboard.metrics.pendingDisbursementCount ?? 0,
            disbursedTodayNominal: dashboard.metrics.disbursedTodayNominal ?? 0,
            disbursedTodayCount: dashboard.metrics.disbursedTodayCount ?? 0,
            jurnalCountThisMonth: dashboard.metrics.jurnalCountThisMonth ?? 0,
            totalDebitKredit: dashboard.metrics.totalDebitKredit ?? 0,
            totalDebit: dashboard.metrics.totalDebit ?? 0,
            totalKredit: dashboard.metrics.totalKredit ?? 0,
          });
        }

        if (dashboard?.pendingDisbursements) {
          setPencairanList(dashboard.pendingDisbursements);
        }

        if (dashboard?.recentJournals) {
          setJurnalList(dashboard.recentJournals);
        }
      } catch {
        // API belum siap — biarkan state default (0/kosong)
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const isBalanced = Math.abs(metrics.totalDebit - metrics.totalKredit) < 0.01;
  const selisih = Math.abs(metrics.totalDebit - metrics.totalKredit);

  const statCards = [
    {
      label: "Menunggu Pencairan",
      value: formatRupiah(metrics.pendingDisbursementsNominal),
      sub: `${metrics.pendingDisbursementCount} antrian`,
      icon: <Wallet size={18} className="text-stone-500" />,
      iconBg: "bg-stone-100",
    },
    {
      label: "Dicairkan Hari ini",
      value: formatRupiah(metrics.disbursedTodayNominal),
      sub: `${metrics.disbursedTodayCount} pengajuan`,
      icon: <Check size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: `Jurnal (${getCurrentMonthName()})`,
      value: String(metrics.jurnalCountThisMonth),
      sub: "otomatis dari sistem",
      icon: <Notebook size={18} className="text-blue-500" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Total Debit = Kredit",
      value: formatRupiah(metrics.totalDebit),
      sub: isBalanced ? "✓ Seimbang" : `Selisih: Rp ${selisih.toLocaleString('id-ID')}`,
      icon: isBalanced ? <Check size={18} className="text-emerald-600" /> : <X size={18} className="text-rose-600" />,
      iconBg: isBalanced ? "bg-emerald-50" : "bg-rose-50",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0]">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userRole="Tim Keuangan"
        />

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full mx-auto">

          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                Beranda Keuangan
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Proses pencairan reimbursement yang telah divalidasi PM. Jurnal
                akuntansi ter-generate otomatis.
              </p>
            </div>

            {/* Tombol Antrian Pencairan */}
            {!isLoading && pencairanList.length > 0 && (
              <Link
                href="/keuangan/pencairan"
                className="flex items-center gap-2 bg-[#008f5d] hover:bg-[#00754c] transition-all duration-200 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-sm shrink-0 self-start hover:shadow-md"
              >
                <SquareMinus size={15} />
                Antrian Pencairan ({pencairanList.length})
              </Link>
            )}
          </div>

          {isLoading ? (
            /* ── Full-page Loading State ── */
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Skeleton stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm min-h-[120px] animate-pulse"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-3 w-24 bg-stone-100 rounded" />
                      <div className="w-8 h-8 bg-stone-100 rounded-lg" />
                    </div>
                    <div className="h-6 w-28 bg-stone-100 rounded mb-2" />
                    <div className="h-2.5 w-20 bg-stone-50 rounded" />
                  </div>
                ))}
              </div>

              {/* Skeleton table sections */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                      <div className="h-4 w-32 bg-stone-100 rounded" />
                      <div className="h-3 w-20 bg-stone-50 rounded" />
                    </div>
                    <div className="divide-y divide-stone-50">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="px-6 py-4 flex items-center gap-4">
                          <div className="w-9 h-9 bg-stone-100 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 bg-stone-100 rounded" />
                            <div className="h-2.5 w-1/2 bg-stone-50 rounded" />
                          </div>
                          <div className="h-4 w-20 bg-stone-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Dashboard Content ── */
            <div className="space-y-6">

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-200 hover:shadow-md hover:border-stone-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-stone-500">
                        {card.label}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}
                      >
                        {card.icon}
                      </div>
                    </div>
                    <div className="">
                      <p className="text-[20px] font-bold text-stone-900 leading-tight">
                        {card.value}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1 font-medium">
                        {card.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Two-column: Antrian + Jurnal ── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-105">

                {/* Antrian Pencairan */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className="text-stone-400" />
                      <h2 className="text-[15px] font-bold text-stone-900">
                        Antrian Pencairan
                      </h2>
                    </div>
                    <Link
                      href="/keuangan/pencairan?select=all"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Proses semua
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto max-h-105">
                    {pencairanList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                          <Check size={20} className="text-stone-400" />
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">Semua sudah dicairkan</p>
                        <p className="text-[11px] text-stone-400 mt-1">Tidak ada pengajuan yang menunggu pencairan.</p>
                      </div>
                    ) : (
                      pencairanList.map((item) => {
                        const initials = getInitials(item.user?.nama || "");
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/80 transition-colors duration-150 group"
                          >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-[#e2f1eb] text-[#117a5b] font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                              {initials}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-stone-900 truncate">
                                {item.user?.nama}
                                <span className="text-stone-400 font-normal ml-1.5 text-[11px]">
                                  · {item.user?.divisi || item.proyek?.nama}
                                </span>
                              </p>
                              <p className="text-[11px] text-stone-400 mt-0.5 truncate font-medium">
                                RB-{String(item.id).padStart(4, '0')} · {item.proyek?.nama}
                              </p>
                            </div>

                            {/* Nominal + Tombol Cairkan */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[13px] font-bold text-stone-800 tabular-nums">
                                {formatRupiahFull(item.nominal)}
                              </span>
                              <Link
                                href={`/keuangan/pencairan?id=${item.id}`}
                                className="flex items-center gap-1.5 bg-[#008f5d] hover:bg-[#00754c] transition-all duration-200 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm opacity-80 group-hover:opacity-100 hover:shadow-md"
                              >
                                <Zap size={12} fill="currentColor" />
                                Cairkan
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Jurnal Terbaru */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-stone-400" />
                      <h2 className="text-[15px] font-bold text-stone-900">
                        Jurnal Terbaru
                      </h2>
                    </div>
                    <Link
                      href="/keuangan/jurnal?tab=Buku Besar"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Buku Besar
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto max-h-[420px]">
                    {jurnalList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                          <BookOpen size={20} className="text-stone-400" />
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">Belum ada jurnal</p>
                        <p className="text-[11px] text-stone-400 mt-1">Jurnal akuntansi akan ter-generate otomatis saat pencairan.</p>
                      </div>
                    ) : (
                      jurnalList.map((entry, idx) => (
                        <div key={idx} className="px-6 py-4 hover:bg-stone-50/80 transition-colors duration-150">
                          {/* JE header row */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded">
                              {entry.jeId}
                            </span>
                            <span className="text-[11px] text-stone-400 font-medium">
                              {formatTanggal(entry.tanggal)}
                            </span>
                          </div>

                          {/* Keterangan */}
                          <p className="text-[12px] font-semibold text-stone-800 mb-3 truncate">
                            {entry.keterangan}
                          </p>

                          {/* Debit / Kredit entries */}
                          <div className="bg-stone-50/70 rounded-lg border border-stone-100 px-3.5 py-2.5 space-y-1.5">
                            {/* Debit line */}
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-stone-600 font-medium">
                                <span className="inline-flex items-center justify-center w-5 h-4 bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded mr-1.5">Dr</span>
                                {entry.debitKode} {entry.debitNama}
                              </span>
                              <span className="text-stone-800 font-bold tabular-nums">
                                Rp {entry.nominal.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Kredit line — indented per accounting convention */}
                            <div className="flex justify-between items-center text-[11px] pl-4">
                              <span className="text-stone-500 font-medium">
                                <span className="inline-flex items-center justify-center w-5 h-4 bg-blue-100 text-blue-700 font-bold text-[9px] rounded mr-1.5">Cr</span>
                                {entry.kreditKode} {entry.kreditNama}
                              </span>
                              <span className="text-stone-600 font-semibold tabular-nums">
                                Rp {entry.nominal.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer link */}
                  {jurnalList.length > 0 && (
                    <div className="border-t border-stone-100 shrink-0">
                      <Link
                        href="/keuangan/jurnal"
                        className="w-full py-3 flex items-center justify-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-[12px] transition hover:bg-stone-50"
                      >
                        Lihat semua jurnal <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
