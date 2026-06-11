"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Plus, 
  ArrowRight, 
  FileText, 
  Loader2, 
  AlertCircle, 
  Check, 
  TrendingUp, 
  Wallet,
  FileCheck,
  ChevronRight,
  ChevronDown,
  Bell
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";



// Type Definitions matching API responses
type PosAnggaran = {
  id: number;
  namaPos: string;
  nominalAlokasi: string;
  nominalTerpakai: string;
  deskripsi: string;
};

type ProjectBudget = {
  id: number;
  rabTotal: string;
  totalPengeluaran: string;
  totalReimbursement: string;
  sisaBudget: string;
  posAnggaran: PosAnggaran[];
};

type ProjectData = {
  id: number;
  nama: string;
  deskripsi: string | null;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget: ProjectBudget | null;
};

type AlertNotification = {
  id: number;
  tipe: string;
  pesan: string;
  dibaca: boolean;
  timestamp: string;
};

type DashboardData = {
  role: string;
  project: ProjectData | null;
  pendingApprovalsCount: number;
  alerts: AlertNotification[];
  message?: string;
};

// Formatting helpers
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatShortAmount = (amount: number) => {
  if (amount >= 1000000000) {
    return { value: (amount / 1000000000).toFixed(1), unit: "M" };
  }
  if (amount >= 1000000) {
    return { value: (amount / 1000000).toFixed(1), unit: "jt" };
  }
  if (amount >= 1000) {
    return { value: (amount / 1000).toFixed(0), unit: "rb" };
  }
  return { value: amount.toString(), unit: "" };
};

