"use client";
import { useState, useEffect, SubmitEvent } from "react";
import { X, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import SuccessDialog from "@/components/success-dialog";
import { formatRibuan, ribuanToNumber } from "@/lib/proyek-utils";

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

export default function AlokasiPemasukanForm({
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);

  const [posPemasukanList, setPosPemasukanList] = useState<{ deskripsi: string; nominalAlokasi: string }[]>([
    { deskripsi: "", nominalAlokasi: "" }
  ]);

  useEffect(() => {
    if (!isOpen || savedName) return;
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
    if (!isOpen || savedName) return;

    const existingPemasukan =
      detailedProjectInfo?.alokasiPemasukan ||
      detailedProjectInfo?.budget?.alokasiPemasukan ||
      (detailedProjectInfo?.budget?.mainAnggaran ? detailedProjectInfo.budget.mainAnggaran.filter((m: any) => m.tipe === "pemasukan") : []) ||
      [];

    if (Array.isArray(existingPemasukan) && existingPemasukan.length > 0) {
      const first = existingPemasukan[0];
      setPosPemasukanList([{
        deskripsi: first.nama || first.deskripsi || first.namaPos || first.namaMain || "",
        nominalAlokasi: formatRibuan(String(first.alokasi || first.nominalAlokasi || first.nominal || 0)),
      }]);
    } else {
      setPosPemasukanList([{ deskripsi: "", nominalAlokasi: "" }]);
    }
    setError("");
  }, [isOpen, detailedProjectInfo, savedName]);

  if (!isOpen && !savedName) return null;

  const totalNilaiProyekVal = Number(
    nilaiKontrak > 0
      ? nilaiKontrak
      : (detailedProjectInfo?.budget?.nilaiKontrak || 0)
  ) || 0;

  const totalPengeluaranExisting = detailedProjectInfo?.budget?.posAnggaran?.reduce(
    (acc: number, p: any) => acc + (Number(p.nominalAlokasi || p.alokasi || p.nominal) || 0),
    0
  ) || 0;

  const totalPemasukanAllocated = posPemasukanList.reduce(
    (acc, pos) => acc + (ribuanToNumber(pos.nominalAlokasi) || 0),
    0
  );

  const totalAllAllocated = totalPengeluaranExisting + totalPemasukanAllocated;
  const sisaBelumDialokasikan = totalNilaiProyekVal - totalAllAllocated;
  const isOverbudget = totalAllAllocated > totalNilaiProyekVal && totalNilaiProyekVal > 0;

  const pctPengeluaran = totalNilaiProyekVal > 0 ? (totalPengeluaranExisting / totalNilaiProyekVal) * 100 : 0;
  const pctPemasukan = totalNilaiProyekVal > 0 ? (totalPemasukanAllocated / totalNilaiProyekVal) * 100 : 0;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    setError("");

    const validPemasukan = posPemasukanList
      .filter((p) => p.deskripsi.trim() !== "" && ribuanToNumber(p.nominalAlokasi) > 0)
      .map((p) => ({
        deskripsi: p.deskripsi.trim(),
        nominalAlokasi: ribuanToNumber(p.nominalAlokasi),
      }));

    if (validPemasukan.length === 0) {
      setError("Pilih pos pemasukan dan isi nominal");
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const validPemasukan = posPemasukanList
      .filter((p) => p.deskripsi.trim() !== "" && ribuanToNumber(p.nominalAlokasi) > 0)
      .map((p) => ({
        deskripsi: p.deskripsi.trim(),
        nominalAlokasi: ribuanToNumber(p.nominalAlokasi),
      }));

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
        setShowConfirm(false);
        return;
      }

      setShowConfirm(false);
      setSavedName(proyekNama);
      onSuccess();
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div
            className="w-135 bg-white shadow-[0_24px_64px_rgba(20,18,14,0.28)] overflow-hidden rounded-3xl flex flex-col max-h-[92vh] animate-[fadeIn_0.2s_ease]"
          >
            <div className="px-6 py-5 border-b border-[#E6E1D4] flex justify-between items-center shrink-0">
              <div className="flex flex-col gap-0.5">
                <div className="font-sans font-extrabold text-[17px] text-[#14130F] leading-[25.5px] flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp size={13} className="text-emerald-700" strokeWidth={2.5} />
                  </div>
                  Alokasi Pendapatan
                </div>
                <div className="font-sans font-normal text-xs text-[#9A948B] leading-4.5">
                  {proyekNama}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-xl border-none bg-transparent cursor-pointer flex items-center justify-center hover:bg-stone-100 transition"
              >
                <X size={16} color="#2C2A24" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 px-6 py-5 overflow-y-auto flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#14130F] text-[12.5px] font-sans font-semibold">
                    Total Nilai Proyek
                  </label>
                  <div
                    className="relative flex items-center w-full h-10.5 bg-[#F8F7F4] rounded-xl border border-[#E6E1D4] px-3"
                  >
                    <span className="text-[13.5px] leading-none font-medium text-[#78716C] mr-1.5">Rp</span>
                    <span className="font-bold text-[14px] text-stone-900">
                      {formatRibuan(String(Math.round(totalNilaiProyekVal))) || "0"}
                    </span>
                  </div>
                </div>

                <div
                  className="self-stretch px-4 py-3.5 bg-white rounded-2xl border-[1.2px] border-[#E6E1D4] flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-center text-[12px] font-bold text-stone-700">
                    <span>Distribusi Nilai Proyek</span>
                    <span className="text-[13px] font-black text-stone-900">
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
                      title={`Pemasukan: Rp ${totalPemasukanAllocated.toLocaleString("id-ID")}`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="flex flex-col">
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
                        Biaya
                      </span>
                      <span className="font-bold text-stone-800 text-[12px] mt-0.5">
                        Rp {totalPengeluaranExisting.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">Sudah Terisi</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-stone-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                        Pendapatan
                      </span>
                      <span className="font-bold text-stone-800 text-[12px] mt-0.5">
                        Rp {totalPemasukanAllocated.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">Alokasi Saat Ini</span>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className={isOverbudget ? "text-rose-500 font-bold" : "text-stone-400 font-medium"}>
                        {isOverbudget ? "Kelebihan" : "Sisa Belum Dibagi"}
                      </span>
                      <span className={`font-bold text-[12px] mt-0.5 ${isOverbudget ? "text-rose-600" : "text-stone-900"}`}>
                        Rp {Math.abs(sisaBelumDialokasikan).toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {isOverbudget ? "Melebihi Nilai" : `Tersedia`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[12.5px] font-bold text-stone-900 font-sans">
                    Pos Pendapatan
                  </label>

                  <div className="flex items-center gap-2">
                    <select
                      required
                      value={posPemasukanList[0]?.deskripsi || ""}
                      onChange={(e) => {
                        const updated = [{ ...posPemasukanList[0], deskripsi: e.target.value }];
                        setPosPemasukanList(updated);
                      }}
                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-[12.5px] font-medium bg-white focus:outline-none focus:border-stone-400 text-stone-800"
                    >
                      <option value="" disabled hidden>
                        {loadingOptions ? "Memuat data..." : "Pilih Pos Pendapatan"}
                      </option>
                      {pemasukanOptions.map((opt) => (
                        <option key={opt.id} value={opt.nama}>
                          {opt.nama}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex items-center w-48">
                      <span className="absolute left-3 text-[12px] font-bold text-stone-400">Rp</span>
                      <input
                        type="text"
                        required
                        value={posPemasukanList[0]?.nominalAlokasi || ""}
                        onChange={(e) => {
                          const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                          const updated = [{ ...posPemasukanList[0], nominalAlokasi: formatted }];
                          setPosPemasukanList(updated);
                          requestAnimationFrame(() => {
                            e.target.setSelectionRange(caret, caret);
                          });
                        }}
                        placeholder="0"
                        className="w-full border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-[12.5px] bg-white text-stone-900 font-bold focus:outline-none focus:border-stone-400 text-left"
                      />
                    </div>
                  </div>
                </div>

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
                className="px-6 py-3.5 border-t border-[#E6E1D4] flex gap-2 bg-white shrink-0"
              >
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3.5 py-2.5 bg-white border-[0.8px] border-[#E6E1D4] rounded-xl font-sans font-semibold text-[13px] text-[#14130F] cursor-pointer hover:bg-stone-50 transition"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverbudget}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl font-sans font-semibold text-[13px] text-white ${isOverbudget ? "bg-[#A1A1AA] cursor-not-allowed" : "bg-black cursor-pointer"} flex items-center justify-center gap-1.5 hover:opacity-80 transition`}
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  Simpan Alokasi Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Simpan Alokasi Pemasukan"
        description={
          <>
            Apakah Anda yakin ingin menyimpan Alokasi Pemasukan proyek <span className="font-semibold text-stone-900">{proyekNama}</span> senilai <span className="font-semibold text-stone-900">Rp {totalPemasukanAllocated.toLocaleString("id-ID")}</span>? Data alokasi pemasukan yang sudah ada sebelumnya akan diganti sesuai isian ini.
          </>
        }
        confirmLabel="Simpan"
        isLoading={submitting}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />

      <SuccessDialog
        open={!!savedName}
        title="Alokasi Pemasukan Berhasil Disimpan"
        description={<>Alokasi Pemasukan untuk proyek <span className="font-semibold text-[#14130F]">{savedName}</span> berhasil disimpan.</>}
        onClose={() => {
          setSavedName(null);
          onClose();
        }}
      />
    </>
  );
}
