"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Filter, Eye, RefreshCw, ArrowUpDown, Search, ChevronDown } from "lucide-react";
import SuccessDialog from '@/components/success-dialog';
import ConfirmDialog from '@/components/confirm-dialog';
import ImageLightbox from '@/components/image-lightbox';
import ReimbursementDetailPanel from './ReimbursementDetailPanel';
import CompactNominal from '@/components/compact-nominal';
import { formatTanggal } from '@/lib/formatters';

type Submission = {
  id: string;
  dbId: number;
  date: string;
  lastActivityTime: number;
  merchant: string;
  project: string;
  pos: string;
  amount: string;
  status: "Menunggu PM" | "Menunggu Keuangan" | "Dicairkan" | "Ditolak";
  isResubmit: boolean;
  isResubmitted: boolean;
};

const TABS = ["Semua", "Menunggu PM", "Menunggu Keuangan", "Dicairkan", "Ditolak"];

function makeDisplayId(id: string, index: number) {
  const num = String(index + 1).padStart(3, "0");
  return `RB-2026-${num}`;
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr key={`skeleton-${index}`} className="border-b border-stone-100 last:border-none">
      <td className="px-6 py-4"><div className="h-3 w-16 rounded bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-3 w-20 rounded bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-3 w-32 rounded bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-3 w-24 rounded bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-5 w-16 rounded-md bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-3 w-20 rounded bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-5 w-24 rounded-full bg-stone-200 animate-pulse" /></td>
      <td className="px-6 py-4 text-center"><div className="h-5 w-5 mx-auto rounded bg-stone-200 animate-pulse" /></td>
    </tr>
  );
}

const getStatusBadge = (status: Submission["status"]) => {
  switch (status) {
    case "Menunggu PM":
      return "bg-[#fdf3e6] text-[#b46b2b]";
    case "Menunggu Keuangan":
      return "bg-[#e1f5fe] text-[#0277bd]";
    case "Dicairkan":
      return "bg-[#e2f1eb] text-[#117a5b]";
    case "Ditolak":
      return "bg-[#fee2e2] text-[#be123c]";
    default:
      return "bg-stone-100 text-stone-600";
  }
};

