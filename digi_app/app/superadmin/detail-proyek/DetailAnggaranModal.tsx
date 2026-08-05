"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronRight, Edit3, Check, Clock } from "lucide-react";
import EditAlokasiMainModal from "./EditAlokasiMainModal";

interface DetailAnggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

const COLS = "minmax(240px,1fr) 200px 120px 120px 152px";

type Level = "main" | "sub" | "ket";

const LEVEL_STYLES: Record<Level, { border: string; text: string; bg: string; icon: string }> = {
  main: {
    border: "border-sky-200",
    text: "text-sky-700",
    bg: "bg-white hover:bg-sky-50",
    icon: "text-sky-600",
  },
  sub: {
    border: "border-emerald-200",
    text: "text-emerald-700",
    bg: "bg-white hover:bg-emerald-50",
    icon: "text-emerald-600",
  },
  ket: {
    border: "border-amber-200",
    text: "text-amber-700",
    bg: "bg-white hover:bg-amber-50",
    icon: "text-amber-600",
  },
};

export default function DetailAnggaranModal({ isOpen, onClose, projectName }: DetailAnggaranModalProps) {
  const [openMain1, setOpenMain1] = useState(true);
  const [openSub1, setOpenSub1] = useState(true);
  const [openKet1, setOpenKet1] = useState(true);
  const [openSub2, setOpenSub2] = useState(true);
  const [openMain2, setOpenMain2] = useState(true);

  // State untuk mengontrol modal Edit Alokasi Main
  const [isEditMainOpen, setIsEditMainOpen] = useState(false);
  const [activeMainTitle, setActiveMainTitle] = useState("Biaya Produksi Proyek");

  if (!isOpen) return null;

  const EditAlokasiButton = ({ level, title }: { level: Level; title?: string }) => {
    const s = LEVEL_STYLES[level];
    return (
      <button
        onClick={() => {
          if (level === "main" && title) {
            setActiveMainTitle(title);
            setIsEditMainOpen(true);
          }
        }}
        className={`px-3 py-1.5 ${s.bg} border ${s.border} ${s.text} rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap transition-colors`}
      >
        <Edit3 size={12} className={`${s.icon} stroke-[2.2] shrink-0`} />
        <span>Edit Alokasi</span>
      </button>
    );
  };

  const HierarchyLabel = ({
    tag,
    title,
    weight = "font-bold",
    titleColor = "text-stone-900",
  }: {
    tag: string;
    title: string;
    weight?: string;
    titleColor?: string;
  }) => (
    <span className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-stone-400 font-bold text-[10px] tracking-wide shrink-0">{tag}</span>
      <span className="text-stone-300 shrink-0">·</span>
      <span className={`${weight} ${titleColor} truncate`}>{title}</span>
    </span>
  );

  const ProgressBar = ({ percent }: { percent: number }) => (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#008f5d] rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] font-bold text-stone-600 tabular-nums shrink-0">{percent.toFixed(1)}%</span>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-[1150px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">

          {/* Header Modal */}
          <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
            <div>
              <h2 className="text-lg font-bold text-stone-900 leading-tight">Detail Anggaran</h2>
              <p className="text-[12px] text-stone-500 mt-0.5">{projectName || "Penyebaran Laptop Daerah Bojongsoang"}</p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabel Header */}
          <div
            className="grid gap-3 px-6 py-3 bg-[#fdfcf9] border-b border-stone-100 text-[10px] font-bold text-stone-400 uppercase tracking-wider items-center"
            style={{ gridTemplateColumns: COLS }}
          >
            <div>Main · Sub · Keterangan</div>
            <div>Progress</div>
            <div className="text-right">Alokasi</div>
            <div className="text-right">Realisasi</div>
            <div>Aksi</div>
          </div>

          {/* Body Konten Hirarki */}
          <div className="p-6 space-y-3 max-h-[68vh] overflow-y-auto text-[12px]">

            {/* MAIN 1: BIAYA PRODUKSI PROYEK */}
            <div className="space-y-2.5">
              <div
                className="grid gap-3 items-center py-3 border-b border-stone-100/80"
                style={{ gridTemplateColumns: COLS }}
              >
                <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => setOpenMain1(!openMain1)}>
                  {openMain1 ? <ChevronDown size={14} className="text-stone-500 shrink-0" /> : <ChevronRight size={14} className="text-stone-500 shrink-0" />}
                  <HierarchyLabel tag="MAIN" title="BIAYA PRODUKSI PROYEK" />
                </div>
                <ProgressBar percent={70.0} />
                <div className="text-right font-bold text-stone-900 tabular-nums">Rp 2.4 M</div>
                <div className="text-right font-bold text-stone-900 tabular-nums">Rp 1.7 M</div>
                <div className="flex justify-start">
                  <EditAlokasiButton level="main" title="BIAYA PRODUKSI PROYEK" />
                </div>
              </div>

              {openMain1 && (
                <div className="pl-6 space-y-2.5">

                  {/* SUB 1: Biaya Pengadaan Barang dan Jasa */}
                  <div className="space-y-2">
                    <div
                      className="grid gap-3 items-center py-2.5"
                      style={{ gridTemplateColumns: COLS }}
                    >
                      <div className="flex items-center gap-2 cursor-pointer pl-4 min-w-0" onClick={() => setOpenSub1(!openSub1)}>
                        {openSub1 ? <ChevronDown size={13} className="text-stone-400 shrink-0" /> : <ChevronRight size={13} className="text-stone-400 shrink-0" />}
                        <HierarchyLabel tag="SUB" title="Biaya Pengadaan Barang dan Jasa" weight="font-semibold" titleColor="text-stone-800" />
                      </div>
                      <ProgressBar percent={74.2} />
                      <div className="text-right font-semibold text-stone-800 tabular-nums">Rp 1.2 M</div>
                      <div className="text-right font-semibold text-stone-800 tabular-nums">Rp 890.8 jt</div>
                      <div className="flex justify-start">
                        <EditAlokasiButton level="sub" />
                      </div>
                    </div>

                    {openSub1 && (
                      <div className="pl-6 space-y-2.5 border-l border-stone-100 ml-4">

                        {/* KET 1: Pembelian Barang Kena Pajak */}
                        <div className="space-y-2">
                          <div
                            className="grid gap-3 items-center py-2"
                            style={{ gridTemplateColumns: COLS }}
                          >
                            <div className="flex items-center gap-2 cursor-pointer pl-4 min-w-0" onClick={() => setOpenKet1(!openKet1)}>
                              {openKet1 ? <ChevronDown size={12} className="text-stone-400 shrink-0" /> : <ChevronRight size={12} className="text-stone-400 shrink-0" />}
                              <HierarchyLabel tag="KET" title="Pembelian Barang Kena Pajak" weight="font-medium" titleColor="text-stone-700" />
                            </div>
                            <div />
                            <div className="text-right text-stone-700 tabular-nums">Rp 400.0 jt</div>
                            <div className="text-right text-stone-700 tabular-nums">Rp 310.0 jt</div>
                            <div className="flex justify-start">
                              <EditAlokasiButton level="ket" />
                            </div>
                          </div>

                          {openKet1 && (
                            <div className="pl-6 space-y-1.5 py-1">

                              {/* Transaksi 1 */}
                              <div className="grid gap-3 items-center text-[11px] text-stone-600 py-1" style={{ gridTemplateColumns: COLS }}>
                                <div className="col-span-2 flex items-center gap-2 pl-4 min-w-0">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded text-[9px] shrink-0">REIMB</span>
                                  <span className="truncate">Seblak Korea Mang Jay · 10 Mar 2026</span>
                                  <span className="px-2.5 py-0.5 bg-emerald-50 text-[#008f5d] border border-emerald-200 font-bold rounded-full text-[10px] shrink-0">Dicairkan</span>
                                </div>
                                <div />
                                <div className="text-right font-medium text-stone-800 flex items-center justify-end gap-1 tabular-nums">
                                  Rp 48.5 jt <Check size={13} className="text-[#008f5d]" />
                                </div>
                                <div />
                              </div>

                              {/* Transaksi 2 */}
                              <div className="grid gap-3 items-center text-[11px] text-stone-600 py-1" style={{ gridTemplateColumns: COLS }}>
                                <div className="col-span-2 flex items-center gap-2 pl-4 min-w-0">
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-[#008f5d] font-extrabold rounded text-[9px] shrink-0">REAL</span>
                                  <span className="truncate">Seblak Korea Mang Jay · 10 Mar 2026</span>
                                  <span className="px-2.5 py-0.5 bg-emerald-50 text-[#008f5d] border border-emerald-200 font-bold rounded-full text-[10px] shrink-0">Dicairkan</span>
                                </div>
                                <div />
                                <div className="text-right font-medium text-stone-800 flex items-center justify-end gap-1 tabular-nums">
                                  Rp 48.5 jt <Check size={13} className="text-[#008f5d]" />
                                </div>
                                <div />
                              </div>

                              {/* Transaksi 3 */}
                              <div className="grid gap-3 items-center text-[11px] text-stone-600 py-1" style={{ gridTemplateColumns: COLS }}>
                                <div className="col-span-2 flex items-center gap-2 pl-4 min-w-0">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded text-[9px] shrink-0">REIMB</span>
                                  <span className="truncate">Toko Roti Roesdi · 15 Mar 2026</span>
                                  <span className="px-2.5 py-0.5 bg-emerald-50 text-[#008f5d] border border-emerald-200 font-bold rounded-full text-[10px] shrink-0">Dicairkan</span>
                                </div>
                                <div />
                                <div className="text-right font-medium text-stone-800 flex items-center justify-end gap-1 tabular-nums">
                                  Rp 22.0 jt <Check size={13} className="text-[#008f5d]" />
                                </div>
                                <div />
                              </div>

                              {/* Transaksi 4 */}
                              <div className="grid gap-3 items-center text-[11px] text-stone-600 py-1" style={{ gridTemplateColumns: COLS }}>
                                <div className="col-span-2 flex items-center gap-2 pl-4 min-w-0">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded text-[9px] shrink-0">REIMB</span>
                                  <span className="truncate">Toko Roti Roesdi · 15 Mar 2026</span>
                                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full text-[10px] shrink-0">Menunggu PM</span>
                                </div>
                                <div />
                                <div className="text-right font-medium text-stone-800 flex items-center justify-end gap-1 tabular-nums">
                                  Rp 22.0 jt <Clock size={12} className="text-amber-600" />
                                </div>
                                <div />
                              </div>

                              {/* Transaksi 5 */}
                              <div className="grid gap-3 items-center text-[11px] text-stone-600 py-1" style={{ gridTemplateColumns: COLS }}>
                                <div className="col-span-2 flex items-center gap-2 pl-4 min-w-0">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded text-[9px] shrink-0">REIMB</span>
                                  <span className="truncate">Toko Roti Roesdi · 15 Mar 2026</span>
                                  <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 font-bold rounded-full text-[10px] shrink-0">Menunggu Keuangan</span>
                                </div>
                                <div />
                                <div className="text-right font-medium text-stone-800 flex items-center justify-end gap-1 tabular-nums">
                                  Rp 22.0 jt <Clock size={12} className="text-sky-600" />
                                </div>
                                <div />
                              </div>

                            </div>
                          )}
                        </div>

                        {/* KET 2: Biaya Personil Lainnya */}
                        <div className="grid gap-3 items-center py-2" style={{ gridTemplateColumns: COLS }}>
                          <div className="flex items-center gap-2 pl-4 min-w-0">
                            <span className="w-3 shrink-0" />
                            <HierarchyLabel tag="KET" title="Biaya Personil lainnya" weight="font-medium" titleColor="text-stone-700" />
                          </div>
                          <div />
                          <div className="text-right text-stone-700 tabular-nums">Rp 600.0 jt</div>
                          <div className="text-right text-stone-700 tabular-nums">Rp 460.0 jt</div>
                          <div className="flex justify-start">
                            <EditAlokasiButton level="ket" />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* SUB 2: Beton & Semen */}
                  <div className="space-y-2 pt-2">
                    <div className="grid gap-3 items-center py-2.5" style={{ gridTemplateColumns: COLS }}>
                      <div className="flex items-center gap-2 cursor-pointer pl-4 min-w-0" onClick={() => setOpenSub2(!openSub2)}>
                        {openSub2 ? <ChevronDown size={13} className="text-stone-400 shrink-0" /> : <ChevronRight size={13} className="text-stone-400 shrink-0" />}
                        <HierarchyLabel tag="SUB" title="Beton & Semen" weight="font-semibold" titleColor="text-stone-800" />
                      </div>
                      <ProgressBar percent={74.2} />
                      <div className="text-right font-semibold text-stone-800 tabular-nums">Rp 1.2 M</div>
                      <div className="text-right font-semibold text-stone-800 tabular-nums">Rp 890.8 jt</div>
                      <div className="flex justify-start">
                        <EditAlokasiButton level="sub" />
                      </div>
                    </div>

                    {openSub2 && (
                      <div className="pl-6 space-y-2 border-l border-stone-100 ml-4">
                        <div className="grid gap-3 items-center py-2" style={{ gridTemplateColumns: COLS }}>
                          <div className="flex items-center gap-2 pl-4 min-w-0">
                            <span className="w-3 shrink-0" />
                            <HierarchyLabel tag="KET" title="Bahan aditif & campuran" weight="font-medium" titleColor="text-stone-700" />
                          </div>
                          <div />
                          <div className="text-right text-stone-700 tabular-nums">Rp 200.0 jt</div>
                          <div className="text-right text-stone-700 tabular-nums">Rp 120.0 jt</div>
                          <div className="flex justify-start">
                            <EditAlokasiButton level="ket" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* MAIN 2: Tenaga Kerja Lapangan */}
            <div className="grid gap-3 items-center py-3 border-t border-stone-100 pt-3" style={{ gridTemplateColumns: COLS }}>
              <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => setOpenMain2(!openMain2)}>
                {openMain2 ? <ChevronDown size={14} className="text-stone-500 shrink-0" /> : <ChevronRight size={14} className="text-stone-500 shrink-0" />}
                <HierarchyLabel tag="MAIN" title="Tenaga Kerja Lapangan" />
              </div>
              <ProgressBar percent={70.0} />
              <div className="text-right font-bold text-stone-900 tabular-nums">Rp 2.4 M</div>
              <div className="text-right font-bold text-stone-900 tabular-nums">Rp 1.7 M</div>
              <div className="flex justify-start">
                <EditAlokasiButton level="main" title="Tenaga Kerja Lapangan" />
              </div>
            </div>
            {openMain2 && (
              <div className="pl-6 text-stone-400 italic text-[11px] pb-2">
                Belum ada rincian sub-pos.
              </div>
            )}

          </div>

          {/* Footer Modal */}
          <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-[13px] font-bold text-white bg-black rounded-xl hover:bg-stone-800 transition cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      <EditAlokasiMainModal
        isOpen={isEditMainOpen}
        onClose={() => setIsEditMainOpen(false)}
        mainTitle={activeMainTitle}
      />
    </>
  );
}