"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Wallet, FileSpreadsheet, Loader2 } from "lucide-react";
import Toast from "@/components/toast";
import CompactNominal from "@/components/compact-nominal";
import { getStatusStyles } from "@/lib/proyek-utils";
import type { Proyek } from "./types";

export default function ProyekCard({ proyek }: { proyek: Proyek }) {
  const [expanded, setExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const budget = proyek.budget;
  const posPengeluaran = budget?.posAnggaran.filter((p) => p.tipe !== "pendapatan") ?? [];
  const totalAnggaran = posPengeluaran.reduce((sum, p) => sum + Number(p.nominalAlokasi || 0), 0);
  const rab = totalAnggaran > 0 ? totalAnggaran : (budget ? Number(budget.nilaiKontrak) : 0);
  const terpakai = budget ? Number(budget.totalPengeluaran) : 0;
  const sisa = Math.max(0, rab - terpakai);
  const pct = rab > 0 ? Math.min((terpakai / rab) * 100, 100) : 0;

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const res = await fetch(`/api/proyek/${proyek.id}/budget/laporan`);
      if (!res.ok) throw new Error("Gagal export excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Budget_${proyek.nama.replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error", error);
      setToastError("Gagal mengunduh Excel. Pastikan data budget valid.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {(proyek.nomorRegister || (proyek as any).kode) && (
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {proyek.nomorRegister || (proyek as any).kode}
                    </span>
                  )}
                  <p className="text-[14px] font-bold text-stone-900 leading-tight truncate">{proyek.nama}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyles(proyek.status)}`}
                  >
                    {proyek.status}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {new Date(proyek.tanggalMulai).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {budget ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                    Export
                  </button>
                </div>
              ) : (
                ""
              )}
            </div>

            {budget ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Total Nilai Anggaran</p>
                  <p className="text-[15px] font-extrabold text-stone-900 whitespace-nowrap">
                    <CompactNominal value={rab} className="text-[15px] font-extrabold text-stone-900" />
                  </p>
                </div>

                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-[#008f5d] transition-all duration-500"
                  />
                  {rab - terpakai > 0 && (
                    <div
                      style={{ width: `${100 - pct}%` }}
                      className="h-full bg-stone-100"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#008f5d] shrink-0" />
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">REALISASI</p>
                    </div>
                    <p className="text-lg font-extrabold text-stone-900 mt-1.5 whitespace-nowrap pl-4.5">
                      <CompactNominal value={terpakai} className="text-lg font-extrabold text-stone-900" />
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-stone-400 shrink-0" />
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">SISA</p>
                    </div>
                    <p className="text-lg font-extrabold text-stone-900 mt-1.5 whitespace-nowrap pl-4.5">
                      <CompactNominal value={sisa} className="text-lg font-extrabold text-stone-900" />
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition cursor-pointer"
                >
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expanded ? "Sembunyikan" : "Lihat"} pos anggaran ({posPengeluaran.length})
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} className="text-amber-500" />
                Budget belum diinisialisasi
              </p>
            )}
          </div>
        </div>

        {expanded && posPengeluaran.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-6">
            {posPengeluaran.map((pos, index) => {
              const aloc = Number(pos.nominalAlokasi);
              const pakai = Number(pos.nominalTerpakai);
              const sisa = Math.max(0, aloc - pakai);
              const posPct = aloc > 0 ? Math.round((pakai / aloc) * 100) : 0;

              let barColor = "bg-[#00966c]";
              if (posPct >= 90) {
                barColor = "bg-[#d65f5f]";
              } else if (posPct >= 80) {
                barColor = "bg-[#d4a373]";
              }

              return (
                <div key={pos.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[14px] font-bold text-stone-800 leading-tight">
                        {pos.namaPos}
                      </h4>
                      <span className="text-[10px] font-bold text-stone-400">
                        POS-{201 + index}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-black text-stone-900 ">
                        <CompactNominal value={pakai} compactThreshold={1_000_000} />
                      </span>
                      <span className="text-[10px] text-stone-400 block font-medium mt-0.5">
                        dari <CompactNominal value={aloc} compactThreshold={1_000_000} />
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-stone-100/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                      style={{ width: `${Math.min(posPct, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium pt-0.5">
                    <span className="font-semibold" style={{ color: posPct >= 90 ? '#d65f5f' : posPct >= 80 ? '#d4a373' : '#00966c' }}>
                      {posPct}% terpakai
                    </span>
                    <span>
                      Sisa <b className="text-stone-700 font-bold"><CompactNominal value={sisa} compactThreshold={1_000_000} /></b>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast
        open={!!toastError}
        variant="error"
        message={toastError || ""}
        onClose={() => setToastError(null)}
      />
    </>
  );
}
