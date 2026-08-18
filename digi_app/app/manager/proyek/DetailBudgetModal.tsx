"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, X, Check, Clock, Settings } from "lucide-react";
import { formatReimbursementDate } from "./utils";
import { formatFullRupiah } from "@/lib/format-nominal";
import EditAlokasiModal from "./PerubahanAlokasi";

const APPROVED_STATUSES = ["APPROVED", "PAID", "DISBURSED"];
const VALID_REIMB_STATUSES = ["APPROVED", "APPROVED_BY_PM", "SUBMITTED", "PAID", "DISBURSED"];

function formatFullCurrency(num: number): string {
  const n = Number(num) || 0;
  return formatFullRupiah(n);
}

function formatSisaCurrency(num: number): string {
  const n = Number(num) || 0;
  if (n < 0) {
    return `-Rp ${Math.abs(Math.round(n)).toLocaleString("id-ID")}`;
  }
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    APPROVED: "Dicairkan",
    SUBMITTED: "Menunggu PM",
    REJECTED: "Ditolak",
    PENDING: "Menunggu Keuangan",
    APPROVED_BY_PM: "Menunggu Keuangan",
    PAID: "Dicairkan",
    DISBURSED: "Dicairkan",
  };
  return map[s] || s;
}

function getStatusRank(status: string): number {
  if (APPROVED_STATUSES.includes(status)) return 1;
  if (status === "SUBMITTED") return 2;
  if (status === "APPROVED_BY_PM" || status === "PENDING") return 3;
  return 4;
}

function reimbType(s: string): string {
  const map: Record<string, string> = {
    "Realisasi Anggaran": "REAL",
    Reimbursement: "REIMB",
  };
  return map[s] || s || "REIMB";
}

// Helpers untuk mencegah duplikasi logika perhitungan realisasi
function calculateKetRealisasi(ket: any): number {
  const reimbs = ket.reimbursements || [];
  if (reimbs.length > 0) {
    return reimbs
      .filter((r: any) => APPROVED_STATUSES.includes(r.status))
      .reduce((sum: number, r: any) => sum + (parseFloat(r.nominal) || 0), 0);
  }
  return parseFloat(ket.nominalRealisasi) || parseFloat(ket.realisasi) || 0;
}

function calculateSubRealisasi(sub: any): number {
  if (sub.keterangan && sub.keterangan.length > 0) {
    return sub.keterangan.reduce((acc: number, k: any) => acc + calculateKetRealisasi(k), 0);
  }
  return parseFloat(sub.nominalTerpakai) || parseFloat(sub.realisasi) || 0;
}

