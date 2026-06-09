'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, BookOpen, BarChart3, Settings } from "lucide-react";
        
const navItems = [
  { href: "/keuangan", icon: LayoutDashboard, label: "Beranda Keuangan", badge: null },
  { href: "/keuangan/pencairan", icon: Wallet, label: "Pencairan", badge: 2 },
  { href: "/keuangan/jurnal", icon: BookOpen, label: "Jurnal Akuntansi", badge: null },
  { href: "/keuangan/coa", icon: Settings, label: "Chart of Accounts", badge: null },
  { href: "/keuangan/laporan", icon: BarChart3, label: "Laporan Keuangan", badge: null },
];

export default function SidebarKeuangan() {
  const pathname = usePathname();

  // Manajemen konfigurasi navigasi terpusat
  const menuItems = [
    {
      name: "Beranda Keuangan",
      href: "/keuangan",
      icon: LayoutDashboard,
      hasBadge: false,
    },
    {
      name: "Pencairan",
      href: "/keuangan/pencairan",
      icon: Wallet,
      hasBadge: true,
      badgeValue: 2,
    },
    {
      name: "Jurnal Akuntansi",
      href: "/keuangan/jurnal",
      icon: BookOpen,
      hasBadge: false,
    },
    {
      name: "Chart of Accounts",
      href: "/keuangan/chart-of-account", // Mengarah ke rute fungsional halaman Anda
      icon: Settings,
      hasBadge: false,
    },
    {
      name: "Laporan Keuangan",
      href: "/keuangan/laporan",
      icon: BarChart3,
      hasBadge: false,
    },
  ];

  return (
    <aside className="w-64 bg-[#f4f1eb] border-r border-stone-200 flex flex-col justify-between py-6 px-4 shrink-0 h-full">
      <div>
        {/* Logo Brand / Identitas Aplikasi */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 border border-stone-400 relative flex items-center justify-center shrink-0 bg-white/20">
            <div className="absolute w-full h-px bg-stone-400 rotate-45"></div>
            <div className="absolute w-full h-px bg-stone-400 -rotate-45"></div>
          </div>
          <span className="font-semibold text-stone-900 text-base tracking-tight">
            Digi Money Manager
          </span>
        </div>

        <div className="border-b border-stone-200/60 mx-2 mb-6"></div>

        <nav className="space-y-1.5">
          {navItems.map(({ href, icon: Icon, label, badge }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-3 rounded-xl text-sm transition ${
                  isActive
                    ? "py-3 font-semibold bg-white text-stone-900 shadow-sm border border-stone-200/30"
                    : "py-2.5 font-medium text-stone-800 hover:bg-stone-200/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon 
                    size={20} 
                    className={isActive ? "text-[#005c3e] stroke-[2.25]" : "text-stone-700 stroke-[1.75]"} 
                  />
                  <span>{item.name}</span>
                </div>
                
                {/* Badge angka notifikasi khusus jika properti bernilai true */}
                {item.hasBadge && (
                  <span className="bg-[#005c3e] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {item.badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
