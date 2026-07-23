"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Settings, X, Check, Clock } from "lucide-react";

function formatFullCurrency(num: number): string {
  const n = Number(num) || 0;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatReimbursementDate(r: any): string {
  const ocrTanggal = r.ocrData && typeof r.ocrData === 'object' && 'submittedAt' in r.ocrData ? (r.ocrData as any).submittedAt : null;
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
  const rawDate = r.timestamp || ocrSubmitted;
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

// ponytail: shared row layout — name grows, rest are fixed-width
const COL_CLASS =
  "flex items-center gap-3 px-6 py-1.5 hover:bg-stone-50 transition";
const NAME_CLASS = "flex items-center gap-2 flex-1 min-w-0 max-w-[440px]";

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
      className={`${COL_CLASS} ${className}`}
      style={{ paddingLeft: 24 }}
    >
      {modifiedFirstChild}
      {restChildren}
    </div>
  );
}

function ProgressCell({ pct, exactPctText }: { pct: number; exactPctText?: string }) {
  return (
    <div className="flex items-center justify-center shrink-0" style={{ width: 200 }}>
      <div className="flex items-center justify-center gap-2.5 w-full px-3 shrink-0">
        <div className="flex-1 bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#008f5d] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className="text-[11px] font-bold tabular-nums w-10 text-right shrink-0"
          style={{ color: "#005836" }}
          title={exactPctText ? `${exactPctText}%` : undefined}
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
        <span>{formatFullCurrency(nominal)}</span>
        {icon}
      </span>
    </Cell>
  );
}

type AksiVariant = "main" | "sub" | "ket";

const VARIANT_STYLES: Record<AksiVariant, { bg: string; border: string; text: string }> = {
  main: {
    bg: "#f0f7fc",
    border: "#327c9e",
    text: "#1d6186",
  },
  sub: {
    bg: "#f1f7f4",
    border: "#388863",
    text: "#1f6245",
  },
  ket: {
    bg: "#fdf7f2",
    border: "#b38355",
    text: "#8d5423",
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
    <div className="flex justify-center shrink-0" style={{ width: 120 }}>
      <button
        onClick={onClick}
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

  const toggleMain = (id: number) =>
    setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) =>
    setExpandedSub((p) => ({ ...p, [id]: !p[id] }));
  const toggleKet = (id: number) =>
    setExpandedKet((p) => ({ ...p, [id]: !p[id] }));

  // ─── Kalkulasi cascade bottom-up: Ket → Sub → Main ───
  // Realisasi Ket = sum reimbursement APPROVED (dicairkan keuangan)
  // Realisasi Sub = sum realisasi seluruh Ket di bawahnya
  // Realisasi Main = sum realisasi seluruh Sub di bawahnya
  const mapped: MainPosItem[] = posAnggaran.map((main) => {
    const subPos = (main.subAnggaran || []).map((sub: any) => {
      const keterangan = (sub.keterangan || []).map((ket: any) => {
        // Reimbursement dari data posAnggaran (embedded)
        const childReimbursements = ket.reimbursements || [];

        // Filter display: hanya reimbursement dengan status yang relevan (sama seperti manager)
        const approvedReimbs = childReimbursements
          .filter((r: any) =>
            ['APPROVED', 'APPROVED_BY_PM', 'SUBMITTED', 'PAID', 'DISBURSED'].includes(r.status)
          )
          .sort((a: any, b: any) => getStatusRank(a.status) - getStatusRank(b.status));
        const hasReimbs = approvedReimbs.length > 0;

        // Ket realisasi = sum reimbursement dengan status APPROVED (dicairkan)
        const disbursedReimbs = childReimbursements.filter((r: any) =>
          ['APPROVED'].includes(r.status)
        );
        const ketRealisasi = hasReimbs
          ? disbursedReimbs.reduce((acc: number, r: any) => acc + (parseFloat(r.nominal) || 0), 0)
          : (parseFloat(ket.nominalRealisasi) || parseFloat(ket.realisasi) || 0);

        return {
          id: ket.id,
          nama: ket.nama,
          alokasi: ket.alokasi,
          realisasi: ketRealisasi,
          reimbs: approvedReimbs,
        };
      });

      // Sub realisasi = sum seluruh Ket di bawahnya
      const subRealisasi = keterangan.reduce((acc: any, k: any) => acc + (Number(k.realisasi) || 0), 0);

      return {
        id: sub.id,
        nama: sub.nama,
        alokasi: sub.alokasi,
        realisasi: subRealisasi,
        keterangan,
      };
    });

    // Main realisasi = sum seluruh Sub di bawahnya
    const mainRealisasi = subPos.reduce((acc: any, s: any) => acc + (Number(s.realisasi) || 0), 0);

    return {
      id: main.id,
      nama: main.nama,
      alokasi: main.alokasi,
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
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[1260px] max-h-[85vh] flex flex-col overflow-hidden text-left"
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
            style={{ width: 120 }}
          >
            AKSI
          </span>
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {mapped.map((main) => {
            const mainPct =
              main.alokasi > 0
                ? Math.min((main.realisasi / main.alokasi) * 100, 100)
                : 0;
            const mainPctExact = main.alokasi > 0 ? ((main.realisasi / main.alokasi) * 100).toFixed(5) : '0.00000';
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
                  <ProgressCell pct={mainPct} exactPctText={mainPctExact} />
                  <Cell bold>{formatFullCurrency(main.alokasi)}</Cell>
                  <Cell bold>{formatFullCurrency(main.realisasi)}</Cell>
                  <AksiButton variant="main">
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
                        const subPctExact = sub.alokasi > 0 ? ((sub.realisasi / sub.alokasi) * 100).toFixed(5) : '0.00000';
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
                              <ProgressCell pct={subPct} exactPctText={subPctExact} />
                              <Cell>{formatFullCurrency(sub.alokasi)}</Cell>
                              <Cell>{formatFullCurrency(sub.realisasi)}</Cell>
                              <AksiButton variant="sub">
                                Edit Alokasi
                              </AksiButton>
                            </Row>

                            {/* KET rows */}
                            {isSubOpen &&
                              sub.keterangan.map((ket) => {
                                const hasKetReimbs = ket.reimbs && ket.reimbs.length > 0;
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
                                        {hasKetReimbs ? (
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
                                        ) : (
                                          <div style={{ width: 21 }} />
                                        )}
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
                                        {formatFullCurrency(ket.alokasi)}
                                      </Cell>
                                      <Cell style={{ color: "#78716C" }}>
                                        {formatFullCurrency(ket.realisasi)}
                                      </Cell>
                                      <AksiButton variant="ket">
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
                                          ket.reimbs.map((reimb: any) => {
                                            const reimbName = reimb.ocrData && typeof reimb.ocrData === 'object' ? ((reimb.ocrData as any).merchant || (reimb.ocrData as any).keterangan) : null;
                                            const displayName = reimbName || 'Reimbursement';
                                            const dateStr = formatReimbursementDate(reimb);
                                            const displayStatus = statusLabel(reimb.status);
                                            return (
                                            <Row
                                              key={reimb.id}
                                              indent={3}
                                            >
                                              <div className={NAME_CLASS}>
                                                <span
                                                  className="text-[9px] font-bold uppercase shrink-0"
                                                  style={{ color: "#005D8D" }}
                                                >
                                                  REIMB
                                                </span>
                                                <span
                                                  className="text-[11px] text-stone-700 font-medium truncate max-w-[220px] shrink-1"
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