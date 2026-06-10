"use client";

import React, { useState } from "react";
import { Plus, ArrowRight, FileText } from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

// Tipe Data
type Submission = {
  id: string;
  date: string;
  merchant: string;
  project: string;
  amount: string;
  status: "Menunggu PM" | "Verifikasi Keuangan" | "Dicairkan" | "Ditolak";
};

// Data Dummy (sama seperti riwayat pengajuan)
const recentSubmissions: Submission[] = [
  { id: "RB-2026-004", date: "18 Mei 2026", merchant: "Indomaret Bandung", project: "Data Center Bandung Tier-3", amount: "Rp 150.000", status: "Ditolak" },
  { id: "RB-2026-003", date: "19 April 2026", merchant: "Solaria Resto Bandung", project: "Pembangunan Gudang Fase 2", amount: "Rp 150.000", status: "Dicairkan" },
  { id: "RB-2026-002", date: "5 April 2026", merchant: "SPBU Pertamina 34.121", project: "Pembangunan Gudang Fase 2", amount: "Rp 450.000", status: "Verifikasi Keuangan" },
  { id: "RB-2026-001", date: "12 Maret 2026", merchant: "Gramedia Merdeka", project: "Renovasi Kantor Cabang Bandung", amount: "Rp 150.000", status: "Menunggu PM" },
];

// Helper warna badge (sama persis dengan riwayat pengajuan)
const getStatusBadge = (status: Submission["status"]) => {
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

export default function BerandaKaryawanPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole='Karyawan'
      />

      {/* Area Konten Kanan */}
      <div className="flex-1 flex flex-col min-w-0">
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
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#245c43] text-white text-[13px] font-semibold rounded-full shadow-sm transition-colors duration-200">
              <Plus size={15} />
              Ajukan Reimbursement
            </button>
          </div>

          {/* Kartu Statistik */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {/* Pengajuan Aktif */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[13px] text-stone-500 font-medium">Pengajuan Aktif</p>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#fdf3e6]">
                  <FileText size={16} className="text-[#b46b2b]" />
                </div>
              </div>
              <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">2</p>
              <p className="text-[12px] text-stone-400">menunggu approval</p>
            </div>

            {/* Total Menunggu Cair */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[13px] text-stone-500 font-medium">Total Menunggu Cair</p>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e1f5fe]">
                  <FileText size={16} className="text-[#0277bd]" />
                </div>
              </div>
              <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                <span className="text-[16px] font-semibold text-stone-500 mr-1">Rp</span>
                700 <span className="text-[20px] font-semibold text-stone-500">rb</span>
              </p>
              <p className="text-[12px] text-stone-400">2 pengajuan</p>
            </div>

            {/* Total Dicairkan */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[13px] text-stone-500 font-medium">Total Dicairkan (2026)</p>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e2f1eb]">
                  <FileText size={16} className="text-[#117a5b]" />
                </div>
              </div>
              <p className="text-[32px] font-bold text-stone-900 leading-none mb-2">
                <span className="text-[16px] font-semibold text-stone-500 mr-1">Rp</span>
                150 <span className="text-[20px] font-semibold text-stone-500">rb</span>
              </p>
              <p className="text-[12px] text-stone-400">1 pengajuan</p>
            </div>
          </div>

          {/* Pengajuan Terakhir */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header tabel */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-[15px] font-bold text-stone-900">Pengajuan Terakhir</h2>
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#2d6a4f] hover:text-[#245c43] transition-colors">
                Lihat semua <ArrowRight size={14} />
              </button>
            </div>

            {/* List item pengajuan */}
            <div className="divide-y divide-stone-100">
              {recentSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors"
                >
                  {/* Ikon dokumen */}
                  <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#f5f4ef] border border-stone-200">
                    <FileText size={16} className="text-stone-500" />
                  </div>

                  {/* Info utama */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-stone-800 truncate">{item.merchant}</p>
                    <p className="text-[12px] text-stone-400 mt-0.5 truncate">
                      {item.id} · {item.project} · {item.date}
                    </p>
                  </div>

                  {/* Nominal + Badge */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-[14px] font-bold text-stone-800">{item.amount}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
