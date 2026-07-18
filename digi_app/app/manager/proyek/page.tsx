"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, Loader2, Check, X, Settings, Receipt, Eye, ClipboardList, Plus, Trash2 } from "lucide-react";

import { Project, Member, LogAktivitas } from "./types";
import { formatRupiah, formatSummaryRupiah, formatRibuan, ribuanToNumber, getStatusStyles } from "./utils";

import ProjectGrid from "./ProjectGrid";
import ModalAddProject from "./ModalAddProject";
import ModalAssignMembers from "./ModalAssignMembers";
import ModalInitBudget from "./ModalInitBudget";
import ModalDetailBudget from "./ModalDetailBudget";
import ModalPendingPm from "./ModalPendingPm";

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
  const [masterMainOptions, setMasterMainOptions] = useState([]);
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

    const selectedItemIds = Object.keys(selectedPendingIds)
      .map(Number)
      .filter(id => selectedPendingIds[id]);

    if (selectedItemIds.length === 0) return;

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

        setRejectingPengajuan(null);
        setRejectionReason("");
        setShowPendingPmModal(false);

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
  const fetchMasterMain = async () => {
    try {
      const response = await fetch('/api/budget'); // Sesuaikan dengan route API Anda
      const data = await response.json();
      
      if (response.ok) {
        setMasterMainOptions(data);
      } else {
        console.error("Gagal mengambil data:", data.error);
      }
    } catch (error) {
      console.error("Terjadi kesalahan koneksi:", error);
    }
  };

  fetchMasterMain();
}, []);

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
      setShowProjectDetail(null);
      setIsDirectEdit(false);
      fetchData();
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

      {/* Grid Utama */}
      <ProjectGrid 
        loading={loading}
        projects={projects}
        setShowInitBudget={setShowInitBudget}
        setRabTotal={setRabTotal}
        handleOpenDetailModal={handleOpenDetailModal}
        handleDirectEdit={handleDirectEdit}
        setShowAddProject={setShowAddProject}
      />

      {/* POP-UP MODAL: TAMBAH PROYEK */}
      <ModalAddProject 
        showAddProject={showAddProject}
        setShowAddProject={setShowAddProject}
        handleAddProject={handleAddProject}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        formError={formError}
        submitting={submitting}
      />

      {/* POP-UP MODAL: ATUR ANGGOTA */}
      <ModalAssignMembers 
        showAssignMembers={showAssignMembers}
        setShowAssignMembers={setShowAssignMembers}
        members={members}
        selectedProjectMembers={selectedProjectMembers}
        setSelectedProjectMembers={setSelectedProjectMembers}
        formError={formError}
        submitting={submitting}
        handleSaveMembers={handleSaveMembers}
      />

      {/* POP-UP MODAL: INISIALISASI BUDGET */}
      <ModalInitBudget 
        showInitBudget={showInitBudget}
        setShowInitBudget={setShowInitBudget}
        detailedProjectInfo={detailedProjectInfo}
        rabTotal={rabTotal}
        setRabTotal={setRabTotal}
        posAnggaranList={posAnggaranList}
        setPosAnggaranList={setPosAnggaranList}
        masterBudgetOptions={masterBudgetOptions}
        masterMainOptions={masterMainOptions}
        formError={formError}
        submitting={submitting}
        handleInitBudget={handleInitBudget}
      />

      {/* MODAL SIDEBAR: DETAIL PROYEK */}
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
                      <div className="pb-2">
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                          Rincian Pos Anggaran
                        </h3>
                      </div>

                      <div className="flex flex-col gap-2 pb-2">
                        <div className="flex gap-2 w-full">
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

                      {detailedProjectInfo?.budget?.posAnggaran ? (
                        <div className="space-y-6">
                          {detailedProjectInfo.budget.posAnggaran.map((pos: any, index: number) => {
                            const nominalAlokasi = parseFloat(pos.nominalAlokasi) || 0;
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

      {/* --- POP-UP MODAL EDIT PROYEK DI TENGAH LAYAR --- */}
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

      {/* POP-UP MODAL: DETAIL ANGGARAN TREE VIEW */}
      <ModalDetailBudget 
        showDetailBudgetModal={showDetailBudgetModal}
        setShowDetailBudgetModal={setShowDetailBudgetModal}
        detailedProjectInfo={detailedProjectInfo}
        expandedMain={expandedMain}
        setExpandedMain={setExpandedMain}
        expandedSub={expandedSub}
        setExpandedSub={setExpandedSub}
        expandedKet={expandedKet}
        setExpandedKet={setExpandedKet}
      />

      {/* POP-UP MODAL: PENGAJUAN PM PENDING */}
      <ModalPendingPm 
        showPendingPmModal={showPendingPmModal}
        setShowPendingPmModal={setShowPendingPmModal}
        detailedProjectInfo={detailedProjectInfo}
        pendingPengajuan={pendingPengajuan}
        selectedPendingIds={selectedPendingIds}
        setSelectedPendingIds={setSelectedPendingIds}
        expandedSub={expandedSub}
        setExpandedSub={setExpandedSub}
        rejectingPengajuan={rejectingPengajuan}
        setRejectingPengajuan={setRejectingPengajuan}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        handleBulkReview={handleBulkReview}
      />
    </main>
  );
}