const formatTanggal = (isoString: string | null) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function PMDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [allProjects, setAllProjects] = useState<{ id: number; nama: string }[]>([]);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const url = selectedProjectId ? `/api/dashboard?projectId=${selectedProjectId}` : "/api/dashboard";
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
          const msg = await response.json().catch(() => null);
          throw new Error(msg?.message || "Gagal mengambil data dari server");
        }

        const result = await response.json();
        setData(result.dashboard);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan koneksi");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [selectedProjectId]);

  // Fetch daftar semua proyek untuk dropdown
  useEffect(() => {
    fetch("/api/proyek")
      .then((res) => res.json())
      .then((d) => {
        if (d.projects) setAllProjects(d.projects);
      })
      .catch(() => {});
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Project Manager"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0]">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userRole="Project Manager"
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight">Beranda Project Manager</h1>
              <p className="text-sm text-stone-500 mt-1">
                Kelola budget proyek, pantau pengeluaran lapangan, dan setujui reimbursement karyawan.
              </p>
            </div>
            {data?.project && (
              <div className="relative self-start" ref={projectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-stone-800 max-w-[200px] truncate">
                    {data.project.nama}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-stone-400 transition-transform duration-200 ${isProjectDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isProjectDropdownOpen && allProjects.length > 1 && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    {allProjects.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-stone-50 flex items-center gap-2 transition ${
                          proj.id === data.project?.id
                            ? "text-emerald-700 bg-emerald-50/50"
                            : "text-stone-700"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${proj.id === data.project?.id ? "bg-emerald-500" : "bg-stone-200"}`} />
                        {proj.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="animate-spin text-[#008f5d]" size={32} />
              <p className="text-stone-500 text-[14px]">Memuat dasbor Project Manager...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold">
              Gagal memuat dashboard: {error}
            </div>
          ) : data ? (
            <>
              {data.project === null ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-4 my-10">
                  <AlertCircle className="mx-auto text-amber-500" size={40} />
                  <h3 className="text-lg font-bold text-stone-900">Belum Ada Proyek</h3>
                  <p className="text-sm text-stone-500">
                    Akun Anda belum terasosiasi dengan proyek manapun. Hubungi administrator atau tim keuangan untuk menghubungkan Anda ke sebuah proyek aktif.
                  </p>
                </div>
              ) : (
                <>
                  {/* Dashboard Stat Cards */}
                  {(() => {
                    const project = data.project;
                    const budget = project.budget;
                    const rab = budget ? Number(budget.rabTotal) : 0;
                    const used = budget ? Number(budget.totalPengeluaran) : 0;
                    const rem = budget ? Number(budget.sisaBudget) : 0;
                    
                    const usedPercentage = rab > 0 ? (used / rab) * 100 : 0;
                    const remPercentage = rab > 0 ? (rem / rab) * 100 : 0;

                    const statCards = [
                      {
                        label: "Total RAB Proyek",
                        value: formatRupiah(rab),
                        sub: "Alokasi anggaran awal",
                        icon: <Wallet size={18} className="text-stone-600" />,
                        iconBg: "bg-stone-100",
                      },
                      {
                        label: "Total Terpakai",
                        value: formatRupiah(used),
                        sub: `${usedPercentage.toFixed(1)}% dari total RAB`,
                        icon: <TrendingUp size={18} className="text-rose-600" />,
                        iconBg: "bg-rose-50",
                      },
                      {
                        label: "Sisa Budget",
                        value: formatRupiah(rem),
                        sub: `${remPercentage.toFixed(1)}% anggaran tersisa`,
                        icon: <Check size={18} className="text-emerald-600" />,
                        iconBg: "bg-emerald-50",
                      },
                      {
                        label: "Menunggu Persetujuan",
                        value: `${data.pendingApprovalsCount} Pengajuan`,
                        sub: "Butuh review Anda segera",
                        icon: <FileCheck size={18} className="text-blue-600" />,
                        iconBg: "bg-blue-50",
                      },
                    ];

                    return (
                      <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {statCards.map((card, i) => (
                            <div
                              key={i}
                              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[120px] transition-all duration-200 hover:shadow-md hover:border-stone-300"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-semibold text-stone-500">
                                  {card.label}
                                </span>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                                  {card.icon}
                                </div>
                              </div>
                              <div className="mt-4">
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

                        {/* Overall Budget Progress Bar */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-stone-900">Progres Penyerapan Anggaran</h3>
                              <p className="text-xs text-stone-400 mt-0.5">Visualisasi alokasi terpakai vs sisa dana proyek</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
                              ID: {project.id}
                            </span>
                          </div>
                          
                          <div className="w-full bg-stone-100 h-6 rounded-full overflow-hidden p-0.5 flex">
                            <div
                              style={{ width: `${usedPercentage}%` }}
                              className="h-full bg-rose-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-extrabold text-white"
                            >
                              {usedPercentage > 10 ? `${usedPercentage.toFixed(1)}% Terpakai` : ""}
                            </div>
                            <div className="h-full bg-transparent flex-1" />
                          </div>

                          <div className="flex justify-between items-center text-xs font-medium text-stone-500">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                              Terpakai: {formatRupiah(used)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                              Sisa Budget: {formatRupiah(rem)}
                            </span>
                          </div>
                        </div>

                        {/* Two-Column Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* Left: Pos Anggaran breakdown */}
                          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 lg:col-span-7">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                              <div>
                                <h3 className="font-bold text-[15px] text-stone-900">Realisasi Pos Anggaran</h3>
                                <p className="text-[11px] text-stone-400 mt-0.5">Penyerapan per kategori alokasi</p>
                              </div>
                              <Link 
                                href="/pm/budget"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008f5d] hover:underline"
                              >
                                Detail Budget
                                <ChevronRight size={14} />
                              </Link>
                            </div>

                            <div className="space-y-4">
                              {budget?.posAnggaran && budget.posAnggaran.length > 0 ? (
                                budget.posAnggaran.map((pos) => {
                                  const alloc = Number(pos.nominalAlokasi);
                                  const spent = Number(pos.nominalTerpakai);
                                  const pct = alloc > 0 ? Math.min(Math.round((spent / alloc) * 100), 100) : 0;
                                  const isWarning = pct >= 80;

                                  return (
                                    <div key={pos.id} className="space-y-1.5">
                                      <div className="flex justify-between text-xs font-medium">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-stone-800">{pos.namaPos}</span>
                                          {isWarning && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">
                                              <AlertCircle size={8} /> Hampir Limit
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-stone-500 font-mono">
                                          <span className="font-bold text-stone-800">Rp {spent.toLocaleString('id-ID')}</span>
                                          <span className="text-stone-300 mx-1">/</span>
                                          <span>Rp {alloc.toLocaleString('id-ID')}</span>
                                        </div>
                                      </div>

                                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      
                                      <div className="flex justify-between text-[10px] text-stone-400 font-medium">
                                        <span>Terpakai: {pct}%</span>
                                        <span>Sisa: Rp {(alloc - spent).toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-stone-400 text-center py-4 font-medium">Belum ada pos anggaran.</p>
                              )}
                            </div>
                          </div>

                          {/* Right: Quick actions & Alerts */}
                          <div className="space-y-6 lg:col-span-5">
                            {/* Pending Approvals quick action card */}
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                              <h3 className="font-bold text-[15px] text-stone-900 border-b border-stone-100 pb-3">Validasi Reimbursement</h3>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <FileCheck size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-stone-800 leading-tight">
                                    {data.pendingApprovalsCount} Pengajuan Baru
                                  </p>
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    Butuh review dan persetujuan Project Manager
                                  </p>
                                </div>
                              </div>
                              <Link
                                href="/pm/approval"
                                className="w-full py-2.5 bg-[#008f5d] hover:bg-[#00754c] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                Tinjau Antrian Approval
                                <ArrowRight size={14} />
                              </Link>
                            </div>

                            {/* Notifications / Alerts list */}
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <h3 className="font-bold text-[15px] text-stone-900 flex items-center gap-1.5">
                                  <Bell size={16} className="text-stone-500" />
                                  Notifikasi Penting
                                </h3>
                                {data.alerts.length > 0 && (
                                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                )}
                              </div>

                              <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
                                {data.alerts && data.alerts.length > 0 ? (
                                  data.alerts.map((alert) => (
                                    <div key={alert.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-2.5">
                                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-stone-700 leading-normal font-medium">{alert.pesan}</p>
                                        <span className="text-[9px] text-stone-400 font-mono mt-1 block">
                                          {new Date(alert.timestamp).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="py-6 text-center text-stone-400 text-xs font-medium">
                                    Tidak ada notifikasi penting untuk dibaca.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
