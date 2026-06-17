"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Menu, LogOut, Check, ArrowRight, Loader2, X } from "lucide-react";
import Link from "next/link";

export type UserRole = "Karyawan" | "Project Manager" | "Tim Keuangan" | "Direktur / Manajemen";

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
  proyek?: { id: number; nama: string; status: string } | null;
  assignments?: Array<{ proyekId: number; nama: string; role: string }>;
};

type NotificationItem = {
  id: string;
  userId: string;
  tipe: string;
  pesan: string;
  dibaca: boolean;
  timestamp: string;
};

function getInitials(name: string) {
  if (!name) return "AI";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getRelativeTime(timestamp: string | Date) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} mnt lalu`;
  if (diffHours < 24) return `${diffHours} j lalu`;
  if (diffDays < 30) return `${diffDays} hri lalu`;
  return `${diffMonths} bln lalu`;
}

const ROLE_AVATAR_STYLES: Record<UserRole, { bg: string; text: string }> = {
  Karyawan: { bg: "bg-[#c2e0d1]", text: "text-[#117a5b]" },
  "Project Manager": { bg: "bg-red-50", text: "text-red-700" },
  "Tim Keuangan": { bg: "bg-[#005c3e]", text: "text-white" },
  "Direktur / Manajemen": { bg: "bg-[#1e3a5f]", text: "text-white" },
};

export default function Header({ onOpenSidebar, userRole = "Karyawan", hideNotificationDropdown = false }: HeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch profile & notifications
  useEffect(() => {
    // 1. Get user profile
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        window.location.href = "/login";
        throw new Error("Failed to fetch profile");
      })
      .then((data) => {
        if (data.user) setProfile(data.user);
      })
      .catch((err) => console.error("Error fetching profile:", err));

    // 2. Fetch notifications
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch notifications");
      })
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch((err) => console.error("Error fetching notifications:", err));
  };

  useEffect(() => {
    // Fetch profile
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch profile");
      })
      .then((data) => {
        if (data.user) setProfile(data.user);
      })
      .catch((err) => console.error("Error fetching profile:", err));

    // Fetch notifications
    if (!hideNotificationDropdown) {
      fetchNotifications();
    }
  }, [hideNotificationDropdown]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    if (isNotificationsOpen || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen, isProfileOpen]);

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  // Mark all as read
  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, dibaca: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Mark specific notification as read
  const handleMarkOneRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const activeRole = (profile?.role || userRole) as UserRole;
  const avatarStyles = ROLE_AVATAR_STYLES[activeRole] || ROLE_AVATAR_STYLES["Karyawan"];

  return (
    <header className={`h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 border-b border-stone-200 bg-[#f9f8f4] shrink-0 sticky top-0 z-30 w-full`}>
      {/* Left side: Mobile menu + Logo */}
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
          <p className="font-bold text-stone-800 text-[15px] leading-tight">{profile?.nama || ""}</p>
        </div>

      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell & Dropdown */}
        {!hideNotificationDropdown && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 bg-white border border-stone-200 rounded-xl shadow-sm hover:bg-stone-50 transition cursor-pointer"
            >
              <Bell size={18} className="text-stone-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 bg-[#a63737] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#f9f8f4]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-90 sm:w-105 bg-[#fdfcf9] border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-3 duration-250">
                <div className="px-5 py-4 border-b border-stone-200/80 bg-[#f5f4ef] flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-stone-900 leading-tight">Notifikasi</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-medium">
                      {unreadCount} belum dibaca · {profile?.role || userRole}
                    </p>
                  </div>
                  <button
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || isMarkingAll}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border border-stone-200/80 rounded-full text-[11px] font-bold bg-white text-stone-700 hover:bg-stone-50 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isMarkingAll ? (
                      <Loader2 size={12} className="animate-spin text-stone-500" />
                    ) : (
                      <Check size={12} className="text-stone-600" />
                    )}
                    Tandai semua dibaca
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-stone-100 max-h-[350px]">
                  {notifications.length > 0 ? (
                    notifications.map((item) => {
                      const isRejected = item.tipe === "rejected" || item.pesan.toLowerCase().includes("ditolak");
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!item.dibaca) handleMarkOneRead(item.id);
                          }}
                          className={`flex gap-3.5 p-4 transition-all duration-200 cursor-pointer ${
                            !item.dibaca 
                              ? (isRejected ? "bg-[#fff5f5] hover:bg-[#fee2e2]" : "bg-[#f5fbf8] hover:bg-[#eaf5ef]") 
                              : "bg-transparent hover:bg-stone-50"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                            isRejected 
                              ? "bg-red-50 text-red-700 border-red-100" 
                              : "bg-[#e2f1eb] text-[#117a5b] border-emerald-100"
                          }`}>
                            {isRejected ? (
                              <X size={16} strokeWidth={2.5} />
                            ) : (
                              <Check size={16} strokeWidth={2.5} />
                            )}
                          </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-bold text-stone-900 truncate">
                              {(() => {
                                const msg = item.pesan.toLowerCase();
                                if (msg.includes("disetujui oleh pm") || msg.includes("disetujui oleh project manager")) {
                                  return "Reimbursement disetujui PM";
                                }
                                if (msg.includes("disetujui oleh keuangan") || msg.includes("disetujui oleh tim keuangan")) {
                                  return "Reimbursement disetujui Keuangan";
                                }
                                if (msg.includes("ditolak oleh pm") || msg.includes("ditolak oleh project manager")) {
                                  return "Reimbursement ditolak PM";
                                }
                                if (msg.includes("ditolak oleh keuangan") || msg.includes("ditolak oleh tim keuangan")) {
                                  return "Reimbursement ditolak Keuangan";
                                }
                                if (msg.includes("dicairkan")) {
                                  return "Reimbursement Dicairkan";
                                }
                                if (msg.includes("ditolak")) {
                                  return "Reimbursement Ditolak";
                                }
                                return "Pemberitahuan Sistem";
                              })()}
                            </p>
                            <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                              {getRelativeTime(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed mt-1 font-medium break-words">
                            {item.pesan}
                          </p>
                        </div>

                        {!item.dibaca && (
                          <div className="self-center pr-1">
                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block shadow-sm border border-blue-200" />
                          </div>
                        )}
                      </div>
                    );
                  })
                  ) : (
                    <div className="p-8 text-center text-stone-400 text-[12px] font-medium">
                      Tidak ada notifikasi baru.
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200/80 bg-white">
                  <Link
                    href={userRole === "Karyawan" ? "/karyawan/riwayat-pengajuan" : "#"}
                    onClick={() => setIsNotificationsOpen(false)}
                    className="w-full py-3.5 flex items-center justify-center gap-2 text-stone-800 hover:text-stone-950 font-bold text-[12px] transition hover:bg-stone-50 cursor-pointer"
                  >
                    Lihat semua aktivitas <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simple bell for roles without dropdown */}
        {hideNotificationDropdown && (
          <button className="relative p-1 text-stone-600 hover:text-stone-900 transition cursor-pointer">
            <Bell size={20} className="stroke-2" />
          </button>
        )}

        {/* Profile & Dropdown */}
        <div ref={profileRef} className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-white border border-stone-200 py-1.5 px-3 rounded-xl shadow-sm cursor-pointer hover:bg-stone-50 transition"
          >
            <div className={`w-8 h-8 rounded-full ${avatarStyles.bg} ${avatarStyles.text} font-bold text-[13px] flex items-center justify-center shadow-inner`}>
              {getInitials(profile?.nama || "")}
            </div>

            <div className="flex flex-col pr-2 select-none">
              <span className="text-[12px] font-bold text-stone-800 leading-tight">
                {profile?.nama || ""}
              </span>
              <span className="text-[10px] text-stone-500 max-w-[150px] truncate">
                {profile?.proyek ? `${activeRole} · ${profile.proyek.nama}` : activeRole}
              </span>
            </div>
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-stone-100 flex flex-col mb-1 select-none">
                <span className="text-[11px] font-bold text-stone-800 truncate">
                  {profile?.nama || ""}
                </span>
                <span className="text-[9px] text-stone-400 truncate mt-0.5">
                  {profile?.email || ""}
                </span>
              </div>

              {/* Switch Project Option for members */}
              {profile?.assignments && profile.assignments.length > 0 && (
                <div className="border-b border-stone-100 py-1 mb-1">
                  <div className="px-4 py-1 text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Proyek Aktif
                  </div>
                  <div className="px-4 py-1 text-[11px] text-stone-700 font-bold truncate max-w-[180px]">
                    📂 {profile.proyek?.nama || 'Belum memilih'}
                  </div>
                  <Link
                    href="/select-project"
                    className="w-full px-4 py-2 mt-1.5 text-left text-xs font-bold text-[#008f5d] hover:bg-emerald-50 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    🔄 Ganti Proyek
                  </Link>
                </div>
              )}

              {/* Dashboard Switcher for non-project staff (Admins/Finance) */}
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
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}