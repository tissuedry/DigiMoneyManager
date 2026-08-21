"use client";

import React, { useState, useRef, useEffect, use } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import DetailAnggaranModal from "./DetailAnggaran";
import AlokasiPosModal from "./AlokasiPos";
import RealisasiPemasukanModal from "../pemasukan/RealisasiPemasukanModal";
import ProyekSkeleton from "./ProyekSkeleton";
import Toast from "@/components/toast";
import CompactNominal from "@/components/compact-nominal";
import {
  ChevronDown,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  Clock,
  Wallet,
  Building2,
  Calendar,
} from "lucide-react";
import { useApi, useInvalidate } from "@/lib/use-api";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type PosAnggaran = {
  id: number;
  nama: string;
  alokasi: number;
  terpakai: number;
  warna: string;
  subAnggaran?: any[];
};

type TerminItem = {
  id: number;
  namaTermin: string;
  urutan: number;
  persentaseProgress: number;
  nominal: number;
  status: string;
  tanggalPencairan: string | null;
  catatan?: string;
};

type ProyekData = {
  id: number;
  nama: string;
  kode: string;
  klien: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  pm: string;
  status: string;
  totalRAB: number;
  totalPemasukan: number;
  realisasi: number;
  realisasiPemasukan: number;
  posAnggaran: PosAnggaran[];
  terminPembayaran: TerminItem[];
  terminStats: {
    totalCount: number;
    diterimaCount: number;
    diterimaNominal: number;
    belumDiterimaCount: number;
    belumDiterimaNominal: number;
  };
};

type ProyekListResponse = { projects: ProyekData[] };

const getStatusBadgeStyle = (statusStr?: string) => {
  const status = statusStr?.toUpperCase();
  if (status === "AKTIF" || status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (status === "DONE" || status === "SELESAI") {
    return "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]";
  }
  if (status === "PLANNING") {
    return "bg-[#fbf0e4] text-[#854d0e] border-[#f5e1ce]";
  }
  if (status === "CANCELLED" || status === "CANCELED" || status === "DIBATALKAN") {
    return "bg-rose-50 text-rose-800 border-rose-100";
  }
  return "bg-stone-100 text-stone-600 border-stone-200";
};

export const formatShort = (v: number): string => {
  if (v === undefined || v === null || isNaN(v)) return "Rp 0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  return `${sign}Rp ${Math.round(abs).toLocaleString("id-ID")}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Dropdown Ganti Proyek */
function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
}: {
  projects: ProyekData[];
  selectedProjectId: number;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hanya tampilkan proyek yang statusnya AKTIF
  const activeProjects = projects.filter(
    (p) => p.status?.toUpperCase() === "AKTIF" || p.status?.toUpperCase() === "ACTIVE"
  );
  
  const displayProjects = activeProjects.length > 0 ? activeProjects : projects;
  const selectedProject = displayProjects.find((p) => p.id === selectedProjectId) || displayProjects[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white hover:bg-stone-50/80 px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs transition cursor-pointer text-left"
      >
        <span className="text-[12.5px] font-medium text-stone-800 max-w-[200px] sm:max-w-[280px] truncate">
          {selectedProject?.nama || "Pilih Proyek"}
        </span>
        <ChevronDown size={13} className={`text-stone-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-72 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto p-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
          {displayProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] transition ${
                p.id === selectedProject?.id
                  ? "bg-emerald-50 text-[#008f5d] font-semibold"
                  : "text-stone-700 hover:bg-stone-50 font-medium"
              }`}
            >
              <span className="truncate">{p.nama}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Realisasi vs Sisa Progress Bar */
function StackedBar({ realisasi, total }: { realisasi: number; total: number }) {
  const pct = total > 0 ? Math.min((realisasi / total) * 100, 100) : 0;

  return (
    <div className="w-full bg-stone-100 h-6 rounded-full overflow-hidden flex shadow-inner">
      <div
        style={{ width: `${pct}%` }}
        className="h-full bg-[#008f5d] transition-all duration-500"
      />
      {total - realisasi > 0 && (
        <div
          style={{ width: `${100 - pct}%` }}
          className="h-full bg-stone-100"
        />
      )}
    </div>
  );
}

/** Legend chips below the stacked bar */
function BarLegend({ pos, total }: { pos: PosAnggaran[]; total: number }) {
  const allocated = pos.reduce((s, p) => s + p.alokasi, 0);
  const unallocated = Math.max(0, total - allocated);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2.5 mt-3">
      {pos.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.warna }} />
          {p.nama}
          <CompactNominal value={p.alokasi} className="font-bold text-stone-800" />
        </span>
      ))}
      {unallocated > 0 && (
        <span className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-stone-300 shrink-0" />
          Belum dialokasikan
          <CompactNominal value={unallocated} className="font-bold text-stone-800" />
        </span>
      )}
    </div>
  );
}

