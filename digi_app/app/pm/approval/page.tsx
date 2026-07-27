"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, Download, X, Check, ZoomIn } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import { useApi, useMutate, useInvalidate } from '@/lib/use-api';

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
  date: string; // tanggal transaksi
  notaDate?: string;
  submittedAt: string; // waktu pengajuan untuk alur approval
  merchant: string;
  catatanPm: string;
  catatanKeuangan: string;
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function formatDateTime(dateInput: string | Date) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const dateStr = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr}, ${timeStr}`;
}

const getStatusBadge = (status: ApprovalStatus) => {
  switch (status) {
    case "Menunggu PM":
      return "text-[#9A6200] bg-[#FFF8E6] border-[#FFEAA7]";
    case "Menunggu Keuangan":
      return "text-[#005D8D] bg-[#E2F1F8] border-sky-100";
    case "Dicairkan":
      return "text-[#005836] bg-[#D1E9E1] border-emerald-100";
    case "Ditolak":
      return "text-[#902F33] bg-rose-50 border-rose-100";
    default:
      return "text-[#6A6660] bg-stone-100 border-stone-200";
  }
};

// Step icon dalam alur approval
const StepIcon = ({ state, number }: { state: ApprovalStep["state"]; number: number }) => {
  if (state === "done")
    return (
      <div className="w-6 h-6 rounded-full bg-[#005836] flex items-center justify-center shrink-0">
        <Check size={13} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "rejected")
    return (
      <div className="w-6 h-6 rounded-full bg-[#902F33] flex items-center justify-center shrink-0">
        <X size={13} className="text-white" strokeWidth={2.5} />
      </div>
    );
  if (state === "active")
    return (
      <div className="w-6 h-6 rounded-full bg-[#005D8D] flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-white">{number}</span>
      </div>
    );
  return (
    <div className="w-6 h-6 rounded-full border border-[#E6E1D4] bg-stone-100 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-semibold text-[#6A6660]">{number}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "Menunggu Saya" | "Diteruskan" | "Selesai";

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Menunggu Saya");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const invalidate = useInvalidate();

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
  const activeProyekId = selectedProjectId ?? meData?.user?.proyekId ?? meData?.user?.proyek?.id ?? allProjects[0]?.id ?? null;

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
    const submissionTime = r.ocrData?.submittedAt || r.createdAt || r.ocrData?.tanggal;

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

    return {
      id: `RB-${String(r.id)}`,
      dbId: r.id,
      date: submissionTime ? formatDateTime(submissionTime) : 'N/A',
      notaDate: r.ocrData?.tanggal ? formatTanggal(r.ocrData.tanggal) : 'N/A',
      submittedAt: r.createdAt ? formatDateTime(r.createdAt) : 'N/A',
      merchant: r.ocrData?.merchant || 'N/A',
      project: r.proyek?.nama || 'N/A',
      main: r.posAnggaran?.namaPos || 'N/A',
      catatanPm: pmApproval?.catatan || "",
      catatanKeuangan: financeApproval?.catatan || "",
      sub: r.posAnggaran?.subAnggaran?.namaSub || 'N/A',
      ket: r.posAnggaran?.keterangan || r.posAnggaran?.deskripsi || 'N/A',
      amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
      amountRaw: Number(r.nominal),
      status: displayStatus,
      pengaju: r.user?.nama || 'Karyawan',
      pengajuInitials: initials,
      keterangan: r.ocrData?.keterangan || r.ocrData?.raw || '-',
      steps,
      strukUrl: r.strukUrl || r.urlStruk
    };
  });

  // Filter data berdasarkan tab
  const filteredData = mappedSubmissions.filter((item: any) => {
    if (activeTab === "Menunggu Saya") return item.status === "Menunggu PM";
    if (activeTab === "Diteruskan") return item.status === "Menunggu Keuangan";
    if (activeTab === "Selesai") return item.status === "Dicairkan" || item.status === "Ditolak";
    return false;
  });

  // Derived selected submission
  const selected = filteredData.find((item: any) => item.id === selectedId) || filteredData[0] || null;

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selected) return;

    if (action === 'APPROVE') {
      if (!confirm("Apakah Anda yakin ingin menyetujui dan meneruskan pengajuan ini ke Tim Keuangan?")) {
        return;
      }
    } else {
      if (!confirm("Apakah Anda yakin ingin menolak pengajuan ini?")) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/reimbursements/${selected.dbId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'APPROVE' ? "Pengajuan berhasil disetujui!" : "Pengajuan berhasil ditolak.");
        setCatatan("");
        invalidate("/api/reimbursements?role=Project+Manager", "/api/dashboard", "/api/notifications");
      } else {
        alert("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses pengajuan.");
    }
  };

  // Reset pilihan saat tab berganti
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const tabCounts: Record<Tab, number> = {
    "Menunggu Saya": mappedSubmissions.filter((s: any) => s.status === "Menunggu PM").length,
    Diteruskan: mappedSubmissions.filter((s: any) => s.status === "Menunggu Keuangan").length,
    Selesai: mappedSubmissions.filter((s: any) => s.status === "Dicairkan" || s.status === "Ditolak").length,
  };

  return (
    <div className="flex h-screen w-full bg-[#F6F4EF] text-[#14130F] overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={closeSidebar}
        userRole="Project Manager"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F6F4EF] overflow-hidden">
        <Header onOpenSidebar={openSidebar} userRole="Project Manager" />

        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">
          {/* Header Title & Subtitle */}
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-[#14130F]">Antrian Approval</h1>
            <p className="text-[13px] text-[#6A6660] mt-1.5">
              Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
            </p>

            {/* Filter & Tab Switcher Bar */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex bg-[#F1EEE6] rounded-2xl p-1 border border-[#E6E1D4] items-center gap-1">
                {(["Menunggu Saya", "Diteruskan", "Selesai"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${activeTab === tab
                      ? "bg-white text-[#14130F] shadow-sm"
                      : "text-[#6A6660] hover:text-[#14130F]"
                      }`}
                  >
                    {tab} ({tabCounts[tab]})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 bg-white border border-[#E4E0D9] text-[#14130F] rounded-xl px-3.5 py-1.5 text-xs font-medium shadow-sm hover:bg-stone-50 transition cursor-pointer"
                >
                  <Filter size={14} />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* List and Detail Split Layout */}
          <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
            {/* LEFT COLUMN: ITEM LIST */}
            <div className="w-full lg:w-[400px] flex flex-col gap-2 shrink-0 lg:overflow-y-auto pb-4 pr-1 custom-scrollbar">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="p-3.5 rounded-xl border border-[#E6E1D4] bg-white flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse shrink-0" />
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="h-3 w-32 rounded bg-stone-200 animate-pulse" />
                          <div className="h-2.5 w-24 rounded bg-stone-200/60 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="h-3 w-16 rounded bg-stone-200 animate-pulse" />
                        <div className="h-4 w-20 rounded-lg bg-stone-200/60 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredData.length === 0 ? (
                <div className="bg-white border border-[#E6E1D4] rounded-xl p-8 text-center text-[#6A6660] text-xs font-semibold">
                  Tidak ada pengajuan reimbursement.
                </div>
              ) : (
                filteredData.map((item: any) => {
                  const isSelected = selected && selected.id === item.id;
                  const formattedNominal = item.amountRaw ? item.amountRaw.toLocaleString('id-ID') : item.amount.replace('Rp ', '');

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-3.5 rounded-xl border flex justify-between items-center transition cursor-pointer ${isSelected
                        ? "bg-[#B2DCCD] border-[#E6E1D4] shadow-sm"
                        : "bg-white border-[#E6E1D4] hover:border-stone-300 shadow-sm"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-[#D1E9E1] text-[#005836] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.pengajuInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="group relative">
                            <p className="text-[13px] font-bold text-[#14130F] truncate">
                              {item.merchant}
                            </p>
                            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-[#E6E1D4] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#14130F] shadow-lg group-hover:block">
                              {item.merchant}
                            </div>
                          </div>
                          <div className="group relative mt-0.5">
                            <div className="truncate">
                              <span className="text-[11px] text-[#6A6660]">{item.pengaju}</span>
                              <span className="text-[11px] text-[#6A6660] ml-1">· {item.id}</span>
                            </div>
                            <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-max max-w-[320px] whitespace-nowrap rounded-lg border border-[#E6E1D4] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#14130F] shadow-lg group-hover:block">
                              {item.pengaju} · {item.id}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="text-[13px] font-bold font-mono text-[#14130F]">
                          <span className="text-[#6A6660] text-[11px]">Rp </span>{formattedNominal}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT COLUMN: DETAIL VIEW */}
            <div className="flex-1 flex flex-col bg-white border border-[#E4E0D9] rounded-2xl shadow-sm overflow-hidden h-full">
              {isLoading ? (
                <div className="flex-1 p-6 space-y-5">
                  <div className="flex justify-between items-start border-b border-[#E6E1D4] pb-4">
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded bg-stone-200 animate-pulse" />
                      <div className="h-6 w-48 rounded bg-stone-200 animate-pulse" />
                      <div className="h-3 w-60 rounded bg-stone-200/60 animate-pulse" />
                    </div>
                    <div className="h-6 w-24 rounded-lg bg-stone-200 animate-pulse" />
                  </div>
                  <div className="bg-[#F6F4EF] border border-[#E6E1D4] rounded-xl p-4 text-center">
                    <div className="h-3 w-28 mx-auto rounded bg-stone-200 animate-pulse mb-2" />
                    <div className="h-8 w-40 mx-auto rounded bg-stone-200 animate-pulse" />
                  </div>
                </div>
              ) : !selected ? (
                <div className="flex-1 flex items-center justify-center text-[#6A6660] font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  {/* Scrollable Detail Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* Header Detail */}
                    <div className="flex justify-between items-start border-b border-[#E6E1D4] pb-4">
                      <div>
                        <span className="text-[11px] text-[#6A6660] font-mono tracking-wider">
                          {selected.id}
                        </span>
                        <h2 className="text-xl font-bold text-[#14130F] mt-0.5 leading-tight">
                          {selected.merchant}
                        </h2>
                        <p className="text-[11px] text-[#6A6660] mt-1">
                          oleh <span className="font-semibold text-[#14130F]">{selected.pengaju}</span> pada {selected.date}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${getStatusBadge(selected.status)}`}>
                        {selected.status}
                      </span>
                    </div>

                    {/* Total Pengajuan */}
                    <div className="bg-[#F6F4EF] border border-[#E6E1D4] rounded-xl p-4 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-[#6A6660] font-semibold mb-1">
                        Total Pengajuan
                      </p>
                      <p className="text-[32px] font-bold text-[#14130F]">{selected.amount}</p>
                    </div>

                    {/* Table Properties */}
                    <div className="space-y-0 text-[12px]">
                      {[
                        { label: "Proyek", value: selected.project, isNominal: false },
                        { label: "Main", value: selected.main, isNominal: false },
                        { label: "Sub", value: selected.sub, isNominal: false },
                        { label: "Keterangan", value: selected.ket, isNominal: false },
                        { label: "Tanggal Transaksi", value: selected.notaDate, isNominal: false },
                        { label: "Pengaju", value: selected.pengaju, isNominal: false },
                      ].map(({ label, value, isNominal }) => (
                        <div key={label} className="flex justify-between py-2 border-b border-[#E6E1D4]">
                          <span className="text-[#6A6660]">{label}</span>
                          {isNominal ? (
                            <span className="font-bold font-mono text-[#14130F] text-right">{value}</span>
                          ) : (
                            <span className="font-medium text-[#14130F] text-right">{value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Preview Struk Upload */}
                    {selected.strukUrl && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#14130F]">Bukti Struk</label>
                        <div
                          onClick={() => handleOpenZoom(selected.strukUrl!)}
                          className="border border-[#E4E0D9] rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
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
                      </div>
                    )}

                    {/* Catatan dari Pengaju */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-stone-500">Catatan dari Pengaju</div>
                      <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                        “{selected.keterangan}”
                      </div>
                    </div>

                    {/* Catatan opsional — Input jika Menunggu PM, Card jika sudah lewat */}
                    {selected.status === "Menunggu PM" ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-stone-500">Catatan untuk Keuangan (opsional)</div>
                        <textarea
                          placeholder="Tambahkan catatan jika ada..."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="w-full bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] focus:outline-none border border-[#E4E0D9] transition resize-none h-18"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-stone-500">Catatan dari Project Manager</div>
                        <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                          {selected.catatanPm && selected.catatanPm.trim() !== ""
                            ? selected.catatanPm
                            : "Tidak ada catatan dari Project Manager."}
                        </div>
                      </div>
                    )}

                    {(selected.status === "Dicairkan" || selected.status === "Ditolak") && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-stone-500">Catatan dari Keuangan</div>
                        <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                          {selected.catatanKeuangan && selected.catatanKeuangan.trim() !== ""
                            ? selected.catatanKeuangan
                            : "Tidak ada catatan dari Tim Keuangan."}
                        </div>
                      </div>
                    )}

                    <div className="border-b border-[#E6E1D4] pt-1" />

                    {/* Alur Approval */}
                    <div className="space-y-3 pt-2">
                      <p className="text-[13px] font-bold text-[#14130F]">Alur Approval</p>
                      <div className="flex flex-col gap-0">
                        {selected.steps.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            {/* Ikon + garis vertikal */}
                            <div className="flex flex-col items-center">
                              <StepIcon state={step.state} number={i + 1} />
                              {i < selected.steps.length - 1 && (
                                <div
                                  className={`w-px flex-1 my-1 ${step.state === "done" ? "bg-[#005836]" : "bg-[#E6E1D4]"
                                    }`}
                                  style={{ minHeight: "20px" }}
                                />
                              )}
                            </div>
                            {/* Teks */}
                            <div className="pb-4">
                              <p className={`text-[12px] font-semibold ${step.state === "pending" ? "text-[#6A6660]" : "text-[#14130F]"
                                }`}>
                                {step.label}
                              </p>
                              <p className="text-[11px] text-[#6A6660] mt-0.5">{step.sublabel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tombol aksi (Fixed / Frozen di bawah) */}
                  <div className="border-t border-[#E6E1D4] px-6 py-3.5 bg-white flex items-center justify-between shrink-0">
                    {selected.strukUrl ? (
                      <a
                        href={selected.strukUrl}
                        download={`bukti-${selected.id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-[#E4E0D9] text-[#14130F] rounded-full px-4 py-2 text-xs font-semibold shadow-sm hover:bg-stone-50 transition cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Download bukti</span>
                      </a>
                    ) : (
                      <button className="flex items-center gap-1.5 bg-white border border-[#E4E0D9] text-[#6A6660] rounded-full px-4 py-2 text-xs font-semibold opacity-50 cursor-not-allowed" disabled>
                        <Download size={14} />
                        <span>Download bukti</span>
                      </button>
                    )}

                    {selected.status === "Menunggu PM" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleProcess('REJECT')}
                          className="flex items-center gap-1.5 bg-[#FEE2E2] text-[#BE123C] border border-rose-100 rounded-full px-4 py-2 text-xs font-semibold hover:bg-[#FECACA] transition cursor-pointer"
                        >
                          <X size={14} />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleProcess('APPROVE')}
                          className="flex items-center gap-1.5 bg-[#005836] text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-[#00472b] transition shadow-sm cursor-pointer"
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