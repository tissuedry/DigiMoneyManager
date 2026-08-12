"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Wallet,
  FolderOpen,
  FileSpreadsheet, 
} from "lucide-react";
import Toast from "@/components/toast";
import Pagination from "@/components/pagination";
import BudgetFormModal from "./BudgetFormModal";

import { formatFullRupiah } from "@/lib/format-nominal";

function fmtRupiah(n: number) {
  return formatFullRupiah(n);
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Project Card Component ───────────────────────────────────────────────────
function ProyekCard({
  proyek,
  onManageBudget,
}: {
  proyek: Proyek;
  onManageBudget: (p: Proyek) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const budget = proyek.budget;
  const rab = budget ? Number(budget.rabTotal) : 0;
  const terpakai = budget ? Number(budget.totalPengeluaran) : 0;
  const sisa = budget ? Number(budget.sisaBudget) : 0;
  const pct = rab > 0 ? Math.round((terpakai / rab) * 100) : 0;

  // Handler Export Excel
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const res = await fetch(`/api/proyek/${proyek.id}/budget/laporan`);
      if (!res.ok) throw new Error("Gagal export excel");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Budget_${proyek.nama.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error", error);
      setToastError("Gagal mengunduh Excel. Pastikan data budget valid.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
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

            {/* Tombol Aksi */}
            {budget ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                  Export
                </button>
                <button
                  onClick={() => onManageBudget(proyek)}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  Edit Budget
                </button>
              </div>
            ) : (
              <button
                onClick={() => onManageBudget(proyek)}
                className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#1e5038] transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={12} />
                Buat Budget
              </button>
            )}
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

    <Toast
      open={!!toastError}
      variant="error"
      message={toastError || ''}
      onClose={() => setToastError(null)}
    />
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const LIMIT = 4;

export default function KeuanganBudgetPage() {
  const [noBudgetList, setNoBudgetList] = useState<Proyek[]>([]);
  const [hasBudgetList, setHasBudgetList] = useState<Proyek[]>([]);
  const [noBudgetTotal, setNoBudgetTotal] = useState(0);
  const [hasBudgetTotal, setHasBudgetTotal] = useState(0);
  const [pageNoBudget, setPageNoBudget] = useState(1);
  const [pageHasBudget, setPageHasBudget] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProyek, setSelectedProyek] = useState<Proyek | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSection = useCallback(async (status: "has" | "none", page: number) => {
    setError("");
    try {
      const res = await fetch(`/api/proyek?limit=${LIMIT}&budgetStatus=${status}&page=${page}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat data proyek.");
      if (status === "has") {
        setHasBudgetList(data.projects ?? []);
        setHasBudgetTotal(data.pagination?.totalItems ?? 0);
      } else {
        setNoBudgetList(data.projects ?? []);
        setNoBudgetTotal(data.pagination?.totalItems ?? 0);
      }
    } catch {
      setError("Gagal memuat data proyek. Periksa koneksi dan coba lagi.");
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSection("has", pageHasBudget),
      fetchSection("none", pageNoBudget),
    ]);
    setLoading(false);
  }, [fetchSection, pageHasBudget, pageNoBudget]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSuccess = () => {
    setSelectedProyek(null);
    setSuccessMsg("Pembaruan Budget berhasil disimpan!");
    loadAll();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const totalProjects = noBudgetTotal + hasBudgetTotal;
  const noBudgetPages = Math.ceil(noBudgetTotal / LIMIT);
  const hasBudgetPages = Math.ceil(hasBudgetTotal / LIMIT);

  return (
    <div className="min-h-screen w-full bg-[#f6f4f0] text-stone-800 flex flex-col">
      <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto space-y-6">
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

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </span>
            <button
              onClick={loadAll}
              className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Total Proyek Aktif", value: totalProjects, color: "text-stone-800" },
              {
                label: "Budget Belum Diinisialisasi",
                value: noBudgetTotal,
                color: noBudgetTotal > 0 ? "text-amber-600" : "text-emerald-600",
              },
              { label: "Budget Aktif", value: hasBudgetTotal, color: "text-emerald-700" },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[12px] text-stone-500 font-medium">{c.label}</p>
                <p className={`text-[26px] font-bold mt-1 ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Projects Without Budget — Priority */}
        {!loading && noBudgetTotal > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={15} className="text-amber-500" />
              <h2 className="text-[13px] font-bold text-stone-700">Perlu Diinisialisasi ({noBudgetTotal})</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {noBudgetList.map((p) => (
                <ProyekCard key={p.id} proyek={p} onManageBudget={setSelectedProyek} />
              ))}
            </div>
            <Pagination
              page={pageNoBudget}
              totalPages={noBudgetPages}
              onChange={(p) => {
                setPageNoBudget(p);
                fetchSection("none", p);
              }}
            />
          </div>
        )}

        {/* Projects With Budget */}
        {!loading && hasBudgetTotal > 0 && (
          <div>
            <h2 className="text-[13px] font-bold text-stone-700 mb-3 flex items-center gap-2">
              <Check size={15} className="text-emerald-600" />
              Budget Aktif ({hasBudgetTotal})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasBudgetList.map((p) => (
                <ProyekCard key={p.id} proyek={p} onManageBudget={setSelectedProyek} />
              ))}
            </div>
            <Pagination
              page={pageHasBudget}
              totalPages={hasBudgetPages}
              onChange={(p) => {
                setPageHasBudget(p);
                fetchSection("has", p);
              }}
            />
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
        {!loading && totalProjects === 0 && (
          <div className="text-center py-20 text-stone-400">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Belum ada proyek di sistem.</p>
          </div>
        )}
      </main>

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