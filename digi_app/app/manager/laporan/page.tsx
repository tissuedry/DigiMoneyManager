"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  AlertCircle,
  FolderOpen,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import ProyekCard from "./ProyekCard";
import BudgetSkeleton from "./BudgetSkeleton";
import type { Proyek } from "@/app/keuangan/budget/types";
import type { Project, Member } from "@/app/manager/proyek/types";

import ProjectDetailSidebar from "@/app/manager/proyek/ProjectDetailSidebar";
import AlokasiPengeluaranForm from "@/app/manager/proyek/AlokasiPengeluaranForm";
import EditProjectForm from "@/app/manager/proyek/EditProjectForm";
import DetailPengeluaranModal from "@/app/manager/proyek/DetailPengeluaranModal";
import PendingPmModal from "@/app/manager/proyek/PendingPmModal";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import Toast from "@/components/toast";

const LaporanTahunanModal = dynamic(
  () => import("@/app/keuangan/budget/LaporanTahunanModal"),
  { ssr: false }
);

const LIMIT = 6;
const PROYEK_STATUSES = ["Semua", "Planning", "Active", "Done", "Canceled"];

export default function ManagerLaporanPage() {
  const [activeTab, setActiveTab] = useState<"has" | "none">("has");
  const [activeStatus, setActiveStatus] = useState("Semua");

  const [projects, setProjects] = useState<Proyek[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [isLaporanModalOpen, setIsLaporanModalOpen] = useState(false);

  const [hasBudgetTotal, setHasBudgetTotal] = useState(0);
  const [noBudgetTotal, setNoBudgetTotal] = useState(0);

  const [showProjectDetail, setShowProjectDetail] = useState<Project | null>(null);
  const [detailedProjectInfo, setDetailedProjectInfo] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isDirectEdit, setIsDirectEdit] = useState(false);
  const [showAlokasiPengeluaran, setShowAlokasiPengeluaran] = useState<Project | null>(null);
  const [showDetailPengeluaran, setShowDetailPengeluaran] = useState(false);
  const [showPendingPmModal, setShowPendingPmModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSaveTeamConfirm, setShowSaveTeamConfirm] = useState(false);
  const [showSaveTeamToast, setShowSaveTeamToast] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showReactivateSuccess, setShowReactivateSuccess] = useState(false);
  const [reactivatedProjectName, setReactivatedProjectName] = useState("");

  const [activeSidebarTab, setActiveSidebarTab] = useState<"ringkasan" | "biaya" | "tim" | "pendapatan">("ringkasan");
  const [teamRows, setTeamRows] = useState<{ id: string; role: string; userId: string; isLocked: boolean }[]>([
    { id: "row-pm", role: "Project Manager", userId: "", isLocked: true },
  ]);

  const detailSource: any =
    detailedProjectInfo && showProjectDetail && detailedProjectInfo.id === showProjectDetail.id
      ? detailedProjectInfo
      : showProjectDetail;

  const fetchCounts = useCallback(async () => {
    try {
      const statusParam = activeStatus !== "Semua" ? `&status=${activeStatus}` : "";
      const [hasRes, noneRes] = await Promise.all([
        fetch(`/api/proyek?limit=1&budgetStatus=has${statusParam}`),
        fetch(`/api/proyek?limit=1&budgetStatus=none${statusParam}`),
      ]);
      if (hasRes.ok) {
        const d = await hasRes.json();
        setHasBudgetTotal(d.pagination?.totalItems ?? 0);
      }
      if (noneRes.ok) {
        const d = await noneRes.json();
        setNoBudgetTotal(d.pagination?.totalItems ?? 0);
      }
    } catch {}
  }, [activeStatus]);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusParam = activeStatus !== "Semua" ? `&status=${activeStatus}` : "";
      const res = await fetch(
        `/api/proyek?limit=${LIMIT}&budgetStatus=${activeTab}&page=1${statusParam}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat data proyek.");

      setProjects(data.projects ?? []);
      setPage(1);
      const totalPages = data.pagination?.totalPages ?? 1;
      setHasMore(1 < totalPages);
    } catch {
      setError("Gagal memuat data proyek. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeStatus]);

  const loadMoreProjects = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const statusParam = activeStatus !== "Semua" ? `&status=${activeStatus}` : "";
      const res = await fetch(
        `/api/proyek?limit=${LIMIT}&budgetStatus=${activeTab}&page=${nextPage}${statusParam}`
      );
      const data = await res.json();
      if (res.ok) {
        const newItems: Proyek[] = data.projects ?? [];
        setProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...newItems.filter((p) => !existingIds.has(p.id))];
        });
        setPage(nextPage);
        const totalPages = data.pagination?.totalPages ?? 1;
        setHasMore(nextPage < totalPages);
      }
    } catch (err) {
      console.error("Error loading more projects:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, activeTab, activeStatus]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProjects();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMoreProjects]
  );

  useEffect(() => {
    fetchCounts();
    fetchInitial();
  }, [fetchCounts, fetchInitial]);

  const switchTab = (tab: "has" | "none") => {
    if (activeTab === tab) return;
    setActiveTab(tab);
  };

  const handleRefreshAll = () => {
    fetchCounts();
    fetchInitial();
  };

  const handleOpenDetailModal = async (project: Proyek | Project) => {
    setIsDirectEdit(false);
    setShowProjectDetail(project as Project);
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
      if (data.project?.users && data.project.users.length > 0) {
        const pmUser = data.project.users.find((u: any) => u.roleInProyek === "Project Manager");
        const otherUsers = data.project.users.filter((u: any) => u.roleInProyek !== "Project Manager");

        const mappedRows = [
          { id: "row-pm", role: "Project Manager", userId: pmUser ? String(pmUser.id) : "", isLocked: true },
          ...otherUsers.map((u: any, i: number) => ({
            id: `row-loaded-${i}-${u.id}`,
            role: u.divisiInProyek || "",
            userId: String(u.id),
            isLocked: false,
          })),
        ];
        setTeamRows(mappedRows);
      } else {
        setTeamRows([{ id: "row-pm", role: "Project Manager", userId: "", isLocked: true }]);
      }
      if (res.ok && data.project) {
        setDetailedProjectInfo(data.project);
      } else {
        setFormError(data.message || "Gagal mengambil detail proyek");
      }
    } catch {
      setFormError("Gagal memuat data detail dari server");
    } finally {
      setLoadingDetail(false);
      setActiveSidebarTab("ringkasan");
    }
  };

  const refreshDetailedProject = async (proyekId: number) => {
    try {
      const res = await fetch(`/api/proyek/${proyekId}`);
      const data = await res.json();
      if (res.ok && data.project) {
        setDetailedProjectInfo(data.project);
      }
    } catch {}
  };

  const handleCloseEdit = () => {
    setEditMode(false);
    if (isDirectEdit) {
      setShowProjectDetail(null);
      setIsDirectEdit(false);
    }
  };

  const handleProjectSaved = () => {
    setEditMode(false);
    setIsDirectEdit(false);
    setShowProjectDetail(null);
    handleRefreshAll();
  };

  const handleReactivateProject = () => {
    if (!showProjectDetail) return;
    setFormError("");
    setShowReactivateConfirm(true);
  };

  const handleConfirmReactivateProject = async () => {
    if (!showProjectDetail) return;
    const src: any =
      detailedProjectInfo && detailedProjectInfo.id === showProjectDetail.id
        ? detailedProjectInfo
        : showProjectDetail;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${showProjectDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: src.nama,
          deskripsi: src.deskripsi || "",
          tanggalMulai: src.tanggalMulai ? String(src.tanggalMulai).split("T")[0] : "",
          tanggalSelesai: src.tanggalSelesai ? String(src.tanggalSelesai).split("T")[0] : null,
          status: "Active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal mengaktifkan kembali proyek");
        setShowReactivateConfirm(false);
        return;
      }
      setReactivatedProjectName(src.nama);
      handleRefreshAll();
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
      return;
    }

    const selectedUserIds = teamRows
      .filter((r) => r.userId !== "")
      .map((r) => r.userId);
    const hasDuplicates = selectedUserIds.some((val, i) => selectedUserIds.indexOf(val) !== i);
    if (hasDuplicates) {
      setFormError("Setiap anggota tim hanya boleh dimasukkan satu kali");
      return;
    }

    const otherRows = teamRows.filter((r) => r.id !== "row-pm");
    for (let i = 0; i < otherRows.length; i++) {
      const r = otherRows[i];
      const rowNum = i + 1;
      if (!r.role.trim() && !r.userId) {
        setFormError(`Baris anggota ke-${rowNum} masih kosong. Harap isi Role dan Nama, atau hapus baris tersebut.`);
        return;
      }
      if (!r.role.trim()) {
        setFormError(`Role untuk anggota pada baris ke-${rowNum} belum diisi.`);
        return;
      }
      if (!r.userId) {
        setFormError(`Nama anggota pada baris ke-${rowNum} belum dipilih.`);
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
      handleRefreshAll();
      setShowSaveTeamConfirm(false);
      setShowSaveTeamToast(true);
    } catch {
      setFormError("Terjadi kesalahan koneksi saat menyimpan tim");
      setShowSaveTeamConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const totalProjects = hasBudgetTotal + noBudgetTotal;
  const currentStatus = detailedProjectInfo?.status || showProjectDetail?.status;

  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Laporan Anggaran Proyek</h1>
          <p className="text-sm text-stone-500 mt-1.5">
            Pantau realisasi anggaran per proyek, lalu unduh laporannya dalam format Excel.
          </p>
        </div>

        <button
          onClick={() => setIsLaporanModalOpen(true)}
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-stone-200 hover:border-[#2d6a4f] hover:text-[#2d6a4f] text-stone-700 text-[13px] font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          Buat Laporan Tahunan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button
            onClick={handleRefreshAll}
            className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
          <button
            onClick={() => switchTab("has")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === "has"
                ? "bg-white text-stone-900 font-semibold shadow-sm"
                : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
            }`}
          >
            <Check size={14} className={activeTab === "has" ? "text-emerald-600" : "text-stone-400"} />
            Budget Aktif ({hasBudgetTotal})
          </button>
          <button
            onClick={() => switchTab("none")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === "none"
                ? "bg-white text-stone-900 font-semibold shadow-sm"
                : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
            }`}
          >
            <AlertCircle size={14} className={activeTab === "none" ? "text-amber-600" : "text-stone-400"} />
            Perlu Diinisialisasi ({noBudgetTotal})
          </button>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
          {PROYEK_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-4 py-1.5 text-[13px] rounded-full transition-all duration-200 cursor-pointer ${
                activeStatus === status
                  ? "bg-white text-stone-900 font-semibold shadow-sm"
                  : "text-stone-500 font-medium hover:text-stone-700 hover:bg-stone-200/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading && <BudgetSkeleton />}

      {!loading && projects.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 w-full">
            {projects.map((p) => (
              <ProyekCard
                key={p.id}
                proyek={p}
                onClick={handleOpenDetailModal}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-4 w-full" />

          {loadingMore && (
            <div className="flex items-center justify-center py-6 gap-2 text-stone-500">
              <Loader2 size={18} className="animate-spin text-[#008f5d]" />
              <span className="text-xs font-semibold">Memuat proyek lainnya...</span>
            </div>
          )}

          {!hasMore && (
            <div className="text-center py-6 text-xs text-stone-400 font-medium">
              Semua proyek telah ditampilkan ({projects.length} proyek).
            </div>
          )}
        </div>
      )}
      
      {!loading && totalProjects === 0 && activeStatus === "Semua" && (
        <div className="text-center py-20 text-stone-400">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Belum ada proyek di sistem.</p>
        </div>
      )}

      {!loading && projects.length === 0 && !(totalProjects === 0 && activeStatus === "Semua") && (
        <div className="text-center py-20 text-stone-400">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">
            Tidak ada proyek dengan status &quot;{activeStatus}&quot; pada kategori ini.
          </p>
        </div>
      )}

      {isLaporanModalOpen && (
        <LaporanTahunanModal onClose={() => setIsLaporanModalOpen(false)} />
      )}

      <ProjectDetailSidebar
        showProjectDetail={showProjectDetail}
        editMode={editMode}
        isDirectEdit={isDirectEdit}
        onClose={() => setShowProjectDetail(null)}
        loadingDetail={loadingDetail}
        detailedProjectInfo={detailedProjectInfo}
        activeTab={activeSidebarTab}
        setActiveTab={setActiveSidebarTab}
        setShowPendingPmModal={setShowPendingPmModal}
        setShowAlokasiPengeluaran={setShowAlokasiPengeluaran}
        setShowDetailPengeluaran={setShowDetailPengeluaran}
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
        onTerminChanged={() => {
          if (showProjectDetail) refreshDetailedProject(showProjectDetail.id);
        }}
      />

      <AlokasiPengeluaranForm
        showInitBudget={showAlokasiPengeluaran}
        detailedProjectInfo={detailedProjectInfo}
        onClose={() => setShowAlokasiPengeluaran(null)}
        onSaved={() => {
          handleRefreshAll();
          if (showProjectDetail && showAlokasiPengeluaran && showProjectDetail.id === showAlokasiPengeluaran.id) {
            refreshDetailedProject(showAlokasiPengeluaran.id);
          }
        }}
      />

      <EditProjectForm
        editMode={editMode}
        project={detailSource}
        onClose={handleCloseEdit}
        onSaved={handleProjectSaved}
      />

      <DetailPengeluaranModal
        showDetailBudgetModal={showDetailPengeluaran}
        onClose={() => setShowDetailPengeluaran(false)}
        detailedProjectInfo={detailedProjectInfo}
        onRefresh={() => {
          handleRefreshAll();
          if (showProjectDetail) refreshDetailedProject(showProjectDetail.id);
        }}
      />

      <PendingPmModal
        open={showPendingPmModal}
        project={detailedProjectInfo}
        onClose={() => setShowPendingPmModal(false)}
        onChanged={() => {
          handleRefreshAll();
          if (showProjectDetail) refreshDetailedProject(showProjectDetail.id);
        }}
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

      <ConfirmDialog
        open={showReactivateConfirm}
        title="Aktifkan Kembali Proyek"
        description={
          showProjectDetail && (
            <>
              Apakah Anda yakin ingin mengaktifkan kembali proyek{" "}
              <span className="font-semibold text-stone-900">{showProjectDetail.nama}</span>? Status proyek akan diubah
              menjadi <span className="font-semibold text-stone-900">Active</span>.
            </>
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
        description={
          <>
            Proyek <span className="font-semibold text-[#14130F]">{reactivatedProjectName}</span> sekarang berstatus
            Active.
          </>
        }
        onClose={() => setShowReactivateSuccess(false)}
      />
    </main>
  );
}
