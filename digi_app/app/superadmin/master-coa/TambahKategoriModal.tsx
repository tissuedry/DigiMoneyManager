"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, TrendingUp, TrendingDown, Check } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import Toast from "@/components/toast";

export default function TambahKategoriModal({ isOpen, onClose, type, data, onRefresh }: any) {
  const [namaKategori, setNamaKategori] = useState("");
  const [selectedTipe, setSelectedTipe] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const showTipeSelector = type === 'tambahMain' && !data?.tipe;

  useEffect(() => {
    if (isOpen) {
      setNamaKategori("");
      setSelectedTipe(data?.tipe || "pengeluaran");
    }
  }, [isOpen, data]);

  const getTitle = () => {
    if (type === 'tambahMain') return "Tambah Main Baru";
    return "Tambah Sub Baru";
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    
    const payloadType = type === 'tambahSub' ? "sub" : "main";

    const payload = {
      type: payloadType,
      nama: namaKategori,
      tipe: selectedTipe,
      parentId: data?.parentId ? String(data.parentId) : undefined
    };

    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Mencegah "Unexpected end of JSON input" jika response kosong
      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal menyimpan kategori");
      }

      if (onRefresh) onRefresh();
      onClose();
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessMessage = () => {
    if (type === 'tambahMain') return `Main "${namaKategori}" berhasil ditambahkan.`;
    return `Sub "${namaKategori}" berhasil ditambahkan.`;
  };

  const getBreadcrumbs = () => {
    if (type === 'tambahSub') {
      return (
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{data?.main}</span>
        </>
      );
    }
    return null;
  };

  return (
    <>
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      actionLabel="Simpan"
      title={getTitle()}
      onAction={handleSubmit}
      isLoading={isLoading}
      breadcrumbs={getBreadcrumbs()}
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      {showTipeSelector && (
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-stone-800">Tipe Kategori</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTipe("pemasukan")}
              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-bold transition cursor-pointer active:scale-[0.98] ${
                selectedTipe === "pemasukan"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700"
              }`}
            >
              <TrendingUp size={15} className={selectedTipe === "pemasukan" ? "text-emerald-600 shrink-0" : "text-stone-400 shrink-0"} />
              <span className="truncate">Pemasukan</span>
              {selectedTipe === "pemasukan" && (
                <Check size={13} strokeWidth={3} className="text-emerald-600 ml-auto shrink-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTipe("pengeluaran")}
              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-bold transition cursor-pointer active:scale-[0.98] ${
                selectedTipe === "pengeluaran"
                  ? "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:text-stone-700"
              }`}
            >
              <TrendingDown size={15} className={selectedTipe === "pengeluaran" ? "text-red-600 shrink-0" : "text-stone-400 shrink-0"} />
              <span className="truncate">Pengeluaran</span>
              {selectedTipe === "pengeluaran" && (
                <Check size={13} strokeWidth={3} className="text-red-600 ml-auto shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Kategori Baru</label>
        <input
          type="text"
          value={namaKategori}
          onChange={(e) => setNamaKategori(e.target.value)}
          placeholder="Masukkan nama..."
          className="w-full bg-white border border-stone-200 text-stone-800 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm"
        />
      </div>
    </ModalWrapper>
    <Toast
      open={showSuccess}
      message={getSuccessMessage()}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}