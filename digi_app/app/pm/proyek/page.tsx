"use client";

import React, { useState, useRef } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import DetailAnggaranModal from "./DetailAnggaran";
import AjukanPosModal from "./AjukanPos";
import EditProyekModal from "./EditProyek";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  Users,
  UserPlus,
  Trash2,
  Settings,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PosAnggaran = {
  id: number;
  nama: string;
  alokasi: number;
  terpakai: number;
  warna: string;
};

type AnggotaTim = {
  id: number;
  nama: string;
  inisial: string;
  role: string;
  divisi: string;
};

type ProyekData = {
  id: number;
  nama: string;
  kode: string;
  klien: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  pm: string;
  status: string;
  totalRAB: number;
  realisasi: number;
  posAnggaran: PosAnggaran[];
  tim: AnggotaTim[];
  reimbursementDisetujui: number;
  reimbursementBelumDisetujui: number;
};

// ─── Static Mock Data (UI Only) ───────────────────────────────────────────────

const MOCK_PROJECTS: ProyekData[] = [
  {
    id: 1,
    nama: "Renovasi Kantor Cabang Bandung",
    kode: "PRJ-2026-001",
    klien: "PT Sinar Logistik Nusantara",
    tanggalMulai: "12 Jan 2026",
    tanggalSelesai: "30 Sep 2026",
    pm: "Muhammad Alvin Ababil",
    status: "Aktif",
    totalRAB: 4_800_000_000,
    realisasi: 3_100_000_000,
    posAnggaran: [
      { id: 1, nama: "Material Konstruksi",   alokasi: 2_400_000_000, terpakai: 1_700_000_000, warna: "#004D34" },
      { id: 2, nama: "Tenaga Kerja Lapangan", alokasi: 1_200_000_000, terpakai:   820_000_000, warna: "#008f5d" },
      { id: 3, nama: "Sewa Alat Berat",       alokasi:   600_000_000, terpakai:   410_000_000, warna: "#D97706" },
      { id: 4, nama: "Transportasi & Logistik", alokasi: 320_000_000, terpakai:  145_000_000, warna: "#DC6B19" },
      { id: 5, nama: "Konsumsi & Akomodasi",  alokasi:   180_000_000, terpakai:    52_000_000, warna: "#7c3aed" },
      { id: 6, nama: "Perizinan & Lain-lain", alokasi:   100_000_000, terpakai:    13_000_000, warna: "#6b7280" },
    ],
    tim: [
      { id: 1, nama: "Muhammad Alvin Ababil", inisial: "MA", role: "Project Manager", divisi: "PM" },
      { id: 2, nama: "Dian Kusuma",           inisial: "DK", role: "Karyawan",        divisi: "Lapangan" },
      { id: 3, nama: "Irfan Maulana",         inisial: "IM", role: "Karyawan",        divisi: "Lapangan" },
    ],
    reimbursementDisetujui: 264_000_000,
    reimbursementBelumDisetujui: 735_000_000,
  },
  {
    id: 2,
    nama: "Pembangunan Gudang Logistik Surabaya",
    kode: "PRJ-2026-002",
    klien: "PT Maju Bersama",
    tanggalMulai: "1 Mar 2026",
    tanggalSelesai: "15 Des 2026",
    pm: "Muhammad Alvin Ababil",
    status: "Aktif",
    totalRAB: 7_200_000_000,
    realisasi: 1_250_000_000,
    posAnggaran: [
      { id: 7,  nama: "Material Konstruksi",   alokasi: 3_500_000_000, terpakai:   750_000_000, warna: "#004D34" },
      { id: 8,  nama: "Tenaga Kerja Lapangan", alokasi: 1_800_000_000, terpakai:   300_000_000, warna: "#008f5d" },
      { id: 9,  nama: "Sewa Alat Berat",       alokasi:   900_000_000, terpakai:   200_000_000, warna: "#D97706" },
      { id: 10, nama: "Perizinan & Lain-lain", alokasi:   200_000_000, terpakai:         0,     warna: "#6b7280" },
    ],
    tim: [
      { id: 1, nama: "Muhammad Alvin Ababil", inisial: "MA", role: "Project Manager", divisi: "PM" },
      { id: 4, nama: "Budi Santoso",          inisial: "BS", role: "Karyawan",        divisi: "Lapangan" },
    ],
    reimbursementDisetujui: 48_000_000,
    reimbursementBelumDisetujui: 120_000_000,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatShort = (v: number): string => {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000)     return `Rp ${(v / 1_000_000).toFixed(1)} jt`;
  if (v >= 1_000)         return `Rp ${(v / 1_000).toFixed(0)} rb`;
  return `Rp ${v.toLocaleString("id-ID")}`;
};

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Stacked colour bar (progress rainbow) */
function StackedBar({ pos, total }: { pos: PosAnggaran[]; total: number }) {
  const allocated = pos.reduce((s, p) => s + p.alokasi, 0);
  const unallocated = Math.max(0, total - allocated);

  return (
    <div className="w-full h-5 rounded-full overflow-hidden flex bg-stone-100">
      {pos.map((p) => (
        <div
          key={p.id}
          title={p.nama}
          style={{ width: `${(p.alokasi / total) * 100}%`, backgroundColor: p.warna }}
          className="h-full transition-all duration-500"
        />
      ))}
      {unallocated > 0 && (
        <div
          style={{ width: `${(unallocated / total) * 100}%` }}
          className="h-full bg-stone-300"
          title="Belum dialokasikan"
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
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {pos.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.warna }} />
          {p.nama}
          <span className="font-bold text-stone-800">{formatShort(p.alokasi)}</span>
        </span>
      ))}
      {unallocated > 0 && (
        <span className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-stone-300 shrink-0" />
          Belum dialokasikan
          <span className="font-bold text-stone-800">{formatShort(unallocated)}</span>
        </span>
      )}
    </div>
  );
}

