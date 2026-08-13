"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  X, LayoutDashboard, Plus, History, FileCheck, Wallet, 
  BookOpen, BarChart3, Settings, Users, FileText, 
  FolderKanban, Layers, Monitor
} from "lucide-react";
import { useApi } from "@/lib/use-api";

export type UserRole = "Karyawan" | "Project Manager" | "Tim Keuangan" | "Direktur / Manajemen" | "Superadmin";

interface MenuItem {
  name: string;
  href: string;
  icon?: React.ElementType; 
  hasBadge?: boolean;
  badgeCount?: number;
  isSection?: boolean;      
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
    { name: "Beranda PM", href: "/pm", icon: LayoutDashboard, hasBadge: false },
    { name: "Kelola Proyek", href: "/pm/proyek", icon: FolderKanban, hasBadge: false },
    { name: "Antrian Approval", href: "/pm/approval", icon: FileCheck, hasBadge: true, badgeCount: 0 },
  ],
  "Tim Keuangan": [
    { name: "Beranda", href: "/keuangan", icon: LayoutDashboard, hasBadge: false },
    { name: "Pencairan", href: "/keuangan/pencairan", icon: Wallet, hasBadge: false },
    { name: "Laporan Anggaran", href: "/keuangan/budget", icon: BarChart3, hasBadge: false },
    { name: "Riwayat Pencairan", href: "/keuangan/jurnal", icon: BookOpen, hasBadge: false },
    { name: "Chart of Accounts", href: "/keuangan/chart-of-account", icon: Settings, hasBadge: false },
  ],
  "Direktur / Manajemen": [
    { name: "Executive Dashboard", href: "/manager", icon: LayoutDashboard, hasBadge: false },
    { name: "Kelola Proyek", href: "/manager/proyek", icon: Wallet, hasBadge: false },
    { name: "Laporan", href: "/manager/laporan", icon: FileText, hasBadge: false },
  ],
  "Superadmin": [
    { name: "SUPER ADMIN", href: "", isSection: true },
    { name: "Beranda", href: "/superadmin", icon: LayoutDashboard, hasBadge: false },
    { name: "Master CoA", href: "/superadmin/master-coa", icon: Layers, hasBadge: false },
    { name: "Kelola Akun", href: "/superadmin/kelola-akun", icon: Users, hasBadge: false },
    
    { name: "DIREKTUR", href: "", isSection: true },
    { name: "Kelola Proyek", href: "/superadmin/proyek", icon: FolderKanban, hasBadge: false },
    { name: "Laporan", href: "/superadmin/laporan", icon: FileText, hasBadge: false },
    
    { name: "PROJECT MANAGER", href: "", isSection: true },
    { name: "Kelola Proyek", href: "/superadmin/detail-proyek", icon: FolderKanban, hasBadge: false },
    { name: "Antrian Approval", href: "/superadmin/approval", icon: Monitor, hasBadge: true, badgeCount: 0 },
    
    { name: "TIM KEUANGAN", href: "", isSection: true },
    { name: "Pencairan", href: "/superadmin/pencairan", icon: Wallet, hasBadge: true, badgeCount: 0 },
    { name: "Budget Proyek", href: "/superadmin/budget", icon: BarChart3, hasBadge: false },
    { name: "History Pencairan", href: "/superadmin/jurnal", icon: BookOpen, hasBadge: false },
    
    { name: "KARYAWAN", href: "", isSection: true },
    { name: "Ajukan Reimbursement", href: "/superadmin/reimbursement", icon: Plus, hasBadge: false },
    { name: "Riwayat Pengajuan", href: "/superadmin/riwayat", icon: History, hasBadge: false },
  ],
};

const ROLE_STYLES: Record<UserRole, { bg: string; logoBg: string; logoText: string }> = {
  Karyawan: { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" },
  "Project Manager": { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" },
  "Tim Keuangan": { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" },
  "Direktur / Manajemen": { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" },
  "Superadmin": { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" },
};

export default function Sidebar({ isSidebarOpen, onClose, userRole }: SidebarProps) {
  const pathname = usePathname();
  
  // 1. Normalisasi userRole (mencegah error jika token mengirimkan 'superadmin' huruf kecil atau undefined)
  const rawRole = typeof userRole === "string" ? userRole : "Karyawan";
  const safeRole = (rawRole.toLowerCase() === "superadmin" ? "Superadmin" : rawRole) as UserRole;

  // 2. Terapkan safeRole dan berikan fallback default (jaga-jaga jika string role tetap tidak dikenali)
  const menuItems = ROLE_MENUS[safeRole] || [];
  const styles = ROLE_STYLES[safeRole] || { bg: "bg-[#f5f4ef]", logoBg: "bg-white", logoText: "text-stone-800" };

  const { data: dashData } = useApi<any>(safeRole === "Project Manager" ? "/api/dashboard" : null);
  const pendingCount = dashData?.dashboard?.pendingApprovalsCount ?? null;

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

        <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto pb-20 custom-scrollbar">
          {menuItems.map((item, idx) => {
            if (item.isSection) {
              return (
                <div key={`section-${idx}`} className="px-3 pt-5 pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  {item.name}
                </div>
              );
            }

            const Icon = item.icon as React.ElementType;
            let displayBadge = item.hasBadge;
            let displayCount = item.badgeCount;

            if (safeRole === "Project Manager" && item.name === "Antrian Approval") {
              if (pendingCount !== null) {
                displayCount = pendingCount;
                displayBadge = pendingCount > 0;
              } else {
                displayBadge = false;
              }
            }

            return (
              <Link
                key={item.name + idx}
                href={item.href}
                onClick={onClose}
                className={getLinkClass(item.href)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {displayBadge && displayCount !== undefined && displayCount > 0 && (
                  <span className="ml-auto bg-[#117a5b] text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
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