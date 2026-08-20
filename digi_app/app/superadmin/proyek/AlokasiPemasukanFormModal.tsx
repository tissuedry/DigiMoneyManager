"use client";
import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2, Plus, AlertCircle, TrendingUp } from "lucide-react";
import { formatRibuan, ribuanToNumber } from "./utils";

type MasterOption = {
  id: number;
  nama: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  nilaiKontrak?: number;
  detailedProjectInfo: any;
  onSuccess: () => void;
};

export default function AlokasiPemasukanFormModal({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  nilaiKontrak = 0,
  detailedProjectInfo,
  onSuccess,
}: Props) {
  const [pemasukanOptions, setPemasukanOptions] = useState<MasterOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [posPemasukanList, setPosPemasukanList] = useState<{ deskripsi: string; nominalAlokasi: string }[]>([
    { deskripsi: "", nominalAlokasi: "" }
  ]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function fetchMasterPemasukan() {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/master?tipe=pemasukan");
        if (res.ok && isMounted) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data || data.mainOptions || []);
          setPemasukanOptions(list);
        }
      } catch (err) {
        console.error("Gagal memuat master data pemasukan:", err);
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    fetchMasterPemasukan();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const existingPemasukan =
      detailedProjectInfo?.alokasiPemasukan ||
      detailedProjectInfo?.budget?.alokasiPemasukan ||
      (detailedProjectInfo?.budget?.mainAnggaran ? detailedProjectInfo.budget.mainAnggaran.filter((m: any) => m.tipe === "pemasukan") : []) ||
      [];

    if (Array.isArray(existingPemasukan) && existingPemasukan.length > 0) {
      setPosPemasukanList(
        existingPemasukan.map((item: any) => ({
          deskripsi: item.nama || item.deskripsi || item.namaPos || item.namaMain || "",
          nominalAlokasi: formatRibuan(String(item.alokasi || item.nominalAlokasi || item.nominal || 0)),
        }))
      );
    } else {
      setPosPemasukanList([{ deskripsi: "", nominalAlokasi: "" }]);
    }
    setError("");
  }, [isOpen, detailedProjectInfo]);

  if (!isOpen) return null;

  const totalNilaiProyekVal = Number(
    nilaiKontrak > 0
      ? nilaiKontrak
      : (detailedProjectInfo?.budget?.nilaiKontrak || detailedProjectInfo?.budget?.rabTotal || 0)
  ) || 0;

  const totalPengeluaranExisting = detailedProjectInfo?.budget?.rabTotal !== undefined
    ? Number(detailedProjectInfo.budget.rabTotal)
    : (detailedProjectInfo?.posAnggaran?.reduce((acc: number, p: any) => acc + (Number(p.alokasi || p.nominalAlokasi || p.nominal) || 0), 0) || 0);

  const totalPemasukanAllocated = posPemasukanList.reduce(
    (acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0),
    0
  );

  const totalAllAllocated = totalPengeluaranExisting + totalPemasukanAllocated;
  const sisaBelumDialokasikan = totalNilaiProyekVal - totalAllAllocated;
  const isOverbudget = totalAllAllocated > totalNilaiProyekVal && totalNilaiProyekVal > 0;

  const pctPengeluaran = totalNilaiProyekVal > 0 ? (totalPengeluaranExisting / totalNilaiProyekVal) * 100 : 0;
  const pctPemasukan = totalNilaiProyekVal > 0 ? (totalPemasukanAllocated / totalNilaiProyekVal) * 100 : 0;

  const selectedPemasukan = posPemasukanList.map((p) => p.deskripsi).filter(Boolean);
  const hasDuplicatePemasukan = new Set(selectedPemasukan).size !== selectedPemasukan.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (hasDuplicatePemasukan) {
      setError("Pos Anggaran Pemasukan tidak boleh ada yang sama");
      return;
    }

    const validPemasukan = posPemasukanList
      .filter((p) => p.deskripsi.trim() !== "" && ribuanToNumber(p.nominalAlokasi) > 0)
      .map((p) => ({
        deskripsi: p.deskripsi.trim(),
        nominalAlokasi: ribuanToNumber(p.nominalAlokasi),
      }));

    if (validPemasukan.length === 0) {
      setError("Minimal harus ada 1 pos pemasukan dengan nominal > 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPemasukan: totalPemasukanAllocated,
          posPemasukan: validPemasukan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan alokasi pemasukan");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setSubmitting(false);
    }
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
            <div
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 700,
                fontSize: 17,
                color: "#14130F",
                lineHeight: "25.50px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={13} className="text-emerald-700" strokeWidth={2.5} />
              </div>
              Alokasi Pemasukan (COA)
            </div>
            <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 400, fontSize: 12, color: "#9A948B", lineHeight: "18px" }}>
              {proyekNama}
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
                  title={`Pengeluaran (RAB): Rp ${totalPengeluaranExisting.toLocaleString("id-ID")}`}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(pctPemasukan, 100)}%` }}
                  title={`Pemasukan (COA): Rp ${totalPemasukanAllocated.toLocaleString("id-ID")}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="flex flex-col">
                  <span className="text-stone-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
                    Pengeluaran
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-[12px] mt-0.5">
                    Rp {totalPengeluaranExisting.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">Sudah Terisi (RAB)</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-stone-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                    Pemasukan
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-[12px] mt-0.5">
                    Rp {totalPemasukanAllocated.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Alokasi Saat Ini</span>
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
                  Pos COA Pemasukan / Penjualan ({posPemasukanList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setPosPemasukanList([...posPemasukanList, { deskripsi: "", nominalAlokasi: "" }])}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11.5px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Tambah Pos
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {posPemasukanList.map((pos, idx) => (
                  <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <select
                      required
                      value={pos.deskripsi}
                      onChange={(e) => {
                        const updated = [...posPemasukanList];
                        updated[idx].deskripsi = e.target.value;
                        setPosPemasukanList(updated);
                      }}
                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-[12.5px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-800"
                    >
                      <option value="" disabled hidden>
                        {loadingOptions ? "Memuat data..." : "Pilih Sub Penjualan COA"}
                      </option>
                      {pemasukanOptions.map((opt) => (
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
                          const updated = [...posPemasukanList];
                          const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                          updated[idx].nominalAlokasi = formatted;
                          setPosPemasukanList(updated);
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
                      onClick={() => setPosPemasukanList(posPemasukanList.filter((_, i) => i !== idx))}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-50 transition shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hasDuplicatePemasukan && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Pos Anggaran Pemasukan tidak boleh ada yang sama</span>
              </div>
            )}

            {isOverbudget && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Total Pengeluaran + Pemasukan (Rp {totalAllAllocated.toLocaleString("id-ID")}) melebihi Total Nilai Proyek (Rp {totalNilaiProyekVal.toLocaleString("id-ID")})</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
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
              disabled={submitting || hasDuplicatePemasukan || isOverbudget}
              style={{
                flex: 1,
                padding: "9px 14px",
                background: hasDuplicatePemasukan || isOverbudget ? "#A1A1AA" : "black",
                border: "none",
                borderRadius: 12,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: "600",
                fontSize: 13,
                color: "white",
                cursor: hasDuplicatePemasukan || isOverbudget ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              className="hover:opacity-80 transition"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Simpan Alokasi Pemasukan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
