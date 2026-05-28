import React from "react";
import { LayoutGrid, Plus, History, Star } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#f5f4ef] border-r border-stone-200 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo Placeholder */}
      <div className="h-20 flex items-center px-6 gap-3 shrink-0">
        <div className="w-8 h-8 border border-stone-800 rounded flex items-center justify-center bg-white shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <path d="M3 3l18 18M21 3L3 21"></path>
          </svg>
        </div>
        <span className="font-bold text-stone-800 text-[14px]">Digi Money Manager</span>
      </div>

      {/* Menu Navigasi */}
      <nav className="px-4 py-4 space-y-1">
        <Link href="/karyawan/" className="flex items-center gap-3 px-3 py-2.5 text-stone-600 hover:bg-stone-200/50 rounded-xl text-[13px] font-medium transition">
          <LayoutGrid size={18} /> Beranda
        </Link>
        <Link href="/karyawan/reimbursement" className="flex items-center gap-3 px-3 py-2.5 text-stone-600 hover:bg-stone-200/50 rounded-xl text-[13px] font-medium transition">
          <Plus size={18} /> Ajukan Reimbursement
        </Link>
        {/* Menu Aktif */}
        <Link href="/karyawan/riwayat-pengajuan" className="flex items-center gap-3 px-3 py-2.5 bg-white text-stone-900 rounded-xl text-[13px] font-bold shadow-sm transition">
          <History size={18} /> Riwayat Pengajuan
        </Link>
        <Link href="/karyawan/service-score" className="flex items-center gap-3 px-3 py-2.5 text-stone-600 hover:bg-stone-200/50 rounded-xl text-[13px] font-medium transition">
          <Star size={18} /> Service Score
        </Link>
      </nav>
    </aside>
  );
}