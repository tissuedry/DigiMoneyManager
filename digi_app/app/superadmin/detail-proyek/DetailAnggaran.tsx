"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Settings, X, Check, Clock, FileSpreadsheet, Loader2, History, Upload } from "lucide-react";
import EditAlokasiModal, { type EditTarget } from "./EditAlokasi";
import RiwayatPengajuanModal, { type PengajuanHistoryItem } from "@/components/RiwayatPengajuanModal";
import ImportAnggaranModal from "@/components/ImportAnggaranModal";

import { formatReimbursementDate } from "@/lib/proyek-utils";
import CompactNominal from "@/components/compact-nominal";

type KeteranganPos = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  reimbs: {
    id: number;
    inisial: string;
    nama: string;
    tanggal: string;
    status: string;
    nominal: number;
  }[];
};

type SubPosItem = {
  id: number;
  nama: string;
  kode?: string | null;
  alokasi: number;
  realisasi: number;
  keterangan: KeteranganPos[];
};

type MainPosItem = {
  id: number;
  nama: string;
  kode?: string | null;
  alokasi: number;
  realisasi: number;
  subPos: SubPosItem[];
};

const STATUS_BADGE: Record<string, string> = {
  "Dicairkan": "bg-emerald-100 text-emerald-700",
  "APPROVED": "bg-emerald-100 text-emerald-700",
  "Menunggu PM": "bg-amber-100 text-amber-700",
  "SUBMITTED": "bg-amber-100 text-amber-700",
  "Menunggu Keuangan": "bg-blue-100 text-blue-700",
  "APPROVED_BY_PM": "bg-blue-100 text-blue-700",
  "Ditolak": "bg-red-100 text-red-700",
  "REJECTED": "bg-red-100 text-red-700",
  "PENDING": "bg-blue-100 text-blue-700",
};

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    "APPROVED": "Dicairkan",
    "SUBMITTED": "Menunggu PM",
    "REJECTED": "Ditolak",
    "PENDING": "Menunggu Keuangan",
    "APPROVED_BY_PM": "Menunggu Keuangan",
  };
  return map[s] || s;
}

function getStatusRank(status: string): number {
  if (['APPROVED', 'PAID', 'DISBURSED'].includes(status)) return 1;
  if (['SUBMITTED'].includes(status)) return 2;
  if (['APPROVED_BY_PM', 'PENDING'].includes(status)) return 3;
  return 4;
}

function reimbType(s: string): string {
  const map: Record<string, string> = {
    "Realisasi Anggaran": "REAL",
    "Reimbursement": "REIMB",
  };

  return map[s] || s;
}

const COL_CLASS =
  "flex items-center gap-3 px-6 py-1.5 hover:bg-stone-50 transition";
const NAME_CLASS = "flex items-center gap-2 flex-1 min-w-0 max-w-[440px]";

function Row({
  children,
  indent = 0,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  indent?: number;
  className?: string;
  onClick?: () => void;
}) {
  const childrenArray = React.Children.toArray(children);
  const firstChild = childrenArray[0];
  const restChildren = childrenArray.slice(1);

  const modifiedFirstChild = React.isValidElement(firstChild)
    ? React.cloneElement(firstChild as React.ReactElement<any>, {
        style: {
          ...((firstChild as React.ReactElement<any>).props?.style || {}),
          paddingLeft: indent * 24,
        },
      })
    : firstChild;

  return (
    <div
      onClick={onClick}
      className={`${COL_CLASS} ${onClick ? "cursor-pointer select-none" : ""} ${className}`}
      style={{ paddingLeft: 24 }}
    >
      {modifiedFirstChild}
      {restChildren}
    </div>
  );
}