/** Per-pos progress rows */
function PosRows({ pos }: { pos: PosAnggaran[] }) {
  return (
    <div className="space-y-4 mt-2">
      {pos.map((p) => {
        const pct = p.alokasi > 0 ? Math.min((p.terpakai / p.alokasi) * 100, 100) : 0;
        return (
          <div key={p.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800">{p.nama}</span>
              <span className="text-stone-500 font-medium tabular-nums">
                {formatShort(p.terpakai)}&nbsp;/&nbsp;{formatShort(p.alokasi)}
              </span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: "#008f5d" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hierarchical Budget Types ────────────────────────────────────────────────

export type ReimbEntry = {
  id: number;
  inisial: string;
  nama: string;
  tanggal: string;
  status: "Dicairkan" | "Menunggu PM" | "Verifikasi Keuangan" | "Ditolak";
  nominal: number;
};

export type KeteranganPos = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  reimbs: ReimbEntry[];
};

export type SubPosItem = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  keterangan: KeteranganPos[];
};

export type MainPosItem = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  subPos: SubPosItem[];
};

export const DETAIL_ANGGARAN: MainPosItem[] = [
  {
    id: 1, nama: "Material Konstruksi", alokasi: 2_400_000_000, realisasi: 1_700_000_000,
    subPos: [
      {
        id: 11, nama: "Beton & Semen", alokasi: 1_200_000_000, realisasi: 898_600_000,
        keterangan: [
          {
            id: 111, nama: "Semen Portland 500 sak", alokasi: 460_000_000, realisasi: 310_000_000,
            reimbs: [
              { id: 1, inisial: "BS", nama: "Budi Santoro", tanggal: "10 Mar 2026", status: "Dicairkan", nominal: 48_500_000 },
              { id: 2, inisial: "BS", nama: "Budi Santoro", tanggal: "15 Mar 2026", status: "Dicairkan", nominal: 22_800_000 },
            ],
          },
          {
            id: 112, nama: "Beton Ready Mix K-350", alokasi: 500_000_000, realisasi: 460_000_000,
            reimbs: [],
          },
        ],
      },
      {
        id: 12, nama: "Bahan & Campuran", alokasi: 800_000_000, realisasi: 588_000_000,
        keterangan: [
          { id: 121, nama: "Bahan aditif & campuran", alokasi: 200_000_000, realisasi: 130_000_000, reimbs: [] },
        ],
      },
    ],
  },
  { id: 2, nama: "Tenaga Kerja Lapangan", alokasi: 1_200_000_000, realisasi: 820_000_000, subPos: [] },
  { id: 3, nama: "Sewa Alat Berat", alokasi: 600_000_000, realisasi: 410_000_000, subPos: [] },
];

export const STATUS_BADGE: Record<string, string> = {
  "Dicairkan": "bg-emerald-100 text-emerald-700",
  "Menunggu PM": "bg-amber-100 text-amber-700",
  "Verifikasi Keuangan": "bg-blue-100 text-blue-700",
  "Ditolak": "bg-red-100 text-red-700",
};


// ─── Main Component ───────────────────────────────────────────────────────────

export default function KelolaProyekPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAjukanOpen, setIsAjukanOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const proyek = projects[selectedIdx];

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allocated = proyek.posAnggaran.reduce((s, p) => s + p.alokasi, 0);
  const unallocated = Math.max(0, proyek.totalRAB - allocated);
  const realisasiPct = proyek.totalRAB > 0
    ? Math.min((proyek.realisasi / proyek.totalRAB) * 100, 100)
    : 0;

  return (
    <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Project Manager"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Project Manager" />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
          {/* ── Page Header ── */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Kelola Proyek</h1>
            <p className="text-sm text-stone-500 mt-1">
              Pantau anggaran, ajukan pos baru, dan kelola tim untuk proyekmu.
            </p>
          </div>

          {/* ── Toolbar: Dropdown Proyek + Edit Proyek ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Project selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-700 shadow-sm transition-all cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="max-w-[180px] truncate">{proyek.nama}</span>
                <ChevronDown
                  size={13}
                  className={`text-stone-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {projects.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedIdx(idx); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-stone-50 flex items-center gap-2 transition ${
                        idx === selectedIdx ? "text-emerald-700 bg-emerald-50/50" : "text-stone-700"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${idx === selectedIdx ? "bg-emerald-500" : "bg-stone-300"}`} />
                      {p.nama}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Proyek button */}
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-sm transition cursor-pointer"
            >
              <Settings size={14} className="text-stone-500" />
              Edit Proyek
            </button>

            {/* Proyek meta */}
            <span className="text-xs text-stone-400 font-medium ml-auto hidden lg:block">
              {proyek.klien} · {proyek.tanggalMulai} – {proyek.tanggalSelesai} · PM: {proyek.pm}
            </span>
          </div>

          {/* ── Budget Summary Card ── */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-stone-900">{proyek.nama}</h2>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {proyek.status}
                </span>
                <span className="text-[11px] text-stone-400">{proyek.kode} · {proyek.klien}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TOTAL NILAI PROYEK</p>
                <p className="text-2xl font-extrabold text-stone-900">{formatShort(proyek.totalRAB)}</p>
              </div>
            </div>

            {/* Stacked bar */}
            <StackedBar pos={proyek.posAnggaran} total={proyek.totalRAB} />

            {/* Realisasi vs Sisa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {/* Realisasi */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#008f5d] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">REALISASI</p>
                  <p className="text-xl font-extrabold text-stone-900 mt-0.5">{formatShort(proyek.realisasi)}</p>
                </div>
                {/* Mini progress */}
                <div className="flex-1 ml-2">
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#008f5d] rounded-full transition-all duration-700"
                      style={{ width: `${realisasiPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 font-medium">{realisasiPct.toFixed(1)}% dari RAB</p>
                </div>
              </div>

              {/* Sisa */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full border-2 border-stone-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">SISA</p>
                  <p className="text-xl font-extrabold text-stone-900 mt-0.5">
                    {formatShort(proyek.totalRAB - proyek.realisasi)}
                  </p>
                </div>
                {unallocated > 0 && (
                  <span className="ml-auto text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                    {formatShort(unallocated)} belum dialokasikan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Bottom two columns ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT: Realisasi per Pos ── */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-7">
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-[15px] text-stone-900">Realisasi per Pos Anggaran</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDetailOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-800 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Eye size={13} />
                    Lihat Detail Anggaran
                  </button>
                  <button
                    onClick={() => setIsAjukanOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#008f5d] hover:bg-[#00754c] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                  >
                    <Plus size={13} />
                    Ajukan Pos
                  </button>
                </div>
              </div>

              {/* Legend */}
              <BarLegend pos={proyek.posAnggaran} total={proyek.totalRAB} />

              {/* Progress rows */}
              <PosRows pos={proyek.posAnggaran} />
            </div>

            {/* ── RIGHT: Tim + Reimbursement ── */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Tim Proyek */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                  <h3 className="font-bold text-[15px] text-stone-900 flex items-center gap-2">
                    <Users size={15} className="text-stone-400" />
                    Tim Proyek
                  </h3>
                </div>

                {/* Header row */}
                <div className="grid grid-cols-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">
                  <span>ROLE</span>
                  <span>ANGGOTA</span>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  {proyek.tim.map((member) => (
                    <div
                      key={member.id}
                      className="grid grid-cols-2 items-center bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5 gap-2"
                    >
                      <span className="text-[11px] font-semibold text-stone-600">{member.role}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${avatarColor(member.inisial)}`}>
                          {member.inisial}
                        </div>
                        <span className="text-[11px] font-bold text-stone-800 truncate">{member.nama}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add member row */}
                <div className="grid grid-cols-2 items-center mt-2 px-1 gap-2">
                  <div className="text-[11px] text-stone-400 italic">
                    Ketik nama karyawan...
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Cari nama..."
                      className="flex-1 text-[10px] border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-stone-300"
                    />
                    <button className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-500 transition cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* + Tambah Baris */}
                <button className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-stone-300 text-stone-400 hover:text-stone-600 hover:border-stone-400 rounded-xl py-2 text-[11px] font-semibold transition cursor-pointer hover:bg-stone-50">
                  <UserPlus size={12} />
                  + Tambah Baris
                </button>
              </div>

              {/* Reimbursement Summary */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-[15px] text-stone-900 mb-4 border-b border-stone-100 pb-3">
                  Reimbursement
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Sudah disetujui */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Sudah Reimburse (2)
                    </p>
                    <p className="text-lg font-extrabold text-emerald-800 mt-1">
                      {formatShort(proyek.reimbursementDisetujui)}
                    </p>
                  </div>

                  {/* Belum disetujui */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      Belum Reimburse (2)
                    </p>
                    <p className="text-lg font-extrabold text-amber-800 mt-1">
                      {formatShort(proyek.reimbursementBelumDisetujui)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Anggaran Modal */}
      {isDetailOpen && (
        <DetailAnggaranModal
          proyekNama={proyek.nama}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {/* Ajukan Pos Modal */}
      {isAjukanOpen && (
        <AjukanPosModal
          proyekNama={proyek.nama}
          proyekTotalRAB={proyek.totalRAB}
          proyekRealisasi={proyek.realisasi}
          onClose={() => setIsAjukanOpen(false)}
        />
      )}

      {/* Edit Proyek Modal */}
      {isEditOpen && (
        <EditProyekModal
          proyek={proyek}
          onClose={() => setIsEditOpen(false)}
          onSave={(updated) => {
            setProjects((prev) => {
              const nextProjects = [...prev];
              nextProjects[selectedIdx] = {
                ...nextProjects[selectedIdx],
                ...updated,
              };
              return nextProjects;
            });
            setIsEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
