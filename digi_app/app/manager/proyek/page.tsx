"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, Loader2, Check, X, Search, Calendar, Users, Briefcase, DollarSign, Plus, Trash2, TrendingUp } from "lucide-react";

type ProjectStatus = "PLANNING" | "AKTIF" | "CANCELED" | "DONE";
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

type Member = {
  id: number;
  nama: string;
  email: string;
  role: string;
  divisi: string | null;
};

export default function KelolaProyekPage() {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proyekRes, membersRes] = await Promise.all([
        fetch("/api/proyek"),
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
    fetchData();
  }, []);

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
  
            // PERBAIKAN: Pastikan ID diubah menjadi string / number sesuai dengan tipe data di <option value={member.id}>
            const mappedRows = [
              { 
                id: "row-pm", 
                role: "Project Manager", 
                userId: pmUser ? String(pmUser.id) : "", // Di-string-kan agar cocok dengan value dropdown select
                isLocked: true 
              },
              ...otherUsers.map((u: any, i: number) => ({
                id: `row-loaded-${i}-${u.id}`,
                role: u.roleInProyek || "",
                userId: String(u.id), // Di-string-kan agar dropdown otomatis memilih namanya
                isLocked: false
              }))
            ];
            setTeamRows(mappedRows);
          } else {
            // Reset default jika proyek beneran belum punya anggota sama sekali di database
            setTeamRows([
              { id: "row-pm", role: "Project Manager", userId: "", isLocked: true },
              { id: `row-empty-init`, role: "", userId: "", isLocked: false }
            ]);
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

  const handleDeleteProject = async () => {
    if (!showProjectDetail) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek "${showProjectDetail.nama}"?\n\nPERINGATAN: Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh anggaran, pos anggaran, serta riwayat reimbursement terkait proyek ini.`)) {
      return;
    }

    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/proyek/${showProjectDetail.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Gagal menghapus proyek");
        return;
      }

      alert("Proyek berhasil dihapus!");
      setShowProjectDetail(null);
      fetchData();
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

  const handleInitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInitBudget) return;
    setFormError("");
    setSuccess("");

    const total = parseFloat(rabTotal);
    if (isNaN(total) || total <= 0) {
      setFormError("Total RAB harus berupa angka positif");
      return;
    }

    // Validate pos anggaran sum matches rabTotal
    const sum = posAnggaranList.reduce((acc, pos) => acc + (parseFloat(pos.nominalAlokasi) || 0), 0);
    if (Math.abs(sum - total) > 0.01) {
      setFormError(`Jumlah alokasi item (Rp ${sum.toLocaleString()}) harus sama dengan total RAB (Rp ${total.toLocaleString()})`);
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

      setSuccess(`Budget RAB untuk "${showInitBudget.nama}" berhasil diinisialisasi!`);
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

  const openAssignModal = (project: Project) => {
    // Fetch currently assigned members for this project
    setLoading(true);
    fetch(`/api/manager/proyek/${project.id}/members`)
      .then((res) => res.json())
      .then((data) => {
        const assignedMembers = data.members?.map((m: any) => ({
          userId: m.id,
          role: m.roleInProyek || (m.role === 'Project Manager' ? 'Project Manager' : 'Anggota Lapangan'),
        })) || [];
        setSelectedProjectMembers(assignedMembers);
        setShowAssignMembers(project);
      })
      .catch((err) => console.error("Error loading assigned members:", err))
      .finally(() => setLoading(false));
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
  const [activeTab, setActiveTab] = useState<"ringkasan" | "anggaran" | "tim" | "4m" | "12m" | "ytd">("ringkasan");
  const [teamRows, setTeamRows] = useState<{ id: string; role: string; userId: string; isLocked: boolean }[]>([
    { id: "row-pm", role: "Project Manager", userId: "", isLocked: true }, // Baris PM default & di-lock
    { id: "row-1", role: "", userId: "", isLocked: false }
  ]);
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

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <Check size={16} />
          {success}
        </div>
      )}

      {/* List of Projects Grid */}
      {loading && projects.length === 0 ? (
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
                onClick={() => handleOpenDetailModal(project)}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-stone-300 transition gap-4 cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                      PRJ-{String(project.id).padStart(3, "0")}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${project.status === "PLANNING" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      project.status === "AKTIF" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        project.status === "CANCELED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                          project.status === "DONE" ? "bg-purple-50 text-purple-700 border-purple-100" :
                            "bg-stone-50 text-stone-500 border-stone-100"
                      }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-stone-900 leading-snug truncate">
                    {project.nama}
                  </h3>

                  <p className="text-xs text-stone-400 leading-normal line-clamp-2">
                    {project.deskripsi || "Tidak ada deskripsi."}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
                    <Calendar size={13} className="text-stone-400" />
                    <span>
                      {new Date(project.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {project.tanggalSelesai && ` - ${new Date(project.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-3.5 space-y-3">
                  {/* Financial summary if budget is set */}
                  {hasBudget ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-stone-400 block font-medium">TOTAL BUDGET RAB</span>
                        <span className="font-mono font-bold text-stone-800 text-[13px]">
                          {formatRupiah(totalRAB)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block font-medium">SISA BUDGET</span>
                        <span className="font-mono font-bold text-emerald-700 text-[13px]">
                          {formatRupiah(sisa)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 text-amber-700 p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                      <DollarSign size={13} />
                      <span>RAB budget belum diinisialisasi</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(project); }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-850 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Briefcase size={13} />
                      Detail Proyek
                    </button>
                    {!hasBudget && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowInitBudget(project); setRabTotal(""); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        <DollarSign size={13} />
                        Set RAB
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAMBAH PROYEK MODAL */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Buat Proyek Baru</h3>
              <button
                onClick={() => setShowAddProject(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              {/* Nama Proyek */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
                <input
                  type="text"
                  required
                  value={projectForm.nama}
                  onChange={(e) => setProjectForm({ ...projectForm, nama: e.target.value })}
                  placeholder="e.g. Renovasi Kantor Cabang Bandung"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                />
              </div>

              {/* Deskripsi Proyek */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
                <textarea
                  rows={3}
                  value={projectForm.deskripsi}
                  onChange={(e) => setProjectForm({ ...projectForm, deskripsi: e.target.value })}
                  placeholder="Detail mengenai target dan ruang lingkup proyek..."
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white resize-none"
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
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai (Opsional)</label>
                  <input
                    type="date"
                    value={projectForm.tanggalSelesai}
                    onChange={(e) => setProjectForm({ ...projectForm, tanggalSelesai: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                  />
                </div>
              </div>

              {/* Status Proyek Selector */}
              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: "AKTIF", label: "Active" },
                    { value: "PLANNING", label: "Planning" },
                    { value: "DONE", label: "Done", disabled: true },
                    { value: "CANCELED", label: "Cancelled", disabled: true }
                  ].map((statusItem) => {
                    const isSelected = projectForm.status === statusItem.value;
                    return (
                      <button
                        key={statusItem.value}
                        type="button"
                        onClick={() => setProjectForm({ ...projectForm, status: statusItem.value })}
                        className={`px-5 py-2 text-[13px] font-semibold rounded-xl border transition-all duration-200
                    ${statusItem.disabled
                            ? "opacity-40 cursor-not-allowed border-stone-200 text-stone-400 bg-stone-50" // 3. Styling saat tombol mati
                            : isSelected
                              ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332] ring-2 ring-[#2d6a4f]/10" // Styling saat terpilih
                              : "border-stone-200 text-stone-600 bg-white hover:bg-stone-50" // Styling default saat aktif
                          }
                  `}
                      >
                        {statusItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Handle */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}

              {/* Aksi Form */}
              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN MEMBERS MODAL --- */}
      {showAssignMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Atur Anggota Proyek</h3>
              <button
                onClick={() => setShowAssignMembers(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
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
                              className="border border-stone-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-650 bg-white cursor-pointer focus:outline-none"
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
                  {members.length === 0 && (
                    <p className="p-4 text-center text-xs text-stone-400 italic">Belum ada anggota tim terdaftar</p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAssignMembers(null)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveMembers}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Penugasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MEMBERS MODAL */}
      {showAssignMembers && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Atur Anggota Proyek</h3>
              <button onClick={() => setShowAssignMembers(null)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
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
                              className="border border-stone-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-650 bg-white cursor-pointer focus:outline-none"
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
                  {members.length === 0 && (
                    <p className="p-4 text-center text-xs text-stone-400 italic">Belum ada anggota tim terdaftar</p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
                  <X size={14} />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAssignMembers(null)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveMembers}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Penugasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INITIALIZE BUDGET MODAL */}
      {showInitBudget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-[15px] text-stone-900">Inisialisasi RAB Budget</h3>
              <button onClick={() => setShowInitBudget(null)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleInitBudget} className="p-6 space-y-4">
              <div className="bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-amber-800">Proyek</h4>
                <p className="text-[13px] font-bold text-stone-800">{showInitBudget.nama}</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Total Anggaran RAB (Rupiah)</label>
                <input
                  type="number"
                  required
                  value={rabTotal}
                  onChange={(e) => setRabTotal(e.target.value)}
                  placeholder="e.g. 50000000"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 font-bold focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                />
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
                        className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-[12px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 bg-white"
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
                        className="w-28 border border-stone-200 rounded-xl px-3 py-2 text-[12px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 bg-white font-mono text-right"
                      />
                      {posAnggaranList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPosAnggaranList(posAnggaranList.filter((_, i) => i !== idx))}
                          className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-50 transition cursor-pointer"
                        >
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
                <button
                  type="button"
                  onClick={() => setShowInitBudget(null)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan RAB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & EDIT PROYEK MODAL */}
      {showProjectDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 opacity-100">
          <div className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-stone-200 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out ${showProjectDetail ? "translate-x-0" : "translate-x-full"
            }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                  PRJ-{String(showProjectDetail.id).padStart(3, "0")}
                </span>
                <h3 className="font-bold text-[15px] text-stone-900">
                  {editMode ? "Edit Proyek" : "Detail Proyek"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowProjectDetail(null);
                  setEditMode(false);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm">Memuat detail proyek...</span>
              </div>
            ) : editMode ? (
              <form onSubmit={handleUpdateProject} className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Nama Proyek *</label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Deskripsi Proyek</label>
                  <textarea
                    rows={3}
                    value={editForm.deskripsi}
                    onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Mulai *</label>
                    <input
                      type="date"
                      required
                      value={editForm.tanggalMulai}
                      onChange={(e) => setEditForm({ ...editForm, tanggalMulai: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Tanggal Selesai (Opsional)</label>
                    <input
                      type="date"
                      value={editForm.tanggalSelesai}
                      onChange={(e) => setEditForm({ ...editForm, tanggalSelesai: e.target.value })}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-[13px] text-stone-850 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-stone-600 mb-1.5">Status Proyek *</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {[
                      { value: "AKTIF", label: "Active" },
                      { value: "PLANNING", label: "Planning" },
                      { value: "DONE", label: "Done" },
                      { value: "CANCELED", label: "Cancelled" }
                    ].map((statusItem) => {
                      const isSelected = editForm.status === statusItem.value;

                      return (
                        <button
                          key={statusItem.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, status: statusItem.value })}
                          className={`px-5 py-2 text-[13px] font-semibold rounded-xl border transition-all duration-200
            ${isSelected
                              ? "border-[#2d6a4f] bg-[#e8f5e9] text-[#1b4332] ring-2 ring-[#2d6a4f]/10"
                              : "border-stone-200 text-stone-600 bg-white hover:bg-stone-50"
                            }
          `}
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

                <div className="flex gap-3 pt-4 border-t border-stone-100 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Sub-Header Judul Proyek */}
                <div className="p-6 pb-3 flex-shrink-0 text-left">
                  <span className="text-[11px] font-mono text-stone-400">PRJ-{String(showProjectDetail.id).padStart(3, "0")}</span>
                  <h2 className="font-bold text-xl text-stone-900 leading-tight mt-0.5">
                    {detailedProjectInfo?.nama || showProjectDetail.nama}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">PT. Sinar Logistik Nusantara</p>

                  {/* Tab Navigasi Berfungsi Aktif */}
                  <div className="flex gap-4 border-b border-stone-100 mt-5 text-[13px] font-medium text-stone-400">
                    <button
                      type="button"
                      onClick={() => scrollToSection("ringkasan-sec")}
                      className={`pb-2 cursor-pointer transition ${activeTab === "ringkasan" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}
                    >
                      Ringkasan
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("anggaran-sec")}
                      className={`pb-2 cursor-pointer transition ${activeTab === "anggaran" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}
                    >
                      Anggaran
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("tim-sec")}
                      className={`pb-2 cursor-pointer transition ${activeTab === "tim" ? "border-b-2 border-stone-900 text-stone-900 font-semibold" : "hover:text-stone-700"}`}
                    >
                      Tim
                    </button>
                  </div>
                </div>

                {/* Konten yang Bisa Di-scroll Secara Independen */}
                <div
                  id="scroll-bridge-container"
                  className="flex-1 flex flex-col overflow-y-auto scroll-smooth min-h-0"
                  style={{ scrollbarWidth: 'none' }}
                >
                  
                  <div id="ringkasan-sec" className="px-6 py-4 space-y-4">
                    {/* Row Status & PM Utama */}
                    <div className="grid grid-cols-2 gap-4 pt-2 text-left">
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">Status</span>
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border mt-1 ${(detailedProjectInfo?.status || showProjectDetail.status) === "PLANNING" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          (detailedProjectInfo?.status || showProjectDetail.status) === "AKTIF" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            (detailedProjectInfo?.status || showProjectDetail.status) === "CANCELED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                              "bg-purple-50 text-purple-700 border-purple-100"
                          }`}>
                          {detailedProjectInfo?.status || showProjectDetail.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">PM Utama</span>
                        <span className="text-[13px] font-bold text-stone-800 block mt-1 truncate">
                          {detailedProjectInfo?.users?.find((u: any) => u.roleInProyek === 'Project Manager')?.nama || "Muhammad Zaini"}
                        </span>
                      </div>
                    </div>

                    {/* Row Rentang Tanggal */}
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">Tanggal Mulai</span>
                        <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                          {detailedProjectInfo?.tanggalMulai ? new Date(detailedProjectInfo.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-400 block font-medium">Tanggal Selesai</span>
                        <span className="text-[13px] font-bold text-stone-800 block mt-0.5">
                          {detailedProjectInfo?.tanggalSelesai ? new Date(detailedProjectInfo.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "30 September 2026"}
                        </span>
                      </div>
                    </div>

                    {/* Card Realisasi Anggaran */}
                    {detailedProjectInfo?.budget ? (
                      <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 text-left">
                        <div className="flex justify-between text-xs font-bold text-stone-800">
                          <span>Realisasi Anggaran</span>
                          <span>35%</span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: '35%' }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-stone-400 font-medium">
                          <span>Terpakai <b className="text-stone-700 font-mono">{formatRupiah(detailedProjectInfo?.budget?.totalPengeluaran)}</b></span>
                          <span>Sisa <b className="text-emerald-700 font-mono">{formatRupiah(detailedProjectInfo?.budget?.sisaBudget)}</b></span>
                          <span>RAB <b className="text-stone-700 font-mono">{formatRupiah(detailedProjectInfo?.budget?.rabTotal)}</b></span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-xs flex items-center justify-between text-left">
                        <span>Anggaran RAB belum diinisialisasi.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProjectDetail(null);
                            setShowInitBudget(showProjectDetail);
                          }}
                          className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]"
                        >
                          Set RAB
                        </button>
                      </div>
                    )}

                    {/* Statistik Tiga Kolom */}
                    <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-stone-100">
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 block">Reimbursement</span>
                        <span className="text-[13px] font-bold text-blue-600 block mt-0.5 font-mono">Rp 264.0 jt</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 block">Margin</span>
                        <span className="text-[13px] font-bold text-emerald-700 block mt-0.5 font-mono">31%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-stone-400 block">Reimbursement/RAB</span>
                        <span className="text-[13px] font-bold text-stone-800 block mt-0.5 font-mono">4.3%</span>
                      </div>
                    </div>

                    {/* Reimbursement Pending vs Disetujui Mini Card */}
                    <div className="space-y-2 text-left">
                      <span className="text-[11px] font-bold text-stone-700 block">Reimbursement</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
                          <span className="text-[10px] font-bold text-amber-800 block">Pending (2)</span>
                          <span className="text-[14px] font-bold text-stone-800 mt-0.5 block font-mono">Rp 735 rb</span>
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                          <span className="text-[10px] font-bold text-emerald-800 block">Disetujui (2)</span>
                          <span className="text-[14px] font-bold text-stone-800 mt-0.5 block font-mono">Rp 14.0 jt</span>
                        </div>
                      </div>
                    </div>

                    {/* Arus Kas Real-Time & Mini Bar Chart */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-stone-700">Arus Kas Real-Time</span>
                        <div className="flex bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold text-stone-500">
                          <span className="px-2 py-0.5 rounded">4M</span>
                          <span className="px-2 py-0.5 bg-white text-stone-900 shadow-sm rounded">12M</span>
                          <span className="px-2 py-0.5 rounded">YTD</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-2 h-28 bg-stone-50 p-4 rounded-xl border border-stone-100 pt-6">
                        {detailedProjectInfo?.cashFlow ? (
                          (() => {
                            const maxVal = Math.max(...(detailedProjectInfo.cashFlow.map((c: any) => Math.max(c.inflow, c.outflow)) || [1]));
                            return detailedProjectInfo.cashFlow.map((c: any, idx: number) => {
                              const inH = maxVal > 0 ? (c.inflow / maxVal) * 100 : 0;
                              const outH = maxVal > 0 ? (c.outflow / maxVal) * 100 : 0;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                  <div className="flex items-end gap-0.5 w-full h-14">
                                    <div className="flex-1 bg-emerald-600 rounded-t-sm" style={{ height: `${inH}%` }} />
                                    <div className="flex-1 bg-amber-500 rounded-t-sm" style={{ height: `${outH}%` }} />
                                  </div>
                                  <span className="text-[9px] font-bold text-stone-400">{c.bulan}</span>
                                </div>
                              );
                            });
                          })()
                        ) : (
                          ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul"].map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                              <div className="flex items-end gap-0.5 w-full h-14">
                                <div className="flex-1 bg-emerald-600 rounded-t-sm" style={{ height: `${60 + (i * 5) % 40}%` }} />
                                <div className="flex-1 bg-amber-500 rounded-t-sm" style={{ height: `${50 + (i * 3) % 40}%` }} />
                              </div>
                              <span className="text-[9px] font-bold text-stone-400">{m}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex justify-between text-[10px] pt-1 text-stone-500 font-medium">
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Inflow Rp 3.6 M</span>
                          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Outflow Rp 3.2 M</span>
                        </div>
                        <span className="text-emerald-700 font-bold">Net cash +Rp 340 jt</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-stone-100 my-2" />


                  <div id="anggaran-sec" className="px-6 py-4 space-y-4">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Rincian Pos Anggaran</h3>

                    {/* Loop Daftar Pos Anggaran jika sudah di-set */}
                    {detailedProjectInfo?.budget?.posAnggaran ? (
                      <div className="space-y-4">
                        {detailedProjectInfo.budget.posAnggaran.map((pos: any, index: number) => {
                          const nominalAlokasi = parseFloat(pos.nominalAlokasi) || 0;
                          const simPercentages = [95, 96, 86, 73, 56, 30];
                          const percentUsed = simPercentages[index % simPercentages.length];
                          const terpakaiVal = (nominalAlokasi * percentUsed) / 100;
                          const sisaVal = nominalAlokasi - terpakaiVal;

                          let barColor = "bg-emerald-600";
                          if (percentUsed >= 90) barColor = "bg-rose-500";
                          else if (percentUsed >= 80) barColor = "bg-amber-500";

                          return (
                            <div key={pos.id || index} className="space-y-2 border-b border-stone-50 pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-[14px] font-bold text-stone-800 leading-tight">{pos.namaPos || pos.deskripsi}</h4>
                                  <span className="text-[10px] font-mono text-stone-400 font-bold">POS-{201 + index}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[13px] font-bold text-stone-800 font-mono">{formatRupiah(terpakaiVal)}</span>
                                  <span className="text-[10px] text-stone-400 block font-medium">dari {formatRupiah(nominalAlokasi)}</span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentUsed}%` }} />
                              </div>
                              <div className="flex justify-between text-[11px] text-stone-400 font-medium">
                                <span>{percentUsed}% terpakai</span>
                                <span>Sisa <b className="text-stone-700 font-mono">{formatRupiah(sisaVal)}</b></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Tampilan teks pengingat jika RAB kosong */
                      <p className="text-left text-xs font-medium text-stone-400 py-2">
                        RAB belum diinisialisasi untuk proyek ini. Silakan atur anggaran terlebih dahulu.
                      </p>
                    )}

                    {/* BOX TOMBOL DINAMIS (Menggantikan fungsi berdasarkan status database) */}
                    <div className="flex justify-start pt-2">
                      {detailedProjectInfo?.budget?.posAnggaran ? (
                        /* JIKA SUDAH ADA DATA -> BERUBAH JADI EDIT */
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowInitBudget(showProjectDetail); setRabTotal(""); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[12px] font-bold rounded-xl transition cursor-pointer shadow-sm bg-white"
                        >
                          ⚙ Edit RAB Proyek
                        </button>
                      ) : (
                        /* JIKA BELUM ADA DATA -> WUJUD ASLI (SET INISIALISASI) */
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowInitBudget(showProjectDetail); setRabTotal(""); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b4332] text-[12px] font-bold rounded-xl transition cursor-pointer shadow-sm"
                        >
                          ➕ Set Inisialisasi RAB
                        </button>
                      )}
                    </div>

                  </div>
                  
                  <hr className="border-stone-100 my-2" />
                  
                  <div id="tim-sec" className="min-h-full w-full px-6 pb-20 pt-4 text-left flex-shrink-0 space-y-3">
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Anggota Tim Proyek</h3>

                    {/* Header Label Kolom */}
                    <div className="grid grid-cols-12 gap-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1 mb-1">
                      <div className="col-span-5">Role</div>
                      <div className="col-span-6">Anggota</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Looping Baris Input Form Tim Dinamis */}
                    <div className="space-y-3">
                      {teamRows.map((row, idx) => (
                        <div key={row.id} className="grid grid-cols-12 gap-3 items-center">

                          {/* 1. Kolom Input/Select Role */}
                          <div className="col-span-5">
                            <input
                              type="text"
                              required
                              disabled={row.isLocked}
                              value={row.role}
                              onChange={(e) => {
                                const updated = [...teamRows];
                                updated[idx].role = e.target.value;
                                setTeamRows(updated);
                              }}
                              placeholder="Ketik role karyawan... (cth. DevOps)"
                              className={`w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none transition bg-white
                                ${row.isLocked
                                  ? "bg-stone-50 font-semibold text-stone-700 cursor-not-allowed border-stone-200/80"
                                  : "text-stone-850 focus:ring-2 focus:ring-[#2d6a4f]/25 focus:border-[#2d6a4f]"
                                }
                              `}
                            />
                          </div>

                          {/* 2. Kolom Dropdown Pilihan Anggota Tim */}
                          <div className="col-span-6">
                            <select
                              required
                              value={row.userId}
                              onChange={(e) => {
                                const updated = [...teamRows];
                                updated[idx].userId = e.target.value;
                                setTeamRows(updated);
                              }}
                              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-[12px] text-stone-850 bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/25 focus:border-[#2d6a4f] transition cursor-pointer"
                            >
                              <option value="" disabled hidden>Cari nama...</option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.nama} ({member.role})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Kolom Tombol Aksi Hapus (Ikon Sampah) */}
                          <div className="col-span-1 flex justify-center">
                            {!row.isLocked ? (
                              <button
                                type="button"
                                onClick={() => setTeamRows(teamRows.filter((r) => r.id !== row.id))}
                                className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-50 transition cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <div className="w-8 h-8" />
                            )}
                          </div>

                        </div>
                      ))}
                    </div>

                    {/* Tombol Tambah Baris Baru */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setTeamRows([...teamRows, { id: `row-${Date.now()}`, role: "", userId: "", isLocked: false }])}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b4332] text-[12px] font-bold rounded-xl transition cursor-pointer shadow-sm"
                      >
                        <Plus size={14} />
                        Tambah Baris
                      </button>
                    </div>
                  </div>

                </div> {/* <-- DI SINI: Letak penutup #scroll-bridge-container yang bener */}

                {/* Footer View Aksi */}
                <div className="p-4 border-t border-stone-100 bg-white flex gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-[13px] font-semibold text-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ⚙ Edit Proyek
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectDetail(null);
                      setActiveTab("ringkasan");
                    }}
                    className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition cursor-pointer flex items-center justify-center"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </main >
      );
}

