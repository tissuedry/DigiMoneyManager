"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Check, Calendar, Briefcase, DollarSign, Settings } from "lucide-react";

import { Project, Member } from "./types";
import Pagination from "@/components/pagination";
import { formatRupiah, formatSummaryRupiah, getStatusStyles, formatStatusLabel } from "@/lib/proyek-utils";

import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";
import AlokasiPengeluaranForm from "./AlokasiPengeluaranForm";
import ProjectDetailSidebar from "./ProjectDetailSidebar";
import DetailPengeluaranModal from "./DetailPengeluaranModal";
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  const [showAddProject, setShowAddProject] = useState(false);
  const [showAlokasiPengeluaran, setShowAlokasiPengeluaran] = useState<Project | null>(null);
  const [showProjectDetail, setShowProjectDetail] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isDirectEdit, setIsDirectEdit] = useState(false);
  const [detailedProjectInfo, setDetailedProjectInfo] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
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

  const [activeTab, setActiveTab] = useState<"ringkasan" | "biaya" | "tim" | "pendapatan">("ringkasan");
  const [teamRows, setTeamRows] = useState<{ id: string; role: string; userId: string; isLocked: boolean }[]>([
    { id: "row-pm", role: "Project Manager", userId: "", isLocked: true }
  ]);

  const detailSource: any =
    detailedProjectInfo && showProjectDetail && detailedProjectInfo.id === showProjectDetail.id
      ? detailedProjectInfo
      : showProjectDetail;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proyekRes, membersRes] = await Promise.all([
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeStatus, limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeStatus, currentPage, limit]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
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
      setActiveTab("ringkasan");
    }
  };

  const refreshDetailedProject = async (proyekId: number) => {
    try {
      const res = await fetch(`/api/proyek/${proyekId}`);
      const data = await res.json();
      if (res.ok && data.project) {
        setDetailedProjectInfo(data.project);
      }
    } catch { }
  };

  const handleDirectEdit = (project: Project) => {
    setIsDirectEdit(true);
    setShowProjectDetail(null);
    setFormError("");
    setSuccess("");

    setShowProjectDetail(project);
    setEditMode(true);
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
    fetchData();
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

  const currentStatus = detailedProjectInfo?.status || showProjectDetail?.status;

  return (
    <main className="flex-1 px-6 lg:px-8 py-6 bg-[#f9f8f4] overflow-y-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">Kelola Proyek</h1>
          <p className="text-sm text-stone-500 mt-1.5">
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

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-stone-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-200 rounded-md" />
                  <div className="h-3 bg-stone-100 rounded-md w-2/3" />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-3 bg-stone-100 rounded w-4/5" />
                <div className="h-3 bg-stone-100 rounded w-3/5" />
              </div>
              <div className="flex justify-between items-center pt-1">
                <div className="h-5 w-16 bg-stone-200 rounded-full" />
                <div className="h-4 w-20 bg-stone-100 rounded-md" />
              </div>
            </div>
          ))}
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
            const totalRAB = hasBudget ? (Number(project.budget!.nilaiKontrak) || 0) : 0;
            const mainPemasukanList = (project.budget?.posAnggaran || (project.budget as any)?.mainAnggaran || []).filter(
              (m: any) =>
                m.tipe === "pemasukan" ||
                (m.namaMain || m.namaPos || m.deskripsi || "").toLowerCase().startsWith("penjualan") ||
                (m.namaMain || m.namaPos || m.deskripsi || "").toLowerCase().startsWith("pendapatan")
            );
            const totalMainPemasukanRealisasi = mainPemasukanList.reduce(
              (sum: number, m: any) => sum + (Number(m.nominalTerpakai || m.terpakai) || 0),
              0
            );
            const totalMainPemasukanAlokasi = mainPemasukanList.reduce(
              (sum: number, m: any) => sum + (Number(m.nominalAlokasi || m.alokasi || m.nominal) || 0),
              0
            );
            const pendapatan = hasBudget
              ? (totalMainPemasukanRealisasi > 0
                  ? totalMainPemasukanRealisasi
                  : Number(project.budget?.totalMainPemasukan) ||
                    (totalMainPemasukanAlokasi > 0 ? totalMainPemasukanAlokasi : (Number(project.budget?.targetPemasukan) || Number((project.budget as any)?.totalPemasukan) || 0)))
              : 0;

            return (
              <div
                key={project.id}
                className="bg-white border border-stone-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition gap-4"
              >
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold  text-stone-400 bg-stone-100/80 px-2.5 py-1.5 rounded-xl tracking-wide">
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
                          className=" font-black text-stone-900 text-[15px] block mt-1 cursor-pointer hover:opacity-80 transition"
                        >
                          {formatSummaryRupiah(totalRAB)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-stone-400 block tracking-wider uppercase">PENDAPATAN</span>
                        <span
                          title={formatRupiah(pendapatan)}
                          className=" font-black text-[#1b4332] text-[15px] block mt-1 cursor-pointer hover:opacity-80 transition"
                        >
                          {formatSummaryRupiah(pendapatan)}
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

      {!loading && projects.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      )}

      <AddProjectForm
        show={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSaved={fetchData}
      />

      <AlokasiPengeluaranForm
        showInitBudget={showAlokasiPengeluaran}
        detailedProjectInfo={detailedProjectInfo}
        onClose={() => setShowAlokasiPengeluaran(null)}
        onSaved={() => {
          fetchData();
          if (showProjectDetail && showAlokasiPengeluaran && showProjectDetail.id === showAlokasiPengeluaran.id) {
            refreshDetailedProject(showAlokasiPengeluaran.id);
          }
        }}
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
        onTerminChanged={() => { if (showProjectDetail) refreshDetailedProject(showProjectDetail.id); }}
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
      />

      <PendingPmModal
        open={showPendingPmModal}
        project={detailedProjectInfo}
        onClose={() => setShowPendingPmModal(false)}
        onChanged={() => {
          fetchData();
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