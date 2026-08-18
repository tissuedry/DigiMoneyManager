"use client";
import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { formatRibuan, ribuanToNumber } from "./utils";

type MainOption = {
  id: number;
  nama: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  totalRAB?: number | string;
  onSuccess: () => void;
};

export default function AddPenambaganTermin({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  totalRAB = 0,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    namaTermin: "",
    nominal: "",
    persentaseProgress: "",
    catatan: "",
  });
  const [posAnggaranList, setPosAnggaranList] = useState<{ deskripsi: string; nominalAlokasi: string }[]>([
    { deskripsi: "", nominalAlokasi: "" },
  ]);
  const [mainOptions, setMainOptions] = useState<MainOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch master main opsi untuk Pemasukan saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function fetchMasterMain() {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/master?tipe=pemasukan");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMainOptions(data);
          } else if (data && Array.isArray(data.data)) {
            setMainOptions(data.data);
          } else if (data && Array.isArray(data.mainOptions)) {
            setMainOptions(data.mainOptions);
          } else {
            setMainOptions([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Gagal memuat master main budget pemasukan:", err);
          setMainOptions([]);
        }
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }
    fetchMasterMain();
    return () => {
      isMounted = false;
    };
  }, [isOpen, proyekId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRibuan(e.target.value);
    setForm((prev) => ({ ...prev, nominal: formatted }));
    setError("");
  };

  const resetForm = () => {
    setForm({ namaTermin: "", nominal: "", persentaseProgress: "", catatan: "" });
    setPosAnggaranList([{ deskripsi: "", nominalAlokasi: "" }]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validasi duplikasi opsi main yang dipilih
  const selectedDeskripsi = posAnggaranList
    .map((item) => item.deskripsi)
    .filter((desk) => desk !== "");
  const hasDuplicateOptions = new Set(selectedDeskripsi).size !== selectedDeskripsi.length;

  const totalTerminVal = ribuanToNumber(form.nominal) || 0;
  const totalPosAllocated = posAnggaranList.reduce((acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0), 0);

  // Perhitungan Realisasi / Progress
  const totalRABVal = typeof totalRAB === "string" ? parseFloat(totalRAB.replace(/[^0-9.]/g, "")) || 0 : Number(totalRAB) || 0;
  const rawProgressNum = form.persentaseProgress ? parseFloat(form.persentaseProgress) : 0;
  const calculatedProgressPct = totalRABVal > 0 && totalTerminVal > 0
    ? Math.round((totalTerminVal / totalRABVal) * 100)
    : rawProgressNum;
  const displayProgressPct = form.persentaseProgress ? rawProgressNum : calculatedProgressPct;
  const sisaRABVal = Math.max(0, totalRABVal - totalTerminVal);

  const isOverbudget = totalPosAllocated > totalTerminVal && totalTerminVal > 0;
  const sisaUnallocated = totalTerminVal > 0 ? totalTerminVal - totalPosAllocated : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!totalTerminVal || totalTerminVal <= 0) {
      setError("Nominal termin harus lebih dari 0");
      return;
    }
    if (hasDuplicateOptions) {
      setError("Pos Anggaran Main Pemasukan tidak boleh ada yang sama");
      return;
    }

    setSubmitting(true);
    try {
      const validPosList = posAnggaranList.filter(
        (p) => p.deskripsi.trim() !== "" && ribuanToNumber(p.nominalAlokasi) > 0
      );

      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaTermin: form.namaTermin.trim(),
          nominal: totalTerminVal,
          persentaseProgress: displayProgressPct,
          catatan: form.catatan.trim() || null,
          posAnggaranList: validPosList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah termin");
        return;
      }

      resetForm();
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
          borderRadius: 22,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Header Modal */}
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
                <Plus size={13} className="text-emerald-700" strokeWidth={2.5} />
              </div>
              Edit Pos Pemasukan
            </div>
            <div style={{ fontFamily: "Plus Jakarta Sans", fontWeight: 400, fontSize: 12, color: "#9A948B", lineHeight: "18px" }}>
              {proyekNama}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 1. Nilai Proyek (Read-only jika totalRAB tersedia) */}
            {totalRABVal > 0 && (
              <div>
                <label className="block text-[12.5px] font-semibold text-stone-900 mb-1.5" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  Nilai Proyek
                </label>
                <div className="flex items-center w-full h-11 bg-[#F8F7F4] border border-[#E6E1D4] rounded-xl px-3.5">
                  <span className="text-[13.5px] font-mono font-medium text-[#78716C] mr-2">Rp</span>
                  <span className="text-[13.5px] font-mono font-bold text-stone-900">
                    {formatRibuan(String(Math.round(totalRABVal))) || "0"}
                  </span>
                </div>
              </div>
            )}

          {/* 4. Progress Card: Realisasi Pemasukan (Persis Gambar) */}
          <div
            style={{
              alignSelf: "stretch",
              padding: 16,
              background: "white",
              boxShadow: "0px 0px 0px 1px rgba(20, 18, 14, 0.04), 0px 1px 2px rgba(20, 18, 14, 0.05)",
              borderRadius: 16,
              border: "1.20px #E6E1D4 solid",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#14130F", fontSize: 13, fontFamily: "Plus Jakarta Sans", fontWeight: "600" }}>
                Realisasi Pemasukan
              </span>
              <span style={{ color: "#14130F", fontSize: 13, fontFamily: "IBM Plex Mono", fontWeight: "700" }}>
                {displayProgressPct}%
              </span>
            </div>
            <div style={{ height: 8, background: "#F3F0E9", overflow: "hidden", borderRadius: 999 }}>
              <div
                style={{
                  width: `${Math.min(displayProgressPct, 100)}%`,
                  height: "100%",
                  background: "#009162",
                  borderRadius: 999,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                <span style={{ color: "black", fontSize: 11.5, fontFamily: "Plus Jakarta Sans", fontWeight: "500" }}>Nilai Proyek</span>
                <span style={{ color: "#9A948B", fontSize: 10, fontFamily: "IBM Plex Mono", fontWeight: "500" }}>Rp</span>
                <span style={{ color: "#14130F", fontSize: 11.5, fontFamily: "IBM Plex Mono", fontWeight: "500" }}>
                  {formatRibuan(String(Math.round(totalRABVal))) || "0"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
                <span style={{ color: "black", fontSize: 11.5, fontFamily: "Plus Jakarta Sans", fontWeight: "500" }}>Nominal Termin</span>
                <span style={{ color: "#9A948B", fontSize: 10, fontFamily: "IBM Plex Mono", fontWeight: "500" }}>Rp</span>
                <span style={{ color: "#14130F", fontSize: 11.5, fontFamily: "IBM Plex Mono", fontWeight: "500" }}>
                  {formatRibuan(String(Math.round(totalTerminVal))) || "0"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                <span style={{ color: "#9A948B", fontSize: 11.5, fontFamily: "Plus Jakarta Sans", fontWeight: "400" }}>Sisa</span>
                <span style={{ color: "#9A948B", fontSize: 10, fontFamily: "IBM Plex Mono", fontWeight: "700" }}>Rp</span>
                <span style={{ color: "#14130F", fontSize: 11.5, fontFamily: "IBM Plex Mono", fontWeight: "700" }}>
                  {formatRibuan(String(Math.round(sisaRABVal))) || "0"}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Section Breakdown Main Budget List (Alokasi Pemasukan (Main)) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ color: "#14130F", fontSize: 12.5, fontFamily: "Plus Jakarta Sans", fontWeight: "600" }}>
                Alokasi Pemasukan (Main)
              </span>
              <button
                type="button"
                onClick={() => setPosAnggaranList([...posAnggaranList, { deskripsi: "", nominalAlokasi: "" }])}
                style={{
                  padding: "4px 10px",
                  background: "#D5F4E3",
                  borderRadius: 6,
                  border: "none",
                  color: "#005836",
                  fontSize: 11.5,
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
                className="hover:opacity-80 transition"
              >
                + Tambah Main
              </button>
            </div>

            {/* Real-time Summary Cards (Persis Gambar) */}
            <div
              style={{
                alignSelf: "stretch",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  background: "white",
                  borderRadius: 12,
                  outline: "0.80px #E6E1D4 solid",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <div style={{ color: "#14130F", fontSize: 11.5, fontFamily: "Plus Jakarta Sans", fontWeight: "600" }}>
                  Total Nilai Proyek Teralokasi
                </div>
                <div style={{ color: "black", fontSize: 13, fontFamily: "IBM Plex Mono", fontWeight: "500" }}>
                  Rp {totalPosAllocated.toLocaleString("id-ID")}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  background: isOverbudget ? "rgba(211, 108, 102, 0.05)" : "white",
                  borderRadius: 12,
                  outline: isOverbudget ? "0.80px #D36C66 solid" : "0.80px #E6E1D4 solid",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    color: isOverbudget ? "#D36C66" : "#14130F",
                    fontSize: 11.5,
                    fontFamily: "Plus Jakarta Sans",
                    fontWeight: "600",
                  }}
                >
                  {isOverbudget ? "Kelebihan Alokasi" : "Sisa Nilai Proyek Belum Dialokasikan"}
                </div>
                <div
                  style={{
                    color: isOverbudget ? "#D36C66" : "black",
                    fontSize: 13,
                    fontFamily: "IBM Plex Mono",
                    fontWeight: "700",
                  }}
                >
                  Rp {isOverbudget ? "-" : ""}
                  {Math.abs(sisaUnallocated).toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {/* Scrollable list opsi main */}
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {posAnggaranList.map((pos, idx) => (
                <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <select
                    value={pos.deskripsi}
                    onChange={(e) => {
                      const newList = [...posAnggaranList];
                      newList[idx].deskripsi = e.target.value;
                      setPosAnggaranList(newList);
                    }}
                    className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-700"
                  >
                    <option value="" disabled hidden>
                      {loadingOptions ? "Memuat data..." : "Pilih Main Pemasukan"}
                    </option>
                    {Array.isArray(mainOptions) &&
                      mainOptions.map((opt) => (
                        <option key={opt.id} value={opt.nama}>
                          {opt.nama}
                        </option>
                      ))}
                  </select>

                  <div className="relative flex items-center w-40">
                    <span className="absolute left-3 text-[12px] font-bold text-stone-400 font-mono">Rp</span>
                    <input
                      type="text"
                      value={pos.nominalAlokasi}
                      onChange={(e) => {
                        const newList = [...posAnggaranList];
                        const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                        newList[idx].nominalAlokasi = formatted;
                        setPosAnggaranList(newList);
                        requestAnimationFrame(() => {
                          e.target.setSelectionRange(caret, caret);
                        });
                      }}
                      placeholder="0"
                      className="w-full border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-[13px] bg-white font-mono text-stone-900 font-bold text-left focus:outline-none focus:border-stone-400 placeholder-stone-300"
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

          {hasDuplicateOptions && (
            <div
              style={{
                background: "#FDF2F2",
                border: "1px solid #FCD3D3",
                borderRadius: 14,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#9E2A2B",
                fontSize: 12.5,
                fontFamily: "Plus Jakarta Sans",
                fontWeight: 600,
              }}
            >
              <X size={15} color="#9E2A2B" />
              <span>Pos Anggaran Main Pemasukan tidak boleh ada yang sama</span>
            </div>
          )}

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              <X size={14} />
              <span>{error}</span>
            </div>
          )}
      </div>

      {/* Footer Modal */}
      <div
        style={{
          alignSelf: "stretch",
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
          onClick={handleClose}
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
          disabled={submitting || hasDuplicateOptions}
          style={{
            flex: 1,
            padding: "9px 14px",
            background: hasDuplicateOptions ? "#A1A1AA" : "black",
            border: "none",
            borderRadius: 12,
            fontFamily: "Plus Jakarta Sans",
            fontWeight: "600",
            fontSize: 13,
            color: "white",
            cursor: hasDuplicateOptions ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          className="hover:opacity-80 transition"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
          Simpan
        </button>
      </div>
    </form>
      </div >
    </div >
  );
}