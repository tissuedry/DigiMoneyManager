"use client";

import React, { useEffect, useState } from "react";
import { X, Download, BookOpen, AlertTriangle, Check, XCircle } from "lucide-react";

interface DetailRiwayatModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function DetailRiwayatModal({ isOpen, onClose, data }: DetailRiwayatModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsClosing(false);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Sesuaikan dengan durasi animasi exit
  };

  if (!isOpen && !isClosing) return null;

  // Render konfigurasi warna berdasarkan status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Menunggu PM":
        return {
          bgCard: "bg-[#fef6ee]", borderCard: "border-[#fed7aa]", textNominal: "text-[#9a3412]",
          badgeBg: "bg-[#ffedd5]", badgeText: "text-[#c2410c]"
        };
      case "Verifikasi Keuangan":
        return {
          bgCard: "bg-[#f0f9ff]", borderCard: "border-[#bae6fd]", textNominal: "text-[#0369a1]",
          badgeBg: "bg-[#e0f2fe]", badgeText: "text-[#0369a1]"
        };
      case "Dicairkan":
        return {
          bgCard: "bg-[#f0fdf4]", borderCard: "border-[#bbf7d0]", textNominal: "text-[#047857]",
          badgeBg: "bg-[#d1fae5]", badgeText: "text-[#047857]"
        };
      case "Ditolak":
        return {
          bgCard: "bg-[#fff1f2]", borderCard: "border-[#fecdd3]", textNominal: "text-[#be123c]",
          badgeBg: "bg-[#ffe4e6]", badgeText: "text-[#be123c]"
        };
      default:
        return {
          bgCard: "bg-stone-50", borderCard: "border-stone-200", textNominal: "text-stone-900",
          badgeBg: "bg-stone-100", badgeText: "text-stone-600"
        };
    }
  };

  const config = data ? getStatusConfig(data.status) : getStatusConfig("");

  // Logic render state timeline approval
  const renderTimelineIcon = (step: number, currentStatus: string) => {
    if (currentStatus === "Ditolak" && step === 2) return <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm"><XCircle size={14} /></div>;
    
    if (currentStatus === "Dicairkan") return <div className="w-6 h-6 rounded-full bg-[#008f5d] text-white flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={3} /></div>;
    
    if (currentStatus === "Verifikasi Keuangan") {
      if (step <= 2) return <div className="w-6 h-6 rounded-full bg-[#008f5d] text-white flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={3} /></div>;
      if (step === 3) return <div className="w-6 h-6 rounded-full bg-[#d97706] text-white flex items-center justify-center shrink-0 text-[11px] font-bold shadow-sm">3</div>;
    }
    
    if (currentStatus === "Menunggu PM") {
      if (step === 1) return <div className="w-6 h-6 rounded-full bg-[#008f5d] text-white flex items-center justify-center shrink-0 shadow-sm"><Check size={14} strokeWidth={3} /></div>;
      if (step === 2) return <div className="w-6 h-6 rounded-full bg-[#d97706] text-white flex items-center justify-center shrink-0 text-[11px] font-bold shadow-sm">2</div>;
    }

    return <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center shrink-0 text-[11px] font-bold">{step}</div>;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`} 
        onClick={handleClose}
      />

      {/* Right Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header Drawer */}
        <div className="px-8 pt-8 pb-6 border-b border-stone-100 shrink-0 relative">
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
          >
            <X size={20} />
          </button>
          <p className="text-[12px] font-mono text-stone-500 mb-1">{data?.id}</p>
          <h2 className="text-[24px] font-bold text-stone-900 leading-tight mb-1">{data?.nama}</h2>
          <p className="text-[13px] text-stone-500">{data?.proyek}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          
          {/* Card Status & Nominal */}
          <div className={`w-full p-6 border rounded-2xl mb-6 flex justify-between items-center ${config.bgCard} ${config.borderCard}`}>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">STATUS</p>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${config.badgeBg} ${config.badgeText}`}>
                {data?.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">NOMINAL</p>
              <p className={`text-[28px] font-bold tracking-tight ${config.textNominal}`}>
                {data?.nominal}
              </p>
            </div>
          </div>

          {/* Banner Alasan Penolakan (Jika Ditolak) */}
          {data?.status === "Ditolak" && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6">
              <div className="flex items-center gap-2 mb-1.5 text-rose-600">
                <AlertTriangle size={16} />
                <h3 className="text-[13px] font-bold">Alasan Penolakan</h3>
              </div>
              <p className="text-[13px] text-rose-700 ml-6 leading-relaxed">
                Pos konsumsi proyek ini sudah melebihi alokasi bulan ini. Silakan ajukan ulang bulan depan atau ubah sumber pos.
              </p>
            </div>
          )}

          {/* Detail Pengajuan */}
          <div className="mb-6">
            <h3 className="text-[13px] font-bold text-stone-900 mb-3">Detail Pengajuan</h3>
            <div className="space-y-3 bg-[#faf9f5] border border-stone-100 p-4 rounded-xl text-[12px]">
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Pos Anggaran / Keterangan</span>
                <span className="font-bold text-stone-800 text-right">{data?.keterangan}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Tanggal Transaksi</span>
                <span className="font-bold text-stone-800 text-right">{data?.tanggal}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span className="text-stone-500">Merchant</span>
                <span className="font-bold text-stone-800 text-right">{data?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Anti-Fraud</span>
                <span className="font-bold text-stone-800 text-right">Aman</span>
              </div>
            </div>
          </div>

          {/* Catatan Keterangan Tambahan */}
          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-stone-900 mb-2">Keterangan</h3>
            <div className="p-4 bg-stone-100/70 border border-stone-200/60 rounded-xl text-[12px] text-stone-700 italic">
              "Pembelian kebutuhan operasional site pertengahan bulan."
            </div>
          </div>

          {/* Riwayat Approval */}
          <div className="mb-8">
            <h3 className="text-[14px] font-bold text-stone-900 mb-5">Riwayat Approval</h3>
            <div className="flex flex-col relative pl-1">
              
              <div className="flex gap-4 relative pb-6">
                <div className={`absolute left-3 top-6 bottom-0 w-[2px] ${(data?.status === "Menunggu PM") ? "bg-stone-200" : "bg-[#008f5d]"}`} />
                <div className="relative z-10 shrink-0 mt-0.5">
                  {renderTimelineIcon(1, data?.status)}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-stone-900 leading-none">Pengajuan dikirim</p>
                  <p className="text-[11px] text-stone-500 mt-1">Alif Ihsan • {data?.tanggal}, 13:32</p>
                </div>
              </div>

              <div className="flex gap-4 relative pb-6">
                <div className={`absolute left-3 top-6 bottom-0 w-[2px] ${(data?.status === "Dicairkan" || data?.status === "Verifikasi Keuangan") ? "bg-[#008f5d]" : "bg-stone-200"}`} />
                <div className="relative z-10 shrink-0 mt-0.5">
                  {renderTimelineIcon(2, data?.status)}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-stone-900 leading-none">Validasi Project Manager</p>
                  <p className="text-[11px] text-stone-500 mt-1">Muhammad Alvin Ababil • {data?.status === "Menunggu PM" ? "Menunggu" : "Selesai"}</p>
                </div>
              </div>

              <div className="flex gap-4 relative pb-6">
                <div className={`absolute left-3 top-6 bottom-0 w-[2px] ${data?.status === "Dicairkan" ? "bg-[#008f5d]" : "bg-stone-200"}`} />
                <div className="relative z-10 shrink-0 mt-0.5">
                  {renderTimelineIcon(3, data?.status)}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-stone-900 leading-none">Verifikasi Tim Keuangan</p>
                  <p className="text-[11px] text-stone-500 mt-1">{data?.status === "Dicairkan" ? "Selesai" : "Menunggu • -"}</p>
                </div>
              </div>

              <div className="flex gap-4 relative">
                <div className="relative z-10 shrink-0 mt-0.5">
                  {renderTimelineIcon(4, data?.status)}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] font-bold text-stone-900 leading-none">Dicairkan</p>
                  <p className="text-[11px] text-stone-500 mt-1">Jurnal otomatis • -</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="grid grid-cols-2 gap-4 pb-6">
            <div>
              <h3 className="text-[11px] font-bold text-stone-900 mb-2">Bukti Struk</h3>
              <div className="w-full h-24 bg-stone-200 rounded-xl overflow-hidden border border-stone-300 relative group cursor-pointer">
                {/* Mock Image Representation */}
                <div className="w-full h-full bg-stone-300 flex items-center justify-center p-2 text-[8px] text-stone-500 text-center">
                  [Gambar Struk]
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-[10px] font-bold">Lihat Penuh</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-[11px] font-bold text-stone-900 mb-2">Jurnal Akuntansi</h3>
              <div className="w-full h-24 bg-stone-50 border border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center p-4">
                {data?.status === "Dicairkan" ? (
                  <>
                    <BookOpen size={20} className="text-[#0277bd] mb-2" />
                    <p className="text-[10px] font-bold text-stone-700 text-center">Lihat Jurnal<br/>JE-2026-092</p>
                  </>
                ) : (
                  <>
                    <BookOpen size={20} className="text-stone-300 mb-2" />
                    <p className="text-[10px] font-medium text-stone-400 text-center">Belum tersedia</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-stone-100 bg-white shrink-0 flex items-center justify-between">
          <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition">
            <Download size={16} /> Download bukti
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClose}
              className="px-6 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm"
            >
              Batalkan
            </button>
            {data?.status === "Ditolak" ? (
              <button 
                onClick={handleClose}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-[#008f5d] border border-[#008f5d] rounded-xl hover:bg-[#007a4f] transition shadow-sm"
              >
                Ajukan ulang
              </button>
            ) : (
              <button 
                onClick={handleClose}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-stone-900 border border-stone-900 rounded-xl hover:bg-black transition shadow-sm"
              >
                Tutup
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}