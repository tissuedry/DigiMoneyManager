"use client";

import { AlertCircle, Wallet } from "lucide-react";
import CompactNominal from "@/components/compact-nominal";
import type { Proyek } from "@/app/keuangan/budget/types";

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

export default function ProyekCard({
  proyek,
  onClick,
}: {
  proyek: Proyek;
  onClick: (proyek: Proyek) => void;
}) {
  const budget = proyek.budget;
  const rab = budget ? Number(budget.nilaiKontrak) : 0;
  const terpakai = budget ? Number(budget.totalPengeluaran) : 0;

  const mainPemasukanList = (budget?.posAnggaran || (budget as any)?.mainAnggaran || []).filter(
    (m: any) =>
      m.tipe === "pemasukan" ||
      (m.namaMain || m.namaPos || m.deskripsi || "").toLowerCase().startsWith("penjualan") ||
      (m.namaMain || m.namaPos || m.deskripsi || "").toLowerCase().startsWith("pendapatan")
  );
  const totalMainPemasukanRealisasi = mainPemasukanList.reduce(
    (sum: number, m: any) => sum + (Number(m.nominalTerpakai || m.terpakai) || 0),
    0
  );
  const totalMainPemasukanAlokasi = mainPemasukanList.reduce(
    (sum: number, m: any) => sum + (Number(m.nominalAlokasi || m.alokasi || m.nominal) || 0),
    0
  );
  const pendapatan = budget
    ? (totalMainPemasukanRealisasi > 0
        ? totalMainPemasukanRealisasi
        : Number((budget as any).totalMainPemasukan) ||
          (totalMainPemasukanAlokasi > 0
            ? totalMainPemasukanAlokasi
            : Number((budget as any)?.targetPemasukan) || Number((budget as any)?.totalPemasukan) || 0))
    : 0;

  const rawPengeluaranPct = rab > 0 ? (terpakai / rab) * 100 : 0;
  const rawPendapatanPct = rab > 0 ? (pendapatan / rab) * 100 : 0;

  // Pastikan segmen yang bernilai > 0 tetap terlihat jelas (minimal 2.5% / 8px)
  let pengeluaranWidth = rawPengeluaranPct > 0 ? Math.max(rawPengeluaranPct, 2.5) : 0;
  let pendapatanWidth = rawPendapatanPct > 0 ? Math.max(rawPendapatanPct, 2.5) : 0;
  const sumPct = pengeluaranWidth + pendapatanWidth;

  if (sumPct > 100) {
    pengeluaranWidth = (pengeluaranWidth / sumPct) * 100;
    pendapatanWidth = (pendapatanWidth / sumPct) * 100;
  }

  return (
    <div
      onClick={() => onClick(proyek)}
      className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer w-full p-6 sm:p-7"
    >
      {/* Card Header */}
      <div className="flex items-start gap-4 sm:gap-5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Wallet size={22} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {((proyek as any).nomorRegister || (proyek as any).kode) && (
                  <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-lg">
                    {(proyek as any).nomorRegister || (proyek as any).kode}
                  </span>
                )}
                <p className="text-[16px] sm:text-[17px] font-bold text-stone-900 leading-tight truncate">
                  {proyek.nama}
                </p>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                    proyek.status
                  )}`}
                >
                  {proyek.status}
                </span>
                <span className="text-[12px] text-stone-400 font-medium">
                  {new Date(proyek.tanggalMulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Summary */}
          {budget ? (
            <div className="mt-4 space-y-4">
              {/* Total Nilai Proyek */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Nilai Proyek
                </p>
                <p className="text-[16px] sm:text-[18px] font-extrabold text-stone-900 whitespace-nowrap">
                  <CompactNominal
                    value={rab}
                    className="text-[16px] sm:text-[18px] font-extrabold text-stone-900"
                  />
                </p>
              </div>

              {/* Stacked bar: Merah (Pengeluaran), Hijau (Pendapatan), Abu-abu (Sisa Budget) */}
              <div className="w-full bg-stone-200 h-3 sm:h-3.5 rounded-full overflow-hidden flex shadow-inner">
                {pengeluaranWidth > 0 && (
                  <div
                    style={{ width: `${pengeluaranWidth}%` }}
                    className="h-full bg-[#dc2626] transition-all duration-500 min-w-[8px]"
                    title={`Pengeluaran: Rp ${terpakai.toLocaleString("id-ID")}`}
                  />
                )}
                {pendapatanWidth > 0 && (
                  <div
                    style={{ width: `${pendapatanWidth}%` }}
                    className="h-full bg-[#008f5d] transition-all duration-500 min-w-[8px]"
                    title={`Pendapatan: Rp ${pendapatan.toLocaleString("id-ID")}`}
                  />
                )}
                {sumPct < 100 && (
                  <div
                    style={{ width: `${Math.max(0, 100 - sumPct)}%` }}
                    className="h-full bg-stone-200"
                    title={`Sisa: Rp ${Math.max(0, rab - terpakai).toLocaleString("id-ID")}`}
                  />
                )}
              </div>

              {/* Pengeluaran vs Pendapatan */}
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
                    <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      PENGELUARAN
                    </p>
                  </div>
                  <p className="text-xl sm:text-[22px] font-extrabold text-stone-900 mt-2 whitespace-nowrap pl-4.5">
                    <CompactNominal
                      value={terpakai}
                      className="text-xl sm:text-[22px] font-extrabold text-stone-900"
                    />
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#008f5d] shrink-0" />
                    <p className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      PENDAPATAN
                    </p>
                  </div>
                  <p className="text-xl sm:text-[22px] font-extrabold text-stone-900 mt-2 whitespace-nowrap pl-4.5">
                    <CompactNominal
                      value={pendapatan}
                      className="text-xl sm:text-[22px] font-extrabold text-stone-900"
                    />
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-stone-400 mt-3 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-500" />
              Budget belum diinisialisasi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
