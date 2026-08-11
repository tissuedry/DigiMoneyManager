"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, X, Check, ZoomIn, AlertTriangle } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import ConfirmDialog from '@/components/confirm-dialog';
import Toast from '@/components/toast';
import CompactNominal from '@/components/compact-nominal';
import { useApi, useInvalidate } from '@/lib/use-api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ApprovalStatus = "Menunggu PM" | "Menunggu Keuangan" | "Dicairkan" | "Ditolak";

type ApprovalStep = {
  label: string;
  sublabel: string;
  state: "done" | "active" | "pending" | "rejected";
};

type Submission = {
  id: string;
  dbId: number;
  date: string;
  notaDate?: string;
  submittedAt: string;
  merchant: string;
  catatanPm: string;
  catatanKeuangan: string;
  rejectionReason: string;
  project: string;
  main: string;
  sub: string;
  ket: string;
  amount: string;
  amountRaw: number;
  status: ApprovalStatus;
  pengaju: string;
  pengajuInitials: string;
  keterangan: string;
  steps: ApprovalStep[];
  strukUrl?: string;
  isRealisasi?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateSafe(isoStr: string | Date | null | undefined): Date | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatTanggal(iso: string) {
  if (!iso) return "";
  const d = parseDateSafe(iso);
  if (!d) return iso;
  const y = d.getFullYear();
  const m = d.getMonth();
  const date = d.getDate();
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${date} ${bulan[m]} ${y}`;
}

function formatDateTime(dateInput: string | Date | null | undefined) {
  if (!dateInput) return "";
  const d = parseDateSafe(dateInput);
  if (!d) return String(dateInput);

  const day = d.getDate();
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const month = bulan[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

const getStatusBadge = (status: ApprovalStatus) => {
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

const getAvatarColor = (initials: string) => {
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const idx = initials.charCodeAt(0) % colors.length;
  return colors[idx];
};

// Step icon dalam alur approval
const StepIcon = ({ state, number }: { state: ApprovalStep["state"]; number: number }) => {
  if (state === "done")
    return (
      <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "rejected")
    return (
      <div className="w-7 h-7 rounded-full bg-[#be123c] flex items-center justify-center flex-shrink-0">
        <X size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "active")
    return (
      <div className="w-7 h-7 rounded-full bg-[#b46b2b] flex items-center justify-center flex-shrink-0">
        <span className="text-[11px] font-bold text-white">{number}</span>
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full border-2 border-stone-200 bg-white flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-stone-400">{number}</span>
    </div>
  );
};

// ─── Komponen Pop-up Modal Penolakan (RejectModal) ──────────────────────────

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (alasan: string) => void;
  data?: {
    merchant: string;
    userName: string;
    nominal: number;
  };
  isLoading?: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  data,
  isLoading = false
}) => {
  const [alasan, setAlasan] = useState('');

  // Reset alasan ketika modal ditutup
  useEffect(() => {
    if (!isOpen) setAlasan('');
  }, [isOpen]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const handleSubmit = () => {
    if (!alasan.trim()) return;
    onSubmit(alasan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tolak Pengajuan</h2>
          {data && (
            <p className="mt-1 text-sm text-gray-500">
              {data.merchant} &middot; {data.userName} &middot; {formatRupiah(data.nominal)}
            </p>
          )}
        </div>
        <div className="mb-6">
          <label htmlFor="alasan" className="mb-2 block text-sm font-semibold text-gray-900">
            Alasan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="alasan"
            rows={4}
            className="w-full rounded-xl border border-[#E5E5E5] p-4 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black resize-none"
            placeholder="Jelaskan alasan penolakan..."
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full rounded-2xl border border-[#E5E5E5] bg-white py-3.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!alasan.trim() || isLoading}
            className="w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-400 cursor-pointer"
          >
            {isLoading ? 'Mengirim...' : 'Kirim Penolakan'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "Menunggu Approval" | "Diteruskan" | "Selesai";

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Menunggu Approval");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk kontrol Modal Penolakan
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showApproveSuccess, setShowApproveSuccess] = useState(false);
  const [approvedLabel, setApprovedLabel] = useState('');
  const [showRejectSuccess, setShowRejectSuccess] = useState(false);
  const [rejectedLabel, setRejectedLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invalidate = useInvalidate();

  // ─── Infinite Scroll ────────────────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Zoom Struk State
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

  const { data: meData, isLoading: isMeLoading } = useApi<any>("/api/auth/me");
  const { data: proyekData } = useApi<any>("/api/proyek?role=Project+Manager");
  const { data, isLoading: isReimbLoading } = useApi<any>("/api/reimbursements?role=Project+Manager");

  const allProjects = proyekData?.projects ?? [];
  const activeProyekId = meData?.user?.proyekId ?? meData?.user?.proyek?.id ?? allProjects[0]?.id ?? null;

  const isLoading = isReimbLoading || isMeLoading;

  const allReimbursements = data?.reimbursements ?? [];
  // Antrian Approval hanya menampilkan proyek yang dipilih di select-project
  const reimbursements = activeProyekId
    ? allReimbursements.filter((r: any) => r.proyekId === activeProyekId || r.proyek?.id === activeProyekId)
    : allReimbursements;

  // Convert API reimbursements to Submission type
  const mappedSubmissions = reimbursements.map((r: any): Submission => {
    const pmApproval = r.approvals?.find((a: any) => a.level === 'PM');
    const financeApproval = r.approvals?.find((a: any) => a.level === 'KEUANGAN');

    // Fallback super berlapis untuk memastikan tanggal tidak pernah kosong
    const submissionTime = r.createdAt || r.created_at || r.tanggalStruk || r.tanggal;

    // Ambil data penolakan jika ada
    const rejectedApproval = r.approvals?.find((a: any) => a.status === 'REJECTED');
    const rejectionReason = rejectedApproval?.alasan || rejectedApproval?.catatan || "";

    const steps: ApprovalStep[] = [
      {
        label: "Pengajuan dikirim",
        sublabel: `${r.user?.nama || 'Karyawan'} • ${submissionTime ? formatDateTime(submissionTime) : '-'}`,
        state: "done"
      },
      {
        label: "Validasi Project Manager",
        sublabel: pmApproval
          ? `${pmApproval.approver?.nama || 'Project Manager'} • ${formatDateTime(pmApproval.timestamp)}`
          : (r.status === 'SUBMITTED' ? "Menunggu" : "Menunggu • –"),
        state: pmApproval
          ? (pmApproval.status === 'REJECTED' ? "rejected" : "done")
          : (r.status === 'SUBMITTED' ? "active" : "pending")
      },
      {
        label: "Verifikasi Tim Keuangan",
        sublabel: financeApproval
          ? `${financeApproval.approver?.nama || 'Tim Keuangan'} • ${formatDateTime(financeApproval.timestamp)}`
          : (r.status === 'APPROVED_BY_PM' ? "Menunggu" : "Menunggu • –"),
        state: financeApproval
          ? (financeApproval.status === 'REJECTED' ? "rejected" : "done")
          : (r.status === 'APPROVED_BY_PM' ? "active" : "pending")
      },
      {
        label: "Dicairkan",
        sublabel: r.status === 'APPROVED'
          ? `Jurnal otomatis • ${financeApproval ? formatDateTime(financeApproval.timestamp) : ''}`
          : "Jurnal otomatis • –",
        state: r.status === 'APPROVED' ? "done" : "pending"
      }
    ];

    // Map DB status to display status
    let displayStatus: ApprovalStatus = "Menunggu PM";
    if (r.status === 'APPROVED_BY_PM') displayStatus = "Menunggu Keuangan";
    else if (r.status === 'APPROVED') displayStatus = "Dicairkan";
    else if (r.status === 'REJECTED') {
      displayStatus = "Ditolak";
      if (pmApproval && pmApproval.status === 'REJECTED') {
        steps[1].state = 'rejected';
        steps[2].state = 'pending';
      } else if (financeApproval && financeApproval.status === 'REJECTED') {
        steps[1].state = 'done';
        steps[2].state = 'rejected';
      }
    }

    const initials = r.user?.nama
      ? r.user.nama.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'KY';

    const isRealisasi = r.tipe === 'Realisasi Anggaran';

    return {
      id: `RB-${String(r.id)}`,
      dbId: r.id,
      date: submissionTime ? formatDateTime(submissionTime) : 'N/A',
      notaDate: r.tanggalStruk ? formatTanggal(r.tanggalStruk) : 'N/A',
      submittedAt: submissionTime ? formatDateTime(submissionTime) : 'N/A',

      // Ambil secara langsung dari object r sesuai Prisma
      merchant: r.merchant || r.nama || 'N/A',
      project: r.proyek?.nama || 'N/A',
      main: r.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain || 'N/A',
      sub: r.keteranganAnggaran?.subAnggaran?.namaSub || 'N/A',
      ket: r.keteranganAnggaran?.keterangan || 'N/A',

      catatanPm: pmApproval?.catatan || "",
      catatanKeuangan: financeApproval?.catatan || "",
      rejectionReason,
      amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
      amountRaw: Number(r.nominal),
      status: displayStatus,
      pengaju: r.user?.nama || 'Karyawan',
      pengajuInitials: initials,
      keterangan: '-', // Jika ada deskripsi lain, bisa dilampirkan di sini
      steps,
      strukUrl: r.urlStruk || r.strukUrl,
      isRealisasi
    };
  });

  // Filter data berdasarkan tab
  const filteredData = mappedSubmissions.filter((item: any) => {
    const matchesTab = activeTab === "Menunggu Approval"  
      ? item.status === "Menunggu PM" : activeTab === "Diteruskan" 
      ? item.status === "Menunggu Keuangan" 
      : (item.status === "Dicairkan" || item.status === "Ditolak");

    const matchesSearch = searchQuery
      ? (item.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pengaju?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesTab && matchesSearch;
  });

  // Derived selected submission
  const selected = filteredData.find((item: any) => item.id === selectedId) || filteredData[0] || null;

  // Fungsi dinamis untuk Approve & Reject
  const handleProcess = async (action: 'APPROVE' | 'REJECT', alasanPenolakan?: string) => {
    if (!selected) return;

    if (action === 'APPROVE') {
      setShowApproveConfirm(true);
      return;
    }

    setIsSubmittingReject(true);

    try {
      const res = await fetch(`/api/reimbursements/${selected.dbId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan,
          alasan: alasanPenolakan // Parameter alasan dikirim ke Backend API
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRejectedLabel(selected.merchant || selected.pengaju || 'Pengajuan');
        setCatatan("");
        setIsRejectModalOpen(false);
        invalidate("/api/reimbursements?role=Project+Manager", "/api/dashboard", "/api/notifications");
        setShowRejectSuccess(true);
      } else {
        setErrorMessage("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan sistem saat memproses pengajuan.");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selected) return;
    setIsApproving(true);

    try {
      const res = await fetch(`/api/reimbursements/${selected.dbId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          catatan,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setApprovedLabel(selected.merchant || selected.pengaju || 'Pengajuan');
        setCatatan("");
        setShowApproveConfirm(false);
        invalidate("/api/reimbursements?role=Project+Manager", "/api/dashboard", "/api/notifications");
        setShowApproveSuccess(true);
      } else {
        setErrorMessage("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan sistem saat memproses pengajuan.");
    } finally {
      setIsApproving(false);
    }
  };

  // Reset pilihan & visibleCount saat tab berganti
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
    setVisibleCount(PAGE_SIZE);
  };

  // Infinite scroll handler
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (isLoadingMoreRef.current) return;
      if (visibleCount >= filteredData.length) return;
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 150) return;
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredData.length));
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
      }, 500);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [filteredData.length, visibleCount]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const tabCounts: Record<Tab, number> = {
    "Menunggu Approval": mappedSubmissions.filter((s: any) => s.status === "Menunggu PM").length,
    Diteruskan: mappedSubmissions.filter((s: any) => s.status === "Menunggu Keuangan").length,
    Selesai: mappedSubmissions.filter((s: any) => s.status === "Dicairkan" || s.status === "Ditolak").length,
  };

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={closeSidebar}
        userRole="Project Manager"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4] overflow-hidden">
        <Header onOpenSidebar={openSidebar} userRole="Project Manager" />

        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">
          {/* Header Title & Subtitle */}
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Approval</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
            </p>

            {/* Filter & Tab Switcher Bar */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
                {(["Menunggu Approval", "Diteruskan", "Selesai"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === tab
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                      }`}
                  >
                    {tab}
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-stone-100 text-stone-600" : "bg-stone-200/70 text-stone-400"
                        }`}
                    >
                      {tabCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama pengaju atau reimbursement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-full outline-none focus:border-stone-400 transition w-58 sm:w-70 text-stone-800 placeholder:text-stone-400"
                />
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
              ) : filteredData.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-400 text-[13px]">
                  Tidak ada pengajuan reimbursement.
                </div>
              ) : (
                filteredData.slice(0, visibleCount).map((item: any) => {
                  const isSelected = selected && selected.id === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150 cursor-pointer ${isSelected
                        ? "bg-[#e8f4ef] border-[#a8d5be] shadow-sm scale-[0.99]"
                        : "bg-white border-stone-200 hover:bg-stone-50"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${getAvatarColor(item.pengajuInitials)}`}>
                          {item.pengajuInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="group relative min-w-0 flex items-center gap-1.5">
                              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide border ${item.isRealisasi
                                  ? 'bg-[#E9E8F4] text-[#483E90] border-[#c4c0e0]'
                                  : 'bg-[#F0F7FB] text-[#005D8D] border-[#b3d6ea]'
                                }`}>
                                {item.isRealisasi ? 'REAL' : 'REIMB'}
                              </span>
                              <p className="text-[12px] font-bold text-stone-800 truncate">
                                {item.merchant}
                              </p>
                              <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-800 shadow-lg group-hover:block">
                                {item.merchant}
                              </div>
                            </div>
                             <p className="text-[12px] font-bold text-stone-800 flex-shrink-0">
                              <CompactNominal value={item.amountRaw ?? item.amount ?? item.nominal} compactThreshold={100_000_000_000} className="text-[12px] font-bold text-stone-800" />
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="group relative min-w-0">
                              <p className="text-[11px] text-stone-400 truncate">
                                {item.pengaju} <span className="font-normal text-stone-400 font-mono">· {item.id}</span>
                              </p>
                              <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-800 shadow-lg group-hover:block">
                                {item.pengaju} · {item.id}
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
              {/* Skeleton saat load batch berikutnya */}
              {isLoadingMore && Array.from({ length: Math.min(PAGE_SIZE, filteredData.length - visibleCount) }).map((_, i) => (
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
              ) : !selected ? (
                <div className="flex-1 flex items-center justify-center text-stone-400 font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  {/* Scrollable Detail Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* Header Detail */}
                    <div className="border-b border-stone-100 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-stone-400 font-medium font-mono">{selected.id}</p>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide border ${selected.isRealisasi
                              ? 'bg-[#E9E8F4] text-[#483E90] border-[#c4c0e0]'
                              : 'bg-[#F0F7FB] text-[#005D8D] border-[#b3d6ea]'
                            }`}>
                            {selected.isRealisasi ? 'REALISASI' : 'REIMBURSEMENT'}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(selected.status)}`}>
                          {selected.status}
                        </span>
                      </div>
                      <h2 className="text-[22px] font-bold text-stone-900 leading-tight">{selected.merchant}</h2>
                      <p className="text-[13px] text-stone-400 mt-0.5">
                        diajukan oleh <span className="font-semibold text-stone-600">{selected.pengaju}</span>
                        {selected.date !== 'N/A' && selected.date !== '' ? <> pada {selected.date}</> : <span className="italic text-stone-300"> · tanggal tidak tersedia</span>}
                      </p>
                    </div>

                    {/* Total Pengajuan */}
                    <div className="bg-[#f5f4ef] rounded-xl px-5 py-4 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                        Total Pengajuan
                      </p>
                      <p className="text-[32px] font-bold text-stone-900">{selected.amount}</p>
                    </div>

                    {/* Tampilan Alasan Penolakan Jika Ditolak */}
                    {selected.status === "Ditolak" && (
                      <div className="rounded-xl border border-[#fbc9c9] bg-[#fff5f5] p-4 flex gap-3">
                        <AlertTriangle size={16} className="text-[#be123c] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] font-bold text-[#be123c] mb-1">Alasan Penolakan</p>
                          <p className="text-[12px] text-stone-700 leading-relaxed">
                            {selected.rejectionReason || "Tidak ada alasan spesifik yang diberikan."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Table Properties */}
                    <div className="divide-y divide-stone-200 text-[13px]">
                      {[
                        { label: "Proyek", value: selected.project, isNominal: false },
                        { label: "Main", value: selected.main, isNominal: false },
                        { label: "Sub", value: selected.sub, isNominal: false },
                        { label: "Keterangan", value: selected.ket, isNominal: false },
                        { label: "Tanggal Transaksi", value: selected.notaDate, isNominal: false },
                        { label: "Pengaju", value: selected.pengaju, isNominal: false },
                      ].map(({ label, value, isNominal }) => (
                        <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <span className="text-stone-400">{label}</span>
                          {isNominal ? (
                            <span className="font-bold font-mono text-stone-900 text-right">{value}</span>
                          ) : (
                            <span className="font-semibold text-stone-800 text-right max-w-[60%]">{value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Preview Struk Upload */}
                    {selected.strukUrl && (
                      <div className="space-y-1">
                        <label className="text-[13px] text-stone-500">Bukti Struk / Dokumen</label>
                        {selected.strukUrl.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                          <div className="border border-stone-200 rounded-xl p-3 bg-[#fdfaf5] flex items-center justify-between gap-3 max-w-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center shrink-0 border border-red-200">
                                PDF
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-800 truncate">Dokumen Bukti (PDF)</p>
                                <p className="text-[10px] text-stone-400 truncate">Klik untuk membuka file</p>
                              </div>
                            </div>
                            <a
                              href={selected.strukUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold shrink-0 hover:bg-stone-800 transition"
                            >
                              Buka PDF
                            </a>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleOpenZoom(selected.strukUrl!)}
                            className="border border-stone-200 rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
                          >
                            <img
                              src={selected.strukUrl}
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
                        )}
                      </div>
                    )}

                    {/* Catatan dari Pengaju */}
                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan dari Pengaju</p>
                      <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                        {selected.keterangan}
                      </div>
                    </div>

                    {/* Catatan opsional — Input jika Menunggu PM, Card jika sudah lewat */}
                    {selected.status === "Menunggu PM" ? (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan untuk Keuangan (opsional)</p>
                        <textarea
                          rows={2}
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          placeholder="Tambahkan catatan jika ada..."
                          className="w-full border border-stone-200 rounded-xl p-3 text-[13px] text-stone-700 placeholder:text-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white h-18"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan dari Project Manager</p>
                        <div className="bg-[#f5f4ef] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                          {selected.catatanPm && selected.catatanPm.trim() !== ""
                            ? selected.catatanPm
                            : "Tidak ada catatan dari Project Manager."}
                        </div>
                      </div>
                    )}

                    {(selected.status === "Dicairkan" || selected.status === "Ditolak") && (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan dari Keuangan</p>
                        <div className="bg-[#f5f4ef] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                          {selected.catatanKeuangan && selected.catatanKeuangan.trim() !== ""
                            ? selected.catatanKeuangan
                            : "Tidak ada catatan dari Tim Keuangan."}
                        </div>
                      </div>
                    )}

                    {/* Alur Approval */}
                    <div>
                      <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                      <div className="flex flex-col gap-0">
                        {selected.steps.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            {/* Ikon + garis vertikal */}
                            <div className="flex flex-col items-center">
                              <StepIcon state={step.state} number={i + 1} />
                              {i < selected.steps.length - 1 && (
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

                  {/* Tombol aksi (Fixed / Frozen di bawah) */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-white shrink-0">
                    {selected.strukUrl ? (
                      <a
                        href={selected.strukUrl}
                        download={`bukti-${selected.id}.png`}
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

                    {selected.status === "Menunggu PM" && (
                      <div className="flex items-center gap-2">
                        {/* Tombol Tolak sekarang memanggil state untuk memunculkan modal */}
                        <button
                          onClick={() => setIsRejectModalOpen(true)}
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
                          <span>Teruskan ke Keuangan</span>
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

      {/* Render Modal Tolak di Sini */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={(alasanTeks) => handleProcess('REJECT', alasanTeks)}
        data={
          selected
            ? {
              merchant: selected.merchant,
              userName: selected.pengaju,
              nominal: selected.amountRaw
            }
            : undefined
        }
        isLoading={isSubmittingReject}
      />

      <ConfirmDialog
        open={showApproveConfirm && !!selected}
        title="Teruskan ke Keuangan"
        description={
          selected && (
            <>Apakah Anda yakin ingin menyetujui dan meneruskan pengajuan <span className="font-semibold text-[#14130F]">{selected.merchant}</span> dari <span className="font-semibold text-[#14130F]">{selected.pengaju}</span> senilai <span className="font-semibold text-[#14130F]">{selected.amount}</span> ke Tim Keuangan?</>
          )
        }
        confirmLabel="Teruskan"
        isLoading={isApproving}
        onCancel={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApprove}
      />

      <Toast
        open={showApproveSuccess}
        message={`Pengajuan ${approvedLabel} berhasil disetujui dan diteruskan ke Tim Keuangan.`}
        onClose={() => setShowApproveSuccess(false)}
      />

      <Toast
        open={showRejectSuccess}
        message={`Pengajuan ${rejectedLabel} berhasil ditolak.`}
        onClose={() => setShowRejectSuccess(false)}
      />

      <Toast
        open={!!errorMessage}
        variant="error"
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />

      {/* Modal Zoom Gambar Struk Simple */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            setZoomImageUrl(null);
            resetZoomAndPan();
          }}
        >
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