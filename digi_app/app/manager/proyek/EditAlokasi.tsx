"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { formatFullRupiah } from "@/lib/format-nominal";

interface AlokasiPemasukanProps {
  proyekId: string | number;
  proyekNama: string;
  kategoriProyek?: "konstruksi" | "digital" | "event" | "general";
  isOpen?: boolean;
  dataPemasukan?: any[];
  totalPemasukan?: number;
  onClose: () => void;
  onRefresh?: () => void;
}

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

export default function AlokasiPemasukanModal({
  proyekId,
  proyekNama,
  isOpen = false,
  dataPemasukan = [],
  onClose,
}: AlokasiPemasukanProps) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [masterData, setMasterData] = useState<any[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(false);

  // Fetch master data saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    setIsMasterLoading(true);
    fetch("/api/master?tipe=pemasukan")
      .then((res) => res.json())
      .then((json) => {
        setMasterData(json.data || []);
      })
      .catch((err) => console.error("Gagal fetch master pemasukan:", err))
      .finally(() => setIsMasterLoading(false));
  }, [isOpen]);

  useEffect(() => {
    setExpandedMain({});
  }, [proyekId]);

  function cariAlokasiMain(namaMain: string) {
    const found = (dataPemasukan || []).find(
      (m: any) => (m.namaMain || "").toLowerCase() === namaMain.toLowerCase()
    );
    return found || null;
  }

  if (!isOpen) return null;

  const toggleMain = (id: number) => setExpandedMain((p) => ({ ...p, [id]: !p[id] }));

  // Master main yang sudah terpilih / dialokasikan di proyek
  const selectedMasterData = masterData.filter((main: any) => Boolean(cariAlokasiMain(main.nama)));

  return (
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
              Detail Pemasukan
            </h3>
            <p className="text-[13px] text-[#6A6660] leading-[19.5px] mt-0.5 font-sans">
              {proyekNama}
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

        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          {/* Sticky Table Header */}
          <div className="sticky top-0 z-10 px-7 pt-3.5 pb-2.5 border-b border-[#E6E1D4] flex items-center shrink-0 bg-white">
            <div className="flex-1 min-w-[280px] text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              MAIN · SUB
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

          {/* Scrollable rows content */}
          <div className="px-7 py-3 flex flex-col gap-2">
            {isMasterLoading ? (
              <div className="p-12 text-center text-[#9A948B] text-xs font-sans">
                Memuat data master...
              </div>
            ) : selectedMasterData.length === 0 ? (
              <div className="p-12 text-center border border-stone-200 rounded-xl my-4">
                <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">
                  Data Pemasukan Kosong
                </div>
                <div className="font-sans text-xs text-stone-400">
                  Belum ada data nilai proyek atau pos alokasi pemasukan yang diinisialisasi.
                </div>
              </div>
            ) : (
              selectedMasterData.map((main: any, idxMain: number) => {
              const isMainOpen = expandedMain[main.id] ?? true;

              const alokasiMainObj = cariAlokasiMain(main.nama);
              const mainAlokasi = Number(alokasiMainObj?.nominalAlokasi) || 0;
              const mainTerpakai = Number(alokasiMainObj?.nominalTerpakai) || 0;
              const sisaMain = mainAlokasi - mainTerpakai;
              const isLast = idxMain === selectedMasterData.length - 1;

              return (
                <div
                  key={main.id}
                  className={`flex flex-col ${!isLast ? "pb-1 border-b border-[#E6E1D4]" : ""}`}
                >
                  {/* MAIN row */}
                  <div
                    onClick={() => toggleMain(main.id)}
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
                        · {main.nama}
                      </span>
                    </div>

                    {/* Column 2: REALISASI */}
                    <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold text-[#14130F]">
                      {formatFullCurrency(mainTerpakai)}
                    </div>

                    {/* Column 3: ALOKASI */}
                    <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold text-[#14130F]">
                      {formatFullCurrency(mainAlokasi)}
                    </div>

                    {/* Column 4: SISA */}
                    <div
                      className={`w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold ${
                        sisaMain < 0 ? "text-[#902F33]" : "text-[#005836]"
                      }`}
                    >
                      {formatSisaCurrency(sisaMain)}
                    </div>
                  </div>

                  {/* SUB rows */}
                  {isMainOpen && (
                    <div className="flex flex-col">
                      {(alokasiMainObj?.subAnggaran || []).length === 0 ? (
                        <div className="pl-7 py-2 text-[12px] text-[#9A948B] font-sans font-normal">
                          Belum ada rincian sub pemasukan.
                        </div>
                      ) : (
                        (alokasiMainObj?.subAnggaran || []).map((sub: any, idxSub: number) => {
                          const subAlokasi = Number(sub.nominalAlokasi) || 0;
                          const subTerpakai = Number(sub.nominalTerpakai) || 0;
                          const sisaSub = subAlokasi - subTerpakai;

                          return (
                            <div
                              key={sub.id || idxSub}
                              className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg transition"
                            >
                              {/* Left: Sub pos name */}
                              <div className="flex-1 min-w-[280px] pl-7 flex items-center gap-2 pr-2">
                                <span className="text-[10.5px] font-bold text-[#9A948B] uppercase tracking-[0.2px] shrink-0 font-sans">
                                  SUB
                                </span>
                                <span className="text-[12.5px] font-semibold text-[#14130F] truncate font-sans">
                                  · {sub.namaSub || sub.nama}
                                </span>
                              </div>

                              {/* Column 2: REALISASI */}
                              <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-medium text-[#6A6660]">
                                {formatFullCurrency(subTerpakai)}
                              </div>

                              {/* Column 3: ALOKASI */}
                              <div className="w-[145px] shrink-0 text-center font-mono text-[12.5px] font-medium text-[#6A6660]">
                                {formatFullCurrency(subAlokasi)}
                              </div>

                              {/* Column 4: SISA */}
                              <div
                                className={`w-[145px] shrink-0 text-center font-mono text-[12.5px] font-semibold ${
                                  sisaSub < 0 ? "text-[#902F33]" : "text-[#005836]"
                                }`}
                              >
                                {formatSisaCurrency(sisaSub)}
                              </div>
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
  );
}