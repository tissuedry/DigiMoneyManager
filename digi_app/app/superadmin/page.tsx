"use client";

import React, { useState, useEffect } from "react";
import { 
  Wallet, Users, Folder, Inbox, Layers, TrendingUp, Receipt, ArrowRight, Loader2
} from "lucide-react";
import Link from "next/link";
import CompactNominal from "@/components/compact-nominal";

interface DashboardStats {
  totalNilaiProyek: number;
  userAktif: number;
  proyekAktif: number;
  approvalTertunda: number;
  akunCoa: number;
  totalPengajuan: number;
  siapDicairkan: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalNilaiProyek: 0,
    userAktif: 0,
    proyekAktif: 0,
    approvalTertunda: 0,
    akunCoa: 0,
    totalPengajuan: 0,
    siapDicairkan: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" }); 
        
        if (res.ok) {
          const data = await res.json();
          if (data.dashboard && data.dashboard.metrics) {
            const m = data.dashboard.metrics;
            setStats({
              totalNilaiProyek: m.totalNilaiProyek || 0,
              userAktif: m.totalUserAktif || 0,
              proyekAktif: m.totalProyekAktif || 0,
              approvalTertunda: m.totalMenungguApproval || 0,
              akunCoa: m.totalCoA || 0,
              totalPengajuan: m.totalPengajuan || 0,
              siapDicairkan: m.totalSiapDicairkan || 0,
            });
          }
        } else {
          console.error("Gagal mengambil data dashboard");
        }
      } catch (error) {
        console.error("Terjadi kesalahan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 w-full mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Beranda Super Admin</h1>
        <p className="text-stone-500 mt-1.5 text-sm max-w-3xl">
          Satu layar untuk memantau seluruh alur kerja — karyawan, project manager, keuangan, dan direktur.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 bg-[#f2f4f7] px-3 py-1.5 rounded-lg border border-stone-100">
          <Wallet size={16} className="text-blue-500" />
          <span className="text-sm font-bold text-stone-800"><CompactNominal value={stats.totalNilaiProyek} compactThreshold={100_000_000_000} /></span>
          <span className="text-[11px] text-stone-500">Total Nilai Proyek</span>
        </div>
        <div className="flex items-center gap-2 bg-[#e6f4ea] px-3 py-1.5 rounded-lg border border-stone-100">
          <Users size={16} className="text-emerald-600" />
          <span className="text-sm font-bold text-stone-800">{stats.userAktif}</span>
          <span className="text-[11px] text-stone-500">User Aktif</span>
        </div>
        <div className="flex items-center gap-2 bg-[#f4e6f4] px-3 py-1.5 rounded-lg border border-stone-100">
          <Folder size={16} className="text-purple-600" />
          <span className="text-sm font-bold text-stone-800">{stats.proyekAktif}</span>
          <span className="text-[11px] text-stone-500">Proyek Aktif</span>
        </div>
        <div className="flex items-center gap-2 bg-[#fce8d5] px-3 py-1.5 rounded-lg border border-stone-100">
          <Inbox size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-stone-800">{stats.approvalTertunda}</span>
          <span className="text-[11px] text-stone-500">Approval Tertunda</span>
        </div>
        <div className="flex items-center gap-2 bg-[#e0f2f1] px-3 py-1.5 rounded-lg border border-stone-100">
          <Layers size={16} className="text-teal-600" />
          <span className="text-sm font-bold text-stone-800">{stats.akunCoa}</span>
          <span className="text-[11px] text-stone-500">Akun CoA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#e6f4ea] text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Receipt size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Karyawan</h3>
            <p className="text-sm text-stone-500 mt-1">Reimbursement & riwayat pengajuan</p>
          </div>
          <Link href="/superadmin/riwayat-pengajuan" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.totalPengajuan} pengajuan tercatat <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#fde8e8] text-red-500 rounded-xl flex items-center justify-center mb-4">
              <Folder size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Project Manager</h3>
            <p className="text-sm text-stone-500 mt-1">Approval, kelola proyek & budget</p>
          </div>
          <Link href="/superadmin/approval" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.approvalTertunda} menunggu approval <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#e0f2fe] text-blue-500 rounded-xl flex items-center justify-center mb-4">
              <Wallet size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Tim Keuangan</h3>
            <p className="text-sm text-stone-500 mt-1">Pencairan, jurnal & laporan</p>
          </div>
          <Link href="/superadmin/pencairan" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.siapDicairkan} siap dicairkan <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#ede9fe] text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Direktur</h3>
            <p className="text-sm text-stone-500 mt-1">Kelola proyek, profitabilitas & laporan eksekutif</p>
          </div>
          <Link href="/superadmin/proyek" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.proyekAktif} proyek aktif <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#f3e8ff] text-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Layers size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Master CoA</h3>
            <p className="text-sm text-stone-500 mt-1">Chart of Accounts</p>
          </div>
          <Link href="/superadmin/master-coa" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.akunCoa} akun terdaftar <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 bg-[#ffedd5] text-orange-500 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-lg text-stone-800">Kelola Akun</h3>
            <p className="text-sm text-stone-500 mt-1">Akun karyawan & akses sistem</p>
          </div>
          <Link href="/superadmin/kelola-akun" className="flex items-center justify-between text-emerald-600 font-semibold text-sm mt-6 hover:text-emerald-700">
            {stats.userAktif} pengguna <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}