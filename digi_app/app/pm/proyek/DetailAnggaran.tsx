"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Settings, X, Check, Clock, FileSpreadsheet, Loader2 } from "lucide-react";
import EditAlokasiModal, { type EditTarget } from "./EditAlokasi";
import PerubahanAlokasiModal from "./PerubahanAlokasiModal";
import CompactNominal from "@/components/compact-nominal";
import { formatReimbursementDate } from "@/lib/proyek-utils";

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
    tipe?: string;
    ocrData?: any;
    merchant?: string;
    keterangan?: string;
    createdAt?: string;
  }[];
};

type SubPosItem = {
  id: number;
  nama: string;
  kode?: string | null;
  alokasi: number;
  realisasi: number;
  keterangan: KeteranganPos[];
};

type MainPosItem = {
  id: number;
  nama: string;
  kode?: string | null;
  alokasi: number;
  realisasi: number;
  subPos: SubPosItem[];
};

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
  if (["APPROVED", "PAID", "DISBURSED"].includes(status)) return 1;
  if (["SUBMITTED"].includes(status)) return 2;
  if (["APPROVED_BY_PM", "PENDING"].includes(status)) return 3;
  return 4;
}

function reimbType(s?: string): string {
  const map: Record<string, string> = {
    "Realisasi Anggaran": "REAL",
    Reimbursement: "REIMB",
  };
  return (s && map[s]) || s || "REIMB";
}

