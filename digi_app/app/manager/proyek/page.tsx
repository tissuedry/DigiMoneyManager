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
    posAnggaran: { id: number; namaPos: string; nominalAlokasi: string }[];
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
  const [rejectingReimbursement, setRejectingReimbursement] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"4M" | "12M" | "YTD">("12M");

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
    { deskripsi: "Akomodasi & Transportasi", nominalAlokasi: "" },
    { deskripsi: "Konsumsi", nominalAlokasi: "" },
    { deskripsi: "Perlengkapan & ATK", nominalAlokasi: "" },
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

  const handleProcessReimbursement = async (reimbursementId: number, action: 'APPROVE' | 'REJECT', catatan?: string) => {
    if (!detailedProjectInfo) return;
    setLoadingDetail(true);
    setFormError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/reimbursements/${reimbursementId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, catatan }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'APPROVE' ? "Pengajuan reimbursement berhasil disetujui!" : "Pengajuan reimbursement ditolak.");
        
        // Reset rejection states
        setRejectingReimbursement(null);
        setRejectionReason("");

        // Refresh detail modal
        const detailRes = await fetch(`/api/proyek/${detailedProjectInfo.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.project) {
          setDetailedProjectInfo(detailData.project);
        }
        fetchData();
      } else {
        alert(data.message || "Gagal memproses pengajuan");
        setFormError(data.message || "Gagal memproses pengajuan");
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
    if (Math.abs(sum - total) > 0.01) {
      setFormError(`Jumlah alokasi item (Rp ${sum.toLocaleString("id-ID")}) harus sama dengan total Nilai Proyek (Rp ${total.toLocaleString("id-ID")})`);
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

      {/* MODAL: INISIALISASI BUDGET */}
      {showInitBudget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Inisialisasi Nilai Proyek</h3>
              <button type="button" onClick={() => setShowInitBudget(null)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInitBudget} className="p-6 space-y-4">
              <div className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-amber-800">Proyek</h4>
                <p className="text-[13px] font-bold text-stone-800">{showInitBudget.nama}</p>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Total Nilai Proyek (Rupiah)</label>
                <div className="relative flex items-center">
                  {/* Label Rp statis di depan input agar tampilan tetap rapi */}
                  <span className="absolute left-4 text-[13px] font-bold text-stone-400 select-none">Rp</span>
                  <input
                    type="text"
                    required
                    value={rabTotal}
                    // Otomatis memberi titik saat mengetik angka di atas 1.000
                    onChange={(e) => setRabTotal(formatRibuan(e.target.value))}
                    placeholder="1.000.000"
                    className="w-full border border-stone-200 rounded-xl pl-11 pr-4 py-2.5 text-[13px] font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-bold text-stone-600">Breakdown Pos Anggaran</label>
                  <button
                    type="button"
                    onClick={() => setPosAnggaranList([...posAnggaranList, { deskripsi: "", nominalAlokasi: "" }])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d6a4f] hover:underline"
                  >
                    <Plus size={12} /> Tambah Item
                  </button>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {posAnggaranList.map((pos, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={pos.deskripsi}
                        onChange={(e) => {
                          const newList = [...posAnggaranList];
                          newList[idx].deskripsi = e.target.value;
                          setPosAnggaranList(newList);
                        }}
                        placeholder="Deskripsi Pos Anggaran"
                        className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={pos.nominalAlokasi}
                        onChange={(e) => {
                          const newList = [...posAnggaranList];
                          newList[idx].nominalAlokasi = formatRibuan(e.target.value);
                          setPosAnggaranList(newList);
                        }}
                        placeholder="Nominal (Rp)"
                        className="w-28 border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white font-mono text-right focus:outline-none"
                      />
                      {posAnggaranList.length > 1 && (
                        <button type="button" onClick={() => setPosAnggaranList(posAnggaranList.filter((_, i) => i !== idx))} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-50 transition">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}
              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setShowInitBudget(null)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#2d6a4f] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Nilai Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                              setShowPendingPmModal(true);
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
      {showDetailBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1040px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">

            {/* Header */}
            <div className="px-6 py-5 flex items-start justify-between flex-shrink-0">
              <div className="flex flex-col gap-1">
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#14130F', lineHeight: '27px' }}>Detail Anggaran</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 14, color: '#757575', lineHeight: '14px' }}>{detailedProjectInfo?.nama || "Nama Proyek"}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailBudgetModal(false)}
                className="mt-1 p-1 hover:opacity-70 transition cursor-pointer"
              >
                <X size={16} color="#902F33" />
              </button>
            </div>

            {/* Konten */}
            <div className="overflow-y-auto flex-1 px-6 pb-6">

              {/* Column Headers */}
              <div className="flex justify-between items-center py-2 border-b border-[#E6E1D4]">
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 10, color: '#9A948B', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '18px' }}>MAIN · SUB · KETERANGAN</span>
                <div className="flex items-center" style={{ width: 678, paddingLeft: 58, paddingRight: 0, gap: 25 }}>
                  <span style={{ width: 380, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 10, color: '#9A948B', textTransform: 'uppercase', lineHeight: '18px' }}>Progress</span>
                  <span style={{ width: 95, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 10, color: '#9A948B', textTransform: 'uppercase', lineHeight: '18px' }}>Alokasi</span>
                  <span style={{ width: 62, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 10, color: '#9A948B', textTransform: 'uppercase', lineHeight: '18px' }}>Realisasi</span>
                </div>
              </div>

              {/* Tree Rows */}
              <div className="flex flex-col gap-2 mt-2">
                {detailedProjectInfo?.budget?.posAnggaran && detailedProjectInfo.budget.posAnggaran.length > 0 ? (
                  detailedProjectInfo.budget.posAnggaran.map((pos: any, idxPos: number) => {
                    const alokasiPos = parseFloat(pos.nominalAlokasi) || 0;
                    const terpakaiPos = parseFloat(pos.nominalTerpakai) || 0;
                    const pctPos = alokasiPos > 0 ? Math.min((terpakaiPos / alokasiPos) * 100, 100) : 0;
                    const pctPosText = alokasiPos > 0 ? ((terpakaiPos / alokasiPos) * 100).toFixed(1) : '0.0';

                    let mainBarColor = '#009162';
                    let mainPctColor = '#1D6448';
                    let mainPctBg = '#EEF8F4';
                    if (pctPos >= 90) { mainBarColor = '#D36C66'; mainPctColor = '#902F33'; mainPctBg = '#FDF3F2'; }
                    else if (pctPos >= 75) { mainBarColor = '#D8953D'; mainPctColor = '#7A4A10'; mainPctBg = '#FDF6EC'; }
                    const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;
                    const isMainOpen = hasSub && expandedMain[idxPos] !== false;

                    return (
                      <div key={pos.id || idxPos} className="rounded-lg overflow-hidden">
                        {/* MAIN Row - clickable toggle only if hasSub is true */}
                        <div
                          className={`flex justify-between items-center py-2 px-2 select-none ${hasSub ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{ background: '#F6F4EF', borderRadius: isMainOpen ? '8px 8px 0 0' : 8 }}
                          onClick={() => {
                            if (hasSub) {
                              setExpandedMain(prev => ({ ...prev, [idxPos]: !isMainOpen }));
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {/* Chevron SVG only if hasSub is true */}
                            {hasSub ? (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s ease', transform: isMainOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <div style={{ width: 10 }} />
                            )}
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13.5, color: '#14130F', lineHeight: '20.25px' }}>{pos.namaPos || pos.deskripsi}</span>
                          </div>
                          <div className="flex items-center" style={{ gap: 24 }}>
                            <div style={{ width: 350, height: 6, background: 'white', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ height: 6, background: mainBarColor, borderRadius: 999, width: `${pctPos}%`, position: 'absolute', left: 0, top: 0 }} />
                            </div>
                            <div style={{ padding: 4, background: mainPctBg, borderRadius: 8, minWidth: 52, textAlign: 'center' }}>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: mainPctColor, lineHeight: '18px' }}>{pctPosText}%</span>
                            </div>
                            <div className="flex items-end gap-0.5" style={{ width: 95, justifyContent: 'flex-end' }}>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(alokasiPos).replace('Rp ', '')}</span>
                            </div>
                            <div className="flex items-end gap-0.5" style={{ width: 62, justifyContent: 'flex-end' }}>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(terpakaiPos).replace('Rp ', '')}</span>
                            </div>
                          </div>
                        </div>

                        {/* SUB + Keterangan Rows - only shown when MAIN is open */}
                        {isMainOpen && (
                          pos.subAnggaran && pos.subAnggaran.length > 0 ? (
                            <div className="flex flex-col bg-white rounded-b-lg" style={{ border: '1px solid #E6E1D4', borderTop: 'none' }}>
                              {pos.subAnggaran.map((sub: any, idxSub: number) => {
                                const alokasiSub = parseFloat(sub.nominalAlokasi) || 0;
                                const terpakaiSub = parseFloat(sub.nominalTerpakai) || 0;
                                const pctSub = alokasiSub > 0 ? Math.min((terpakaiSub / alokasiSub) * 100, 100) : 0;
                                const pctSubText = alokasiSub > 0 ? ((terpakaiSub / alokasiSub) * 100).toFixed(1) : '0.0';

                                let subBarColor = '#009162';
                                let subPctColor = '#1D6448';
                                let subPctBg = '#EEF8F4';
                                if (pctSub >= 90) { subBarColor = '#D36C66'; subPctColor = '#902F33'; subPctBg = '#FDF3F2'; }
                                else if (pctSub >= 75) { subBarColor = '#D8953D'; subPctColor = '#7A4A10'; subPctBg = '#FDF6EC'; }

                                const subKey = `${idxPos}-${idxSub}`;
                                const hasKet = sub.keterangan && sub.keterangan.length > 0;
                                // Default SUB expanded = true
                                const isSubOpen = hasKet && expandedSub[subKey] !== false;

                                return (
                                  <div key={sub.id || idxSub}>
                                    {/* divider before each sub except first */}
                                    {idxSub > 0 && <div style={{ height: 1, background: '#E6E1D4' }} />}

                                    {/* SUB Row - clickable toggle only if hasKet is true */}
                                    <div
                                      className={`flex justify-between items-center py-2 px-2 pl-8 select-none transition-colors ${hasKet ? 'cursor-pointer hover:bg-stone-50/60' : 'cursor-default'}`}
                                      onClick={() => {
                                        if (hasKet) {
                                          setExpandedSub(prev => ({ ...prev, [subKey]: !isSubOpen }));
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {hasKet ? (
                                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s ease', transform: isSubOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                            <path d="M2 3.5L5 6.5L8 3.5" stroke="#14130F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        ) : (
                                          <div style={{ width: 10 }} />
                                        )}
                                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13.5, color: '#14130F', lineHeight: '20.25px' }}>{sub.namaSub}</span>
                                      </div>
                                      <div className="flex items-center" style={{ gap: 24 }}>
                                        <div style={{ width: 350, height: 6, background: '#F6F4EF', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                                          <div style={{ height: 6, background: subBarColor, borderRadius: 999, width: `${pctSub}%`, position: 'absolute', left: 0, top: 0 }} />
                                        </div>
                                        <div style={{ padding: 4, background: subPctBg, borderRadius: 8, minWidth: 52, textAlign: 'center' }}>
                                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: subPctColor, lineHeight: '18px' }}>{pctSubText}%</span>
                                        </div>
                                        <div className="flex items-end gap-0.5" style={{ width: 95, justifyContent: 'flex-end' }}>
                                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(alokasiSub).replace('Rp ', '')}</span>
                                        </div>
                                        <div className="flex items-end gap-0.5" style={{ width: 62, justifyContent: 'flex-end' }}>
                                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(terpakaiSub).replace('Rp ', '')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Keterangan Rows - only shown when SUB is open */}
                                    {isSubOpen && sub.keterangan && sub.keterangan.length > 0 && sub.keterangan.map((ket: any, idxKet: number) => {
                                      const alokasiKet = parseFloat(ket.nominalAlokasi) || 0;
                                      const realisasiKet = parseFloat(ket.nominalRealisasi) || 0;
                                      const pctKet = alokasiKet > 0 ? ((realisasiKet / alokasiKet) * 100).toFixed(1) : '0.0';

                                      return (
                                        <div key={ket.id || idxKet}>
                                          <div style={{ height: 1, background: '#E6E1D4' }} />
                                          <div className="flex justify-between items-center py-2 px-2 pl-16">
                                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 12, color: 'black', lineHeight: '16.5px' }}>{ket.keterangan}</span>
                                            <div className="flex items-center" style={{ gap: 24 }}>
                                              <div style={{ width: 350 }} />
                                              <div style={{ padding: 4, borderRadius: 8, minWidth: 52, textAlign: 'center' }}>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{pctKet}%</span>
                                              </div>
                                              <div className="flex items-end gap-0.5" style={{ width: 95, justifyContent: 'flex-end' }}>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(alokasiKet).replace('Rp ', '')}</span>
                                              </div>
                                              <div className="flex items-end gap-0.5" style={{ width: 62, justifyContent: 'flex-end' }}>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 10.2, color: '#9A948B', lineHeight: '15.3px' }}>Rp</span>
                                                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 12, color: '#14130F', lineHeight: '18px' }}>{formatSummaryRupiah(realisasiKet).replace('Rp ', '')}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-3 pl-10 text-[11px] text-stone-400 italic bg-white border border-[#E6E1D4] border-t-0 rounded-b-lg">Tidak ada sub-pos anggaran</div>
                          )
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-stone-400 font-semibold border border-stone-200 rounded-xl">
                    Data anggaran belum diinisialisasi
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- POP-UP MODAL: PENGAJUAN PM PENDING --- */}
      {showPendingPmModal && (() => {
        const submissions = detailedProjectInfo?.pendingReimbursements || [];
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(20, 18, 14, 0.60)' }}>
            <div style={{
              width: 560,
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
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {submissions.length > 0 ? submissions.map((r: any, index: number) => {
                  const mainName = r.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
                    || r.subAnggaran?.mainAnggaran?.namaMain
                    || r.posAnggaran?.namaPos
                    || 'N/A';
                  const subName = r.keteranganAnggaran?.subAnggaran?.namaSub
                    || r.subAnggaran?.namaSub
                    || null;
                  const ketName = r.keteranganAnggaran?.keterangan
                    || r.deskripsi
                    || 'N/A';
                  const isNewSub = !r.keteranganAnggaran && r.subAnggaran && !r.subAnggaran.id;
                  const isNewKet = !!r.keteranganAnggaran && !r.keteranganAnggaran.id;

                  const itemDate = r.createdAt || r.timestamp || new Date();
                  const formattedDate = new Date(itemDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  const submitterName = r.user?.nama || 'Karyawan';
                  const nominal = r.nominal || 0;

                  return (
                    <div key={r.id || index} style={{
                      padding: 14,
                      borderRadius: 12,
                      border: '0.80px solid #E6E1D4',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                      background: 'white',
                    }}>
                      {/* Top row: breadcrumb + status badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, marginRight: 12 }}>
                          {/* Breadcrumb */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: '#9A948B', letterSpacing: 0.42, lineHeight: '15.75px' }}>{mainName}</span>
                            {subName && <>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}><path d="M2 1.5L5.5 4L2 6.5" stroke="#9A948B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: isNewSub ? '#005836' : '#9A948B', letterSpacing: 0.42, lineHeight: '15.75px' }}>{isNewSub ? 'SUB BARU' : subName}</span>
                            </>}
                            {ketName && ketName !== 'N/A' && !isNewSub && <>
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}><path d="M2 1.5L5.5 4L2 6.5" stroke="#9A948B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: isNewKet ? '#005D8D' : '#9A948B', letterSpacing: 0.42, lineHeight: '15.75px' }}>{isNewKet ? 'KETERANGAN BARU' : ketName}</span>
                            </>}
                          </div>
                          {/* Item name */}
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#14130F', lineHeight: '21px' }}>
                            {isNewSub ? subName : isNewKet ? ketName : (ketName !== 'N/A' ? ketName : subName)}
                          </div>
                        </div>
                        {/* Status badge */}
                        <div style={{ padding: '3px 9px', background: 'rgba(216, 149, 61, 0.15)', borderRadius: 999, flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: '#894C06', lineHeight: '15.75px' }}>Menunggu</span>
                        </div>
                      </div>

                      {/* Deskripsi */}
                      {r.keterangan && (
                        <div style={{ paddingTop: 8 }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{r.keterangan}</div>
                        </div>
                      )}

                      {/* Footer row: submitter + nominal */}
                      <div style={{ paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, color: '#9A948B', lineHeight: '17.25px' }}>
                          Diajukan oleh{' '}
                          <span style={{ fontWeight: 700, color: '#2C2A24' }}>{submitterName}</span>
                          <span style={{ color: '#9A948B' }}> · {formattedDate}</span>
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 11.5, color: '#2C2A24', lineHeight: '17.25px' }}>
                          Rp {(nominal / 1_000_000).toFixed(1)} jt
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ paddingTop: 10 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleProcessReimbursement(r.id, 'APPROVE')}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              background: '#14130F',
                              borderRadius: 12,
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 600,
                              fontSize: 12.5,
                              color: '#FBFAF6',
                            }}
                            className="hover:opacity-80 transition"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingReimbursement(r); setRejectionReason(""); }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              background: 'white',
                              borderRadius: 12,
                              border: '0.80px solid #E6E1D4',
                              cursor: 'pointer',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontWeight: 600,
                              fontSize: 12.5,
                              color: '#14130F',
                            }}
                            className="hover:bg-stone-50 transition"
                          >
                            Tidak Setujui
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px solid #E6E1D4', borderRadius: 12 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#14130F', marginBottom: 6 }}>Tidak Ada Pengajuan PM Pending</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#9A948B' }}>Saat ini tidak ada pengajuan yang menunggu persetujuan Project Manager.</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '0.80px #E6E1D4 solid',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}>
                <button
                  type="button"
                  onClick={() => setShowPendingPmModal(false)}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    background: 'black',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
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

              {/* Tolak Pengajuan Confirmation Overlay Modal */}
              {rejectingReimbursement && (() => {
                const mainName = rejectingReimbursement.keteranganAnggaran?.subAnggaran?.mainAnggaran?.namaMain
                  || rejectingReimbursement.subAnggaran?.mainAnggaran?.namaMain
                  || rejectingReimbursement.posAnggaran?.namaPos
                  || 'N/A';
                const subName = rejectingReimbursement.keteranganAnggaran?.subAnggaran?.namaSub
                  || rejectingReimbursement.subAnggaran?.namaSub
                  || null;
                const ketName = rejectingReimbursement.keteranganAnggaran?.keterangan
                  || rejectingReimbursement.deskripsi
                  || 'N/A';
                const isNewSub = !rejectingReimbursement.keteranganAnggaran && rejectingReimbursement.subAnggaran && !rejectingReimbursement.subAnggaran.id;
                const isNewKet = !!rejectingReimbursement.keteranganAnggaran && !rejectingReimbursement.keteranganAnggaran.id;

                const displayName = isNewSub ? subName : isNewKet ? ketName : (ketName !== 'N/A' ? ketName : subName);

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
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6A6660', lineHeight: '18.75px' }}>{displayName}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRejectingReimbursement(null)}
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
                          onClick={() => setRejectingReimbursement(null)}
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
                          onClick={() => {
                            if (!rejectionReason.trim()) {
                              alert("Alasan penolakan wajib diisi");
                              return;
                            }
                            handleProcessReimbursement(rejectingReimbursement.id, 'REJECT', rejectionReason);
                          }}
                          style={{
                            flex: 1,
                            padding: '9px 14px',
                            background: 'black',
                            borderRadius: 12,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: 13,
                            color: 'white',
                            textAlign: 'center',
                          }}
                          className="hover:opacity-80 transition"
                        >
                          Kirim Penolakan
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
