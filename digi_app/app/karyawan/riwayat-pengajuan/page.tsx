"use client";

import React, { useState, useEffect } from "react";
import { Filter, Eye, X, Download, RefreshCw, CheckCircle2, Clock, XCircle, AlertTriangle, BookOpen } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

type Submission = {
  id: string;
  dbId: string;
  date: string;
  merchant: string;
  project: string;
  pos: string;
  amount: string;
  status: "Menunggu PM" | "Verifikasi Keuangan" | "Dicairkan" | "Ditolak";
};

const TABS = ["Semua", "Menunggu PM", "Menunggu Keuangan", "Dicairkan", "Ditolak"];

function formatTanggal(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

function formatTanggalLong(iso: string) {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  const [y, m, d] = parts;
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const mIdx = parseInt(m) - 1;
  return `${parseInt(d)} ${bulan[mIdx] || m} ${y}`;
}

// Generate a display ID like "RB-2026-004"
function makeDisplayId(id: string, index: number) {
  const num = String(index + 1).padStart(3, "0");
  return `RB-2026-${num}`;
}

const getStatusBadge = (status: Submission["status"]) => {
  switch (status) {
    case "Menunggu PM":
      return "bg-[#fdf3e6] text-[#b46b2b]";
    case "Verifikasi Keuangan":
      return "bg-[#e1f5fe] text-[#0277bd]";
    case "Dicairkan":
      return "bg-[#e2f1eb] text-[#117a5b]";
    case "Ditolak":
      return "bg-[#fee2e2] text-[#be123c]";
    default:
      return "bg-stone-100 text-stone-600";
  }
};

// Step status type
type StepStatus = "done" | "active" | "waiting" | "rejected";

interface ApprovalStep {
  label: string;
  sublabel: string;
  status: StepStatus;
}

function getApprovalSteps(raw: any): ApprovalStep[] {
  const status = raw.status;
  const approvals = raw.approvals || [];
  const pmApproval = approvals.find((a: any) => a.level === "PM");
  const financeApproval = approvals.find((a: any) => a.level === "FINANCE" || a.level === "KEUANGAN");

  const pmApprover = pmApproval?.approver?.nama || "Muhammad Alvin Ababli";
  const financeApprover = financeApproval?.approver?.nama || "Muhammad Zaini";

  const formatApprovalDate = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getDate()} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const submittedDate = raw.createdAt || raw.ocrData?.tanggal;
  const submittedLabel = submittedDate
    ? `Alif Ihsan • ${formatApprovalDate(submittedDate)}`
    : "Alif Ihsan";

  if (status === "SUBMITTED") {
    return [
      { label: "Pengajuan dikirim", sublabel: submittedLabel, status: "done" },
      { label: "Validasi Project Manager", sublabel: `${pmApprover} • Menunggu`, status: "active" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • —", status: "waiting" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • —", status: "waiting" },
    ];
  }

  if (status === "APPROVED_BY_PM") {
    const pmDate = pmApproval ? formatApprovalDate(pmApproval.timestamp) : "";
    return [
      { label: "Pengajuan dikirim", sublabel: submittedLabel, status: "done" },
      { label: "Validasi Project Manager", sublabel: `${pmApprover}${pmDate ? " • " + pmDate : ""}`, status: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • —", status: "active" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • —", status: "waiting" },
    ];
  }

  if (status === "APPROVED") {
    const pmDate = pmApproval ? formatApprovalDate(pmApproval.timestamp) : "";
    const finDate = financeApproval ? formatApprovalDate(financeApproval.timestamp) : "";
    const disbursedDate = raw.disbursedAt ? formatApprovalDate(raw.disbursedAt) : finDate;
    return [
      { label: "Pengajuan dikirim", sublabel: submittedLabel, status: "done" },
      { label: "Validasi Project Manager", sublabel: `${pmApprover}${pmDate ? " • " + pmDate : ""}`, status: "done" },
      { label: "Verifikasi Tim Keuangan", sublabel: `${financeApprover}${finDate ? " • " + finDate : ""}`, status: "done" },
      { label: "Dicairkan", sublabel: `Jurnal otomatis${disbursedDate ? " • " + disbursedDate : ""}`, status: "done" },
    ];
  }

  if (status === "REJECTED") {
    const pmDate = pmApproval ? formatApprovalDate(pmApproval.timestamp) : "";
    return [
      { label: "Pengajuan dikirim", sublabel: submittedLabel, status: "done" },
      { label: "Validasi Project Manager", sublabel: `${pmApprover}${pmDate ? " • " + pmDate : ""}`, status: "rejected" },
      { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu • —", status: "waiting" },
      { label: "Dicairkan", sublabel: "Jurnal otomatis • —", status: "waiting" },
    ];
  }

  return [
    { label: "Pengajuan dikirim", sublabel: submittedLabel, status: "done" },
    { label: "Validasi Project Manager", sublabel: "Menunggu", status: "active" },
    { label: "Verifikasi Tim Keuangan", sublabel: "Menunggu", status: "waiting" },
    { label: "Dicairkan", sublabel: "Jurnal otomatis", status: "waiting" },
  ];
}

function StepIcon({ status, number }: { status: StepStatus; number: number }) {
  if (status === "done") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#1a7a5e] flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#be123c] flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2L10 10M10 2L2 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-7 h-7 rounded-full bg-[#d97706] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
        {number}
      </div>
    );
  }
  // waiting
  return (
    <div className="w-7 h-7 rounded-full bg-white border-2 border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-400 text-xs font-semibold">
      {number}
    </div>
  );
}

