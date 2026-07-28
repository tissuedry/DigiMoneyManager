"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Download, X, Check, Filter, ZoomIn
} from "lucide-react";

import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { useApi, useInvalidate } from '@/lib/use-api';

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function formatTanggalWaktu(isoStr: string | null | undefined) {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) {
      return `${formatTanggal(isoStr)}, 07:00`;
    }
    const day = d.getDate();
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const month = bulan[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const timeDisplay = (hours === '00' && mins === '00') ? '07:00' : `${hours}:${mins}`;
    return `${day} ${month} ${year}, ${timeDisplay}`;
  } catch {
    return isoStr;
  }
}

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];
const getAvatarColor = (initials: string) => AVATAR_COLORS[(initials || 'AI').charCodeAt(0) % AVATAR_COLORS.length];

const StepIcon = ({ state, number }: { state: "done" | "active" | "pending" | "rejected"; number: number }) => {
  if (state === "done")
    return (
      <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center shrink-0">
        <Check size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "rejected")
    return (
      <div className="w-7 h-7 rounded-full bg-[#be123c] flex items-center justify-center shrink-0">
        <X size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "active")
    return (
      <div className="w-7 h-7 rounded-full bg-[#0277bd] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-white">{number}</span>
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center shrink-0">
      <span className="text-[11px] font-semibold text-stone-400">{number}</span>
    </div>
  );
};

function PencairanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const idParam = searchParams.get("id");
  const selectParam = searchParams.get("select");

  const [activeTab, setActiveTab] = useState<'diteruskan' | 'selesai'>('diteruskan');
  const [selectedId, setSelectedId] = useState<string | null>(idParam);
  const [isAllSelected, setIsAllSelected] = useState(selectParam === 'all');
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoomAndPan = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Lock body scroll when zoom modal is open
  useEffect(() => {
    if (zoomImageUrl) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [zoomImageUrl]);

  const handleOpenZoom = (url: string) => {
    setZoomImageUrl(url);
    resetZoomAndPan();
  };

  const handleSelect = (id: string | null, all = false) => {
    setIsAllSelected(all);
    setSelectedId(id);
    if (all) {
      router.replace(`${pathname}?select=all`, { scroll: false });
    } else if (id) {
      router.replace(`${pathname}?id=${id}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  };

  const [debitAccount, setDebitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const invalidate = useInvalidate();

  const { data: rData, isLoading } = useApi<any>("/api/reimbursements");
  const { data: cData } = useApi<any>("/api/coa");
  const reimbursements = rData?.reimbursements ?? [];
  const coaList = cData?.coa ?? [];

  // Filter list based on active tab
  const filteredList = reimbursements.filter((item: any) => {
    const matchesTab = activeTab === 'diteruskan'
      ? item.status === 'APPROVED_BY_PM'
      : (item.status === 'APPROVED' || item.status === 'REJECTED');

    const matchesSearch = searchQuery
      ? (item.user?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.proyek?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.id).toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesTab && matchesSearch;
  });

  // Infinite scroll: render 10 items at a time
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Count items for each tab
  const countDiteruskan = reimbursements.filter((item: any) => item.status === 'APPROVED_BY_PM').length;
  const countSelesai = reimbursements.filter((item: any) => item.status === 'APPROVED' || item.status === 'REJECTED').length;

  // Reset to the first page whenever active tab or search query changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery]);

  const visibleList = filteredList.slice(0, visibleCount);
  const pendingCount = Math.min(PAGE_SIZE, filteredList.length - visibleCount);

  // Infinite scroll handler
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (isLoadingMoreRef.current) return;
      if (visibleCount >= filteredList.length) return;
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 150) return;

      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredList.length));
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
      }, 500);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [filteredList.length, visibleCount]);

  // Selected item
  const selectedItem = filteredList.find((item: any) => String(item.id) === String(selectedId)) || filteredList[0] || null;

  useEffect(() => {
    if (selectedItem && String(selectedItem.id) !== String(selectedId)) {
      setSelectedId(String(selectedItem.id));
    }
  }, [filteredList, selectedItem, selectedId]);

  // Set default debit/credit accounts based on posAnggaran
  useEffect(() => {
    if (selectedItem && selectedItem.status === 'APPROVED_BY_PM') {
      setCreditAccount("10000");

      const posName = selectedItem.posAnggaran?.deskripsi?.toLowerCase() || "";
      if (posName.includes("perlengkapan") || posName.includes("atk")) {
        setDebitAccount("50001");
      } else if (posName.includes("bahan") || posName.includes("sipil") || posName.includes("bangunan")) {
        setDebitAccount("50002");
      } else if (posName.includes("transportasi") || posName.includes("logistik")) {
        setDebitAccount("50003");
      } else {
        setDebitAccount("");
      }
      setCatatan("");
    }
  }, [selectedId, selectedItem]);

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedItem) return;

    if (action === 'APPROVE') {
      if (!debitAccount || !creditAccount) {
        alert("Harap pilih Akun Debit dan Akun Kredit terlebih dahulu.");
        return;
      }
      if (!confirm("Apakah Anda yakin ingin mencairkan pengajuan ini dan men-generate jurnal?")) {
        return;
      }
    } else {
      if (!confirm("Apakah Anda yakin ingin menolak pengajuan ini?")) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/reimbursements/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan,
          noAkunDebit: debitAccount,
          noAkunKredit: creditAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'APPROVE' ? "Pengajuan berhasil dicairkan dan jurnal akuntansi telah di-generate!" : "Pengajuan berhasil ditolak.");
        invalidate("/api/reimbursements", "/api/dashboard", "/api/notifications");
      } else {
        alert("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses pengajuan.");
    }
  };

  const pmApproval = selectedItem?.approvals?.find((a: any) => a.level === 'PM' || a.approver?.role === 'Project Manager');
  const financeApproval = selectedItem?.approvals?.find((a: any) => a.level === 'KEUANGAN' || a.approver?.role === 'Tim Keuangan');

  // Approval timeline steps matching Figma exact layout
  const approvalSteps = selectedItem ? [
    {
      label: "Pengajuan dikirim",
      sublabel: `${selectedItem.user?.nama || 'Karyawan'} • ${formatTanggalWaktu(selectedItem.createdAt || selectedItem.ocrData?.tanggal)}`,
      state: "done" as const
    },
    {
      label: "Validasi Project Manager",
      sublabel: pmApproval
        ? `${pmApproval.approver?.nama || 'Project Manager'} • ${formatTanggalWaktu(pmApproval.timestamp)}`
        : (selectedItem.status === 'SUBMITTED' ? "Menunggu" : "Menunggu • –"),
      state: pmApproval
        ? (pmApproval.status === 'REJECTED' ? "rejected" as const : "done" as const)
        : (selectedItem.status === 'SUBMITTED' ? "active" as const : "pending" as const)
    },
    {
      label: "Verifikasi Tim Keuangan",
      sublabel: financeApproval
        ? `${financeApproval.approver?.nama || 'Tim Keuangan'} • ${formatTanggalWaktu(financeApproval.timestamp)}`
        : (selectedItem.status === 'APPROVED_BY_PM' ? "Menunggu • -" : "Menunggu • –"),
      state: financeApproval
        ? (financeApproval.status === 'REJECTED' ? "rejected" as const : "done" as const)
        : (selectedItem.status === 'APPROVED_BY_PM' ? "active" as const : "pending" as const)
    },
    {
      label: "Dicairkan",
      sublabel: selectedItem.status === 'APPROVED'
        ? `Jurnal otomatis • ${financeApproval ? formatTanggalWaktu(financeApproval.timestamp) : ''}`
        : "Jurnal otomatis • –",
      state: selectedItem.status === 'APPROVED' ? "done" as const : "pending" as const
    }
  ] : [];

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4] overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Tim Keuangan" />

        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">

          {/* Header Title & Subtitle */}
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Pencairan</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Pengajuan yang telah divalidasi PM dan siap dicairkan. Jurnal Debit-Kredit akan ter-generate otomatis.
            </p>

            {/* Filter & Tab Switcher Bar */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
                <button
                  onClick={() => { setActiveTab('diteruskan'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'diteruskan'
                    ? "bg-white text-stone-900 font-semibold shadow-sm"
                    : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                    }`}
                >
                  Diteruskan
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'diteruskan' ? "bg-stone-100 text-stone-600" : "bg-stone-200/70 text-stone-400"}`}>
                    {countDiteruskan}
                  </span>
                </button>
                <button
                  onClick={() => { setActiveTab('selesai'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'selesai'
                    ? "bg-white text-stone-900 font-semibold shadow-sm"
                    : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                    }`}
                >
                  Selesai
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'selesai' ? "bg-stone-100 text-stone-600" : "bg-stone-200/70 text-stone-400"}`}>
                    {countSelesai}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama pengaju atau proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-full outline-none focus:border-stone-400 transition w-48 sm:w-64 text-stone-800 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                >
                  <Filter size={14} className="text-stone-500" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* List and Detail Split Layout */}
          <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">

            {/* LEFT COLUMN: ITEM LIST */}
            <div ref={listRef} className="w-full lg:w-[400px] flex flex-col gap-2 shrink-0 lg:overflow-y-auto pb-4 pr-1 custom-scrollbar">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white border border-stone-200 rounded-2xl px-4 py-3.5 flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="h-3 w-32 rounded bg-stone-200 animate-pulse" />
                          <div className="h-2.5 w-24 rounded bg-stone-200/60 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="h-3 w-16 rounded bg-stone-200 animate-pulse" />
                        <div className="h-4 w-20 rounded-full bg-stone-200/60 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredList.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-400 text-[13px]">
                  Tidak ada pengajuan pencairan.
                </div>
              ) : (
                <>
                  {visibleList.map((item: any) => {
                    const initials = item.user?.nama ? item.user.nama.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'AI';
                    const active = isAllSelected || String(selectedItem?.id) === String(item.id);
                    const formattedNominal = Number(item.nominal).toLocaleString('id-ID');
                    const itemCode = `RB-${String(item.id).padStart(4, '0')}`;
                    const vendorTitle = item.ocrData?.merchant || item.posAnggaran?.deskripsi || 'Pengajuan Reimbursement';
                    const projectTitle = item.proyek?.nama || 'Proyek';

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(String(item.id))}
                        className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150 cursor-pointer ${active
                          ? "bg-[#e8f4ef] border-[#a8d5be] shadow-sm scale-[0.99]"
                          : "bg-white border-stone-200 hover:bg-stone-50"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${getAvatarColor(initials)}`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className="group relative min-w-0">
                                <p className="text-[12px] font-bold text-stone-800 truncate">
                                  {vendorTitle} · {projectTitle}
                                </p>
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-800 shadow-lg group-hover:block">
                                  {vendorTitle} · {projectTitle}
                                </div>
                              </div>
                              <p className="text-[12px] font-bold text-stone-800 flex-shrink-0">
                                <span className="text-stone-400 text-[11px]">Rp </span>{formattedNominal}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="group relative min-w-0">
                                <p className="text-[11px] text-stone-400 truncate">
                                  {item.user?.nama || 'Karyawan'} <span className="font-normal text-stone-400 font-mono">· {itemCode}</span>
                                </p>
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-800 shadow-lg group-hover:block">
                                  {item.user?.nama || 'Karyawan'} · {itemCode}
                                </div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${item.status === 'APPROVED_BY_PM' ? 'bg-[#e1f5fe] text-[#0277bd]' :
                                item.status === 'APPROVED' ? 'bg-[#e2f1eb] text-[#117a5b]' :
                                  'bg-[#fee2e2] text-[#be123c]'
                                }`}>
                                {item.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                                  item.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {isLoadingMore &&
                    Array.from({ length: pendingCount }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="bg-white border border-stone-200 rounded-2xl px-4 py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse shrink-0" />
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="h-3 w-32 rounded bg-stone-200 animate-pulse" />
                            <div className="h-2.5 w-24 rounded bg-stone-200/60 animate-pulse" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <div className="h-3 w-16 rounded bg-stone-200 animate-pulse" />
                          <div className="h-4 w-20 rounded-full bg-stone-200/60 animate-pulse" />
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* RIGHT COLUMN: DETAIL VIEW */}
            <div className="flex-1 flex flex-col bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden h-full">
              {isLoading ? (
                <div className="flex-1 p-6 space-y-5">
                  <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded bg-stone-200 animate-pulse" />
                      <div className="h-6 w-48 rounded bg-stone-200 animate-pulse" />
                      <div className="h-3 w-60 rounded bg-stone-200/60 animate-pulse" />
                    </div>
                    <div className="h-6 w-24 rounded-full bg-stone-200 animate-pulse" />
                  </div>
                  <div className="bg-[#f5f4ef] rounded-xl px-5 py-6 text-center">
                    <div className="h-3 w-28 mx-auto rounded bg-stone-200 animate-pulse mb-3" />
                    <div className="h-8 w-40 mx-auto rounded bg-stone-200 animate-pulse" />
                  </div>
                </div>
              ) : !selectedItem ? (
                <div className="flex-1 flex items-center justify-center text-stone-400 font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  {/* Scrollable Detail Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {/* Header Detail */}
                    <div className="border-b border-stone-100 pb-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[12px] text-stone-400 font-medium font-mono">RB-{String(selectedItem.id).padStart(4, '0')}</p>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${selectedItem.status === 'APPROVED_BY_PM' ? 'bg-[#e1f5fe] text-[#0277bd]' :
                          selectedItem.status === 'APPROVED' ? 'bg-[#e2f1eb] text-[#117a5b]' :
                            'bg-[#fee2e2] text-[#be123c]'
                          }`}>
                          {selectedItem.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                            selectedItem.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                        </span>
                      </div>
                      <h2 className="text-[22px] font-bold text-stone-900 leading-tight">
                        {selectedItem.ocrData?.merchant || selectedItem.posAnggaran?.deskripsi || selectedItem.proyek?.nama}
                      </h2>
                      <p className="text-[13px] text-stone-400 mt-0.5">
                        diajukan oleh <span className="font-semibold text-stone-600">{selectedItem.user?.nama}</span> pada {formatTanggalWaktu(selectedItem.createdAt || selectedItem.ocrData?.submittedAt || selectedItem.ocrData?.tanggal)}
                      </p>
                    </div>

                    {/* Table Properties */}
                    <div className="divide-y divide-stone-200 text-[13px]">
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Proyek</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.proyek?.nama || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Main</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.posAnggaran?.namaPos || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Sub</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.posAnggaran?.subAnggaran?.namaSub || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Keterangan</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.posAnggaran?.keterangan || selectedItem.posAnggaran?.deskripsi || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Tanggal Transaksi</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Pengaju</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.user?.nama || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Nominal</span>
                        <span className="font-bold font-mono text-stone-900 text-right">
                          <span className="text-stone-400 font-normal">Rp </span>{Number(selectedItem.nominal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Preview Struk Upload */}
                    {selectedItem.strukUrl && (
                      <div className="space-y-1">
                        <label className="text-[13px] text-stone-500">Bukti Struk</label>
                        <div
                          onClick={() => handleOpenZoom(selectedItem.strukUrl)}
                          className="border border-stone-200 rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
                        >
                          <img
                            src={selectedItem.strukUrl}
                            alt="Bukti Struk"
                            loading="lazy"
                            className="w-full h-auto object-contain max-h-48 rounded-lg group-hover:opacity-90 transition"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/bukti_struk.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                            <span className="bg-white text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                              <ZoomIn size={14} /> Klik untuk Memperbesar
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Jurnal Akuntansi (Auto-generated) */}
                    <div className="space-y-1.5">
                      <div className="text-[13px] font-bold text-stone-800 mb-1.5">Preview Jurnal Akuntansi (Auto-generated)</div>
                      <div className="bg-[#f5f4ef] border border-stone-200/80 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-stone-400 text-[12px] font-bold">
                            {selectedItem.jurnalAkuntansi?.[0] ? `JE-${String(selectedItem.jurnalAkuntansi[0].id).substring(0, 8).toUpperCase()}` : `JE-2026-${String(selectedItem.id).padStart(4, '0')}`}
                          </span>
                        </div>
                        <div className="text-stone-800 font-medium text-[12px]">
                          Pencairan reimbursement {selectedItem.user?.nama} - {selectedItem.posAnggaran?.deskripsi || selectedItem.posAnggaran?.namaPos}
                        </div>

                        {selectedItem.status === 'APPROVED_BY_PM' ? (
                          <div className="space-y-2 pt-2 border-t border-stone-200">
                            <div className="flex items-center justify-between gap-2 text-[12px]">
                              <span className="text-[#2d6a4f] font-bold shrink-0">Dr</span>
                              <select
                                value={debitAccount}
                                onChange={(e) => setDebitAccount(e.target.value)}
                                className="flex-1 text-[12px] font-mono bg-white border border-stone-200 rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800"
                              >
                                <option value="">-- Pilih Akun Debit (Beban) --</option>
                                {coaList
                                  .filter((coa: any) => {
                                    const t = (coa.tipe || '').toLowerCase();
                                    return t === 'beban' || t === 'expense';
                                  })
                                  .map((coa: any) => (
                                    <option key={coa.nomorAkun} value={coa.nomorAkun}>
                                      {coa.nomorAkun} - {coa.namaAkun} ({coa.tipe})
                                    </option>
                                  ))}
                              </select>
                              <span className="font-mono text-stone-900 text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[12px] pl-3">
                              <span className="text-[#be123c] font-bold shrink-0">Cr</span>
                              <select
                                value={creditAccount}
                                onChange={(e) => setCreditAccount(e.target.value)}
                                className="flex-1 text-[12px] font-mono bg-white border border-stone-200 rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800"
                              >
                                <option value="">-- Pilih Akun Kredit (Kas/Bank) --</option>
                                {coaList
                                  .filter((coa: any) => {
                                    const t = (coa.tipe || '').toLowerCase();
                                    return t === 'aset' || t === 'asset';
                                  })
                                  .map((coa: any) => (
                                    <option key={coa.nomorAkun} value={coa.nomorAkun}>
                                      {coa.nomorAkun} - {coa.namaAkun} ({coa.tipe})
                                    </option>
                                  ))}
                              </select>
                              <span className="font-mono text-stone-900 text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-2 border-t border-stone-200 text-[12px]">
                            {selectedItem.jurnalAkuntansi && selectedItem.jurnalAkuntansi.length > 0 ? (
                              selectedItem.jurnalAkuntansi.map((j: any) => (
                                <React.Fragment key={j.id}>
                                  <div className="flex justify-between items-center">
                                    <span>
                                      <span className="text-[#2d6a4f] font-bold mr-1">Dr</span>
                                      <span className="text-stone-600"> {j.noAkunDebit} {j.akunDebit?.namaAkun || coaList.find((c: any) => c.nomorAkun === j.noAkunDebit)?.namaAkun || 'Beban Material Proyek'}</span>
                                    </span>
                                    <span className="font-mono text-stone-900 font-bold">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between items-center pl-3">
                                    <span>
                                      <span className="text-[#be123c] font-bold mr-1">Cr</span>
                                      <span className="text-stone-600"> {j.noAkunKredit} {j.akunKredit?.namaAkun || coaList.find((c: any) => c.nomorAkun === j.noAkunKredit)?.namaAkun || 'Bank BCA - Operasional'}</span>
                                    </span>
                                    <span className="font-mono text-stone-900 font-bold">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                </React.Fragment>
                              ))
                            ) : (
                              <React.Fragment>
                                <div className="flex justify-between items-center">
                                  <span>
                                    <span className="text-[#2d6a4f] font-bold mr-1">Dr</span>
                                    <span className="text-stone-600"> 5-5101 Beban Material Proyek</span>
                                  </span>
                                  <span className="font-mono text-stone-900 font-bold">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pl-3">
                                  <span>
                                    <span className="text-[#be123c] font-bold mr-1">Cr</span>
                                    <span className="text-stone-600"> 1-1102 Bank BCA - Operasional</span>
                                  </span>
                                  <span className="font-mono text-stone-900 font-bold">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                              </React.Fragment>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Catatan dari Pengaju */}
                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan dari Pengaju</p>
                      <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                        {selectedItem.ocrData?.keterangan || selectedItem.ocrData?.raw || 'Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site'}.
                      </div>
                    </div>

                    {/* Catatan dari PM */}
                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan dari Project Manager</p>
                      <div className="bg-[#f5f4ef] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                        {pmApproval?.catatan || '-'}
                      </div>
                    </div>

                    {/* Catatan dari Keuangan */}
                    {selectedItem.status === 'APPROVED_BY_PM' ? (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan dari Keuangan (opsional)</p>
                        <textarea
                          rows={2}
                          placeholder="Tambahkan catatan jika ada..."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl p-3 text-[13px] text-stone-700 placeholder:text-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white h-18"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan dari Keuangan</p>
                        <div className="bg-[#f5f4ef] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                          {financeApproval?.catatan || '-'}
                        </div>
                      </div>
                    )}

                    {/* Alur Approval */}
                    <div>
                      <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                      <div className="flex flex-col gap-0">
                        {approvalSteps.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            {/* Ikon + garis vertikal */}
                            <div className="flex flex-col items-center">
                              <StepIcon state={step.state} number={i + 1} />
                              {i < approvalSteps.length - 1 && (
                                <div
                                  className={`w-px flex-1 my-1 ${step.state === "done" ? "bg-[#2d6a4f]" : "bg-stone-200"
                                    }`}
                                  style={{ minHeight: "20px" }}
                                />
                              )}
                            </div>
                            {/* Teks */}
                            <div className="pb-4">
                              <p className={`text-[13px] font-semibold ${step.state === "pending" ? "text-stone-400" : "text-stone-800"
                                }`}>
                                {step.label}
                              </p>
                              <p className="text-[11px] text-stone-400 mt-0.5">{step.sublabel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Action Footer (Fixed di bawah) */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-white shrink-0">
                    {selectedItem.strukUrl ? (
                      <a
                        href={selectedItem.strukUrl}
                        download={`bukti-${selectedItem.id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Download bukti</span>
                      </a>
                    ) : (
                      <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition opacity-50 cursor-not-allowed" disabled>
                        <Download size={14} />
                        <span>Download bukti</span>
                      </button>
                    )}

                    {selectedItem.status === 'APPROVED_BY_PM' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleProcess('REJECT')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#fee2e2] text-[#be123c] rounded-full text-[13px] font-semibold hover:bg-[#fecaca] transition cursor-pointer"
                        >
                          <X size={14} />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleProcess('APPROVE')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-full text-[13px] font-semibold hover:bg-[#245c43] transition shadow-sm cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Cairkan & Generate Jurnal</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Zoom Gambar Struk Simple */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            setZoomImageUrl(null);
            resetZoomAndPan();
          }}
        >
          {/* Tombol Tutup Floating di Pojok Kanan Atas */}
          <button
            type="button"
            onClick={() => {
              setZoomImageUrl(null);
              resetZoomAndPan();
            }}
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer shadow-xl"
            title="Tutup"
          >
            <X size={20} />
          </button>

          {/* Kontainer Gambar — Drag & Pan dengan Klik Kiri */}
          <div
            className={`relative max-w-[92vw] max-h-[92vh] overflow-hidden p-2 flex items-center justify-center select-none ${zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (e.deltaY < 0) {
                setZoomScale((prev) => Math.min(prev + 0.25, 4));
              } else {
                setZoomScale((prev) => {
                  const next = Math.max(prev - 0.25, 1);
                  if (next === 1) setPanPos({ x: 0, y: 0 });
                  return next;
                });
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPanPos({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <img
              src={zoomImageUrl}
              alt="Bukti Struk"
              draggable={false}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/bukti_struk.png';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PencairanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f9f8f4]">
        <div className="text-stone-400 font-medium text-xs">Memuat halaman...</div>
      </div>
    }>
      <PencairanContent />
    </Suspense>
  );
}