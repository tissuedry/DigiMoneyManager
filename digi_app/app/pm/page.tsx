"use client";

import {
  ArrowRight,
  AlertCircle,
  Check,
  TrendingUp,
  Wallet,
  FileCheck,
  ChevronRight,
  Bell
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";
import CompactNominal from "@/components/compact-nominal";
import { useApi } from "@/lib/use-api";
import PMSkeleton from "./PMSkeleton";

type PosAnggaran = {
  id: number;
  namaPos: string;
  nominalAlokasi: string;
  nominalTerpakai: string;
  deskripsi: string;
};

type ProjectBudget = {
  id: number;
  nilaiKontrak: string;
  totalPengeluaran: string;
  totalReimbursement: string;
  sisaBudget: string;
  posAnggaran: PosAnggaran[];
};

type ProjectData = {
  id: number;
  nama: string;
  nomorRegister?: string | null;
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

type MeResponse = {
  user?: { proyekId?: number };
};

export default function PMDashboardPage() {
  const { data: meData, isLoading: isMeLoading } = useApi<MeResponse>("/api/auth/me");

  const resolvedProyekId = meData?.user?.proyekId ?? null;

  const dashboardUrl = resolvedProyekId
    ? `/api/dashboard?projectId=${resolvedProyekId}&role=Project+Manager`
    : "/api/dashboard?role=Project+Manager";

  const { data: dashData, isLoading: isDashLoading, error: dashError } = useApi<{ dashboard: DashboardData }>(dashboardUrl);

  const isLoading = isMeLoading || isDashLoading;
  const data = dashData?.dashboard ?? null;
  const error = dashError?.message ?? null;

  const project = data?.project ?? null;
  const budget = project?.budget ?? null;
  const rab = budget ? Number(budget.nilaiKontrak) : 0;
  const used = budget ? Number(budget.totalPengeluaran) : 0;
  const rem = budget ? Number(budget.sisaBudget) : 0;

  const usedPercentage = rab > 0 ? (used / rab) * 100 : 0;
  const remPercentage = rab > 0 ? (rem / rab) * 100 : 0;

  const statCards = [
    {
      label: "Total Nilai Proyek",
      num: rab,
      sub: "Alokasi anggaran awal",
      icon: <Wallet size={18} className="text-stone-600" />,
      iconBg: "bg-stone-100",
    },
    {
      label: "Total Terpakai",
      num: used,
      sub: `${usedPercentage.toFixed(1)}% dari total nilai proyek`,
      icon: <TrendingUp size={18} className="text-rose-600" />,
      iconBg: "bg-rose-50",
    },
    {
      label: "Sisa Budget",
      num: rem,
      sub: `${remPercentage.toFixed(1)}% anggaran tersisa`,
      icon: <Check size={18} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: "Menunggu Persetujuan",
      num: null,
      customVal: `${data?.pendingApprovalsCount ?? 0} Pengajuan`,
      sub: "Butuh review Anda segera",
      icon: <FileCheck size={18} className="text-blue-600" />,
      iconBg: "bg-blue-50",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4] overflow-hidden">
        <Header
          userRole="Project Manager"
        />

        <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <PMSkeleton />
          ) : error ? (
            <>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900 leading-tight">Beranda Project Manager</h1>
                  <p className="text-sm text-stone-500 mt-1.5">
                    Kelola budget proyek, pantau biaya lapangan, dan setujui reimbursement karyawan.
                  </p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold">
                Gagal memuat dashboard: {error}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-stone-900 leading-tight">
                      {project?.nama || "Beranda Project Manager"}
                    </h1>
                    {project?.status && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        project.status.toUpperCase() === 'AKTIF' || project.status.toUpperCase() === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : project.status.toUpperCase() === 'DONE' || project.status.toUpperCase() === 'SELESAI'
                          ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                          : project.status.toUpperCase() === 'PLANNING'
                          ? 'bg-[#fbf0e4] text-[#854d0e] border-[#f5e1ce]'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        {project.status.toUpperCase() === 'AKTIF' || project.status.toUpperCase() === 'ACTIVE'
                          ? 'Active'
                          : project.status.toUpperCase() === 'DONE' || project.status.toUpperCase() === 'SELESAI'
                          ? 'Done'
                          : project.status.toUpperCase() === 'PLANNING'
                          ? 'Planning'
                          : project.status}
                      </span>
                    )}
                    {(project?.nomorRegister || project?.id) && (
                      <span className="text-[12px] font-medium text-stone-400">
                        {project.nomorRegister ? project.nomorRegister : `PRJ-${String(project.id).padStart(3, '0')}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mt-1.5">
                    Kelola budget proyek, pantau biaya lapangan, dan setujui reimbursement karyawan.
                  </p>
                </div>
              </div>
              {!data || data.project === null ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm max-w-xl mx-auto space-y-4 my-10">
                  <AlertCircle className="mx-auto text-amber-500" size={40} />
                  <h3 className="text-lg font-bold text-stone-900">Belum Ada Proyek</h3>
                  <p className="text-sm text-stone-500">
                    Akun Anda belum terasosiasi dengan proyek manapun. Hubungi administrator atau tim keuangan untuk menghubungkan Anda ke sebuah proyek aktif.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
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
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                                  {card.icon}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-stone-900 tracking-tight">
                                  {card.num !== null ? (
                                    <CompactNominal value={card.num} compactThreshold={1_000_000_000_000} showTooltip />
                                  ) : (
                                    card.customVal
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-400 mt-1">
                                  {card.sub}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-stone-900">Progres Penyerapan Anggaran</h3>
                              <p className="text-xs text-stone-400 mt-0.5">Visualisasi alokasi terpakai vs sisa dana proyek</p>
                            </div>
                            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
                              {project?.nomorRegister ? project.nomorRegister : `ID: ${project?.id}`}
                            </span>
                          </div>

                          <div className="w-full bg-stone-100 h-5 rounded-full overflow-hidden relative">
                            <div
                              style={{ width: `${usedPercentage}%` }}
                              className="h-full bg-rose-600 transition-all duration-700 flex items-center justify-end pr-3 text-[10px] font-extrabold text-white"
                            >
                              {usedPercentage > 10 ? `${usedPercentage.toFixed(1)}% Terpakai` : ""}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs font-medium text-stone-500">
                            <span className="flex items-center gap-1.5 cursor-pointer">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                              Terpakai: {<CompactNominal value={used} compactThreshold={1_000_000_000_000} showTooltip />}
                            </span>
                            <span className="flex items-center gap-1.5 cursor-pointer">
                              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                              Sisa Budget: {<CompactNominal value={rem} compactThreshold={10_000_000_000_000} showTooltip />}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 lg:col-span-7">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                              <div>
                                <h3 className="font-bold text-[15px] text-stone-900">Realisasi Pos Anggaran</h3>
                                <p className="text-[11px] text-stone-400 mt-0.5">Penyerapan per kategori alokasi</p>
                              </div>
                              <Link
                                href={{
                                  pathname: "/pm/proyek",
                                  query: { detailModal: 'true' },
                                }}
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
                                  const real = Number(pos.nominalTerpakai);
                                  const pctRaw = alloc > 0 ? (real / alloc) * 100 : 0;
                                  const pctFormatted = pctRaw.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  const isOverBudget = real >= alloc;
                                  const isWarning = pctRaw >= 80 && !isOverBudget;

                                  let barColor = 'bg-emerald-600';
                                  if (isOverBudget) barColor = 'bg-red-500';
                                  else if (isWarning) barColor = 'bg-amber-500';

                                  return (
                                    <div key={pos.id} className="space-y-1.5">
                                      <div className="flex justify-between text-xs font-medium">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-stone-800">{pos.namaPos}</span>
                                          {isOverBudget && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded">
                                              <AlertCircle size={8} /> Over Budget
                                            </span>
                                          )}

                                          {isWarning && !isOverBudget && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">
                                              <AlertCircle size={8} /> Hampir Limit
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-stone-500 ">
                                          <span className="font-bold text-stone-800">Rp {real.toLocaleString('id-ID')}</span>
                                          <span className="text-stone-300 mx-1">/</span>
                                          <span>Rp {alloc.toLocaleString('id-ID')}</span>
                                        </div>
                                      </div>

                                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
                                        <div
                                          className={`h-full transition-all duration-500 ${barColor}`}
                                          style={{ width: `${Math.min(pctRaw, 100)}%` }}
                                        />
                                      </div>

                                      <div className="flex justify-between text-[10px] text-stone-400 font-medium">
                                        <span>Terpakai: {pctFormatted}%</span>
                                        <span>Sisa: Rp {(alloc - real).toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-xs text-stone-400 text-center py-4 font-medium">Belum ada pos anggaran.</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-6 lg:col-span-5">
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
                                        <span className="text-[9px] text-stone-400  mt-1 block">
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
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

