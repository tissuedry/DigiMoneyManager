"use client";

import React, { useState } from "react";
import { Loader2, Trash2, Check, AlertCircle, X, PlusCircle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRupiah(n: number) {
  if (n >= 1_000_000_000_000) {
    const val = n / 1_000_000_000_000;
    const rounded = Math.round(val * 100) / 100;
    return `Rp ${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace(".", ",")} T`;
  }
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    const rounded = Math.round(val * 100) / 100;
    return `Rp ${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace(".", ",")} M`;
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    const rounded = Math.round(val * 100) / 100;
    return `Rp ${rounded % 1 === 0 ? rounded : rounded.toFixed(2).replace(".", ",")} jt`;
  }
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function parseRupiah(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type PosRow = { namaPos: string; nominalAlokasi: string };

type PosAnggaranDB = {
  id: number;
  namaPos: string;
  nominalAlokasi: string;
  nominalTerpakai: string;
};

type BudgetDB = {
  id: number;
  rabTotal: string;
  totalPengeluaran: string;
  sisaBudget: string;
  posAnggaran: PosAnggaranDB[];
};

type Proyek = {
  id: number;
  nama: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  budget: BudgetDB | null;
};

interface BudgetFormModalProps {
  proyek: Proyek;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BudgetFormModal({ proyek, onClose, onSuccess }: BudgetFormModalProps) {
  const hasBudget = !!proyek.budget;
  const [rows, setRows] = useState<PosRow[]>(
    hasBudget
      ? proyek.budget!.posAnggaran.map((p) => ({
          namaPos: p.namaPos,
          nominalAlokasi: String(Number(p.nominalAlokasi)),
          nominalTerpakai: String(Number(p.nominalTerpakai))
        }))
      : [{ namaPos: "", nominalAlokasi: "" }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalAlokasi = rows.reduce((s, r) => s + parseRupiah(r.nominalAlokasi), 0);

  const addRow = () => setRows((prev) => [...prev, { namaPos: "", nominalAlokasi: "" }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof PosRow, val: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rows.some((r) => !r.namaPos.trim() || !r.nominalAlokasi)) {
      setError("Semua baris pos anggaran harus diisi lengkap.");
      return;
    }
    if (totalAlokasi <= 0) {
      setError("Total alokasi harus lebih dari Rp 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proyek/${proyek.id}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rabTotal: totalAlokasi,
          posAnggaran: rows.map((r) => ({
            deskripsi: r.namaPos.trim(),
            nominalAlokasi: parseRupiah(r.nominalAlokasi),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan budget.");
        return;
      }
      onSuccess();
    } catch {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-stone-900">
              {hasBudget ? "Perbarui" : "Inisialisasi"} Budget Proyek
            </h3>
            <p className="text-[12px] text-stone-400 mt-0.5">{proyek.nama}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Pos Anggaran Rows */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[12px] font-bold text-stone-600 uppercase tracking-wide">
                Pos Anggaran
              </label>
              <span className="text-[11px] text-stone-400">
                Total: <span className="font-bold text-stone-700">{fmtRupiah(totalAlokasi)}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={row.namaPos}
                      onChange={(e) => updateRow(i, "namaPos", e.target.value)}
                      placeholder={`Nama pos (mis. Material, Transportasi)`}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                    />
                  </div>
                  <div className="w-44">
                    <input
                      type="number"
                      min={1}
                      value={row.nominalAlokasi}
                      onChange={(e) => updateRow(i, "nominalAlokasi", e.target.value)}
                      placeholder="Nominal (Rp)"
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-[13px] text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="p-2 text-stone-300 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#2d6a4f] hover:text-[#1e5038] transition cursor-pointer"
            >
              <PlusCircle size={14} />
              Tambah Pos Anggaran
            </button>
          </div>

          {/* Summary */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-stone-500">Total RAB</span>
              <span className="font-bold text-stone-900">{fmtRupiah(totalAlokasi)}</span>
            </div>
            <div className="flex justify-between text-[12px] mt-1">
              <span className="text-stone-400">Jumlah Pos</span>
              <span className="text-stone-600">{rows.length} pos anggaran</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {hasBudget && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-[11px] font-medium flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>
                Proyek ini sudah memiliki budget. Menyimpan akan <strong>menghapus dan mengganti</strong> semua
                pos anggaran yang belum dipakai.
              </span>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit as any}
            disabled={submitting || totalAlokasi === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#1e5038] disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check size={14} />
                {hasBudget ? "Perbarui Budget" : "Simpan Budget"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}