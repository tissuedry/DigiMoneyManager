"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileCheck, 
  Wallet, 
  BarChart3, 
  X 
} from 'lucide-react';

interface SidebarPMProps {
  isSidebarOpen: boolean;
  onClose: () => void;
}

export default function SidebarPM({
  isSidebarOpen,
  onClose
}: SidebarPMProps) {
  return (
    <>
      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-black transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex lg:flex-col border-r border-slate-200
      `}>
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

        <nav className="p-4 space-y-1 flex-1">
          <Link href="/pm/beranda" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
            <LayoutDashboard size={18} /> Beranda PM
          </Link>
          <Link href="/pm/approval" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
            <div className="flex items-center gap-3">
              <FileCheck size={18} /> Antrian Approval
            </div>
            <span className="bg-green-900 text-white font-bold text-xs px-2 py-0.5 rounded-full">2</span>
          </Link>
          <Link href="/pm/budget" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-white text-black hover:bg-[#E9E5DD] font-medium">
            <Wallet size={18} className="text-emerald-600" /> Budget Proyek
          </Link>
          <Link href="/pm/service-score" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black hover:bg-[#E9E5DD] transition">
            <BarChart3 size={18} /> Service Score
          </Link>
        </nav>
      </aside>
    </>
  );
}