function calculatePosRealisasi(pos: any): number {
  if (pos.subAnggaran && pos.subAnggaran.length > 0) {
    return pos.subAnggaran.reduce((acc: number, sub: any) => acc + calculateSubRealisasi(sub), 0);
  }
  return parseFloat(pos.nominalTerpakai) || parseFloat(pos.realisasi) || 0;
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
  onRefresh?: () => void;
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
  onRefresh,
}: Props) {
  const [editTarget, setEditTarget] = useState<{
    type: "main" | "sub";
    id: number;
    mainId?: number;
    nama: string;
    currentAlokasi: number;
    totalRAB?: number;
    totalTeralokasi?: number;
  } | null>(null);

  if (!showDetailBudgetModal) return null;

  const posAnggaran = detailedProjectInfo?.budget?.posAnggaran || [];
  const projectName = detailedProjectInfo?.nama || "Pembangunan Gudang Cikarang Fase 2";
  const totalPemasukan =
    Number(detailedProjectInfo?.budget?.nilaiTotal) ||
    Number(detailedProjectInfo?.nilaiProyek) ||
    0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#14120E]/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[20px] shadow-[0px_24px_64px_rgba(20,18,14,0.30)] w-full max-w-[1112px] max-h-[88vh] flex flex-col overflow-hidden text-left border border-[#E6E1D4] animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-7 pt-[22px] pb-[18px] border-b border-[#E6E1D4] flex items-start justify-between shrink-0 bg-white">
            <div className="flex flex-col">
              <h3 className="text-[19px] font-bold text-[#14130F] leading-[28.5px] font-sans">
                Detail Anggaran
              </h3>
              <p className="text-[13px] text-[#6A6660] leading-[19.5px] mt-0.5 font-sans">
                {projectName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#2C2A24] hover:bg-[#F1EEE6] rounded-xl transition cursor-pointer"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Column headers */}
          <div className="px-7 pt-3.5 pb-2.5 border-b border-[#E6E1D4] flex items-center shrink-0 bg-white">
            <div className="flex-1 min-w-[280px] text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              MAIN · SUB · KETERANGAN
            </div>
            <div className="w-[145px] shrink-0 text-center text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              REALISASI
            </div>
            <div className="w-[145px] shrink-0 text-center text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              ALOKASI
            </div>
            <div className="w-[145px] shrink-0 text-center text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              SISA
            </div>
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto px-7 py-3 flex flex-col gap-2">
            {posAnggaran.length > 0 ? (
              posAnggaran.map((pos: any, idxPos: number) => {
                const hasSub = pos.subAnggaran && pos.subAnggaran.length > 0;
                const isMainOpen = expandedMain[idxPos] ?? true;

                const alokasiPos = parseFloat(pos.nominalAlokasi) || parseFloat(pos.alokasi) || 0;
                const terpakaiPos = calculatePosRealisasi(pos);
                const sisaPos = alokasiPos - terpakaiPos;

                return (
                  <div key={pos.id || idxPos} className="flex flex-col pb-1 border-b border-[#E6E1D4]">
                    {/* MAIN row */}
                    <div
                      onClick={() =>
                        setExpandedMain((prev) => ({ ...prev, [idxPos]: !isMainOpen }))
                      }
                      className="py-1.5 flex items-center hover:bg-stone-50/80 rounded-lg cursor-pointer select-none transition"
                    >
                      {/* Left: Main pos name */}
                      <div className="flex-1 min-w-[280px] flex items-center gap-2 pr-2">
                        <div className="p-0.5 shrink-0 text-[#6A6660]">
                          {isMainOpen ? (
                            <ChevronDown size={13} className="shrink-0" />
                          ) : (
                            <ChevronRight size={13} className="shrink-0" />
                          )}
                        </div>
                        <span className="text-[13.5px] font-bold text-[#14130F] uppercase tracking-[0.27px] shrink-0 font-sans">
                          MAIN
                        </span>
                        <span className="text-[13.5px] font-semibold text-[#2C2A24] truncate font-sans">
                          · {pos.namaPos || pos.deskripsi || pos.nama}
                        </span>
                      </div>

                      {/* Column 2: REALISASI */}
                      <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold text-[#14130F]">
                        {formatFullCurrency(terpakaiPos)}
                      </div>

                      {/* Column 3: ALOKASI */}
                      <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold text-[#14130F]">
                        {formatFullCurrency(alokasiPos)}
                      </div>

                      {/* Column 4: SISA */}
                      <div
                        className={`w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold ${sisaPos < 0 ? "text-[#902F33]" : "text-[#005836]"
                          }`}
                      >
                        {formatSisaCurrency(sisaPos)}
                      </div>
                    </div>

                    {/* SUB rows */}
                    {isMainOpen && (
                      <div className="flex flex-col">
                        {!hasSub ? (
                          <div className="pl-7 py-2 text-[12px] text-[#9A948B] font-sans font-normal">
                            Belum ada rincian sub-pos.
                          </div>
                        ) : (
                          pos.subAnggaran.map((sub: any, idxSub: number) => {
                            const hasKet = sub.keterangan && sub.keterangan.length > 0;
                            const subKey = `${idxPos}-${idxSub}`;
                            const isSubOpen = expandedSub[subKey] ?? true;

                            const alokasiSub =
                              parseFloat(sub.nominalAlokasi) || parseFloat(sub.alokasi) || 0;
                            const terpakaiSub = calculateSubRealisasi(sub);
                            const sisaSub = alokasiSub - terpakaiSub;

                            return (
                              <div key={sub.id || idxSub} className="flex flex-col">
                                {/* SUB row */}
                                <div
                                  onClick={() =>
                                    setExpandedSub((prev) => ({
                                      ...prev,
                                      [subKey]: !isSubOpen,
                                    }))
                                  }
                                  className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg cursor-pointer select-none transition"
                                >
                                  {/* Left: Sub pos name */}
                                  <div className="flex-1 min-w-[280px] pl-7 flex items-center gap-2 pr-2">
                                    <div className="p-0.5 shrink-0 text-[#6A6660]">
                                      {isSubOpen ? (
                                        <ChevronDown size={12} className="shrink-0" />
                                      ) : (
                                        <ChevronRight size={12} className="shrink-0" />
                                      )}
                                    </div>
                                    <span className="text-[10.5px] font-bold text-[#9A948B] uppercase tracking-[0.2px] shrink-0 font-sans">
                                      SUB
                                    </span>
                                    <span className="text-[12.5px] font-semibold text-[#14130F] truncate font-sans">
                                      · {sub.namaSub || sub.nama}
                                    </span>
                                  </div>

                                  {/* Column 2: REALISASI */}
                                  <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-medium text-[#6A6660]">
                                    {formatFullCurrency(terpakaiSub)}
                                  </div>

                                  {/* Column 3: ALOKASI */}
                                  <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold text-[#005836]">
                                    {formatFullCurrency(alokasiSub)}
                                  </div>

                                  {/* Column 4: SISA */}
                                  <div
                                    className={`w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold ${sisaSub < 0 ? "text-[#902F33]" : "text-[#005836]"
                                      }`}
                                  >
                                    {formatSisaCurrency(sisaSub)}
                                  </div>
                                </div>

                                {/* KET rows */}
                                {isSubOpen && (
                                  <div className="flex flex-col">
                                    {!hasKet ? (
                                      <div className="pl-14 py-1.5 text-[12px] text-[#9A948B] italic font-sans">
                                        Belum ada pos keterangan.
                                      </div>
                                    ) : (
                                      sub.keterangan.map((ket: any, idxKet: number) => {
                                        const alokasiKet =
                                          parseFloat(ket.nominalAlokasi) ||
                                          parseFloat(ket.alokasi) ||
                                          0;
                                        const childReimbursements = ket.reimbursements || [];
                                        const approvedReimbs = childReimbursements
                                          .filter((r: any) => VALID_REIMB_STATUSES.includes(r.status))
                                          .sort(
                                            (a: any, b: any) =>
                                              getStatusRank(a.status) - getStatusRank(b.status)
                                          );

                                        const realisasiKet = calculateKetRealisasi(ket);
                                        const sisaKet = alokasiKet - realisasiKet;
                                        const ketKey = `${subKey}-${idxKet}`;
                                        const isKetOpen = expandedKet[ketKey] ?? true;

                                        return (
                                          <div key={ket.id || idxKet} className="flex flex-col">
                                            {/* KET row */}
                                            <div
                                              onClick={() =>
                                                setExpandedKet((prev) => ({
                                                  ...prev,
                                                  [ketKey]: !isKetOpen,
                                                }))
                                              }
                                              className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg cursor-pointer select-none transition"
                                            >
                                              {/* Left: Ket name */}
                                              <div className="flex-1 min-w-[280px] pl-14 flex items-center gap-2 pr-2">
                                                <div className="p-0.5 shrink-0 text-[#6A6660]">
                                                  {isKetOpen ? (
                                                    <ChevronDown size={12} className="shrink-0" />
                                                  ) : (
                                                    <ChevronRight size={12} className="shrink-0" />
                                                  )}
                                                </div>
                                                <span className="text-[10px] font-bold text-[#9A948B] uppercase tracking-[0.2px] shrink-0 font-sans">
                                                  KET
                                                </span>
                                                <span className="text-[12px] font-normal text-[#6A6660] truncate font-sans">
                                                  · {ket.keterangan || ket.nama}
                                                </span>
                                              </div>

                                              {/* Column 2: REALISASI */}
                                              <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-normal text-[#6A6660]">
                                                {formatFullCurrency(realisasiKet)}
                                              </div>

                                              {/* Column 3: ALOKASI */}
                                              <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-normal text-[#6A6660]">
                                                {formatFullCurrency(alokasiKet)}
                                              </div>

                                              {/* Column 4: SISA */}
                                              <div
                                                className={`w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold ${sisaKet < 0 ? "text-[#902F33]" : "text-[#005836]"
                                                  }`}
                                              >
                                                {formatSisaCurrency(sisaKet)}
                                              </div>
                                            </div>

                                            {/* REIMB / REAL rows */}
                                            {isKetOpen && (
                                              <div className="flex flex-col">
                                                {approvedReimbs.length === 0 ? (
                                                  <div className="pl-20 py-1.5 text-[11px] text-[#9A948B] italic font-sans">
                                                    Belum ada realisasi reimbursement.
                                                  </div>
                                                ) : (
                                                  approvedReimbs.map((reimb: any) => {
                                                    const ocrObj =
                                                      reimb.ocrData && typeof reimb.ocrData === "object"
                                                        ? reimb.ocrData
                                                        : {};
                                                    const reimbName =
                                                      ocrObj.merchant ||
                                                      ocrObj.keterangan ||
                                                      ocrObj.namaVendor ||
                                                      null;
                                                    const displayName =
                                                      reimb.merchant ||
                                                      reimb.keterangan ||
                                                      reimb.nama ||
                                                      reimbName ||
                                                      "Pengeluaran";
                                                    const dateStr = formatReimbursementDate(reimb);
                                                    const displayStatus = statusLabel(reimb.status);

                                                    return (
                                                      <div
                                                        key={reimb.id}
                                                        className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg transition"
                                                      >
                                                        {/* Left: Badge + Merchant + Date + Status */}
                                                        <div
                                                          className="flex-1 min-w-[280px] pl-20 flex items-center gap-2 pr-2"
                                                          title={displayName}
                                                        >
                                                          <span
                                                            className={`text-[9.5px] font-bold uppercase shrink-0 font-sans ${reimb.tipe === "Realisasi Anggaran"
                                                              ? "text-[#483E90]"
                                                              : "text-[#005D8D]"
                                                              }`}
                                                          >
                                                            {reimbType(reimb.tipe)}
                                                          </span>
                                                          <span
                                                            className="text-[11.5px] text-[#9A948B] font-normal truncate font-sans"
                                                            title={displayName}
                                                          >
                                                            · {displayName} · {dateStr}
                                                          </span>
                                                          <span
                                                            className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 font-sans ${displayStatus === "Dicairkan"
                                                              ? "bg-[rgba(0,145,98,0.12)] text-[#005836]"
                                                              : displayStatus === "Menunggu PM"
                                                                ? "bg-[#FCF7F0] text-[#894C06]"
                                                                : displayStatus === "Menunggu Keuangan"
                                                                  ? "bg-[#F0F7FB] text-[#005D8D]"
                                                                  : "bg-[#FDF2F2] text-[#902F33]"
                                                              }`}
                                                          >
                                                            {displayStatus}
                                                          </span>
                                                        </div>

                                                        {/* Column 2: REALISASI with Status Icon */}
                                                        <div className="w-[145px] shrink-0 flex items-center justify-center gap-1.5">
                                                          <span
                                                            className={`text-[11px] font-mono font-normal ${displayStatus === "Dicairkan"
                                                              ? "text-[#6A6660]"
                                                              : "text-[#ADA79F]"
                                                              }`}
                                                          >
                                                            {formatFullCurrency(
                                                              Number(reimb.nominal) || 0
                                                            )}
                                                          </span>
                                                          {displayStatus === "Dicairkan" ? (
                                                            <Check
                                                              size={13}
                                                              className="text-[#009162] stroke-[2.5] shrink-0"
                                                            />
                                                          ) : displayStatus === "Menunggu PM" ? (
                                                            <Clock
                                                              size={13}
                                                              className="text-[#D8953D] shrink-0"
                                                            />
                                                          ) : displayStatus === "Menunggu Keuangan" ? (
                                                            <Clock
                                                              size={13}
                                                              className="text-[#367799] shrink-0"
                                                            />
                                                          ) : null}
                                                        </div>

                                                        {/* Columns 3, 4: Empty for reimbursement row */}
                                                        <div className="w-[145px] shrink-0" />
                                                        <div className="w-[145px] shrink-0" />
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
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center border border-stone-200 rounded-xl my-4">
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
          <div className="px-7 py-3.5 border-t border-[#E6E1D4] flex justify-end shrink-0 bg-white">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#14130F] hover:bg-stone-900 text-[#FBFAF6] text-[13px] font-semibold rounded-xl transition cursor-pointer font-sans"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {editTarget && (
        <EditAlokasiModal
          proyekId={
            typeof detailedProjectInfo?.id === "string"
              ? parseInt(detailedProjectInfo.id, 10)
              : detailedProjectInfo?.id || 0
          }
          main={{
            id: editTarget.type === "sub" ? editTarget.mainId || 0 : editTarget.id,
            nama: editTarget.nama,
            alokasi: Number(editTarget.currentAlokasi) || 0,
          }}
          subId={editTarget.type === "sub" ? editTarget.id : undefined}
          totalRAB={
            editTarget.type === "sub"
              ? Number(editTarget.totalRAB) || totalPemasukan
              : totalPemasukan
          }
          sumLain={0}
          sumSub={editTarget.totalTeralokasi || 0}
          kategoriProyek={detailedProjectInfo?.kategori || "general"}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}