"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, TrendingUp, TrendingDown, Check, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Type Definitions ──────────────────────────────────────────────────────────
type CashFlowMonth = { bulan: string; inflow: number; outflow: number };
type ReimbursementPipeline = {
  diajukan: { count: number; pct: number };
  disetujuiPM: { count: number; pct: number };
  diprosesKeuangan: { count: number; pct: number };
  dicairkan: { count: number; pct: number };
};
type ProjectItem = {
  id: number;
  kode: string;
  proyekNama: string;
  klien: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  rabTotal: number;
  realisasi: number;
  sisaBudget: number;
  realisasiPct: number;
  margin: number;
};
type DashboardMetrics = {
  totalRABAllocated: number;
  totalRABActiveProyek: number;
  realisasiYTD: number;
  pendapatanBulanIni: number;
  marginBersih: number;
  avgMargin: number;
  projectCount: number;
  activeProjectCount: number;
};
type DashboardData = {
  metrics: DashboardMetrics;
  cashFlow: CashFlowMonth[];
  reimbursementPipeline: ReimbursementPipeline;
  projectList: ProjectItem[];
};

// ── Formatting Helpers ─────────────────────────────────────────────────────────
const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
};

const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// ── Bar Chart Component ────────────────────────────────────────────────────────
function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  const [activeFilter, setActiveFilter] = useState<"4M" | "12M" | "YTD">("12M");
  const [tooltip, setTooltip] = useState<{ i: number; x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const displayed = activeFilter === "4M" ? data.slice(-4) : activeFilter === "YTD" ? data : data;
  const maxVal = Math.max(...displayed.flatMap((d) => [d.inflow, d.outflow]), 1);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[15px] text-stone-900">Arus Kas Real-Time</h3>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
          {(["4M", "12M", "YTD"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${activeFilter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" ref={chartRef}>
        <div className="flex items-end gap-1.5 h-40">
          {displayed.map((d, i) => {
            const inH = Math.max((d.inflow / maxVal) * 100, 2);
            const outH = Math.max((d.outflow / maxVal) * 100, 2);
            return (
              <div
                key={i}
                className="flex-1 flex items-end gap-0.5 cursor-pointer group h-full"
                onMouseEnter={(e) => {
                  const rect = chartRef.current?.getBoundingClientRect();
                  if (rect) setTooltip({ i, x: e.clientX - rect.left, y: 0 });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="flex-1 rounded-t-sm transition-all duration-200 group-hover:opacity-80"
                  style={{ height: `${inH}%`, background: "#2d6a4f" }}
                />
                <div
                  className="flex-1 rounded-t-sm transition-all duration-200 group-hover:opacity-80"
                  style={{ height: `${outH}%`, background: "#c9a227" }}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis labels */}
        <div className="flex gap-1.5 mt-1.5">
          {displayed.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-stone-400 font-medium">
              {d.bulan}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip !== null && displayed[tooltip.i] && (
          <div
            className="absolute bottom-12 pointer-events-none bg-stone-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl z-10 whitespace-nowrap"
            style={{ left: Math.min(tooltip.x, (chartRef.current?.offsetWidth ?? 300) - 130) }}
          >
            <div className="font-bold mb-1">{displayed[tooltip.i].bulan}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2d6a4f] inline-block" />
              Inflow: {fmtShort(displayed[tooltip.i].inflow)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] inline-block" />
              Outflow: {fmtShort(displayed[tooltip.i].outflow)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-[11px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2d6a4f] inline-block" />
            <span className="text-stone-500">Inflow {fmtShort(displayed.reduce((s, d) => s + d.inflow, 0))}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a227] inline-block" />
            <span className="text-stone-500">Outflow {fmtShort(displayed.reduce((s, d) => s + d.outflow, 0))}</span>
          </span>
        </div>
        <span className="font-bold text-emerald-700">
          Net cash +{fmtShort(displayed.reduce((s, d) => s + d.inflow - d.outflow, 0))}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d.dashboard))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#008f5d]" size={32} />
          <p className="text-stone-500 text-sm">Memuat Executive Dashboard...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Gagal memuat dashboard: {error || "Data tidak tersedia"}
        </div>
      </main>
    );
  }

  const { metrics, cashFlow, reimbursementPipeline, projectList } = data;

  const statCards = [
    {
      label: "Total RAB Aktif",
      value: fmtShort(metrics.totalRABActiveProyek ?? metrics.totalRABAllocated),
      sub: `${metrics.activeProjectCount ?? metrics.projectCount} proyek aktif`,
      icon: "📋",
      trend: null,
      trendColor: "",
    },
    {
      label: "Realisasi YTD",
      value: fmtShort(metrics.realisasiYTD),
      sub: metrics.totalRABAllocated > 0
        ? `${((metrics.realisasiYTD / metrics.totalRABAllocated) * 100).toFixed(1)}% dari RAB`
        : "—",
      icon: "📈",
      trend: "↑ 8.2%",
      trendColor: "text-emerald-600",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: fmtShort(metrics.pendapatanBulanIni),
      sub: "",
      icon: "⬆",
      trend: "↑ 14.9%",
      trendColor: "text-emerald-600",
    },
    {
      label: "Margin Bersih",
      value: `${metrics.marginBersih}%`,
      sub: "",
      icon: "✓",
      trend: `↑ 2.1% vs bulan lalu`,
      trendColor: "text-emerald-600",
    },
  ];

  const pipeline = [
    { label: "Diajukan", count: reimbursementPipeline.diajukan.count, pct: 100, color: "#1c1c1a" },
    { label: "Disetujui PM", count: reimbursementPipeline.disetujuiPM.count, pct: reimbursementPipeline.disetujuiPM.pct, color: "#2b7eb5" },
    { label: "Diproses Keuangan", count: reimbursementPipeline.diprosesKeuangan.count, pct: reimbursementPipeline.diprosesKeuangan.pct, color: "#c9a227" },
    { label: "Dicairkan", count: reimbursementPipeline.dicairkan.count, pct: reimbursementPipeline.dicairkan.pct, color: "#2d6a4f" },
  ];

  return (
    <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 leading-tight">Executive Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">
          Ringkasan real-time arus kas, profitabilitas proyek, dan performa tim per {dateLabel}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-500">{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <div>
              <p className="text-[22px] font-bold text-stone-900 leading-tight">{card.value}</p>
              {card.trend && (
                <p className={`text-[11px] font-semibold mt-1 ${card.trendColor}`}>{card.trend}</p>
              )}
              {card.sub && !card.trend && (
                <p className="text-[11px] text-stone-400 mt-1">{card.sub}</p>
              )}
              {card.sub && card.trend && (
                <p className="text-[10px] text-stone-400">{card.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cash Flow + Reimbursement Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-7">
          <CashFlowChart data={cashFlow} />
        </div>

        {/* Status Reimbursement Pipeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[15px] text-stone-900">Status Reimbursement</h3>
            <span className="text-[11px] text-stone-400 font-medium">
              {reimbursementPipeline.diajukan.count} pengajuan bulan ini
            </span>
          </div>

          <div className="space-y-4">
            {pipeline.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-stone-700">{item.label}</span>
                  <span className="text-stone-400 font-medium">
                    {item.count} ({item.pct}%)
                  </span>
                </div>
                <div className="h-5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profitabilitas Proyek */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-[15px] text-stone-900">Profitabilitas Proyek Aktif</h3>
          <Link
            href="/manager/profitabilitas"
            className="flex items-center gap-1 text-[12px] font-bold text-stone-600 hover:text-stone-900 transition"
          >
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-stone-400 font-semibold uppercase tracking-wide border-b border-stone-100">
                <th className="text-left px-6 py-3">Proyek</th>
                <th className="text-left px-4 py-3">Klien</th>
                <th className="text-right px-4 py-3">RAB</th>
                <th className="text-right px-4 py-3">Realisasi</th>
                <th className="text-right px-4 py-3">Sisa</th>
                <th className="text-left px-4 py-3 w-32">Realisasi</th>
                <th className="text-right px-6 py-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {projectList.slice(0, 5).map((p) => {
                const marginColor =
                  p.margin >= 20 ? "text-emerald-600" :
                  p.margin >= 12 ? "text-amber-600" :
                  "text-red-600";
                const barColor =
                  p.margin >= 20 ? "#2d6a4f" :
                  p.margin >= 12 ? "#c9a227" :
                  "#c0392b";

                return (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[13px] font-bold text-stone-900 leading-tight">{p.proyekNama}</p>
                      <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                        {p.kode} · {new Date(p.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        {p.tanggalSelesai && ` – ${new Date(p.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-stone-500 font-medium">{p.klien}</td>
                    <td className="px-4 py-4 text-right text-[12px] font-semibold text-stone-700 font-mono">{fmtShort(p.rabTotal)}</td>
                    <td className="px-4 py-4 text-right text-[12px] font-semibold text-stone-700 font-mono">{fmtShort(p.realisasi)}</td>
                    <td className="px-4 py-4 text-right text-[12px] font-semibold text-stone-700 font-mono">{fmtShort(p.sisaBudget)}</td>
                    <td className="px-4 py-4 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${p.realisasiPct}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="text-[11px] text-stone-500 font-mono w-8 text-right">{p.realisasiPct}%</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right text-[13px] font-bold ${marginColor}`}>
                      {p.margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {projectList.length === 0 && (
            <div className="py-12 text-center text-stone-400 text-sm">
              Belum ada data proyek.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
