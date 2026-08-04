"use client";

import React, { useState } from "react";
import { ArrowLeft, Bell, Check, X, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { useApi } from "@/lib/use-api";

type NotificationItem = {
  id: string;
  userId: string;
  tipe: string;
  pesan: string;
  dibaca: boolean;
  timestamp: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
};

const PER_PAGE = 25;

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

function getTitle(item: NotificationItem) {
  const msg = item.pesan.toLowerCase();
  if (msg.includes("disetujui oleh pm") || msg.includes("disetujui oleh project manager")) {
    return "Reimbursement disetujui PM";
  }
  if (msg.includes("disetujui oleh keuangan") || msg.includes("disetujui oleh tim keuangan")) {
    return "Reimbursement disetujui Keuangan";
  }
  if (msg.includes("realisasi") && msg.includes("dicairkan")) {
    return "Realisasi dicairkan";
  }
  if (msg.includes("ditolak oleh pm") || msg.includes("ditolak oleh project manager")) {
    return "Reimbursement ditolak PM";
  }
  if (msg.includes("ditolak oleh keuangan") || msg.includes("ditolak oleh tim keuangan")) {
    return "Reimbursement ditolak Keuangan";
  }
  if (msg.includes("pos anggaran") && msg.includes("ditolak")) {
    return "Pengajuan Pos Anggaran ditolak";
  }
  if (msg.includes("dicairkan")) {
    return "Reimbursement dicairkan";
  }
  if (msg.includes("ditolak")) {
    return "Reimbursement ditolak";
  }
  return "Pemberitahuan Sistem";
}

export default function NotificationPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useApi<NotificationsResponse>("/api/notifications");
  const [page, setPage] = useState(1);

  const notifications = data?.notifications ?? [];
  const totalPages = Math.max(1, Math.ceil(notifications.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = notifications.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      <Header hideNotificationDropdown />

      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Semua Notifikasi</h1>
              {notifications.length > 0 && (
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  {notifications.length} notifikasi · {unreadCount} belum dibaca
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-4 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-stone-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 bg-stone-200 rounded" />
                  <div className="h-3 w-full bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <Bell size={40} className="mx-auto text-stone-300 mb-4" />
            <p className="text-sm font-bold text-stone-700 mb-1">Gagal memuat notifikasi</p>
            <p className="text-xs text-stone-400 mb-4">Periksa koneksi Anda dan coba lagi</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 transition shadow-sm"
            >
              <RefreshCw size={13} />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && notifications.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <Bell size={40} className="mx-auto text-stone-300 mb-4" />
            <p className="text-sm font-bold text-stone-700 mb-1">Belum ada notifikasi</p>
            <p className="text-xs text-stone-400">Notifikasi akan muncul di sini saat ada aktivitas baru</p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && notifications.length > 0 && (
          <>
            <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-sm">
              {pageItems.map((item) => {
                const isRejected = item.tipe === "rejected" || item.pesan.toLowerCase().includes("ditolak");
                return (
                  <div
                    key={item.id}
                    className={`flex gap-4 p-5 transition-colors ${
                      !item.dibaca
                        ? isRejected
                          ? "bg-[#fff5f5]"
                          : "bg-[#f5fbf8]"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                        isRejected
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-[#e2f1eb] text-[#117a5b] border-emerald-100"
                      }`}
                    >
                      {isRejected ? <X size={18} strokeWidth={2.5} /> : <Check size={18} strokeWidth={2.5} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-bold text-stone-900">{getTitle(item)}</p>
                        <span className="text-[11px] text-stone-400 shrink-0 font-medium">
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[12px] text-stone-600 leading-relaxed mt-1">{item.pesan}</p>
                    </div>

                    {!item.dibaca && (
                      <div className="self-center">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block shadow-sm border border-blue-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <ChevronLeft size={14} />
                  Sebelumnya
                </button>
                <span className="text-xs font-semibold text-stone-500 px-3">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Selanjutnya
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
