"use client";

import React, { useState } from "react";
import { FileText, TrendingUp, BarChart3, Star, Download, FileSpreadsheet, Sparkles, CheckCircle2 } from "lucide-react";

interface LaporanCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeBg: string;
  iconColor: string;
}

const LAPORAN_LIST: LaporanCard[] = [
  {
    id: "exec-summary",
    title: "Executive Summary Bulanan",
    description: "Snapshot bisnis untuk meeting BOD bulanan.",
    icon: <FileText size={22} />,
    badgeBg: "bg-stone-100",
    iconColor: "text-stone-700",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Arus kas masuk-keluar 12 minggu terakhir.",
    icon: <TrendingUp size={22} />,
    badgeBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "profitability",
    title: "Profitability Analysis",
    description: "Margin per proyek + rekomendasi AI.",
    icon: <BarChart3 size={22} />,
    badgeBg: "bg-emerald-50",
    iconColor: "text-[#008f5d]",
  },
  {
    id: "reimbursement",
    title: "Laporan Reimbursement",
    description: "Ringkasan pengajuan, persetujuan, dan pencairan.",
    icon: <Star size={22} />,
    badgeBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function LaporanPage() {
  const [generatedReports, setGeneratedReports] = useState<Record<string, boolean>>({});

  const handleGenerate = (id: string) => {
    setGeneratedReports((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setGeneratedReports((prev) => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleDownload = (format: "PDF" | "Excel", title: string) => {
    alert(`Mengunduh laporan "${title}" dalam format ${format}...`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto min-h-full flex flex-col bg-[#f9f8f4]">
      
      {/* Header Halaman */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-bold text-stone-900 leading-tight">Laporan</h1>
          <span className="px-2.5 py-0.5 bg-stone-200 text-stone-700 text-[11px] font-bold rounded-md">Direktur</span>
        </div>
        <p className="text-stone-500 mt-1 text-[14px]">
          Generate dan unduh laporan keuangan untuk meeting atau evaluasi internal.
        </p>
      </div>

      {/* Grid Kartu Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {LAPORAN_LIST.map((item) => {
          const isGenerating = generatedReports[item.id];

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition gap-6">
              
              {/* Bagian Atas: Icon, Judul, Deskripsi */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.badgeBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-inner`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-stone-900 leading-snug">{item.title}</h3>
                  <p className="text-[12px] text-stone-500 mt-1">{item.description}</p>
                </div>
              </div>

              {/* Bagian Bawah: Tombol PDF/Excel & Tombol Generate */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-stone-100">
                
                {/* Tombol Unduh PDF & Excel */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload("PDF", item.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-[12px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <Download size={13} /> PDF
                  </button>
                  <button 
                    onClick={() => handleDownload("Excel", item.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-[12px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                </div>

                {/* Tombol Generate */}
                <button 
                  onClick={() => handleGenerate(item.id)}
                  disabled={isGenerating}
                  className={`flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-bold transition shadow-xs cursor-pointer ${
                    isGenerating 
                      ? "bg-emerald-100 text-[#007a4f]" 
                      : "bg-[#008f5d] hover:bg-[#007a4f] text-white"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <CheckCircle2 size={14} className="animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      Generate <Sparkles size={13} />
                    </>
                  )}
                </button>

              </div>

            </div>
          );
        })}
      </div>

      {/* Catatan Bawah Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-1.5">
        <h4 className="text-[13px] font-bold text-stone-900">Catatan</h4>
        <p className="text-[12px] text-stone-500 leading-relaxed font-medium">
          Laporan di-generate berdasarkan data real-time dari database. Klik <b>Generate</b> untuk menyiapkan laporan, lalu unduh dalam format PDF atau Excel. Untuk analisis lebih mendalam, gunakan fitur <b>Smart Chat</b>.
        </p>
      </div>

    </div>
  );
}