function ProgressCell({ pct, exactPctText }: { pct: number; exactPctText?: string }) {
  const displayPct = Math.min(Math.max(pct, 0), 100);
  let barColor = "#008f5d";
  let textColor = "#005836";

  if (pct >= 90) {
    barColor = "#d36c66";
    textColor = "#991b1b";
  } else if (pct >= 75) {
    barColor = "#d8953d";
    textColor = "#92400e";
  }

  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 200 }}>
      <div className="flex items-center justify-center gap-2.5 w-full px-3 shrink-0">
        <div className="flex-1 bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${displayPct}%`, backgroundColor: barColor }}
          />
        </div>
        <span
          className="text-[11px] font-bold tabular-nums w-12 text-left shrink-0"
          style={{ color: textColor }}
          title={exactPctText ? `${exactPctText}%` : `${pct.toFixed(2)}%`}
        >
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function Cell({
  children,
  bold,
  style,
}: {
  children: React.ReactNode;
  bold?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`text-[12px] text-stone-800 shrink-0 text-center whitespace-nowrap ${bold ? "font-bold" : ""}`}
      style={{ width: 210, ...style }}
    >
      {children}
    </span>
  );
}

function ReimbRealisasiCell({
  nominal,
  status,
}: {
  nominal: number;
  status: string;
}) {
  let textColor = "#78716C";
  let icon: React.ReactNode = null;

  if (status === "Dicairkan") {
    textColor = "#44403C";
    icon = <Check size={13} className="shrink-0 stroke-[2.5] text-emerald-600" />;
  } else if (status === "Menunggu PM") {
    textColor = "#A8A29E";
    icon = <Clock size={13} className="shrink-0 text-amber-600" />;
  } else if (status === "Menunggu Keuangan") {
    textColor = "#A8A29E";
    icon = <Clock size={13} className="shrink-0 text-sky-600" />;
  } else {
    textColor = "#A8A29E";
  }

  return (
    <Cell style={{ color: textColor }}>
      <span className="inline-flex items-center justify-center gap-1.5">
        <span>{<CompactNominal value={nominal} compactThreshold={1_000_000_000_000} showTooltip />}</span>
        {icon}
      </span>
    </Cell>
  );
}

type AksiVariant = "main" | "sub" | "ket";

const VARIANT_STYLES: Record<AksiVariant, { bg: string; border: string; text: string }> = {
  main: {
    bg: "#fdf7f2",
    border: "#b38355",
    text: "#8d5423",
  },
  sub: {
    bg: "#f1f7f4",
    border: "#388863",
    text: "#1f6245",
  },
  ket: {
    bg: "#f0f7fc",
    border: "#327c9e",
    text: "#1d6186",
  },
};

function AksiButton({
  children,
  variant = "main",
  onClick,
}: {
  children: React.ReactNode;
  variant?: AksiVariant;
  onClick?: () => void;
}) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.main;

  return (
    <div className="flex justify-center shrink-0" style={{ width: 148 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick();
        }}
        className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer whitespace-nowrap hover:opacity-85 shadow-sm"
        style={{
          backgroundColor: styles.bg,
          borderColor: styles.border,
          color: styles.text,
        }}
      >
        <Settings size={12} style={{ color: styles.text }} />
        {children}
      </button>
    </div>
  );
}

