"use client";

import React, { useState } from "react";
import ModalWrapper from "./ModalWrapper";

export default function TambahAkunModal({ isOpen, onClose, onRefresh }: any) {
  const [nomorAkun, setNomorAkun] = useState("");
  const [namaAkun, setNamaAkun] = useState("");
  const [tipe, setTipe] = useState("Aset");
  const [saldoNormal, setSaldoNormal] = useState("Debit");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomorAkun, namaAkun, tipe, saldoNormal }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menambahkan akun baru");
      }

      if (onRefresh) onRefresh();
      setNomorAkun("");
      setNamaAkun("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Tambah Akun Baru" actionLabel="Simpan" onAction={handleSubmit} isLoading={isLoading}>
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nomor Akun</label>
        <input 
          type="text" 
          value={nomorAkun}
          onChange={(e) => setNomorAkun(e.target.value)}
          placeholder="Misal: 1-1104" 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Akun</label>
        <input 
          type="text" 
          value={namaAkun}
          onChange={(e) => setNamaAkun(e.target.value)}
          placeholder="Masukkan nama..." 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" 
        />
      </div>
    </ModalWrapper>
  );
}