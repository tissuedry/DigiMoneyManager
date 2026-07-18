import React from "react";
import { Loader2, Briefcase, Calendar, DollarSign, Settings } from "lucide-react";
import { Project } from "./types";
import { getStatusStyles, formatRupiah } from "./utils";

type ProjectGridProps = {
  loading: boolean;
  projects: Project[];
  setShowInitBudget: (p: Project) => void;
  setRabTotal: (val: string) => void;
  handleOpenDetailModal: (p: Project) => void;
  handleDirectEdit: (p: Project) => void;
  setShowAddProject: (val: boolean) => void;
};

export default function ProjectGrid({
  loading,
  projects,
  setShowInitBudget,
  setRabTotal,
  handleOpenDetailModal,
  handleDirectEdit,
  setShowAddProject,
}: ProjectGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-stone-400">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">Memuat data proyek...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}