"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertTriangle, TrendingUp, Activity } from "lucide-react";

type ProjectItem = {
  id: number;
  kode: string;
  proyekNama: string;
  klien: string;
  status: string;
  rabTotal: number;
  realisasi: number;
  sisaBudget: number;
  realisasiPct: number;
  margin: number;
};

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};

// Generate AI-style recommendations from project data (rule-based)
function generateRekomendasi(projects: ProjectItem[]) {
  const recs: { type: "warning" | "caution" | "success"; title: string; desc: string }[] = [];

  const sorted = [...projects].sort((a, b) => a.margin - b.margin);

  sorted.forEach((p) => {
    if (p.margin < 12) {
      recs.push({
        type: "warning",
        title: `${p.proyekNama.split(" ").slice(0, 2).join(" ")}: margin ${p.margin}%`,
        desc: `Pertimbangkan negosiasi ulang harga material dengan vendor. Potensi penghematan pada pos pengeluaran terbesar.`,
      });
    } else if (p.margin < 20) {
      recs.push({
        type: "caution",
        title: `${p.proyekNama.split(" ").slice(0, 3).join(" ")}: perhatian`,
        desc: `Realisasi ${p.realisasiPct}% di atas rata-rata proyek serupa. Audit pengeluaran disarankan.`,
      });
    } else {
      recs.push({
        type: "success",
        title: `${p.proyekNama.split(" ").slice(0, 2).join(" ")}: leading`,
        desc: `Margin ${p.margin}%, di atas rata-rata. Pelajari best practice untuk proyek baru.`,
      });
    }
  });

  return recs.slice(0, 4);
}

