"use client";

import React, { useState, useEffect } from "react";
import { Filter, Download, X, Check } from "lucide-react";
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';

// ─── Types ───────────────────────────────────────────────────────────────────

type ApprovalStatus = "Menunggu PM" | "Verifikasi Keuangan" | "Dicairkan" | "Ditolak";

type ApprovalStep = {
  label: string;
  sublabel: string;
  state: "done" | "active" | "pending" | "rejected";
};

type Submission = {
  id: string;
  dbId: number;
  date: string; // tanggal transaksi
  submittedAt: string; // waktu pengajuan untuk alur approval
  merchant: string;
  project: string;
  pos: string;
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
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
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

// Warna avatar inisial
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

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "Menunggu Saya" | "Diteruskan" | "Selesai";

export default function AntrianApprovalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Menunggu Saya");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catatan, setCatatan] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/reimbursements");
      const data = await res.json();
      if (data.reimbursements) {
        setReimbursements(data.reimbursements);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        fetchData();
      } else {
        alert("Gagal memproses pengajuan: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat memproses pengajuan.");
    }
  };

  // Convert API reimbursements to Submission type
  const mappedSubmissions = reimbursements.map((r: any): Submission => {
    const pmApproval = r.approvals?.find((a: any) => a.level === 'PM');
    const financeApproval = r.approvals?.find((a: any) => a.level === 'KEUANGAN');

    // Build steps dynamically
    const steps: ApprovalStep[] = [
      {
        label: "Pengajuan dikirim",
        sublabel: `${r.user?.nama || 'Karyawan'} • ${r.createdAt ? formatDateTime(r.createdAt) : '-'}`,
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
    if (r.status === 'APPROVED_BY_PM') displayStatus = "Verifikasi Keuangan";
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
      date: r.ocrData?.tanggal ? formatTanggal(r.ocrData.tanggal) : 'N/A',
      submittedAt: r.createdAt ? formatDateTime(r.createdAt) : 'N/A',
      merchant: r.ocrData?.merchant || 'N/A',
      project: r.proyek?.nama || 'N/A',
      pos: r.posAnggaran?.deskripsi || r.posAnggaran?.namaPos || 'N/A',
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
  const filteredData = mappedSubmissions.filter((item) => {
    if (activeTab === "Menunggu Saya") return item.status === "Menunggu PM";
    if (activeTab === "Diteruskan") return item.status === "Verifikasi Keuangan";
    if (activeTab === "Selesai") return item.status === "Dicairkan" || item.status === "Ditolak";
    return false;
  });

  // Reset pilihan saat tab berganti
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedIndex(0);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const selected = filteredData[selectedIndex] ?? null;

  const tabCounts: Record<Tab, number> = {
    "Menunggu Saya": mappedSubmissions.filter((s) => s.status === "Menunggu PM").length,
    Diteruskan: mappedSubmissions.filter((s) => s.status === "Verifikasi Keuangan").length,
    Selesai: mappedSubmissions.filter((s) => s.status === "Dicairkan" || s.status === "Ditolak").length,
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f9f8f4] font-sans text-stone-800">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        onClose={closeSidebar}
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenSidebar={openSidebar} />

        <main className="flex-1 p-8 overflow-y-auto">
          {/* Judul */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Antrian Approval</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Validasi pengajuan reimbursement dari tim. Pastikan pengajuan sesuai dengan RAB dan pos anggaran.
            </p>
          </div>

          {/* Tab + Filter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60">
              {(["Menunggu Saya", "Diteruskan", "Selesai"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab
                      ? "bg-white text-stone-900 font-semibold shadow-sm"
                      : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
                  }`}
                >
                  {tab}
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab ? "bg-stone-100 text-stone-600" : "bg-stone-200/70 text-stone-400"
                    }`}
                  >
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-[13px] font-medium text-stone-700 hover:bg-stone-50 transition cursor-pointer">
              <Filter size={14} className="text-stone-500" /> Filter
            </button>
          </div>

          {/* Layout dua kolom */}
          <div className="flex gap-5 items-start">
            {/* ── Kolom Kiri: Daftar ── */}
            <div className="w-[340px] flex-shrink-0 flex flex-col gap-2">
              {isLoading ? (
                <div className="bg-white border border-stone-200 rounded-2xl px-6 py-10 text-center text-stone-400 text-[13px]">
                  Memuat data pengajuan...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl px-6 py-10 text-center text-stone-400 text-[13px]">
                  Tidak ada data.
                </div>
              ) : (
                filteredData.map((item, idx) => (
                  <button
                    key={`${item.id}-${item.pengaju}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-150 cursor-pointer ${
                      selectedIndex === idx
                        ? "bg-[#e8f4ef] border-[#a8d5be] shadow-sm"
                        : "bg-white border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar inisial */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5 ${getAvatarColor(
                          item.pengajuInitials
                        )}`}
                      >
                        {item.pengajuInitials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[12px] font-bold text-stone-800 truncate">
                            {item.pengaju}{" "}
                            <span className="font-normal text-stone-400 font-mono">· {item.id}</span>
                          </p>
                          <p className="text-[12px] font-bold text-stone-800 flex-shrink-0">
                            {item.amount}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-stone-400 truncate">
                            {item.merchant} · {item.project}
                          </p>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* ── Kolom Kanan: Detail ── */}
            {selected && (
              <div className="flex-1 bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Header detail */}
                <div className="px-6 pt-6 pb-4 border-b border-stone-100">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-[12px] text-stone-400 font-medium font-mono">{selected.id}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusBadge(
                        selected.status
                      )}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <h2 className="text-[22px] font-bold text-stone-900">{selected.merchant}</h2>
                  <p className="text-[13px] text-stone-400 mt-0.5">
                    oleh{" "}
                    <span className="font-semibold text-stone-600">{selected.pengaju}</span> ·{" "}
                    {selected.submittedAt}
                  </p>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">
                  {/* Nominal */}
                  <div className="bg-[#f5f4ef] rounded-xl px-5 py-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                      Total Pengajuan
                    </p>
                    <p className="text-[32px] font-bold text-stone-900">{selected.amount}</p>
                  </div>

                  {/* Info baris */}
                  {[
                    { label: "Proyek", value: selected.project },
                    { label: "Pos Anggaran", value: selected.pos },
                    { label: "Tanggal Transaksi", value: selected.date },
                    { label: "Pengaju", value: selected.pengaju },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-stone-400">{label}</span>
                      <span className="font-semibold text-stone-800 text-right max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}

                  {/* Keterangan */}
                  <div>
                    <p className="text-[13px] text-stone-500 mb-2">Keterangan dari pengaju</p>
                    <div className="bg-[#fdf9f4] border border-stone-200/60 rounded-xl px-4 py-3 text-[13px] text-stone-700 italic">
                      {selected.keterangan}
                    </div>
                  </div>

                  {/* Catatan opsional — hanya tampil jika status Menunggu PM */}
                  {selected.status === "Menunggu PM" && (
                    <div>
                      <p className="text-[13px] text-stone-500 mb-2">Catatan untuk Keuangan (opsional)</p>
                      <textarea
                        rows={3}
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Misal: 'Pengajuan sesuai dengan jadwal site visit minggu ini.'"
                        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[13px] text-stone-700 placeholder:text-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                      />
                    </div>
                  )}

                  {/* Alur Approval */}
                  <div>
                    <p className="text-[13px] font-bold text-stone-800 mb-4">Alur Approval</p>
                    <div className="flex flex-col gap-0">
                      {selected.steps.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          {/* Ikon + garis vertikal */}
                          <div className="flex flex-col items-center">
                            <StepIcon state={step.state} number={i + 1} />
                            {i < selected.steps.length - 1 && (
                              <div
                                className={`w-px flex-1 my-1 ${
                                  step.state === "done" ? "bg-[#2d6a4f]" : "bg-stone-200"
                                }`}
                                style={{ minHeight: "20px" }}
                              />
                            )}
                          </div>
                          {/* Teks */}
                          <div className="pb-4">
                            <p
                              className={`text-[13px] font-semibold ${
                                step.state === "pending" ? "text-stone-400" : "text-stone-800"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-[11px] text-stone-400 mt-0.5">{step.sublabel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tombol aksi */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    {selected.strukUrl ? (
                      <a 
                        href={selected.strukUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                      >
                        <Download size={14} /> Download bukti
                      </a>
                    ) : (
                      <button className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-full text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition">
                        <Download size={14} /> Download bukti
                      </button>
                    )}

                    {selected.status === "Menunggu PM" && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleProcess('REJECT')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#fee2e2] text-[#be123c] rounded-full text-[13px] font-semibold hover:bg-[#fecaca] transition cursor-pointer"
                        >
                          <X size={14} /> Tolak
                        </button>
                        <button 
                          onClick={() => handleProcess('APPROVE')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] text-white rounded-full text-[13px] font-semibold hover:bg-[#245c43] transition shadow-sm cursor-pointer"
                        >
                          <Check size={14} /> Teruskan ke Keuangan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}