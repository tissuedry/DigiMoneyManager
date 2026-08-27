"use client";

import { useState, useEffect, useRef, Suspense, useMemo, Fragment, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Download, X, Check, Filter, ZoomIn, AlertTriangle
} from "lucide-react";

import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import ConfirmDialog from '@/components/confirm-dialog';
import SuccessDialog from '@/components/success-dialog';
import Toast from '@/components/toast';
import CompactNominal from '@/components/compact-nominal';
import { useApi, useInvalidate } from '@/lib/use-api';
import ImageLightbox from '@/components/image-lightbox';
import { formatApprovalDate, formatTanggal, getAvatarColor } from '@/lib/formatters';
import RejectModal from './RejectModal';

const formatTanggalWaktu = (isoStr: string | null | undefined) =>
  isoStr ? formatApprovalDate(isoStr) : "-";

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
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showApproveSuccess, setShowApproveSuccess] = useState(false);
  const [approvedLabel, setApprovedLabel] = useState('');
  const [showAccountWarning, setShowAccountWarning] = useState(false);
  const [showRejectSuccess, setShowRejectSuccess] = useState(false);
  const [rejectedLabel, setRejectedLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenZoom = (url: string) => {
    setZoomImageUrl(url);
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

  const [debitAccount] = useState("");
  const [creditAccount, setCreditAccount] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProyek, setSelectedProyek] = useState("Semua");
  const invalidate = useInvalidate();

  const { data: rData, isLoading } = useApi<any>("/api/reimbursements");
  const { data: masterAsetRes } = useApi<any>("/api/master?type=all&tipe=aset");
  const reimbursements = rData?.reimbursements ?? [];
  const masterAsetList = masterAsetRes?.data || (Array.isArray(masterAsetRes) ? masterAsetRes : []);

  const masterCreditOptions = useMemo(() => {
    const opts: Array<{ displayVal: string; mainNama: string; subNama: string }> = [];
    masterAsetList.forEach((main: any) => {
      (main.MasterSub || []).forEach((sub: any) => {
        opts.push({
          mainNama: main.nama,
          subNama: sub.nama,
          displayVal: `MAIN · ${main.nama} > SUB · ${sub.nama}`,
        });
      });
    });
    return opts;
  }, [masterAsetList]);

  const daftarProyek = useMemo(
    () => ["Semua", ...new Set(reimbursements.map((item: any) => item.proyek?.nama).filter(Boolean))],
    [reimbursements]
  );

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return reimbursements.filter((item: any) => {
      const matchesTab = activeTab === 'diteruskan'
        ? item.status === 'APPROVED_BY_PM'
        : (item.status === 'APPROVED' || item.status === 'REJECTED');

      const matchesSearch = searchQuery
        ? (item.user?.nama?.toLowerCase().includes(q) ||
          item.proyek?.nama?.toLowerCase().includes(q) ||
          String(item.id).toLowerCase().includes(q) ||
          item.nama?.toLowerCase().includes(q) ||
          item.merchant?.toLowerCase().includes(q))
        : true;

      const matchesProyek = selectedProyek === "Semua" || item.proyek?.nama === selectedProyek;

      return matchesTab && matchesSearch && matchesProyek;
    });
  }, [reimbursements, activeTab, searchQuery, selectedProyek]);

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const countDiteruskan = useMemo(
    () => reimbursements.filter((item: any) => item.status === 'APPROVED_BY_PM').length,
    [reimbursements]
  );
  const countSelesai = useMemo(
    () => reimbursements.filter((item: any) => item.status === 'APPROVED' || item.status === 'REJECTED').length,
    [reimbursements]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery]);

  const visibleList = filteredList.slice(0, visibleCount);
  const pendingCount = Math.min(PAGE_SIZE, filteredList.length - visibleCount);

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

  const selectedItem = filteredList.find((item: any) => String(item.id) === String(selectedId)) || filteredList[0] || null;

  useEffect(() => {
    if (selectedItem && String(selectedItem.id) !== String(selectedId)) {
      setSelectedId(String(selectedItem.id));
    }
  }, [filteredList, selectedItem, selectedId]);

  useEffect(() => {
    if (selectedItem && selectedItem.status === 'APPROVED_BY_PM') {
      setCreditAccount("");
      setCatatan("");
    }
  }, [selectedId, selectedItem]);

  const handleProcess = async (action: 'APPROVE' | 'REJECT', alasanPenolakan?: string) => {
    if (!selectedItem) return;

    if (action === 'APPROVE') {
      if (!creditAccount) {
        setErrorMessage("Silakan pilih Akun Kredit terlebih dahulu.");
        return;
      }
      setShowApproveConfirm(true);
      return;
    }

    setIsSubmittingReject(true);

    try {
      const res = await fetch(`/api/reimbursements/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan,
          alasan: alasanPenolakan,
          noAkunDebit: debitAccount,
          noAkunKredit: creditAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRejectedLabel(selectedItem.merchant || selectedItem.nama || selectedItem.posAnggaran?.deskripsi || 'Pengajuan');
        setIsRejectModalOpen(false);
        invalidate("/api/reimbursements", "/api/dashboard", "/api/notifications", "/api/laporan?type=buku-besar");
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
    if (!selectedItem) return;
    setIsApproving(true);

    try {
      const res = await fetch(`/api/reimbursements/${selectedItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          catatan,
          noAkunDebit: debitAccount,
          noAkunKredit: creditAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setApprovedLabel(selectedItem.merchant || selectedItem.nama || selectedItem.posAnggaran?.deskripsi || 'Pengajuan');
        setShowApproveConfirm(false);
        invalidate("/api/reimbursements", "/api/dashboard", "/api/notifications", "/api/laporan?type=buku-besar");
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

  const pmApproval = selectedItem?.approvals?.find((a: any) => a.level === 'PM' || a.approver?.role === 'Project Manager');
  const financeApproval = selectedItem?.approvals?.find((a: any) => a.level === 'KEUANGAN' || a.approver?.role === 'Tim Keuangan');

  const rejectedApproval = selectedItem?.approvals?.find((a: any) => a.status === 'REJECTED');
  const rejectionReason = rejectedApproval?.alasan || rejectedApproval?.catatan || "";

  const isSelectedRealisasi = selectedItem?.tipe === 'Realisasi Anggaran';

  const baseApprovalSteps = selectedItem ? [
    {
      label: "Pengajuan dikirim",
      sublabel: `${selectedItem.user?.nama || 'Karyawan'} • ${formatTanggalWaktu(selectedItem.createdAt)}`,
      state: "done" as const
    },
    ...(!isSelectedRealisasi ? [{
      label: "Validasi Project Manager",
      sublabel: pmApproval
        ? `${pmApproval.approver?.nama || 'Project Manager'} • ${formatTanggalWaktu(pmApproval.timestamp)}`
        : (selectedItem.status === 'SUBMITTED' ? "Menunggu" : "Menunggu • –"),
      state: pmApproval
        ? (pmApproval.status === 'REJECTED' ? "rejected" as const : "done" as const)
        : (selectedItem.status === 'SUBMITTED' ? "active" as const : "pending" as const)
    }] : []),
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
  const approvalSteps = baseApprovalSteps;

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={closeSidebar}
        userRole="Tim Keuangan"
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4] overflow-hidden">
        <Header onOpenSidebar={openSidebar} userRole="Tim Keuangan" />

        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">

          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Pencairan</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Pengajuan yang telah divalidasi PM dan siap dicairkan. Jurnal Debit-Kredit akan ter-generate otomatis.
            </p>

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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <Filter size={14} className="text-stone-500" />
                    <span className="truncate max-w-[120px]">
                      {selectedProyek === "Semua" ? "Semua Proyek" : selectedProyek}
                    </span>
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-semibold text-stone-500 bg-stone-50 border-b border-stone-100">
                        Pilih Proyek
                      </div>
                      <ul className="max-h-56 overflow-y-auto">
                        {daftarProyek.map((proyek, index) => (
                          <li key={index}>
                            <button
                              onClick={() => {
                                setSelectedProyek(proyek as string);
                                setIsFilterOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 flex items-center justify-between transition"
                            >
                              <span className="truncate pr-2">{proyek as string}</span>
                              {selectedProyek === proyek && (
                                <Check size={14} className="text-blue-500 flex-shrink-0" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">

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
                    const itemCode = `RB-${String(item.id).padStart(4, '0')}`;
                    const isRealisasi = item.tipe === 'Realisasi Anggaran';

                    const vendorTitle = item.merchant || item.nama || item.posAnggaran?.deskripsi || (isRealisasi ? 'Realisasi Anggaran' : 'Pengajuan Reimbursement');
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
                              <div className="group relative min-w-0 flex items-center gap-1.5">
                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide border ${isRealisasi
                                  ? 'bg-[#E9E8F4] text-[#483E90] border-[#c4c0e0]'
                                  : 'bg-[#F0F7FB] text-[#005D8D] border-[#b3d6ea]'
                                  }`}>
                                  {isRealisasi ? 'REAL' : 'REIMB'}
                                </span>
                                <p className="text-[12px] font-bold text-stone-800 truncate">
                                  {vendorTitle} · {projectTitle}
                                </p>
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-stone-800 shadow-lg group-hover:block">
                                  {vendorTitle} · {projectTitle}
                                </div>
                              </div>
                              <p className="text-[12px] font-bold text-stone-800 flex-shrink-0">
                                <CompactNominal value={item.nominalRaw ?? item.nominal} compactThreshold={100_000_000_000} />
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="group relative min-w-0">
                                <p className="text-[11px] text-stone-400 truncate">
                                  {item.user?.nama || 'Karyawan'} <span className="font-normal text-stone-400 ">· {itemCode}</span>
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
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {(() => {
                      const isRealisasiDetail = selectedItem.tipe === 'Realisasi Anggaran';
                      const detailVendorTitle = selectedItem.merchant || selectedItem.nama || selectedItem.posAnggaran?.deskripsi || selectedItem.proyek?.nama;

                      const detailTanggal = selectedItem.createdAt || null;
                      return (
                        <div className="border-b border-stone-100 pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] text-stone-400 font-medium ">RB-{String(selectedItem.id).padStart(4, '0')}</p>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide border ${isRealisasiDetail
                                ? 'bg-[#E9E8F4] text-[#483E90] border-[#c4c0e0]'
                                : 'bg-[#F0F7FB] text-[#005D8D] border-[#b3d6ea]'
                                }`}>
                                {isRealisasiDetail ? 'REALISASI' : 'REIMBURSEMENT'}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${selectedItem.status === 'APPROVED_BY_PM' ? 'bg-[#e1f5fe] text-[#0277bd]' :
                              selectedItem.status === 'APPROVED' ? 'bg-[#e2f1eb] text-[#117a5b]' :
                                'bg-[#fee2e2] text-[#be123c]'
                              }`}>
                              {selectedItem.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                                selectedItem.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                            </span>
                          </div>
                          <h2 className="text-[22px] font-bold text-stone-900 leading-tight">
                            {detailVendorTitle}
                          </h2>
                          <p className="text-[13px] text-stone-400 mt-0.5">
                            diajukan oleh <span className="font-semibold text-stone-600">{selectedItem.user?.nama}</span>
                            {detailTanggal ? <> pada {formatTanggalWaktu(detailTanggal)}</> : <span className="italic text-stone-300"> · tanggal tidak tersedia</span>}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="bg-[#f5f4ef] rounded-xl px-5 py-4 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                        Total Pengajuan
                      </p>
                      <p className="text-[32px] font-bold text-stone-900">
                        {<CompactNominal value={selectedItem.nominal} compactThreshold={1_000_000_000_000} showTooltip />}
                      </p>
                    </div>

                    {(() => {
                      const ketObj = selectedItem.keteranganAnggaran || selectedItem.posAnggaran;
                      const ketNama = ketObj?.keterangan || ketObj?.deskripsi;
                      if (!ketNama) return null;

                      const alokasi = Number(ketObj.nominalAlokasi || 0);
                      const realisasi = Number(ketObj.nominalRealisasi || 0);
                      const sisa = alokasi - realisasi;
                      const percentage = alokasi > 0 ? Math.round((realisasi / alokasi) * 100) : 0;
                      const isOver = sisa < 0;

                      return (
                        <div className="bg-white border border-[#e6e1d4] rounded-2xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-semibold text-stone-800 truncate" title={`${selectedItem.tipe === 'Realisasi Anggaran' ? 'Realisasi Anggaran' : 'Reimbursement'} – KET · ${ketNama}`}>
                              {selectedItem.tipe === 'Realisasi Anggaran' ? 'Realisasi Anggaran' : 'Reimbursement'} – KET · {ketNama}
                            </p>
                            <span className={`text-[12px] font-bold shrink-0 ${isOver ? 'text-[#902f33]' : 'text-stone-800'}`}>
                              {percentage}%
                            </span>
                          </div>

                          <div className="w-full bg-[#f0ece1] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOver ? 'bg-[#902f33]' : 'bg-[#00875a]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11.5px] pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Alokasi</span>
                              <span className="font-semibold text-stone-900 ">
                                {<CompactNominal value={alokasi} compactThreshold={1_000_000_000_000} showTooltip />}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Realisasi</span>
                              <span className="font-semibold text-stone-900 ">
                                {<CompactNominal value={realisasi} compactThreshold={1_000_000_000_000} showTooltip />}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Sisa</span>
                              <span className={`font-semibold ${isOver ? 'text-[#902f33]' : 'text-stone-900'}`}>
                                {isOver ? (
                                  <>
                                    - <CompactNominal value={Math.abs(sisa)} compactThreshold={1_000_000_000_000} showTooltip />
                                  </>
                                ) : (
                                  <CompactNominal value={sisa} compactThreshold={1_000_000_000_000} showTooltip />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedItem.status === "REJECTED" && (
                      <div className="rounded-xl border border-[#fbc9c9] bg-[#fff5f5] p-4 flex gap-3">
                        <AlertTriangle size={16} className="text-[#be123c] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[12px] font-bold text-[#be123c] mb-1">Alasan Penolakan</p>
                          <p className="text-[12px] text-stone-700 leading-relaxed">
                            {rejectionReason || "Tidak ada alasan spesifik yang diberikan."}
                          </p>
                        </div>
                      </div>
                    )}

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
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">
                          {selectedItem.tanggalStruk ? formatTanggal(selectedItem.tanggalStruk.split('T')[0]) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Pengaju</span>
                        <span className="font-semibold text-stone-800 text-right max-w-[60%]">{selectedItem.user?.nama || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <span className="text-stone-400">Nominal</span>
                        <span className="font-bold  text-stone-900 text-right">
                          <CompactNominal value={selectedItem.nominal} compactThreshold={100_000_000} />
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const hasStruk = Boolean(
                        selectedItem.strukUrl &&
                        selectedItem.strukUrl.trim() !== '' &&
                        selectedItem.strukUrl !== '/uploads/placeholder.png' &&
                        selectedItem.strukUrl !== '/bukti_struk.png'
                      );

                      if (!hasStruk) {
                        return (
                          <div className="space-y-1">
                            <label className="text-[13px] text-stone-500">
                              {selectedItem.tipe === 'Realisasi Anggaran' ? 'Bukti Gambar' : 'Bukti Struk / Dokumen'}
                            </label>
                            <div className="bg-[#f5f4ef] border border-stone-200/80 rounded-xl px-4 py-3 text-[13px] text-stone-400 italic">
                              Tidak ada bukti {selectedItem.tipe === 'Realisasi Anggaran' ? 'gambar' : 'struk'} yang dilampirkan.
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1">
                          <label className="text-[13px] text-stone-500">
                            {selectedItem.tipe === 'Realisasi Anggaran' ? 'Bukti Gambar' : 'Bukti Struk'}
                          </label>
                          {selectedItem.strukUrl.toLowerCase().split('?')[0].endsWith('.pdf') ? (
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
                                href={selectedItem.strukUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold shrink-0 hover:bg-stone-800 transition"
                              >
                                Buka PDF
                              </a>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleOpenZoom(selectedItem.strukUrl)}
                              className="border border-stone-200 rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
                            >
                              <img
                                src={selectedItem.strukUrl}
                                alt="Bukti Struk"
                                loading="lazy"
                                className="w-full h-auto object-contain max-h-48 rounded-lg group-hover:opacity-90 transition"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                                <span className="bg-white text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                                  <ZoomIn size={14} /> Klik untuk Memperbesar
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="space-y-1.5">
                      <div className="text-[13px] font-bold text-stone-800 mb-1.5">Preview Jurnal Akuntansi (Auto-generated)</div>
                      <div className="bg-[#f5f4ef] border border-stone-200/80 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className=" text-stone-400 text-[12px] font-bold">
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
                              <div className="flex-1 flex items-center gap-1.5 flex-wrap text-[12px] bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 min-w-0">
                                <div className="inline-flex items-center gap-1 min-w-0">
                                  <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                    MAIN
                                  </span>
                                  <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                  <span className="font-bold text-stone-800 truncate">
                                    {selectedItem.posAnggaran?.subAnggaran?.mainAnggaran?.namaMain || selectedItem.posAnggaran?.namaPos || '-'}
                                  </span>
                                </div>

                                <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                <div className="inline-flex items-center gap-1 min-w-0">
                                  <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                    SUB
                                  </span>
                                  <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                  <span className="font-bold text-stone-800 truncate">
                                    {selectedItem.posAnggaran?.subAnggaran?.namaSub || '-'}
                                  </span>
                                </div>

                                <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                <div className="inline-flex items-center gap-1 min-w-0">
                                  <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                    KET
                                  </span>
                                  <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                  <span className="font-bold text-stone-800 truncate">
                                    {selectedItem.posAnggaran?.keterangan || selectedItem.posAnggaran?.deskripsi || '-'}
                                  </span>
                                </div>
                              </div>
                              <span className=" text-stone-900 text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[12px] pl-3">
                              <span className="text-[#be123c] font-bold shrink-0">Cr</span>
                              <select
                                value={creditAccount}
                                onChange={(e) => setCreditAccount(e.target.value)}
                                className="flex-1 text-[12px]  bg-white border border-stone-200 rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 text-stone-800"
                              >
                                <option value="">Pilih Akun Kredit</option>
                                {(masterCreditOptions.length > 0 ? masterCreditOptions : (selectedItem.creditOptions || [])).map((opt: any, idx: number) => (
                                  <option key={idx} value={opt.displayVal}>
                                    MAIN · {opt.mainNama} &gt; SUB · {opt.subNama}
                                  </option>
                                ))}
                              </select>
                              <span className=" text-stone-900 text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2 border-t border-stone-200 text-[12px]">
                            {selectedItem.jurnalAkuntansi && selectedItem.jurnalAkuntansi.length > 0 ? (
                              selectedItem.jurnalAkuntansi.map((j: any) => (
                                <Fragment key={j.id}>
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[#2d6a4f] font-bold shrink-0">Dr</span>
                                      <div className="inline-flex items-center gap-1 flex-wrap min-w-0">
                                        <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                          MAIN
                                        </span>
                                        <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                        <span className="font-bold text-stone-800 truncate">
                                          {selectedItem.posAnggaran?.subAnggaran?.mainAnggaran?.namaMain || selectedItem.posAnggaran?.namaPos || '-'}
                                        </span>

                                        <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                        <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                          SUB
                                        </span>
                                        <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                        <span className="font-bold text-stone-800 truncate">
                                          {selectedItem.posAnggaran?.subAnggaran?.namaSub || '-'}
                                        </span>

                                        <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                        <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                          KET
                                        </span>
                                        <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                        <span className="font-bold text-stone-800 truncate">
                                          {selectedItem.posAnggaran?.keterangan || selectedItem.posAnggaran?.deskripsi || '-'}
                                        </span>
                                      </div>
                                    </div>
                                    <span className=" text-stone-900 font-bold shrink-0">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between items-center pl-3 text-[12px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[#be123c] font-bold shrink-0">Cr</span>
                                      <span className="font-bold text-stone-800 truncate">
                                        {j.noAkunKredit || 'MAIN · Kas & Bank > SUB · BCA'}
                                      </span>
                                    </div>
                                    <span className=" text-stone-900 font-bold shrink-0">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                </Fragment>
                              ))
                            ) : (
                              <Fragment>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[#2d6a4f] font-bold shrink-0">Dr</span>
                                    <div className="inline-flex items-center gap-1 flex-wrap min-w-0">
                                      <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                        MAIN
                                      </span>
                                      <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                      <span className="font-bold text-stone-800 truncate">
                                        {selectedItem.posAnggaran?.subAnggaran?.mainAnggaran?.namaMain || selectedItem.posAnggaran?.namaPos || '-'}
                                      </span>

                                      <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                      <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                        SUB
                                      </span>
                                      <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                      <span className="font-bold text-stone-800 truncate">
                                        {selectedItem.posAnggaran?.subAnggaran?.namaSub || '-'}
                                      </span>

                                      <span className="text-stone-300 font-normal text-[11px] shrink-0 mx-0.5">&gt;</span>

                                      <span className="text-stone-400 font-extrabold text-[11px] tracking-wider uppercase shrink-0">
                                        KET
                                      </span>
                                      <span className="text-stone-400 font-bold text-[11px] shrink-0">·</span>
                                      <span className="font-bold text-stone-800 truncate">
                                        {selectedItem.posAnggaran?.keterangan || selectedItem.posAnggaran?.deskripsi || '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className=" text-stone-900 font-bold shrink-0">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pl-3">
                                  <span>
                                    <span className="text-[#be123c] font-bold mr-1">Cr</span>
                                    <span className="text-stone-600"> 1-1102 Bank BCA - Operasional</span>
                                  </span>
                                  <span className=" text-stone-900 font-bold">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                              </Fragment>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan dari Pengaju</p>
                      <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                        {selectedItem.nama || '-'}
                      </div>
                    </div>

                    {selectedItem.tipe !== 'Realisasi Anggaran' && (
                      <div>
                        <p className="text-[13px] text-stone-500 mb-2">Catatan dari Project Manager</p>
                        <div className="bg-[#f5f4ef] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                          {pmApproval?.catatan || '-'}
                        </div>
                      </div>
                    )}

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

                    <div>
                      <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                      <div className="flex flex-col gap-0">
                        {approvalSteps.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3">
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

                  <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-white shrink-0">
                    {selectedItem.strukUrl && selectedItem.strukUrl.trim() !== '' && selectedItem.strukUrl !== '/uploads/placeholder.png' && selectedItem.strukUrl !== '/bukti_struk.png' ? (
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
                      <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-400 bg-stone-50 transition opacity-60 cursor-not-allowed" disabled>
                        <Download size={14} />
                        <span>Tidak ada bukti</span>
                      </button>
                    )}

                    {selectedItem.status === 'APPROVED_BY_PM' && (
                      <div className="flex items-center gap-2">
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

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={(alasanTeks) => handleProcess('REJECT', alasanTeks)}
        data={
          selectedItem
            ? {
              merchant: selectedItem.merchant || selectedItem.nama || selectedItem.posAnggaran?.deskripsi || selectedItem.proyek?.nama || 'Pengajuan',
              userName: selectedItem.user?.nama || 'Karyawan',
              nominal: Number(selectedItem.nominal)
            }
            : undefined
        }
        isLoading={isSubmittingReject}
      />

      <ConfirmDialog
        open={showApproveConfirm && !!selectedItem}
        title="Cairkan & Generate Jurnal"
        maxWidthClass="max-w-xl"
        description={
          selectedItem && (
            <div className="space-y-2.5">
              <p>Apakah Anda yakin ingin mencairkan pengajuan ini dan men-generate jurnal?</p>
              <dl className="text-xs bg-stone-50 border border-stone-100 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between gap-4 items-start">
                  <dt className="text-stone-400 font-medium shrink-0">Pemohon</dt>
                  <dd className="font-bold text-stone-800 text-right break-words">{selectedItem.user?.nama || '-'}</dd>
                </div>
                <div className="flex justify-between gap-4 items-start">
                  <dt className="text-stone-400 font-medium shrink-0">Nominal</dt>
                  <dd className="font-bold text-stone-800 text-right">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</dd>
                </div>
                <div className="flex justify-between gap-4 items-start">
                  <dt className="text-stone-400 font-medium shrink-0">Akun Debit (Auto)</dt>
                  <dd className="font-bold text-stone-800 text-right break-words">
                    {selectedItem.posAnggaran?.subAnggaran?.mainAnggaran?.namaMain || selectedItem.posAnggaran?.namaPos || '-'} &gt; {selectedItem.posAnggaran?.subAnggaran?.namaSub || '-'} &gt; {selectedItem.posAnggaran?.keterangan || selectedItem.posAnggaran?.deskripsi || '-'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 items-start">
                  <dt className="text-stone-400 font-medium shrink-0">Akun Kredit</dt>
                  <dd className="font-bold text-right break-words">
                    {creditAccount ? (
                      <span className="text-stone-800 font-bold">
                        {creditAccount}
                      </span>
                    ) : (
                      <span className="text-stone-400 font-normal">-</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )
        }
        confirmLabel="Cairkan"
        isLoading={isApproving}
        onCancel={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApprove}
      />

      <SuccessDialog
        open={showApproveSuccess}
        title="Berhasil Dicairkan"
        description={<>Pengajuan <span className="font-semibold text-[#14130F]">{approvedLabel}</span> berhasil dicairkan dan jurnal akuntansi telah di-generate.</>}
        onClose={() => setShowApproveSuccess(false)}
      />

      <SuccessDialog
        open={showAccountWarning}
        variant="warning"
        title="Lengkapi Data Akun Pencairan"
        description="Harap pilih Akun Kredit terlebih dahulu sebelum mencairkan pengajuan."
        closeLabel="Mengerti"
        onClose={() => setShowAccountWarning(false)}
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

      <ImageLightbox url={zoomImageUrl} onClose={() => setZoomImageUrl(null)} />
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