"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Wallet,
  X,
  PlusCircle,
  FolderOpen,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRupiah(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function parseRupiah(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PosRow = { namaPos: string; nominalAlokasi: string };

type PosAnggaranDB = {
  id: number;
  namaPos: string;
  nominalAlokasi: string;
  nominalTerpakai: string;
};

type BudgetDB = {
  id: number;
  rabTotal: string;
  totalPengeluaran: string;
  sisaBudget: string;
  posAnggaran: PosAnggaranDB[];
};

type Proyek = {
  id: number;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget: BudgetDB | null;
};

// ─── Budget Form Modal ─────────────────────────────────────────────────────────
function BudgetFormModal({
  proyek,
  onClose,
  onSuccess,
}: {
  proyek: Proyek;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const hasBudget = !!proyek.budget;
  const [rows, setRows] = useState<PosRow[]>(
    hasBudget
      ? proyek.budget!.posAnggaran.map((p) => ({
          namaPos: p.namaPos,
          nominalAlokasi: String(Number(p.nominalAlokasi)),
        }))
      : [{ namaPos: "", nominalAlokasi: "" }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalAlokasi = rows.reduce((s, r) => s + parseRupiah(r.nominalAlokasi), 0);

  const addRow = () => setRows((prev) => [...prev, { namaPos: "", nominalAlokasi: "" }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof PosRow, val: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rows.some((r) => !r.namaPos.trim() || !r.nominalAlokasi)) {
      setError("Semua baris pos anggaran harus diisi lengkap.");
      return;
    }
    if (totalAlokasi <= 0) {
      setError("Total alokasi harus lebih dari Rp 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyek.id}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rabTotal: totalAlokasi,
          posAnggaran: rows.map((r) => ({
            deskripsi: r.namaPos.trim(),
            nominalAlokasi: parseRupiah(r.nominalAlokasi),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan budget.");
        return;
      }
      onSuccess();
    } catch {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-stone-900">
              {hasBudget ? "Perbarui" : "Inisialisasi"} Budget Proyek
            </h3>
            <p className="text-[12px] text-stone-400 mt-0.5">{proyek.nama}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Pos Anggaran Rows */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[12px] font-bold text-stone-600 uppercase tracking-wide">
                Pos Anggaran
              </label>
              <span className="text-[11px] text-stone-400">
                Total: <span className="font-bold text-stone-700">{fmtRupiah(totalAlokasi)}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.namaPos}
                      onChange={(e) => updateRow(i, "namaPos", e.target.value)}
                      placeholder={`Nama pos (mis. Material, Transportasi)`}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                    />
                  </div>
                  <div className="w-44">
                    <input
                      type="number"
                      min={1}
                      value={row.nominalAlokasi}
                      onChange={(e) => updateRow(i, "nominalAlokasi", e.target.value)}
                      placeholder="Nominal (Rp)"
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="p-2 text-stone-300 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#2d6a4f] hover:text-[#1e5038] transition cursor-pointer"
            >
              <PlusCircle size={14} />
              Tambah Pos Anggaran
            </button>
          </div>

          {/* Summary */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-stone-500">Total RAB</span>
              <span className="font-bold text-stone-900">{fmtRupiah(totalAlokasi)}</span>
            </div>
            <div className="flex justify-between text-[12px] mt-1">
              <span className="text-stone-400">Jumlah Pos</span>
              <span className="text-stone-600">{rows.length} pos anggaran</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {hasBudget && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-[11px] font-medium flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>
                Proyek ini sudah memiliki budget. Menyimpan akan <strong>menghapus dan mengganti</strong> semua
                pos anggaran yang belum dipakai.
              </span>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit as any}
            disabled={submitting || totalAlokasi === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check size={14} />
                {hasBudget ? "Perbarui Budget" : "Simpan Budget"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProyekCard({
  proyek,
  onManageBudget,
}: {
  proyek: Proyek;
  onManageBudget: (p: Proyek) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const budget = proyek.budget;
  const rab = budget ? Number(budget.rabTotal) : 0;
  const terpakai = budget ? Number(budget.totalPengeluaran) : 0;
  const sisa = budget ? Number(budget.sisaBudget) : 0;
  const pct = rab > 0 ? Math.round((terpakai / rab) * 100) : 0;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-stone-900 leading-tight truncate">{proyek.nama}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    proyek.status === "AKTIF"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {proyek.status}
                </span>
                <span className="text-[11px] text-stone-400">
                  {new Date(proyek.tanggalMulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => onManageBudget(proyek)}
              className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                budget
                  ? "border border-stone-200 text-stone-600 hover:bg-stone-50"
                  : "bg-[#2d6a4f] text-white hover:bg-[#1e5038]"
              }`}
            >
              {budget ? (
                <>Edit Budget</>
              ) : (
                <>
                  <Plus size={12} />
                  Buat Budget
                </>
              )}
            </button>
          </div>

          {/* Budget Summary */}
          {budget ? (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">RAB Total</span>
                <span className="font-bold text-stone-800">{fmtRupiah(rab)}</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Terpakai: {fmtRupiah(terpakai)} ({pct}%)</span>
                <span>Sisa: {fmtRupiah(sisa)}</span>
              </div>

              {/* Expand toggle */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition cursor-pointer mt-1"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? "Sembunyikan" : "Lihat"} pos anggaran ({budget.posAnggaran.length})
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
              <AlertCircle size={12} className="text-amber-500" />
              Budget belum diinisialisasi — PM belum bisa tambah pos anggaran
            </p>
          )}
        </div>
      </div>

      {/* Expanded Pos Anggaran */}
      {expanded && budget && budget.posAnggaran.length > 0 && (
        <div className="border-t border-stone-100 divide-y divide-stone-50">
          {budget.posAnggaran.map((pos) => {
            const aloc = Number(pos.nominalAlokasi);
            const pakai = Number(pos.nominalTerpakai);
            const posPct = aloc > 0 ? Math.round((pakai / aloc) * 100) : 0;
            return (
              <div key={pos.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-stone-800">{pos.namaPos}</p>
                  <div className="h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        posPct >= 90 ? "bg-red-400" : posPct >= 70 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{ width: `${Math.min(posPct, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-bold text-stone-800">{fmtRupiah(aloc)}</p>
                  <p className="text-[10px] text-stone-400">
                    {fmtRupiah(pakai)} terpakai · {posPct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function KeuanganBudgetPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [proyekList, setProyekList] = useState<Proyek[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProyek, setSelectedProyek] = useState<Proyek | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchProyek = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proyek");
      const data = await res.json();
      setProyekList(data.projects ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProyek(); }, [fetchProyek]);

  const handleSuccess = () => {
    setSelectedProyek(null);
    setSuccessMsg("Budget berhasil disimpan! PM sekarang dapat menambahkan pos anggaran.");
    fetchProyek();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const noBudget = proyekList.filter((p) => !p.budget);
  const hasBudget = proyekList.filter((p) => !!p.budget);

  return (
    <div className="flex h-screen w-full bg-[#f4f2ec] text-stone-800 overflow-hidden">
      <Sidebar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} userRole="Tim Keuangan" />

      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f4f0] overflow-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} userRole="Tim Keuangan" />

        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 max-w-[1200px] w-full mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Manajemen Budget Proyek</h1>
            <p className="text-sm text-stone-500 mt-1">
              Inisialisasi dan kelola RAB (Rencana Anggaran Biaya) per proyek. Budget yang diinisialisasi memungkinkan PM menambah pos anggaran.
            </p>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <Check size={16} />
              {successMsg}
            </div>
          )}

          {/* Summary Cards */}
          {!loading && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Proyek", value: proyekList.length, color: "text-stone-800" },
                {
                  label: "Budget Belum Diinisialisasi",
                  value: noBudget.length,
                  color: noBudget.length > 0 ? "text-amber-600" : "text-emerald-600",
                },
                { label: "Budget Aktif", value: hasBudget.length, color: "text-emerald-700" },
              ].map((c) => (
                <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-[12px] text-stone-500 font-medium">{c.label}</p>
                  <p className={`text-[26px] font-bold mt-1 ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Projects Without Budget — Priority */}
          {!loading && noBudget.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={15} className="text-amber-500" />
                <h2 className="text-[13px] font-bold text-stone-700">Perlu Diinisialisasi ({noBudget.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {noBudget.map((p) => (
                  <ProyekCard key={p.id} proyek={p} onManageBudget={setSelectedProyek} />
                ))}
              </div>
            </div>
          )}

          {/* Projects With Budget */}
          {!loading && hasBudget.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-stone-700 mb-3 flex items-center gap-2">
                <Check size={15} className="text-emerald-600" />
                Budget Aktif ({hasBudget.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hasBudget.map((p) => (
                  <ProyekCard key={p.id} proyek={p} onManageBudget={setSelectedProyek} />
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3 text-stone-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Memuat data proyek...</span>
            </div>
          )}

          {/* Empty */}
          {!loading && proyekList.length === 0 && (
            <div className="text-center py-20 text-stone-400">
              <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Belum ada proyek di sistem.</p>
            </div>
          )}
        </main>
      </div>

      {/* Budget Modal */}
      {selectedProyek && (
        <BudgetFormModal
          proyek={selectedProyek}
          onClose={() => setSelectedProyek(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
