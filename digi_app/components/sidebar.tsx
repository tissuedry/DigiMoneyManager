"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, Plus, History, FileCheck, Wallet, BookOpen, BarChart3, Settings, MessageSquare, TrendingUp, Users, FileText } from "lucide-react";

// Role type definition
export type UserRole = "Karyawan" | "Project Manager" | "Tim Keuangan" | "Direktur / Manajemen";

// Menu item configuration
interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  hasBadge?: boolean;
  badgeCount?: number;
}

interface SidebarProps {
  isSidebarOpen?: boolean;
  onClose?: () => void;
  userRole: UserRole;
}

const ROLE_MENUS: Record<UserRole, MenuItem[]> = {
  Karyawan: [
    { name: "Beranda", href: "/karyawan", icon: LayoutDashboard, hasBadge: false },
    { name: "Ajukan Reimbursement", href: "/karyawan/reimbursement", icon: Plus, hasBadge: false },
    { name: "Riwayat Pengajuan", href: "/karyawan/riwayat-pengajuan", icon: History, hasBadge: false },
  ],
  "Project Manager": [
    { name: "Beranda", href: "/pm", icon: LayoutDashboard, hasBadge: false },
    { name: "Antrian Approval", href: "/pm/approval", icon: FileCheck, hasBadge: true, badgeCount: 0 },
    { name: "Budget Proyek", href: "/pm/budget", icon: Wallet, hasBadge: false },
  ],
  "Tim Keuangan": [
    { name: "Beranda", href: "/keuangan", icon: LayoutDashboard, hasBadge: false },
    { name: "Pencairan", href: "/keuangan/pencairan", icon: Wallet, hasBadge: false },
    { name: "Budget Proyek", href: "/keuangan/budget", icon: BarChart3, hasBadge: false },
    { name: "Jurnal Akuntansi", href: "/keuangan/jurnal", icon: BookOpen, hasBadge: false },
    { name: "Chart of Accounts", href: "/keuangan/chart-of-account", icon: Settings, hasBadge: false },
  ],
  "Direktur / Manajemen": [
    { name: "Executive Dashboard", href: "/manager", icon: LayoutDashboard, hasBadge: false },
    { name: "Kelola Proyek", href: "/manager/proyek", icon: Wallet, hasBadge: false },
    { name: "Smart Chat", href: "/manager/smart-chat", icon: MessageSquare, hasBadge: false },
    { name: "Profitabilitas", href: "/manager/profitabilitas", icon: TrendingUp, hasBadge: false },
    { name: "Laporan", href: "/manager/laporan", icon: FileText, hasBadge: false },
    { name: "Registrasi Anggota", href: "/manager/anggota", icon: Users, hasBadge: false },
  ],
};

// Role-specific styling
const ROLE_STYLES: Record<UserRole, { bg: string; logoBg: string; logoText: string }> = {
  Karyawan: {
    bg: "bg-[#f5f4ef]",
    logoBg: "bg-white",
    logoText: "text-stone-800",
  },
  "Project Manager": {
    bg: "bg-[#f5f4ef]",
    logoBg: "bg-white",
    logoText: "text-stone-800",
  },
  "Tim Keuangan": {
    bg: "bg-[#f5f4ef]",
    logoBg: "bg-white",
    logoText: "text-stone-800",
  },
  "Direktur / Manajemen": {
    bg: "bg-[#f5f4ef]",
    logoBg: "bg-white",
    logoText: "text-stone-800",
  },
};

export default function Sidebar({ isSidebarOpen, onClose, userRole }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = ROLE_MENUS[userRole] || [];
  const styles = ROLE_STYLES[userRole];

  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (userRole === "Project Manager") {
      fetch("/api/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (data.dashboard && typeof data.dashboard.pendingApprovalsCount === "number") {
            setPendingCount(data.dashboard.pendingApprovalsCount);
          }
        })
        .catch((err) => console.error("Error fetching approvals count for sidebar:", err));
    }
  }, [userRole]);

  const getLinkClass = (href: string) => {
    const isActive = pathname === href;
    const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition";

    if (isActive) {
      return `${baseClasses} bg-white text-stone-900 font-bold shadow-sm`;
    }
    return `${baseClasses} text-stone-600 hover:bg-[#EAE8E0] hover:text-stone-900 font-medium`;
  };

  return (
    <>
      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 ${styles.bg} border-r border-stone-200 flex flex-col shrink-0 h-screen transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex lg:flex-col
      `}>
        {/* Logo and close button */}
        <div className={`h-20 flex items-center justify-between px-6 border-b border-stone-200/50 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="Digi Money Manager" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <p className="font-bold text-stone-800 text-[14px] leading-tight">Digi Money Manager</p>
              <p className="text-[10px] text-[#008f5d] font-bold">Sistem Keuangan Proyek</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-stone-200/50 rounded-lg text-stone-500 hover:text-stone-800 transition cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Menu Navigasi */}
        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            // Resolve dynamic badge display
            let displayBadge = item.hasBadge;
            let displayCount = item.badgeCount;

            if (userRole === "Project Manager" && item.name === "Antrian Approval") {
              if (pendingCount !== null) {
                displayCount = pendingCount;
                displayBadge = pendingCount > 0;
              } else {
                displayBadge = false; // hide until loaded
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={getLinkClass(item.href)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {displayBadge && displayCount !== undefined && displayCount > 0 && (
                  <span className="ml-auto bg-green-900 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                    {displayCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}