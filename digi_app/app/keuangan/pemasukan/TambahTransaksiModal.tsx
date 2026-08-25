"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, TrendingUp, DollarSign, Calendar, FileText, Check } from "lucide-react";
import DatePicker from "@/components/date-picker";

type MasterSubOption = {
  id: number;
  nama: string;
  tipe: string;
  master_main?: {
    id: number;
    nama: string;
  };
};

type ProyekOption = {
  id: number;
  nama: string;
  status: string;
  budget?: {
    nilaiKontrak: number;
    rabTotal: number;
    targetPemasukan: number;
  };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
  userRole?: string;
};

// Helper format ribuan rupiah
function formatRibuan(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (!clean) return "";
  return parseInt(clean, 10).toLocaleString("id-ID");
}

function ribuanToNumber(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(/,/g, ".")) || 0;
}

export default function TambahTransaksiModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  userRole = "Tim Keuangan",
}: Props) {
  const [proyekList, setProyekList] = useState<ProyekOption[]>([]);
  const [coaList, setCoaList] = useState<MasterSubOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [proyekId, setProyekId] = useState<string>("");
  const [kategori, setKategori] = useState<string>("DISKON_PENJUALAN");
  const [subCoaId, setSubCoaId] = useState<string>("");
  const [nominal, setNominal] = useState<string>("");
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [keterangan, setKeterangan] = useState<string>("");
  const [buktiUrl, setBuktiUrl] = useState<string>("");

  // Akun Jurnal
  const [noAkunDebit, setNoAkunDebit] = useState<string>("");
  const [noAkunKredit, setNoAkunKredit] = useState<string>("");

  // Load Proyek dan Master COA
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setLoadingInitial(true);
      try {
        const [resProyek, resCoa] = await Promise.all([
          fetch("/api/proyek?limit=100"),
          fetch("/api/master?tipe=pemasukan&type=all"),
        ]);

        if (resProyek.ok && isMounted) {
          const pData = await resProyek.json();
          setProyekList(pData.projects || []);
        }

        if (resCoa.ok && isMounted) {
          const cData = await resCoa.json();
          const mains = Array.isArray(cData) ? cData : (cData.data || []);
          const subs: MasterSubOption[] = [];
          mains.forEach((m: any) => {
            if (m.MasterSub && Array.isArray(m.MasterSub)) {
              m.MasterSub.forEach((s: any) => {
                subs.push({
                  ...s,
                  master_main: { id: m.id, nama: m.nama },
                });
              });
            }
          });
          setCoaList(subs);
        }
      } catch (err) {
        console.error("Gagal memuat data opsi:", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Update default journal entries whenever category changes
  const setDefaultJournalDefaults = (kat: string) => {
    if (kat === "DISKON_PENJUALAN") {
      setNoAkunDebit("4.1 - Diskon Penjualan");
      setNoAkunKredit("1.2 - Piutang Usaha / Kas");
    } else if (kat === "RETUR_PENJUALAN") {
      setNoAkunDebit("4.2 - Retur Penjualan");
      setNoAkunKredit("1.2 - Piutang Usaha / Kas");
    } else if (kat === "BIAYA_PENJUALAN_LAINNYA") {
      setNoAkunDebit("4.3 - Biaya Penjualan Lainnya");
      setNoAkunKredit("1.1 - Kas & Bank");
    } else {
      setNoAkunDebit("1.1 - Kas & Bank");
      setNoAkunKredit("4.0 - Pendapatan Penjualan");
    }
  };

  // Set initial data if editing
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setProyekId(String(initialData.proyekId || ""));
      setKategori(initialData.kategori || "DISKON_PENJUALAN");
      setSubCoaId(initialData.subCoaId ? String(initialData.subCoaId) : "");
      setNominal(formatRibuan(String(initialData.nominal || 0)));
      setTanggalTransaksi(
        initialData.tanggalTransaksi
          ? new Date(initialData.tanggalTransaksi).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setKeterangan(initialData.keterangan || "");
      setBuktiUrl(initialData.buktiUrl || "");

      const journal = initialData.jurnalAkuntansi?.[0];
      setNoAkunDebit(journal?.noAkunDebit || "");
      setNoAkunKredit(journal?.noAkunKredit || "");
    } else {
      setProyekId("");
      setKategori("DISKON_PENJUALAN");
      setSubCoaId("");
      setNominal("");
      setTanggalTransaksi(new Date().toISOString().split("T")[0]);
      setKeterangan("");
      setBuktiUrl("");
      setDefaultJournalDefaults("DISKON_PENJUALAN");
    }
    setErrorMsg("");
  }, [isOpen, initialData]);

  const handleKategoriChange = (newKat: string) => {
    setKategori(newKat);
    setDefaultJournalDefaults(newKat);

    // Auto-select corresponding sub coa if available
    const matched = coaList.find((c) =>
      c.nama.toLowerCase().includes(
        newKat === "DISKON_PENJUALAN"
          ? "diskon"
          : newKat === "RETUR_PENJUALAN"
            ? "retur"
            : newKat === "BIAYA_PENJUALAN_LAINNYA"
              ? "biaya"
              : "penjualan"
      )
    );
    if (matched) {
      setSubCoaId(String(matched.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedNominal = ribuanToNumber(nominal);
    if (!proyekId) {
      setErrorMsg("Pilih proyek terlebih dahulu");
      return;
    }

    if (parsedNominal <= 0) {
      setErrorMsg("Nominal transaksi harus lebih dari 0");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        proyekId: parseInt(proyekId, 10),
        kategori,
        subCoaId: subCoaId ? parseInt(subCoaId, 10) : null,
        nominal: parsedNominal,
        tanggalTransaksi,
        keterangan,
        buktiUrl,
        noAkunDebit: noAkunDebit || undefined,
        noAkunKredit: noAkunKredit || undefined,
      };

      const url = initialData ? `/api/pemasukan/${initialData.id}` : "/api/pemasukan";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan transaksi Pendapatan");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-stone-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-[#fbfaf8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                {initialData ? "Edit Transaksi Pendapatan" : "Catat Transaksi Pendapatan"}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Input nominal langsung untuk Diskon, Retur, Biaya Lainnya, atau Penjualan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pilih Proyek */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Proyek Terkait <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={proyekId}
                onChange={(e) => setProyekId(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 font-medium cursor-pointer"
              >
                <option value="" disabled hidden>
                  {loadingInitial ? "Memuat proyek..." : "Pilih Proyek"}
                </option>
                {proyekList.map((p) => (
                  <option key={p.id} value={p.id}>
                    PRJ-{String(p.id).padStart(3, "0")} · {p.nama} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori Pemasukan / Penyesuaian */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Kategori Transaksi <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "DISKON_PENJUALAN", label: "Diskon Penjualan" },
                  { key: "RETUR_PENJUALAN", label: "Retur Penjualan" },
                  { key: "BIAYA_PENJUALAN_LAINNYA", label: "Biaya Penjualan" },
                  { key: "PENERIMAAN_PENJUALAN", label: "Penjualan / Kas" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleKategoriChange(item.key)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all text-center cursor-pointer ${kategori === item.key
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub COA Akun */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Sub COA Pendapatan
              </label>
              <select
                value={subCoaId}
                onChange={(e) => setSubCoaId(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 font-medium cursor-pointer"
              >
                <option value="">-- Pilih Akun Sub COA (Opsional) --</option>
                {coaList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.master_main?.nama} · {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal & Tanggal Transaksi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold font-mono text-stone-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={nominal}
                    onChange={(e) => {
                    const formatted = formatRibuan(e.target.value);
                    const caretPos = e.target.selectionStart ?? 0;
                    const digitsBefore = e.target.value.slice(0, caretPos).replace(/[^0-9]/g, "").length;
                    let caret = 0;
                    let digits = 0;
                    for (let i = 0; i < formatted.length && digits < digitsBefore; i++) {
                      caret++;
                      if (/[0-9]/.test(formatted[i])) digits++;
                    }
                    setNominal(formatted);
                    requestAnimationFrame(() => {
                      e.target.setSelectionRange(caret, caret);
                    });
                  }}
                    placeholder="0"
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Tanggal Transaksi <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={tanggalTransaksi}
                  onChange={(v) => setTanggalTransaksi(v)}
                  size="sm"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Keterangan / Deskripsi
              </label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Diskon termin 2 proyek pengembangan software..."
                className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 font-medium resize-none"
              />
            </div>

            {/* Pengaturan Jurnal Akuntansi Otomatis */}
            <div className="bg-[#fbfaf8] border border-stone-200/80 rounded-xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Jurnal Akuntansi Otomatis (PSAK)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Akun Debit (Dr)
                  </label>
                  <input
                    type="text"
                    value={noAkunDebit}
                    onChange={(e) => setNoAkunDebit(e.target.value)}
                    placeholder="Akun Debit..."
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Akun Kredit (Cr)
                  </label>
                  <input
                    type="text"
                    value={noAkunKredit}
                    onChange={(e) => setNoAkunKredit(e.target.value)}
                    placeholder="Akun Kredit..."
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono text-stone-800 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-stone-200/80 flex items-center justify-end gap-2.5 bg-[#fbfaf8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#008f5d] hover:bg-[#00784e] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Simpan Transaksi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
