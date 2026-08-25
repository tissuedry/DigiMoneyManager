"use client";

import { useState } from "react";
import { Plus, ArrowRight, FileText } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import CompactNominal from "@/components/compact-nominal";
import { statusMeta } from "@/lib/status";
import { KaryawanDashboardSkeleton } from "./SkeletonLoader";

type DashboardData = {
  summary: {
    totalSubmissions: number;
    totalNominalSubmitted: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
  recentSubmissions: Array<{
    id: number;
    nominal: string;
    status: string;
    nama?: string | null;
    merchant?: string | null;
    proyek?: { nama: string };
    posAnggaran?: { namaPos?: string; deskripsi?: string };
  }>;
};

type DashboardResponse = {
  dashboard: DashboardData;
};

export default function BerandaKaryawanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data, isLoading, error } = useApi<DashboardResponse>("/api/dashboard?role=Karyawan");
  const d = data?.dashboard ?? null;

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-[24px] font-bold text-stone-900">Beranda Karyawan</h1>
              <p className="text-[14px] text-stone-500 mt-1.5">
                Pantau status pengajuan reimbursement-mu dan ajukan klaim baru dalam hitungan detik.
              </p>
            </div>

            <Link href="/karyawan/reimbursement" className="flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#245c43] text-white text-[13px] font-semibold rounded-full shadow-sm transition-colors duration-200">
              <Plus size={15} />
              Ajukan Reimbursement
            </Link>
          </div>

          {isLoading ? (
            <KaryawanDashboardSkeleton />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-[14px]">
              Gagal memuat dashboard: {error.message}
            </div>
          ) : d ? (
            <>
              <div className="grid grid-cols-3 gap-5 mb-8">
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Pengajuan Aktif</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#fdf3e6]">
                      <FileText size={16} className="text-[#b46b2b]" />
                    </div>
                  </div>
                  <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                    {d.summary.pendingCount}
                  </p>
                  <p className="text-[12px] text-stone-400">menunggu approval</p>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Total Diajukan</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e1f5fe]">
                      <FileText size={16} className="text-[#0277bd]" />
                    </div>
                  </div>
                  <div className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                    <CompactNominal value={d.summary.totalNominalSubmitted} compactThreshold={100_000_000_000} />
                  </div>
                  <p className="text-[12px] text-stone-400">{d.summary.totalSubmissions} pengajuan</p>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Total Dicairkan</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e2f1eb]">
                      <FileText size={16} className="text-[#117a5b]" />
                    </div>
                  </div>
                  <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">{d.summary.approvedCount}</p>
                  <p className="text-[12px] text-stone-400">pengajuan berhasil dicairkan</p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                  <h2 className="text-[15px] font-bold text-stone-900">Pengajuan Terakhir</h2>
                  <Link href="/karyawan/riwayat-pengajuan" className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d6a4f] hover:text-[#245c43] transition-colors">
                    Lihat semua <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="divide-y divide-stone-100">
                  {d.recentSubmissions.length === 0 ? (
                    <div className="p-6 text-center text-stone-400 text-[13px]">
                      Belum ada riwayat pengajuan reimbursement.
                    </div>
                  ) : (
                    d.recentSubmissions.map((item) => {
                      const badge = statusMeta(item.status);
                      const merchantName =
                        item.nama ||
                        item.merchant ||
                        item.posAnggaran?.namaPos ||
                        "Reimbursement";

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                        >
                          <div className="w-9 h-9 flex shrink-0 items-center justify-center rounded-xl bg-[#f5f4ef] border border-stone-200">
                            <FileText size={16} className="text-stone-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-stone-800 truncate">{merchantName}</p>
                            <p className="text-[12px] text-stone-400 mt-0.5 truncate">
                              RB-{item.id} · {item.proyek?.nama || "Tanpa Proyek"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <p className="text-[14px] font-bold text-stone-800">
                              <CompactNominal value={item.nominal} compactThreshold={1_000_000_000_000} />
                            </p>
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold ${badge.badge}`}
                            >
                              {badge.label || item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}