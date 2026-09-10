"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import ConfirmDialog from "@/components/confirm-dialog";
import Notification from "@/components/notification";

export type UserRole = "Karyawan" | "Project Manager" | "Tim Keuangan" | "Direktur / Manajemen" | "Superadmin";

interface HeaderProps {
  onOpenSidebar?: () => void;
  userRole?: UserRole;
  hideNotificationDropdown?: boolean;
}

type UserProfile = {
  nama: string;
  email: string;
  role: string;
  roles?: string[];
  divisi?: string | null;
  proyek?: { id: number; nama: string; status: string; nomorRegister?: string | null } | null;
  assignments?: Array<{ proyekId: number; nama: string; role: string; nomorRegister?: string | null }>;
};


function getInitials(name: string) {
  if (!name) return "AI";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const ROLE_AVATAR_STYLES: Record<UserRole, { bg: string; text: string }> = {
  Karyawan: { bg: "bg-[#c2e0d1]", text: "text-[#117a5b]" },
  "Project Manager": { bg: "bg-red-50", text: "text-red-700" },
  "Tim Keuangan": { bg: "bg-[#005c3e]", text: "text-white" },
  "Direktur / Manajemen": { bg: "bg-[#1e3a5f]", text: "text-white" },
  "Superadmin": { bg: "bg-[#f3e8ff]", text: "text-purple-800" },
};

export default memo(function Header({ onOpenSidebar, userRole = "Karyawan", hideNotificationDropdown = false }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const { data: profileData } = useApi<UserProfile & { user: UserProfile }>("/api/auth/me");

  const profile = profileData?.user ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Error logging out:", err);
      setIsLoggingOut(false);
    }
  };

  const activeRole = (profile?.role || userRole) as UserRole;
  const avatarStyles = ROLE_AVATAR_STYLES[activeRole] || ROLE_AVATAR_STYLES["Karyawan"];

  return (
    <header className={`h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-stone-200 bg-[#f9f8f4] shrink-0 sticky top-0 z-30 w-full`}>
      <div className="flex items-center gap-3">
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            className="lg:hidden text-stone-600 p-1.5 hover:bg-stone-200/50 rounded-xl transition cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        )}

        <div>
          <p className="text-[11px] text-stone-400 font-medium">Selamat datang,</p>
          <p className="font-bold text-stone-800 text-[15px] leading-tight">{profile?.nama || "Daisaq Hadya Albar"}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {!hideNotificationDropdown && <Notification role={profile?.role || userRole} />}

        <div ref={profileRef} className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-white border border-stone-200 py-1.5 px-3 rounded-xl shadow-sm cursor-pointer hover:bg-stone-50 transition"
          >
            <div className={`w-8 h-8 rounded-full ${avatarStyles.bg} ${avatarStyles.text} font-bold text-[13px] flex items-center justify-center shadow-inner`}>
              {getInitials(profile?.nama || "Daisaq Hadya")}
            </div>

            <div className="flex flex-col pr-2 select-none">
              <span className="text-[12px] font-bold text-stone-800 leading-tight">
                {profile?.nama || "Daisaq Hadya Albar"}
              </span>
              <span className="text-[10px] text-stone-500 max-w-44 truncate">
                {profile?.proyek
                  ? `${activeRole} · ${profile.proyek.nomorRegister ? `[${profile.proyek.nomorRegister}] ` : ""}${profile.proyek.nama}`
                  : activeRole}
              </span>
            </div>
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-stone-100 flex flex-col mb-1 select-none">
                <span className="text-[11px] font-bold text-stone-800 truncate">
                  {profile?.nama || "Daisaq Hadya Albar"}
                </span>
                <span className="text-[9px] text-stone-400 truncate mt-0.5">
                  {profile?.email || "admin@digimoney.com"}
                </span>
              </div>

              {profile?.assignments && profile.assignments.length > 0 &&
               (activeRole === "Karyawan" || activeRole === "Project Manager") && (
                <div className="border-b border-stone-100 py-1 mb-1">
                  <div className="px-4 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Proyek Aktif
                  </div>
                  <div className="px-4 py-1 text-[11px] text-stone-700 font-bold truncate max-w-45">
                    📂 {profile.proyek ? `${profile.proyek.nomorRegister ? `[${profile.proyek.nomorRegister}] ` : ""}${profile.proyek.nama}` : 'Belum memilih'}
                  </div>
                  <Link
                    href="/select-project"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-4 py-2 mt-1.5 text-left text-xs font-bold text-[#008f5d] hover:bg-emerald-50 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    🔄 Ganti Proyek
                  </Link>
                </div>
              )}

              {(!profile?.assignments || profile.assignments.length === 0) && profile?.roles && profile.roles.length > 1 && (
                <div className="border-b border-stone-100 py-1 mb-1">
                  <div className="px-4 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Pindah Dashboard
                  </div>
                  {profile.roles.includes("Tim Keuangan") && (
                    <Link
                      href="/keuangan"
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      Dashboard Keuangan
                    </Link>
                  )}
                  {profile.roles.includes("Direktur / Manajemen") && (
                    <Link
                      href="/manager"
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      Dashboard Direktur
                    </Link>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Keluar dari Akun"
        description="Apakah Anda yakin ingin keluar dari akun ini?"
        confirmLabel="Keluar"
        variant="danger"
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
});