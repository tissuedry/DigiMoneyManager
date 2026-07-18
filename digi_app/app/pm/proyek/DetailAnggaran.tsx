"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Settings, X } from "lucide-react";
import { formatShort } from "./page";

function formatReimbursementDate(r: any): string {
  const ocrTanggal = r.ocrData && typeof r.ocrData === 'object' && 'tanggal' in r.ocrData ? (r.ocrData as any).tanggal : null;
  if (ocrTanggal) {
    const d = new Date(ocrTanggal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  const ocrSubmitted = r.ocrData && typeof r.ocrData === 'object' && 'submittedAt' in r.ocrData ? (r.ocrData as any).submittedAt : null;
  const rawDate = r.createdAt || r.timestamp || ocrSubmitted;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "-";
}

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
  alokasi: number;
  realisasi: number;
  keterangan: KeteranganPos[];
};

type MainPosItem = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  subPos: SubPosItem[];
};

const STATUS_BADGE: Record<string, string> = {
  "Dicairkan": "bg-emerald-100 text-emerald-700",
  "APPROVED": "bg-emerald-100 text-emerald-700",
  "Menunggu PM": "bg-amber-100 text-amber-700",
  "SUBMITTED": "bg-amber-100 text-amber-700",
  "Verifikasi Keuangan": "bg-blue-100 text-blue-700",
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
    "PENDING": "Verifikasi Keuangan",
    "APPROVED_BY_PM": "Verifikasi Keuangan",
  };
  return map[s] || s;
}

// ponytail: shared row layout — name grows, rest are fixed-width
const COL_CLASS =
  "flex items-center gap-3 px-6 py-3 hover:bg-stone-50 transition";
const NAME_CLASS = "flex items-center gap-2 flex-1 min-w-0 max-w-md";
const CELL_STYLE: React.CSSProperties = { width: 100, flexShrink: 0 };

// ─── Shared row wrapper ───────────────────────────────────────────────────

function Row({
  children,
  indent = 0,
  className = "",
}: {
  children: React.ReactNode;
  indent?: number;
  className?: string;
}) {
  return (
    <div
      className={`${COL_CLASS} ${className}`}
      style={{ paddingLeft: 24 + indent * 24 }}
    >
      {children}
    </div>
  );
}

function ProgressCell({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 shrink-0" style={{ width: 120 }}>
      <div className="flex-1 bg-stone-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#008f5d] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-stone-600 tabular-nums w-9 text-right">
        {pct.toFixed(1)}%
      </span>
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
      className={`text-[12px] text-stone-800 shrink-0 text-right ${bold ? "font-bold" : ""}`}
      style={{ width: 100, ...style }}
    >
      {children}
    </span>
  );
}

function AksiButton({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex justify-end shrink-0" style={{ width: 100 }}>
      <button
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer whitespace-nowrap hover:opacity-80"
        style={style}
      >
        <Settings size={11} />
        {children}
      </button>
    </div>
  );
}

