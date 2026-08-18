"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  Info,
  CircleCheck,
  CircleX,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { useMutate } from "@/lib/use-api";
import { useInfiniteQuery } from "@tanstack/react-query";

type NotificationItem = {
  id: string;
  userId: string;
  tipe: string;
  pesan: string;
  dibaca: boolean;
  timestamp: string;
};

type FilterTab = "all" | "unread";

type NotificationPage = {
  notifications: NotificationItem[];
  nextCursor: number | null;
  totalCount: number;
  unreadCount: number;
};

type NotifType = "alert" | "approved" | "rejected" | "disbursed" | "pending" | "system";

function getRelativeTime(timestamp: string | Date) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return `${diffMonths} bulan lalu`;
}

function getTitle(item: NotificationItem) {
  const msg = item.pesan.toLowerCase();
  if (item.tipe === "alert" || msg.includes("peringatan") || msg.includes("mencapai batas")) {
    return "Peringatan Anggaran";
  }
  if (msg.includes("disetujui oleh pm") || msg.includes("disetujui oleh project manager")) {
    return "Reimbursement disetujui PM";
  }
  if (msg.includes("disetujui oleh keuangan") || msg.includes("disetujui oleh tim keuangan")) {
    return "Reimbursement disetujui Keuangan";
  }
  if (msg.includes("realisasi anggaran")) {
    if (msg.includes("dicairkan oleh tim keuangan")) {
      return "Realisasi dicairkan"
    }
    return "Realisasi ditolak"
  }
  if (msg.includes("ditolak oleh pm") || msg.includes("ditolak oleh project manager")) {
    return "Reimbursement ditolak PM";
  }
  if (msg.includes("ditolak oleh keuangan") || msg.includes("ditolak oleh tim keuangan")) {
    return "Reimbursement ditolak Keuangan";
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
  if (item.tipe === "alert" || msg.includes("peringatan") || msg.includes("mencapai batas")) return "alert";
  if (item.tipe === "approval_request" || item.tipe === "PENGAJUAN_ANGGARAN" || msg.includes("menunggu") || msg.includes("perlu direview") || msg.includes("perlu review")) return "pending";
  if (item.tipe === "rejected" || item.tipe === "PENGAJUAN_DITOLAK" || msg.includes("ditolak")) return "rejected";
  if (item.tipe === "disbursed" || msg.includes("dicairkan")) return "disbursed";
  if (item.tipe === "status_update" || item.tipe === "PENGAJUAN_DISETUJUI" || msg.includes("disetujui")) return "approved";
  return "system";
}

const TYPE_STYLES: Record<NotifType, { icon: typeof Bell; bg: string; fg: string; border: string }> = {
  alert: { icon: AlertTriangle, bg: "bg-amber-50", fg: "text-amber-600", border: "border-amber-100" },
  approved: { icon: CircleCheck, bg: "bg-emerald-50", fg: "text-emerald-700", border: "border-emerald-100" },
  rejected: { icon: CircleX, bg: "bg-red-50", fg: "text-red-600", border: "border-red-100" },
  disbursed: { icon: Banknote, bg: "bg-blue-50", fg: "text-blue-600", border: "border-blue-100" },
  pending: { icon: Info, bg: "bg-stone-100", fg: "text-stone-500", border: "border-stone-200" },
  system: { icon: Bell, bg: "bg-stone-100", fg: "text-stone-500", border: "border-stone-200" },
};

export default function Notification({ role }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("unread");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async ({ pageParam = 0 }: { pageParam?: number | null }): Promise<NotificationPage> => {
    const url = "/api/notifications" + (pageParam ? `?cursor=${pageParam}` : "");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Gagal mengambil data');
    }
    return res.json();
  }

  const {
    data: notifData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['/api/notifications'],
    queryFn: fetchNotifications,
    initialPageParam: 0,
    getNextPageParam: (lastPage: NotificationPage) => lastPage.nextCursor,
  })

  const notifications = notifData?.pages.flatMap((page) => page.notifications) ?? [];
  const totalCount = notifData?.pages[0]?.totalCount ?? notifications.length;
  const unreadCount = notifData?.pages[0]?.unreadCount ?? notifications.filter((n) => !n.dibaca).length;

  const filtered = filter === "unread" ? notifications.filter((n) => !n.dibaca) : notifications

  const markAllRead = useMutate("/api/notifications", "PUT", ["/api/notifications"]);
  const markOneRead = useMutate("/api/notifications", "PUT", ["/api/notifications"]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!isOpen || !root) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!root || !hasNextPage || isFetchingNextPage) return;
        if (root.scrollTop + root.clientHeight >= root.scrollHeight - 80) {
          fetchNextPage();
        }
      });
    }
    root.addEventListener("scroll", onScroll);
    return () => root.removeEventListener("scroll", onScroll);
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return;
    markAllRead.mutate({});
  };

  const handleMarkOneRead = (id: string) => {
    markOneRead.mutate({ id });
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi"
        className="relative p-2.5 bg-white border border-stone-200 rounded-xl shadow-sm transition cursor-pointer
          hover:bg-stone-50"
      >
        <Bell size={18} className="text-stone-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 bg-[#a63737] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#f9f8f4] shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-3 w-90 sm:w-105 bg-[#fdfcf9] border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-125 animate-in fade-in slide-in-from-top-3 duration-250">
          <div className="px-5 py-4 border-b border-stone-200/80 bg-[#f9f8f4]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-stone-200/80 flex items-center justify-center shadow-sm">
                  <Bell size={15} className="text-[#117a5b]" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-stone-900 leading-tight">Notifikasi</h4>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">{role}</p>
                </div>
              </div>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markAllRead.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 border border-stone-200/80 rounded-full text-[11px] font-bold bg-white text-stone-700 hover:bg-stone-50 transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {markAllRead.isPending ? (
                  <Loader2 size={12} className="animate-spin text-stone-500" />
                ) : (
                  <CheckCheck size={12} className="text-[#117a5b]" strokeWidth={2.5} />
                )}
                Tandai semua dibaca
              </button>
            </div>

            <div className="flex items-center mt-3 gap-1 bg-stone-100 rounded-xl w-fit">
              {(
                [
                  { key: "all", label: "Semua", count: totalCount },
                  { key: "unread", label: "Belum dibaca", count: unreadCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto divide-y divide-stone-100 max-h-87.5 scrollbar-gutter-stable">
            {isFetching && !notifications.length ? (
              <div className="space-y-2 p-4" aria-hidden>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3.5 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-stone-200 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-3/5 bg-stone-200 rounded" />
                      <div className="h-3 w-full bg-stone-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((item: NotificationItem) => {
                const t = getType(item);
                const style = TYPE_STYLES[t];
                const Icon = style.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.dibaca) handleMarkOneRead(item.id);
                    }}
                    className={`flex gap-3.5 p-4 transition-colors duration-200 cursor-pointer ${
                      !item.dibaca ? "bg-[#f7faf8] hover:bg-[#eef6f1]" : "bg-transparent hover:bg-stone-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${style.bg} ${style.fg} ${style.border}`}>
                      <Icon size={16} strokeWidth={2.25} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[12px] font-bold truncate ${item.dibaca ? "text-stone-600" : "text-stone-900"}`}>
                          {getTitle(item)}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                          {getRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed mt-1 font-medium wrap-break-word">
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
                <Bell size={32} className="mx-auto text-stone-300 mb-3" strokeWidth={1.5} />
                Tidak ada notifikasi {filter === "unread" ? "belum dibaca" : ""}.
              </div>
            )}

            {isFetchingNextPage && (
              <div className="space-y-2 p-4" aria-hidden>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3.5 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-stone-200 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-3/5 bg-stone-200 rounded" />
                      <div className="h-3 w-full bg-stone-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