export default function ProfitabilitasPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const list: ProjectItem[] = d.dashboard?.projectList ?? [];
        setProjects(list.sort((a, b) => b.margin - a.margin));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#2d6a4f]" size={28} />
          <p className="text-stone-500 text-sm">Memuat data profitabilitas...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Gagal memuat data: {error}
        </div>
      </main>
    );
  }

  const avgMargin = projects.length > 0
    ? (projects.reduce((s, p) => s + p.margin, 0) / projects.length).toFixed(1)
    : "0";
  const highMargin = projects.filter((p) => p.margin > 20).length;
  const riskyProjects = projects.filter((p) => p.margin < 12).length;
  const maxMargin = Math.max(...projects.map((p) => p.margin), 1);

  const recs = generateRekomendasi(projects);

  return (
    <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 leading-tight">Profitabilitas</h1>
        <p className="text-sm text-stone-500 mt-1">
          Bandingkan profitabilitas antar proyek aktif. Identifikasi proyek dengan risiko margin tipis.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Margin rata-rata",
            value: `${avgMargin}%`,
            sub: "↑ 1.2%",
            subColor: "text-emerald-600",
            icon: <Activity size={18} className="text-emerald-600" />,
            iconBg: "bg-emerald-50",
          },
          {
            label: "Proyek dengan margin > 20%",
            value: highMargin.toString(),
            sub: `dari ${projects.length} aktif`,
            subColor: "text-stone-400",
            icon: <TrendingUp size={18} className="text-blue-600" />,
            iconBg: "bg-blue-50",
          },
          {
            label: "Proyek berisiko (margin < 12%)",
            value: riskyProjects.toString(),
            sub: riskyProjects > 0 ? "perlu perhatian" : "semua aman",
            subColor: riskyProjects > 0 ? "text-red-500" : "text-emerald-600",
            icon: <AlertTriangle size={18} className="text-red-500" />,
            iconBg: "bg-red-50",
          },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-stone-500">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>{c.icon}</div>
            </div>
            <div>
              <p className="text-[26px] font-bold text-stone-900 leading-none">{c.value}</p>
              <p className={`text-[11px] font-semibold mt-1.5 ${c.subColor}`}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Distribusi Margin */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[15px] text-stone-900">Distribusi Margin Proyek</h3>
          <span className="text-[11px] text-stone-400">Hover untuk detail</span>
        </div>

        <div className="space-y-5">
          {projects.map((p) => {
            const barWidth = maxMargin > 0 ? (p.margin / maxMargin) * 100 : 0;
            const barColor =
              p.margin >= 20 ? "#2d6a4f" :
              p.margin >= 12 ? "#c9a227" :
              "#c0392b";
            const marginLabel =
              p.margin >= 20 ? "text-emerald-600" :
              p.margin >= 12 ? "text-amber-600" :
              "text-red-600";

            return (
              <div
                key={p.id}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-center justify-between mb-1.5 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{p.proyekNama}</span>
                    <span className="text-stone-400 text-[11px]">{p.klien}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-stone-400">
                      Revenue: {fmtShort(p.rabTotal)}
                    </span>
                    <span className={`font-bold ${marginLabel}`}>{p.margin}%</span>
                  </div>
                </div>

                <div className="h-7 bg-stone-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500 group-hover:opacity-90"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  />
                  {hoveredId === p.id && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center px-3">
                      <span className="text-white text-[11px] font-bold drop-shadow">
                        {fmtShort(p.realisasi)} digunakan · {fmtShort(p.sisaBudget)} sisa
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-5 mt-5 pt-4 border-t border-stone-100">
          {[
            { label: "< 12% berisiko", color: "#c0392b" },
            { label: "12–20% wajar", color: "#c9a227" },
            { label: "> 20% sehat", color: "#2d6a4f" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
              <span className="text-[11px] text-stone-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown + Rekomendasi AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Breakdown Pendapatan vs Biaya */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h3 className="font-bold text-[15px] text-stone-900 mb-5">Breakdown Pendapatan vs Biaya</h3>
          <div className="space-y-4">
            {projects.slice(0, 4).map((p) => {
              const totalBar = p.rabTotal;
              const biayaPct = totalBar > 0 ? (p.realisasi / totalBar) * 100 : 0;
              const sisaPct = totalBar > 0 ? (p.sisaBudget / totalBar) * 100 : 0;

              return (
                <div key={p.id} className="space-y-1.5">
                  <p className="text-[13px] font-bold text-stone-800">{p.proyekNama}</p>
                  <div className="flex gap-1 h-8">
                    <div
                      className="rounded-l-lg flex items-center px-3"
                      style={{ width: `${biayaPct}%`, backgroundColor: "#c9a227", minWidth: 60 }}
                    >
                      <span className="text-white text-[11px] font-bold whitespace-nowrap truncate">
                        {fmtShort(p.realisasi)}
                      </span>
                    </div>
                    <div
                      className="rounded-r-lg flex items-center px-3"
                      style={{ width: `${sisaPct}%`, backgroundColor: "#2d6a4f", minWidth: 60 }}
                    >
                      <span className="text-white text-[11px] font-bold whitespace-nowrap truncate">
                        +{fmtShort(p.sisaBudget)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rekomendasi AI */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <h3 className="font-bold text-[15px] text-stone-900 mb-5">Rekomendasi AI</h3>
          <div className="space-y-3">
            {recs.map((r, i) => {
              const colors = {
                warning: { bg: "bg-red-50", border: "border-red-200", icon: "bg-red-500", text: "text-red-700" },
                caution: { bg: "bg-amber-50", border: "border-amber-200", icon: "bg-amber-500", text: "text-amber-700" },
                success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-500", text: "text-emerald-700" },
              }[r.type];

              return (
                <div key={i} className={`${colors.bg} ${colors.border} border rounded-xl p-3.5`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${colors.icon}`} />
                    <p className={`text-[12px] font-bold ${colors.text}`}>{r.title}</p>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug">{r.desc}</p>
                </div>
              );
            })}

            {recs.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-4">
                Belum ada data cukup untuk rekomendasi.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
