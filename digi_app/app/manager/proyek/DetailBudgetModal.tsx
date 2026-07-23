import React from "react";
import { ChevronDown, ChevronRight, X, Check, Clock } from "lucide-react";
import { formatReimbursementDate } from "./utils";

function formatFullCurrency(num: number): string {
  const n = Number(num) || 0;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

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

type Props = {
  showDetailBudgetModal: boolean;
  onClose: () => void;
  detailedProjectInfo: any;
  expandedMain: Record<number, boolean>;
  setExpandedMain: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  expandedSub: Record<string, boolean>;
  setExpandedSub: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  expandedKet: Record<string, boolean>;
  setExpandedKet: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export default function DetailBudgetModal({
  showDetailBudgetModal,
  onClose,
  detailedProjectInfo,
  expandedMain,
  setExpandedMain,
  expandedSub,
  setExpandedSub,
  expandedKet,
  setExpandedKet,
}: Props) {
  if (!showDetailBudgetModal) return null;

  const posAnggaran = detailedProjectInfo?.budget?.posAnggaran || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[1140px] max-h-[85vh] flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="text-lg font-sans font-bold text-stone-900">
              Detail Anggaran
            </h3>
            <p className="text-sm font-sans text-stone-500 mt-0.5">
              {detailedProjectInfo?.nama || "Pembangunan Gudang Cikarang Fase 2"}
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
        </div>

        {/* Scrollable rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {posAnggaran.length > 0 ? (
            posAnggaran.map((pos: any, idxPos: number) => {
              const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;
              const isMainOpen = expandedMain[idxPos] ?? true;

              const alokasiPos = parseFloat(pos.nominalAlokasi) || parseFloat(pos.alokasi) || 0;
              const terpakaiPos = hasSub
                ? pos.subAnggaran.reduce((accSub: number, sub: any) => {
                    const hasKet = sub.keterangan && sub.keterangan.length > 0;
                    const subRealisasi = hasKet
                      ? sub.keterangan.reduce((accKet: number, k: any) => {
                          const reimbs = (k.reimbursements || []).filter((r: any) =>
                            ['APPROVED'].includes(r.status)
                          );
                          const sumReimbs = reimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0);
                          return accKet + (sumReimbs || parseFloat(k.nominalRealisasi) || parseFloat(k.realisasi) || 0);
                        }, 0)
                      : parseFloat(sub.nominalTerpakai) || parseFloat(sub.realisasi) || 0;
                    return accSub + subRealisasi;
                  }, 0)
                : parseFloat(pos.nominalTerpakai) || parseFloat(pos.realisasi) || 0;

              const pctPos = alokasiPos > 0 ? Math.min((terpakaiPos / alokasiPos) * 100, 100) : 0;
              const pctPosExact = alokasiPos > 0 ? ((terpakaiPos / alokasiPos) * 100).toFixed(5) : '0.00000';

              return (
                <div key={pos.id || idxPos}>
                  {/* MAIN row */}
                  <Row onClick={() => setExpandedMain((prev) => ({ ...prev, [idxPos]: !isMainOpen }))}>
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
                        {pos.namaPos || pos.deskripsi || pos.nama}
                      </span>
                    </div>
                    <ProgressCell pct={pctPos} exactPctText={pctPosExact} />
                    <Cell bold>{formatFullCurrency(alokasiPos)}</Cell>
                    <Cell bold>{formatFullCurrency(terpakaiPos)}</Cell>
                  </Row>

                  {/* SUB rows */}
                  {isMainOpen && (
                    <div className="bg-stone-50/50">
                      {!hasSub ? (
                        <p className="pl-14 py-2.5 text-[12px] text-stone-400 italic">
                          Belum ada sub-pos anggaran.
                        </p>
                      ) : (
                        pos.subAnggaran.map((sub: any, idxSub: number) => {
                          const hasKet = sub.keterangan && sub.keterangan.length > 0;
                          const subKey = `${idxPos}-${idxSub}`;
                          const isSubOpen = expandedSub[subKey] ?? false;

                          const alokasiSub = parseFloat(sub.nominalAlokasi) || parseFloat(sub.alokasi) || 0;
                          const terpakaiSub = hasKet
                            ? sub.keterangan.reduce((acc: number, k: any) => {
                                const reimbs = (k.reimbursements || []).filter((r: any) =>
                                  ['APPROVED'].includes(r.status)
                                );
                                const sumReimbs = reimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0);
                                return acc + (sumReimbs || parseFloat(k.nominalRealisasi) || parseFloat(k.realisasi) || 0);
                              }, 0)
                            : parseFloat(sub.nominalTerpakai) || parseFloat(sub.realisasi) || 0;

                          const pctSub = alokasiSub > 0 ? Math.min((terpakaiSub / alokasiSub) * 100, 100) : 0;
                          const pctSubExact = alokasiSub > 0 ? ((terpakaiSub / alokasiSub) * 100).toFixed(5) : '0.00000';

                          return (
                            <div key={sub.id || idxSub}>
                              {/* SUB row */}
                              <Row indent={1} onClick={() => setExpandedSub((prev) => ({ ...prev, [subKey]: !isSubOpen }))} className="hover:bg-stone-100/60">
                                <div className={NAME_CLASS}>
                                  <div className="p-0.5 shrink-0">
                                    {isSubOpen ? (
                                      <ChevronDown size={12} className="text-stone-400" />
                                    ) : (
                                      <ChevronRight size={12} className="text-stone-400" />
                                    )}
                                  </div>
                                  <span
                                    className="text-[9px] font-bold uppercase shrink-0"
                                    style={{ color: "#9A948B" }}
                                  >
                                    SUB
                                  </span>
                                  <span className="text-[12px] font-semibold text-stone-700 truncate">
                                    {sub.namaSub || sub.nama}
                                  </span>
                                </div>
                                <ProgressCell pct={pctSub} exactPctText={pctSubExact} />
                                <Cell>{formatFullCurrency(alokasiSub)}</Cell>
                                <Cell>{formatFullCurrency(terpakaiSub)}</Cell>
                              </Row>

                              {/* KET rows */}
                              {isSubOpen && (
                                <div className="bg-stone-50/30">
                                  {!hasKet ? (
                                    <p className="pl-20 py-2.5 text-[12px] text-stone-400 italic">
                                      Belum ada pos keterangan.
                                    </p>
                                  ) : (
                                    sub.keterangan.map((ket: any, idxKet: number) => {
                                      const alokasiKet = parseFloat(ket.nominalAlokasi) || parseFloat(ket.alokasi) || 0;
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
                                      const realisasiKet = hasReimbs
                                        ? disbursedReimbs.reduce((accR: number, r: any) => accR + (parseFloat(r.nominal) || 0), 0)
                                        : parseFloat(ket.nominalRealisasi) || parseFloat(ket.realisasi) || 0;

                                      const ketKey = `${subKey}-${idxKet}`;
                                      const isKetOpen = expandedKet[ketKey] ?? false;

                                      return (
                                        <div key={ket.id || idxKet}>
                                          {/* KET row */}
                                          <Row indent={2} onClick={() => setExpandedKet((prev) => ({ ...prev, [ketKey]: !isKetOpen }))} className="hover:bg-stone-100/60">
                                            <div className={NAME_CLASS}>
                                              <div className="p-0.5 shrink-0">
                                                {isKetOpen ? (
                                                  <ChevronDown size={12} className="text-stone-400" />
                                                ) : (
                                                  <ChevronRight size={12} className="text-stone-400" />
                                                )}
                                              </div>
                                              <span
                                                className="text-[9px] font-bold uppercase shrink-0"
                                                style={{ color: "#9A948B" }}
                                              >
                                                KET
                                              </span>
                                              <span className="text-[12px] text-stone-600 truncate">
                                                {ket.keterangan || ket.nama}
                                              </span>
                                            </div>
                                            <div style={{ width: 200, flexShrink: 0 }} />
                                            <Cell style={{ color: "#78716C" }}>
                                              {formatFullCurrency(alokasiKet)}
                                            </Cell>
                                            <Cell style={{ color: "#78716C" }}>
                                              {formatFullCurrency(realisasiKet)}
                                            </Cell>
                                          </Row>

                                          {/* REIMB rows */}
                                          {isKetOpen && (
                                            <div className="bg-white">
                                              {approvedReimbs.length === 0 ? (
                                                <p className="pl-24 py-2.5 text-[11px] text-stone-400 italic">
                                                  Belum ada realisasi reimbursement.
                                                </p>
                                              ) : (
                                            approvedReimbs.map((reimb: any) => {
                                              const reimbName = reimb.ocrData && typeof reimb.ocrData === 'object' ? ((reimb.ocrData as any).merchant || (reimb.ocrData as any).keterangan) : null;
                                              const displayName = reimbName || 'Reimbursement';
                                              const dateStr = formatReimbursementDate(reimb);
                                              const displayStatus = statusLabel(reimb.status);
                                              return (
                                                <Row key={reimb.id} indent={3}>
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
          ) : (
            <div className="p-12 text-center border border-stone-200 rounded-xl m-6">
              <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">
                Data Anggaran Kosong
              </div>
              <div className="font-sans text-xs text-stone-400">
                Belum ada data nilai proyek atau pos anggaran yang diinisialisasi.
              </div>
            </div>
          )}
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