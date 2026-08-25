"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Wallet, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import CompactNominal from "@/components/compact-nominal";

type CashFlowMonth = { bulan: string; inflow: number; outflow: number };
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
  totalPemasukan: number;
  totalPengeluaran: number;
  selisihBersih: number;
  pctPemasukan: number;
  pctPengeluaran: number;
  realisasiYTD: number;
  pendapatanBulanIni: number;
  marginBersih: number;
  avgMargin: number;
  projectCount: number;
  activeProjectCount: number;
};
type PengajuanSummary = {
  menunggu: { count: number; nominal: number };
  disetujui: { count: number; nominal: number };
};
type TerminSummary = {
  belumDicairkan: { count: number; nominal: number };
  dicairkan: { count: number; nominal: number };
};
type DashboardData = {
  metrics: DashboardMetrics;
  cashFlow: CashFlowMonth[];
  projectList: ProjectItem[];
  pengajuanSummary?: PengajuanSummary;
  terminSummary?: TerminSummary;
};
type DashboardResponse = {
  dashboard: DashboardData;
};

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  const [activeFilter, setActiveFilter] = useState<"4M" | "12M" | "YTD">("12M");
  const [tooltip, setTooltip] = useState<{ i: number; x: number } | null>(null);
  const [plotHeight, setPlotHeight] = useState(200);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setPlotHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => setPlotHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displayed =
    activeFilter === "4M" ? data.slice(-4) : data;
  const maxVal = Math.max(...displayed.flatMap((d) => [d.inflow, d.outflow]), 1);

  const totalInflow = displayed.reduce((s, d) => s + d.inflow, 0);
  const totalOutflow = displayed.reduce((s, d) => s + d.outflow, 0);
  const totalNet = totalInflow - totalOutflow;

  return (
    <div className="bg-white rounded-2xl border border-[#e6e1d4] p-5 flex flex-col gap-3 flex-1 min-w-0 self-stretch">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-[#14130f] tracking-tight">Arus Kas Real-Time</p>
          <p className="text-[12px] text-[#9a948b]">12 Bulan Terakhir</p>
        </div>
        <div className="flex gap-0.5 bg-[#f3f0e9] rounded-xl p-[3px]">
          {(["4M", "12M", "YTD"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-[6px] text-[12.5px] font-medium rounded-lg transition-all ${
                activeFilter === f
                  ? "bg-white text-[#14130f] font-semibold shadow-sm"
                  : "text-[#6a6660] hover:text-[#14130f]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-[200px]" ref={chartRef}>
        <div
          className="absolute inset-0 flex items-end gap-1 pb-0"
        >
          {displayed.map((d, i) => {
            const inPx = Math.max(Math.round((d.inflow / maxVal) * plotHeight), 3);
            const outPx = Math.max(Math.round((d.outflow / maxVal) * plotHeight), 3);
            return (
              <div
                key={i}
                className="flex-1 flex items-end gap-[2px] cursor-pointer group"
                style={{ height: plotHeight }}
                onMouseEnter={(e) => {
                  const rect = chartRef.current?.getBoundingClientRect();
                  if (rect) {
                    const cw = chartRef.current?.offsetWidth ?? 400;
                    setTooltip({ i, x: Math.min(e.clientX - rect.left, cw - 160) });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div
                  className="flex-1 rounded-t-[3px] transition-all duration-500 group-hover:opacity-75"
                  style={{ height: inPx, background: "#009162" }}
                />
                <div
                  className="flex-1 rounded-t-[3px] transition-all duration-500 group-hover:opacity-75"
                  style={{ height: outPx, background: "#902f33" }}
                />
              </div>
            );
          })}
        </div>

        {tooltip !== null && displayed[tooltip.i] && (
          <div
            className="absolute bottom-12 pointer-events-none bg-[#1c1917] text-white text-[11px] rounded-xl px-3 py-2 shadow-xl z-10 whitespace-nowrap"
            style={{ left: tooltip.x }}
          >
            <div className="font-bold mb-1 text-[12px]">{displayed[tooltip.i].bulan}</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#009162] inline-block" />
              Pemasukan: <CompactNominal value={displayed[tooltip.i].inflow} compactThreshold={1} />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-sm bg-[#902f33] inline-block" />
              Pengeluaran: <CompactNominal value={displayed[tooltip.i].outflow} compactThreshold={1} />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {displayed.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-[#9a948b] font-medium">
            {d.bulan}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 pt-1 border-t border-[#f3f0e9]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#009162] inline-block" />
          <span className="text-[12px] text-[#6a6660]">Pemasukan</span>
          <span className="text-[12px] font-semibold text-[#14130f] ml-1 "><CompactNominal value={totalInflow} compactThreshold={1} /></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#902f33] inline-block" />
          <span className="text-[12px] text-[#6a6660]">Pengeluaran</span>
          <span className="text-[12px] font-semibold text-[#14130f] ml-1 "><CompactNominal value={totalOutflow} compactThreshold={1} /></span>
        </div>
        <div className="ml-auto">
          <span className="text-[12px] text-[#6a6660]">Selisih Bersih </span>
          <span className={`text-[12px] font-bold  ${totalNet >= 0 ? "text-[#005836]" : "text-[#902f33]"}`}>
            <CompactNominal value={totalNet} compactThreshold={1} />
          </span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{
    label: string;
    count: string;
    nominal: number;
    color: "amber" | "green";
  }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e6e1d4] p-5 flex flex-col gap-3 w-[411px] shrink-0"
      style={{ boxShadow: "0px 0px 0px 1px rgba(20,18,14,0.04), 0px 1px 2px 0px rgba(20,18,14,0.05)" }}>
      <div>
        <p className="text-[15px] font-bold text-[#14130f] tracking-tight">{title}</p>
        <p className="text-[12px] text-[#9a948b] mt-0.5">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const isAmber = item.color === "amber";
          const bg = isAmber ? "rgba(216,149,61,0.10)" : "rgba(0,145,98,0.10)";
          return (
            <div
              key={i}
              className="rounded-[10px] px-[14px] py-3 flex items-center justify-between"
              style={{ background: bg }}
            >
              <div>
                <p className="text-[12.5px] font-semibold text-[#14130f] leading-[18.75px]">{item.label}</p>
                <p className="text-[11px] text-[#9a948b] leading-[16.5px]">{item.count}</p>
              </div>
              <CompactNominal
                value={item.nominal}
                compactThreshold={1_000_000_000_000}
                className={`text-[15px] font-bold leading-[22.5px]  ${isAmber ? "text-[#894c06]" : "text-[#005836]"}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonContent() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e4e0d9] p-6 flex flex-col gap-[18px]">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-stone-200 rounded-md" />
                <div className="h-6 w-6 bg-stone-200 rounded-lg" />
              </div>
              <div className="h-6 w-32 bg-stone-200 rounded-md" />
              <div className="h-4 w-20 bg-stone-100 rounded-md" />
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-stretch">
          <div className="flex-1 bg-white rounded-2xl border border-[#e6e1d4] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-stone-200 rounded-md" />
                <div className="h-3 w-28 bg-stone-100 rounded-md" />
              </div>
              <div className="flex gap-1 bg-[#f3f0e9] rounded-xl p-[3px]">
                <div className="h-7 w-10 bg-stone-200 rounded-lg" />
                <div className="h-7 w-10 bg-stone-200 rounded-lg" />
                <div className="h-7 w-10 bg-stone-200 rounded-lg" />
              </div>
            </div>
            <div className="flex-1 flex items-end gap-2 min-h-[200px]">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 flex items-end gap-[2px] h-full">
                  <div
                    className="flex-1 bg-[#009162]/30 rounded-t-[3px]"
                    style={{ height: `${30 + ((i * 23) % 60)}%` }}
                  />
                  <div
                    className="flex-1 bg-[#902f33]/20 rounded-t-[3px]"
                    style={{ height: `${20 + ((i * 17) % 50)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 pt-1 border-t border-[#f3f0e9]">
              <div className="h-3 w-24 bg-stone-200 rounded-md" />
              <div className="h-3 w-24 bg-stone-200 rounded-md" />
              <div className="h-3 w-24 bg-stone-200 rounded-md ml-auto" />
            </div>
          </div>

          <div className="flex flex-col gap-4 shrink-0 w-[411px]">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e6e1d4] p-5 flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-stone-200 rounded-md" />
                  <div className="h-3 w-56 bg-stone-100 rounded-md" />
                </div>
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="rounded-[10px] px-[14px] py-3 bg-stone-100 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 bg-stone-200 rounded-md" />
                      <div className="h-3 w-20 bg-stone-100 rounded-md" />
                    </div>
                    <div className="h-4 w-24 bg-stone-200 rounded-md" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border-[0.8px] border-[#e7e5e4]">
          <div className="flex items-center justify-between px-6 py-6 border-b border-[#f5f5f4]">
            <div className="h-4 w-24 bg-stone-200 rounded-md" />
            <div className="h-4 w-20 bg-stone-100 rounded-md" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-6">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-1/4 bg-stone-200 rounded" />
                  <div className="h-3 w-1/5 bg-stone-100 rounded" />
                </div>
                <div className="h-3 w-16 bg-stone-200 rounded" />
                <div className="h-3 w-16 bg-stone-200 rounded" />
                <div className="h-3 w-16 bg-stone-200 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-[6px] w-24 bg-stone-200 rounded-full" />
                  <div className="h-3 w-6 bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const { data, isLoading, error } = useApi<DashboardResponse>("/api/dashboard");

  const d = data?.dashboard ?? null;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[#f6f4ef]">
        <div className="p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-[24px] font-bold text-[#1c1917] leading-[30px]">
              Beranda Eksekutif
            </h1>
            <p className="text-[14px] text-[#79716b] mt-1">
              Ringkasan real-time arus kas dan nilai proyek per {dateLabel}.
            </p>
          </div>
          <SkeletonContent />
        </div>
      </main>
    );
  }

  if (error || !d) {
    return (
      <main className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          Gagal memuat dashboard: {error?.message || "Data tidak tersedia"}
        </div>
      </main>
    );
  }

  const { metrics, cashFlow, projectList, pengajuanSummary, terminSummary } = d;

  const totalNilaiProyek = metrics.totalRABAllocated;
  const totalPemasukan = metrics.totalPemasukan ?? metrics.realisasiYTD;
  const totalPengeluaran = metrics.totalPengeluaran ?? metrics.realisasiYTD;
  const selisihBersih = metrics.selisihBersih ?? (totalPemasukan - totalPengeluaran);
  const pctPemasukan = metrics.pctPemasukan ?? (totalNilaiProyek > 0 ? Math.round((totalPemasukan / totalNilaiProyek) * 100) : 0);
  const pctPengeluaran = metrics.pctPengeluaran ?? (totalNilaiProyek > 0 ? Math.round((totalPengeluaran / totalNilaiProyek) * 100) : 0);

  const statCards = [
    {
      id: "total-nilai-proyek",
      label: "Total Nilai Proyek",
      nominal: totalNilaiProyek,
      sub: `${metrics.activeProjectCount ?? metrics.projectCount} Proyek`,
      subColor: "#9a948b",
      iconBg: "#f0f7fb",
      icon: (
        <svg width="19" height="20" viewBox="0 0 19 20" fill="none">
          <path d="M2.375 17.5H16.625M3.958 14.167V9.375M7.125 14.167V9.375M11.875 14.167V9.375M15.042 14.167V9.375M9.5 2.083L16.625 6.25H2.375L9.5 2.083Z" stroke="#005d8d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      badge: null,
    },
    {
      id: "total-pemasukan",
      label: "Total Pemasukan",
      nominal: totalPemasukan,
      sub: null,
      subColor: "#005836",
      iconBg: "#eef6f2",
      icon: <TrendingUp size={16} color="#009162" />,
      badge: { value: `${pctPemasukan}%`, bg: "#eef6f2", color: "#005836" },
      badgeLabel: "dari Total Nilai Proyek",
    },
    {
      id: "total-pengeluaran",
      label: "Total Pengeluaran",
      nominal: totalPengeluaran,
      sub: null,
      subColor: "#902f33",
      iconBg: "#fdf3f2",
      icon: <TrendingDown size={16} color="#902f33" />,
      badge: { value: `${pctPengeluaran}%`, bg: "#fdf3f2", color: "#902f33" },
      badgeLabel: "dari Total Nilai Proyek",
    },
    {
      id: "selisih-bersih",
      label: "Selisih Bersih",
      nominal: selisihBersih,
      sub: null,
      subColor: "#005836",
      iconBg: "#fcf7f0",
      icon: <BarChart2 size={16} color="#894c06" />,
      badge: { value: selisihBersih >= 0 ? "Surplus" : "Defisit", bg: "#eef6f2", color: "#005836" },
      badgeLabel: null,
      isSelisih: true,
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#f6f4ef]">
      <div className="p-8 flex flex-col gap-6">

        <div>
          <h1 className="text-[24px] font-bold text-[#1c1917] leading-[30px]">
            Beranda Eksekutif
          </h1>
          <p className="text-[14px] text-[#79716b] mt-1">
            Ringkasan real-time arus kas dan nilai proyek per {dateLabel}.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className="bg-white rounded-2xl border border-[#e4e0d9] p-6 flex flex-col gap-[18px] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#14130f] font-normal">{card.label}</span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  {card.icon}
                </div>
              </div>

              <CompactNominal
                value={card.nominal}
                compactThreshold={1_000_000_000_000}
                className={`text-[18px] font-bold  ${
                  card.isSelisih
                    ? selisihBersih >= 0
                      ? "text-[#005836]"
                      : "text-[#902f33]"
                    : "text-[#000000]"
                }`}
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                {card.badge && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-[3px] rounded-lg"
                    style={{ background: card.badge.bg, color: card.badge.color }}
                  >
                    {card.badge.value}
                  </span>
                )}
                {card.badgeLabel && (
                  <span className="text-[12px] text-[#9a948b]">{card.badgeLabel}</span>
                )}
                {card.sub && !card.badge && (
                  <span className="text-[12px]" style={{ color: card.subColor }}>
                    {card.sub}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-stretch">
          <CashFlowChart data={cashFlow} />

          <div className="flex flex-col gap-4 shrink-0">
            <SummaryCard
              title="Ringkasan Pengajuan"
              subtitle="Pengajuan reimbursement & realisasi dari semua proyek"
              items={[
                {
                  label: "Menunggu Persetujuan",
                  count: `${pengajuanSummary?.menunggu.count ?? 0} pengajuan`,
                  nominal: pengajuanSummary?.menunggu.nominal ?? 0,
                  color: "amber",
                },
                {
                  label: "Disetujui",
                  count: `${pengajuanSummary?.disetujui.count ?? 0} pengajuan`,
                  nominal: pengajuanSummary?.disetujui.nominal ?? 0,
                  color: "green",
                },
              ]}
            />
            <SummaryCard
              title="Ringkasan Termin"
              subtitle="Progres pencairan termin dari semua proyek"
              items={[
                {
                  label: "Belum Dicairkan",
                  count: `${terminSummary?.belumDicairkan.count ?? 0} termin`,
                  nominal: terminSummary?.belumDicairkan.nominal ?? 0,
                  color: "amber",
                },
                {
                  label: "Dicairkan",
                  count: `${terminSummary?.dicairkan.count ?? 0} termin`,
                  nominal: terminSummary?.dicairkan.nominal ?? 0,
                  color: "green",
                },
              ]}
            />
          </div>
        </div>

        <div
          className="bg-white rounded-2xl border-[0.8px] border-[#e7e5e4]"
          style={{ boxShadow: "0px 1px 2px -1px rgba(0,0,0,0.10), 0px 1px 3px 0px rgba(0,0,0,0.10)" }}
        >
          <div className="flex items-center justify-between px-6 py-6 border-b border-[#f5f5f4]">
            <h2 className="text-[15px] font-bold text-[#1c1917] leading-[22.5px]">
              Proyek Aktif
            </h2>
            <Link
              href="/manager/proyek"
              className="flex items-center gap-1 text-[12px] font-bold text-[#57534d] hover:text-[#1c1917] transition"
            >
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f5f5f4]">
                  {["PROYEK", "KLIEN", "STATUS", "NILAI PROYEK", "REALISASI", "SISA", "UTILISASI"].map(
                    (col, i) => (
                      <th
                        key={col}
                        className="text-[11px] font-bold text-[#a6a09b] uppercase tracking-[0.28px] py-[10px]"
                        style={{
                          textAlign: i < 2 ? "left" : i === 2 ? "left" : i === 6 ? "left" : "right",
                          paddingLeft: i === 0 ? 24 : 16,
                          paddingRight: i === 6 ? 24 : 16,
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {projectList.slice(0, 6).map((p) => {
                  const barColor =
                    p.realisasiPct <= 30
                      ? "#2d6a4f"
                      : p.realisasiPct <= 70
                      ? "#c9a227"
                      : "#c0392b";
                  const statusUpper = p.status?.toUpperCase();
                  const statusBadge =
                    statusUpper === "ACTIVE" || statusUpper === "AKTIF"
                      ? { label: "Active", bg: "#d8f3dc", color: "#1b4332" }
                      : statusUpper === "PLANNING"
                      ? { label: "Planning", bg: "#f5ebd7", color: "#935a16" }
                      : statusUpper === "DONE"
                      ? { label: "Done", bg: "#e0f2fe", color: "#0369a1" }
                      : { label: p.status, bg: "#f5f5f4", color: "#79716b" };
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#f9f8f5] transition-colors border-b border-[#f5f5f4] last:border-0"
                    >
                    <td className="pl-6 pr-4 py-4">
                        <p className="text-[13px] font-bold text-[#1c1917] leading-[16.25px]">
                          {p.proyekNama}
                        </p>
                        <p className="text-[11px] text-[#a6a09b] font-medium mt-0.5">
                          {p.kode} · {formatTanggal(p.tanggalMulai)}
                          {p.tanggalSelesai && ` – ${formatTanggal(p.tanggalSelesai)}`}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[12px] text-[#79716b] font-medium">
                        {p.klien}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: statusBadge.bg, color: statusBadge.color }}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-[12px] font-semibold text-[#44403b] ">
                        <CompactNominal value={p.rabTotal} compactThreshold={1_000_000_000_000} />
                      </td>
                      <td className="px-4 py-4 text-right text-[12px] font-semibold text-[#44403b] ">
                        <CompactNominal value={p.realisasi} compactThreshold={1_000_000_000_000} />
                      </td>
                      <td className="px-4 py-4 text-right text-[12px] font-semibold text-[#44403b] ">
                        <CompactNominal value={p.sisaBudget} compactThreshold={1_000_000_000_000} />
                      </td>
                      <td className="pl-4 pr-6 py-4 w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-[6px] bg-[#f5f5f4] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(p.realisasiPct, 100)}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-[#79716b]  w-8 text-right shrink-0">
                            {p.realisasiPct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {projectList.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <Wallet size={20} className="text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-stone-500">Belum ada proyek aktif</p>
                <p className="text-xs text-stone-400 mt-1">Proyek akan muncul di sini setelah dibuat.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}