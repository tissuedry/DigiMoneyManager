"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function TambahKategoriModal({ isOpen, onClose, type, data, onRefresh }: any) {
  const [namaKategori, setNamaKategori] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) setNamaKategori("");
  }, [isOpen]);

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
      tipe: data?.tipe || "pengeluaran",
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
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
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
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Kategori Baru</label>
        <input 
          type="text" 
          value={namaKategori}
          onChange={(e) => setNamaKategori(e.target.value)}
          placeholder="Masukkan nama..." 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" 
        />
      </div>
    </ModalWrapper>
  );
}