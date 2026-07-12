"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, Loader2, Check, X, Calendar, Briefcase, DollarSign, Plus, Trash2, Settings, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";

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
  const [detailedProjectInfo, setDetailedProjectInfo] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"4M" | "12M" | "YTD">("12M");

  const detailTotalRAB = parseFloat(detailedProjectInfo?.budget?.rabTotal) || 0;
  const detailTotalTerpakai = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
  const detailPercentUsed = detailTotalRAB > 0 ? Math.round((detailTotalTerpakai / detailTotalRAB) * 100) : 0;
  const detailBarWidth = Math.min(detailPercentUsed, 100);
  const sudahReimburseNominal = parseFloat(detailedProjectInfo?.budget?.totalReimbursement) || 0;
  const belumReimburseNominal = Math.max(0, detailTotalTerpakai - sudahReimburseNominal);

  const inflowNominal = detailTotalRAB;
  const outflowNominal = detailTotalTerpakai;
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
      fetchData();
      handleOpenDetailModal(data.project || showProjectDetail);
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
    const activeOtherRows = otherRows.filter((r) => r.userId !== "" || r.role.trim() !== "");

    for (const r of activeOtherRows) {
      if (!r.userId) {
        setFormError("Nama anggota tim tidak boleh kosong. Silakan pilih nama atau hapus baris.");
        scrollToSection("tim-sec");
        return;
      }
      if (!r.role.trim()) {
        setFormError("Role/spesialisasi anggota tim tidak boleh kosong. Silakan ketik role (misal: DevOps) atau hapus baris.");
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

    const total = parseFloat(rabTotal);
    if (isNaN(total) || total <= 0) {
      setFormError("Total Nilai Proyek harus berupa angka positif");
      return;
    }

    const sum = posAnggaranList.reduce((acc, pos) => acc + (parseFloat(pos.nominalAlokasi) || 0), 0);
    if (Math.abs(sum - total) > 0.01) {
      setFormError(`Jumlah alokasi item (Rp ${sum.toLocaleString()}) harus sama dengan total Nilai Proyek (Rp ${total.toLocaleString()})`);
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
            nominalAlokasi: parseFloat(pos.nominalAlokasi),
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
                      {project.tanggalSelesai && ` – ${new Date(project.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
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
                        handleOpenDetailModal(project);
                        setEditMode(true);
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
                    // 💡 Otomatis memberi titik saat mengetik angka di atas 1.000
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
                        type="number"
                        required
                        value={pos.nominalAlokasi}
                        onChange={(e) => {
                          const newList = [...posAnggaranList];
                          newList[idx].nominalAlokasi = e.target.value;
                          setPosAnggaranList(newList);
                        }}
                        placeholder="Nominal (Rp)"
                        className="w-28 border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white font-mono text-right"
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
      {showProjectDetail && (
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
                            {[
                              { label: "Jan", inflowVal: detailTotalRAB * 0.75, outflowVal: detailTotalTerpakai * 0.60 },
                              { label: "Feb", inflowVal: detailTotalRAB * 0.80, outflowVal: detailTotalTerpakai * 0.68 },
                              { label: "Mar", inflowVal: detailTotalRAB * 0.90, outflowVal: detailTotalTerpakai * 0.85 },
                              { label: "Apr", inflowVal: detailTotalRAB * 0.95, outflowVal: detailTotalTerpakai * 0.88 },
                              { label: "Mei", inflowVal: detailTotalRAB * 0.85, outflowVal: detailTotalTerpakai * 0.78 },
                              { label: "Jun", inflowVal: detailTotalRAB * 1.00, outflowVal: detailTotalTerpakai * 0.92 },
                              { label: "Jul", inflowVal: detailTotalRAB * 0.20, outflowVal: detailTotalTerpakai * 0.10 },
                            ].map((bar, idx) => {
                              const inflowHeight = detailTotalRAB > 0 ? Math.min(100, Math.round((bar.inflowVal / detailTotalRAB) * 100)) : 0;
                              const outflowHeight = detailTotalRAB > 0 ? Math.min(100, Math.round((bar.outflowVal / detailTotalRAB) * 100)) : 0;

                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                                  <div className="w-full flex justify-center items-end gap-0.5 h-full">
                                    <div
                                      className="w-2.5 bg-[#2d6a4f] rounded-t-sm transition-all duration-500 ease-out"
                                      style={{ height: `${inflowHeight}%` }}
                                      title={`Inflow: ${formatSummaryRupiah(bar.inflowVal)}`}
                                    />
                                    <div
                                      className="w-2.5 bg-[#d4a373] rounded-t-sm transition-all duration-500 ease-out"
                                      style={{ height: `${outflowHeight}%` }}
                                      title={`Outflow: ${formatSummaryRupiah(bar.outflowVal)}`}
                                    />
                                  </div>
                                  <span className="text-[9px] font-medium text-stone-400 mt-1 block">{bar.label}</span>
                                </div>
                              );
                            })}
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
                      {/* Header Section dengan Tombol Edit Nilai Proyek */}
                      <div className="flex justify-between items-center pb-2">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                          Rincian Pos Anggaran
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            if (detailedProjectInfo?.budget) {
                              setRabTotal(detailedProjectInfo.budget.rabTotal);

                              const existingPos = detailedProjectInfo.budget.posAnggaran.map((pos: any) => ({
                                deskripsi: pos.namaPos || pos.deskripsi,
                                nominalAlokasi: pos.nominalAlokasi
                              }));
                              setPosAnggaranList(existingPos);
                            }
                            setShowInitBudget(showProjectDetail);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-bold rounded-xl shadow-sm transition cursor-pointer"
                        >
                          <Settings size={13} className="text-stone-500" />
                          Edit Nilai Proyek
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
                          <div key={row.id} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-5">
                              <input type="text" placeholder="Ketik role karyawan... (cth. DevOps)" required disabled={row.isLocked} value={row.role} onChange={(e) => { const updated = [...teamRows]; updated[idx].role = e.target.value; setTeamRows(updated); }} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white" />
                            </div>
                            <div className="col-span-7">
                              <select required value={row.userId} onChange={(e) => { const updated = [...teamRows]; updated[idx].userId = e.target.value; setTeamRows(updated); }} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] bg-white">
                                <option value="" disabled hidden>Pilih nama...</option>
                                {members.map((member) => (
                                  <option key={member.id} value={member.id}>{member.nama}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex gap-3 border-t border-stone-100 mt-4">
                        <button type="button" onClick={handleSaveTeamRows} disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2d6a4f] text-white text-[12px] font-bold rounded-xl shadow-sm">
                          Simpan Penugasan Tim
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-stone-100 bg-white flex gap-3 flex-shrink-0">
                  <button type="button"
                    onClick={() => setEditMode(true)}
                    className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-[13px] font-semibold text-stone-700 transition flex items-center justify-center gap-1.5">
                    ⚙ Edit Proyek
                  </button>
                  {(detailedProjectInfo?.status || showProjectDetail.status) !== "AKTIF" && (
                    <button
                      type="button"
                      onClick={handleReactivateProject}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-[#00966c] hover:bg-[#007d5a] text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
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
              <button type="button" onClick={() => setEditMode(false)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition">
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
                <button type="button" onClick={() => setEditMode(false)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition">Batal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-xl transition flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}