// components/Sidebar.tsx
import React from "react";
import Link from "next/link";
import { LayoutDashboard, Wallet, BookOpen, BarChart3, Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#f4f1eb] border-r border-stone-200 flex flex-col justify-between py-6 px-4 shrink-0 h-full">
      <div>
        {/* Logo Brand */}
        <div className="flex items-center gap-3 px-2 mb-6">
          {/* Kotak Logo Silang Bawaan Mockup */}
          <div className="w-10 h-10 border border-stone-400 relative flex items-center justify-center shrink-0 bg-white/20">
            <div className="absolute w-full h-[1px] bg-stone-400 rotate-45"></div>
            <div className="absolute w-full h-[1px] bg-stone-400 -rotate-45"></div>
          </div>
          <span className="font-semibold text-stone-900 text-base tracking-tight">
            Digi Money Manager
          </span>
        </div>

        {/* Garis Pembatas Tipis */}
        <div className="border-b border-stone-200/60 mx-2 mb-6"></div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {/* Menu: Beranda Keuangan (Inaktif) */}
          <Link 
            href="/" 
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-200/40 transition"
          >
            <LayoutDashboard size={20} className="text-stone-700 stroke-[1.75]" />
            <span>Beranda Keuangan</span>
          </Link>
          
          {/* Menu: Pencairan (Aktif - Putih Bersih dengan Badge Hijau Tua) */}
          <Link 
            href="/pencairan" 
            className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold bg-white text-stone-900 shadow-sm border border-stone-200/30"
          >
            <div className="flex items-center gap-3.5">
              <Wallet size={20} className="text-[#005c3e] stroke-[2.25]" />
              <span>Pencairan</span>
            </div>
            <span className="bg-[#005c3e] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
              2
            </span>
          </Link>
          
          {/* Menu: Jurnal Akuntansi (Inaktif) */}
          <Link 
            href="/jurnal" 
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-200/40 transition"
          >
            <BookOpen size={20} className="text-stone-700 stroke-[1.75]" />
            <span>Jurnal Akuntansi</span>
          </Link>
          
          {/* Menu: Chart of Accounts (Inaktif) */}
          <Link 
            href="/coa" 
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-200/40 transition"
          >
            <Settings size={20} className="text-stone-700 stroke-[1.75]" />
            <span>Chart of Accounts</span>
          </Link>
          
          {/* Menu: Laporan Keuangan (Inaktif) */}
          <Link 
            href="/laporan" 
            className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-200/40 transition"
          >
            <BarChart3 size={20} className="text-stone-700 stroke-[1.75]" />
            <span>Laporan Keuangan</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}