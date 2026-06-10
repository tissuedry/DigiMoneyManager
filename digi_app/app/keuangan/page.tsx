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

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
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
      label: `Jurnal Generated (${getCurrentMonthName()})`,
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
    <div className="flex min-h-screen w-full bg-[#f4f2ec] text-stone-800 overflow-hidden">
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

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* ── Page Header ── */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#14130F]">
                Beranda Keuangan
              </h1>
              <p className="text-[13px] text-stone-500 mt-1">
                Proses pencairan reimbursement yang telah divalidasi PM. Jurnal
                akuntansi ter-generate otomatis.
              </p>
            </div>

            {/* Tombol Antrian Pencairan — selalu tampil selama ada data */}
            {pencairanList.length > 0 && (
              <Link
                href="/keuangan/pencairan"
                className="flex items-center gap-2 bg-[#008f5d] hover:bg-[#00754c] transition text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-sm shrink-0"
              >
                <SquareMinus size={15} color="currentColor" />
                Antrian Pencairan ({pencairanList.length})
              </Link>
            )}
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {statCards.map((card, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
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
                <div>
                  {isLoading ? (
                    <span className="inline-block h-7 w-24 bg-stone-100 rounded animate-pulse" />
                  ) : (
                    <p className="text-[22px] font-bold text-stone-900 leading-tight">
                      {card.value}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-400 mt-1 font-medium">
                    {card.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Two-column: Antrian + Jurnal ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Antrian Pencairan */}
            <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-[15px] font-bold text-stone-900">
                  Antrian Pencairan
                </h2>
                <Link
                  href="/keuangan/pencairan?select=all"
                  className="flex items-center gap-1 text-[12px] font-semibold text-stone-500 hover:text-stone-800 transition"
                >
                  Proses semua
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-stone-100">
                {isLoading ? (
                  <div className="px-6 py-8 text-center text-xs text-stone-400 font-medium">
                    Memuat data antrian...
                  </div>
                ) : pencairanList.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-stone-400 font-medium">
                    Tidak ada pengajuan yang menunggu pencairan.
                  </div>
                ) : (
                  pencairanList.map((item) => {
                    const initials = getInitials(item.user?.nama || "");
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition"
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[#e2f1eb] text-[#117a5b] font-bold text-[12px] flex items-center justify-center shrink-0">
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-stone-900 truncate">
                            {item.user?.nama}
                            <span className="text-stone-400 font-normal ml-1 text-[11px]">
                              · {item.user?.divisi || item.proyek?.nama}
                            </span>
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                            RB-{String(item.id).padStart(4, '0')} · {item.proyek?.nama}
                          </p>
                        </div>

                        {/* Nominal + Tombol Cairkan */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[13px] font-bold text-stone-800">
                            {formatRupiahFull(item.nominal)}
                          </span>
                          <Link
                            href={`/keuangan/pencairan?id=${item.id}`}
                            className="flex items-center gap-1.5 bg-[#008f5d] hover:bg-[#00754c] transition text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
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
            <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-[15px] font-bold text-stone-900">
                  Jurnal Terbaru
                </h2>
                <Link
                  href="/keuangan/jurnal?tab=Buku Besar"
                  className="flex items-center gap-1 text-[12px] font-semibold text-stone-500 hover:text-stone-800 transition"
                >
                  Buku Besar
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="divide-y divide-stone-100 overflow-y-auto max-h-120">
                {isLoading ? (
                  <div className="px-6 py-8 text-center text-xs text-stone-400 font-medium">
                    Memuat data jurnal...
                  </div>
                ) : jurnalList.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-stone-400 font-medium">
                    Belum ada jurnal akuntansi yang ter-generate.
                  </div>
                ) : (
                  jurnalList.map((entry, idx) => (
                    <div key={idx} className="px-6 py-4 hover:bg-stone-50 transition">
                      {/* JE header row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-stone-400">
                          {entry.jeId}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {formatTanggal(entry.tanggal)}
                        </span>
                      </div>

                      {/* Keterangan */}
                      <p className="text-[12px] font-semibold text-stone-800 mb-2 truncate">
                        {entry.keterangan}
                      </p>

                      {/* Debit line */}
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-600">
                          <span className="text-emerald-700 font-bold">Dr</span>{" "}
                          {entry.debitKode} {entry.debitNama}
                        </span>
                        <span className="text-stone-700 font-semibold">
                          Rp {entry.nominal.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Kredit line */}
                      <div className="flex justify-between items-center text-[11px] mt-1">
                        <span className="text-[#0277bd]">
                          <span className="font-medium">Cr</span>{" "}
                          {entry.kreditKode} {entry.kreditNama}
                        </span>
                        <span className="text-stone-700 font-semibold">
                          Rp {entry.nominal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
