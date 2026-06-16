"use client";

import React, { useEffect, useState } from "react";
import { Plus, ArrowRight, FileText, Loader2 } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Link from "next/link";

// Tipe Data untuk State Frontend
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
    ocrData: any;
    proyek?: { nama: string };
    posAnggaran?: { namaPos?: string; deskripsi?: string };
  }>;
};

type StatusBadge = { text: string; className: string };

// Helper warna badge berdasarkan status backend
const getStatusBadge = (status: string): StatusBadge => {
  switch (status) {
    case "SUBMITTED":
      return { text: "Menunggu PM", className: "bg-[#fdf3e6] text-[#b46b2b]" };
    case "APPROVED_BY_PM":
      return { text: "Verifikasi Keuangan", className: "bg-[#e1f5fe] text-[#0277bd]" };
    case "APPROVED":
      return { text: "Dicairkan", className: "bg-[#e2f1eb] text-[#117a5b]" };
    case "REJECTED":
      return { text: "Ditolak", className: "bg-[#fee2e2] text-[#be123c]" };
    default:
      return { text: status, className: "bg-stone-100 text-stone-600" };
  }
};

// Helper untuk format ringkasan nominal besar (contoh: 700000 -> 700 rb)
const formatShortAmount = (amount: number) => {
  if (amount >= 1000000) {
    return { value: (amount / 1000000).toFixed(1), unit: "jt" };
  }
  if (amount >= 1000) {
    return { value: (amount / 1000).toFixed(0), unit: "rb" };
  }
  return { value: amount.toString(), unit: "" };
};

// Helper format uang Rupiah standar
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function BerandaKaryawanPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard?role=Karyawan", { method: "GET" });

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
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      {/* Area Konten Kanan */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Judul Halaman + Tombol CTA */}
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#2d6a4f]" size={32} />
              <p className="text-stone-500 text-[14px]">Memuat data dashboard...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-[14px]">
              Gagal memuat dashboard: {error}
            </div>
          ) : data ? (
            <>
              {/* Kartu Statistik Dinamis */}
              <div className="grid grid-cols-3 gap-5 mb-8">
                {/* Pengajuan Aktif (Menunggu Approval) */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Pengajuan Aktif</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#fdf3e6]">
                      <FileText size={16} className="text-[#b46b2b]" />
                    </div>
                  </div>
                  <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                    {data.summary.pendingCount}
                  </p>
                  <p className="text-[12px] text-stone-400">menunggu approval</p>
                </div>

                {/* Total Nominal Diajukan */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Total Diajukan</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e1f5fe]">
                      <FileText size={16} className="text-[#0277bd]" />
                    </div>
                  </div>
                  <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                    <span className="text-[16px] font-semibold text-stone-500 mr-1">Rp</span>
                    {formatShortAmount(data.summary.totalNominalSubmitted).value}{" "}
                    <span className="text-[20px] font-semibold text-stone-500">
                      {formatShortAmount(data.summary.totalNominalSubmitted).unit}
                    </span>
                  </p>
                  <p className="text-[12px] text-stone-400">{data.summary.totalSubmissions} pengajuan</p>
                </div>

                {/* Total Pengajuan Berhasil Dicairkan */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-stone-500 font-medium">Total Dicairkan</p>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e2f1eb]">
                      <FileText size={16} className="text-[#117a5b]" />
                    </div>
                  </div>
                  <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">{data.summary.approvedCount}</p>
                  <p className="text-[12px] text-stone-400">pengajuan berhasil dicairkan</p>
                </div>
              </div>

              {/* Pengajuan Terakhir Dinamis */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header tabel */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                  <h2 className="text-[15px] font-bold text-stone-900">Pengajuan Terakhir</h2>
                  <Link href="/karyawan/riwayat-pengajuan" className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d6a4f] hover:text-[#245c43] transition-colors">
                    Lihat semua <ArrowRight size={14} />
                  </Link>
                </div>

                {/* List item pengajuan */}
                <div className="divide-y divide-stone-100">
                  {data.recentSubmissions.length === 0 ? (
                    <div className="p-6 text-center text-stone-400 text-[13px]">
                      Belum ada riwayat pengajuan reimbursement.
                    </div>
                  ) : (
                    data.recentSubmissions.map((item) => {
                      const badge = getStatusBadge(item.status);
                      const merchantName =
                        item.ocrData?.merchantName ||
                        item.ocrData?.merchant ||
                        item.posAnggaran?.namaPos ||
                        "Reimbursement";

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                        >
                          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#f5f4ef] border border-stone-200">
                            <FileText size={16} className="text-stone-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-stone-800 truncate">{merchantName}</p>
                            <p className="text-[12px] text-stone-400 mt-0.5 truncate">
                              RB-{item.id} · {item.proyek?.nama || "Tanpa Proyek"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-[14px] font-bold text-stone-800">{formatRupiah(Number(item.nominal))}</p>
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold ${badge.className}`}
                            >
                              {badge.text}
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
