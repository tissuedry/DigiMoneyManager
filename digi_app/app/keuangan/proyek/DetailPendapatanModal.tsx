"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, X, Check, Clock } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { formatTanggal } from "@/lib/formatters";
import CompactNominal from "@/components/compact-nominal";

type TransaksiItem = {
  id: number;
  namaRealisasi?: string;
  keterangan?: string;
  tanggalTransaksi?: string;
  nominal: number;
  status: string;
};

type SubPosItem = {
  id: number;
  nama: string;
  alokasi: number;
  pendingNominal?: number;
  realisasi: number;
  transaksis: TransaksiItem[];
};

type MainPosItem = {
  id: number;
  nama: string;
  alokasi: number;
  realisasi: number;
  subPos: SubPosItem[];
};

export default function DetailPendapatanModal({
  proyekId,
  proyekNama,
  proyekStatus,
  posAnggaran = [],
  onClose,
}: {
  proyekId: number;
  proyekNama: string;
  proyekStatus?: string;
  posAnggaran?: any[];
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});

  const { data: transaksiData } = useApi<any>(
    `/api/pemasukan?proyekId=${proyekId}`
  );

  const transaksiList: any[] = useMemo(() => transaksiData?.data ?? [], [transaksiData]);
  const isProyekDone =
    proyekStatus?.toUpperCase() === "DONE" ||
    proyekStatus?.toUpperCase() === "SELESAI";

  const toggleMain = (id: number) =>
    setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) =>
    setExpandedSub((p) => ({ ...p, [id]: !p[id] }));

    const mapped: MainPosItem[] = useMemo(() => (posAnggaran || []).map((m: any, mIdx: number) => {
    const mainId = m.id ?? mIdx;
    const subPos: SubPosItem[] = (m.subAnggaran || []).map((s: any, sIdx: number) => {
      const subId = s.id ?? sIdx;
      const subNominal = Number(s.alokasi || s.nominalAlokasi || 0) || (m.subAnggaran?.length === 1 ? mainNominal : 0);
      const pendingNominal = Math.max(subNominal, Number(s.terpakai || s.nominalTerpakai || 0));

      const sName = (s.namaSub || s.nama || "").trim().toLowerCase();
      const isPenjualanSub =
        (sName.startsWith("penjualan") || sName.startsWith("pendapatan") || sName === (m.nama || m.namaMain || "").trim().toLowerCase()) &&
        !sName.includes("diskon") &&
        !sName.includes("retur") &&
        !sName.includes("biaya") &&
        !sName.includes("potongan");

      const relatedTransaksis: TransaksiItem[] = transaksiList.filter(
        (t: any) =>
          t.subCoaId === s.id ||
          (t.kategori || "").toLowerCase() === (s.namaSub || s.nama || "").toLowerCase() ||
          (isPenjualanSub && ["penerimaan_penjualan", "penjualan", "keuntungan_proyek"].includes((t.kategori || "").toLowerCase())) ||
          (isPenjualanSub && (t.keterangan || "").toLowerCase().includes("selesai"))
      );

      const transaksiTotal = relatedTransaksis.reduce(
        (acc: number, t: any) => acc + (Number(t.nominal) || 0),
        0
      );

      const subRealisasi = isPenjualanSub
        ? (transaksiTotal > 0
            ? transaksiTotal
            : isProyekDone
            ? pendingNominal
            : Number(s.terpakai || s.nominalTerpakai || 0))
        : transaksiTotal;

      return {
        id: subId,
        nama: s.namaSub || s.nama,
        alokasi: subNominal,
        pendingNominal,
        realisasi: subRealisasi,
        transaksis: relatedTransaksis,
      };
    });

    const mainNominal = Number(m.alokasi || m.nominalAlokasi || 0);
    const calculatedMainRealisasi = subPos.reduce(
      (acc: number, s: SubPosItem) => acc + s.realisasi,
      0
    );
    const mainRealisasi = calculatedMainRealisasi > 0
      ? calculatedMainRealisasi
      : isProyekDone
      ? mainNominal
      : 0;

    return {
      id: mainId,
      nama: m.nama || m.namaMain || m.deskripsi || "Pendapatan",
      alokasi: mainNominal,
      realisasi: mainRealisasi,
      subPos,
    };
  }), [posAnggaran, transaksiList, isProyekDone]);

  useEffect(() => {
    if (mapped.length > 0 && Object.keys(expandedMain).length === 0) {
      const initialMainState: Record<number, boolean> = {};
      const initialSubState: Record<number, boolean> = {};
      mapped.forEach((m) => {
        initialMainState[m.id] = true;
        m.subPos.forEach((s) => {
          initialSubState[s.id] = true;
        });
      });
      setExpandedMain(initialMainState);
      setExpandedSub(initialSubState);
    }
  }, [mapped.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14120E]/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] shadow-[0px_24px_64px_rgba(20,18,14,0.30)] w-full max-w-[1112px] max-h-[88vh] flex flex-col overflow-hidden text-left border border-[#E6E1D4] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-[22px] pb-[18px] border-b border-[#E6E1D4] flex items-start justify-between shrink-0 bg-white">
          <div className="flex flex-col">
            <h3 className="text-[19px] font-bold text-[#14130F] leading-[28.5px] font-sans">
              Detail Anggaran Pendapatan
            </h3>
            <p className="text-[13px] text-[#6A6660] leading-[19.5px] mt-0.5 font-sans">
              {proyekNama || "Pembangunan Proyek"}
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
          <div className="sticky top-0 z-10 px-7 pt-3.5 pb-2.5 border-b border-[#E6E1D4] flex items-center shrink-0 bg-white">
            <div className="flex-1 min-w-[280px] text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              MAIN · SUB
            </div>
            <div className="w-[160px] shrink-0 text-center text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
              REALISASI
            </div>
          </div>

          <div className="px-7 py-3 flex flex-col gap-2">
            {mapped.length === 0 ? (
              <div className="p-12 text-center border border-stone-200 rounded-xl my-4">
                <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">
                  Data Anggaran Kosong
                </div>
                <div className="font-sans text-xs text-stone-400">
                  Belum ada pos anggaran yang diinisialisasi untuk proyek ini.
                </div>
              </div>
            ) : (
              mapped.map((main, idxMain) => {
                const isMainOpen = expandedMain[main.id] ?? true;
                const isLast = idxMain === mapped.length - 1;

                return (
                  <div
                    key={main.id}
                    className={`flex flex-col ${!isLast ? "pb-1 border-b border-[#E6E1D4]" : ""}`}
                  >
                    <div
                      onClick={() => toggleMain(main.id)}
                      className="py-1.5 flex items-center hover:bg-stone-50/80 rounded-lg cursor-pointer select-none transition"
                    >
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

                      <div className="w-[160px] shrink-0 text-center  text-[12.5px] font-semibold text-[#14130F]">
                        {<CompactNominal value={main.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}
                      </div>
                    </div>

                    {isMainOpen && (
                      <div className="flex flex-col">
                        {main.subPos.length === 0 ? (
                          <div className="pl-7 py-2 text-[12px] text-[#9A948B] font-sans font-normal">
                            Belum ada rincian sub-pos.
                          </div>
                        ) : (
                          main.subPos.map((sub) => {
                            const isSubOpen = expandedSub[sub.id] ?? true;
                            const hasTransaksis = sub.transaksis && sub.transaksis.length > 0;
                            const isPenjualanSub =
                              sub.nama.toLowerCase().startsWith("penjualan") ||
                              sub.nama.toLowerCase().includes("pendapatan") ||
                              sub.nama.toLowerCase() === main.nama.toLowerCase();

                            return (
                              <div key={sub.id} className="flex flex-col">
                                <div
                                  onClick={() => toggleSub(sub.id)}
                                  className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg cursor-pointer select-none transition"
                                >
                                  <div className="flex-1 min-w-[280px] pl-7 flex items-center gap-2 pr-2">
                                    <div className="p-0.5 shrink-0 text-stone-500">
                                      {isSubOpen ? (
                                        <ChevronDown size={13} className="shrink-0 text-stone-500" />
                                      ) : (
                                        <ChevronRight size={13} className="shrink-0 text-stone-500" />
                                      )}
                                    </div>
                                    <span className="text-[10.5px] font-bold text-[#9A948B] uppercase tracking-[0.2px] shrink-0 font-sans">
                                      SUB
                                    </span>
                                    <span className="text-[12.5px] font-semibold text-[#14130F] truncate font-sans">
                                      · {sub.nama}
                                    </span>
                                  </div>

                                  <div className="w-[160px] shrink-0 text-center  text-[12.5px] font-medium text-[#6A6660]">
                                    {<CompactNominal value={sub.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}
                                  </div>
                                </div>

                                {isSubOpen && (
                                  <div className="flex flex-col">
                                    {hasTransaksis ? (
                                      sub.transaksis.map((tr: any) => {
                                        const isCompletionTx = (tr.keterangan || "").toLowerCase().includes("selesai");
                                        const labelText = isCompletionTx
                                          ? "Keuntungan Proyek"
                                          : (tr.keterangan || tr.namaRealisasi || "Realisasi Pendapatan");

                                        return (
                                          <div
                                            key={tr.id}
                                            className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg transition"
                                          >
                                            <div
                                              className="flex-1 min-w-[280px] pl-14 flex items-center gap-2 pr-2"
                                              title={tr.keterangan || tr.namaRealisasi}
                                            >
                                              <span className="text-[9.5px] font-bold uppercase shrink-0 font-sans text-[#483E90]">
                                                REAL
                                              </span>
                                              <span className="text-[11.5px] text-[#9A948B] font-normal truncate font-sans">
                                                · {labelText} · {tr.tanggalTransaksi ? formatTanggal(tr.tanggalTransaksi) : "-"}
                                              </span>
                                              <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 font-sans bg-[rgba(0,145,98,0.12)] text-[#005836]">
                                                Dicairkan
                                              </span>
                                            </div>

                                            <div className="w-[160px] shrink-0 flex items-center justify-center gap-1.5">
                                              <span className="text-[11px]  font-normal text-[#6A6660]">
                                                {<CompactNominal value={tr.nominal} compactThreshold={1_000_000_000_000} showTooltip />}
                                              </span>
                                              <Check
                                                size={13}
                                                className="text-[#009162] stroke-[2.5] shrink-0"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      isPenjualanSub && (
                                        <div className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg transition">
                                          <div className="flex-1 min-w-[280px] pl-14 flex items-center gap-2 pr-2">
                                            <span className="text-[9.5px] font-bold uppercase shrink-0 font-sans text-[#005D8D]">
                                              REAL
                                            </span>
                                            <span className="text-[11.5px] text-[#9A948B] font-normal truncate font-sans">
                                              · Keuntungan Proyek
                                            </span>
                                            {isProyekDone ? (
                                              <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 font-sans bg-[rgba(0,145,98,0.12)] text-[#005836]">
                                                Dicairkan
                                              </span>
                                            ) : (
                                              <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 font-sans bg-[#FCF7F0] text-[#894C06]">
                                                Menunggu Proyek Selesai
                                              </span>
                                            )}
                                          </div>

                                          <div className="w-[160px] shrink-0 flex items-center justify-center gap-1.5">
                                            <span className="text-[11px]  font-normal text-[#6A6660]">
                                              {<CompactNominal value={sub.pendingNominal || sub.alokasi || sub.realisasi} compactThreshold={1_000_000_000_000} showTooltip />}
                                            </span>
                                            {isProyekDone ? (
                                              <Check
                                                size={13}
                                                className="text-[#009162] stroke-[2.5] shrink-0"
                                              />
                                            ) : (
                                              <Clock size={13} className="text-[#D8953D] shrink-0" />
                                            )}
                                          </div>
                                        </div>
                                      )
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
        </div>

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
