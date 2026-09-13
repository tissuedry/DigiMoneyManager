"use client";

import React from "react";
import { X, History, CheckCircle2, Clock, XCircle, ArrowRight, User } from "lucide-react";
import CompactNominal from "@/components/compact-nominal";

export type PengajuanHistoryItem = {
  id: number;
  proyekId: number;
  mainAnggaranId: number;
  judul: string;
  deskripsi?: string | null;
  status: string; // PENDING | DISETUJUI | REJECT
  catatan?: string | null;
  alokasiLama: string | number;
  alokasiBaru: string | number;
  createdAt: string;
  processedAt?: string | null;
  pengaju?: {
    id: number;
    nama: string;
  } | null;
};

interface RiwayatPengajuanModalProps {
  open: boolean;
  mainNama: string;
  mainKode?: string | null;
  history: PengajuanHistoryItem[];
  onClose: () => void;
}

function formatDate(isoStr?: string | null) {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

export default function RiwayatPengajuanModal({
  open,
  mainNama,
  mainKode,
  history,
  onClose,
}: RiwayatPengajuanModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(20,18,14,0.6)] p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_24px_64px_rgba(20,18,14,0.3)] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6E1D4] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-sans text-[16px] font-bold text-[#14130F]">
                Riwayat Perubahan Alokasi
              </h3>
              <p className="font-sans text-[12px] text-[#6A6660]">
                {mainKode ? `(${mainKode}) ` : ""}
                {mainNama}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {history.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl">
              <History size={32} className="mx-auto mb-2 text-stone-300" />
              <div className="font-sans font-semibold text-sm text-stone-700">
                Belum Ada Riwayat Perubahan
              </div>
              <div className="font-sans text-xs text-stone-400 mt-0.5">
                Belum pernah ada pengajuan perubahan alokasi untuk pos anggaran ini.
              </div>
            </div>
          ) : (
            history.map((item) => {
              const lama = Number(item.alokasiLama);
              const baru = Number(item.alokasiBaru);
              const selisih = baru - lama;

              let statusBadge = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={12} /> Menunggu Review
                </span>
              );

              if (item.status === "DISETUJUI") {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} /> Disetujui
                  </span>
                );
              } else if (item.status === "REJECT") {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle size={12} /> Ditolak
                  </span>
                );
              }

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E6E1D4] bg-white p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {statusBadge}
                        <span className="text-[11.5px] text-stone-400 font-sans">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {item.pengaju && (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-stone-600 font-sans">
                        <User size={13} className="text-stone-400" />
                        <span>Diajukan: {item.pengaju.nama}</span>
                      </div>
                    )}
                  </div>

                  {/* Nominal Change */}
                  <div className="flex items-center gap-2.5 bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                    <div className="flex-1 text-center">
                      <span className="block text-[10px] uppercase font-bold text-stone-400 font-sans">
                        Alokasi Lama
                      </span>
                      <span className="text-[13px] font-semibold text-stone-700 line-through">
                        <CompactNominal value={lama} />
                      </span>
                    </div>

                    <ArrowRight size={15} className="text-stone-400 shrink-0" />

                    <div className="flex-1 text-center">
                      <span className="block text-[10px] uppercase font-bold text-stone-400 font-sans">
                        Alokasi Baru
                      </span>
                      <span className="text-[13px] font-bold text-emerald-800">
                        <CompactNominal value={baru} />
                      </span>
                    </div>

                    <div className="flex-1 text-center border-l border-stone-200 pl-2">
                      <span className="block text-[10px] uppercase font-bold text-stone-400 font-sans">
                        Selisih
                      </span>
                      <span
                        className={`text-[12.5px] font-semibold ${
                          selisih >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {selisih >= 0 ? "+" : ""}
                        <CompactNominal value={selisih} />
                      </span>
                    </div>
                  </div>

                  {/* Notes & Description */}
                  {(item.deskripsi || item.catatan) && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 text-[12px] font-sans space-y-1">
                      {item.deskripsi && (
                        <div className="text-stone-600">
                          <span className="font-semibold text-stone-700">Alasan PM: </span>
                          <span>{item.deskripsi}</span>
                        </div>
                      )}
                      {item.catatan && (
                        <div className="text-amber-800 bg-amber-50/70 px-2.5 py-1.5 rounded-lg border border-amber-100">
                          <span className="font-semibold">Catatan Reviewer: </span>
                          <span>{item.catatan}</span>
                        </div>
                      )}
                      {item.processedAt && (
                        <div className="text-[10.5px] text-stone-400 pt-0.5">
                          Diproses pada: {formatDate(item.processedAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#E6E1D4] px-6 py-3.5 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#14130F] hover:bg-stone-900 text-[#FBFAF6] text-[12.5px] font-semibold rounded-xl transition cursor-pointer font-sans"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
