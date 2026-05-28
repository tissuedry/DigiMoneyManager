"use client";

import React from 'react';
import { Menu, Bell } from 'lucide-react';

interface HeaderKaryawanProps {
  onOpenSidebar: () => void;
}

export default function HeaderKaryawan({
  onOpenSidebar
}: HeaderKaryawanProps) {
  // Data Mock Pengguna Karyawan sesuai Gambar
  const userMeta = {
    name: "Alif Ihsan",
    role: "Karyawan",
    initials: "AI",
    notificationCount: 3
  };

  return (
    <header className="bg-[#F4F3EE] border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-slate-600 p-1 cursor-pointer" onClick={onOpenSidebar}>
          <Menu size={22} />
        </button>
        <div className="w-7 h-7 border border-slate-400 rounded flex items-center justify-center text-slate-500 text-xs font-mono select-none">✕</div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifikasi */}
        <button className="relative p-3 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm cursor-pointer">
          <Bell size={16} className="stroke-[2.2]" />
          {userMeta.notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-700 text-white font-extrabold text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
              {userMeta.notificationCount}
            </span>
          )}
        </button>

        {/* Profile Box */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 shadow-sm">
          <div className="w-7 h-7 bg-[#DDF2E8] text-[#198754] rounded-full flex items-center justify-center font-bold text-[10px] tracking-wider select-none shrink-0">
            {userMeta.initials}
          </div>
          <div className="text-left hidden sm:block">
            <h4 className="text-xs font-bold text-slate-800 leading-tight">{userMeta.name}</h4>
            <p className="text-[9px] font-medium text-slate-400 mt-0.5">{userMeta.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