export default function DetailAnggaranModal({
  proyekId,
  proyekNama,
  posAnggaran,
  onClose,
}: {
  proyekId: number;
  proyekNama: string;
  posAnggaran: any[];
  onClose: () => void;
}) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});
  const [expandedKet, setExpandedKet] = useState<Record<number, boolean>>({});
  const [reimbs, setReimbs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/proyek/${proyekId}`)
      .then((r) => r.json())
      .then((d) => setReimbs(d.project?.pendingReimbursements || []))
      .catch(() => {});
  }, [proyekId]);

  const toggleMain = (id: number) =>
    setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) =>
    setExpandedSub((p) => ({ ...p, [id]: !p[id] }));
  const toggleKet = (id: number) =>
    setExpandedKet((p) => ({ ...p, [id]: !p[id] }));

  const mapped: MainPosItem[] = posAnggaran.map((main) => ({
    id: main.id,
    nama: main.nama,
    alokasi: main.alokasi,
    realisasi: main.terpakai,
    subPos: (main.subAnggaran || []).map((sub: any) => {
      const ketData = (sub.keterangan || []).map((ket: any) => {
        const ketReimbs = reimbs
          .filter((r: any) => r.keteranganAnggaran?.id === ket.id)
          .map((r: any) => {
            const ocrMerchant = r.ocrData && typeof r.ocrData === 'object' && 'merchant' in r.ocrData ? (r.ocrData as any).merchant : null;
            const ocrKeterangan = r.ocrData && typeof r.ocrData === 'object' && 'keterangan' in r.ocrData ? (r.ocrData as any).keterangan : null;
            const nama = ocrMerchant || ocrKeterangan || 'Reimbursement';
            const words = nama.split(" ");
            const inisial =
              words.length >= 2
                ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
                : nama.slice(0, 2).toUpperCase();
            const dateStr = formatReimbursementDate(r);
            return {
              id: r.id,
              inisial,
              nama,
              tanggal: dateStr,
              status: statusLabel(r.status),
              nominal: Number(r.nominal),
            };
          });
        return {
          id: ket.id,
          nama: ket.nama,
          alokasi: ket.alokasi,
          realisasi: ket.realisasi,
          reimbs: ketReimbs,
        };
      });
      return {
        id: sub.id,
        nama: sub.nama,
        alokasi: sub.alokasi,
        realisasi: sub.terpakai,
        keterangan: ketData,
      };
    }),
  }));

  useEffect(() => {
    if (mapped.length > 0 && Object.keys(expandedMain).length === 0) {
      mapped.forEach((m) => {
        setExpandedMain((p) => ({ ...p, [m.id]: true }));
      });
    }
  }, [mapped, expandedMain]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[1040px] max-h-[85vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="text-lg font-sans font-bold text-stone-900">
              Detail Anggaran
            </h3>
            <p className="text-sm font-sans text-stone-500 mt-0.5">
              {proyekNama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 border-b border-stone-100 shrink-0">
          <span className="flex-1 min-w-0 max-w-md text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            MAIN · SUB · KETERANGAN
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0"
            style={{ width: 120 }}
          >
            PROGRESS
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-right"
            style={{ width: 100 }}
          >
            ALOKASI
          </span>
          <span
            className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 text-right"
            style={{ width: 100 }}
          >
            REALISASI
          </span>
          <div className="shrink-0" style={{ width: 100 }} />
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {mapped.map((main) => {
            const mainPct =
              main.alokasi > 0
                ? Math.min((main.realisasi / main.alokasi) * 100, 100)
                : 0;
            const isMainOpen = expandedMain[main.id] ?? true;
            return (
              <div key={main.id}>
                {/* MAIN row */}
                <Row>
                  <div className={NAME_CLASS}>
                    <button
                      onClick={() => toggleMain(main.id)}
                      className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0"
                    >
                      {isMainOpen ? (
                        <ChevronDown size={13} className="text-stone-500" />
                      ) : (
                        <ChevronRight size={13} className="text-stone-500" />
                      )}
                    </button>
                    <span
                      className="text-[13px] font-bold uppercase shrink-0"
                      style={{ color: "#14130F" }}
                    >
                      MAIN
                    </span>
                    <span className="text-[13px] font-semibold text-stone-800 truncate">
                      {main.nama}
                    </span>
                  </div>
                  <ProgressCell pct={mainPct} />
                  <Cell bold>{formatShort(main.alokasi)}</Cell>
                  <Cell bold>{formatShort(main.realisasi)}</Cell>
                  <AksiButton
                    style={{ color: "#005D8D", backgroundColor: "#F0F7FB" }}
                  >
                    Edit Alokasi
                  </AksiButton>
                </Row>

                {/* SUB rows */}
                {isMainOpen && (
                  <div className="bg-stone-50/50">
                    {main.subPos.length === 0 ? (
                      <p className="pl-14 py-2.5 text-[12px] text-stone-400 italic">
                        Belum ada sub-pos.
                      </p>
                    ) : (
                      main.subPos.map((sub) => {
                        const subPct =
                          sub.alokasi > 0
                            ? Math.min(
                                (sub.realisasi / sub.alokasi) * 100,
                                100
                              )
                            : 0;
                        const isSubOpen = expandedSub[sub.id] ?? false;
                        return (
                          <div key={sub.id}>
                            {/* SUB row */}
                            <Row indent={1} className="hover:bg-stone-100/60">
                              <div className={NAME_CLASS}>
                                <button
                                  onClick={() => toggleSub(sub.id)}
                                  className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0"
                                >
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
                                </button>
                                <span
                                  className="text-[9px] font-bold uppercase shrink-0"
                                  style={{ color: "#9A948B" }}
                                >
                                  SUB
                                </span>
                                <span className="text-[12px] font-semibold text-stone-700 truncate">
                                  {sub.nama}
                                </span>
                              </div>
                              <ProgressCell pct={subPct} />
                              <Cell>{formatShort(sub.alokasi)}</Cell>
                              <Cell>{formatShort(sub.realisasi)}</Cell>
                              <AksiButton
                                style={{
                                  color: "#005D8D",
                                  backgroundColor: "#F0F7FB",
                                }}
                              >
                                Edit Alokasi
                              </AksiButton>
                            </Row>

                            {/* KET rows */}
                            {isSubOpen &&
                              sub.keterangan.map((ket) => {
                                const isKetOpen =
                                  expandedKet[ket.id] ?? false;
                                return (
                                  <div key={ket.id}>
                                    {/* KET row */}
                                    <Row
                                      indent={2}
                                      className="hover:bg-stone-100/60"
                                    >
                                      <div className={NAME_CLASS}>
                                        <button
                                          onClick={() =>
                                            toggleKet(ket.id)
                                          }
                                          className="p-0.5 hover:bg-stone-200 rounded transition cursor-pointer shrink-0"
                                        >
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
                                        </button>
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
                                      <div style={{ width: 120, flexShrink: 0 }} />
                                      <Cell style={{ color: "#78716C" }}>
                                        {formatShort(ket.alokasi)}
                                      </Cell>
                                      <Cell style={{ color: "#78716C" }}>
                                        {formatShort(ket.realisasi)}
                                      </Cell>
                                      <AksiButton
                                        style={{
                                          color: "#005D8D",
                                          backgroundColor: "#F0F7FB",
                                        }}
                                      >
                                        Edit Alokasi
                                      </AksiButton>
                                    </Row>

                                    {/* REIMB rows */}
                                    {isKetOpen && (
                                      <div className="bg-white">
                                        {ket.reimbs.length === 0 ? (
                                          <p className="pl-24 py-2 text-[11px] text-stone-400 italic">
                                            Belum ada realisasi.
                                          </p>
                                        ) : (
                                          ket.reimbs.map((rb) => (
                                            <Row
                                              key={rb.id}
                                              indent={3}
                                            >
                                              <div className={NAME_CLASS}>
                                                <span
                                                  className="text-[9px] font-bold uppercase shrink-0"
                                                  style={{ color: "#005D8D" }}
                                                >
                                                  REIMB
                                                </span>
                                                <div className="w-4 h-4 rounded-full bg-blue-100 text-[7px] font-bold flex items-center justify-center shrink-0 text-blue-700">
                                                  {rb.inisial}
                                                </div>
                                                <span className="text-[11px] text-stone-700 font-medium truncate">
                                                  {rb.nama}
                                                </span>
                                                <span className="text-[10px] text-stone-400 shrink-0">
                                                  {rb.tanggal}
                                                </span>
                                                <span
                                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                    STATUS_BADGE[rb.status] ??
                                                    "bg-stone-100 text-stone-500"
                                                  }`}
                                                >
                                                  {rb.status}
                                                </span>
                                              </div>
                                              <div style={{ width: 120, flexShrink: 0 }} />
                                              <div style={{ width: 100, flexShrink: 0 }} />
                                              <Cell style={{ color: "#78716C" }}>
                                                {formatShort(rb.nominal)}
                                              </Cell>
                                              <AksiButton
                                                style={{
                                                  color: "#005836",
                                                  backgroundColor: "#EEF6F2",
                                                }}
                                              >
                                                Edit Realisasi
                                              </AksiButton>
                                            </Row>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
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
  );
}
