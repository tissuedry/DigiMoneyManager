"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

// Define the database-compatible type representing a row fetched via Prisma ORM
// isRead represents unread/read state, createdAt is the DateTime field, and amount is numeric
export type NotificationDb = {
  id: string;
  title: string;
  code: string;
  description: string;
  amount: number;
  actor: string;
  createdAt: Date | string;
  isRead: boolean;
  type: "pm_approved" | "disbursed" | "finance_approved" | "rejected" | string;
};

interface NotificationCardProps {
  notifications?: NotificationDb[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  limit?: number;
  showFooter?: boolean;
}

// Helper to format numeric amount to Indonesian Rupiah currency format
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace("IDR", "Rp").trim();
};

// Helper to format a database timestamp to relative Indonesian time strings
const getRelativeTime = (dateInput: Date | string): string => {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMins < 1) return "baru saja";
  if (diffInMins < 60) return `${diffInMins} mnt lalu`;
  if (diffInHours < 24) return `${diffInHours} j lalu`;
  if (diffInDays < 30) return `${diffInDays} hri lalu`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} bln lalu`;
};

export default function NotificationCard({
  notifications: externalNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  limit = 4,
  showFooter = true,
}: NotificationCardProps) {
  
  // Default mock data in database format (used if no external notifications are passed)
  const [localNotifications, setLocalNotifications] = useState<NotificationDb[]>([
    {
      id: "1",
      title: "Reimbursement disetujui PM",
      code: "RB-2026-004",
      description: "Renovasi Kantor Cabang Bandung sebesar Rp 150.000 telah disetujui project manager.",
      amount: 150000,
      actor: "project manager",
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      isRead: false,
      type: "pm_approved",
    },
    {
      id: "2",
      title: "Reimbursement Dicairkan",
      code: "RB-2026-004",
      description: "Pembangunan Gudang Fase 2 sebesar Rp450.000 telah dicairkan.",
      amount: 450000,
      actor: "",
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      isRead: false,
      type: "disbursed",
    },
    {
      id: "3",
      title: "Reimbursement disetujui Keuangan",
      code: "RB-2026-004",
      description: "Pembangunan Gudang Fase 2 sebesar Rp450.000 telah disetujui keuangan.",
      amount: 450000,
      actor: "keuangan",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: false,
      type: "finance_approved",
    },
    {
      id: "4",
      title: "Reimbursement disetujui PM",
      code: "RB-2026-004",
      description: "Pembangunan Gudang Fase 2 sebesar Rp450.000 telah disetujui project manager.",
      amount: 450000,
      actor: "project manager",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      isRead: true,
      type: "pm_approved",
    },
  ]);

  // Determine whether to use external (ORM) data or internal state
  const isControlled = externalNotifications !== undefined;
  const currentNotifications = isControlled ? externalNotifications! : localNotifications;

  // Unread count: items where isRead is false
  const unreadCount = currentNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    if (isControlled) {
      if (onMarkAllAsRead) onMarkAllAsRead();
    } else {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (isControlled) {
      if (onMarkAsRead) onMarkAsRead(id);
    } else {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "rejected":
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-[#e2f1eb] flex items-center justify-center text-[#117a5b] shrink-0">
            <Check size={16} strokeWidth={3} />
          </div>
        );
    }
  };

  const displayNotifications = currentNotifications.slice(0, limit);

  return (
    <div className="w-full flex flex-col bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-[#f5f4ef] px-6 py-5 flex items-center justify-between border-b border-stone-200/80">
        <div>
          <h2 className="text-[16px] font-bold text-stone-900 leading-tight">Notifikasi</h2>
          <p className="text-[11px] text-stone-400 mt-1 font-medium">
            {unreadCount} belum dibaca <span className="text-stone-300 mx-1">•</span> Karyawan
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200/80 rounded-xl text-[11px] font-semibold text-stone-500 shadow-sm transition hover:bg-stone-50/80 active:scale-95 ${
            unreadCount === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <Check size={12} className="text-[#117a5b]" strokeWidth={3} />
          <span>Tandai semua dibaca</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-stone-100">
        {displayNotifications.map((item) => (
          <div
            key={item.id}
            onClick={() => handleMarkAsRead(item.id)}
            className={`flex gap-4 p-5 items-start transition cursor-pointer hover:bg-stone-50/50 ${
              !item.isRead ? "bg-[#f4f8fc]" : "bg-[#f5f4ef]/30"
            }`}
          >
            {getIcon(item.type)}

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[13px] font-bold text-stone-900 truncate leading-snug">
                  {item.title}
                </h3>
                <span className="text-[11px] text-stone-400 font-medium shrink-0">
                  {getRelativeTime(item.createdAt)}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed mt-0.5 pr-2">
                <span className="font-bold text-stone-600">{item.code}</span> · {item.description.replace(item.code + " · ", "").replace(item.code + " ", "")}
              </p>
            </div>

            {/* Unread Blue Dot Indicator */}
            {!item.isRead && (
              <div className="flex items-center self-center shrink-0 ml-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0277bd] shadow-sm"></span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="bg-white border-t border-stone-100 py-4 px-6 flex justify-center">
          <Link
            href="/karyawan/notification"
            className="group flex items-center justify-center gap-2 text-[13px] font-bold text-stone-800 hover:text-stone-950 transition duration-200"
          >
            <span>Lihat semua aktivitas</span>
            <ArrowRight
              size={14}
              className="text-stone-800 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
