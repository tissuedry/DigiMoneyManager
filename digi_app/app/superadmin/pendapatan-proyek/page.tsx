"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ProyekSkeleton from "./ProyekSkeleton";
import Toast from "@/components/toast";
import {
  ChevronDown,
  Eye,
  Plus,
  ReceiptText,
} from "lucide-react";
import { useApi, useInvalidate } from "@/lib/use-api";
import { getStatusStyles } from "@/lib/proyek-utils";
import { formatSisaRupiah } from "@/lib/format-nominal";

const DetailPendapatanModal = dynamic(() => import("./DetailPendapatanModal"), { ssr: false });
const AddPosModal = dynamic(() => import("./AddPosModal"), { ssr: false });
const RealisasiPemasukanModal = dynamic(() => import("./RealisasiPemasukanModal"), { ssr: false });

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
        className="flex items-center gap-2 bg-white hover:bg-stone-50/80 px-4 py-2 rounded-xl border border-stone-200 shadow-2xs transition cursor-pointer text-left"
      >
        <span className="text-[13px] font-medium text-stone-800 max-w-[200px] sm:max-w-[280px] truncate">
          {selectedProject?.nama || "Pilih Proyek"}
        </span>
        <ChevronDown size={14} className={`text-stone-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] transition ${p.id === selectedProject?.id
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

const STORAGE_KEY = "digi_keuangan_last_selected_proyek_id";

export default function KeuanganKelolaProyekContent() {
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

  const { data: responseData, isLoading, error: proyekError, refetch } = useApi<ProyekListResponse>(
    "/api/keuangan/proyek",
    { refetchInterval: 60_000 }
  );

  const projects = responseData?.projects ?? [];
  const error = proyekError?.message ?? null;

  const activeProjects = projects.filter(
    (p) => p.status?.toUpperCase() === "AKTIF" || p.status?.toUpperCase() === "ACTIVE"
  );
  const defaultProject = activeProjects[0] ?? projects[0] ?? null;

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

  return (
    <div className="flex h-full w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isLoading ? (
          <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto">
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
          <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Kelola Proyek</h1>
                <p className="text-sm text-stone-500 mt-1.5">
                  Pantau realisasi pendapatan, alokasikan pos pendapatan baru, dan kelola termin proyek.
                </p>
              </div>

              <div className="self-start">
                <ProjectSelector
                  projects={projects}
                  selectedProjectId={proyek.id}
                  onSelect={handleSelectProject}
                />
              </div>
            </div>

            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-stone-900">{proyek.nama}</h2>
                  <span className={`text-[11px] font-semibold ${getStatusStyles(proyek.status)} px-2.5 py-0.5 rounded-full border`}>
                    {proyek.status?.toUpperCase() === "AKTIF" ? "Active" : proyek.status}
                  </span>
                  <span className="text-[12px] text-stone-400 ">
                    {proyek.kode}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setIsDetailOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    <Eye size={14} className="text-stone-600" />
                    Lihat Detail Pendapatan
                  </button>

                  <button
                    onClick={() => setIsAlokasiOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008f5d] hover:bg-[#00794d] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} />
                    Tambah Pos
                  </button>

                  <button
                    onClick={() => setIsRealisasiOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#008f5d] hover:bg-[#00794d] px-3.5 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} />
                    Realisasi Pendapatan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-[14px] text-stone-900 flex items-center gap-2">
                      <ReceiptText size={16} className="text-[#008f5d]" />
                      Termin Pembayaran Proyek
                    </h3>
                    <span className="text-[11px] font-medium text-stone-400">
                      {proyek.terminPembayaran.length} Termin
                    </span>
                  </div>

                  {proyek.terminPembayaran.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-8">
                      Belum ada rincian termin pembayaran untuk proyek ini.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {proyek.terminPembayaran.map((t, idx) => {
                        const isDiterima = ["DITERIMA", "PAID", "SELESAI", "LUNAS", "APPROVED"].includes(t.status?.toUpperCase());
                        return (
                          <div
                            key={t.id || idx}
                            className={`p-3.5 rounded-xl border transition ${isDiterima
                                ? "bg-emerald-50/30 border-emerald-100/90"
                                : "bg-stone-50/50 border-stone-200/60"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold text-stone-900">
                                  {t.namaTermin}
                                </p>
                                <p className="text-[11px] text-stone-400 mt-1">
                                  Progress: {t.persentaseProgress}% {t.tanggalPencairan ? `· Cair: ${t.tanggalPencairan}` : ""}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-stone-900">
                                  {formatSisaRupiah(t.nominal)}
                                </p>
                                <div className="mt-1">
                                  <span
                                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${isDiterima
                                        ? "bg-emerald-100/80 text-emerald-800"
                                        : "bg-amber-100/80 text-amber-800"
                                      }`}
                                  >
                                    {isDiterima ? "Diterima" : "Belum Diterima"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-2xs">
                  <h3 className="font-bold text-[14px] text-stone-900 mb-4 border-b border-stone-100 pb-3">
                    Status Kas Masuk
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#e6f7ef] border border-emerald-200/80 rounded-xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                        SUDAH MASUK ({proyek.terminStats?.diterimaCount ?? 0})
                      </p>
                      <p className="text-xl font-extrabold text-stone-900 mt-1.5 whitespace-nowrap">
                        {formatSisaRupiah(proyek.terminStats?.diterimaNominal ?? proyek.realisasi)}
                      </p>
                    </div>

                    <div className="bg-[#fffbeb] border border-amber-200/80 rounded-xl p-4 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">
                        BELUM MASUK ({proyek.terminStats?.belumDiterimaCount ?? 0})
                      </p>
                      <p className="text-xl font-extrabold text-stone-900 mt-1.5 whitespace-nowrap">
                        {formatSisaRupiah(proyek.terminStats?.belumDiterimaNominal ?? Math.max(0, proyek.totalRAB - proyek.realisasi))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {isDetailOpen && proyek && (
        <DetailPendapatanModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          proyekStatus={proyek.status}
          posAnggaran={proyek.posAnggaran}
          onClose={() => setIsDetailOpen(false)}
          onRefresh={() => {
            invalidate("/api/keuangan/proyek", "/api/dashboard", "/api/proyek");
            refetch();
          }}
        />
      )}

      {isAlokasiOpen && proyek && (
        <AddPosModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          totalRAB={proyek.totalRAB}
          realisasi={proyek.realisasi}
          posAnggaran={proyek.posAnggaran}
          onClose={() => setIsAlokasiOpen(false)}
          onSuccess={(msg: any) => {
            invalidate("/api/keuangan/proyek", "/api/dashboard", "/api/proyek");
            refetch();
            if (msg) setAlokasiSuccessToast(msg);
          }}
        />
      )}

      {isRealisasiOpen && proyek && (
        <RealisasiPemasukanModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          onClose={() => setIsRealisasiOpen(false)}
          onRefresh={() => {
            invalidate("/api/keuangan/proyek", "/api/dashboard", "/api/proyek", "/api/pemasukan");
            refetch();
            setRealisasiSuccessToast("Realisasi pendapatan berhasil dicatat.");
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
