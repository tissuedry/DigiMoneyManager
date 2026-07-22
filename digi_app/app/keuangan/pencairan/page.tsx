"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Download, Zap, X, Check, Filter, ZoomIn, ZoomOut, RotateCcw, RotateCw
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

  // Count items for each tab
  const countDiteruskan = reimbursements.filter((item: any) => item.status === 'APPROVED_BY_PM').length;
  const countSelesai = reimbursements.filter((item: any) => item.status === 'APPROVED' || item.status === 'REJECTED').length;

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
    <div className="flex h-screen w-full bg-[#F6F4EF] text-[#14130F] overflow-hidden font-sans">

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F6F4EF] overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-8 py-6">

          {/* Header Title & Subtitle */}
          <div className="shrink-0 mb-6">
            <h1 className="text-2xl font-bold text-[#14130F]">Antrian Pencairan</h1>
            <p className="text-[13px] text-[#6A6660] mt-1.5">
              Pengajuan yang telah divalidasi PM dan siap dicairkan. Jurnal Debit-Kredit akan ter-generate otomatis.
            </p>

            {/* Filter & Tab Switcher Bar */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex bg-[#F1EEE6] rounded-2xl p-1 border border-[#E6E1D4] items-center gap-1">
                <button
                  onClick={() => { setActiveTab('diteruskan'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition ${activeTab === 'diteruskan'
                    ? "bg-white text-[#14130F] shadow-sm"
                    : "text-[#6A6660] hover:text-[#14130F]"
                    }`}
                >
                  Diteruskan ({countDiteruskan})
                </button>
                <button
                  onClick={() => { setActiveTab('selesai'); handleSelect(null); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition ${activeTab === 'selesai'
                    ? "bg-white text-[#14130F] shadow-sm"
                    : "text-[#6A6660] hover:text-[#14130F]"
                    }`}
                >
                  Selesai ({countSelesai})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari nama pengaju atau proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-1.5 text-xs bg-white border border-[#E4E0D9] rounded-xl outline-none focus:border-stone-400 transition w-48 sm:w-64"
                />
                <button
                  type="button"
                  className="flex items-center gap-1.5 bg-white border border-[#E4E0D9] text-[#14130F] rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-stone-50 transition"
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
                <div className="text-center py-8 text-xs font-semibold text-[#6A6660]">Memuat antrian pencairan...</div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-8 text-xs font-semibold text-[#6A6660]">Tidak ada pengajuan pencairan.</div>
              ) : (
                filteredList.map((item: any) => {
                  const initials = item.user?.nama ? item.user.nama.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'AI';
                  const active = isAllSelected || String(selectedItem?.id) === String(item.id);
                  const formattedNominal = Number(item.nominal).toLocaleString('id-ID');
                  const itemCode = `RB-${String(item.id).padStart(4, '0')}`;
                  const vendorTitle = item.ocrData?.namaVendor || item.ocrData?.keterangan || item.posAnggaran?.deskripsi || 'Pengajuan Reimbursement';
                  const projectTitle = item.proyek?.nama || 'Proyek';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(String(item.id))}
                      className={`p-3.5 rounded-xl border flex justify-between items-center transition cursor-pointer ${active
                        ? "bg-[#B2DCCD] border-[#E6E1D4] shadow-sm"
                        : "bg-white border-[#E6E1D4] hover:border-stone-300 shadow-sm"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-[#D1E9E1] text-[#005836] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">
                            <span className="text-[13px] font-bold text-[#14130F]">{item.user?.nama || 'Karyawan'}</span>
                            <span className="text-[11px] text-[#6A6660] ml-1">· {itemCode}</span>
                          </div>
                          <p className="text-[11px] text-[#6A6660] truncate mt-0.5">
                            {vendorTitle} · {projectTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="text-[13px] font-bold font-mono text-[#14130F]">
                          <span className="text-[#6A6660] text-[11px]">Rp </span>{formattedNominal}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${item.status === 'APPROVED_BY_PM' ? 'text-[#005D8D] bg-[#E2F1F8] border-sky-100' :
                          item.status === 'APPROVED' ? 'text-[#005836] bg-[#D1E9E1] border-emerald-100' :
                            'text-[#902F33] bg-rose-50 border-rose-100'
                          }`}>
                          {item.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                            item.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT COLUMN: DETAIL VIEW */}
            <div className="flex-1 flex flex-col bg-white border border-[#E4E0D9] rounded-2xl shadow-sm overflow-hidden h-full">
              {!selectedItem ? (
                <div className="flex-1 flex items-center justify-center text-[#6A6660] font-semibold text-xs">
                  Pilih pengajuan dari daftar antrian untuk melihat detail
                </div>
              ) : (
                <>
                  {/* Scrollable Detail Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Header Detail */}
                    <div className="flex justify-between items-start border-b border-[#E6E1D4] pb-4">
                      <div>
                        <span className="text-[11px] text-[#6A6660] font-mono tracking-wider">
                          RB-{String(selectedItem.id).padStart(4, '0')}
                        </span>
                        <h2 className="text-xl font-bold text-[#14130F] mt-0.5 leading-tight">
                          {selectedItem.ocrData?.namaVendor || selectedItem.ocrData?.keterangan || selectedItem.posAnggaran?.deskripsi || selectedItem.proyek?.nama}
                        </h2>
                        <p className="text-[11px] text-[#6A6660] mt-1">
                          diajukan oleh <span className="font-semibold text-[#14130F]">{selectedItem.user?.nama}</span> pada {formatTanggalWaktu(selectedItem.createdAt || selectedItem.ocrData?.submittedAt || selectedItem.ocrData?.tanggal)}
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${selectedItem.status === 'APPROVED_BY_PM' ? 'text-[#005D8D] bg-[#E2F1F8] border-sky-100' :
                        selectedItem.status === 'APPROVED' ? 'text-[#005836] bg-[#D1E9E1] border-emerald-100' :
                          'text-[#902F33] bg-rose-50 border-rose-100'
                        }`}>
                        {selectedItem.status === 'APPROVED_BY_PM' ? 'Menunggu Keuangan' :
                          selectedItem.status === 'APPROVED' ? 'Dicairkan' : 'Ditolak'}
                      </span>
                    </div>

                    {/* Table Properties */}
                    <div className="space-y-0 text-[12px]">
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Proyek</span>
                        <span className="font-medium text-[#14130F] text-right">{selectedItem.proyek?.nama}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Pos Anggaran</span>
                        <span className="font-medium text-[#14130F] text-right">{selectedItem.posAnggaran?.namaPos || selectedItem.posAnggaran?.deskripsi}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Tanggal Transaksi</span>
                        <span className="font-medium text-[#14130F] text-right">{selectedItem.ocrData?.tanggal ? formatTanggal(selectedItem.ocrData.tanggal) : '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Pengaju</span>
                        <span className="font-medium text-[#14130F] text-right">{selectedItem.user?.nama}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Divalidasi PM</span>
                        <span className="font-medium text-[#14130F] text-right">{pmApproval?.approver?.nama || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#E6E1D4]">
                        <span className="text-[#6A6660]">Nominal</span>
                        <span className="font-bold font-mono text-[#14130F] text-right">
                          <span className="text-[#9A948B] font-normal">Rp </span>{Number(selectedItem.nominal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Preview Struk Upload */}
                    {selectedItem.strukUrl && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#14130F]">Bukti Struk</label>
                        <div
                          onClick={() => handleOpenZoom(selectedItem.strukUrl)}
                          className="border border-[#E4E0D9] rounded-xl overflow-hidden max-w-xs bg-stone-50 p-2 flex items-center justify-center cursor-pointer hover:border-stone-400 transition group relative"
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
                      <div className="text-[12px] font-semibold text-[#14130F]">Preview Jurnal Akuntansi (Auto-generated)</div>
                      <div className="bg-gradient-to-b from-[#FEFCF6] to-[#F7F3E8] border border-[#E4E0D9] rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[#9A948B] text-[12px] font-bold">
                            {selectedItem.jurnalAkuntansi?.[0] ? `JE-${String(selectedItem.jurnalAkuntansi[0].id).substring(0, 8).toUpperCase()}` : `JE-2026-${String(selectedItem.id).padStart(4, '0')}`}
                          </span>
                        </div>
                        <div className="text-[#14130F] font-medium text-[11px]">
                          Pencairan reimbursement {selectedItem.user?.nama} - {selectedItem.posAnggaran?.deskripsi || selectedItem.posAnggaran?.namaPos}
                        </div>

                        {selectedItem.status === 'APPROVED_BY_PM' ? (
                          <div className="space-y-2 pt-1 border-t border-[#E4E0D9]/60">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-[#005836] font-bold shrink-0">Dr</span>
                              <select
                                value={debitAccount}
                                onChange={(e) => setDebitAccount(e.target.value)}
                                className="flex-1 text-[11px] font-mono bg-white border border-[#E4E0D9] rounded-md p-1 outline-none focus:ring-1 focus:ring-emerald-500"
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
                              <span className="font-mono text-[#14130F] text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[11px] pl-3">
                              <span className="text-[#902F33] font-bold shrink-0">Cr</span>
                              <select
                                value={creditAccount}
                                onChange={(e) => setCreditAccount(e.target.value)}
                                className="flex-1 text-[11px] font-mono bg-white border border-[#E4E0D9] rounded-md p-1 outline-none focus:ring-1 focus:ring-emerald-500"
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
                              <span className="font-mono text-[#14130F] text-[12px] shrink-0 font-bold">
                                Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 pt-1 border-t border-[#E4E0D9]/60 text-[11px]">
                            {selectedItem.jurnalAkuntansi && selectedItem.jurnalAkuntansi.length > 0 ? (
                              selectedItem.jurnalAkuntansi.map((j: any) => (
                                <React.Fragment key={j.id}>
                                  <div className="flex justify-between items-center">
                                    <span>
                                      <span className="text-[#005836] font-bold mr-1">Dr</span>
                                      <span className="text-[#6A6660]"> {j.noAkunDebit} {j.akunDebit?.namaAkun || coaList.find((c: any) => c.nomorAkun === j.noAkunDebit)?.namaAkun || 'Beban Material Proyek'}</span>
                                    </span>
                                    <span className="font-mono text-[#14130F] font-bold">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                  <div className="flex justify-between items-center pl-3">
                                    <span>
                                      <span className="text-[#902F33] font-bold mr-1">Cr</span>
                                      <span className="text-[#6A6660]"> {j.noAkunKredit} {j.akunKredit?.namaAkun || coaList.find((c: any) => c.nomorAkun === j.noAkunKredit)?.namaAkun || 'Bank BCA - Operasional'}</span>
                                    </span>
                                    <span className="font-mono text-[#14130F] font-bold">Rp {Number(j.nominal || selectedItem.nominal).toLocaleString('id-ID')}</span>
                                  </div>
                                </React.Fragment>
                              ))
                            ) : (
                              <React.Fragment>
                                <div className="flex justify-between items-center">
                                  <span>
                                    <span className="text-[#005836] font-bold mr-1">Dr</span>
                                    <span className="text-[#6A6660]"> 5-5101 Beban Material Proyek</span>
                                  </span>
                                  <span className="font-mono text-[#14130F] font-bold">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center pl-3">
                                  <span>
                                    <span className="text-[#902F33] font-bold mr-1">Cr</span>
                                    <span className="text-[#6A6660]"> 1-1102 Bank BCA - Operasional</span>
                                  </span>
                                  <span className="font-mono text-[#14130F] font-bold">Rp {Number(selectedItem.nominal).toLocaleString('id-ID')}</span>
                                </div>
                              </React.Fragment>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keterangan dari pengaju */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-stone-500">Keterangan dari pengaju</div>
                      <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                        “{selectedItem.ocrData?.keterangan || selectedItem.ocrData?.raw || 'Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site'}”.
                      </div>
                    </div>

                    {/* Catatan dari PM */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-stone-500">Catatan dari Project Manager ({pmApproval?.approver?.nama || 'Project Manager'})</div>
                      <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                        {pmApproval?.catatan || '-'}
                      </div>
                    </div>

                    {/* Catatan Keuangan */}
                    {selectedItem.status === 'APPROVED_BY_PM' ? (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-stone-500">Catatan Keuangan (Opsional)</div>
                        <textarea
                          placeholder="Tambahkan catatan jika ada..."
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          className="w-full bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] focus:outline-none border border-[#E4E0D9] transition resize-none h-18"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-stone-500">Catatan Keuangan ({financeApproval?.approver?.nama || 'Tim Keuangan'})</div>
                        <div className="bg-[#FCF7F0] rounded-xl p-3 text-[12px] text-[#14130F] italic">
                          {financeApproval?.catatan || '-'}
                        </div>
                      </div>
                    )}

                    <div className="border-b border-[#E6E1D4] pt-1" />

                    {/* Alur Approval */}
                    <div className="space-y-2.5">
                      <div className="text-[13px] font-bold text-stone-800">Alur Approval</div>
                      <div className="relative flex flex-col gap-2.5 pl-0.5">
                        {/* Connecting Line */}
                        <div className="absolute left-[13px] top-[12px] bottom-[12px] w-[1px] bg-[#E4E0D9]" />

                        {/* Step 1 */}
                        <div className="flex items-center gap-2.5 z-10">
                          <div className="w-[26px] h-[26px] rounded-full bg-[#009162] flex items-center justify-center shrink-0">
                            <Check size={13} className="text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-stone-800">Pengajuan dikirim</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {approvalSteps[0]?.sublabel || `${selectedItem.user?.nama || 'Karyawan'} • -`}
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-center gap-2.5 z-10">
                          {approvalSteps[1]?.state === 'done' ? (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#009162] flex items-center justify-center shrink-0">
                              <Check size={13} className="text-white" strokeWidth={2.5} />
                            </div>
                          ) : (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#F6F4EF] border border-[#E4E0D9] text-[#9A948B] font-semibold text-[12px] flex items-center justify-center shrink-0">
                              2
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-stone-800">Validasi Project Manager</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {approvalSteps[1]?.sublabel || 'Menunggu • -'}
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-center gap-2.5 z-10">
                          {approvalSteps[2]?.state === 'done' ? (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#009162] flex items-center justify-center shrink-0">
                              <Check size={13} className="text-white" strokeWidth={2.5} />
                            </div>
                          ) : approvalSteps[2]?.state === 'active' ? (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#D8953D] ring-2 ring-[#F5E4CE] text-white font-semibold text-[12px] flex items-center justify-center shrink-0">
                              3
                            </div>
                          ) : (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#F6F4EF] border border-[#E4E0D9] text-[#9A948B] font-semibold text-[12px] flex items-center justify-center shrink-0">
                              3
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-stone-800">Verifikasi Tim Keuangan</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {approvalSteps[2]?.sublabel || 'Menunggu • -'}
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex items-center gap-2.5 z-10">
                          {approvalSteps[3]?.state === 'done' ? (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#009162] flex items-center justify-center shrink-0">
                              <Check size={13} className="text-white" strokeWidth={2.5} />
                            </div>
                          ) : (
                            <div className="w-[26px] h-[26px] rounded-full bg-[#F6F4EF] border border-[#E4E0D9] text-[#9A948B] font-semibold text-[12px] flex items-center justify-center shrink-0">
                              4
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-stone-800">Dicairkan</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              {approvalSteps[3]?.sublabel || 'Jurnal otomatis • -'}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                  {/* Action Footer (Fixed di bawah) */}
                  <div className="border-t border-[#E6E1D4] px-6 py-3.5 bg-white flex items-center justify-between shrink-0">
                    <a
                      href={selectedItem.strukUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#14130F] bg-white hover:bg-stone-50 transition px-3.5 py-2 rounded-lg border border-[#E4E0D9]"
                    >
                      <Download size={14} />
                      <span>Download bukti</span>
                    </a>

                    {selectedItem.status === 'APPROVED_BY_PM' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleProcess('REJECT')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#902F33] hover:bg-[#782528] transition px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                        >
                          <X size={14} strokeWidth={2.5} />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleProcess('APPROVE')}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#009162] hover:bg-[#007b53] transition px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                        >
                          <Zap size={14} fill="currentColor" className="text-white" />
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
            className={`relative max-w-[92vw] max-h-[92vh] overflow-hidden p-2 flex items-center justify-center select-none ${
              zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
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
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F4EF]">
        <div className="text-[#6A6660] font-medium text-xs">Memuat halaman...</div>
      </div>
    }>
      <PencairanContent />
    </Suspense>
  );
}