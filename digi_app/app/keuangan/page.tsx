"use client";

import { useState } from "react";
import {
  Wallet,
  Notebook,
  Zap,
  SquareMinus,
  ChevronRight,
  BookOpen,
  ArrowDown,
  ArrowUp,
  CreditCard,
  FileText,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import CompactNominal from "@/components/compact-nominal";
import { formatTanggal, getInitials } from "@/lib/formatters";

interface DashboardMetrics {
  totalPengeluaranNominal?: number;
  totalPencairanCount?: number;
  pendingDisbursementsNominal: number;
  pendingDisbursementCount: number;
  totalPemasukanNominal?: number;
  totalTerminDiterimaCount?: number;
  totalBelumDiterimaNominal?: number;
  totalTerminBelumDiterimaCount?: number;
  disbursedTodayNominal?: number;
  disbursedTodayCount?: number;
  jurnalCountThisMonth?: number;
  totalDebitKredit?: number;
  totalDebit?: number;
  totalKredit?: number;
}

interface PencairanItem {
  id: number;
  nominal: number;
  status: string;
  tipe?: string;
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

interface PendingTerminItem {
  id: number;
  namaTermin: string;
  persentaseProgress: number;
  nominal: number;
  status: string;
  proyek: { nama: string };
}

interface RiwayatTerminItem {
  id: number;
  namaTermin: string;
  persentaseProgress: number;
  nominal: number;
  tanggalPencairan: string | null;
  status: string;
  proyek: { nama: string };
}

interface DashboardResponse {
  dashboard: {
    metrics: DashboardMetrics;
    pendingDisbursements: PencairanItem[];
    recentJournals: JurnalItem[];
    pendingTerminList?: PendingTerminItem[];
    riwayatTerminList?: RiwayatTerminItem[];
  };
}

export default function KeuanganDashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data, isLoading } = useApi<DashboardResponse>("/api/dashboard");

  const metrics = data?.dashboard?.metrics;
  const pencairanList = data?.dashboard?.pendingDisbursements ?? [];
  const jurnalList = data?.dashboard?.recentJournals ?? [];
  const pendingTerminList = data?.dashboard?.pendingTerminList ?? [];
  const riwayatTerminList = data?.dashboard?.riwayatTerminList ?? [];

  const statCards = [
    {
      label: "Total Biaya",
      rawNominal: metrics?.totalPengeluaranNominal ?? 0,
      sub: `${metrics?.totalPencairanCount ?? 0} pencairan`,
      icon: <ArrowDown size={16} className="text-rose-600" />,
      iconBg: "bg-rose-50 border border-rose-100",
    },
    {
      label: "Menunggu Pencairan",
      rawNominal: metrics?.pendingDisbursementsNominal ?? 0,
      sub: `${metrics?.pendingDisbursementCount ?? 0} antrian menunggu`,
      icon: <Wallet size={16} className="text-amber-600" />,
      iconBg: "bg-amber-50 border border-amber-100",
    },
    {
      label: "Total Pendapatan",
      rawNominal: metrics?.totalPemasukanNominal ?? 0,
      sub: `${metrics?.totalTerminDiterimaCount ?? 0} termin diterima`,
      icon: <ArrowUp size={16} className="text-emerald-600" />,
      iconBg: "bg-emerald-50 border border-emerald-100",
    },
    {
      label: "Belum Diterima",
      rawNominal: metrics?.totalBelumDiterimaNominal ?? 0,
      sub: `${metrics?.totalTerminBelumDiterimaCount ?? 0} termin menunggu`,
      icon: <CreditCard size={16} className="text-sky-600" />,
      iconBg: "bg-sky-50 border border-sky-100",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4]">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userRole="Tim Keuangan"
        />

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full mx-auto space-y-6">

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                Beranda Keuangan
              </h1>
              <p className="text-sm text-stone-500 mt-1.5">
                Proses pencairan reimbursement yang telah divalidasi PM. Jurnal
                akuntansi ter-generate otomatis.
              </p>
            </div>

            {!isLoading && (
              <Link
                href="/keuangan/pencairan"
                className="flex items-center gap-2 mt-5 bg-[#008f5d] hover:bg-[#00754c] transition-all duration-200 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-sm shrink-0 self-start hover:shadow-md"
              >
                <SquareMinus size={15} />
                Antrian Pencairan ({pencairanList.length})
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm min-h-[110px] animate-pulse"
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

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 animate-pulse">
                    <div className="h-4 w-32 bg-stone-100 rounded mb-4" />
                    <div className="space-y-3">
                      <div className="h-10 bg-stone-50 rounded-xl" />
                      <div className="h-10 bg-stone-50 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-8">

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[115px] transition-all duration-200 hover:shadow-md hover:border-stone-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-stone-500">
                        {card.label}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${card.iconBg}`}
                      >
                        {card.icon}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[20px] font-bold text-stone-900 leading-tight">
                        <CompactNominal value={card.rawNominal} compactThreshold={100_000_000_000_000} />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 font-medium">
                        {card.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-stone-500" />
                        <h2 className="text-[15px] font-bold text-stone-900">
                          Antrian Pencairan
                        </h2>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                        Reimbursement disetujui PM, siap dicairkan
                      </p>
                    </div>
                    <Link
                      href="/keuangan/pencairan?select=all"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Proses semua
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto flex-1 max-h-[320px]">
                    {pencairanList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2">
                          <Wallet size={18} className="text-stone-400" />
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
                            className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50/80 transition-colors duration-150 group"
                          >
                            <div className="w-9 h-9 rounded-full bg-[#e2f1eb] text-[#117a5b] font-bold text-[12px] flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                              {initials}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-stone-900 truncate">
                                {item.user?.nama}
                                <span className="text-stone-400 font-normal ml-1.5 text-[11px]">
                                  · {item.user?.divisi || "Karyawan"}
                                </span>
                              </p>
                              <p className="text-[11px] text-stone-400 mt-0.5 truncate font-medium">
                                RB-{String(item.id).padStart(4, '0')} · {item.proyek?.nama}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[13px] font-bold text-stone-800 tabular-nums">
                                <CompactNominal value={item.nominal} compactThreshold={100_000_000_000_000} />
                              </span>
                              <Link
                                href={`/keuangan/pencairan?id=${item.id}`}
                                className="flex items-center gap-1.5 bg-[#008f5d] hover:bg-[#00754c] transition-all duration-200 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md"
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

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[380px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-stone-500" />
                        <h2 className="text-[15px] font-bold text-stone-900">
                          Riwayat Pencairan
                        </h2>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                        Riwayat pencairan reimbursement & realisasi terbaru
                      </p>
                    </div>
                    <Link
                      href="/keuangan/jurnal"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Lihat Semua Riwayat
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto flex-1 max-h-[320px]">
                    {jurnalList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2">
                          <BookOpen size={18} className="text-stone-400" />
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">Belum ada jurnal</p>
                        <p className="text-[11px] text-stone-400 mt-1">Jurnal akuntansi akan ter-generate otomatis saat pencairan.</p>
                      </div>
                    ) : (
                      jurnalList.map((entry, idx) => (
                        <div key={idx} className="px-6 py-3.5 hover:bg-stone-50/80 transition-colors duration-150">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px]  text-stone-500 bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded font-semibold">
                              {entry.jeId}
                            </span>
                            <span className="text-[11px] text-stone-400 font-medium">
                              {entry.tanggal ? formatTanggal(entry.tanggal) : "-"}
                            </span>
                          </div>

                          <p className="text-[12px] font-semibold text-stone-800 mb-2 truncate">
                            {entry.keterangan}
                          </p>

                          <div className="bg-stone-50/80 rounded-lg border border-stone-100 p-2.5 space-y-1.5">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-stone-600 font-medium truncate max-w-[70%]">
                                <span className="inline-flex items-center justify-center w-5 h-4 bg-emerald-100 text-emerald-700 font-bold text-[9px] rounded mr-1.5">Dr</span>
                                {entry.debitKode} {entry.debitNama}
                              </span>
                              <span className="text-stone-800 font-bold tabular-nums shrink-0 ml-2">
                                <CompactNominal value={entry.nominal} compactThreshold={100_000_000_000_000} />
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[11px] pl-3">
                              <span className="text-stone-500 font-medium truncate max-w-[70%]">
                                <span className="inline-flex items-center justify-center w-5 h-4 bg-blue-100 text-blue-700 font-bold text-[9px] rounded mr-1.5">Cr</span>
                                {entry.kreditKode} {entry.kreditNama}
                              </span>
                              <span className="text-stone-600 font-semibold tabular-nums shrink-0 ml-2">
                                <CompactNominal value={entry.nominal} compactThreshold={100_000_000_000_000} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[360px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Notebook size={16} className="text-stone-500" />
                        <h2 className="text-[15px] font-bold text-stone-900">
                          Termin Belum Diterima
                        </h2>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                        Termin proyek yang belum dibayarkan klien
                      </p>
                    </div>
                    <Link
                      href="/keuangan/proyek"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Lihat Per Proyek
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto flex-1 max-h-[300px]">
                    {pendingTerminList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2">
                          <FileText size={18} className="text-stone-400" />
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">Tidak ada termin pending</p>
                        <p className="text-[11px] text-stone-400 mt-1">Semua termin pembayaran telah diterima.</p>
                      </div>
                    ) : (
                      pendingTerminList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50/80 transition-colors duration-150"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-[13px] font-bold text-stone-900 truncate">
                              {item.namaTermin} · {item.proyek?.nama}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                              Progress: {item.persentaseProgress}%
                            </p>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="text-[13px] font-bold text-stone-900 tabular-nums">
                              <CompactNominal value={item.nominal} compactThreshold={100_000_000_000_000} />
                            </span>
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Belum Diterima
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[360px]">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <Notebook size={16} className="text-stone-500" />
                        <h2 className="text-[15px] font-bold text-stone-900">
                          Riwayat Termin
                        </h2>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                        Pendapatan termin terbaru
                      </p>
                    </div>
                    <Link
                      href="/keuangan/proyek"
                      className="flex items-center gap-1 text-[12px] font-semibold text-[#008f5d] hover:text-[#00754c] transition"
                    >
                      Lihat Per Proyek
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="divide-y divide-stone-100 overflow-y-auto flex-1 max-h-[300px]">
                    {riwayatTerminList.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2">
                          <FileText size={18} className="text-stone-400" />
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">Belum ada riwayat termin</p>
                        <p className="text-[11px] text-stone-400 mt-1">Termin yang sudah diterima akan muncul di sini.</p>
                      </div>
                    ) : (
                      riwayatTerminList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-6 py-3.5 hover:bg-stone-50/80 transition-colors duration-150"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-[13px] font-bold text-stone-900 truncate">
                              {item.namaTermin} · {item.proyek?.nama}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                              Progress: {item.persentaseProgress}% · Cair: {item.tanggalPencairan ? formatTanggal(item.tanggalPencairan) : "-"}
                            </p>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="text-[13px] font-bold text-stone-900 tabular-nums">
                              <CompactNominal value={item.nominal} compactThreshold={100_000_000_000_000} />
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Diterima
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}