export default function DetailAnggaranModal({
  proyekId,
  proyekNama,
  posAnggaran,
  totalRAB,
  totalAlokasiPemasukan = 0,
  onClose,
  onRefresh,
}: {
  proyekId: number;
  proyekNama: string;
  posAnggaran: any[];
  totalRAB?: number;
  totalAlokasiPemasukan?: number;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [expandedMain, setExpandedMain] = useState<Record<number, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<number, boolean>>({});
  const [expandedKet, setExpandedKet] = useState<Record<number, boolean>>({});
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [perubahanTarget, setPerubahanTarget] = useState<{
    id: number;
    nama: string;
    alokasi: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!proyekId) return;
    try {
      setIsExporting(true);
      const res = await fetch(`/api/proyek/${proyekId}/budget/laporan`);
      if (!res.ok) {
        throw new Error("Gagal mengunduh laporan Excel");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Detail_Anggaran_${(proyekNama || "Proyek").replace(/\s+/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const [pengajuanStatus, setPengajuanStatus] = useState<
    Record<number, { status: string }>
  >({});

  const fetchPengajuan = async (pId: number) => {
    try {
      const res = await fetch(`/api/proyek/${pId}/pengajuan-anggaran`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<number, { status: string }> = {};
      (data.pengajuan || []).forEach((p: any) => {
        if (p.mainAnggaranId != null && map[p.mainAnggaranId] == null) {
          map[p.mainAnggaranId] = { status: p.status };
        }
      });
      setPengajuanStatus(map);
    } catch { }
  };

  useEffect(() => {
    if (proyekId) {
      fetchPengajuan(proyekId);
    }
  }, [proyekId]);

  const toggleMain = (id: number) =>
    setExpandedMain((p) => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: number) =>
    setExpandedSub((p) => ({ ...p, [id]: !p[id] }));
  const toggleKet = (id: number) =>
    setExpandedKet((p) => ({ ...p, [id]: !p[id] }));

  const mapped: MainPosItem[] = useMemo(() => {
    const sortedPosAnggaran = [...(posAnggaran || [])]
      .filter((m: any) => !m.tipe || m.tipe.toLowerCase() === "pengeluaran")
      .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

    return sortedPosAnggaran.map((main) => {
      const sortedSubAnggaran = [...(main.subAnggaran || [])]
        .filter((s: any) => !s.tipe || s.tipe.toLowerCase() === "pengeluaran")
        .sort((a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0));

      const subPos = sortedSubAnggaran.map((sub: any) => {
        const sortedKeterangan = [...(sub.keterangan || [])].sort(
          (a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0)
        );

        const keterangan = sortedKeterangan.map((ket: any) => {
          const childReimbursements = ket.reimbursements || [];

          const approvedReimbs = childReimbursements
            .filter((r: any) =>
              ["APPROVED", "APPROVED_BY_PM", "SUBMITTED", "PAID", "DISBURSED"].includes(r.status)
            )
            .sort((a: any, b: any) => getStatusRank(a.status) - getStatusRank(b.status));
          const hasReimbs = approvedReimbs.length > 0;

          const disbursedReimbs = childReimbursements.filter((r: any) =>
            ["APPROVED", "PAID", "DISBURSED"].includes(r.status)
          );
          const ketRealisasi = hasReimbs
            ? disbursedReimbs.reduce((acc: number, r: any) => acc + (parseFloat(r.nominal) || 0), 0)
            : parseFloat(ket.nominalRealisasi) || parseFloat(ket.realisasi) || 0;

          return {
            id: ket.id,
            nama: ket.keterangan || ket.nama,
            alokasi: parseFloat(ket.nominalAlokasi) || parseFloat(ket.alokasi) || 0,
            realisasi: ketRealisasi,
            reimbs: approvedReimbs,
          };
        });

        const subRealisasi = keterangan.reduce(
          (acc: number, k: any) => acc + (Number(k.realisasi) || 0),
          0
        );

        return {
          id: sub.id,
          nama: sub.namaSub || sub.nama,
          kode: sub.kode || null,
          alokasi: parseFloat(sub.nominalAlokasi) || parseFloat(sub.alokasi) || 0,
          realisasi: subRealisasi,
          keterangan,
        };
      });

      const mainRealisasi = subPos.reduce(
        (acc: number, s: any) => acc + (Number(s.realisasi) || 0),
        0
      );

      return {
        id: main.id,
        nama: main.namaPos || main.nama || main.deskripsi,
        kode: main.kode || null,
        alokasi: parseFloat(main.nominalAlokasi) || parseFloat(main.alokasi) || 0,
        realisasi: mainRealisasi,
        subPos,
      };
    });
  }, [posAnggaran]);

  useEffect(() => {
    if (mapped.length > 0 && Object.keys(expandedMain).length === 0) {
      const initialMainState: Record<number, boolean> = {};
      const initialSubState: Record<number, boolean> = {};
      const initialKetState: Record<number, boolean> = {};
      mapped.forEach((m) => {
        initialMainState[m.id] = true;
        m.subPos.forEach((s) => {
          initialSubState[s.id] = true;
          s.keterangan.forEach((k) => {
            initialKetState[k.id] = true;
          });
        });
      });
      setExpandedMain(initialMainState);
      setExpandedSub(initialSubState);
      setExpandedKet(initialKetState);
    }
  }, [mapped, expandedMain]);

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
          <div className="px-7 pt-[22px] pb-[18px] border-b border-[#E6E1D4] flex items-start justify-between shrink-0 bg-white">
            <div className="flex flex-col">
              <h3 className="text-[19px] font-bold text-[#14130F] leading-[28.5px] font-sans">
                Detail Anggaran
              </h3>
              <p className="text-[13px] text-[#6A6660] leading-[19.5px] mt-0.5 font-sans">
                {proyekNama || "-"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                title="Export seluruh rincian anggaran ke file Excel"
              >
                {isExporting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={13} />
                )}
                <span>Export Excel</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-[#2C2A24] hover:bg-[#F1EEE6] rounded-xl transition cursor-pointer ml-1"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
            <div className="sticky top-0 z-10 px-7 pt-3.5 pb-2.5 border-b border-[#E6E1D4] flex items-center shrink-0 bg-white">
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
              <div className="w-[125px] shrink-0 text-center text-[10.5px] font-bold text-[#9A948B] tracking-[0.63px] uppercase font-sans">
                AKSI
              </div>
            </div>

            <div className="px-7 py-3 flex flex-col gap-2">
              {mapped.length === 0 ? (
                <div className="p-12 text-center border border-stone-200 rounded-xl my-4">
                  <div className="font-sans font-bold text-sm text-stone-900 mb-1.5">
                    Data Pos Anggaran Kosong
                  </div>
                  <div className="font-sans text-xs text-stone-400">
                    Belum ada pos anggaran yang diinisialisasi untuk proyek ini.
                  </div>
                </div>
              ) : (
                mapped.map((main, idxMain) => {
                const isMainOpen = expandedMain[main.id] ?? true;
                const mainSisa = main.alokasi - main.realisasi;
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
                          · {main.kode ? `(${main.kode}) ${main.nama}` : main.nama}
                        </span>
                      </div>

                      <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-semibold text-[#14130F]">
                        <CompactNominal value={main.realisasi} />
                      </div>

                      <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-semibold text-[#14130F]">
                        <CompactNominal value={main.alokasi} />
                      </div>

                      <div
                        className={`w-[145px] shrink-0 text-center  text-[12.5px] font-semibold ${mainSisa < 0 ? "text-[#902F33]" : "text-[#005836]"
                          }`}
                      >
                        <CompactNominal value={mainSisa} />
                      </div>

                      <div className="w-[125px] shrink-0 flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPerubahanTarget({
                              id: main.id,
                              nama: main.nama,
                              alokasi: main.alokasi || 0,
                            });
                          }}
                          className="h-7 px-2 py-1 bg-[#FCF7F0] rounded-md outline outline-[0.8px] outline-[#894C06] -outline-offset-1 inline-flex items-center justify-center gap-1 text-[#894C06] text-[10.5px] font-semibold hover:bg-[#F7EEE0] transition cursor-pointer font-sans"
                        >
                          <Settings size={11} className="stroke-[2] shrink-0" />
                          <span>Ajukan Alokasi</span>
                        </button>
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
                            const subSisa = sub.alokasi - sub.realisasi;

                            return (
                              <div key={sub.id} className="flex flex-col">
                                <div
                                  onClick={() => toggleSub(sub.id)}
                                  className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg cursor-pointer select-none transition"
                                >
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
                                      · {sub.kode ? `(${sub.kode}) ${sub.nama}` : sub.nama}
                                    </span>
                                  </div>

                                  <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-medium text-[#6A6660]">
                                    <CompactNominal value={sub.realisasi} />
                                  </div>

                                  <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-medium text-[#6A6660]">
                                    <CompactNominal value={sub.alokasi} />
                                  </div>

                                  <div
                                    className={`w-[145px] shrink-0 text-center  text-[12.5px] font-semibold ${subSisa < 0 ? "text-[#902F33]" : "text-[#005836]"
                                      }`}
                                  >
                                    <CompactNominal value={subSisa} />
                                  </div>

                                  <div className="w-[125px] shrink-0 flex justify-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const totalTeralokasi = main.subPos.reduce(
                                          (s, s2) => s + (s2.alokasi || 0),
                                          0
                                        );
                                        const totalChildrenAlokasi = sub.keterangan.reduce(
                                          (s, k) => s + (k.alokasi || 0),
                                          0
                                        );
                                        setEditTarget({
                                          type: "sub",
                                          id: sub.id,
                                          nama: sub.nama,
                                          parentNama: main.nama,
                                          currentAlokasi: sub.alokasi || 0,
                                          totalRAB: main.alokasi || 0,
                                          totalTeralokasi,
                                          totalChildrenAlokasi,
                                        });
                                      }}
                                      className="h-7 px-2 py-1 bg-[#EEF6F2] rounded-md outline outline-[0.8px] outline-[#005836] -outline-offset-1 inline-flex items-center justify-center gap-1 text-[#005836] text-[10.5px] font-semibold hover:bg-[#DDF0E6] transition cursor-pointer font-sans"
                                    >
                                      <Settings size={11} className="stroke-[2] shrink-0" />
                                      <span>Edit Alokasi</span>
                                    </button>
                                  </div>
                                </div>

                                {isSubOpen && (
                                  <div className="flex flex-col">
                                    {sub.keterangan.length === 0 ? (
                                      <div className="pl-14 py-1.5 text-[12px] text-[#9A948B] italic font-sans">
                                        Belum ada pos keterangan.
                                      </div>
                                    ) : (
                                      sub.keterangan.map((ket) => {
                                        const isKetOpen = expandedKet[ket.id] ?? true;
                                        const ketSisa = ket.alokasi - ket.realisasi;

                                        return (
                                          <div key={ket.id} className="flex flex-col">
                                            <div
                                              onClick={() => toggleKet(ket.id)}
                                              className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg cursor-pointer select-none transition"
                                            >
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
                                                  · {ket.nama}
                                                </span>
                                              </div>

                                              <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-normal text-[#6A6660]">
                                                <CompactNominal value={ket.realisasi} />
                                              </div>

                                              <div className="w-[145px] shrink-0 text-center  text-[12.5px] font-normal text-[#6A6660]">
                                                <CompactNominal value={ket.alokasi} />
                                              </div>

                                              <div
                                                className={`w-[145px] shrink-0 text-center  text-[12.5px] font-semibold ${ketSisa < 0 ? "text-[#902F33]" : "text-[#005836]"
                                                  }`}
                                              >
                                                <CompactNominal value={ketSisa} />
                                              </div>

                                              <div className="w-[125px] shrink-0 flex justify-center">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const totalTeralokasi = sub.keterangan.reduce(
                                                      (s, k) => s + (k.alokasi || 0),
                                                      0
                                                    );
                                                    setEditTarget({
                                                      type: "ket",
                                                      id: ket.id,
                                                      nama: ket.nama,
                                                      parentNama: sub.nama,
                                                      currentAlokasi: ket.alokasi || 0,
                                                      totalRAB: sub.alokasi || 0,
                                                      totalTeralokasi,
                                                      totalChildrenAlokasi: 0,
                                                    });
                                                  }}
                                                  className="h-7 px-2 py-1 bg-[#F0F7FB] rounded-md outline outline-[0.8px] outline-[#005D8D] -outline-offset-1 inline-flex items-center justify-center gap-1 text-[#005D8D] text-[10.5px] font-semibold hover:bg-[#E0EFF7] transition cursor-pointer font-sans"
                                                >
                                                  <Settings size={11} className="stroke-[2] shrink-0" />
                                                  <span>Edit Alokasi</span>
                                                </button>
                                              </div>
                                            </div>

                                            {isKetOpen && (
                                              <div className="flex flex-col">
                                                {ket.reimbs.length === 0 ? (
                                                  <div className="pl-20 py-1.5 text-[11px] text-[#9A948B] italic font-sans">
                                                    Belum ada realisasi reimbursement.
                                                  </div>
                                                ) : (
                                                  ket.reimbs.map((reimb: any) => {
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
                                                      "Biaya";
                                                    const dateStr = formatReimbursementDate(reimb);
                                                    const displayStatus = statusLabel(reimb.status);

                                                    return (
                                                      <div
                                                        key={reimb.id}
                                                        className="py-1.5 flex items-center hover:bg-stone-50/70 rounded-lg transition"
                                                      >
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

                                                        <div className="w-[145px] shrink-0 flex items-center justify-center gap-1.5">
                                                          <span
                                                            className={`text-[11px]  font-normal ${displayStatus === "Dicairkan"
                                                                ? "text-[#6A6660]"
                                                                : "text-[#ADA79F]"
                                                              }`}
                                                          >
                                                            <CompactNominal value={Number(reimb.nominal) || 0} />
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

                                                        <div className="w-[145px] shrink-0" />
                                                        <div className="w-[145px] shrink-0" />
                                                        <div className="w-[125px] shrink-0" />
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

      {editTarget && (
        <EditAlokasiModal
          target={editTarget}
          proyekId={proyekId}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {perubahanTarget && (
        <PerubahanAlokasiModal
          proyekId={proyekId}
          main={perubahanTarget}
          totalRAB={totalRAB || mapped.reduce((s, m) => s + (m.alokasi || 0), 0)}
          sumLain={
            mapped.reduce((s, m) => s + (m.alokasi || 0), 0) +
            totalAlokasiPemasukan -
            (perubahanTarget.alokasi || 0)
          }
          sumSub={
            mapped
              .find((m) => m.id === perubahanTarget.id)
              ?.subPos.reduce((s, s2) => s + (s2.alokasi || 0), 0) || 0
          }
          isBlocked={pengajuanStatus[perubahanTarget.id]?.status === "PENDING"}
          onClose={() => setPerubahanTarget(null)}
          onSuccess={() => {
            setPerubahanTarget(null);
            fetchPengajuan(proyekId);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}