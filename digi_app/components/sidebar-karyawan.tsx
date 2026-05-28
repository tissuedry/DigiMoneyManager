"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  X 
} from 'lucide-react';

interface SidebarKaryawanProps {
  isSidebarOpen: boolean;
  onClose: () => void;
}

export default function SidebarKaryawan({
  isSidebarOpen,
  onClose
}: SidebarKaryawanProps) {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-black transform transition-transform duration-200 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:flex lg:flex-col border-r border-slate-200
    `}>
      {/* Logo Brand */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-xl">D</div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Digi Money Manager</h1>
          </div>
        </div>
        <button className="lg:hidden text-slate-900 hover:text-black cursor-pointer" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Menu Navigasi Sesuai Role Karyawan */}
      <nav className="p-4 space-y-1 flex-1">
        <Link href="/karyawan/beranda" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
          <LayoutDashboard size={18} /> Beranda
        </Link>
        <Link href="/karyawan/reimbursement" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-white text-black hover:bg-[#E9E5DD] font-medium">
          <PlusCircle size={18} className="text-emerald-600" /> Ajukan Reimbursement
        </Link>
        <Link href="/karyawan/riwayat_pengajuan" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
          <FileText size={18} /> Riwayat Pengajuan
        </Link>
        <Link href="/karyawan/service_score" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
          <BarChart3 size={18} /> Service Score
        </Link>
      </nav>
    </aside>
  );
}