export default function DetailAnggaranModal({
  proyekId,
  proyekNama,
  posAnggaran,
  totalRAB,
  totalAlokasiPemasukan = 0,
  onClose,
  onRefresh,
}: {
  proyekId: number;
  proyekNama: string;
  posAnggaran: any[];
  totalRAB?: number;
  totalAlokasiPemasukan?: number;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});
  const [expandedKet, setExpandedKet] = useState<Record<number, boolean>>({});
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pengajuanList, setPengajuanList] = useState<PengajuanHistoryItem[]>([]);
  const [historyTarget, setHistoryTarget] = useState<{
    id: number;
    nama: string;
    kode?: string | null;
  } | null>(null);

  const fetchPengajuan = async (pId: number) => {
    try {
      const res = await fetch(`/api/proyek/${pId}/pengajuan-anggaran`);
      if (!res.ok) return;
      const data = await res.json();
      setPengajuanList(data.pengajuan || []);
    } catch { }
  };

  useEffect(() => {
    if (proyekId) {
      fetchPengajuan(proyekId);
    }
  }, [proyekId]);

  const handleExport = async () => {
    if (!proyekId) return;
    try {
      setIsExporting(true);
      const res = await fetch(`/api/proyek/${proyekId}/budget/laporan`);
      if (!res.ok) {
        throw new Error("Gagal mengunduh laporan Excel");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Detail_Anggaran_${(proyekNama || "Proyek").replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleMain = (id: number) =>
    setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) =>
    setExpandedSub((p) => ({ ...p, [id]: !p[id] }));
  const toggleKet = (id: number) =>
    setExpandedKet((p) => ({ ...p, [id]: !p[id] }));

  const mapped: MainPosItem[] = posAnggaran.map((main) => {
    const subPos = (main.subAnggaran || []).map((sub: any) => {
      const keteranganList = (sub.keterangan || []).map((ket: any) => {
        const childReimbursements = ket.reimbursements || [];

        const approvedReimbs = childReimbursements
          .filter((r: any) =>
            ['APPROVED', 'APPROVED_BY_PM', 'SUBMITTED', 'PAID', 'DISBURSED'].includes(r.status)
          )
          .sort((a: any, b: any) => getStatusRank(a.status) - getStatusRank(b.status));
        const hasReimbs = approvedReimbs.length > 0;

        const disbursedReimbs = childReimbursements.filter((r: any) =>
          ['APPROVED'].includes(r.status)
        );
        const ketRealisasi = hasReimbs
          ? disbursedReimbs.reduce((acc: number, r: any) => acc + (parseFloat(r.nominal) || 0), 0)
          : (parseFloat(ket.nominalRealisasi) || parseFloat(ket.realisasi) || 0);

        const ketAlokasi = ket.nominalAlokasi !== undefined
          ? parseFloat(ket.nominalAlokasi)
          : (parseFloat(ket.alokasi) || 0);

        return {
          id: ket.id,
          nama: ket.keterangan || ket.nama,
          alokasi: ketAlokasi,
          realisasi: ketRealisasi,
          reimbs: approvedReimbs,
        };
      });

      const subRealisasi = keteranganList.reduce((acc: any, k: any) => acc + (Number(k.realisasi) || 0), 0);

      // Alokasi sub = sum keterangan (jika ada), agar konsisten dengan tampilan keterangan di bawahnya
      const subAlokasiFromKet = keteranganList.length > 0
        ? keteranganList.reduce((acc: number, k: any) => acc + (Number(k.alokasi) || 0), 0)
        : null;
      const subAlokasiRaw = sub.nominalAlokasi !== undefined ? parseFloat(sub.nominalAlokasi) : (parseFloat(sub.alokasi) || 0);
      const subAlokasi = subAlokasiFromKet !== null ? subAlokasiFromKet : subAlokasiRaw;

      return {
        id: sub.id,
        nama: sub.namaSub || sub.nama,
        kode: sub.kode || null,
        alokasi: subAlokasi,
        realisasi: subRealisasi,
        keterangan: keteranganList,
      };
    });

    const mainRealisasi = subPos.reduce((acc: any, s: any) => acc + (Number(s.realisasi) || 0), 0);

    return {
      id: main.id,
      nama: main.namaMain || main.namaPos || main.nama || main.deskripsi,
      kode: main.kode || null,
      alokasi: main.nominalAlokasi !== undefined ? parseFloat(main.nominalAlokasi) : (parseFloat(main.alokasi) || 0),
      realisasi: mainRealisasi,
      subPos,
    };
  });

  useEffect(() => {
    if (mapped.length > 0 && Object.keys(expandedMain).length === 0) {
      mapped.forEach((m) => {
        setExpandedMain((p) => ({ ...p, [m.id]: true }));
      });
    }
  }, [mapped, expandedMain]);

  return (
    <>
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[1260px] max-h-[85vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="text-lg font-sans font-bold text-stone-900">
              Detail Anggaran
            </h3>
            <p className="text-sm font-sans text-stone-500 mt-0.5">
              {proyekNama}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition cursor-pointer"
              title="Import perubahan alokasi & keterangan dari file Excel"
            >
              <Upload size={13} />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Export seluruh rincian anggaran ke file Excel"
            >
              {isExporting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={13} />
              )}
              <span>Export Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer ml-1"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-2 bg-stone-50 border-b border-stone-100 shrink-0">
          <span className="flex-1 min-w-0 max-w-[440px] text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            MAIN · SUB · KETERANGAN
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center"
            style={{ width: 200 }}
          >
            PROGRESS
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center"
            style={{ width: 210 }}
          >
            ALOKASI
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center"
            style={{ width: 210 }}
          >
            REALISASI
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-center"
            style={{ width: 148 }}
          >
            AKSI
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {mapped.length === 0 ? (
            <div className="p-12 text-center border border-stone-200 rounded-xl m-6">
              <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">
                Data Pos Anggaran Kosong
              </div>
              <div className="font-sans text-xs text-stone-400">
                Belum ada pos anggaran yang diinisialisasi untuk proyek ini.
              </div>
            </div>
          ) : (
            mapped.map((main) => {
              const mainPct =
                main.alokasi > 0
                  ? (main.realisasi / main.alokasi) * 100
                  : 0;
              const mainPctExact = main.alokasi > 0 ? ((main.realisasi / main.alokasi) * 100).toFixed(5) : '0.00000';
              const isMainOpen = expandedMain[main.id] ?? true;
              return (
                <div key={main.id}>
                  <Row onClick={() => toggleMain(main.id)}>
                    <div className={NAME_CLASS}>
                      <div className="p-0.5 shrink-0">
                        {isMainOpen ? (
                          <ChevronDown size={13} className="text-stone-500" />
                        ) : (
                          <ChevronRight size={13} className="text-stone-500" />
                        )}
                      </div>
                      <span
                        className="text-[13px] font-bold uppercase shrink-0"
                        style={{ color: "#14130F" }}
                      >
                        MAIN
                      </span>
                      <span className="text-[13px] font-semibold text-stone-800 truncate">
                        · {main.kode ? `(${main.kode}) ${main.nama}` : main.nama}
                      </span>
                    </div>
                    <ProgressCell pct={mainPct} exactPctText={mainPctExact} />
                    <Cell bold>{<CompactNominal value={main.alokasi} compactThreshold={1_000_000_000_000} showTooltip />}</Cell>
                    <Cell bold>{<CompactNominal value={main.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}</Cell>
                    <div className="flex items-center justify-center gap-1.5 shrink-0" style={{ width: 148 }}>
                      {pengajuanList.some((p) => p.mainAnggaranId === main.id) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryTarget({
                              id: main.id,
                              nama: main.nama,
                              kode: main.kode,
                            });
                          }}
                          className="h-7 w-7 rounded-lg bg-stone-100 hover:bg-amber-100/70 border border-stone-200 hover:border-amber-300 text-stone-600 hover:text-amber-800 flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs"
                          title="Lihat Riwayat Perubahan Alokasi"
                        >
                          <History size={12} className="stroke-[2.2]" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const totalTeralokasi = mapped.reduce((s, m) => s + (m.alokasi || 0), 0);
                          const totalChildrenAlokasi = main.subPos.reduce((s, s2) => s + (s2.alokasi || 0), 0);
                          setEditTarget({
                            type: "main",
                            id: main.id,
                            nama: main.nama,
                            currentAlokasi: main.alokasi || 0,
                            totalRAB: totalRAB || totalTeralokasi,
                            totalTeralokasi,
                            totalChildrenAlokasi,
                          });
                        }}
                        className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer whitespace-nowrap hover:opacity-85 shadow-xs"
                        style={{
                          backgroundColor: "#fdf7f2",
                          borderColor: "#b38355",
                          color: "#8d5423",
                        }}
                      >
                        <Settings size={12} style={{ color: "#8d5423" }} />
                        <span>Edit Alokasi</span>
                      </button>
                    </div>
                  </Row>

                  {isMainOpen && (
                    <div className="bg-stone-50/50">
                      {main.subPos.length === 0 ? (
                        <p className="pl-14 py-2.5 text-[12px] text-stone-400 italic">
                          Belum ada sub-pos anggaran.
                        </p>
                      ) : (
                        main.subPos.map((sub) => {
                          const subPct =
                            sub.alokasi > 0
                              ? (sub.realisasi / sub.alokasi) * 100
                              : 0;
                          const subPctExact = sub.alokasi > 0 ? ((sub.realisasi / sub.alokasi) * 100).toFixed(5) : '0.00000';
                          const isSubOpen = expandedSub[sub.id] ?? false;
                          return (
                            <div key={sub.id}>
                              <Row indent={1} onClick={() => toggleSub(sub.id)} className="hover:bg-stone-100/60">
                                <div className={NAME_CLASS}>
                                  <div className="p-0.5 shrink-0">
                                    {isSubOpen ? (
                                      <ChevronDown
                                        size={12}
                                        className="text-stone-400"
                                      />
                                    ) : (
                                      <ChevronRight
                                        size={12}
                                        className="text-stone-400"
                                      />
                                    )}
                                  </div>
                                  <span
                                    className="text-[9px] font-bold uppercase shrink-0"
                                    style={{ color: "#9A948B" }}
                                  >
                                    SUB
                                  </span>
                                  <span className="text-[12px] font-semibold text-stone-700 truncate">
                                    · {sub.kode ? `(${sub.kode}) ${sub.nama}` : sub.nama}
                                  </span>
                                </div>
                                <ProgressCell pct={subPct} exactPctText={subPctExact} />
                                <Cell>{<CompactNominal value={sub.alokasi} compactThreshold={1_000_000_000_000} showTooltip />}</Cell>
                                <Cell>{<CompactNominal value={sub.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}</Cell>
                                <AksiButton
                                  variant="sub"
                                  onClick={() => {
                                    const totalTeralokasi = main.subPos.reduce((s, s2) => s + (s2.alokasi || 0), 0);
                                    const totalChildrenAlokasi = sub.keterangan.reduce((s, k) => s + (k.alokasi || 0), 0);
                                    setEditTarget({
                                      type: "sub",
                                      id: sub.id,
                                      nama: sub.nama,
                                      parentNama: main.nama,
                                      currentAlokasi: sub.alokasi || 0,
                                      totalRAB: main.alokasi || 0,
                                      totalTeralokasi,
                                      totalChildrenAlokasi,
                                    });
                                  }}
                                >
                                  Edit Alokasi
                                </AksiButton>
                              </Row>

                              {isSubOpen && (
                                <div className="bg-stone-50/30">
                                  {sub.keterangan.length === 0 ? (
                                    <p className="pl-20 py-2.5 text-[12px] text-stone-400 italic">
                                      Belum ada pos keterangan.
                                    </p>
                                  ) : (
                                    sub.keterangan.map((ket) => {
                                      const isKetOpen = expandedKet[ket.id] ?? false;
                                      return (
                                        <div key={ket.id}>
                                          <Row
                                            indent={2}
                                            onClick={() => toggleKet(ket.id)}
                                            className="hover:bg-stone-100/60"
                                          >
                                            <div className={NAME_CLASS}>
                                              <div className="p-0.5 shrink-0">
                                                {isKetOpen ? (
                                                  <ChevronDown
                                                    size={12}
                                                    className="text-stone-400"
                                                  />
                                                ) : (
                                                  <ChevronRight
                                                    size={12}
                                                    className="text-stone-400"
                                                  />
                                                )}
                                              </div>
                                              <span
                                                className="text-[9px] font-bold uppercase shrink-0"
                                                style={{ color: "#9A948B" }}
                                              >
                                                KET
                                              </span>
                                              <span className="text-[12px] text-stone-600 truncate">
                                                {ket.nama}
                                              </span>
                                            </div>
                                            <div style={{ width: 200, flexShrink: 0 }} />
                                            <Cell style={{ color: "#78716C" }}>
                                              {<CompactNominal value={ket.alokasi} compactThreshold={1_000_000_000_000} showTooltip />}
                                            </Cell>
                                            <Cell style={{ color: "#78716C" }}>
                                              {<CompactNominal value={ket.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}
                                            </Cell>
                                            <AksiButton
                                              variant="ket"
                                              onClick={() => {
                                                const totalTeralokasi = sub.keterangan.reduce((s, k) => s + (k.alokasi || 0), 0);
                                                setEditTarget({
                                                  type: "ket",
                                                  id: ket.id,
                                                  nama: ket.nama,
                                                  parentNama: sub.nama,
                                                  currentAlokasi: ket.alokasi || 0,
                                                  totalRAB: sub.alokasi || 0,
                                                  totalTeralokasi,
                                                  totalChildrenAlokasi: 0,
                                                });
                                              }}
                                            >
                                              Edit Alokasi
                                            </AksiButton>
                                          </Row>

                                          {isKetOpen && (
                                            <div className="bg-white">
                                              {ket.reimbs.length === 0 ? (
                                                <p className="pl-24 py-2.5 text-[11px] text-stone-400 italic">
                                                  Belum ada realisasi reimbursement.
                                                </p>
                                              ) : (
                                                ket.reimbs.map((reimb: any) => {
                                                  const ocrObj = reimb.ocrData && typeof reimb.ocrData === 'object' ? reimb.ocrData : {};
                                                  const reimbName = ocrObj.merchant || ocrObj.keterangan || ocrObj.namaVendor || null;
                                                  const displayName = reimb.merchant || reimb.keterangan || reimb.nama || reimbName || 'Reimbursement';
                                                  const dateStr = formatReimbursementDate(reimb);
                                                  const displayStatus = statusLabel(reimb.status);

                                                  return (
                                                    <Row
                                                      key={reimb.id}
                                                      indent={3}
                                                    >
                                                      <div className={NAME_CLASS} title={displayName}>
                                                        <span
                                                          className={`text-[9px] font-bold uppercase shrink-0 
                                                            ${reimb.tipe == 'Realisasi Anggaran' ? 'text-[#483E90]' : 'text-[#005D8D]'}`}
                                                        >
                                                          {reimbType(reimb.tipe)}
                                                        </span>
                                                        <span
                                                          className="text-[11px] text-stone-700 font-medium truncate shrink-1 cursor-pointer"
                                                          title={displayName}
                                                        >
                                                          {displayName}
                                                        </span>
                                                        <span className="text-[10px] text-stone-400 shrink-0">
                                                          {dateStr}
                                                        </span>
                                                        <span
                                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                            STATUS_BADGE[displayStatus] ??
                                                            "bg-stone-100 text-stone-500"
                                                          }`}
                                                        >
                                                          {displayStatus}
                                                        </span>
                                                      </div>
                                                      <div style={{ width: 200, flexShrink: 0 }} />
                                                      <div style={{ width: 210, flexShrink: 0 }} />
                                                      <ReimbRealisasiCell
                                                        nominal={Number(reimb.nominal) || 0}
                                                        status={displayStatus}
                                                      />
                                                      <div style={{ width: 120, flexShrink: 0 }} />
                                                    </Row>
                                                  );
                                                })
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-[13px] font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    {editTarget && (
      <EditAlokasiModal
        target={editTarget}
        proyekId={proyekId}
        totalAlokasiPemasukan={totalAlokasiPemasukan}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          if (onRefresh) onRefresh();
        }}
      />
    )}

    {historyTarget && (
      <RiwayatPengajuanModal
        open={!!historyTarget}
        mainNama={historyTarget.nama}
        mainKode={historyTarget.kode}
        history={pengajuanList.filter((p) => p.mainAnggaranId === historyTarget.id)}
        onClose={() => setHistoryTarget(null)}
      />
    )}

    {isImportOpen && (
      <ImportAnggaranModal
        open={isImportOpen}
        proyekId={proyekId}
        proyekNama={proyekNama}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          fetchPengajuan(proyekId);
          if (onRefresh) onRefresh();
        }}
      />
    )}
    </>
  );
}