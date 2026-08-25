import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2, Plus, ArrowDownRight, AlertCircle } from "lucide-react";
import { Project } from "./types";
import { formatRibuan, ribuanToNumber } from "@/lib/proyek-utils";

type MasterOption = {
  id: number;
  nama: string;
};

type Props = {
  showInitBudget: Project | null;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  detailedProjectInfo: any;
  rabTotal: string;
  setRabTotal: (v: string) => void;
  posAnggaranList: { deskripsi: string; nominalAlokasi: string }[];
  setPosAnggaranList: React.Dispatch<React.SetStateAction<{ deskripsi: string; nominalAlokasi: string }[]>>;
  formError: string;
  submitting: boolean;
};

export default function InitBudgetModal({
  showInitBudget,
  onClose,
  onSubmit,
  detailedProjectInfo,
  rabTotal,
  setRabTotal,
  posAnggaranList,
  setPosAnggaranList,
  formError,
  submitting,
}: Props) {
  const [pengeluaranOptions, setPengeluaranOptions] = useState<MasterOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchMasters() {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/master?tipe=pengeluaran");
        if (res.ok && isMounted) {
          const data = await res.json();
          setPengeluaranOptions(Array.isArray(data) ? data : (data.data || data.mainOptions || []));
        }
      } catch (err) {
        console.error("Gagal memuat master data pengeluaran:", err);
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    if (showInitBudget) {
      fetchMasters();
    }

    return () => {
      isMounted = false;
    };
  }, [showInitBudget?.id]);

  useEffect(() => {
    if (!showInitBudget) return;

    const existingPengeluaran =
      detailedProjectInfo?.posAnggaran ||
      detailedProjectInfo?.budget?.posAnggaran ||
      (detailedProjectInfo?.budget?.mainAnggaran ? detailedProjectInfo.budget.mainAnggaran.filter((m: any) => m.tipe !== "pemasukan") : []) ||
      [];

    const isCorrectProject = detailedProjectInfo?.id === showInitBudget.id || detailedProjectInfo?.projectId === showInitBudget.id;

    if (isCorrectProject) {
      if (Array.isArray(existingPengeluaran) && existingPengeluaran.length > 0) {
        setPosAnggaranList(
          existingPengeluaran.map((item: any) => ({
            deskripsi: item.nama || item.deskripsi || item.namaPos || item.namaMain || "",
            nominalAlokasi: formatRibuan(String(item.alokasi || item.nominalAlokasi || item.nominal || 0)),
          }))
        );
      } else {
        setPosAnggaranList([{ deskripsi: "", nominalAlokasi: "" }]);
      }

      const currentNilaiKontrak = detailedProjectInfo?.budget?.nilaiKontrak || (showInitBudget as any)?.nilaiProyek || 0;
      if (currentNilaiKontrak > 0) {
        setRabTotal(formatRibuan(String(Math.round(currentNilaiKontrak))));
      }
    } else {
      setPosAnggaranList([{ deskripsi: "", nominalAlokasi: "" }]);
    }
  }, [showInitBudget?.id, detailedProjectInfo]);

  if (!showInitBudget) return null;

  const totalNilaiProyekVal = ribuanToNumber(rabTotal) || 0;

  const totalPemasukanExisting = detailedProjectInfo?.budget?.targetPemasukan !== undefined
    ? Number(detailedProjectInfo.budget.targetPemasukan)
    : (detailedProjectInfo?.alokasiPemasukan?.reduce((acc: number, p: any) => acc + (Number(p.alokasi || p.nominalAlokasi || p.nominal) || 0), 0) || 0);

  const totalPengeluaranAllocated = posAnggaranList.reduce((acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0), 0);

  const totalAllAllocated = totalPengeluaranAllocated + totalPemasukanExisting;
  const sisaBelumDialokasikan = totalNilaiProyekVal - totalAllAllocated;
  const isOverbudget = totalAllAllocated > totalNilaiProyekVal && totalNilaiProyekVal > 0;

  const pctPengeluaran = totalNilaiProyekVal > 0 ? (totalPengeluaranAllocated / totalNilaiProyekVal) * 100 : 0;
  const pctPemasukan = totalNilaiProyekVal > 0 ? (totalPemasukanExisting / totalNilaiProyekVal) * 100 : 0;

  const selectedPengeluaran = posAnggaranList.map((p) => p.deskripsi).filter(Boolean);
  const hasDuplicatePengeluaran = new Set(selectedPengeluaran).size !== selectedPengeluaran.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDuplicatePengeluaran) return;

    const validPengeluaran = posAnggaranList
      .filter((p) => p.deskripsi.trim() !== "" && ribuanToNumber(p.nominalAlokasi) > 0)
      .map((p) => ({
        deskripsi: p.deskripsi.trim(),
        nominalAlokasi: ribuanToNumber(p.nominalAlokasi),
      }));

    onSubmit({
      nilaiKontrak: totalNilaiProyekVal,
      rabTotal: totalPengeluaranAllocated,
      posPengeluaran: validPengeluaran,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        style={{
          width: 540,
          background: "white",
          boxShadow: "0px 24px 64px rgba(20, 18, 14, 0.28)",
          overflow: "hidden",
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          animation: "fadeIn 0.2s ease",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "0.80px #E6E1D4 solid",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 700, fontSize: 17, color: "#14130F", lineHeight: "25.50px" }}>
              Alokasi Pengeluaran (RAB)
            </div>
            <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 400, fontSize: 12, color: "#9A948B", lineHeight: "18px" }}>
              {showInitBudget.nama}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 12,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="hover:bg-stone-100 transition"
          >
            <X size={16} color="#2C2A24" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "#14130F", fontSize: 12.5, fontFamily: "Plus Jakarta Sans", fontWeight: "600" }}>
                Total Nilai Proyek (Perjanjian Client)
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  height: 42,
                  background: "#F8F7F4",
                  borderRadius: 12,
                  border: "1px solid #E6E1D4",
                  paddingLeft: 12,
                  paddingRight: 12,
                }}
              >
                <span style={{ fontSize: 13.5, fontFamily: "IBM Plex Mono", fontWeight: "500", color: "#78716C", marginRight: 6 }}>Rp</span>
                <span className="font-mono font-bold text-[14px] text-stone-900">
                  {formatRibuan(String(Math.round(totalNilaiProyekVal))) || "0"}
                </span>
              </div>
            </div>

            <div
              style={{
                alignSelf: "stretch",
                padding: "14px 16px",
                background: "white",
                borderRadius: 16,
                border: "1.2px solid #E6E1D4",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div className="flex justify-between items-center text-[12px] font-bold text-stone-700">
                <span>Distribusi Nilai Proyek</span>
                <span className="font-mono text-[13px] font-black text-stone-900">
                  Rp {totalAllAllocated.toLocaleString("id-ID")} / {totalNilaiProyekVal.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${Math.min(pctPengeluaran, 100)}%` }}
                  title={`Pengeluaran (RAB): Rp ${totalPengeluaranAllocated.toLocaleString("id-ID")}`}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(pctPemasukan, 100)}%` }}
                  title={`Pemasukan (COA): Rp ${totalPemasukanExisting.toLocaleString("id-ID")}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="flex flex-col">
                  <span className="text-stone-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
                    Pengeluaran
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-[12px] mt-0.5">
                    Rp {totalPengeluaranAllocated.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Alokasi Saat Ini</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-stone-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                    Pemasukan
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-[12px] mt-0.5">
                    Rp {totalPemasukanExisting.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">Sudah Terisi (COA)</span>
                </div>

                <div className="flex flex-col text-right">
                  <span className={isOverbudget ? "text-rose-500 font-bold" : "text-stone-400 font-medium"}>
                    {isOverbudget ? "Kelebihan" : "Sisa Belum Dibagi"}
                  </span>
                  <span className={`font-mono font-bold text-[12px] mt-0.5 ${isOverbudget ? "text-rose-600" : "text-stone-900"}`}>
                    Rp {Math.abs(sisaBelumDialokasikan).toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {isOverbudget ? "Melebihi Nilai" : `Tersedia`}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12.5px] font-bold text-stone-900" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Pos Main Pengeluaran ({posAnggaranList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setPosAnggaranList([...posAnggaranList, { deskripsi: "", nominalAlokasi: "" }])}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11.5px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Tambah Main
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {posAnggaranList.map((pos, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <select
                      required
                      value={pos.deskripsi}
                      onChange={(e) => {
                        const updated = [...posAnggaranList];
                        updated[idx].deskripsi = e.target.value;
                        setPosAnggaranList(updated);
                      }}
                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-[12.5px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-800"
                    >
                      <option value="" disabled hidden>
                        {loadingOptions ? "Memuat data..." : "Pilih Main Pengeluaran"}
                      </option>
                      {pengeluaranOptions.map((opt) => (
                        <option key={opt.id} value={opt.nama}>
                          {opt.nama}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex items-center w-40">
                      <span className="absolute left-3 text-[12px] font-bold text-stone-400 font-mono">Rp</span>
                      <input
                        type="text"
                        required
                        value={pos.nominalAlokasi}
                        onChange={(e) => {
                          const updated = [...posAnggaranList];
                          const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                          updated[idx].nominalAlokasi = formatted;
                          setPosAnggaranList(updated);
                          requestAnimationFrame(() => {
                            e.target.setSelectionRange(caret, caret);
                          });
                        }}
                        placeholder="0"
                        className="w-full border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-[12.5px] bg-white font-mono text-stone-900 font-bold focus:outline-none focus:border-stone-400 text-left"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setPosAnggaranList(posAnggaranList.filter((_, i) => i !== idx))}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-50 transition shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hasDuplicatePengeluaran && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Pos Anggaran Pengeluaran tidak boleh ada yang sama</span>
              </div>
            )}

            {isOverbudget && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Total Pengeluaran + Pemasukan (Rp {totalAllAllocated.toLocaleString("id-ID")}) melebihi Total Nilai Proyek (Rp {totalNilaiProyekVal.toLocaleString("id-ID")})</span>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <X size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "14px 24px",
              borderTop: "0.80px #E6E1D4 solid",
              display: "flex",
              gap: 8,
              background: "white",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "9px 14px",
                background: "white",
                border: "0.80px solid #E6E1D4",
                borderRadius: 12,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                fontSize: 13,
                color: "#14130F",
                cursor: "pointer",
              }}
              className="hover:bg-stone-50 transition"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={submitting || hasDuplicatePengeluaran || isOverbudget}
              style={{
                flex: 1,
                padding: "9px 14px",
                background: hasDuplicatePengeluaran || isOverbudget ? "#A1A1AA" : "black",
                border: "none",
                borderRadius: 12,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                fontSize: 13,
                color: "white",
                cursor: hasDuplicatePengeluaran || isOverbudget ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              className="hover:opacity-80 transition"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Alokasi Pengeluaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}