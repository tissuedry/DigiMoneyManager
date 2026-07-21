"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import DetailAnggaranModal from "./DetailAnggaran";
import AjukanPosModal from "./AjukanPos";
import EditProyekModal from "./EditProyek";
import {
  ChevronDown,
  Eye,
  Plus,
  Users,
  UserPlus,
  Trash2,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { useApi, useMutate, useInvalidate } from "@/lib/use-api";

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
  reimbursementDisetujuiCount: number;
  reimbursementBelumDisetujuiCount: number;
};

type ProyekListResponse = { projects: ProyekData[] };
type UsersResponse = { users: { id: number; nama: string }[] };
type MeResponse = { user?: { proyekId?: number } };

const getStatusBadgeStyle = (statusStr?: string) => {
  const status = statusStr?.toUpperCase();
  if (status === 'AKTIF' || status === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
  if (status === 'DONE' || status === 'SELESAI') {
    return 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
  }
  if (status === 'PLANNING') {
    return 'bg-[#fbf0e4] text-[#854d0e] border-[#f5e1ce]';
  }
  if (status === 'CANCELLED' || status === 'CANCELED' || status === 'DIBATALKAN') {
    return 'bg-rose-50 text-rose-800 border-rose-100';
  }
  return 'bg-stone-100 text-stone-600 border-stone-200';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatShort = (v: number): string => {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)} rb`;
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
function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MemberSelect({ users, selectedUserId, onSelect }: {
  users: { id: number; nama: string }[];
  selectedUserId: number;
  onSelect: (userId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const initials = selectedUser ? getInitials(selectedUser.nama) : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 text-[11px] border border-stone-200 rounded-lg px-2 py-1.5 bg-white hover:bg-stone-50 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition"
      >
        {initials ? (
          <span className={`w-4 h-4 rounded-full text-[7px] font-bold flex items-center justify-center shrink-0 ${avatarColor(initials)}`}>
            {initials}
          </span>
        ) : (
          <Users size={11} className="text-stone-300 shrink-0" />
        )}
        <span className={`flex-1 text-left truncate ${selectedUser ? "text-stone-800 font-medium" : "text-stone-300"}`}>
          {selectedUser?.nama || "Pilih anggota..."}
        </span>
        <ChevronDown size={10} className={`text-stone-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 max-h-36 overflow-y-auto py-0.5">
          {users.map((u) => {
            const ini = getInitials(u.nama);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => { onSelect(u.id); setOpen(false); }}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium hover:bg-stone-50 transition ${
                  u.id === selectedUserId ? "text-emerald-700 bg-emerald-50/50" : "text-stone-700"
                }`}
              > 
                <span className={`w-4 h-4 rounded-full text-[1px] font-bold flex items-center justify-center shrink-0 ${avatarColor(ini)}`}>
                  {ini}
                </span>
                {u.nama}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Realisasi vs sisa progress bar */
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

export default function KelolaProyekPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAjukanOpen, setIsAjukanOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const invalidate = useInvalidate();

  // ── TanStack Query (ponytail: replaces manual fetch + useState) ──
  const { data: proyekData, isLoading, error: proyekError, refetch } = useApi<ProyekListResponse>("/api/pm/proyek");
  const { data: meData } = useApi<MeResponse>("/api/auth/me");
  const { data: usersData } = useApi<UsersResponse>("/api/pm/users");

  const projects = proyekData?.projects ?? [];
  const allUsers = usersData?.users ?? [];
  const error = proyekError?.message ?? null;

  const resolvedId = selectedId ?? meData?.user?.proyekId ?? projects[0]?.id ?? null;
  if (!selectedId && resolvedId) {
    setTimeout(() => setSelectedId(resolvedId), 0);
  }

  const selectProject = useMutate("/api/auth/select-project", "POST", ["/api/auth/me", "/api/dashboard"]);

  const proyek = projects.find((p) => p.id === resolvedId);

  // ─── Tim editing state ─────────────────────────────────────────────────────
  const [editableRows, setEditableRows] = useState<{ userId: number; nama: string; divisi: string }[]>([]);
  const [dirtyTim, setDirtyTim] = useState(false);
  const [savingTim, setSavingTim] = useState(false);

  // Sync editable rows when project changes
  useEffect(() => {
    if (proyek) {
      const nonPm = proyek.tim.filter((m) => m.role !== "Project Manager");
      setEditableRows(nonPm.map((m) => ({ userId: m.id, nama: m.nama, divisi: m.divisi || "" })));
      setDirtyTim(false);
    }
  }, [proyek]);

  useEffect(() => {
    if (!dirtyTim || !proyek) return;
    const timer = setTimeout(async () => {
      setSavingTim(true);
      try {
        const members: { userId: number; role: string; divisi: string | null }[] = editableRows
          .filter((r) => r.userId > 0)
          .map((r) => ({ userId: r.userId, role: "Anggota Lapangan", divisi: r.divisi || null }));

        // Always include PM
        const pmMember = proyek.tim.find((m) => m.role === "Project Manager");
        if (pmMember) {
          members.push({ userId: pmMember.id, role: "Project Manager", divisi: pmMember.divisi || null });
        }

        await fetch(`/api/proyek/${proyek.id}/members`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members }),
        });
        invalidate("/api/pm/proyek");
      } catch { /* silent */ }
      finally { setSavingTim(false); setDirtyTim(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [dirtyTim, proyek, invalidate, editableRows]);

  const addTimRow = () => {
    setEditableRows((prev) => [...prev, { userId: 0, nama: "", divisi: "" }]);
    setDirtyTim(true);
  };

  const removeTimRow = (idx: number) => {
    setEditableRows((prev) => prev.filter((_, i) => i !== idx));
    setDirtyTim(true);
  };

  const updateTimRow = (idx: number, field: "userId" | "nama" | "divisi", value: string | number) => {
    setEditableRows((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === "userId") {
        const uid = typeof value === "string" ? parseInt(value, 10) : value;
        const user = allUsers.find((u) => u.id === uid);
        return { ...row, userId: uid, nama: user?.nama || "" };
      }
      return { ...row, [field]: value };
    }));
    setDirtyTim(true);
  };

  // Reset selectedId when current selection no longer exists in projects
  useEffect(() => {
    if (projects.length > 0 && selectedId && !projects.some((p) => p.id === selectedId)) {
      setSelectedId(projects[0].id);
    }
  }, [projects.length, selectedId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f9f8f4]">
        <p className="text-stone-400 text-sm">Memuat data proyek...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userRole="Project Manager" />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Project Manager" />
          <main className="flex-1 flex items-center justify-center flex-col gap-3">
            <p className="text-stone-400 text-sm">{error}</p>
            <button onClick={() => refetch()} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Coba Lagi</button>
          </main>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-screen w-full bg-[#f9f8f4] font-sans text-stone-800 overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userRole="Project Manager" />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Project Manager" />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-stone-400 text-sm">Belum ada proyek yang dikelola.</p>
          </main>
        </div>
      </div>
    );
  }

  if (!proyek) return null;

  const allocated = proyek.posAnggaran.reduce((s, p) => s + p.alokasi, 0);
  const unallocated = Math.max(0, proyek.totalRAB - allocated);

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
          {/* ── Page Header + Project Selector ── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Kelola Proyek</h1>
              <p className="text-sm text-stone-500 mt-1">
                Pantau anggaran, ajukan pos baru, dan kelola tim untuk proyekmu.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start">
              {/* Project selector */}
              <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-2 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition-all"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-stone-800 max-w-[200px] truncate">{proyek.nama}</span>
                <ChevronDown
                  size={13}
                  className={`text-stone-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && projects.length > 1 && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id);
                        setIsDropdownOpen(false);
                        selectProject.mutate({ proyekId: p.id });
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-stone-50 flex items-center gap-2 transition ${p.id === resolvedId ? "text-emerald-700 bg-emerald-50/50" : "text-stone-700"
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${p.id === resolvedId ? "bg-emerald-500" : "bg-stone-200"}`} />
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
              className="flex items-center gap-1.5 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm transition cursor-pointer"
            >
              <Settings size={14} className="text-stone-500" />
              <span className="text-xs font-bold text-stone-800">Edit Proyek</span>
            </button>
            </div>
          </div>

          {/* ── Budget Summary Card ── */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-stone-900">{proyek.nama}</h2>
                <span className={`text-[11px] font-bold ${getStatusBadgeStyle(proyek.status)} px-2.5 py-0.5 rounded-full`}>
                  { proyek.status == "AKTIF" ? "Active"
                   : proyek.status.charAt(0).toUpperCase() + proyek.status.slice(1).toLowerCase()}
                </span>
                <span className="text-[11px] text-stone-400">{proyek.kode} · {proyek.klien}</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TOTAL NILAI PROYEK</p>
                <p className="text-2xl font-extrabold text-stone-900">{formatShort(proyek.totalRAB)}</p>
              </div>
            </div>

            {/* Stacked bar */}
            <StackedBar realisasi={proyek.realisasi} total={proyek.totalRAB} />

            {/* Realisasi vs Sisa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {/* Realisasi */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#008f5d] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">REALISASI</p>
                  <p className="text-xl font-extrabold text-stone-900 mt-0.5">{formatShort(proyek.realisasi)}</p>
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

              {/* Per-pos stacked bar */}
              <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden flex shadow-inner">
                {proyek.posAnggaran.map((p) => (
                  <div
                    key={p.id}
                    title={`${p.nama}: ${formatShort(p.alokasi)}`}
                    style={{ width: `${(p.alokasi / proyek.totalRAB) * 100}%`, backgroundColor: p.warna }}
                    className="h-full transition-all duration-500"
                  />
                ))}
                {unallocated > 0 && (
                  <div
                    style={{ width: `${(unallocated / proyek.totalRAB) * 100}%` }}
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

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                  <h3 className="font-bold text-[15px] text-stone-900 flex items-center gap-2">
                    <Users size={15} className="text-stone-400" />
                    Tim Proyek
                  </h3>
                </div>

                {/* Header row */}
                <div className="grid grid-cols-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">
                  <span>ROLE (Divisi)</span>
                  <span>ANGGOTA</span>
                </div>

                {/* PM row (read-only) */}
                {proyek.tim.filter((m) => m.role === "Project Manager").map((pm) => (
                  <div key={pm.id} className="grid grid-cols-2 items-center bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2.5 gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-emerald-700">Project Manager</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0 ${avatarColor(pm.inisial)}`}>
                        {pm.inisial}
                      </div>
                      <span className="text-[11px] font-bold text-stone-800 truncate">{pm.nama}</span>
                    </div>
                  </div>
                ))}

                <div className="space-y-2">
                  {editableRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-2 items-center bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5 gap-2">
                      <input
                        type="text"
                        placeholder="Role / Divisi"
                        value={row.divisi}
                        onChange={(e) => updateTimRow(idx, "divisi", e.target.value)}
                        className="text-[11px] border border-stone-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-stone-300"
                      />
                      <div className="flex gap-1">
                        <MemberSelect
                          users={allUsers}
                          selectedUserId={row.userId}
                          onSelect={(uid) => updateTimRow(idx, "userId", uid)}
                        />
                        <button
                          onClick={() => removeTimRow(idx)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition cursor-pointer shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
               
                <button
                  onClick={addTimRow}
                  className="inline-flex items-center mt-2 gap-1.5 text-[11px] font-bold text-white bg-[#008f5d] hover:bg-[#00754c] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                >
                  <Plus size={13} />
                  Tambah Anggota
                </button>

                {/* Saving indicator */}
                {savingTim && (
                  <p className="text-[10px] text-stone-400 font-medium mt-2 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Menyimpan...
                  </p>
                )}
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-[15px] text-stone-900 mb-4 border-b border-stone-100 pb-3">
                  Reimbursement
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-emerald-600 tracking-wider">
                      Sudah Reimburse ({proyek.reimbursementDisetujuiCount ?? 0})
                    </p>
                    <p className="text-lg font-extrabold text-black mt-1">
                      {formatShort(proyek.reimbursementDisetujui)}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-amber-600 tracking-wider">
                      Belum Reimburse ({proyek.reimbursementBelumDisetujuiCount ?? 0})
                    </p>
                    <p className="text-lg font-extrabold text-black mt-1">
                      {formatShort(proyek.reimbursementBelumDisetujui)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isDetailOpen && proyek && (
        <DetailAnggaranModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          posAnggaran={proyek.posAnggaran}
          onClose={() => setIsDetailOpen(false)}
        />
      )}

      {/* Ajukan Pos Modal */}
      {isAjukanOpen && proyek && (
        <AjukanPosModal
          proyekId={proyek.id}
          proyekNama={proyek.nama}
          totalRAB={proyek.totalRAB}
          realisasi={proyek.realisasi}
          posAnggaran={proyek.posAnggaran}
          onClose={() => setIsAjukanOpen(false)}
        />
      )}

      {/* Edit Proyek Modal */}
      {isEditOpen && (
        <EditProyekModal
          proyek={proyek}
          onClose={() => setIsEditOpen(false)}
          onSave={() => {
            refetch();
            setIsEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