function DetailPanel({ raw, displayId, onClose }: { raw: any; displayId: string; onClose: () => void }) {
  const status = raw.status;
  const uiStatus =
    status === "SUBMITTED" ? "Menunggu PM" :
    status === "APPROVED_BY_PM" ? "Verifikasi Keuangan" :
    status === "APPROVED" ? "Dicairkan" : "Ditolak";

  const steps = getApprovalSteps(raw);
  const rejectionNote = raw.approvals?.find((a: any) => a.status === "REJECTED")?.catatan || "";

  const nominalFormatted = `Rp ${Number(raw.nominal).toLocaleString("id-ID")}`;
  const tanggal = raw.ocrData?.tanggal ? formatTanggalLong(raw.ocrData.tanggal) : "N/A";

  const statusCardClass =
    status === "SUBMITTED" ? "bg-[#fdf9f2] border-[#f5e4c0]" :
    status === "APPROVED_BY_PM" ? "bg-[#f0f8ff] border-[#bce0f7]" :
    status === "APPROVED" ? "bg-[#f0faf5] border-[#b3dece]" :
    "bg-[#fff5f5] border-[#fbc9c9]";

  const statusTextClass =
    status === "SUBMITTED" ? "text-[#b46b2b] bg-[#fdf3e6]" :
    status === "APPROVED_BY_PM" ? "text-[#0277bd] bg-[#e1f5fe]" :
    status === "APPROVED" ? "text-[#117a5b] bg-[#e2f1eb]" :
    "text-[#be123c] bg-[#fee2e2]";

  const nominalClass =
    status === "SUBMITTED" ? "text-[#b46b2b]" :
    status === "APPROVED_BY_PM" ? "text-[#0277bd]" :
    status === "APPROVED" ? "text-[#117a5b]" :
    "text-[#be123c]";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-150">
        <p className="text-[11px] font-mono text-stone-400 mb-1">{displayId}</p>
        <h2 className="text-[20px] font-bold text-stone-900 leading-tight">{raw.ocrData?.merchant || "N/A"}</h2>
        <p className="text-[13px] text-stone-500 mt-0.5">{raw.proyek?.nama || "N/A"}</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Status + Nominal Card */}
        <div className={`rounded-xl border p-4 ${statusCardClass}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">STATUS</p>
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${statusTextClass}`}>
                {uiStatus}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">NOMINAL</p>
              <p className={`text-[22px] font-bold tracking-tight ${nominalClass}`}>{nominalFormatted}</p>
            </div>
          </div>
        </div>

        {/* Rejection reason */}
        {status === "REJECTED" && rejectionNote && (
          <div className="rounded-xl border border-[#fbc9c9] bg-[#fff5f5] p-4 flex gap-3">
            <AlertTriangle size={16} className="text-[#be123c] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-[#be123c] mb-1">Alasan Penolakan</p>
              <p className="text-[12px] text-stone-700 leading-relaxed">{rejectionNote}</p>
            </div>
          </div>
        )}
        {status === "REJECTED" && !rejectionNote && (
          <div className="rounded-xl border border-[#fbc9c9] bg-[#fff5f5] p-4 flex gap-3">
            <AlertTriangle size={16} className="text-[#be123c] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-[#be123c] mb-1">Alasan Penolakan</p>
              <p className="text-[12px] text-stone-700 leading-relaxed">Pos konsumsi proyek ini sudah melebihi alokasi bulan ini. Silakan ajukan ulang bulan depan</p>
            </div>
          </div>
        )}

        {/* Detail Pengajuan */}
        <div>
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-2">Detail Pengajuan</p>
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            {[
              { label: "Pos Anggaran", value: raw.posAnggaran?.deskripsi || "N/A" },
              { label: "Tanggal Transaksi", value: tanggal },
              { label: "Merchant", value: raw.ocrData?.merchant || "N/A" },
              { label: "Anti-Fraud", value: raw.antiFraud || "Aman" },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex justify-between items-center px-4 py-3 ${i < arr.length - 1 ? "border-b border-stone-100" : ""}`}>
                <span className="text-[12px] text-stone-500">{row.label}</span>
                <span className="text-[12px] font-semibold text-stone-800 text-right max-w-[55%]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keterangan */}
        {raw.ocrData?.keterangan && (
          <div>
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-2">Keterangan</p>
            <div className="rounded-xl border border-stone-200 bg-[#fcfbf8] px-4 py-3">
              <p className="text-[12px] text-stone-600 italic leading-relaxed">"{raw.ocrData.keterangan}"</p>
            </div>
          </div>
        )}
        {!raw.ocrData?.keterangan && (
          <div>
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-2">Keterangan</p>
            <div className="rounded-xl border border-stone-200 bg-[#fcfbf8] px-4 py-3">
              <p className="text-[12px] text-stone-600 italic leading-relaxed">"BBM kendaraan operasional pertengahan April"</p>
            </div>
          </div>
        )}

        {/* Riwayat Approval */}
        <div>
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-3">Riwayat Approval</p>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={step.status} number={i + 1} />
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 min-h-[20px] ${step.status === "done" ? "bg-[#1a7a5e]" : "bg-stone-200"}`} />
                  )}
                </div>
                <div className="pb-4 pt-0.5">
                  <p className={`text-[13px] font-semibold leading-tight ${step.status === "waiting" ? "text-stone-400" : "text-stone-800"}`}>
                    {step.label}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${step.status === "waiting" ? "text-stone-300" : "text-stone-400"}`}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bukti Struk & Jurnal Akuntansi */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-2">Bukti Struk</p>
              <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden aspect-[3/2] flex items-center justify-center">
                {raw.strukUrl ? (
                  <img
                    src={raw.strukUrl}
                    alt="Bukti Struk"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/bukti_struk.png"; }}
                  />
                ) : (
                  <img
                    src="/bukti_struk.png"
                    alt="Bukti Struk"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide mb-2">
                Jurnal Akuntansi
                <span className="font-normal text-stone-400 normal-case ml-1">(akan ter-generate setelah dicairkan)</span>
              </p>
              <div className="rounded-xl border border-stone-200 bg-stone-50 aspect-[3/2] flex flex-col items-center justify-center gap-1.5">
                <BookOpen size={20} className="text-stone-300" />
                <p className="text-[11px] text-stone-400">Belum tersedia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-stone-150 bg-white flex items-center justify-between gap-2">
        <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-xl text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer">
          <Download size={14} />
          Download bukti
        </button>
        <div className="flex items-center gap-2">
          {status === "REJECTED" && (
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a7a5e] hover:bg-[#15644c] text-white rounded-xl text-[12px] font-semibold transition cursor-pointer">
              <RefreshCw size={14} />
              Ajukan ulang
            </button>
          )}
          {status !== "REJECTED" && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-xl text-[12px] font-medium text-stone-500 hover:bg-stone-50 transition cursor-pointer"
            >
              <X size={14} />
              Batalkan
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[12px] font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RiwayatPengajuanPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rawReimbursements, setRawReimbursements] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedDisplayId, setSelectedDisplayId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);


// Jika menggunakan database nyata ini merupakan kode yang menghubungkan dengan database  
// //useEffect(() => {
//     fetch('/api/reimbursements')
//       .then(res => res.json())
//       .then(data => {
//         if (data.reimbursements) {
//           setRawReimbursements(data.reimbursements);
//           const mapped = data.reimbursements.map((r: any) => ({
//             id: String(r.id).substring(0, 8).toUpperCase(),
//             dbId: r.id,
//             date: r.ocrData?.tanggal ? formatTanggal(r.ocrData.tanggal) : 'N/A',
//             merchant: r.ocrData?.merchant || 'N/A',
//             project: r.proyek?.nama || 'N/A',
//             pos: r.posAnggaran?.deskripsi || 'N/A',
//             amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
//             status: r.status === 'SUBMITTED' ? 'Menunggu PM' :
//                     r.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
//                     r.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'
//           }));
//           setSubmissions(mapped);
//         }
//       })
//       .catch(err => console.error('Error fetching submissions:', err))
//       .finally(() => setIsLoading(false));


  useEffect(() => {
    // --- DATA DUMMY (keempat skenario status) ---
    const DUMMY_REIMBURSEMENTS = [
      // 1. SUBMITTED → Menunggu PM
      {
        id: "dummy-001",
        nominal: 150000,
        status: "SUBMITTED",
        createdAt: "2026-03-12T08:30:00.000Z",
        strukUrl: "/bukti_struk.png",
        antiFraud: "Aman",
        ocrData: {
          merchant: "Gramedia Merdeka",
          tanggal: "2026-03-12",
          keterangan: "Renovasi kantor cabang Bandung, pembelian cat dan perlengkapan renovasi lainnya",
        },
        proyek: { nama: "Renovasi Kantor Cabang Bandung" },
        posAnggaran: { deskripsi: "Renovasi" },
        approvals: [
          {
            level: "PM",
            status: "PENDING",
            approver: { nama: "Muhammad Alvin Ababil" },
            timestamp: null,
            catatan: null,
          },
        ],
      },
      // 2. APPROVED_BY_PM → Verifikasi Keuangan
      {
        id: "dummy-002",
        nominal: 450000,
        status: "APPROVED_BY_PM",
        createdAt: "2026-04-05T09:15:00.000Z",
        strukUrl: "/bukti_struk.png",
        antiFraud: "Aman",
        ocrData: {
          merchant: "SPBU Pertamina 34.121",
          tanggal: "2026-04-05",
          keterangan: "Biaya bahan pembangunan gudang fase 2",
        },
        proyek: { nama: "Pembangunan Gudang Fase 2" },
        posAnggaran: { deskripsi: "Pembangunan" },
        approvals: [
          {
            level: "PM",
            status: "APPROVED",
            approver: { nama: "Muhammad Alvin Ababil" },
            timestamp: "2026-04-06T10:00:00.000Z",
            catatan: null,
          },
          {
            level: "FINANCE",
            status: "PENDING",
            approver: { nama: "Muhammad Zaini" },
            timestamp: null,
            catatan: null,
          },
        ],
      },
      // 3. APPROVED → Dicairkan
      {
        id: "dummy-003",
        nominal: 150000,
        status: "APPROVED",
        createdAt: "2026-05-19T07:45:00.000Z",
        disbursedAt: "2026-05-20T14:30:00.000Z",
        strukUrl: "/bukti_struk.png",
        antiFraud: "Aman",
        ocrData: {
          merchant: "Solaria Resto Bandung",
          tanggal: "2026-05-19",
          keterangan: "Makan siang dengan klien PT SPBU Pertamina dalam rangka presentasi proposal",
        },
        proyek: { nama: "Pembangunan Gudang Fase 2" },
        posAnggaran: { deskripsi: "Konsumsi" },
        approvals: [
          {
            level: "PM",
            status: "APPROVED",
            approver: { nama: "Muhammad Alvin Ababil" },
            timestamp: "2026-05-19T09:00:00.000Z",
            catatan: null,
          },
          {
            level: "FINANCE",
            status: "APPROVED",
            approver: { nama: "Muhammad Zaini" },
            timestamp: "2026-05-20T11:20:00.000Z",
            catatan: null,
          },
        ],
      },
      // 4. REJECTED → Ditolak
      {
        id: "dummy-004",
        nominal: 150000,
        status: "REJECTED",
        createdAt: "2026-05-18T13:00:00.000Z",
        strukUrl: "/bukti_struk.png",
        antiFraud: "Aman",
        ocrData: {
          merchant: "Indomaret Bandung",
          tanggal: "2026-05-18",
          keterangan: "Pembangunan Data Center Bandung Tier-3",
        },
        proyek: { nama: "Data Center Bandung Tier-3" },
        posAnggaran: { deskripsi: "Pembangunan" },
        approvals: [
          {
            level: "PM",
            status: "REJECTED",
            approver: { nama: "Muhammad Alvin Ababil" },
            timestamp: "2026-05-19T10:30:00.000Z",
            catatan: "Biaya pembangunan bulan ini sudah melebihi alokasi. Silakan ajukan ulang bulan depan",
          }
        ],
      },
    ];
    // --- AKHIR DATA DUMMY ---

    const mapped = DUMMY_REIMBURSEMENTS.map((r: any, i: number) => ({
      id: makeDisplayId(r.id, i),
      dbId: r.id,
      date: r.ocrData?.tanggal ? formatTanggal(r.ocrData.tanggal) : 'N/A',
      merchant: r.ocrData?.merchant || 'N/A',
      project: r.proyek?.nama || 'N/A',
      pos: r.posAnggaran?.deskripsi || 'N/A',
      amount: `Rp ${Number(r.nominal).toLocaleString('id-ID')}`,
      status: r.status === 'SUBMITTED' ? 'Menunggu PM' :
              r.status === 'APPROVED_BY_PM' ? 'Verifikasi Keuangan' :
              r.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'
    }));
    setRawReimbursements(DUMMY_REIMBURSEMENTS);
    setSubmissions(mapped);
    setIsLoading(false);
  }, []);

  const filteredData = submissions.filter((item) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Menunggu Keuangan") return item.status === "Verifikasi Keuangan";
    return item.status === activeTab;
  });

  const handleOpenDetail = (dbId: string, displayId: string) => {
    const raw = rawReimbursements.find(r => r.id === dbId);
    if (raw) {
      setSelectedItem(raw);
      setSelectedDisplayId(displayId);
      setTimeout(() => setPanelVisible(true), 10);
    }
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-stone-900">Riwayat Pengajuan</h1>
            <p className="text-[14px] text-stone-500 mt-1.5">
              Semua reimbursement yang pernah kamu ajukan, lengkap dengan status dan jejak audit.
            </p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer">
              <Filter size={14} className="text-stone-500" /> Filter
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#f5f4ef] border-b border-stone-200 text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 rounded-tl-2xl">ID Pengajuan</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Proyek</th>
                  <th className="px-6 py-4">Pos</th>
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
                  filteredData.map((item, index) => (
                    <tr
                      key={item.dbId}
                      onClick={() => handleOpenDetail(item.dbId, item.id)}
                      className={`hover:bg-stone-50 transition border-b border-stone-100 cursor-pointer ${
                        index === filteredData.length - 1 ? "border-none" : ""
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
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-stone-800">{item.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
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
                  ))
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
        </main>
      </div>

      {/* Overlay */}
      {selectedItem && (
        <div
          className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${panelVisible ? "opacity-100" : "opacity-0"}`}
          onClick={handleClosePanel}
        />
      )}

      {/* Right Slide Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-[460px] bg-white shadow-2xl border-l border-stone-200 flex flex-col transition-transform duration-300 ease-in-out ${
          selectedItem && panelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedItem && (
          <>
            {/* Close button */}
            <button
              onClick={handleClosePanel}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition z-10 cursor-pointer"
            >
              <X size={16} />
            </button>
            <DetailPanel
              raw={selectedItem}
              displayId={selectedDisplayId}
              onClose={handleClosePanel}
            />
          </>
        )}
      </div>
    </div>
  );
}