export default function RiwayatPengajuanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Semua");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rawReimbursements, setRawReimbursements] = useState<any[]>([]);
  
  // States Modal dan Detail Panel
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedDisplayId, setSelectedDisplayId] = useState<string>("");
  const [panelVisible, setPanelVisible] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [canceledLabel, setCanceledLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // States Filter
  const [filterProject, setFilterProject] = useState("Semua");
  const [filterPos, setFilterPos] = useState("Semua");
  const [searchMerchant, setSearchMerchant] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showFilterMenu]);

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchReimbursements = async () => {
    setIsLoading(true);
    try {
      // Pastikan endpoint sudah benar menggunakan role yang sesuai
      const res = await fetch('/api/reimbursements?role=Karyawan');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.reimbursements) {
        setRawReimbursements(data.reimbursements);
        const mapped: Submission[] = data.reimbursements.map((r: any, i: number) => ({
          id: makeDisplayId(String(r.id), i),
          dbId: r.id,
          date: r.tanggalStruk ? formatTanggal(r.tanggalStruk.split('T')[0]) : '',
          lastActivityTime: [
            r.createdAt,
            ...(r.approvals || []).map((a: any) => a.timestamp),
          ]
            .map((t: string | null | undefined) => (t ? new Date(t).getTime() : NaN))
            .filter((t: number) => !isNaN(t))
            .reduce((max: number, t: number) => Math.max(max, t), 0),
          merchant: r.merchant || r.nama || 'N/A',
          project: r.proyek?.nama || 'N/A',
          pos: r.posAnggaran?.deskripsi || r.posAnggaran?.namaPos || 'N/A',
          amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
          status: (r.status === 'SUBMITTED' ? 'Menunggu PM' :
                  r.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                  r.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak') as Submission["status"],
          isResubmit: !!r.ocrData?.resubmitFrom,
          isResubmitted: data.reimbursements.some((other: any) => other.ocrData?.resubmitFrom === r.id),
        }));
        setSubmissions(mapped);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, []);

  // Ekstrak data unik untuk Dropdown Filter
  const uniqueProjects = Array.from(new Set(submissions.map((s) => s.project))).filter(Boolean);
  const uniquePos = Array.from(new Set(submissions.map((s) => s.pos))).filter(Boolean);

  const filteredData = submissions
    .filter((item) => {
      // Filter Status Tab
      if (activeTab !== "Semua") {
        if (activeTab === "Menunggu Keuangan" && item.status !== "Menunggu Keuangan") return false;
        if (activeTab !== "Menunggu Keuangan" && item.status !== activeTab) return false;
      }
      // Filter Dropdown
      if (filterProject !== "Semua" && item.project !== filterProject) return false;
      if (filterPos !== "Semua" && item.pos !== filterPos) return false;
      
      // Filter Search
      if (searchMerchant.trim() !== "") {
        const query = searchMerchant.toLowerCase();
        if (!item.merchant.toLowerCase().includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      return sortOrder === "asc" ? a.lastActivityTime - b.lastActivityTime : b.lastActivityTime - a.lastActivityTime;
    });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, filterProject, filterPos, searchMerchant, sortOrder]);

  const visibleData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;
  const pendingCount = Math.min(PAGE_SIZE, filteredData.length - visibleCount);

  // Lazy Loading Scroll
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const loadMore = () => {
      if (isLoadingMoreRef.current) return;
      if (visibleCount >= filteredData.length) return;

      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredData.length));
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
      }, 500);
    };

    const handleScroll = () => {
      if (isLoadingMoreRef.current) return;
      if (visibleCount >= filteredData.length) return;
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 150) return;
      loadMore();
    };

    const checkFillViewport = () => {
      if (isLoadingMoreRef.current) return;
      if (visibleCount >= filteredData.length) return;
      if (el.scrollHeight > el.clientHeight + 1) return;
      loadMore();
    };

    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkFillViewport);
    checkFillViewport();

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkFillViewport);
    };
  }, [filteredData.length, visibleCount]);

  const handleOpenDetail = (dbId: number, displayId: string) => {
    const raw = rawReimbursements.find(r => r.id === dbId);
    if (raw) {
      setSelectedItem(raw);
      setSelectedDisplayId(displayId);
      setActionError(null);
      setShowCancelModal(false);
      setTimeout(() => setPanelVisible(true), 10);
    }
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setShowCancelModal(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleViewRelated = (dbId: number, displayId: string) => {
    const raw = rawReimbursements.find(r => r.id === dbId);
    if (raw) {
      setSelectedItem(raw);
      setSelectedDisplayId(displayId);
      setActionError(null);
      setShowCancelModal(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/reimbursements/${selectedItem.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.message || 'Gagal membatalkan pengajuan');
        return;
      }
      setCanceledLabel(selectedDisplayId);
      setShowCancelModal(false);
      handleClosePanel();
      await fetchReimbursements();
      setShowCancelSuccess(true);
    } catch (err) {
      setActionError('Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = () => {
    if (!selectedItem) return;
    router.push(`/karyawan/reimbursement?resubmitId=${selectedItem.id}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 flex flex-col">
      <main ref={mainRef} className="flex-1 p-4 lg:p-8 max-w-[1400px] mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-stone-900">Riwayat Pengajuan</h1>
          <p className="text-[14px] text-stone-500 mt-1.5">
            Semua reimbursement yang pernah kamu ajukan, lengkap dengan status dan jejak audit.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-full md:w-auto overflow-x-auto hide-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-stone-900 font-semibold shadow-sm"
                    : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-stone-500" />
              Urutan: {sortOrder === "desc" ? "Terbaru" : "Terlama"}
            </button>

            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full shadow-sm text-[13px] font-medium transition cursor-pointer ${
                  showFilterMenu || filterProject !== "Semua" || filterPos !== "Semua" || searchMerchant !== ""
                    ? "bg-stone-900 border-stone-900 text-white hover:bg-stone-800"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Filter size={14} className={showFilterMenu || filterProject !== "Semua" || filterPos !== "Semua" || searchMerchant !== "" ? "text-white" : "text-stone-500"} />
                Filter
                {(filterProject !== "Semua" || filterPos !== "Semua" || searchMerchant !== "") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 z-20 bg-white border border-stone-200 rounded-2xl shadow-lg p-4 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* FILTER PROYEK BARU */}
                  <div className="space-y-1.5 mb-4">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Filter Proyek</label>
                    <div className="relative">
                      <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="peer w-full appearance-none bg-[#fcfbf9] border border-stone-200 rounded-xl pl-3 pr-9 py-2 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all cursor-pointer"
                      >
                        <option value="Semua">Semua Proyek</option>
                        {uniqueProjects.map((proj) => (
                          <option key={proj} value={proj}>{proj}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-transform duration-200 peer-focus:rotate-180" />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Filter Pos Anggaran</label>
                    <div className="relative">
                      <select
                        value={filterPos}
                        onChange={(e) => setFilterPos(e.target.value)}
                        className="peer w-full appearance-none bg-[#fcfbf9] border border-stone-200 rounded-xl pl-3 pr-9 py-2 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all cursor-pointer"
                      >
                        <option value="Semua">Semua Pos</option>
                        {uniquePos.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition-transform duration-200 peer-focus:rotate-180" />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Cari Reimbursement</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Nama reimbursement..."
                        value={searchMerchant}
                        onChange={(e) => setSearchMerchant(e.target.value)}
                        className="w-full bg-[#fcfbf9] border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setFilterProject("Semua");
                        setFilterPos("Semua");
                        setSearchMerchant("");
                      }}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#f5f4ef] border-b border-stone-200 text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                <th className="px-6 py-4 rounded-tl-2xl">ID Pengajuan</th>
                <th className="px-6 py-4">Tanggal Transaksi</th>
                <th className="px-6 py-4">Nama Reimbursement</th>
                <th className="px-6 py-4">Proyek</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-stone-600">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                    Memuat data pengajuan...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                <>
                {visibleData.map((item, index) => (
                  <tr
                    key={item.dbId}
                    onClick={() => handleOpenDetail(item.dbId, item.id)}
                    className={`hover:bg-stone-50 transition border-b border-stone-100 cursor-pointer ${
                      index === visibleData.length - 1 ? "border-none" : ""
                    } ${selectedItem?.id === item.dbId ? "bg-stone-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-mono">{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-stone-800">{item.merchant}</td>
                    <td className="px-6 py-4">{item.project}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-stone-100 border border-stone-200/60 px-2 py-1 rounded-md text-[11px] font-medium text-stone-600">
                        {item.pos}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-800">
                      <CompactNominal value={item.amount} compactThreshold={100_000_000} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(item.status)}`}>
                          {item.status === "Ditolak" && item.isResubmit ? "Pengajuan Ulang Ditolak" : item.status}
                        </span>
                        {item.isResubmit && item.status !== "Ditolak" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ede9fe] text-[#6d28d9]">
                            <RefreshCw size={10} />
                            Pengajuan Ulang
                          </span>
                        )}
                        {item.status === "Ditolak" && item.isResubmitted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ede9fe] text-[#6d28d9]">
                            <RefreshCw size={10} />
                            Sudah Diajukan Ulang
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(item.dbId, item.id); }}
                        className="text-stone-400 hover:text-stone-800 transition p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {isLoadingMore &&
                  Array.from({ length: pendingCount }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} index={i} />
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-400">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-center py-5 text-[12px] text-stone-400">
            Menampilkan {visibleData.length} dari {filteredData.length} item
            {hasMore && !isLoadingMore && " · scroll untuk memuat lebih banyak"}
          </div>
        )}
      </main>

      {/* Komponen Panel Detail Transaksi */}
      <ReimbursementDetailPanel
        isOpen={panelVisible}
        raw={selectedItem}
        displayId={selectedDisplayId}
        allRaw={rawReimbursements}
        onClose={handleClosePanel}
        onRequestCancel={() => setShowCancelModal(true)}
        onResubmit={handleResubmit}
        onViewRelated={handleViewRelated}
        actionLoading={actionLoading}
        actionError={actionError}
        onOpenImage={(url: string) => { setSelectedImageUrl(url); setShowImageModal(true); }}
      />

      <ConfirmDialog
        open={showCancelModal && !!selectedItem}
        title="Batalkan Pengajuan"
        description={
          selectedItem && (
            <>
              <p>
                Apakah Anda yakin ingin membatalkan pengajuan reimbursement{" "}
                <span className="font-semibold text-stone-900">{selectedDisplayId}</span> senilai{" "}
                <span className="font-semibold text-stone-900">Rp {Number(selectedItem.nominal).toLocaleString("id-ID")}</span>?
                Tindakan ini bersifat permanen dan tidak dapat diurungkan.
              </p>
              {actionError && (
                <p className="text-[11px] text-[#be123c] bg-[#fff5f5] border border-[#fbc9c9] rounded-lg px-3 py-2 mt-4">
                  {actionError}
                </p>
              )}
            </>
          )
        }
        cancelLabel="Tidak, kembali"
        confirmLabel={actionLoading ? "Membatalkan..." : "Ya, batalkan"}
        variant="danger"
        isLoading={actionLoading}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />

      <SuccessDialog
        open={showCancelSuccess}
        title="Pengajuan Dibatalkan"
        description={<>Pengajuan reimbursement <span className="font-semibold text-stone-900">{canceledLabel}</span> berhasil dibatalkan.</>}
        onClose={() => setShowCancelSuccess(false)}
      />

      {/* Komponen Preview Gambar Struk */}
      <ImageLightbox
        url={showImageModal ? selectedImageUrl : null}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
}