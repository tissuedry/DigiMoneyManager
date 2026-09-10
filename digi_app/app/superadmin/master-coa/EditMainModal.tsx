"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import Toast from "@/components/toast";

export default function EditMainModal({ isOpen, onClose, data, onRefresh }: any) {
  const [kodeBaru, setKodeBaru] = useState("");
  const [namaBaru, setNamaBaru] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKodeBaru(data?.kode || "");
      setNamaBaru(data?.main || data?.nama || "");
    }
  }, [isOpen, data]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/master/${data?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "main",
          id: data?.id,
          kode: kodeBaru.trim() || null,
          namaLama: data?.main || data?.nama,
          nama: namaBaru,
        }),
      });

      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal memperbarui Main");
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

  const currentDisplay = data?.kode ? `(${data.kode}) ${data.main || data?.nama}` : (data?.main || data?.nama);
  const newDisplay = kodeBaru ? `(${kodeBaru}) ${namaBaru}` : namaBaru;

  return (
    <>
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Main"
      onAction={handleSubmit}
      isLoading={isLoading}
      breadcrumbs={
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{currentDisplay}</span>
        </>
      }
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">MAIN</span> · {currentDisplay}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Kode Rekening</label>
        <input
          type="text"
          value={kodeBaru}
          onChange={(e) => setKodeBaru(e.target.value)}
          placeholder="Misal: 1-1000"
          className="w-full bg-white border border-stone-200 text-stone-800 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Main Baru</label>
        <input
          type="text"
          value={namaBaru}
          onChange={(e) => setNamaBaru(e.target.value)}
          placeholder="Masukkan nama baru..."
          className="w-full bg-white border border-stone-200 text-stone-800 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm"
        />
      </div>
    </ModalWrapper>
    <Toast
      open={showSuccess}
      message={`Main berhasil diperbarui menjadi "${newDisplay}".`}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}