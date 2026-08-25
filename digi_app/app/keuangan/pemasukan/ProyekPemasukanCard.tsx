"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, Plus } from "lucide-react";
import Toast from "@/components/toast";
import CompactNominal from "@/components/compact-nominal";

export type ProyekItem = {
  id: number;
  nama: string;
  deskripsi?: string | null;
  status: string;
  tanggalMulai: string;
  tanggalSelesai?: string | null;
  budget?: {
    id: number;
    nilaiKontrak?: number | string;
    rabTotal?: number | string;
    targetPemasukan?: number | string;
    totalPengeluaran?: number | string;
    totalPemasukan?: number | string;
    sisaBudget?: number | string;
    mainAnggaran?: Array<{
      id: number;
      namaMain: string;
      tipe: string;
      nominalAlokasi?: number | string;
      nominalTerpakai?: number | string;
      subAnggaran?: Array<{
        id: number;
        namaSub: string;
        nominalAlokasi?: number | string;
        nominalTerpakai?: number | string;
      }>;
    }>;
    posAnggaran?: Array<any>;
  };
};

function getStatusBadgeStyle(statusStr?: string) {
  const status = statusStr?.toUpperCase();
  if (status === "AKTIF" || status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (status === "DONE" || status === "SELESAI") {
    return "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]";
  }
  if (status === "PLANNING") {
    return "bg-[#fbf0e4] text-[#854d0e] border-[#f5e1ce]";
  }
  if (status === "CANCELLED" || status === "CANCELED" || status === "DIBATALKAN") {
    return "bg-rose-50 text-rose-800 border-rose-100";
  }
  return "bg-stone-100 text-stone-600 border-stone-200";
}

export default function ProyekPemasukanCard({
  proyek,
  onOpenRealisasi,
}: {
  proyek: ProyekItem;
  onOpenRealisasi: (proyek: ProyekItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  const budget = proyek.budget;
  // Target pemasukan bisa dari targetPemasukan atau nilaiKontrak/rabTotal
  const targetPemasukan = budget
    ? Number(budget.targetPemasukan || budget.nilaiKontrak || 0)
    : 0;
  const realisasiPemasukan = budget ? Number(budget.totalPemasukan || 0) : 0;
  const sisaPemasukan = Math.max(0, targetPemasukan - realisasiPemasukan);
  const pct = targetPemasukan > 0 ? Math.min((realisasiPemasukan / targetPemasukan) * 100, 100) : 0;

  // Ambil sub pemasukan dari budget
  const posPemasukan = (budget?.mainAnggaran?.filter((m) => m.tipe === "pendapatan") ?? []).flatMap(
    (m) =>
      (m.subAnggaran || []).map((s) => ({
        id: s.id,
        namaSub: s.namaSub,
        namaMain: m.namaMain,
        nominalAlokasi: Number(s.nominalAlokasi || m.nominalAlokasi || targetPemasukan),
        nominalTerpakai: Number(s.nominalTerpakai || m.nominalTerpakai || 0),
      }))
  );

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Card Header */}
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-stone-900 leading-tight truncate">
                  {proyek.nama}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                      proyek.status
                    )}`}
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

              {/* Tombol Aksi */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenRealisasi(proyek)}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#008f5d] hover:bg-[#00754c] text-white transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Realisasi Pendapatan
                </button>
              </div>
            </div>

            {/* Target Pemasukan Summary */}
            {budget ? (
              <div className="mt-3 space-y-3">
                {/* Total Target Pemasukan */}
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Total Target Pendapatan
                  </p>
                  <p className="text-[15px] font-extrabold text-stone-900 whitespace-nowrap">
                    <CompactNominal
                      value={targetPemasukan}
                      className="text-[15px] font-extrabold text-stone-900"
                    />
                  </p>
                </div>

                {/* Stacked bar */}
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-[#008f5d] transition-all duration-500"
                  />
                  {targetPemasukan - realisasiPemasukan > 0 && (
                    <div
                      style={{ width: `${100 - pct}%` }}
                      className="h-full bg-stone-100"
                    />
                  )}
                </div>

                {/* Realisasi vs Sisa */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#008f5d] shrink-0" />
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        REALISASI
                      </p>
                    </div>
                    <p className="text-lg font-extrabold text-stone-900 mt-1.5 whitespace-nowrap pl-4.5">
                      <CompactNominal
                        value={realisasiPemasukan}
                        className="text-lg font-extrabold text-stone-900"
                      />
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col justify-between min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-stone-400 shrink-0" />
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                        SISA
                      </p>
                    </div>
                    <p className="text-lg font-extrabold text-stone-900 mt-1.5 whitespace-nowrap pl-4.5">
                      <CompactNominal
                        value={sisaPemasukan}
                        className="text-lg font-extrabold text-stone-900"
                      />
                    </p>
                  </div>
                </div>

                {/* Expand toggle */}
                {posPemasukan.length > 0 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  >
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expanded ? "Sembunyikan" : "Lihat"} Pos Pendapatan ({posPemasukan.length})
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} className="text-amber-500" />
                Budget belum diinisialisasi
              </p>
            )}
          </div>
        </div>

        {/* Expanded Pos Pemasukan */}
        {expanded && posPemasukan.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-6">
            {posPemasukan.map((pos, index) => {
              const aloc = Number(pos.nominalAlokasi);
              const pakai = Number(pos.nominalTerpakai);
              const sisa = Math.max(0, aloc - pakai);
              const posPct = aloc > 0 ? Math.round((pakai / aloc) * 100) : 0;

              let barColor = "bg-[#00966c]";
              if (posPct >= 90) {
                barColor = "bg-[#00966c]";
              } else if (posPct >= 50) {
                barColor = "bg-[#008f5d]";
              }

              return (
                <div key={pos.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[14px] font-bold text-stone-800 leading-tight">
                        {pos.namaSub}
                      </h4>
                      <span className="text-[10px] font-bold text-stone-400">
                        {pos.namaMain} · IN-{101 + index}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-black text-stone-900">
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
                    <span className="font-semibold text-emerald-700">
                      {posPct}% terealisasi
                    </span>
                    <span>
                      Sisa{" "}
                      <b className="text-stone-700 font-bold">
                        <CompactNominal value={sisa} compactThreshold={1_000_000} />
                      </b>
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