/** Per-pos progress rows */
function PosRows({ pos }: { pos: PosAnggaran[] }) {
  if (!pos || pos.length === 0) {
    return <p className="text-xs text-stone-400 text-center py-4 font-medium">Belum ada pos alokasi pemasukan.</p>;
  }

  return (
    <div className="space-y-4 mt-2">
      {pos.map((p) => {
        const alloc = p.alokasi || 0;
        const real = p.terpakai || 0;
        const pct = alloc > 0 ? Math.min(Math.round((real / alloc) * 100), 100) : 0;
        const rem = Math.max(0, alloc - real);

        return (
          <div key={p.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">{p.nama}</span>
                {pct >= 100 && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                    <CheckCircle2 size={9} /> Terpenuhi
                  </span>
                )}
              </div>
              <div className="text-stone-500 font-mono">
                <span className="font-bold text-stone-800">Rp {Math.round(real).toLocaleString("id-ID")}</span>
                <span className="text-stone-300 mx-1">/</span>
                <span>Rp {Math.round(alloc).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
              <div
                className="h-full transition-all duration-500 bg-[#008f5d]"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>Masuk: {pct}%</span>
              <span>Sisa Belum Diterima: Rp {Math.round(rem).toLocaleString("id-ID")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function KeuanganKelolaProyekPage({ searchParams }: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <KeuanganKelolaProyekContent />;
}

const STORAGE_KEY = "digi_keuangan_last_selected_proyek_id";

function KeuanganKelolaProyekContent() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAlokasiOpen, setIsAlokasiOpen] = useState(false);
  const [isRealisasiOpen, setIsRealisasiOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  });
  const [alokasiSuccessToast, setAlokasiSuccessToast] = useState("");
  const [realisasiSuccessToast, setRealisasiSuccessToast] = useState("");

  const invalidate = useInvalidate();

  // Fetch projects data for Keuangan
  const { data: responseData, isLoading, error: proyekError, refetch } = useApi<ProyekListResponse>(
    "/api/keuangan/proyek",
    { refetchInterval: 10000 }
  );

  const projects = responseData?.projects ?? [];
  const error = proyekError?.message ?? null;

  // Prioritize active projects
  const activeProjects = projects.filter(
    (p) => p.status?.toUpperCase() === "AKTIF" || p.status?.toUpperCase() === "ACTIVE"
  );
  const defaultProject = activeProjects[0] ?? projects[0] ?? null;

  // Selected project resolution
  const proyek = (selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : null) ?? defaultProject;

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !selectedProjectId && defaultProject) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && projects.some((p) => p.id === num)) {
          setSelectedProjectId(num);
          return;
        }
      }
      setSelectedProjectId(defaultProject.id);
    }
  }, [defaultProject, selectedProjectId, projects]);

  const allocated = proyek?.posAnggaran ? proyek.posAnggaran.reduce((s, p) => s + p.alokasi, 0) : 0;
  const unallocated = proyek ? Math.max(0, proyek.totalRAB - allocated) : 0;

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Tim Keuangan"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Tim Keuangan" />

        {isLoading ? (
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <ProyekSkeleton />
          </main>
        ) : error ? (
          <main className="flex-1 flex items-center justify-center flex-col gap-3">
            <p className="text-stone-400 text-sm">{error}</p>
            <button
              onClick={() => refetch()}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Coba Lagi
            </button>
          </main>
        ) : projects.length === 0 || !proyek ? (
          <main className="flex-1 flex items-center justify-center">
            <p className="text-stone-400 text-sm">Belum ada proyek yang tersedia.</p>
          </main>
        ) : (
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
            {/* ── Page Header + Project Selector (Ganti Proyek) ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Kelola Proyek</h1>
                <p className="text-sm text-stone-500 mt-1">
                  Pantau realisasi pemasukan, alokasikan pos pemasukan baru, dan kelola termin proyek.
                </p>
              </div>

              {/* Dropdown Ganti Proyek (replaces Edit Proyek button) */}
              <div className="self-start">
                <ProjectSelector
                  projects={projects}
                  selectedProjectId={proyek.id}
                  onSelect={handleSelectProject}
                />
              </div>
            </div>

            {/* ── Budget / Revenue Summary Card ── */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              {/* Title row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-stone-900">{proyek.nama}</h2>
                  <span className={`text-[11px] font-bold ${getStatusBadgeStyle(proyek.status)} px-2.5 py-0.5 rounded-full`}>
                    {proyek.status === "AKTIF" ? "Active" : proyek.status}
                  </span>
                  <span className="text-[11px] text-stone-400">{proyek.kode} · {proyek.klien}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TOTAL NILAI PROYEK</p>
                  <p className="text-2xl font-extrabold text-stone-900 whitespace-nowrap">
                    <CompactNominal value={proyek.totalRAB} className="text-2xl font-extrabold text-stone-900" />
                  </p>
                </div>
              </div>

              {/* Stacked bar */}
              <StackedBar realisasi={proyek.realisasi} total={proyek.totalRAB} />

              {/* Realisasi vs Sisa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {/* Realisasi Pemasukan */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#008f5d] shrink-0" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">REALISASI PEMASUKAN</p>
                  </div>
                  <p className="text-xl font-extrabold text-stone-900 mt-2.5 whitespace-nowrap pl-5">
                    <CompactNominal value={proyek.realisasi} className="text-xl font-extrabold text-stone-900" />
                  </p>
                </div>

                {/* Sisa Pemasukan */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-stone-400 shrink-0" />
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">SISA BELUM DITERIMA</p>
                    </div>
                    {unallocated > 0 && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                        <CompactNominal value={unallocated} className="text-[11px] font-semibold text-amber-600" />{" "}
                        <span className="font-normal text-amber-700">belum dialokasikan</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-extrabold text-stone-900 mt-2.5 whitespace-nowrap pl-5">
                    <CompactNominal
                      value={Math.max(0, proyek.totalRAB - proyek.realisasi)}
                      className="text-xl font-extrabold text-stone-900"
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* ── Bottom two columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── LEFT: Realisasi per Pos Pemasukan (7 cols) ── */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-7">
                {/* Section header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
                  <h3 className="font-bold text-[15px] text-stone-900">Realisasi per Pos Pemasukan</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsDetailOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-800 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <Eye size={13} />
                      Lihat Detail Pemasukan
                    </button>
                    <button
                      onClick={() => setIsAlokasiOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#008f5d] hover:bg-[#00754c] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                    >
                      <Plus size={13} />
                      Setting Pos
                    </button>
                    <button
                      onClick={() => setIsRealisasiOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#008f5d] hover:bg-[#00754c] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                    >
                      <Plus size={13} />
                      Realisasi Pemasukan
                    </button>
                  </div>
                </div>

                {/* Per-pos stacked bar */}
                <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden flex shadow-inner">
                  {proyek.posAnggaran.map((p) => (
                    <div
                      key={p.id}
                      title={`${p.nama}: ${formatShort(p.alokasi)}`}
                      style={{
                        width: `${proyek.totalRAB > 0 ? (p.alokasi / proyek.totalRAB) * 100 : 0}%`,
                        backgroundColor: p.warna,
                      }}
                      className="h-full transition-all duration-500"
                    />
                  ))}
                  {unallocated > 0 && (
                    <div
                      style={{
                        width: `${proyek.totalRAB > 0 ? (unallocated / proyek.totalRAB) * 100 : 0}%`,
                      }}
                      className="h-full bg-stone-300"
                      title="Belum dialokasikan"
                    />
                  )}
                </div>

                {/* Legend */}
                <div>
                  <BarLegend pos={proyek.posAnggaran} total={proyek.totalRAB} />
                </div>

                {/* Progress rows */}
                <PosRows pos={proyek.posAnggaran} />
              </div>

              {/* ── RIGHT: Termin Pembayaran & Kas Masuk (5 cols, replaces Tim Proyek) ── */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Termin Pembayaran Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-[15px] text-stone-900 flex items-center gap-2">
                      <Wallet size={16} className="text-[#008f5d]" />
                      Termin Pembayaran Proyek
                    </h3>
                    <span className="text-[11px] font-bold text-stone-500">
                      {proyek.terminPembayaran.length} Termin
                    </span>
                  </div>

                  {proyek.terminPembayaran.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-6">
                      Belum ada rincian termin pembayaran untuk proyek ini.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {proyek.terminPembayaran.map((t, idx) => {
                        const isDiterima = ["DITERIMA", "PAID", "SELESAI", "LUNAS"].includes(t.status.toUpperCase());
                        return (
                          <div
                            key={t.id || idx}
                            className={`p-3.5 rounded-xl border transition ${
                              isDiterima
                                ? "bg-emerald-50/40 border-emerald-100"
                                : "bg-stone-50/60 border-stone-200/70"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-stone-900 truncate">
                                   {t.namaTermin}
                                </p>
                                <p className="text-[10px] text-stone-400 mt-0.5">
                                  Progress: {t.persentaseProgress}% {t.tanggalPencairan ? `· Cair: ${t.tanggalPencairan}` : ""}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-stone-900 font-mono">
                                  {formatShort(t.nominal)}
                                </p>
                                <span
                                  className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                    isDiterima
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isDiterima ? "Diterima" : "Belum Diterima"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Status Kas Masuk Summary Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="font-bold text-[15px] text-stone-900 mb-4 border-b border-stone-100 pb-3">
                    Status Kas Masuk
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                        Sudah Masuk ({proyek.terminStats?.diterimaCount ?? 0})
                      </p>
                      <p className="text-lg font-extrabold text-stone-900 mt-1">
                        {formatShort(proyek.terminStats?.diterimaNominal ?? proyek.realisasi)}
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">
                        Belum Masuk ({proyek.terminStats?.belumDiterimaCount ?? 0})
                      </p>
                      <p className="text-lg font-extrabold text-stone-900 mt-1">
                        {formatShort(proyek.terminStats?.belumDiterimaNominal ?? (proyek.totalRAB - proyek.realisasi))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Detail Pemasukan Modal */}
      {isDetailOpen && proyek && (
        <DetailAnggaranModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          proyekStatus={proyek.status}
          posAnggaran={proyek.posAnggaran}
          totalRAB={proyek.totalRAB}
          onClose={() => setIsDetailOpen(false)}
          onRefresh={() => {
            invalidate("/api/keuangan/proyek");
            refetch();
          }}
        />
      )}

      {/* Alokasi Pos Pemasukan Modal */}
      {isAlokasiOpen && proyek && (
        <AlokasiPosModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          totalRAB={proyek.totalRAB}
          realisasi={proyek.realisasi}
          posAnggaran={proyek.posAnggaran}
          onClose={() => setIsAlokasiOpen(false)}
          onSuccess={(msg) => {
            invalidate("/api/keuangan/proyek");
            refetch();
            if (msg) setAlokasiSuccessToast(msg);
          }}
        />
      )}

      {/* Realisasi Pemasukan Modal */}
      {isRealisasiOpen && proyek && (
        <RealisasiPemasukanModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          onClose={() => setIsRealisasiOpen(false)}
          onRefresh={() => {
            invalidate("/api/keuangan/proyek");
            refetch();
            setRealisasiSuccessToast("Realisasi pemasukan berhasil dicatat.");
          }}
        />
      )}

      <Toast
        open={!!alokasiSuccessToast}
        message={alokasiSuccessToast}
        onClose={() => setAlokasiSuccessToast("")}
      />

      <Toast
        open={!!realisasiSuccessToast}
        message={realisasiSuccessToast}
        onClose={() => setRealisasiSuccessToast("")}
      />
    </div>
  );
}
