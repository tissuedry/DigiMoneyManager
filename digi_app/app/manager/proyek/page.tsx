"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, Loader2, Check, X, Calendar, Briefcase, DollarSign, Plus, Trash2, Settings, ArrowUpRight, ArrowDownLeft, Receipt, Eye, ClipboardList } from "lucide-react";

type Project = {
  id: number;
  nama: string;
  deskripsi: string | null;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget?: {
    id: number;
    rabTotal: string;
    totalPengeluaran: string;
    totalReimbursement: string;
    sisaBudget: string;
    posAnggaran: { id: number; namaPos: string; nominalAlokasi: string; deskripsi?: string }[];
  } | null;
};

type LogAktivitas = {
  id: number;
  tanggal: string;
  tipe: "INFLOW" | "OUTFLOW";
  keterangan: string;
  nominal: number;
  kategori: string;
};

type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
};

function formatReimbursementDate(r: any): string {
  const ocrTanggal = r.ocrData && typeof r.ocrData === 'object' && 'tanggal' in r.ocrData ? (r.ocrData as any).tanggal : null;
  if (ocrTanggal) {
    const d = new Date(ocrTanggal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  const ocrSubmitted = r.ocrData && typeof r.ocrData === 'object' && 'submittedAt' in r.ocrData ? (r.ocrData as any).submittedAt : null;
  const rawDate = r.createdAt || r.timestamp || ocrSubmitted;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "-";
}

export default function KelolaProyekPage() {
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const statuses = ['Semua', 'Planning', 'Active', 'Done', 'Canceled'];

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAssignMembers, setShowAssignMembers] = useState<Project | null>(null);
  const [showInitBudget, setShowInitBudget] = useState<Project | null>(null);
  const [showProjectDetail, setShowProjectDetail] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isDirectEdit, setIsDirectEdit] = useState(false);
  const [detailedProjectInfo, setDetailedProjectInfo] = useState<any | null>(null);
  const [showDetailBudgetModal, setShowDetailBudgetModal] = useState(false);
  const [showPendingPmModal, setShowPendingPmModal] = useState(false);
  const [rejectingPengajuan, setRejectingPengajuan] = useState<any | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Record<number, boolean>>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [expandedKet, setExpandedKet] = useState<Record<string, boolean>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"4M" | "12M" | "YTD">("12M");

  // Pengajuan anggaran pending (Direktur review)
  const [pendingPengajuan, setPendingPengajuan] = useState<any[]>([]);
  const [loadingPengajuan, setLoadingPengajuan] = useState(false);
  const [expandedPengajuan, setExpandedPengajuan] = useState<Record<number, boolean>>({});

  const detailTotalRAB = parseFloat(detailedProjectInfo?.budget?.rabTotal) || 0;
  const detailTotalTerpakai = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
  const detailPercentUsed = detailTotalRAB > 0 ? Math.round((detailTotalTerpakai / detailTotalRAB) * 100) : 0;
  const detailBarWidth = Math.min(detailPercentUsed, 100);
  const sudahReimburseNominal = parseFloat(detailedProjectInfo?.budget?.totalReimbursement) || 0;
  const belumReimburseNominal = Math.max(0, detailTotalTerpakai - sudahReimburseNominal);

  const getSelectedCashFlow = () => {
    if (!detailedProjectInfo) return [];
    if (timeFilter === "4M") return detailedProjectInfo.cashFlow4m || [];
    if (timeFilter === "YTD") return detailedProjectInfo.cashFlowYtd || [];
    return detailedProjectInfo.cashFlow12m || [];
  };
  const activeCashFlow = getSelectedCashFlow();

  const inflowNominal = activeCashFlow.reduce((sum: number, c: any) => sum + (c.inflow || 0), 0);
  const outflowNominal = activeCashFlow.reduce((sum: number, c: any) => sum + (c.outflow || 0), 0);
  const netCashNominal = inflowNominal - outflowNominal;

  // Mock Data Log Aktivitas Uang Proyek
  const [activityLogs] = useState<LogAktivitas[]>([
    { id: 1, tanggal: "2026-06-15", tipe: "OUTFLOW", keterangan: "Pembelian Lisensi Software Audit", nominal: 12500000, kategori: "Perlengkapan & ATK" },
    { id: 2, tanggal: "2026-06-20", tipe: "OUTFLOW", keterangan: "Tiket Pesawat Tim Evaluator ke Site", nominal: 4800000, kategori: "Akomodasi & Transportasi" },
    { id: 3, tanggal: "2026-07-02", tipe: "INFLOW", keterangan: "Termin 1 Pembayaran Klien", nominal: 3600000000, kategori: "Pendapatan Proyek" },
    { id: 4, tanggal: "2026-07-05", tipe: "OUTFLOW", keterangan: "Konsumsi Rapat Pleno Evaluasi", nominal: 735000, kategori: "Konsumsi" },
  ]);

  // Forms state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const [projectForm, setProjectForm] = useState({
    nama: "",
    deskripsi: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    status: "AKTIF",
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    deskripsi: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    status: "AKTIF",
  });

  // Assign members state
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<{ userId: number; role: string }[]>([]);

  // Budget initialization state
  const [rabTotal, setRabTotal] = useState("");
  const [posAnggaranList, setPosAnggaranList] = useState<{ deskripsi: string; nominalAlokasi: string }[]>([
    { deskripsi: "", nominalAlokasi: "" },
  ]);

  const [activeTab, setActiveTab] = useState<"ringkasan" | "anggaran" | "tim">("ringkasan");
  const [teamRows, setTeamRows] = useState<{ id: string; role: string; userId: string; isLocked: boolean }[]>([
    { id: "row-pm", role: "Project Manager", userId: "", isLocked: true },
    { id: "row-1", role: "", userId: "", isLocked: false }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proyekRes, membersRes] = await Promise.all([
        fetch(`/api/proyek?search=${searchQuery}&status=${activeStatus}`),
        fetch("/api/manager/members"),
      ]);
      const [proyekData, membersData] = await Promise.all([proyekRes.json(), membersRes.json()]);
      setProjects(proyekData.projects ?? []);
      setMembers(membersData.members ?? []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPengajuan = async (proyekId: number) => {
    setLoadingPengajuan(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/pengajuan-anggaran?status=PENDING`);
      const data = await res.json();
      const list = data.pengajuan || [];
      setPendingPengajuan(list);

      // Automatically select all items
      const initial: Record<number, boolean> = {};
      list.forEach((prop: any) => {
        (prop.items || []).forEach((it: any) => {
          initial[it.id] = true;
        });
      });
      setSelectedPendingIds(initial);
    } catch {
      setPendingPengajuan([]);
    } finally {
      setLoadingPengajuan(false);
    }
  };


  const handleBulkReview = async (action: 'APPROVE' | 'REJECT', catatan?: string) => {
    if (!detailedProjectInfo) return;
    if (loadingDetail) return;

    // Gather all selected item IDs
    const selectedItemIds = Object.keys(selectedPendingIds)
      .map(Number)
      .filter(id => selectedPendingIds[id]);

    if (selectedItemIds.length === 0) return;

    // Flatten all items from pendingPengajuan to find corresponding proposal IDs
    const proposalsToProcess = new Set<number>();
    (pendingPengajuan || []).forEach((prop: any) => {
      const hasSelectedChild = (prop.items || []).some((it: any) => selectedItemIds.includes(it.id));
      if (hasSelectedChild) {
        proposalsToProcess.add(prop.id);
      }
    });

    const proposalIds = Array.from(proposalsToProcess);
    if (proposalIds.length === 0) return;

    setLoadingDetail(true);
    setFormError("");
    setSuccess("");

    try {
      // Process each proposal in series/parallel
      const results = await Promise.all(
        proposalIds.map(propId =>
          fetch(`/api/pengajuan-anggaran/${propId}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action, catatan }),
          })
        )
      );

      const allOk = results.every(res => res.ok);
      if (allOk) {
        alert(action === 'APPROVE' ? `Berhasil menyetujui ${proposalIds.length} pengajuan!` : `Berhasil menolak ${proposalIds.length} pengajuan.`);

        // Reset rejection states
        setRejectingPengajuan(null);
        setRejectionReason("");
        setShowPendingPmModal(false);

        // Refresh detail
        const detailRes = await fetch(`/api/proyek/${detailedProjectInfo.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.project) {
          setDetailedProjectInfo(detailData.project);
        }
        fetchData();
      } else {
        alert("Beberapa pengajuan gagal diproses.");
        setFormError("Beberapa pengajuan gagal diproses.");
      }
    } catch {
      alert("Terjadi kesalahan koneksi saat memproses pengajuan");
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeStatus]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/proyek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: projectForm.nama,
          deskripsi: projectForm.deskripsi,
          tanggalMulai: projectForm.tanggalMulai,
          tanggalSelesai: projectForm.tanggalSelesai || undefined,
          status: projectForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal membuat proyek");
        return;
      }

      setSuccess(`Proyek "${projectForm.nama}" berhasil dibuat!`);
      setProjectForm({ nama: "", deskripsi: "", tanggalMulai: "", tanggalSelesai: "", status: "AKTIF" });
      setShowAddProject(false);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetailModal = async (project: Project) => {
    setIsDirectEdit(false);
    setShowProjectDetail(project);
    setEditMode(false);
    setLoadingDetail(true);
    setDetailedProjectInfo(null);
    setFormError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/proyek/${project.id}`);
      const data = await res.json();
      if (data.project.users && data.project.users.length > 0) {
        const pmUser = data.project.users.find((u: any) => u.roleInProyek === "Project Manager");
        const otherUsers = data.project.users.filter((u: any) => u.roleInProyek !== "Project Manager");

        const mappedRows = [
          { id: "row-pm", role: "Project Manager", userId: pmUser ? String(pmUser.id) : "", isLocked: true },
          ...otherUsers.map((u: any, i: number) => ({ id: `row-loaded-${i}-${u.id}`, role: u.divisiInProyek || "", userId: String(u.id), isLocked: false }))
        ];
        setTeamRows(mappedRows);
      } else {
        setTeamRows([{ id: "row-pm", role: "Project Manager", userId: "", isLocked: true }, { id: `row-empty-init`, role: "", userId: "", isLocked: false }]);
      }
      if (res.ok && data.project) {
        setDetailedProjectInfo(data.project);
        setEditForm({
          nama: data.project.nama,
          deskripsi: data.project.deskripsi || "",
          tanggalMulai: data.project.tanggalMulai ? data.project.tanggalMulai.split('T')[0] : "",
          tanggalSelesai: data.project.tanggalSelesai ? data.project.tanggalSelesai.split('T')[0] : "",
          status: data.project.status,
        });
      } else {
        setFormError(data.message || "Gagal mengambil detail proyek");
      }
    } catch {
      setFormError("Gagal memuat data detail dari server");
    } finally {
      setLoadingDetail(false);
      setActiveTab("ringkasan");
    }
  };

  const handleDirectEdit = (project: Project) => {
    setIsDirectEdit(true);
    setShowProjectDetail(null);
    setFormError("");
    setSuccess("");

    setShowProjectDetail(project);
    setEditMode(true);

    setEditForm({
      nama: project.nama,
      deskripsi: project.deskripsi || "",
      tanggalMulai: project.tanggalMulai ? project.tanggalMulai.split('T')[0] : "",
      tanggalSelesai: project.tanggalSelesai ? project.tanggalSelesai.split('T')[0] : "",
      status: project.status,
    });
  };

  const handleCloseEdit = () => {
    setEditMode(false);
    if (isDirectEdit) {
      setShowProjectDetail(null);
      setIsDirectEdit(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProjectDetail) return;
    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/proyek/${showProjectDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editForm.nama,
          deskripsi: editForm.deskripsi,
          tanggalMulai: editForm.tanggalMulai,
          tanggalSelesai: editForm.tanggalSelesai || null,
          status: editForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal memperbarui proyek");
        return;
      }

      setSuccess(`Proyek "${editForm.nama}" berhasil diperbarui!`);
      setEditMode(false);
      setShowProjectDetail(null); // UBAH DISINI: Reset agar sidebar detail tidak otomatis terbuka
      setIsDirectEdit(false);
      fetchData(); // Refresh data grid utama
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateProject = async () => {
    if (!showProjectDetail) return;
    setFormError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${showProjectDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editForm.nama,
          deskripsi: editForm.deskripsi,
          tanggalMulai: editForm.tanggalMulai,
          tanggalSelesai: editForm.tanggalSelesai || null,
          status: "AKTIF",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal mengaktifkan kembali proyek");
        return;
      }
      setSuccess(`Proyek "${editForm.nama}" berhasil diaktifkan kembali!`);
      fetchData();
      handleOpenDetailModal(data.project || showProjectDetail);
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignMembers) return;
    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/manager/proyek/${showAssignMembers.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: selectedProjectMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal mengatur anggota proyek");
        return;
      }

      setSuccess(`Anggota proyek untuk "${showAssignMembers.nama}" berhasil disimpan!`);
      setShowAssignMembers(null);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTeamRow = () => {
    const newId = `row-new-${Date.now()}`;
    setTeamRows([...teamRows, { id: newId, role: "", userId: "", isLocked: false }]);
  };

  const handleRemoveTeamRow = (id: string) => {
    setTeamRows(teamRows.filter((r) => r.id !== id));
  };

  const handleSaveTeamRows = async () => {
    if (!showProjectDetail) return;
    setFormError("");
    setSuccess("");

    const pmRow = teamRows.find((r) => r.id === "row-pm");
    if (!pmRow || !pmRow.userId) {
      setFormError("Project Manager Utama harus dipilih");
      scrollToSection("tim-sec");
      return;
    }

    const selectedUserIds = teamRows
      .filter((r) => r.userId !== "")
      .map((r) => r.userId);
    const hasDuplicates = selectedUserIds.some((val, i) => selectedUserIds.indexOf(val) !== i);
    if (hasDuplicates) {
      setFormError("Setiap anggota tim hanya boleh dimasukkan satu kali");
      scrollToSection("tim-sec");
      return;
    }

    const otherRows = teamRows.filter((r) => r.id !== "row-pm");

    for (let i = 0; i < otherRows.length; i++) {
      const r = otherRows[i];
      const rowNum = i + 1;
      if (!r.role.trim() && !r.userId) {
        setFormError(`Baris anggota ke-${rowNum} masih kosong. Harap isi Role dan Nama, atau hapus baris tersebut.`);
        scrollToSection("tim-sec");
        return;
      }
      if (!r.role.trim()) {
        setFormError(`Role untuk anggota pada baris ke-${rowNum} belum diisi.`);
        scrollToSection("tim-sec");
        return;
      }
      if (!r.userId) {
        setFormError(`Nama anggota pada baris ke-${rowNum} belum dipilih.`);
        scrollToSection("tim-sec");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payloadMembers = teamRows
        .filter((r) => {
          if (r.id === "row-pm") return r.userId !== "";
          return r.userId !== "" || r.role.trim() !== "";
        })
        .map((r) => {
          if (r.id === "row-pm") {
            return {
              userId: parseInt(r.userId, 10),
              role: "Project Manager",
              divisi: null,
            };
          } else {
            return {
              userId: parseInt(r.userId, 10),
              role: "Anggota Lapangan",
              divisi: r.role.trim(),
            };
          }
        });

      const res = await fetch(`/api/manager/proyek/${showProjectDetail.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: payloadMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ? `${data.message}: ${data.error}` : (data.message || "Gagal menyimpan penugasan tim"));
        return;
      }

      await handleOpenDetailModal(showProjectDetail);
      setSuccess("Penugasan tim berhasil disimpan!");
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi saat menyimpan tim");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInitBudget) return;
    setFormError("");
    setSuccess("");

    const total = ribuanToNumber(rabTotal);
    if (total <= 0) {
      setFormError("Total Nilai Proyek harus berupa angka positif");
      return;
    }

    const sum = posAnggaranList.reduce((acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0), 0);
    if (sum > total) {
      setFormError(`Jumlah alokasi item (Rp ${sum.toLocaleString("id-ID")}) tidak boleh melebihi total Nilai Proyek (Rp ${total.toLocaleString("id-ID")})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${showInitBudget.id}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rabTotal: total,
          posAnggaran: posAnggaranList.map((pos) => ({
            deskripsi: pos.deskripsi,
            nominalAlokasi: ribuanToNumber(pos.nominalAlokasi),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal menginisialisasi budget");
        return;
      }

      setSuccess(`Budget Proyek untuk "${showInitBudget.nama}" berhasil diinisialisasi!`);
      setShowInitBudget(null);
      setRabTotal("");
      setPosAnggaranList([
        { deskripsi: "Akomodasi & Transportasi", nominalAlokasi: "" },
        { deskripsi: "Konsumsi", nominalAlokasi: "" },
        { deskripsi: "Perlengkapan & ATK", nominalAlokasi: "" },
      ]);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (valStr: string | number | undefined) => {
    if (!valStr) return "Rp 0";
    const num = typeof valStr === "string" ? parseFloat(valStr) : valStr;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatSummaryRupiah = (num: number) => {
    if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} M`;
    if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} jt`;
    if (num >= 1e3) return `Rp ${(num / 1e3).toFixed(2)} rb`;
    return `Rp ${num.toFixed(2)}`;
  };

  const formatRibuan = (value: string) => {
    // 1. Buang semua karakter selain angka
    const angkaMurni = value.replace(/[^0-9]/g, "");

    // 2. Jika kosong, langsung kembalikan string kosong
    if (!angkaMurni) return "";

    // 3. Regex otomatis: Menyisipkan titik setiap kelipatan 3 digit dari belakang (jika di atas 999)
    return angkaMurni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const ribuanToNumber = (stringRibuan: string) => {
    if (!stringRibuan) return 0;
    // Menghapus tanda titik agar kembali menjadi angka biasa (e.g. "2.500.000" -> 2500000)
    return parseFloat(stringRibuan.replace(/\./g, "")) || 0;
  };

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "PLANNING":
        return "bg-[#f5ebd7] text-[#935a16] border-transparent";
      case "AKTIF":
      case "ACTIVE":
        return "bg-[#d8f3dc] text-[#1b4332] border-transparent";
      case "CANCELED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "DONE":
        return "bg-purple-50 text-purple-700 border-purple-100";
      default:
        return "bg-stone-50 text-stone-500 border-stone-100";
    }
  };
  const currentStatus = detailedProjectInfo?.status || showProjectDetail?.status;
  const masterBudgetOptions = Array.from(
    new Set(
      projects
        .flatMap((p) => p.budget?.posAnggaran ?? [])
        .map((pos) => pos.namaPos || pos.deskripsi)
        .filter(Boolean)
    )
  ) as string[];
  return (
    <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">Kelola Proyek</h1>
          <p className="text-sm text-stone-500 mt-1">
            Pantau daftar proyek, tambahkan proyek baru, assign anggota tim, dan konfigurasi alokasi dana proyek.
          </p>
        </div>
        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] text-white text-[13px] font-bold rounded-xl shadow-sm transition cursor-pointer whitespace-nowrap"
        >
          <FolderPlus size={16} />
          Tambah Proyek
        </button>
      </div>

      {/* Baris Pencarian dan Filter Status */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari proyek, klien, atau ID..."
            className="w-full px-5 py-3 bg-white border border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400/80 shadow-sm focus:outline-none focus:border-stone-300"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#f5f4f0] p-1.5 rounded-2xl text-[13px] text-stone-500 font-medium overflow-x-auto scrollbar-none">
          {statuses.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-1.5 whitespace-nowrap transition rounded-xl text-[13px] ${isActive
                  ? 'bg-white text-stone-900 font-bold shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
                  }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* List of Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-stone-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">Memuat data proyek...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400 space-y-3">
          <Briefcase size={40} className="mx-auto text-stone-300" />
          <p className="text-sm font-medium">Belum ada proyek aktif terdaftar.</p>
          <button
            onClick={() => setShowAddProject(true)}
            className="px-4 py-2 bg-[#2d6a4f] hover:bg-[#1e5038] text-white text-xs font-bold rounded-xl"
          >
            Buat Proyek Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const hasBudget = !!project.budget;
            const totalRAB = hasBudget ? parseFloat(project.budget!.rabTotal) : 0;
            const sisa = hasBudget ? parseFloat(project.budget!.sisaBudget) : 0;

            return (
              <div
                key={project.id}
                className="bg-white border border-stone-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition gap-4"
              >
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono text-stone-400 bg-stone-100/80 px-2.5 py-1.5 rounded-xl tracking-wide">
                      PRJ-{String(project.id).padStart(3, "0")}
                    </span>
                    <span className={`text-[12px] font-bold px-3 py-1.5 rounded-2xl ${getStatusStyles(project.status)}`}>
                      {project.status === "AKTIF" ? "Active" : project.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[17px] text-stone-900 leading-snug truncate">
                      {project.nama}
                    </h3>
                    <p className="text-[13px] text-stone-450 mt-0.5">
                      {project.deskripsi}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[13px] text-stone-450 pt-0.5">
                    <Calendar size={15} className="text-stone-400 stroke-[1.8]" />
                    <span>
                      {new Date(project.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {project.tanggalSelesai && ` - ${new Date(project.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {hasBudget ? (
                    <div className="grid grid-cols-2 gap-4 text-left pt-1">
                      <div>
                        <span className="text-[10px] font-extrabold text-stone-400 block tracking-wider uppercase">TOTAL NILAI PROYEK</span>
                        <span className="font-mono font-black text-stone-900 text-[15px] block mt-1">
                          {formatRupiah(totalRAB)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-stone-400 block tracking-wider uppercase">SISA BUDGET</span>
                        <span className="font-mono font-black text-[#1b4332] text-[15px] block mt-1">
                          {formatRupiah(sisa)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#fdf6ec] text-[#935a16] p-2 pl-3.5 pr-2 rounded-2xl text-[13px] font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={15} className="stroke-[2.5]" />
                        <span>Nilai Proyek belum diinisialisasi</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowInitBudget(project); setRabTotal(""); }}
                        className="px-4 py-1.5 bg-[#804f11] hover:bg-[#663f0e] text-white text-[12px] font-extrabold rounded-xl transition cursor-pointer"
                      >
                        Set Nilai
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(project); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-200 hover:bg-stone-50 text-stone-900 text-[13px] font-extrabold rounded-2xl transition cursor-pointer shadow-sm"
                    >
                      <Briefcase size={15} className="stroke-[2]" />
                      Detail Proyek
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectEdit(project);
                      }}
                      className="p-3 border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 rounded-2xl transition cursor-pointer shadow-sm flex-shrink-0"
                    >
                      <Settings size={16} className="stroke-[2]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH PROYEK */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Buat Proyek Baru</h3>
              <button type="button" onClick={() => setShowAddProject(false)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
                <input
                  type="text"
                  required
                  value={projectForm.nama}
                  onChange={(e) => setProjectForm({ ...projectForm, nama: e.target.value })}
                  placeholder="e.g. Renovasi Kantor Cabang Bandung"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
                <textarea
                  rows={3}
                  value={projectForm.deskripsi}
                  onChange={(e) => setProjectForm({ ...projectForm, deskripsi: e.target.value })}
                  placeholder="Detail mengenai target..."
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={projectForm.tanggalMulai}
                    onChange={(e) => setProjectForm({ ...projectForm, tanggalMulai: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={projectForm.tanggalSelesai}
                    onChange={(e) => setProjectForm({ ...projectForm, tanggalSelesai: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: "AKTIF", label: "Active" },
                    { value: "PLANNING", label: "Planning" }
                  ].map((statusItem) => {
                    const isSelected = projectForm.status === statusItem.value;
                    return (
                      <button
                        key={statusItem.value}
                        type="button"
                        onClick={() => setProjectForm({ ...projectForm, status: statusItem.value })}
                        className={`px-5 py-2 text-[13px] font-semibold rounded-xl border transition-all ${isSelected ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332]" : "border-stone-200 bg-white text-stone-600"
                          }`}
                      >
                        {statusItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setShowAddProject(false)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#2d6a4f] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATUR ANGGOTA */}
      {showAssignMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Atur Anggota Proyek</h3>
              <button type="button" onClick={() => setShowAssignMembers(null)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">PROYEK</h4>
                <p className="font-bold text-stone-850 text-sm">{showAssignMembers.nama}</p>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-2">Pilih Anggota Tim</label>
                <div className="border border-stone-200 rounded-xl max-h-[260px] overflow-y-auto divide-y divide-stone-100 p-1 bg-stone-50/20">
                  {members.map((member) => {
                    const isChecked = selectedProjectMembers.some((m) => m.userId === member.id);
                    return (
                      <label key={member.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg cursor-pointer transition select-none">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectMembers([...selectedProjectMembers, {
                                  userId: member.id,
                                  role: member.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'
                                }]);
                              } else {
                                setSelectedProjectMembers(selectedProjectMembers.filter((m) => m.userId !== member.id));
                              }
                            }}
                            className="accent-[#2d6a4f]"
                          />
                          <div className="min-w-0 text-left">
                            <p className="text-[13px] font-bold text-stone-800 leading-tight">{member.nama}</p>
                            <p className="text-[11px] text-stone-400 font-mono mt-0.5">{member.email}</p>
                          </div>
                        </div>
                        {isChecked ? (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={selectedProjectMembers.find((m) => m.userId === member.id)?.role || 'Anggota Lapangan'}
                              onChange={(e) => {
                                setSelectedProjectMembers(
                                  selectedProjectMembers.map((m) =>
                                    m.userId === member.id ? { ...m, role: e.target.value } : m
                                  )
                                );
                              }}
                              className="border border-stone-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-650 bg-white"
                            >
                              <option value="Anggota Lapangan">Anggota Lapangan</option>
                              <option value="Project Manager">Project Manager</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            {member.role}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setShowAssignMembers(null)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
                <button type="button" onClick={handleSaveMembers} disabled={submitting} className="flex-1 py-2.5 bg-[#2d6a4f] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Penugasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INISIALISASI / EDIT Nilai Proyek */}
      {showInitBudget && (() => {
        // Calculate progress bar and remaining budget metrics dynamically
        const totalVal = ribuanToNumber(rabTotal) || 0;
        const terpakaiVal = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
        const pctVal = totalVal > 0 ? Math.round((terpakaiVal / totalVal) * 100) : 0;
        const sisaVal = Math.max(0, totalVal - terpakaiVal);

        // Real-time calculations for Main budget allocations
        const totalPosAllocated = posAnggaranList.reduce((acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0), 0);
        const isOverbudget = totalPosAllocated > totalVal;

        const formatMillions = (val: number) => {
          if (val >= 1_000_000_000) {
            return `${(val / 1_000_000_000).toFixed(1)} M`;
          }
          return `${(val / 1_000_000).toFixed(1)} jt`;
        };

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div style={{
              width: 520,
              background: 'white',
              boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.28)',
              overflow: 'hidden',
              borderRadius: 22,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              animation: 'fadeIn 0.2s ease',
            }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '0.80px #E6E1D4 solid',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Edit Nilai Proyek</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 400, fontSize: 12, color: '#9A948B', lineHeight: '18px' }}>{showInitBudget.nama}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInitBudget(null)}
                  style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="hover:bg-stone-100 transition"
                >
                  <X size={16} color="#2C2A24" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleInitBudget} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Total Nilai Proyek (Rupiah) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <div>
                      <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                        Total Nilai Proyek (Rupiah) <span style={{ color: '#902F33' }}>*</span>
                      </span>
                    </div>
                    <div style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      height: 40,
                      background: 'white',
                      borderRadius: 12,
                      border: '1px solid #E6E1D4',
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}>
                      <span style={{ fontSize: 13.50, fontFamily: 'IBM Plex Mono', fontWeight: '400', color: '#14130F', marginRight: 4 }}>Rp</span>
                      <input
                        type="text"
                        required
                        value={rabTotal}
                        onChange={(e) => setRabTotal(formatRibuan(e.target.value))}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontFamily: 'IBM Plex Mono',
                          fontSize: 13.50,
                          fontWeight: '400',
                          color: '#14130F',
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Progress Card: Realisasi Anggaran */}
                  <div style={{
                    alignSelf: 'stretch',
                    padding: 16,
                    background: 'white',
                    boxShadow: '0px 0px 0px 1px rgba(20, 18, 14, 0.04), 0px 1px 2px rgba(20, 18, 14, 0.05)',
                    borderRadius: 16,
                    border: '1.20px #E6E1D4 solid',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>Realisasi Anggaran</span>
                      <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>{pctVal}%</span>
                    </div>
                    <div style={{ height: 8, background: '#F3F0E9', overflow: 'hidden', borderRadius: 999 }}>
                      <div style={{ width: `${Math.min(pctVal, 100)}%`, height: '100%', background: '#009162', borderRadius: 999 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ color: 'black', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '500' }}>Nilai Proyek</span>
                        <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>Rp</span>
                        <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>{formatMillions(totalVal)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ color: 'black', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '500' }}>Realisasi</span>
                        <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>Rp</span>
                        <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>{formatMillions(terpakaiVal)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ color: '#9A948B', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '400' }}>Sisa</span>
                        <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>Rp</span>
                        <span style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>{formatMillions(sisaVal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Main Budget List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                        Breakdown Pos Anggaran Main
                      </span>
                      <button
                        type="button"
                        onClick={() => setPosAnggaranList([...posAnggaranList, { deskripsi: "", nominalAlokasi: "" }])}
                        style={{
                          padding: '4px 10px',
                          background: '#D5F4E3',
                          borderRadius: 6,
                          border: 'none',
                          color: '#005836',
                          fontSize: 11.50,
                          fontFamily: 'Plus Jakarta Sans',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        className="hover:opacity-80 transition"
                      >
                        + Tambah Main
                      </button>
                    </div>

                    {/* Real-time Summary Cards */}
                    <div style={{
                      alignSelf: 'stretch',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16
                    }}>
                      {/* Card 1: Total Pos Teralokasi */}
                      <div style={{
                        padding: '10px 12px',
                        background: 'white',
                        borderRadius: 12,
                        outline: '0.80px #E6E1D4 solid',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: 2
                      }}>
                        <div style={{ color: '#14130F', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                          Total Pos Teralokasi
                        </div>
                        <div style={{ color: 'black', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '500' }}>
                          Rp {totalPosAllocated.toLocaleString("id-ID")}
                        </div>
                      </div>

                      {/* Card 2: Sisa Pos Belum Dialokasikan / Overbudget */}
                      <div style={{
                        padding: '10px 12px',
                        background: isOverbudget ? 'rgba(211, 108, 102, 0.05)' : 'white',
                        borderRadius: 12,
                        outline: isOverbudget ? '0.80px #D36C66 solid' : '0.80px #E6E1D4 solid',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        gap: 2
                      }}>
                        <div style={{ color: isOverbudget ? '#D36C66' : '#14130F', fontSize: 11.5, fontFamily: 'Plus Jakarta Sans', fontWeight: '600' }}>
                          {isOverbudget ? 'Kelebihan Alokasi (Overbudget)' : 'Sisa Pos Belum Dialokasikan'}
                        </div>
                        <div style={{ color: isOverbudget ? '#D36C66' : 'black', fontSize: 13, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>
                          Rp {isOverbudget ? '-' : ''}{Math.abs(totalVal - totalPosAllocated).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {posAnggaranList.map((pos, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">

                          {/* SEBELUMNYA INPUT TEKS, SEKARANG MENJADI DROPDOWN SELECT */}
                          <select
                            required
                            value={pos.deskripsi}
                            onChange={(e) => {
                              const newList = [...posAnggaranList];
                              newList[idx].deskripsi = e.target.value;
                              setPosAnggaranList(newList);
                            }}
                            className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-700"
                          >
                            <option value="" disabled hidden>-- Pilih Nama Budget/Pos --</option>
                            {masterBudgetOptions.map((optionName) => (
                              <option key={optionName} value={optionName}>
                                {optionName.toUpperCase()}
                              </option>
                            ))}
                            {/* Opsi bawaan jika database master masih kosong */}
                            {!masterBudgetOptions.includes("Akomodasi & Transportasi") && <option value="Akomodasi & Transportasi">AKOMODASI & TRANSPORTASI</option>}
                            {!masterBudgetOptions.includes("Konsumsi") && <option value="Konsumsi">KONSUMSI</option>}
                            {!masterBudgetOptions.includes("Perlengkapan & ATK") && <option value="Perlengkapan & ATK">PERLENGKAPAN & ATK</option>}
                          </select>

                          <div className="relative flex items-center w-44">
                            <span className="absolute left-3 text-[12px] font-bold text-stone-400 font-mono">Rp</span>
                            <input
                              type="text"
                              required
                              value={pos.nominalAlokasi}
                              onChange={(e) => {
                                const newList = [...posAnggaranList];
                                newList[idx].nominalAlokasi = formatRibuan(e.target.value);
                                setPosAnggaranList(newList);
                              }}
                              placeholder="Alokasi (Rp)"
                              className="w-full border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-[13px] bg-white font-mono text-stone-900 font-bold text-left focus:outline-none focus:border-stone-400 placeholder-stone-300"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setPosAnggaranList(posAnggaranList.filter((_, i) => i !== idx))}
                            className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Form Error Message */}
                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                      <X size={14} />
                      {formError}
                    </div>
                  )}

                </div>

                {/* Footer Buttons */}
                <div style={{
                  alignSelf: 'stretch',
                  padding: '14px 24px',
                  borderTop: '0.80px #E6E1D4 solid',
                  display: 'flex',
                  gap: 8,
                  background: 'white',
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={() => setShowInitBudget(null)}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      background: 'white',
                      border: '0.80px solid #E6E1D4',
                      borderRadius: 12,
                      fontFamily: 'Plus Jakarta Sans',
                      fontWeight: '600',
                      fontSize: 13,
                      color: '#14130F',
                      cursor: 'pointer'
                    }}
                    className="hover:bg-stone-50 transition"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      background: 'black',
                      border: 'none',
                      borderRadius: 12,
                      fontFamily: 'Plus Jakarta Sans',
                      fontWeight: '600',
                      fontSize: 13,
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    className="hover:opacity-80 transition"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    Simpan Nilai Proyek
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: DETAIL PROYEK SIDEBAR */}
      {showProjectDetail && !editMode && !isDirectEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100">
          <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col h-full">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">PRJ-{String(showProjectDetail.id).padStart(3, "0")}</span>
                <h3 className="font-bold text-[15px] text-stone-900">Detail Proyek</h3>
              </div>
              <button type="button" onClick={() => { setShowProjectDetail(null); setEditMode(false); }} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                <X size={16} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Memuat detail proyek...</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 pb-3 flex-shrink-0 text-left">
                  <span className="text-[11px] font-mono text-stone-400">PRJ-{String(showProjectDetail.id).padStart(3, "0")}</span>
                  <h2 className="font-bold text-xl text-stone-900 leading-tight mt-0.5">{detailedProjectInfo?.nama || showProjectDetail.nama}</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {detailedProjectInfo?.deskripsi || showProjectDetail.deskripsi}
                  </p>
                  <div className="flex gap-4 border-b border-stone-100 mt-5 text-[13px] font-medium text-stone-400">
                    <button type="button" onClick={() => setActiveTab("ringkasan")} className={`pb-2 transition ${activeTab === "ringkasan" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Ringkasan</button>
                    <button type="button" onClick={() => setActiveTab("anggaran")} className={`pb-2 transition ${activeTab === "anggaran" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Anggaran</button>
                    <button type="button" onClick={() => setActiveTab("tim")} className={`pb-2 transition ${activeTab === "tim" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}>Tim</button>
                  </div>
                </div>

                <div id="scroll-bridge-container" className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-h-0" style={{ scrollbarWidth: 'none' }}>
                  {activeTab === "ringkasan" && (
                    <div id="ringkasan-sec" className="px-6 py-4 space-y-5">
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2 text-left">
                        <div>
                          <span className="text-[11px] text-stone-400 block font-medium">Status</span>
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border mt-1 ${getStatusStyles(detailedProjectInfo?.status || showProjectDetail.status)}`}>
                            {detailedProjectInfo?.status || showProjectDetail.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-400 block font-medium">Project Manager</span>
                          <span className="text-[13px] font-bold text-stone-800 block mt-1 truncate">
                            {detailedProjectInfo?.users?.find((u: any) => u.roleInProyek === 'Project Manager')?.nama || "Muhammad Zaini"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-400 block font-medium">Tanggal Mulai</span>
                          <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                            {detailedProjectInfo?.tanggalMulai ? new Date(detailedProjectInfo.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "12 Januari 2026"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-400 block font-medium">Tanggal Selesai</span>
                          <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                            {detailedProjectInfo?.tanggalSelesai ? new Date(detailedProjectInfo.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "30 September 2026"}
                          </span>
                        </div>
                      </div>

                      {/* Progress Anggaran */}
                      {detailedProjectInfo?.budget ? (
                        <div className="border border-stone-100 rounded-3xl p-5 bg-white space-y-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                          <div className="flex justify-between items-center text-[13px] font-extrabold text-stone-900 tracking-wide">
                            <span>Realisasi Anggaran</span>
                            <span className="font-mono text-sm font-black">{detailPercentUsed}%</span>
                          </div>

                          {(() => {
                            let macroBarColor = "bg-[#00966c]";
                            if (detailPercentUsed >= 90) {
                              macroBarColor = "bg-[#d65f5f]";
                            } else if (detailPercentUsed >= 80) {
                              macroBarColor = "bg-[#d4a373]";
                            }

                            return (
                              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${macroBarColor}`}
                                  style={{ width: `${detailBarWidth}%` }}
                                />
                              </div>
                            );
                          })()}

                          <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium">
                            <span>Nilai Proyek <b className="text-stone-700 font-mono font-bold ml-0.5">{formatSummaryRupiah(detailTotalRAB)}</b></span>
                            <span>Realisasi <b className="text-stone-700 font-mono font-bold ml-0.5">{formatSummaryRupiah(detailTotalTerpakai)}</b></span>
                            <span>Sisa <b className="text-stone-400 font-mono font-bold ml-0.5">{formatSummaryRupiah(parseFloat(detailedProjectInfo.budget.sisaBudget))}</b></span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-xs flex items-center justify-between text-left">
                          <span>Nilai Proyek belum diinisialisasi.</span>
                          <button type="button" onClick={() => { setShowProjectDetail(null); setShowInitBudget(showProjectDetail); }} className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">Set Nilai Proyek</button>
                        </div>
                      )}
                      {/* Reimbursement */}
                      <div className="space-y-2 text-left">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Receipt size={14} className="text-stone-400" /> Reimbursement
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-emerald-700 block">Sudah Reimburse</span>
                            <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                              {formatSummaryRupiah(sudahReimburseNominal)}
                            </span>
                          </div>
                          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-amber-700 block">Belum Reimburse</span>
                            <span className="font-mono text-lg font-black text-stone-900 mt-2 block">
                              {formatSummaryRupiah(belumReimburseNominal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Arus Kas Real-Time */}
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Arus Kas Real-Time</h4>
                          <div className="flex gap-1 bg-[#f5f4f0] p-1 rounded-xl text-[10px] font-bold text-stone-500">
                            {(["4M", "12M", "YTD"] as const).map((filter) => (
                              <button
                                key={filter}
                                type="button"
                                onClick={() => setTimeFilter(filter)}
                                className={`px-2 py-1 rounded-lg transition ${timeFilter === filter ? "bg-white text-stone-900 shadow-sm" : "hover:text-stone-800"}`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] space-y-4">
                          <div className="h-28 flex items-end gap-3 px-2 pt-2 border-b border-stone-100">
                            {activeCashFlow.length === 0 ? (
                              <div className="flex-1 flex items-center justify-center text-xs text-stone-400 pb-4">
                                Tidak ada data arus kas untuk periode ini
                              </div>
                            ) : (
                              (() => {
                                const maxVal = Math.max(1, ...activeCashFlow.map((c: any) => Math.max(c.inflow || 0, c.outflow || 0)));
                                return activeCashFlow.map((bar: any, idx: number) => {
                                  const inflowHeight = Math.min(100, Math.round(((bar.inflow || 0) / maxVal) * 100));
                                  const outflowHeight = Math.min(100, Math.round(((bar.outflow || 0) / maxVal) * 100));

                                  return (
                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                                      <div className="w-full flex justify-center items-end gap-0.5 h-full">
                                        <div
                                          className="w-2.5 bg-[#2d6a4f] rounded-t-sm transition-all duration-500 ease-out"
                                          style={{ height: `${inflowHeight}%` }}
                                          title={`Inflow: ${formatRupiah(bar.inflow)}`}
                                        />
                                        <div
                                          className="w-2.5 bg-[#d4a373] rounded-t-sm transition-all duration-500 ease-out"
                                          style={{ height: `${outflowHeight}%` }}
                                          title={`Outflow: ${formatRupiah(bar.outflow)}`}
                                        />
                                      </div>
                                      <span className="text-[9px] font-medium text-stone-400 mt-1 block">{bar.bulan}</span>
                                    </div>
                                  );
                                });
                              })()
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-1 text-[11px]">
                            <div className="flex gap-3 text-stone-500 font-medium">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2d6a4f]" /> Inflow {formatSummaryRupiah(inflowNominal)}</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#d4a373]" /> Outflow {formatSummaryRupiah(outflowNominal)}</span>
                            </div>
                            <span className={`font-bold ${netCashNominal >= 0 ? "text-[#2d6a4f]" : "text-rose-600"}`}>
                              Net cash {netCashNominal >= 0 ? "+" : ""}{formatSummaryRupiah(netCashNominal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "anggaran" && (
                    <div id="anggaran-sec" className="px-6 py-4 space-y-5 flex-shrink-0">
                      {/* Header Section */}
                      <div className="pb-2">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                          Rincian Pos Anggaran
                        </h3>
                      </div>

                      {/* Container for the 3 Premium Buttons */}
                      <div className="flex flex-col gap-2 pb-2">
                        <div className="flex gap-2 w-full">
                          {/* Button 1: Pengajuan Pos PM */}
                          <button
                            type="button"
                            onClick={() => {
                              const initial: Record<number, boolean> = {};
                              (detailedProjectInfo?.pendingReimbursements || []).forEach((r: any) => {
                                initial[r.id] = true;
                              });
                              setSelectedPendingIds(initial);
                              setShowPendingPmModal(true);
                              if (detailedProjectInfo?.id) {
                                fetchPendingPengajuan(detailedProjectInfo.id);
                              }
                            }}
                            className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer gap-2"
                          >
                            <div className="flex items-center gap-1.5">
                              <ClipboardList size={13.5} className="text-stone-500" />
                              <span>Pengajuan Pos PM</span>
                            </div>
                            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[9px] font-bold bg-[#005836] text-white rounded-full">
                              {detailedProjectInfo?.pendingPmCount || 0}
                            </span>
                          </button>

                          {/* Button 2: Edit Nilai Proyek */}
                          <button
                            type="button"
                            onClick={() => {
                              if (detailedProjectInfo?.budget) {
                                const rawTotal = parseFloat(detailedProjectInfo.budget.rabTotal) || 0;
                                setRabTotal(formatRibuan(String(Math.round(rawTotal))));

                                const existingPos = detailedProjectInfo.budget.posAnggaran.map((pos: any) => {
                                  const rawAlokasi = parseFloat(pos.nominalAlokasi) || 0;
                                  return {
                                    deskripsi: pos.namaPos || pos.deskripsi,
                                    nominalAlokasi: formatRibuan(String(Math.round(rawAlokasi)))
                                  };
                                });
                                setPosAnggaranList(existingPos);
                              }
                              setShowInitBudget(showProjectDetail);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer"
                          >
                            <Settings size={13.5} className="text-stone-500" />
                            <span>Edit Nilai Proyek</span>
                          </button>
                        </div>

                        {/* Button 3: Lihat Detail Anggaran */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowDetailBudgetModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 text-[11px] font-semibold rounded-xl shadow-sm hover:shadow transition duration-200 cursor-pointer"
                        >
                          <Eye size={13.5} className="text-stone-500" />
                          <span>Lihat Detail Anggaran</span>
                        </button>
                      </div>

                      {/* List Item Pos Anggaran Dinamis */}
                      {detailedProjectInfo?.budget?.posAnggaran ? (
                        <div className="space-y-6">
                          {detailedProjectInfo.budget.posAnggaran.map((pos: any, index: number) => {
                            const nominalAlokasi = parseFloat(pos.nominalAlokasi) || 0;

                            const simPercentages = [95, 96, 86, 73, 56, 30];
                            const terpakaiVal = parseFloat(pos.nominalTerpakai) || 0;
                            const sisaVal = Math.max(0, nominalAlokasi - terpakaiVal);
                            const percentUsed = nominalAlokasi > 0 ? Math.round((terpakaiVal / nominalAlokasi) * 100) : 0;

                            let barColor = "bg-[#00966c]";
                            if (percentUsed >= 90) {
                              barColor = "bg-[#d65f5f]";
                            } else if (percentUsed >= 80) {
                              barColor = "bg-[#d4a373]";
                            }

                            return (
                              <div key={pos.id || index} className="space-y-2 text-left">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-[14px] font-bold text-stone-800 leading-tight">
                                      {pos.namaPos || pos.deskripsi}
                                    </h4>
                                    <span className="text-[10px] font-mono font-bold text-stone-400">
                                      POS-{201 + index}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[14px] font-black text-stone-900 font-mono">
                                      {formatSummaryRupiah(terpakaiVal)}
                                    </span>
                                    <span className="text-[10px] text-stone-400 block font-medium mt-0.5">
                                      dari {formatSummaryRupiah(nominalAlokasi)}
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full h-2 bg-stone-100/80 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                  />
                                </div>

                                <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium pt-0.5">
                                  <span className="font-semibold" style={{ color: percentUsed >= 90 ? '#d65f5f' : percentUsed >= 80 ? '#d4a373' : '#00966c' }}>
                                    {percentUsed}% terpakai
                                  </span>
                                  <span>
                                    Sisa <b className="text-stone-700 font-mono font-bold">{formatSummaryRupiah(sisaVal)}</b>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-xs font-medium text-stone-450 bg-stone-50 rounded-2xl border border-stone-100">
                          Nilai Proyek belum diinisialisasi untuk proyek ini.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "tim" && (
                    <div id="tim-sec" className="min-h-full w-full px-6 pb-20 pt-4 text-left flex-shrink-0 space-y-3">
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Anggota Tim Proyek</h3>
                      <div className="space-y-3">
                        {teamRows.map((row, idx) => (
                          <div key={row.id} className="grid grid-cols-12 gap-2.5 items-center">
                            <div className="col-span-5">
                              <input
                                type="text"
                                placeholder={row.isLocked ? "Role Karyawan" : "Cth: DevOps"}
                                required
                                disabled={row.isLocked}
                                value={row.role}
                                onChange={(e) => {
                                  const updated = [...teamRows];
                                  updated[idx].role = e.target.value;
                                  setTeamRows(updated);
                                }}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                              />
                            </div>
                            <div className={row.isLocked ? "col-span-7" : "col-span-6"}>
                              <select
                                required
                                value={row.userId}
                                onChange={(e) => {
                                  const updated = [...teamRows];
                                  updated[idx].userId = e.target.value;
                                  setTeamRows(updated);
                                }}
                                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                              >
                                <option value="" disabled hidden>Pilih nama...</option>
                                {members.map((member) => (
                                  <option key={member.id} value={member.id}>{member.nama}</option>
                                ))}
                              </select>
                            </div>
                            {!row.isLocked && (
                              <div className="col-span-1 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeamRow(row.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Anggota"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex flex-col gap-3 border-t border-stone-100 mt-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddTeamRow}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[12px] font-bold rounded-xl shadow-sm transition cursor-pointer"
                          >
                            <Plus size={13} />
                            Tambah Anggota
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveTeamRows}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2d6a4f] text-white text-[12px] font-bold rounded-xl shadow-sm hover:bg-[#1e5038] transition cursor-pointer"
                          >
                            {submitting && <Loader2 size={12} className="animate-spin" />}
                            Simpan Penugasan Tim
                          </button>
                        </div>
                        {formError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2">
                            <X size={13} />
                            <span>{formError}</span>
                          </div>
                        )}
                        {success && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2">
                            <Check size={13} />
                            <span>{success}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-stone-100 bg-white flex gap-3 flex-shrink-0">
                  <button type="button"
                    onClick={() => { setIsDirectEdit(false); setEditMode(true); }}
                    className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-[13px] font-semibold text-stone-700 transition flex items-center justify-center gap-1.5">
                    <Settings size={15} className="stroke-[1.8]" />
                    Edit Proyek
                  </button>
                  {(currentStatus?.toUpperCase() === "CANCELED" || currentStatus?.toUpperCase() === "DONE") && (
                    <button
                      onClick={handleReactivateProject}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      Aktifkan Kembali
                    </button>
                  )}
                  <button type="button"
                    onClick={() => { setShowProjectDetail(null); setActiveTab("ringkasan"); }}
                    className="flex-1 py-2.5 bg-black hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center">
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TEMPAT BARU: POP-UP MODAL EDIT PROYEK DI TENGAH LAYAR --- */}
      {editMode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Edit Proyek</h3>
              <button type="button" onClick={handleCloseEdit} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
                <input type="text" required value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
                <textarea rows={3} value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white resize-none focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai *</label>
                  <input type="date" required value={editForm.tanggalMulai} onChange={(e) => setEditForm({ ...editForm, tanggalMulai: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai</label>
                  <input type="date" value={editForm.tanggalSelesai} onChange={(e) => setEditForm({ ...editForm, tanggalSelesai: e.target.value })} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[{ value: "AKTIF", label: "Active" }, { value: "PLANNING", label: "Planning" }, { value: "DONE", label: "Done" }, { value: "CANCELED", label: "Canceled" }].map((statusItem) => {
                    const isSelected = editForm.status === statusItem.value;
                    return (
                      <button key={statusItem.value} type="button" onClick={() => setEditForm({ ...editForm, status: statusItem.value })}
                        className={`px-3.5 py-1.5 text-[12px] font-semibold rounded-xl border transition-all ${isSelected ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                      >
                        {statusItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="button" onClick={handleCloseEdit} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- POP-UP MODAL: DETAIL ANGGARAN --- */}
      {showDetailBudgetModal && (() => {
        const formatMillionsShort = (num: number) => {
          if (num >= 1e9) return `${(num / 1e9).toFixed(1)} M`;
          if (num >= 1e6) return `${(num / 1e6).toFixed(1)} jt`;
          if (num >= 1e3) return `${(num / 1e3).toFixed(1)} rb`;
          return `${num.toFixed(1)}`;
        };

        const posAnggaran = detailedProjectInfo?.budget?.posAnggaran || [];

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div style={{
              width: 920,
              background: 'white',
              boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              animation: 'fadeIn 0.2s ease',
              textAlign: 'left'
            }}>
              {/* Header */}
              <div style={{
                padding: '22px 28px 18px 28px',
                borderBottom: '0.80px #E6E1D4 solid',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ color: '#14130F', fontSize: 19, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', lineHeight: '28.50px' }}>Detail Anggaran</div>
                  <div style={{ color: '#6A6660', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '400', lineHeight: '19.50px' }}>{detailedProjectInfo?.nama || "Pembangunan Gudang Cikarang Fase 2"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailBudgetModal(false)}
                  style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="hover:bg-stone-100 transition"
                >
                  <X size={16} color="#2C2A24" />
                </button>
              </div>

              {/* Table Column Headers */}
              <div style={{
                alignSelf: 'stretch',
                padding: '14px 40px 10px 40px',
                borderBottom: '0.80px #E6E1D4 solid',
                display: 'grid',
                gridTemplateColumns: '384px 180px 150px 150px',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase' }}>MAIN · SUB · KETERANGAN</div>
                <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase' }}>PROGRESS</div>
                <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase' }}>ALOKASI</div>
                <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: 0.63, textTransform: 'uppercase' }}>REALISASI</div>
              </div>

              {/* Scrollable Content Area */}
              <div style={{
                flex: 1,
                padding: '10px 28px 28px 28px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {posAnggaran.length > 0 ? (
                  posAnggaran.map((pos: any, idxPos: number) => {
                    const alokasiPos = parseFloat(pos.nominalAlokasi) || 0;
                    const terpakaiPos = parseFloat(pos.nominalTerpakai) || 0;
                    const pctPos = alokasiPos > 0 ? Math.min((terpakaiPos / alokasiPos) * 100, 100) : 0;
                    const pctPosText = alokasiPos > 0 ? ((terpakaiPos / alokasiPos) * 100).toFixed(1) : '0.0';

                    let mainBarColor = '#2F9E5E';
                    if (pctPos >= 90) { mainBarColor = '#D36C66'; }
                    else if (pctPos >= 75) { mainBarColor = '#D8953D'; }

                    const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;
                    const isMainOpen = hasSub && expandedMain[idxPos] !== false;

                    return (
                      <div key={pos.id || idxPos} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {/* MAIN Row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '384px 180px 150px 150px',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: '#F6F4EF',
                            borderRadius: 10,
                            cursor: hasSub ? 'pointer' : 'default',
                            userSelect: 'none'
                          }}
                          onClick={() => {
                            if (hasSub) {
                              setExpandedMain(prev => ({ ...prev, [idxPos]: !isMainOpen }));
                            }
                          }}
                        >
                          {/* Col 1: Name and badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {hasSub ? (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                style={{
                                  flexShrink: 0,
                                  transition: 'transform 0.15s ease',
                                  transform: isMainOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                }}
                              >
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <div style={{ width: 10 }} />
                            )}
                            <span style={{ background: '#E6E1D4', color: '#14130F', fontSize: 9.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', padding: '2px 6px', borderRadius: 4 }}>
                              MAIN
                            </span>
                            <span style={{ color: '#14130F', fontSize: 13, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {pos.namaPos || pos.deskripsi}
                            </span>
                          </div>

                          {/* Col 2: Progress */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                            <div style={{ flex: 1, height: 6, background: '#E6E1D4', overflow: 'hidden', borderRadius: 99 }}>
                              <div style={{ width: `${pctPos}%`, height: '100%', background: mainBarColor, borderRadius: 99 }} />
                            </div>
                            <span style={{ color: '#005836', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', minWidth: 42, textAlign: 'right' }}>
                              {pctPosText}%
                            </span>
                          </div>

                          {/* Col 3: Alokasi */}
                          <div style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>
                            Rp {formatMillionsShort(alokasiPos)}
                          </div>

                          {/* Col 4: Realisasi */}
                          <div style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'IBM Plex Mono', fontWeight: '700' }}>
                            Rp {formatMillionsShort(terpakaiPos)}
                          </div>
                        </div>

                        {/* SUB Rows - only if parent MAIN is expanded */}
                        {isMainOpen && pos.subAnggaran.map((sub: any, idxSub: number) => {
                          const alokasiSub = parseFloat(sub.nominalAlokasi) || 0;
                          const terpakaiSub = parseFloat(sub.nominalTerpakai) || 0;
                          const pctSub = alokasiSub > 0 ? Math.min((terpakaiSub / alokasiSub) * 100, 100) : 0;
                          const pctSubText = alokasiSub > 0 ? ((terpakaiSub / alokasiSub) * 100).toFixed(1) : '0.0';

                          let subBarColor = '#2F9E5E';
                          if (pctSub >= 90) { subBarColor = '#D36C66'; }
                          else if (pctSub >= 75) { subBarColor = '#D8953D'; }

                          const subKey = `${idxPos}-${idxSub}`;
                          const hasKet = sub.keterangan && sub.keterangan.length > 0;
                          const isSubOpen = hasKet && expandedSub[subKey] !== false;

                          return (
                            <div key={sub.id || idxSub} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {/* SUB Row */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '384px 180px 150px 150px',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  background: 'white',
                                  cursor: hasKet ? 'pointer' : 'default',
                                  userSelect: 'none'
                                }}
                                onClick={() => {
                                  if (hasKet) {
                                    setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }));
                                  }
                                }}
                                className="hover:bg-stone-50 transition"
                              >
                                {/* Col 1: Sub title */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 24 }}>
                                  {hasKet ? (
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                      style={{
                                        flexShrink: 0,
                                        transition: 'transform 0.15s ease',
                                        transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                      }}
                                    >
                                      <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <div style={{ width: 10 }} />
                                  )}
                                  <span style={{ color: '#9A948B', fontSize: 10.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase' }}>
                                    Sub
                                  </span>
                                  <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    · {sub.namaSub}
                                  </span>
                                </div>

                                {/* Col 2: Progress */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                                  <div style={{ flex: 1, height: 6, background: '#E6E1D4', overflow: 'hidden', borderRadius: 99 }}>
                                    <div style={{ width: `${pctSub}%`, height: '100%', background: subBarColor, borderRadius: 99 }} />
                                  </div>
                                  <span style={{ color: '#005836', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '700', minWidth: 42, textAlign: 'right' }}>
                                    {pctSubText}%
                                  </span>
                                </div>

                                {/* Col 3: Alokasi */}
                                <div style={{ color: '#14130F', fontSize: 12, fontFamily: 'IBM Plex Mono', fontWeight: '400' }}>
                                  Rp {formatMillionsShort(alokasiSub)}
                                </div>

                                {/* Col 4: Realisasi */}
                                <div style={{ color: '#14130F', fontSize: 12, fontFamily: 'IBM Plex Mono', fontWeight: '400' }}>
                                  Rp {formatMillionsShort(terpakaiSub)}
                                </div>
                              </div>
                              {/* KET Rows - only if sub is expanded */}
                              {isSubOpen && sub.keterangan.map((ket: any, idxKet: number) => {
                                const alokasiKet = parseFloat(ket.nominalAlokasi) || 0;
                                const realisasiKet = parseFloat(ket.nominalRealisasi) || 0;
                                const pctKet = alokasiKet > 0 ? ((realisasiKet / alokasiKet) * 100).toFixed(1) : '0.0';

                                const childReimbursements = ket.reimbursements || [];
                                const approvedReimbs = childReimbursements.filter((r: any) =>
                                  r.status === 'APPROVED' ||
                                  r.status === 'APPROVED_BY_PM' ||
                                  r.status === 'SUBMITTED' ||
                                  r.status === 'PAID' ||
                                  r.status === 'DISBURSED'
                                );
                                const hasReimbs = approvedReimbs.length > 0;
                                const ketKey = `${subKey}-${idxKet}`;
                                const isKetOpen = hasReimbs && expandedKet[ketKey] !== false;

                                return (
                                  <div key={ket.id || idxKet} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* KET Row */}
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '384px 180px 150px 150px',
                                        alignItems: 'center',
                                        padding: '6px 12px',
                                        background: 'white',
                                        cursor: hasReimbs ? 'pointer' : 'default',
                                        userSelect: 'none'
                                      }}
                                      onClick={() => {
                                        if (hasReimbs) {
                                          setExpandedKet(prev => ({ ...prev, [ketKey]: !isKetOpen }));
                                        }
                                      }}
                                      className={hasReimbs ? "hover:bg-stone-50 transition" : ""}
                                    >
                                      {/* Col 1 */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 48 }}>
                                        {hasReimbs ? (
                                          <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 10 10"
                                            fill="none"
                                            style={{
                                              flexShrink: 0,
                                              transition: 'transform 0.15s ease',
                                              transform: isKetOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                            }}
                                          >
                                            <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        ) : (
                                          <div style={{ width: 10 }} />
                                        )}
                                        <span style={{ color: '#9A948B', fontSize: 10, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase' }}>
                                          Ket
                                        </span>
                                        <span style={{ color: '#6A6660', fontSize: 12, fontFamily: 'Plus Jakarta Sans', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                          · {ket.keterangan}
                                        </span>
                                      </div>

                                      {/* Col 2 (Blank for Keterangan) */}
                                      <div />

                                      {/* Col 3 */}
                                      <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '400' }}>
                                        Rp {formatMillionsShort(alokasiKet)}
                                      </div>

                                      {/* Col 4 */}
                                      <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: 'IBM Plex Mono', fontWeight: '400' }}>
                                        Rp {formatMillionsShort(realisasiKet)}
                                      </div>
                                    </div>

                                    {/* Approved Reimbursements list under this Keterangan */}
                                    {isKetOpen && approvedReimbs.map((reimb: any) => {
                                      const formattedDate = formatReimbursementDate(reimb);
                                      const nominalReimb = reimb.nominal || 0;

                                      // Dynamic badge style and text
                                      const getStatusBadgeStyles = (status: string) => {
                                        if (status === 'APPROVED' || status === 'PAID' || status === 'DISBURSED') {
                                          return { background: 'rgba(0, 145, 98, 0.12)', color: '#005836' };
                                        }
                                        if (status === 'APPROVED_BY_PM') {
                                          return { background: 'rgba(29, 99, 184, 0.12)', color: '#1D63B8' };
                                        }
                                        return { background: 'rgba(216, 149, 61, 0.12)', color: '#894C06' };
                                      };

                                      const getStatusLabelText = (status: string) => {
                                        if (status === 'APPROVED' || status === 'PAID' || status === 'DISBURSED') {
                                          return 'Dicairkan';
                                        }
                                        if (status === 'APPROVED_BY_PM') {
                                          return 'Verifikasi Keuangan';
                                        }
                                        return 'Menunggu PM';
                                      };

                                      const badgeStyle = getStatusBadgeStyles(reimb.status);
                                      const statusLabel = getStatusLabelText(reimb.status);

                                      return (
                                        <div key={reimb.id} style={{
                                          display: 'grid',
                                          gridTemplateColumns: '384px 180px 150px 150px',
                                          alignItems: 'center',
                                          padding: '4px 12px',
                                          background: 'rgba(0, 145, 98, 0.02)'
                                        }}>
                                          {/* Col 1 */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 72 }}>
                                            <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '700', textTransform: 'uppercase' }}>
                                              Reimb
                                            </span>
                                            <span style={{ color: '#9A948B', fontSize: 11.50, fontFamily: 'Plus Jakarta Sans', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                              · {(reimb.ocrData as any)?.merchant || (reimb.ocrData as any)?.keterangan || 'Reimbursement'} · {formattedDate}
                                            </span>
                                            <span style={{
                                              padding: '2px 8px',
                                              borderRadius: 999,
                                              fontSize: 10,
                                              fontFamily: 'Plus Jakarta Sans',
                                              fontWeight: '600',
                                              ...badgeStyle
                                            }}>
                                              {statusLabel}
                                            </span>
                                          </div>

                                          {/* Col 2 */}
                                          <div />

                                          {/* Col 3 */}
                                          <div />

                                          {/* Col 4 */}
                                          <div style={{ color: '#6A6660', fontSize: 11, fontFamily: 'IBM Plex Mono', fontWeight: '400' }}>
                                            Rp {formatMillionsShort(nominalReimb)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '60px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12 }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Data Anggaran Kosong</div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Belum ada data nilai proyek atau pos anggaran yang diinisialisasi.</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 28px',
                borderTop: '0.80px #E6E1D4 solid',
                display: 'flex',
                justifyContent: 'flex-end',
                flexShrink: 0,
                background: 'white'
              }}>
                <button
                  type="button"
                  onClick={() => setShowDetailBudgetModal(false)}
                  style={{
                    padding: '9px 24px',
                    background: 'black',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'white',
                    textAlign: 'center',
                  }}
                  className="hover:opacity-80 transition"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* --- POP-UP MODAL: PENGAJUAN PM PENDING --- */}
      {showPendingPmModal && (() => {
        const mainAnggaranList = detailedProjectInfo?.budget?.mainAnggaran || [];

        // Flatten all items from pending proposals into submissions
        const submissions: any[] = [];
        (pendingPengajuan || []).forEach((prop: any) => {
          (prop.items || []).forEach((it: any) => {
            const isSub = it.tipe === 'SUB_ANGGARAN';
            submissions.push({
              id: it.id,
              pengajuanId: prop.id,
              judul: prop.judul,
              deskripsi: prop.deskripsi,
              user: prop.pengaju,
              createdAt: prop.createdAt,
              nominal: it.nominalAlokasi != null ? Number(it.nominalAlokasi) : 0,
              tipe: it.tipe,
              aksi: it.aksi,
              nama: it.nama,
              parentId: it.parentId,
              targetId: it.targetId,
              subAnggaran: isSub ? {
                namaSub: it.nama,
                mainAnggaran: { id: it.parentId }
              } : null,
              keteranganAnggaran: !isSub ? {
                keterangan: it.nama,
                subAnggaranId: it.parentId
              } : null,
            });
          });
        });

        // Checkbox states
        const anySelected = submissions.some((r: any) => selectedPendingIds[r.id]);
        const selectedCount = submissions.filter((r: any) => selectedPendingIds[r.id]).length;

        const handleToggleAllSelect = () => {
          const next: Record<number, boolean> = {};
          const setTo = !anySelected;
          submissions.forEach((r: any) => {
            next[r.id] = setTo;
          });
          setSelectedPendingIds(next);
        };

        const handleBulkApprove = async () => {
          await handleBulkReview('APPROVE');
        };

        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(20, 18, 14, 0.60)' }}>
            <div style={{
              width: 820,
              height: 680,
              maxHeight: '85vh',
              background: 'white',
              boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
              borderRadius: 22,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease',
            }}>

              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '0.80px #E6E1D4 solid',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Pengajuan Pos PM</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{detailedProjectInfo?.nama || 'Nama Proyek'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPendingPmModal(false)}
                  style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="hover:bg-stone-100 transition"
                >
                  <X size={16} color="#2C2A24" />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {submissions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Toggle All Select / "Batalkan Semua (n)" */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                      <button
                        type="button"
                        onClick={handleToggleAllSelect}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 7,
                          border: '1px solid #009162',
                          background: anySelected ? 'rgba(0, 145, 98, 0.05)' : 'white',
                          display: 'inline-flex',
                          cursor: 'pointer',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: 11.5,
                          color: '#005836'
                        }}
                        className="hover:opacity-80 transition"
                      >
                        {anySelected ? `Batalkan Semua (${selectedCount})` : `Pilih Semua (${submissions.length})`}
                      </button>
                    </div>

                    {/* Hierarchy table container */}
                    <div style={{ borderRadius: 10, border: '1px solid #E6E1D4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {mainAnggaranList.map((main: any, gi: number) => {
                        // Filter pending submissions belonging to this MAIN category
                        const mainPending = submissions.filter((r: any) => {
                          if (r.tipe === 'SUB_ANGGARAN') {
                            return Number(r.parentId) === Number(main.id);
                          } else {
                            // 1. Check if parent is an existing sub category under this main
                            const isChildOfExistingSub = (main.subAnggaran || []).some((s: any) => Number(s.id) === Number(r.parentId));
                            if (isChildOfExistingSub) return true;

                            // 2. Check if parent is a pending sub category under this main
                            const parentPendingSub = submissions.find((sub: any) => sub.tipe === 'SUB_ANGGARAN' && Number(sub.targetId) === Number(r.parentId));
                            if (parentPendingSub && Number(parentPendingSub.parentId) === Number(main.id)) return true;

                            return false;
                          }
                        });

                        const subAnggarans = main.subAnggaran || [];

                        // If this main has no sub budgets AND no pending submissions, we don't display it to keep clean
                        if (subAnggarans.length === 0 && mainPending.length === 0) return null;

                        return (
                          <div key={main.id} style={{ borderBottom: gi < mainAnggaranList.length - 1 ? '1px solid #E6E1D4' : 'none' }}>
                            {/* Group Header (MAIN) */}
                            <div style={{
                              padding: '9px 12px',
                              background: 'white',
                              borderBottom: '1px solid #E6E1D4',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 700,
                              fontSize: 12.5,
                              color: '#14130F',
                            }}>
                              {main.namaMain}
                            </div>

                            {/* Render existing sub budgets tree first */}
                            {subAnggarans.map((sub: any) => {
                              // Find any pending keterangan item under this existing sub
                              const childPendingKets = mainPending.filter((r: any) => {
                                return r.tipe === 'KETERANGAN' && Number(r.parentId) === Number(sub.id);
                              });

                              const subKey = `modal-sub-${sub.id}`;
                              const isSubOpen = expandedSub[subKey] !== false;
                              const hasChildren = (sub.keterangan?.length > 0) || (childPendingKets.length > 0);

                              return (
                                <div key={sub.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                  {/* Existing subbudget row */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '7px 12px 7px 14px',
                                      borderBottom: (hasChildren && isSubOpen) ? '1px solid #E6E1D4' : 'none',
                                      background: 'white',
                                      cursor: 'pointer',
                                      userSelect: 'none',
                                    }}
                                    onClick={() => setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }))}
                                    className="hover:bg-stone-50 transition"
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                      style={{
                                        marginRight: 8,
                                        flexShrink: 0,
                                        transition: 'transform 0.15s ease',
                                        transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                                      }}
                                    >
                                      <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, color: '#14130F' }}>
                                      {sub.namaSub}
                                    </span>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 400, fontSize: 11, color: '#9A948B' }}>
                                      Rp {Number(sub.nominalAlokasi).toLocaleString('id-ID')}
                                    </span>
                                  </div>

                                  {/* Render child items (existing & pending) under this subbudget if it is expanded */}
                                  {isSubOpen && (
                                    <>
                                      {/* Existing Keterangans */}
                                      {(sub.keterangan || []).map((ket: any) => {
                                        const alokasi = Number(ket.nominalAlokasi) || 0;
                                        return (
                                          <div key={`existing-ket-${ket.id}`} style={{
                                            background: 'white',
                                            borderBottom: '1px solid #E6E1D4',
                                            padding: '7px 12px 7px 34px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                          }}>
                                            <div style={{ width: 22 }} />
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                              <span style={{ color: '#9A948B', fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                                KET
                                              </span>
                                              <span style={{ color: '#6A6660', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {ket.keterangan}
                                              </span>
                                            </div>
                                            <div style={{ color: '#6A6660', fontSize: 11.50, fontFamily: "'IBM Plex Mono', monospace" }}>
                                              Rp {alokasi.toLocaleString('id-ID')}
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {/* Pending Keterangans */}
                                      {childPendingKets.map((r: any) => {
                                        const isChecked = !!selectedPendingIds[r.id];
                                        const itemDate = r.createdAt || new Date();
                                        const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                        const submitterName = r.user?.nama || 'Project Manager';
                                        const nominal = r.nominal || 0;

                                        return (
                                          <div key={`pending-ket-${r.id}`} style={{
                                            background: isChecked ? '#D5F4E3' : 'white',
                                            borderBottom: '1px solid #E6E1D4',
                                            padding: '7px 12px 7px 34px',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            transition: 'background-color 0.2s ease',
                                          }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedPendingIds(prev => ({ ...prev, [r.id]: !prev[r.id] }));
                                              }}
                                              style={{ background: 'transparent', border: 'none', padding: '3px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                              <div style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: 4,
                                                background: isChecked ? '#009162' : 'white',
                                                border: isChecked ? 'none' : '1.20px solid #E6E1D4',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}>
                                                {isChecked && (
                                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                    <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                  </svg>
                                                )}
                                              </div>
                                            </button>

                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                                  KETERANGAN BARU
                                                </span>
                                                <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                                  {r.nama}
                                                </span>
                                                <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                                  MENUNGGU
                                                </span>
                                              </div>
                                              {r.deskripsi && r.deskripsi !== 'N/A' && (
                                                <div style={{ color: '#9A948B', fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'italic' }}>
                                                  &ldquo;{r.deskripsi}&rdquo;
                                                </div>
                                              )}
                                              <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{submitterName}</span> · {formattedDate}
                                              </div>
                                            </div>

                                            <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                              Rp {Number(nominal).toLocaleString('id-ID')}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* Render pending categories that are SUB BARU directly under Main header */}
                            {mainPending.filter((r: any) => r.tipe === 'SUB_ANGGARAN' && Number(r.parentId) === Number(main.id)).map((r: any) => {
                              const isChecked = !!selectedPendingIds[r.id];
                              const subName = r.nama || 'Sub Baru';
                              const itemDate = r.createdAt || new Date();
                              const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                              const submitterName = r.user?.nama || 'Project Manager';
                              const nominal = r.nominal || 0;

                              const subKey = `modal-sub-pending-${r.id}`;
                              const isSubOpen = expandedSub[subKey] !== false;

                              // Find any pending child keterangan items proposed under this pending subbudget
                              const childPendingKets = mainPending.filter((c: any) => {
                                return c.tipe === 'KETERANGAN' && Number(c.parentId) === Number(r.targetId);
                              });

                              const hasChildren = childPendingKets.length > 0;

                              return (
                                <div key={r.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                  {/* Pending subbudget row — chevron (expand) + checkbox (select) */}
                                  <div
                                    style={{
                                      background: isChecked ? '#D5F4E3' : 'white',
                                      borderTop: '1px solid #E6E1D4',
                                      padding: '7px 12px 7px 14px',
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 6,
                                      transition: 'background-color 0.2s ease',
                                    }}
                                  >
                                    {/* Chevron toggle expand/collapse */}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }))}
                                      style={{ background: 'transparent', border: 'none', padding: '4px 2px', cursor: hasChildren ? 'pointer' : 'default', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}
                                    >
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                        fill="none"
                                        style={{
                                          transition: 'transform 0.15s ease',
                                          transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                          opacity: hasChildren ? 1 : 0,
                                        }}
                                      >
                                        <path d="M2 3.5L5 6.5L8 3.5" stroke="#6A6660" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>

                                    {/* Checkbox */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedPendingIds(prev => ({ ...prev, [r.id]: !prev[r.id] }))
                                      }
                                      style={{ background: 'transparent', border: 'none', padding: '3px 2px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}
                                    >
                                      <div style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 4,
                                        background: isChecked ? '#009162' : 'white',
                                        border: isChecked ? 'none' : '1px solid #6A6660',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                        {isChecked && (
                                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                            <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        )}
                                      </div>
                                    </button>

                                    {/* Info */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ color: '#005836', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: 0.28 }}>
                                          SUB BARU
                                        </span>
                                        <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                          {subName}
                                        </span>
                                        <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                          MENUNGGU
                                        </span>
                                      </div>
                                      <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingTop: 2 }}>
                                        Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{submitterName}</span> · {formattedDate}
                                      </div>
                                    </div>

                                    {/* Nominal */}
                                    <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      Rp {Number(nominal).toLocaleString('id-ID')}
                                    </div>
                                  </div>

                                  {/* Render child KETERANGAN BARU — hanya tampil ketika di-expand */}
                                  {isSubOpen && childPendingKets.map((c: any) => {
                                    const isChildChecked = !!selectedPendingIds[c.id];
                                    const cDate = c.createdAt || new Date();
                                    const cFormattedDate = new Date(cDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const cSubmitterName = c.user?.nama || 'Project Manager';
                                    const cNominal = c.nominal || 0;

                                    return (
                                      <div key={c.id} style={{
                                        background: isChildChecked ? '#D5F4E3' : 'white',
                                        borderTop: '1px solid #E6E1D4',
                                        padding: '7px 12px 7px 44px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 8,
                                        transition: 'background-color 0.2s ease',
                                      }}>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedPendingIds(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                                          }
                                          style={{ background: 'transparent', border: 'none', padding: '3px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                        >
                                          <div style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 4,
                                            background: isChildChecked ? '#009162' : 'white',
                                            border: isChildChecked ? 'none' : '1px solid #6A6660',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}>
                                            {isChildChecked && (
                                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                              </svg>
                                            )}
                                          </div>
                                        </button>

                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <span style={{ color: '#005D8D', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: 0.28 }}>
                                              KETERANGAN BARU
                                            </span>
                                            <span style={{ color: '#14130F', fontSize: 12.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                              {c.nama}
                                            </span>
                                            <span style={{ padding: '2px 6px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 5, color: '#894C06', fontSize: 9.50, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                                              MENUNGGU
                                            </span>
                                          </div>
                                          <div style={{ color: '#9A948B', fontSize: 10.50, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingTop: 2 }}>
                                            Diajukan oleh <span style={{ color: '#2C2A24', fontWeight: 700 }}>{cSubmitterName}</span> · {cFormattedDate}
                                          </div>
                                        </div>

                                        <div style={{ color: '#14130F', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, whiteSpace: 'nowrap' }}>
                                          Rp {Number(cNominal).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12, background: 'white' }}>
                                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Tidak Ada Pengajuan PM Pending</div>
                                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Saat ini tidak ada pengajuan pos anggaran yang menunggu persetujuan Direktur.</div>
                                  </div>
                )}
              </div>

              {/* Bottom bulk selected summary bar */}
              {selectedCount > 0 && (
                <div style={{
                  alignSelf: 'stretch',
                  background: '#D5F4E3',
                  padding: '12px 24px',
                  borderTop: '0.80px #E6E1D4 solid',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ color: '#005836', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
                    {selectedCount} pos dipilih
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const itemsToReject = submissions.filter((r: any) => selectedPendingIds[r.id]);
                        setRejectingPengajuan(itemsToReject); // pass list of items to reject
                        setRejectionReason("");
                      }}
                      style={{
                        padding: '9px 14px',
                        background: 'white',
                        border: '0.80px solid #E6E1D4',
                        borderRadius: 12,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#14130F',
                        cursor: 'pointer'
                      }}
                      className="hover:bg-stone-50 transition"
                    >
                      Tolak Terpilih ({selectedCount})
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkApprove}
                      disabled={loadingDetail}
                      style={{
                        padding: '9px 14px',
                        background: 'black',
                        border: 'none',
                        borderRadius: 12,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'white',
                        cursor: loadingDetail ? 'not-allowed' : 'pointer',
                        opacity: loadingDetail ? 0.6 : 1
                      }}
                      className="hover:opacity-80 transition"
                    >
                      {loadingDetail ? 'Memproses...' : `Setujui Terpilih (${selectedCount})`}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '0.80px #E6E1D4 solid',
                display: 'flex',
                justifyContent: 'flex-end',
                flexShrink: 0,
                background: 'white'
              }}>
                <button
                  type="button"
                  onClick={() => setShowPendingPmModal(false)}
                  style={{
                    padding: '9px 14px',
                    background: 'white',
                    borderRadius: 12,
                    border: '1px solid #E6E1D4',
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#14130F',
                    textAlign: 'center',
                  }}
                  className="hover:bg-stone-50 transition"
                >
                  Tutup
                </button>
              </div>

              {/* Tolak Pengajuan Confirmation Overlay Modal */}
              {rejectingPengajuan && (() => {
                const isArray = Array.isArray(rejectingPengajuan);
                const itemsList = isArray ? rejectingPengajuan : [rejectingPengajuan];

                // Construct displaying subtitle
                let subtitle = "";
                if (itemsList.length === 1) {
                  subtitle = itemsList[0]?.nama || '1 pengajuan';
                } else {
                  subtitle = `${itemsList.length} pengajuan terpilih`;
                }

                return (
                  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ background: 'rgba(20, 18, 14, 0.60)' }}>
                    <div style={{
                      width: 560,
                      background: 'white',
                      boxShadow: '0px 24px 64px rgba(20, 18, 14, 0.30)',
                      borderRadius: 22,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      animation: 'fadeIn 0.2s ease',
                      textAlign: 'left'
                    }}>
                      {/* Header */}
                      <div style={{
                        padding: '20px 24px',
                        borderBottom: '0.80px #E6E1D4 solid',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 17, color: '#14130F', lineHeight: '25.50px' }}>Tolak Pengajuan</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{subtitle}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRejectingPengajuan(null)}
                          style={{ padding: '6px 10px', borderRadius: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          className="hover:bg-stone-100 transition"
                        >
                          <X size={16} color="#2C2A24" />
                        </button>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: '#14130F' }}>
                          Alasan <span style={{ color: '#D36C66' }}>*</span>
                        </label>
                        <textarea
                          placeholder="Jelaskan alasan penolakan..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          style={{
                            width: '100%',
                            height: 120,
                            padding: 12,
                            border: '1.20px solid #E6E1D4',
                            borderRadius: 12,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 13,
                            color: '#14130F',
                            resize: 'none',
                            outline: 'none',
                          }}
                          className="focus:border-stone-500 transition"
                        />
                      </div>

                      {/* Footer */}
                      <div style={{
                        padding: '14px 24px',
                        borderTop: '0.80px #E6E1D4 solid',
                        display: 'flex',
                        gap: 8,
                      }}>
                        <button
                          type="button"
                          onClick={() => setRejectingPengajuan(null)}
                          style={{
                            flex: 1,
                            padding: '9px 14px',
                            background: 'white',
                            borderRadius: 12,
                            border: '0.80px solid #E6E1D4',
                            cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            color: '#14130F',
                            textAlign: 'center',
                          }}
                          className="hover:bg-stone-50 transition"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={loadingDetail}
                          onClick={async () => {
                            if (!rejectionReason.trim()) {
                              alert("Alasan penolakan wajib diisi");
                              return;
                            }
                            await handleBulkReview('REJECT', rejectionReason);
                          }}
                          style={{
                            flex: 1,
                            padding: '9px 14px',
                            background: 'black',
                            borderRadius: 12,
                            border: 'none',
                            cursor: loadingDetail ? 'not-allowed' : 'pointer',
                            opacity: loadingDetail ? 0.6 : 1,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            color: 'white',
                            textAlign: 'center',
                          }}
                          className="hover:opacity-80 transition"
                        >
                          {loadingDetail ? 'Memproses...' : 'Kirim Penolakan'}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        );
      })()}
    </main>
  );
}
