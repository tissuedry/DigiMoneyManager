"use client";

import React, { useState, useEffect } from "react";
import { FileText, TrendingUp, BarChart3, Star, Download, Loader2, CheckCircle2 } from "lucide-react";

type ReportCard = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
};

const REPORTS: ReportCard[] = [
  {
    id: "executive-summary",
    title: "Executive Summary Bulanan",
    desc: "Snapshot bisnis untuk meeting BOD bulanan.",
    icon: <FileText size={20} className="text-stone-600" />,
    iconBg: "bg-stone-100",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    desc: "Arus kas masuk-keluar 12 minggu terakhir.",
    icon: <TrendingUp size={20} className="text-blue-600" />,
    iconBg: "bg-blue-50",
  },
  {
    id: "profitability",
    title: "Profitability Analysis",
    desc: "Margin per proyek + rekomendasi AI.",
    icon: <BarChart3 size={20} className="text-emerald-600" />,
    iconBg: "bg-emerald-50",
  },
  {
    id: "reimbursement-report",
    title: "Laporan Reimbursement",
    desc: "Ringkasan pengajuan, persetujuan, dan pencairan.",
    icon: <Star size={20} className="text-amber-600" />,
    iconBg: "bg-amber-50",
  },
];

export default function LaporanPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reimbursements, setReimbursements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((res) => res.json()),
      fetch("/api/reimbursements").then((res) => res.json()),
    ])
      .then(([dash, reimb]) => {
        if (dash.dashboard) setDashboardData(dash.dashboard);
        if (reimb.reimbursements) setReimbursements(reimb.reimbursements);
      })
      .catch((err) => console.error("Error fetching report data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGenerate = async (id: string) => {
    if (generating) return;
    setGenerating(id);

    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1500));

    setGenerating(null);
    setGenerated((prev) => new Set([...prev, id]));

    // Build simple report content for text download
    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const report = REPORTS.find((r) => r.id === id);
    const content = `Digi Money Manager\n${report?.title}\nDigenerate pada: ${now}\n\nData laporan dari database tersedia di dashboard real-time.\nGunakan fitur Smart Chat untuk analisis lebih mendalam.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (id: string) => {
    const report = REPORTS.find((r) => r.id === id);
    if (!report) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Gagal membuka jendela pratinjau. Izinkan pop-up untuk mencetak laporan.");
      return;
    }

    const nowStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let reportTitle = report.title;
    let contentHtml = "";

    const metrics = dashboardData?.metrics || {};
    const projectList = dashboardData?.projectList || [];
    const cashFlow = dashboardData?.cashFlow || [];

    if (id === "executive-summary") {
      const activeProjectsCount = metrics.activeProjectCount || 0;
      const totalRAB = metrics.totalRABAllocated || 0;
      const totalDisbursed = metrics.totalDisbursed || 0;
      const margin = metrics.marginBersih || 0;

      const projectRows = projectList.map((p: any) => `
        <tr class="border-b border-slate-200 text-slate-700 text-xs">
          <td class="py-2.5 px-4 font-mono">${p.kode}</td>
          <td class="py-2.5 px-4 font-semibold">${p.proyekNama}</td>
          <td class="py-2.5 px-4 text-slate-500">${p.klien}</td>
          <td class="py-2.5 px-4 text-center">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}">${p.status}</span>
          </td>
          <td class="py-2.5 px-4 text-right font-mono">Rp ${p.rabTotal.toLocaleString('id-ID')}</td>
          <td class="py-2.5 px-4 text-right font-mono text-red-700">Rp ${p.realisasi.toLocaleString('id-ID')}</td>
          <td class="py-2.5 px-4 text-right font-mono text-emerald-800">Rp ${p.sisaBudget.toLocaleString('id-ID')}</td>
          <td class="py-2.5 px-4 text-right font-mono font-bold">${p.margin}%</td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-[#2d6a4f] pl-2.5">Ringkasan KPI Eksekutif</h3>
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">PROYEK AKTIF</span>
              <span class="text-base font-extrabold text-slate-800 mt-1 block">${activeProjectsCount} Proyek</span>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">TOTAL RAB ALLOCATED</span>
              <span class="text-base font-extrabold text-slate-800 font-mono mt-1 block">Rp ${totalRAB.toLocaleString('id-ID')}</span>
            </div>
            <div class="bg-[#fdf3f3] border border-[#fadaD9] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-red-500 block uppercase">TOTAL REALISASI</span>
              <span class="text-base font-extrabold text-red-700 font-mono mt-1 block">Rp ${totalDisbursed.toLocaleString('id-ID')}</span>
            </div>
            <div class="bg-[#edf8f4] border border-[#d1efe4] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-emerald-600 block uppercase">MARGIN BERSIH</span>
              <span class="text-base font-extrabold text-emerald-800 font-mono mt-1 block">${margin}%</span>
            </div>
          </div>
        </div>

        <div class="mb-8 page-break">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-[#2d6a4f] pl-2.5">Daftar Realisasi Anggaran Proyek</h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">KODE</th>
                <th class="py-3 px-4">NAMA PROYEK</th>
                <th class="py-3 px-4">PM / KLIEN</th>
                <th class="py-3 px-4 text-center">STATUS</th>
                <th class="py-3 px-4 text-right">RAB TOTAL</th>
                <th class="py-3 px-4 text-right">REALISASI</th>
                <th class="py-3 px-4 text-right">SISA BUDGET</th>
                <th class="py-3 px-4 text-right">MARGIN</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows.length > 0 ? projectRows : '<tr><td colspan="8" class="py-6 text-center text-slate-400 text-xs font-semibold">Tidak ada proyek aktif</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="bg-[#fcfbf9] border border-stone-200 rounded-2xl p-5 mb-8">
          <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Rekomendasi Strategis AI</h4>
          <p class="text-xs text-slate-600 leading-relaxed">
            Berdasarkan margin rata-rata sebesar <strong>${margin}%</strong>, kondisi keuangan proyek dinilai stabil. Disarankan untuk memantau pengeluaran pos logistik pada proyek-proyek dengan sisa budget di bawah 15% untuk mencegah over-budget. Smart Chat dapat digunakan untuk simulasi efisiensi lebih lanjut.
          </p>
        </div>
      `;
    } else if (id === "cash-flow") {
      const outflowTotal = cashFlow.reduce((sum: number, f: any) => sum + f.outflow, 0);
      const inflowTotal = cashFlow.reduce((sum: number, f: any) => sum + f.inflow, 0);
      const netCash = inflowTotal - outflowTotal;

      const flowRows = cashFlow.map((cf: any) => `
        <tr class="border-b border-slate-200 text-slate-700 text-xs">
          <td class="py-3 px-4 font-semibold">${cf.bulan}</td>
          <td class="py-3 px-4 text-right font-mono text-blue-700">Rp ${cf.inflow.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-right font-mono text-red-700">Rp ${cf.outflow.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-right font-mono font-bold ${cf.inflow - cf.outflow >= 0 ? 'text-emerald-800' : 'text-rose-700'}">
            Rp ${(cf.inflow - cf.outflow).toLocaleString('id-ID')}
          </td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-blue-600 pl-2.5">Arus Kas Ringkasan (YTD)</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-[#edf8f4] border border-[#d1efe4] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-[#2d6a4f] block uppercase">TOTAL INFLOW (ESTIMASI)</span>
              <span class="text-lg font-extrabold text-[#2d6a4f] font-mono mt-1 block">Rp ${inflowTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="bg-[#fdf3f3] border border-[#fadaD9] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-red-500 block uppercase">TOTAL OUTFLOW (REALISASI)</span>
              <span class="text-lg font-extrabold text-red-700 font-mono mt-1 block">Rp ${outflowTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-blue-600 block uppercase">NET CASH FLOW</span>
              <span class="text-lg font-extrabold text-blue-800 font-mono mt-1 block">Rp ${netCash.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-blue-600 pl-2.5">Aliran Kas Bulanan</h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">PERIODE BULAN</th>
                <th class="py-3 px-4 text-right">CASH INFLOW</th>
                <th class="py-3 px-4 text-right">CASH OUTFLOW</th>
                <th class="py-3 px-4 text-right">NET CASH FLOW</th>
              </tr>
            </thead>
            <tbody>
              ${flowRows.length > 0 ? flowRows : '<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs font-semibold">Tidak ada data arus kas</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } else if (id === "profitability") {
      const avgMargin = metrics.avgMargin || 0;
      const totalPotensi = metrics.remainingBudgets || 0;

      let bestProject = "N/A";
      let maxMargin = -999;
      projectList.forEach((p: any) => {
        if (p.margin > maxMargin) {
          maxMargin = p.margin;
          bestProject = p.proyekNama;
        }
      });

      const profitRows = projectList.map((p: any) => `
        <tr class="border-b border-slate-200 text-slate-700 text-xs">
          <td class="py-3 px-4 font-semibold">${p.proyekNama}</td>
          <td class="py-3 px-4 text-slate-500 font-mono">${p.kode}</td>
          <td class="py-3 px-4 text-right font-mono">Rp ${p.rabTotal.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-right font-mono text-red-700">Rp ${p.realisasi.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-right font-mono text-emerald-800">Rp ${p.sisaBudget.toLocaleString('id-ID')}</td>
          <td class="py-3 px-4 text-right font-mono font-bold ${p.margin >= 25 ? 'text-emerald-700' : p.margin >= 10 ? 'text-blue-700' : 'text-amber-600'}">
            ${p.margin}%
          </td>
        </tr>
      `).join('');

      contentHtml = `
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-emerald-600 pl-2.5">Analisis Profitabilitas Ringkasan</h3>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-emerald-600 block uppercase">RATA-RATA MARGIN</span>
              <span class="text-lg font-extrabold text-emerald-800 mt-1 block">${avgMargin}%</span>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">PROYEK TERBAIK</span>
              <span class="text-xs font-bold text-slate-800 mt-2 block truncate">${bestProject} (${maxMargin}%)</span>
            </div>
            <div class="bg-[#edf8f4] border border-[#d1efe4] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-emerald-600 block uppercase">POTENSI MARGIN SISA</span>
              <span class="text-lg font-extrabold text-emerald-800 font-mono mt-1 block">Rp ${totalPotensi.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-emerald-600 pl-2.5">Margin Keuntungan Proyek</h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">NAMA PROYEK</th>
                <th class="py-3 px-4">KODE</th>
                <th class="py-3 px-4 text-right">ANGGARAN RAB</th>
                <th class="py-3 px-4 text-right">PENGELUARAN</th>
                <th class="py-3 px-4 text-right">SISA BUDGET</th>
                <th class="py-3 px-4 text-right">MARGIN BERSIH</th>
              </tr>
            </thead>
            <tbody>
              ${profitRows.length > 0 ? profitRows : '<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs font-semibold">Tidak ada data profitabilitas</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } else if (id === "reimbursement-report") {
      const totalCount = reimbursements.length;
      const approvedCount = reimbursements.filter(r => r.status === 'APPROVED').length;
      const approvedNominal = reimbursements.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.nominal), 0);
      const pendingCount = reimbursements.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED_BY_PM').length;

      const reimbRows = reimbursements.map((r: any) => {
        let displayStatus = r.status;
        if (r.status === 'SUBMITTED') displayStatus = 'Menunggu PM';
        else if (r.status === 'APPROVED_BY_PM') displayStatus = 'Verifikasi Keuangan';
        else if (r.status === 'APPROVED') displayStatus = 'Dicairkan';
        else if (r.status === 'REJECTED') displayStatus = 'Ditolak';

        return `
          <tr class="border-b border-slate-200 text-slate-700 text-[11px]">
            <td class="py-2.5 px-4 font-mono">RB-${r.id}</td>
            <td class="py-2.5 px-4 font-semibold">${r.user?.nama || 'Karyawan'}</td>
            <td class="py-2.5 px-4">${r.ocrData?.merchant || 'N/A'}</td>
            <td class="py-2.5 px-4 text-slate-500">${r.proyek?.nama || 'Umum'}</td>
            <td class="py-2.5 px-4"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">${r.posAnggaran?.namaPos || r.posAnggaran?.deskripsi || 'N/A'}</span></td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">Rp ${Number(r.nominal).toLocaleString('id-ID')}</td>
            <td class="py-2.5 px-4 text-center">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold ${
                r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                r.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                'bg-amber-50 text-amber-700'
              }">${displayStatus}</span>
            </td>
          </tr>
        `;
      }).join('');

      contentHtml = `
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-amber-600 pl-2.5">Ringkasan Operasional Reimbursement</h3>
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-slate-400 block uppercase">TOTAL PENGAJUAN</span>
              <span class="text-lg font-extrabold text-slate-800 mt-1 block">${totalCount} Pengajuan</span>
            </div>
            <div class="bg-[#edf8f4] border border-[#d1efe4] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-emerald-600 block uppercase">NOMINAL DICAIRKAN</span>
              <span class="text-lg font-extrabold text-emerald-800 font-mono mt-1 block">Rp ${approvedNominal.toLocaleString('id-ID')}</span>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-blue-600 block uppercase">DICAIRKAN (COUNT)</span>
              <span class="text-lg font-extrabold text-blue-800 mt-1 block">${approvedCount} Transaksi</span>
            </div>
            <div class="bg-[#fdf3e6] border border-[#fcefd9] rounded-xl p-4 text-center">
              <span class="text-[9px] font-bold text-amber-600 block uppercase">MENUNGGU VERIFIKASI</span>
              <span class="text-lg font-extrabold text-amber-800 mt-1 block">${pendingCount} Antrian</span>
            </div>
          </div>
        </div>

        <div class="mb-8 page-break">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-amber-600 pl-2.5">Riwayat Pengajuan Reimbursement</h3>
          <table class="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[10px] tracking-wider uppercase">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">PENGAJU</th>
                <th class="py-3 px-4">MERCHANT</th>
                <th class="py-3 px-4">PROYEK</th>
                <th class="py-3 px-4">POS ANGGARAN</th>
                <th class="py-3 px-4 text-right">NOMINAL</th>
                <th class="py-3 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${reimbRows.length > 0 ? reimbRows : '<tr><td colspan="7" class="py-6 text-center text-slate-400 text-xs font-semibold">Tidak ada pengajuan</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan - ${reportTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #ffffff;
          }
          @media print {
            body {
              background-color: #ffffff;
            }
            .no-print {
              display: none;
            }
            @page {
              margin: 1.5cm;
            }
          }
        </style>
      </head>
      <body class="p-6 md:p-12 max-w-5xl mx-auto">
        <!-- Floating Print Action for preview mode -->
        <div class="no-print mb-8 flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div class="space-y-0.5">
            <h4 class="font-bold text-slate-800 text-sm">Pratinjau Laporan Keuangan</h4>
            <p class="text-xs text-slate-500">Gunakan dialog cetak browser untuk menyimpannya sebagai file PDF.</p>
          </div>
          <button 
            onclick="window.print()" 
            class="px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
          >
            Cetak / Simpan PDF
          </button>
        </div>

        <!-- Document Header -->
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 class="text-2xl font-extrabold text-[#2d6a4f] tracking-tight">DIGI MONEY MANAGER</h1>
            <p class="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1">Platform Manajemen Finansial Proyek</p>
          </div>
          <div class="text-right">
            <h2 class="text-lg font-bold text-slate-800 uppercase tracking-wide">${reportTitle}</h2>
            <p class="text-xs text-slate-400 mt-1 font-mono">${nowStr}</p>
          </div>
        </div>

        <!-- Meta Info -->
        <div class="grid grid-cols-2 gap-6 bg-[#F9F8F4] border border-[#EBE9E1] rounded-2xl p-6 mb-8">
          <div class="space-y-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DIPERSIAPKAN UNTUK</span>
              <span class="text-base font-bold text-slate-800">Direksi & Manajemen Internal</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">JENIS LAPORAN</span>
              <span class="text-xs font-mono font-bold text-slate-500">${reportTitle}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS DATA</span>
              <span class="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Real-time Terverifikasi</span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WAKTU GENERASI</span>
              <span class="text-xs font-semibold text-slate-600">${nowStr}</span>
            </div>
          </div>
        </div>

        <!-- Custom Content -->
        ${contentHtml}

        <!-- Footer / Signature -->
        <div class="mt-16 pt-12 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
          <div>
            <p>© ${new Date().getFullYear()} Digi Money Manager. Semua Hak Cipta Dilindungi.</p>
          </div>
          <div class="text-right">
            <p>Digenerate oleh Sistem,</p>
            <div class="h-12"></div>
            <p class="font-bold text-slate-700">Manajemen Eksekutif</p>
            <p>Direktur Utama</p>
          </div>
        </div>

        <!-- Auto trigger print dialog -->
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadExcel = (id: string) => {
    const report = REPORTS.find((r) => r.id === id);
    if (!report) return;

    const now = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const metrics = dashboardData?.metrics || {};
    const projectList = dashboardData?.projectList || [];
    const cashFlow = dashboardData?.cashFlow || [];

    let tableHtml = "";

    if (id === "executive-summary") {
      const activeProjectsCount = metrics.activeProjectCount || 0;
      const totalRAB = metrics.totalRABAllocated || 0;
      const totalDisbursed = metrics.totalDisbursed || 0;
      const margin = metrics.marginBersih || 0;

      tableHtml = `
        <tr style="height: 30px;"><td colspan="8" style="font-size: 16px; font-weight: bold; color: #2d6a4f;">DIGI MONEY MANAGER</td></tr>
        <tr style="height: 24px;"><td colspan="8" style="font-size: 14px; font-weight: bold; color: #333333;">${report.title.toUpperCase()}</td></tr>
        <tr><td colspan="8" style="font-size: 11px; color: #666666;">Digenerate pada: ${now}</td></tr>
        <tr style="height: 20px;"><td colspan="8"></td></tr>
        
        <tr style="font-weight: bold; background-color: #e5e7eb;">
          <td colspan="4" style="border: 1px solid #d1d5db; padding: 6px;">METRIK KPI</td>
          <td colspan="4" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">NILAI</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px;">Proyek Aktif</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${activeProjectsCount} Proyek</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px;">Total RAB Dialokasikan</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${totalRAB}</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px;">Total Realisasi Pengeluaran</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #dc2626;">${totalDisbursed}</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px;">Margin Bersih Rata-rata</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #16a34a;">${margin}%</td>
        </tr>
        <tr style="height: 20px;"><td colspan="8"></td></tr>

        <tr style="font-weight: bold; color: #2d6a4f;"><td colspan="8" style="font-size: 13px;">DAFTAR REALISASI ANGGARAN PROYEK</td></tr>
        <tr style="background-color: #2d6a4f; color: #ffffff; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #2d6a4f; padding: 6px;">KODE</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: left;">NAMA PROYEK</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: left;">PM / KLIEN</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px;">STATUS</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: right;">RAB TOTAL</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: right;">REALISASI</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: right;">SISA BUDGET</td>
          <td style="border: 1px solid #2d6a4f; padding: 6px; text-align: right;">MARGIN</td>
        </tr>
        ${projectList.map((p: any) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-family: monospace;">${p.kode}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold;">${p.proyekNama}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; color: #4b5563;">${p.klien}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center;">${p.status}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right;">${p.rabTotal}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #b91c1c;">${p.realisasi}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #15803d;">${p.sisaBudget}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${p.margin}%</td>
          </tr>
        `).join('')}
      `;
    } else if (id === "cash-flow") {
      const outflowTotal = cashFlow.reduce((sum: number, f: any) => sum + f.outflow, 0);
      const inflowTotal = cashFlow.reduce((sum: number, f: any) => sum + f.inflow, 0);
      const netCash = inflowTotal - outflowTotal;

      tableHtml = `
        <tr style="height: 30px;"><td colspan="4" style="font-size: 16px; font-weight: bold; color: #2563eb;">DIGI MONEY MANAGER</td></tr>
        <tr style="height: 24px;"><td colspan="4" style="font-size: 14px; font-weight: bold; color: #333333;">${report.title.toUpperCase()}</td></tr>
        <tr><td colspan="4" style="font-size: 11px; color: #666666;">Digenerate pada: ${now}</td></tr>
        <tr style="height: 20px;"><td colspan="4"></td></tr>

        <tr style="font-weight: bold; background-color: #e5e7eb;">
          <td colspan="2" style="border: 1px solid #d1d5db; padding: 6px;">METRIK CASH FLOW</td>
          <td colspan="2" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">NILAI</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px;">Total Inflow (Estimasi)</td>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #15803d;">${inflowTotal}</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px;">Total Outflow (Realisasi)</td>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #b91c1c;">${outflowTotal}</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px;">Net Cash Flow</td>
          <td colspan="2" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #1e40af;">${netCash}</td>
        </tr>
        <tr style="height: 20px;"><td colspan="4"></td></tr>

        <tr style="font-weight: bold; color: #2563eb;"><td colspan="4" style="font-size: 13px;">ALIRAN KAS BULANAN (12 MINGGU TERAKHIR)</td></tr>
        <tr style="background-color: #2563eb; color: #ffffff; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #2563eb; padding: 6px; text-align: left;">PERIODE BULAN</td>
          <td style="border: 1px solid #2563eb; padding: 6px; text-align: right;">CASH INFLOW</td>
          <td style="border: 1px solid #2563eb; padding: 6px; text-align: right;">CASH OUTFLOW</td>
          <td style="border: 1px solid #2563eb; padding: 6px; text-align: right;">NET CASH FLOW</td>
        </tr>
        ${cashFlow.map((cf: any) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold;">${cf.bulan}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #15803d;">${cf.inflow}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #b91c1c;">${cf.outflow}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: ${cf.inflow - cf.outflow >= 0 ? '#15803d' : '#b91c1c'}">${cf.inflow - cf.outflow}</td>
          </tr>
        `).join('')}
      `;
    } else if (id === "profitability") {
      const avgMargin = metrics.avgMargin || 0;
      const totalPotensi = metrics.remainingBudgets || 0;

      tableHtml = `
        <tr style="height: 30px;"><td colspan="6" style="font-size: 16px; font-weight: bold; color: #059669;">DIGI MONEY MANAGER</td></tr>
        <tr style="height: 24px;"><td colspan="6" style="font-size: 14px; font-weight: bold; color: #333333;">${report.title.toUpperCase()}</td></tr>
        <tr><td colspan="6" style="font-size: 11px; color: #666666;">Digenerate pada: ${now}</td></tr>
        <tr style="height: 20px;"><td colspan="6"></td></tr>

        <tr style="font-weight: bold; background-color: #e5e7eb;">
          <td colspan="3" style="border: 1px solid #d1d5db; padding: 6px;">METRIK PROFITABILITAS</td>
          <td colspan="3" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">NILAI</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Rata-rata Margin Proyek</td>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #059669;">${avgMargin}%</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Potensi Margin Sisa</td>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${totalPotensi}</td>
        </tr>
        <tr style="height: 20px;"><td colspan="6"></td></tr>

        <tr style="font-weight: bold; color: #059669;"><td colspan="6" style="font-size: 13px;">MARGIN KEUNTUNGAN DAN REALISASI BUDGET</td></tr>
        <tr style="background-color: #059669; color: #ffffff; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #059669; padding: 6px; text-align: left;">NAMA PROYEK</td>
          <td style="border: 1px solid #059669; padding: 6px;">KODE</td>
          <td style="border: 1px solid #059669; padding: 6px; text-align: right;">ANGGARAN RAB</td>
          <td style="border: 1px solid #059669; padding: 6px; text-align: right;">PENGELUARAN</td>
          <td style="border: 1px solid #059669; padding: 6px; text-align: right;">SISA BUDGET</td>
          <td style="border: 1px solid #059669; padding: 6px; text-align: right;">MARGIN BERSIH</td>
        </tr>
        ${projectList.map((p: any) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold;">${p.proyekNama}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-family: monospace;">${p.kode}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right;">${p.rabTotal}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #b91c1c;">${p.realisasi}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; color: #15803d;">${p.sisaBudget}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: ${p.margin >= 20 ? '#15803d' : p.margin >= 12 ? '#d97706' : '#b91c1c'}">${p.margin}%</td>
          </tr>
        `).join('')}
      `;
    } else if (id === "reimbursement-report") {
      const totalCount = reimbursements.length;
      const approvedCount = reimbursements.filter(r => r.status === 'APPROVED').length;
      const approvedNominal = reimbursements.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.nominal), 0);
      const pendingCount = reimbursements.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED_BY_PM').length;

      tableHtml = `
        <tr style="height: 30px;"><td colspan="7" style="font-size: 16px; font-weight: bold; color: #d97706;">DIGI MONEY MANAGER</td></tr>
        <tr style="height: 24px;"><td colspan="7" style="font-size: 14px; font-weight: bold; color: #333333;">${report.title.toUpperCase()}</td></tr>
        <tr><td colspan="7" style="font-size: 11px; color: #666666;">Digenerate pada: ${now}</td></tr>
        <tr style="height: 20px;"><td colspan="7"></td></tr>

        <tr style="font-weight: bold; background-color: #e5e7eb;">
          <td colspan="3" style="border: 1px solid #d1d5db; padding: 6px;">METRIK REIMBURSEMENT</td>
          <td colspan="4" style="border: 1px solid #d1d5db; padding: 6px; text-align: right;">NILAI</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Total Pengajuan</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${totalCount} Pengajuan</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Total Nominal Dicairkan (Approved)</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #15803d;">${approvedNominal}</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Jumlah Transaksi Dicairkan</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${approvedCount} Transaksi</td>
        </tr>
        <tr>
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 6px;">Menunggu Verifikasi (Pending Antrean)</td>
          <td colspan="4" style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold; color: #d97706;">${pendingCount} Pengajuan</td>
        </tr>
        <tr style="height: 20px;"><td colspan="7"></td></tr>

        <tr style="font-weight: bold; color: #d97706;"><td colspan="7" style="font-size: 13px;">RIWAYAT PENGAJUAN REIMBURSEMENT KARYAWAN</td></tr>
        <tr style="background-color: #d97706; color: #ffffff; font-weight: bold; text-align: center;">
          <td style="border: 1px solid #d97706; padding: 6px;">ID</td>
          <td style="border: 1px solid #d97706; padding: 6px; text-align: left;">PENGAJU</td>
          <td style="border: 1px solid #d97706; padding: 6px; text-align: left;">MERCHANT</td>
          <td style="border: 1px solid #d97706; padding: 6px; text-align: left;">PROYEK</td>
          <td style="border: 1px solid #d97706; padding: 6px; text-align: left;">POS ANGGARAN</td>
          <td style="border: 1px solid #d97706; padding: 6px; text-align: right;">NOMINAL</td>
          <td style="border: 1px solid #d97706; padding: 6px;">STATUS</td>
        </tr>
        ${reimbursements.map((r: any) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-family: monospace;">RB-${r.id}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: bold;">${r.user?.nama || 'Karyawan'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px;">${r.ocrData?.merchant || 'N/A'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; color: #4b5563;">${r.proyek?.nama || 'Umum'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px;">${r.posAnggaran?.namaPos || r.posAnggaran?.deskripsi || 'N/A'}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: bold;">${Number(r.nominal)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center;">${r.status}</td>
          </tr>
        `).join('')}
      `;
    }

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
      <!--[if gte mso 9]>
      <xml>
       <x:Workbook>
        <x:Worksheets>
         <x:Worksheet>
          <x:Name>${report.title.slice(0, 30)}</x:Name>
          <x:WorksheetOptions>
           <x:DisplayGridlines/>
          </x:WorksheetOptions>
         </x:Worksheet>
        </x:Worksheets>
       </x:Workbook>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; }
        td { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
      </style>
      </head>
      <body>
        <table>
          ${tableHtml}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 leading-tight">Laporan</h1>
        <p className="text-sm text-stone-500 mt-1">
          Generate dan unduh laporan keuangan untuk meeting atau evaluasi internal.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-[#2d6a4f]" size={32} />
          <p className="text-stone-500 text-[14px]">Memuat data laporan...</p>
        </div>
      ) : (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {REPORTS.map((report) => {
            const isGenerating = generating === report.id;
            const isDone = generated.has(report.id);

            return (
              <div
                key={report.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${report.iconBg}`}>
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-stone-900 leading-tight">{report.title}</h4>
                    <p className="text-[12px] text-stone-500 mt-1">{report.desc}</p>
                  </div>
                  {isDone && (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Download PDF */}
                  <button
                    onClick={() => handleDownloadPDF(report.id)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-[12px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <Download size={13} />
                    PDF
                  </button>

                  {/* Download Excel */}
                  <button
                    onClick={() => handleDownloadExcel(report.id)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-[12px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
                  >
                    <Download size={13} />
                    Excel
                  </button>

                  {/* Generate Button */}
                  <button
                    onClick={() => handleGenerate(report.id)}
                    disabled={!!generating}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-60 text-white text-[12px] font-bold rounded-lg transition cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Generating...
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle2 size={13} />
                        Generated ✓
                      </>
                    ) : (
                      "Generate →"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-[13px] text-stone-500">
        <p className="font-semibold text-stone-700 mb-1">Catatan</p>
        <p>
          Laporan digenerate berdasarkan data real-time dari database. Klik <strong>Generate</strong> untuk
          menyiapkan laporan, lalu unduh dalam format PDF atau Excel.
          Untuk analisis lebih mendalam, gunakan fitur{" "}
          <a href="/manager/smart-chat" className="text-[#2d6a4f] font-bold hover:underline">
            Smart Chat
          </a>.
        </p>
      </div>
    </main>
  );
}
