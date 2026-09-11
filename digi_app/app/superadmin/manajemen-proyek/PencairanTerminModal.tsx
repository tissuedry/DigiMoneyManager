"use client";
import { useState, useEffect, SubmitEvent } from "react";
import { X, Check, Loader2, TrendingUp } from "lucide-react";

type Termin = {
  id: number;
  namaTermin: string;
  nominal: string | number;
  persentaseProgress: string | number;
  status: string;
  urutan: number;
  tanggalPencairan?: string | Date | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  proyekId: number;
  proyekNama: string;
  termin: Termin[];
  onSuccess: () => void;
};

function formatRupiahDisplay(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

export default function PencairanTerminModal({
  isOpen,
  onClose,
  proyekId,
  proyekNama,
  termin,
  onSuccess,
}: Props) {
  const belumDiterima = termin
    .filter((t) => t.status === "BELUM_DITERIMA")
    .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));

  const nextTermin = belumDiterima.length > 0 ? belumDiterima[0] : null;

  const [tanggalPembayaran, setTanggalPembayaran] = useState(new Date().toLocaleDateString('en-CA'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (nextTermin?.tanggalPencairan) {
        const d = new Date(nextTermin.tanggalPencairan);
        setTanggalPembayaran(!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toLocaleDateString('en-CA'));
      } else {
        setTanggalPembayaran(new Date().toLocaleDateString('en-CA'));
      }
    }
  }, [isOpen, nextTermin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError("");

    if (!termin || termin.length === 0) {
      setError("Proyek masih belum memiliki termin");
      return;
    }

    if (!nextTermin) {
      setError("Semua termin sudah dicairkan");
      return;
    }

    if (!tanggalPembayaran) {
      setError("Tanggal pembayaran wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyekId}/termin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminId: nextTermin.id,
          tanggalPencairan: tanggalPembayaran,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal melakukan pembayaran termin");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-xl max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-7 relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-6 right-6 p-1 text-stone-400 hover:text-stone-700 transition rounded-md hover:bg-stone-100"
        >
          <X size={20} strokeWidth={2} />
        </button>

        <div className="mb-6 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={13} className="text-emerald-700" strokeWidth={2.5} />
            </div>
            <h2 className="text-[20px] font-bold text-stone-900 tracking-tight">Pembayaran Termin</h2>
          </div>
          <p className="text-[13px] text-stone-500 mt-0.5 truncate">{proyekNama}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left flex-1">
          <div>
            <label className="block text-[13px] font-bold text-stone-900 mb-2">
              Termin
            </label>
            <input
              type="text"
              readOnly
              value={
                !termin || termin.length === 0
                  ? "Proyek masih belum memiliki termin"
                  : nextTermin
                  ? (nextTermin.namaTermin === "Termin 0" ? "DP" : nextTermin.namaTermin)
                  : "Semua termin sudah dibayarkan"
              }
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[14px] text-stone-800 bg-[#F8F7F4] font-medium outline-none cursor-default"
            />
          </div>

          {nextTermin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-stone-900 mb-2">Nominal</label>
                  <input
                    type="text"
                    readOnly
                    value={formatRupiahDisplay(nextTermin.nominal)}
                    className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-stone-900 mb-2">Persen</label>
                  <input
                    type="text"
                    readOnly
                    value={`${parseFloat(String(nextTermin.persentaseProgress)) || 0}%`}
                    className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#fdf8f4] text-[#a67c52] font-semibold outline-none cursor-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-stone-900 mb-2">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  value={tanggalPembayaran}
                  onChange={(e) => setTanggalPembayaran(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-[14px] text-stone-800 bg-white font-medium outline-none focus:border-[#00966c] transition cursor-pointer"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <X size={13} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !nextTermin}
              className="px-5 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-semibold rounded-xl hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} strokeWidth={3} />
              )}
              Konfirmasi Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}