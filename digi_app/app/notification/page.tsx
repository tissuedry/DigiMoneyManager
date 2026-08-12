"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCheck,
  CircleCheck,
  CircleX,
  Banknote,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { useApi, useMutate } from "@/lib/use-api";
import Toast from "@/components/toast";

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

type FilterTab = "all" | "unread";

type NotifType = "approved" | "rejected" | "disbursed" | "system";

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
  if (msg.includes("realisasi")) {
    if (msg.includes("dicairkan oleh tim keuangan")) {
      return "Realisasi Dicairkan"
    }
    return "Realisasi ditolak"
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
  if (msg.includes("ditolak oleh direktur") && msg.includes("pengajuan")) {
    return "Perubahan Anggaran ditolak Direktur"
  }
  if (msg.includes("dicairkan")) {
    return "Reimbursement dicairkan";
  }
  if (msg.includes("ditolak")) {
    return "Reimbursement ditolak";
  }
  return "Pemberitahuan Sistem";
}

function getType(item: NotificationItem): NotifType {
  const msg = item.pesan.toLowerCase();
  if (msg.includes("ditolak") || item.tipe === "rejected") return "rejected";
  if (msg.includes("dicairkan")) return "disbursed";
  if (msg.includes("disetujui")) return "approved";
  return "system";
}

const TYPE_STYLES: Record<NotifType, { icon: typeof Bell; bg: string; fg: string; border: string }> = {
  approved: { icon: CircleCheck, bg: "bg-emerald-50", fg: "text-emerald-700", border: "border-emerald-100" },
  rejected: { icon: CircleX, bg: "bg-red-50", fg: "text-red-600", border: "border-red-100" },
  disbursed: { icon: Banknote, bg: "bg-blue-50", fg: "text-blue-600", border: "border-blue-100" },
  system: { icon: Bell, bg: "bg-stone-100", fg: "text-stone-500", border: "border-stone-200" },
};

function getDayLabel(timestamp: string | Date): string {
  const now = new Date();
  const past = new Date(timestamp);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(past)) / 86400000);

  if (diffDays === 0) return "Hari Ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return "7 Hari Terakhir";
  return "Sebelumnya";
}

const DAY_ORDER = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "Sebelumnya"];

export default function NotificationPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useApi<NotificationsResponse>("/api/notifications");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [toastError, setToastError] = useState<string | null>(null);

  const notifications = useMemo(() => data?.notifications ?? [], [data]);
  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.dibaca) : notifications),
    [notifications, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const grouped = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    for (const item of pageItems) {
      const label = getDayLabel(item.timestamp);
      (groups[label] ??= []).push(item);
    }
    return DAY_ORDER.filter((label) => groups[label]).map((label) => ({ label, items: groups[label] }));
  }, [pageItems]);

  const markAll = useMutate("/api/notifications", "PUT", ["/api/notifications"]);
  const markOne = useMutate("/api/notifications", "PUT", ["/api/notifications"]);

  useEffect(() => {
    const err = markAll.error ?? markOne.error;
    if (err) setToastError(err.message);
  }, [markAll.error, markOne.error]);

  const handleMarkAll = () => {
    if (unreadCount === 0 || markAll.isPending) return;
    markAll.mutate({});
  };

  const handleMarkOne = (id: string) => {
    if (markOne.isPending) return;
    markOne.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      <Header hideNotificationDropdown />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-800 transition mb-3 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-stone-900">Semua Notifikasi</h1>
              {notifications.length > 0 && (
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  {notifications.length} notifikasi · {unreadCount} belum dibaca
                </p>
              )}
            </div>

            <button
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markAll.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-stone-600 shadow-sm hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {markAll.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCheck size={13} className="text-[#117a5b]" strokeWidth={2.5} />
              )}
              Tandai semua dibaca
            </button>
          </div>

          {/* Filter tabs */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 mt-5 bg-stone-100 p-1 rounded-xl w-fit">
              {(
                [
                  { key: "all", label: "Semua", count: notifications.length },
                  { key: "unread", label: "Belum dibaca", count: unreadCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setFilter(tab.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filter === tab.key
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      filter === tab.key ? "bg-stone-100 text-stone-500" : "bg-white/70 text-stone-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}
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
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 transition shadow-sm cursor-pointer"
            >
              <RefreshCw size={13} />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <Inbox size={40} className="mx-auto text-stone-300 mb-4" />
            <p className="text-sm font-bold text-stone-700 mb-1">
              {filter === "unread" ? "Tidak ada notifikasi belum dibaca" : "Belum ada notifikasi"}
            </p>
            <p className="text-xs text-stone-400">
              {filter === "unread"
                ? "Semua notifikasi sudah dibaca"
                : "Notifikasi akan muncul di sini saat ada aktivitas baru"}
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.label}>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2 px-1">
                    {group.label}
                  </h2>
                  <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-sm">
                    {group.items.map((item) => {
                      const t = getType(item);
                      const style = TYPE_STYLES[t];
                      const Icon = style.icon;
                      return (
                        <div
                          key={item.id}
                          className={`flex gap-4 p-5 transition-colors ${
                            !item.dibaca ? "bg-[#f7faf8]" : "bg-white hover:bg-stone-50/60"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${style.bg} ${style.fg} ${style.border}`}
                          >
                            <Icon size={18} strokeWidth={2.25} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <p className={`text-[13px] font-bold ${item.dibaca ? "text-stone-700" : "text-stone-900"}`}>
                                {getTitle(item)}
                              </p>
                              <span className="text-[11px] text-stone-400 shrink-0 font-medium pt-0.5">
                                {getRelativeTime(item.timestamp)}
                              </span>
                            </div>
                            <p
                              className={`text-[12px] leading-relaxed mt-1 ${
                                item.dibaca ? "text-stone-500" : "text-stone-600"
                              }`}
                            >
                              {item.pesan}
                            </p>
                          </div>

                          <div className="self-center flex flex-col items-center gap-2 shrink-0">
                            {!item.dibaca && (
                              <>
                                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full block shadow-sm border border-blue-200" />
                                <button
                                  onClick={() => handleMarkOne(item.id)}
                                  disabled={markOne.isPending}
                                  className="text-[10px] font-semibold text-[#117a5b] hover:text-emerald-800 disabled:opacity-40 transition cursor-pointer"
                                >
                                  Tandai dibaca
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
                >
                  Selanjutnya
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Toast
        open={!!toastError}
        variant="error"
        message={toastError || ""}
        onClose={() => setToastError(null)}
      />
    </div>
  );
}
