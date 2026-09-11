"use client";

import { useMemo, useState } from "react";
import { Download, X, Check, ZoomIn, AlertTriangle, Filter } from "lucide-react";
import ConfirmDialog from '@/components/confirm-dialog';
import Toast from '@/components/toast';
import CompactNominal from '@/components/compact-nominal';
import RejectModal from './RejectModal';
import ImageLightbox from '@/components/image-lightbox';
import { useApi, useInvalidate } from '@/lib/use-api';
import { getFileExt, formatTanggal, formatApprovalDate, getInitials, getAvatarColor } from '@/lib/formatters';

const hasStrukUrl = (u?: string) =>
  Boolean(u && u.trim() !== '' && u !== '/uploads/placeholder.png' && u !== '/bukti_struk.png');
type ApprovalStatus = "Menunggu PM" | "Menunggu Keuangan" | "Dicairkan" | "Ditolak";

type ApprovalStep = {
  label: string;
  sublabel: string;
  state: "done" | "active" | "pending" | "rejected";
};

type Submission = {
  id: string;
  dbId: number;
  proyekId?: number | null;
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
  ketAlokasi: number;
  ketRealisasi: number;
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



type Tab = "Menunggu Approval" | "Diteruskan" | "Selesai";

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Menunggu Approval");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProyek, setSelectedProyek] = useState("Semua");
  const [isProyekOpen, setIsProyekOpen] = useState(false);

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

  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  type ProyekListResponse = { projects: { id: number; nama: string }[] };
  type ReimbursementsResponse = { reimbursements: any[] };

  const { data: proyekData } = useApi<ProyekListResponse>("/api/proyek?role=Superadmin&limit=1000");
  const { data, isLoading } = useApi<ReimbursementsResponse>("/api/reimbursements?role=Superadmin");

  const allProjects = proyekData?.projects ?? [];
  const selectedProyekNama = allProjects.find((p) => String(p.id) === selectedProyek)?.nama;

  const mappedSubmissions = useMemo(() => {
    const reimbursements = data?.reimbursements ?? [];

    return reimbursements.map((r: any): Submission => {
    const pmApproval = r.approvals?.find((a: any) => a.level === 'PM');
    const financeApproval = r.approvals?.find((a: any) => a.level === 'KEUANGAN');

    const submissionTime = r.createdAt || r.created_at || r.tanggalStruk || r.tanggal;

    const rejectedApproval = r.approvals?.find((a: any) => a.status === 'REJECTED');
    const rejectionReason = rejectedApproval?.alasan || rejectedApproval?.catatan || "";

    const steps: ApprovalStep[] = [
      {
        label: "Pengajuan dikirim",
        sublabel: `${r.user?.nama || 'Karyawan'} • ${submissionTime ? formatApprovalDate(submissionTime) : '-'}`,
        state: "done"
      },
      {
        label: "Validasi Project Manager",
        sublabel: pmApproval
          ? `${pmApproval.approver?.nama || 'Project Manager'} • ${formatApprovalDate(pmApproval.timestamp)}`
          : (r.status === 'SUBMITTED' ? "Menunggu" : "Menunggu • –"),
        state: pmApproval
          ? (pmApproval.status === 'REJECTED' ? "rejected" : "done")
          : (r.status === 'SUBMITTED' ? "active" : "pending")
      },
      {
        label: "Verifikasi Tim Keuangan",
        sublabel: financeApproval
          ? `${financeApproval.approver?.nama || 'Tim Keuangan'} • ${formatApprovalDate(financeApproval.timestamp)}`
          : (r.status === 'APPROVED_BY_PM' ? "Menunggu" : "Menunggu • –"),
        state: financeApproval
          ? (financeApproval.status === 'REJECTED' ? "rejected" : "done")
          : (r.status === 'APPROVED_BY_PM' ? "active" : "pending")
      },
      {
        label: "Dicairkan",
        sublabel: r.status === 'APPROVED'
          ? `Jurnal otomatis • ${financeApproval ? formatApprovalDate(financeApproval.timestamp) : ''}`
          : "Jurnal otomatis • –",
        state: r.status === 'APPROVED' ? "done" : "pending"
      }
    ];

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

    const initials = r.user?.nama ? getInitials(r.user.nama) : 'KY';

    const isRealisasi = r.tipe === 'Realisasi Anggaran';

    return {
      id: `RB-${String(r.id)}`,
      dbId: r.id,
      proyekId: r.proyekId ?? r.proyek?.id ?? null,
      date: submissionTime ? formatApprovalDate(submissionTime) : 'N/A',
      notaDate: r.tanggalStruk ? formatTanggal(r.tanggalStruk) : 'N/A',
      submittedAt: submissionTime ? formatApprovalDate(submissionTime) : 'N/A',

      merchant: r.merchant || r.nama || 'N/A',
      project: r.proyek?.nama || 'N/A',
      main: (() => {
        const mNama = r.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain || r.posAnggaran?.namaPos;
        const mKode = r.posAnggaran?.mainKode || r.posAnggaran?.subAnggaran?.mainAnggaran?.kode;
        if (!mNama) return 'N/A';
        return mKode ? `(${mKode}) ${mNama}` : mNama;
      })(),
      sub: (() => {
        const sNama = r.keteranganAnggaran?.subAnggaran?.namaSub || r.posAnggaran?.subAnggaran?.namaSub;
        const sKode = r.posAnggaran?.subKode || r.posAnggaran?.subAnggaran?.kode;
        if (!sNama) return 'N/A';
        return sKode ? `(${sKode}) ${sNama}` : sNama;
      })(),
      ket: r.keteranganAnggaran?.keterangan || r.posAnggaran?.deskripsi || 'N/A',
      ketAlokasi: Number(r.keteranganAnggaran?.nominalAlokasi || 0),
      ketRealisasi: Number(r.keteranganAnggaran?.nominalRealisasi || 0),

      catatanPm: pmApproval?.catatan || "",
      catatanKeuangan: financeApproval?.catatan || "",
      rejectionReason,
      amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
      amountRaw: Number(r.nominal),
      status: displayStatus,
      pengaju: r.user?.nama || 'Karyawan',
      pengajuInitials: initials,
      keterangan: r.deskripsi || r.ocrData?.keterangan || '-',
      steps,
      strukUrl: r.urlStruk || r.strukUrl,
      isRealisasi
    };
    });
  }, [data]);

  const filteredData = useMemo(() => mappedSubmissions.filter((item: any) => {
    const matchesTab = activeTab === "Menunggu Approval"
      ? item.status === "Menunggu PM" : activeTab === "Diteruskan"
      ? item.status === "Menunggu Keuangan"
      : (item.status === "Dicairkan" || item.status === "Ditolak");

    const matchesProyek = selectedProyek === "Semua" || String(item.proyekId) === selectedProyek;

    const matchesSearch = searchQuery
      ? (item.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pengaju?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesTab && matchesProyek && matchesSearch;
  }), [mappedSubmissions, activeTab, searchQuery, selectedProyek]);

  const selected = filteredData.find((item: any) => item.id === selectedId) || filteredData[0] || null;

  const tabCounts = useMemo((): Record<Tab, number> => {
    const counts: Record<Tab, number> = { "Menunggu Approval": 0, Diteruskan: 0, Selesai: 0 };
    for (const s of mappedSubmissions) {
      if (s.status === "Menunggu PM") counts["Menunggu Approval"]++;
      else if (s.status === "Menunggu Keuangan") counts.Diteruskan++;
      else counts.Selesai++;
    }
    return counts;
  }, [mappedSubmissions]);

  const processApproval = async (action: 'APPROVE' | 'REJECT', alasanPenolakan?: string) => {
    if (!selected) return;
    const isReject = action === 'REJECT';
    if (isReject) setIsSubmittingReject(true);
    else setIsApproving(true);

    try {
      const res = await fetch(`/api/reimbursements/${selected.dbId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          catatan,
          ...(isReject && { alasan: alasanPenolakan })
        })
      });
      const result = await res.json();
      if (res.ok) {
        if (isReject) {
          setRejectedLabel(selected.merchant || selected.pengaju || 'Pengajuan');
          setIsRejectModalOpen(false);
          setShowRejectSuccess(true);
        } else {
          setApprovedLabel(selected.merchant || selected.pengaju || 'Pengajuan');
          setShowApproveConfirm(false);
          setShowApproveSuccess(true);
        }
        setCatatan("");
        invalidate("/api/reimbursements?role=Superadmin", "/api/dashboard", "/api/notifications");
      } else {
        setErrorMessage("Gagal memproses pengajuan: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan sistem saat memproses pengajuan.");
    } finally {
      setIsSubmittingReject(false);
      setIsApproving(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  return (
    <div className="flex h-full w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 bg-[#f9f8f4] overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Approval</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
            </p>

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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProyekOpen(!isProyekOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <Filter size={14} className="text-stone-500" />
                    <span className="truncate max-w-[140px]">{selectedProyekNama ?? "Semua Proyek"}</span>
                  </button>

                  {isProyekOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-semibold text-stone-500 bg-stone-50 border-b border-stone-100">
                        Pilih Proyek
                      </div>
                      <ul className="max-h-56 overflow-y-auto custom-scrollbar">
                        <li>
                          <button
                            type="button"
                            onClick={() => { setSelectedProyek("Semua"); setIsProyekOpen(false); }}
                            className="w-full text-left px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate pr-2">Semua Proyek</span>
                            {selectedProyek === "Semua" && <Check size={14} className="text-blue-500 flex-shrink-0" />}
                          </button>
                        </li>
                        {allProjects.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => { setSelectedProyek(String(p.id)); setIsProyekOpen(false); }}
                              className="w-full text-left px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 flex items-center justify-between transition cursor-pointer"
                            >
                              <span className="truncate pr-2">{p.nama}</span>
                              {selectedProyek === String(p.id) && <Check size={14} className="text-blue-500 flex-shrink-0" />}
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
            <div className="w-full lg:w-[400px] flex flex-col gap-2 shrink-0 lg:overflow-y-auto pb-4 pr-1 custom-scrollbar">
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
                filteredData.map((item: any) => {
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
                                {item.pengaju} <span className="font-normal text-stone-400 ">· {item.id}</span>
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
              ) : !selected ? (
                <div className="flex-1 flex items-center justify-center text-stone-400 font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    <div className="border-b border-stone-100 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-stone-400 font-medium ">{selected.id}</p>
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

                    <div className="bg-[#f5f4ef] rounded-xl px-5 py-4 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                        Total Pengajuan
                      </p>
                      <p className="text-[32px] font-bold text-stone-900">{selected.amount}</p>
                    </div>

                    {selected.ket && selected.ket !== 'N/A' && (() => {
                      const alokasi = selected.ketAlokasi || 0;
                      const realisasi = selected.ketRealisasi || 0;
                      const sisa = alokasi - realisasi;
                      const percentage = alokasi > 0 ? Math.round((realisasi / alokasi) * 100) : 0;
                      const isOver = sisa < 0;

                      return (
                        <div className="bg-white border border-[#e6e1d4] rounded-2xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-semibold text-stone-800 truncate" title={`${selected.isRealisasi ? 'Realisasi Anggaran' : 'Reimbursement'} – KET · ${selected.ket}`}>
                              {selected.isRealisasi ? 'Realisasi Anggaran' : 'Reimbursement'} – KET · {selected.ket}
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
                              <span className="font-semibold text-stone-900 ">{<CompactNominal value={alokasi} compactThreshold={1_000_000_000_000} />}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Realisasi</span>
                              <span className="font-semibold text-stone-900 ">{<CompactNominal value={realisasi} compactThreshold={1_000_000_000_000} />}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500 font-medium">Sisa</span>
                              <span className={`font-semibold ${isOver ? 'text-[#902f33]' : 'text-stone-900'}`}>
                                {isOver ? (
                                  <>
                                    - <CompactNominal value={Math.abs(sisa)} compactThreshold={1_000_000_000_000} />
                                  </>
                                ) : (
                                  <CompactNominal value={sisa} compactThreshold={1_000_000_000_000} />
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

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
                            <span className="font-bold  text-stone-900 text-right">{value}</span>
                          ) : (
                            <span className="font-semibold text-stone-800 text-right max-w-[60%]">{value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {!hasStrukUrl(selected.strukUrl) ? (
                      <div className="space-y-1">
                        <label className="text-[13px] text-stone-500">
                          {selected.isRealisasi ? 'Bukti Gambar' : 'Bukti Struk / Dokumen'}
                        </label>
                        <div className="bg-[#f5f4ef] border border-stone-200/80 rounded-xl px-4 py-3 text-[13px] text-stone-400 italic">
                          Tidak ada bukti {selected.isRealisasi ? 'gambar' : 'struk'} yang dilampirkan.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[13px] text-stone-500">Bukti Struk / Dokumen</label>
                          {selected.strukUrl!.toLowerCase().split('?')[0].endsWith('.pdf') ? (
                            <button
                              type="button"
                              onClick={() => setZoomImageUrl(selected.strukUrl!)}
                              className="border border-stone-200 rounded-xl p-3 bg-[#fdfaf5] flex items-center justify-between gap-3 max-w-xs cursor-pointer hover:border-stone-400 transition w-full text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center shrink-0 border border-red-200">
                                  PDF
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-stone-800 truncate">Dokumen Bukti (PDF)</p>
                                  <p className="text-[10px] text-stone-400 truncate">Klik untuk membuka file</p>
                                </div>
                              </div>
                              <span className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold shrink-0 hover:bg-stone-800 transition">
                                Buka PDF
                              </span>
                            </button>
                          ) : (
                            <div
                              onClick={() => setZoomImageUrl(selected.strukUrl!)}
                              className="border border-stone-200 rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
                            >
                              <img
                                src={selected.strukUrl}
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
                    )}

                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Rincian</p>
                      <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                        {selected.keterangan}
                      </div>
                    </div>

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

                    <div>
                      <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                      <div className="flex flex-col gap-0">
                        {selected.steps.map((step: any, i: number) => (
                          <div key={i} className="flex gap-3">
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
                    {hasStrukUrl(selected.strukUrl) ? (
                      <a
                        href={selected.strukUrl}
                        download={`bukti-${selected.id}${getFileExt(selected.strukUrl!)}`}
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

                    {selected.status === "Menunggu PM" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsRejectModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#fee2e2] text-[#be123c] rounded-full text-[13px] font-semibold hover:bg-[#fecaca] transition cursor-pointer"
                        >
                          <X size={14} />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => setShowApproveConfirm(true)}
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

      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={(alasanTeks) => processApproval('REJECT', alasanTeks)}
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
        onConfirm={() => processApproval('APPROVE')}
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

      <ImageLightbox
        url={zoomImageUrl}
        onClose={() => setZoomImageUrl(null)}
        isPdf={zoomImageUrl?.toLowerCase().split('?')[0].endsWith('.pdf') ?? false}
      />
    </div>
  );
}

