"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, Loader2, Check, Calendar, Briefcase, DollarSign, Settings } from "lucide-react";

import { Project, LogAktivitas, Member } from "./types";
import { formatRupiah, formatSummaryRupiah, formatRibuan, ribuanToNumber, getStatusStyles, formatStatusLabel } from "./utils";

import AddProjectModal from "./AddProjectModal";
import AssignMembersModal from "./AssignMembersModal";
import EditProjectModal from "./EditProjectModal";
import InitBudgetModal from "./InitBudgetModal";
import ProjectDetailSidebar from "./ProjectDetailSidebar";
import DetailBudgetModal from "./DetailBudgetModal";
import PendingPmModal from "./PendingPmModal";
import SuccessDialog from "@/components/success-dialog";
import ConfirmDialog from "@/components/confirm-dialog";
import Toast from "@/components/toast";

export default function KelolaProyekPage() {
  const [activeStatus, setActiveStatus] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const statuses = ['Semua', 'Planning', 'Active', 'Done', 'Canceled'];

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddProject, setShowAddProject] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(6); // Default 6 proyek per halaman
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
  const [showBulkRejectToast, setShowBulkRejectToast] = useState(false);
  const [bulkRejectedCount, setBulkRejectedCount] = useState(0);
  const [showBulkApproveSuccess, setShowBulkApproveSuccess] = useState(false);
  const [bulkApprovedCount, setBulkApprovedCount] = useState(0);
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [expandedKet, setExpandedKet] = useState<Record<string, boolean>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"4M" | "12M" | "YTD">("12M");

  // Pengajuan anggaran pending (Direktur review)
  const [pendingPengajuan, setPendingPengajuan] = useState<any[]>([]);
  const [loadingPengajuan, setLoadingPengajuan] = useState(false);

  const detailTotalRAB = parseFloat(detailedProjectInfo?.budget?.rabTotal) || 0;
  const detailTotalTerpakai = parseFloat(detailedProjectInfo?.budget?.totalPengeluaran) || 0;
  const detailPercentUsed = detailTotalRAB > 0 ? Math.round((detailTotalTerpakai / detailTotalRAB) * 100) : 0;
  const detailBarWidth = Math.min(detailPercentUsed, 100);
  const sudahReimburseNominal = detailedProjectInfo?.sudahReimburseNominal !== undefined
    ? Number(detailedProjectInfo.sudahReimburseNominal)
    : (parseFloat(detailedProjectInfo?.budget?.totalReimbursement) || 0);

  const belumReimburseNominal = detailedProjectInfo?.belumReimburseNominal !== undefined
    ? Number(detailedProjectInfo.belumReimburseNominal)
    : (detailedProjectInfo?.pendingReimbursements
      ? detailedProjectInfo.pendingReimbursements.reduce((sum: number, r: any) => sum + Number(r.nominal || 0), 0)
      : 0);

  const sudahReimburseCount = detailedProjectInfo?.sudahReimburseCount ?? detailedProjectInfo?.reimbursementDisetujuiCount ?? 0;
  const belumReimburseCount = detailedProjectInfo?.belumReimburseCount ?? detailedProjectInfo?.reimbursementBelumDisetujuiCount ?? (detailedProjectInfo?.pendingReimbursements?.length ?? 0);

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

  // Forms state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [showAddProjectConfirm, setShowAddProjectConfirm] = useState(false);
  const [showAddProjectSuccess, setShowAddProjectSuccess] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showEditProjectConfirm, setShowEditProjectConfirm] = useState(false);
  const [showEditProjectSuccess, setShowEditProjectSuccess] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");
  const [showInitBudgetConfirm, setShowInitBudgetConfirm] = useState(false);
  const [showInitBudgetSuccess, setShowInitBudgetSuccess] = useState(false);
  const [initBudgetProjectName, setInitBudgetProjectName] = useState("");
  const [showSaveTeamConfirm, setShowSaveTeamConfirm] = useState(false);
  const [showSaveTeamToast, setShowSaveTeamToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showReactivateSuccess, setShowReactivateSuccess] = useState(false);
  const [reactivatedProjectName, setReactivatedProjectName] = useState("");

  const [projectForm, setProjectForm] = useState({
    nama: "",
    deskripsi: "",
    rabTotal: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    status: "PLANNING",
  });

  const [editForm, setEditForm] = useState({
    nama: "",
    deskripsi: "",
    rabTotal: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    status: "PLANNING",
  });

  // Assign members state
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<{ userId: number; role: string }[]>([]);
  const [initialProjectMembers, setInitialProjectMembers] = useState<{ userId: number; role: string }[]>([]);

  // Budget initialization state
  const [rabTotal, setRabTotal] = useState("");
  const [posAnggaranList, setPosAnggaranList] = useState<{ deskripsi: string; nominalAlokasi: string }[]>([
    { deskripsi: "", nominalAlokasi: "" },
  ]);

  const [activeTab, setActiveTab] = useState<"ringkasan" | "anggaran" | "tim" | "pemasukan">("ringkasan");
  const [teamRows, setTeamRows] = useState<{ id: string; role: string; userId: string; isLocked: boolean }[]>([
    { id: "row-pm", role: "Project Manager", userId: "", isLocked: true },
    { id: "row-1", role: "", userId: "", isLocked: false }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proyekRes, membersRes] = await Promise.all([
        // Gunakan variabel limit di URL
        fetch(`/api/proyek?search=${searchQuery}&status=${activeStatus}&page=${currentPage}&limit=${limit}`),
        fetch("/api/manager/members"),
      ]);

      const [proyekData, membersData] = await Promise.all([proyekRes.json(), membersRes.json()]);

      setProjects(proyekData.projects ?? []);
      setTotalPages(proyekData.pagination?.totalPages ?? 1);
      setMembers(membersData.members ?? []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset ke halaman 1 jika user mencari, ganti status, atau MENGGANTI LIMIT
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeStatus, limit]); // <-- tambahkan limit di sini

  // Panggil API saat ada perubahan
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeStatus, currentPage, limit]); // <-- tambahkan limit di sini

  const fetchPendingPengajuan = async (proyekId: number) => {
    setLoadingPengajuan(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/pengajuan-anggaran?status=PENDING`);
      const data = await res.json();
      const list = data.pengajuan || [];
      setPendingPengajuan(list);

      const initial: Record<number, boolean> = {};
      list.forEach((prop: any) => {
        initial[prop.id] = true;
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

    const selectedIds = (pendingPengajuan || [])
      .filter((p: any) => selectedPendingIds[p.id])
      .map((p: any) => p.id);
    if (selectedIds.length === 0) return;

    setLoadingDetail(true);
    setFormError("");
    setSuccess("");

    try {
      const results = await Promise.all(
        selectedIds.map((id: number) =>
          fetch(`/api/pengajuan-anggaran/${id}/review`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action, catatan }),
          })
        )
      );

      const allOk = results.every(res => res.ok);
      if (allOk) {
        if (action === 'REJECT') {
          setBulkRejectedCount(selectedIds.length);
          setShowBulkRejectToast(true);
        } else {
          setBulkApprovedCount(selectedIds.length);
          setShowBulkApproveSuccess(true);
        }

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
        const failedBodies = await Promise.all(
          results.filter(res => !res.ok).map(res => res.json().catch(() => ({})))
        );
        const messages = failedBodies.map((b: any) => b.message).filter(Boolean);
        const errorText = messages.length > 0 ? messages.join(' ') : "Beberapa pengajuan gagal diproses.";
        setErrorMessage(errorText);
        setFormError(errorText);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi saat memproses pengajuan");
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

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!projectForm.nama || !projectForm.nama.trim()) {
      setFormError("Nama proyek wajib diisi.");
      return;
    }
    if (!projectForm.tanggalMulai) {
      setFormError("Tanggal mulai wajib diisi.");
      return;
    }
    if (!projectForm.tanggalSelesai) {
      setFormError("Tanggal selesai wajib diisi.");
      return;
    }
    if (projectForm.tanggalSelesai < projectForm.tanggalMulai) {
      setFormError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }
    if (!projectForm.status) {
      setFormError("Status proyek wajib diisi.");
      return;
    }

    setShowAddProjectConfirm(true);
  };

  const handleConfirmAddProject = async () => {
    setSubmitting(true);

    try {
      const res = await fetch("/api/proyek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: projectForm.nama,
          deskripsi: projectForm.deskripsi,
          rabTotal: ribuanToNumber(projectForm.rabTotal) || 0,
          tanggalMulai: projectForm.tanggalMulai,
          tanggalSelesai: projectForm.tanggalSelesai,
          status: projectForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal membuat proyek");
        setShowAddProjectConfirm(false);
        return;
      }

      setNewProjectName(projectForm.nama);
      setProjectForm({ nama: "", deskripsi: "", rabTotal: "", tanggalMulai: "", tanggalSelesai: "", status: "PLANNING" });
      setShowAddProject(false);
      setShowAddProjectConfirm(false);
      setShowAddProjectSuccess(true);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
      setShowAddProjectConfirm(false);
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
      const [res, membersRes] = await Promise.all([
        fetch(`/api/proyek/${project.id}`),
        fetch("/api/manager/members?limit=500"),
      ]);
      const [data, membersData] = await Promise.all([res.json(), membersRes.json()]);
      if (membersData.members) {
        setMembers(membersData.members);
      }
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
          rabTotal: data.project.budget ? formatRibuan(String(Math.round(Number(data.project.budget.rabTotal)))) : "",
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

  // Refresh hanya data detail proyek (untuk update setelah aksi termin/alokasi)
  const refreshDetailedProject = async (proyekId: number) => {
    try {
      const res = await fetch(`/api/proyek/${proyekId}`);
      const data = await res.json();
      if (res.ok && data.project) {
        setDetailedProjectInfo(data.project);
      }
    } catch {
      // silent refresh failure
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
      rabTotal: project.budget ? formatRibuan(String(Math.round(Number(project.budget.rabTotal)))) : "",
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

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProjectDetail) return;
    setFormError("");
    setShowEditProjectConfirm(true);
  };

  const handleConfirmUpdateProject = async () => {
    if (!showProjectDetail) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/proyek/${showProjectDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editForm.nama,
          deskripsi: editForm.deskripsi,
          rabTotal: ribuanToNumber(editForm.rabTotal) || 0,
          tanggalMulai: editForm.tanggalMulai,
          tanggalSelesai: editForm.tanggalSelesai || null,
          status: editForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal memperbarui proyek");
        setShowEditProjectConfirm(false);
        return;
      }

      setEditedProjectName(editForm.nama);
      setEditMode(false);
      setShowProjectDetail(null);
      setIsDirectEdit(false);
      setShowEditProjectConfirm(false);
      setShowEditProjectSuccess(true);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
      setShowEditProjectConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateProject = () => {
    if (!showProjectDetail) return;
    setFormError("");
    setShowReactivateConfirm(true);
  };

  const handleConfirmReactivateProject = async () => {
    if (!showProjectDetail) return;
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
          status: "Active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal mengaktifkan kembali proyek");
        setShowReactivateConfirm(false);
        return;
      }
      setReactivatedProjectName(editForm.nama);
      fetchData();
      handleOpenDetailModal(data.project || showProjectDetail);
      setShowReactivateConfirm(false);
      setShowReactivateSuccess(true);
    } catch {
      setFormError("Terjadi kesalahan koneksi");
      setShowReactivateConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignMembers) return;
    setFormError("");
    setSuccess("");

    const isUnchanged = initialProjectMembers.length === selectedProjectMembers.length &&
      selectedProjectMembers.every(curr => {
        const prev = initialProjectMembers.find(p => p.userId === curr.userId);
        return prev && prev.role === curr.role;
      });

    if (isUnchanged && initialProjectMembers.length > 0) {
      setFormError("Tidak ada perubahan penugasan anggota pada proyek ini. Seluruh anggota yang dipilih sudah memiliki role tersebut.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`/api/manager/proyek/${showAssignMembers.id}/members`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
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

  const handleSaveTeamRows = () => {
    if (!showProjectDetail) return;
    setFormError("");

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

    setShowSaveTeamConfirm(true);
  };

  const handleConfirmSaveTeamRows = async () => {
    if (!showProjectDetail) return;
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
        setShowSaveTeamConfirm(false);
        return;
      }

      await handleOpenDetailModal(showProjectDetail);
      fetchData();
      setShowSaveTeamConfirm(false);
      setShowSaveTeamToast(true);
    } catch {
      setFormError("Terjadi kesalahan koneksi saat menyimpan tim");
      setShowSaveTeamConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInitBudget) return;
    setFormError("");

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

    setShowInitBudgetConfirm(true);
  };

  const handleConfirmInitBudget = async () => {
    if (!showInitBudget) return;
    const total = ribuanToNumber(rabTotal);

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
        setShowInitBudgetConfirm(false);
        return;
      }

      setInitBudgetProjectName(showInitBudget.nama);
      setShowInitBudget(null);
      setRabTotal("");
      setShowInitBudgetConfirm(false);
      setShowInitBudgetSuccess(true);
      fetchData();
    } catch {
      setFormError("Terjadi kesalahan koneksi");
      setShowInitBudgetConfirm(false);
    } finally {
      setSubmitting(false);
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

        <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 text-[13px] font-medium overflow-x-auto scrollbar-none">
          {statuses.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive
                  ? 'bg-white text-stone-900 font-semibold shadow-sm'
                  : 'text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50'
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
                      {formatStatusLabel(project.status)}
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
                        <span
                          title={formatRupiah(totalRAB)}
                          className="font-mono font-black text-stone-900 text-[15px] block mt-1 cursor-pointer hover:opacity-80 transition"
                        >
                          {formatSummaryRupiah(totalRAB)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-stone-400 block tracking-wider uppercase">SISA BUDGET</span>
                        <span
                          title={formatRupiah(sisa)}
                          className="font-mono font-black text-[#1b4332] text-[15px] block mt-1 cursor-pointer hover:opacity-80 transition"
                        >
                          {formatSummaryRupiah(sisa)}
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
                        onClick={(e) => { e.stopPropagation(); handleDirectEdit(project); }}
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

      {/* Pop-up Dialogs & Modals */}
      {!loading && projects.length > 0 && (
        <div className="mt-8 pt-6 flex justify-center w-full">

          {totalPages > 1 && (
            <div className="flex items-center gap-4 text-[16px] text-stone-500 font-medium">

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>

              <div className="flex items-center gap-4">
                {(() => {
                  const maxVisiblePages = 5;

                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = startPage + maxVisiblePages - 1;

                  if (endPage > totalPages) {
                    endPage = totalPages;
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  const visiblePages = Array.from(
                    { length: endPage - startPage + 1 },
                    (_, i) => startPage + i
                  );

                  return visiblePages.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`transition-colors ${currentPage === page
                        ? "text-[#2d6a4f] font-bold cursor-default scale-110"
                        : "hover:text-stone-900 cursor-pointer"
                        }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>

            </div>
          )}
        </div>
      )}
      <AddProjectModal
        show={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleAddProject}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        formError={formError}
        submitting={submitting}
      />

      <AssignMembersModal
        showAssignMembers={showAssignMembers}
        onClose={() => setShowAssignMembers(null)}
        members={members}
        selectedProjectMembers={selectedProjectMembers}
        setSelectedProjectMembers={setSelectedProjectMembers}
        initialProjectMembers={initialProjectMembers}
        formError={formError}
        submitting={submitting}
        onSave={handleSaveMembers}
      />

      <InitBudgetModal
        showInitBudget={showInitBudget}
        onClose={() => setShowInitBudget(null)}
        onSubmit={handleInitBudget}
        detailedProjectInfo={detailedProjectInfo}
        rabTotal={rabTotal}
        setRabTotal={setRabTotal}
        posAnggaranList={posAnggaranList}
        setPosAnggaranList={setPosAnggaranList}
        formError={formError}
        submitting={submitting}
      />

      <ProjectDetailSidebar
        showProjectDetail={showProjectDetail}
        editMode={editMode}
        isDirectEdit={isDirectEdit}
        onClose={() => setShowProjectDetail(null)}
        loadingDetail={loadingDetail}
        detailedProjectInfo={detailedProjectInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        activeCashFlow={activeCashFlow}
        inflowNominal={inflowNominal}
        outflowNominal={outflowNominal}
        netCashNominal={netCashNominal}
        sudahReimburseNominal={sudahReimburseNominal}
        belumReimburseNominal={belumReimburseNominal}
        sudahReimburseCount={sudahReimburseCount}
        belumReimburseCount={belumReimburseCount}
        detailTotalRAB={detailTotalRAB}
        detailTotalTerpakai={detailTotalTerpakai}
        detailPercentUsed={detailPercentUsed}
        detailBarWidth={detailBarWidth}
        setSelectedPendingIds={setSelectedPendingIds}
        setShowPendingPmModal={setShowPendingPmModal}
        fetchPendingPengajuan={fetchPendingPengajuan}
        setRabTotal={setRabTotal}
        setPosAnggaranList={setPosAnggaranList}
        setShowInitBudget={setShowInitBudget}
        setShowDetailBudgetModal={setShowDetailBudgetModal}
        teamRows={teamRows}
        setTeamRows={setTeamRows}
        members={members}
        handleAddTeamRow={handleAddTeamRow}
        handleRemoveTeamRow={handleRemoveTeamRow}
        handleSaveTeamRows={handleSaveTeamRows}
        submitting={submitting}
        formError={formError}
        success={success}
        setIsDirectEdit={setIsDirectEdit}
        setEditMode={setEditMode}
        handleReactivateProject={handleReactivateProject}
        currentStatus={currentStatus}
        onTerminChanged={() => { if (showProjectDetail) refreshDetailedProject(showProjectDetail.id); }}
      />

      <EditProjectModal
        editMode={editMode}
        onClose={handleCloseEdit}
        onSubmit={handleUpdateProject}
        editForm={editForm}
        setEditForm={setEditForm}
        formError={formError}
        submitting={submitting}
      />

      <DetailBudgetModal
        showDetailBudgetModal={showDetailBudgetModal}
        onClose={() => setShowDetailBudgetModal(false)}
        detailedProjectInfo={detailedProjectInfo}
        expandedMain={expandedMain}
        setExpandedMain={setExpandedMain}
        expandedSub={expandedSub}
        setExpandedSub={setExpandedSub}
        expandedKet={expandedKet}
        setExpandedKet={setExpandedKet}
      />

      <PendingPmModal
        showPendingPmModal={showPendingPmModal}
        onClose={() => setShowPendingPmModal(false)}
        detailedProjectInfo={detailedProjectInfo}
        pendingPengajuan={pendingPengajuan}
        selectedIds={selectedPendingIds}
        setSelectedIds={setSelectedPendingIds}
        rejectingPengajuan={rejectingPengajuan}
        setRejectingPengajuan={setRejectingPengajuan}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        handleBulkReview={handleBulkReview}
      />

      <Toast
        open={showBulkRejectToast}
        message={`Berhasil menolak ${bulkRejectedCount} item pengajuan.`}
        onClose={() => setShowBulkRejectToast(false)}
      />

      <SuccessDialog
        open={showBulkApproveSuccess}
        title="Pengajuan Disetujui"
        description={<>Berhasil menyetujui <span className="font-semibold text-[#14130F]">{bulkApprovedCount}</span> item pengajuan.</>}
        onClose={() => setShowBulkApproveSuccess(false)}
      />

      <ConfirmDialog
        open={showAddProjectConfirm}
        title="Buat Proyek Baru"
        description={
          <>
            Apakah Anda yakin ingin membuat proyek <span className="font-semibold text-stone-900">{projectForm.nama}</span> ({projectForm.tanggalMulai} s/d {projectForm.tanggalSelesai}) dengan status <span className="font-semibold text-stone-900">{projectForm.status}</span>?
          </>
        }
        confirmLabel="Buat Proyek"
        isLoading={submitting}
        onCancel={() => setShowAddProjectConfirm(false)}
        onConfirm={handleConfirmAddProject}
      />

      <SuccessDialog
        open={showAddProjectSuccess}
        title="Proyek Berhasil Dibuat"
        description={<>Proyek <span className="font-semibold text-[#14130F]">{newProjectName}</span> berhasil dibuat.</>}
        onClose={() => setShowAddProjectSuccess(false)}
      />

      <ConfirmDialog
        open={showEditProjectConfirm}
        title="Simpan Perubahan Proyek"
        description={
          <>
            Apakah Anda yakin ingin menyimpan perubahan proyek <span className="font-semibold text-stone-900">{editForm.nama}</span>? Status akan diubah menjadi <span className="font-semibold text-stone-900">{editForm.status}</span>, periode {editForm.tanggalMulai} s/d {editForm.tanggalSelesai || "-"}.
          </>
        }
        confirmLabel="Simpan"
        isLoading={submitting}
        onCancel={() => setShowEditProjectConfirm(false)}
        onConfirm={handleConfirmUpdateProject}
      />

      <SuccessDialog
        open={showEditProjectSuccess}
        title="Proyek Berhasil Diperbarui"
        description={<>Proyek <span className="font-semibold text-[#14130F]">{editedProjectName}</span> berhasil diperbarui.</>}
        onClose={() => setShowEditProjectSuccess(false)}
      />

      <ConfirmDialog
        open={showInitBudgetConfirm}
        title="Simpan Nilai Proyek"
        description={
          showInitBudget && (
            <>
              Apakah Anda yakin ingin menyimpan Nilai Proyek <span className="font-semibold text-stone-900">{showInitBudget.nama}</span> senilai <span className="font-semibold text-stone-900">Rp {rabTotal}</span> dengan <span className="font-semibold text-stone-900">{posAnggaranList.length} pos anggaran</span>? Data pos anggaran yang sudah ada sebelumnya akan diganti sesuai isian ini.
            </>
          )
        }
        confirmLabel="Simpan"
        isLoading={submitting}
        onCancel={() => setShowInitBudgetConfirm(false)}
        onConfirm={handleConfirmInitBudget}
      />

      <SuccessDialog
        open={showInitBudgetSuccess}
        title="Nilai Proyek Berhasil Disimpan"
        description={<>Nilai Proyek <span className="font-semibold text-[#14130F]">{initBudgetProjectName}</span> berhasil disimpan.</>}
        onClose={() => setShowInitBudgetSuccess(false)}
      />

      <ConfirmDialog
        open={showSaveTeamConfirm}
        title="Simpan Penugasan Tim"
        description="Apakah Anda yakin ingin menyimpan penugasan tim untuk proyek ini?"
        confirmLabel="Simpan"
        isLoading={submitting}
        onCancel={() => setShowSaveTeamConfirm(false)}
        onConfirm={handleConfirmSaveTeamRows}
      />

      <Toast
        open={showSaveTeamToast}
        message="Penugasan tim berhasil disimpan."
        onClose={() => setShowSaveTeamToast(false)}
      />

      <Toast
        open={!!errorMessage}
        variant="error"
        message={errorMessage || ""}
        onClose={() => setErrorMessage(null)}
      />

      <ConfirmDialog
        open={showReactivateConfirm}
        title="Aktifkan Kembali Proyek"
        description={
          showProjectDetail && (
            <>Apakah Anda yakin ingin mengaktifkan kembali proyek <span className="font-semibold text-stone-900">{showProjectDetail.nama}</span>? Status proyek akan diubah menjadi <span className="font-semibold text-stone-900">Active</span>.</>
          )
        }
        confirmLabel="Aktifkan Kembali"
        isLoading={submitting}
        onCancel={() => setShowReactivateConfirm(false)}
        onConfirm={handleConfirmReactivateProject}
      />

      <SuccessDialog
        open={showReactivateSuccess}
        title="Proyek Berhasil Diaktifkan Kembali"
        description={<>Proyek <span className="font-semibold text-[#14130F]">{reactivatedProjectName}</span> sekarang berstatus Active.</>}
        onClose={() => setShowReactivateSuccess(false)}
      />
    </main>
  );
}