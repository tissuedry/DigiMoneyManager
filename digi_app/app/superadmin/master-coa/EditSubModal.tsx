"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import Toast from "@/components/toast";

export default function EditSubModal({ isOpen, onClose, data, onRefresh }: any) {
  const [kodeBaru, setKodeBaru] = useState("");
  const [subBaru, setSubBaru] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKodeBaru(data?.kode || "");
      setSubBaru(data?.sub || data?.nama || "");
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
          type: "sub", 
          id: data?.id,
          main: data?.main,
          kode: kodeBaru.trim() || null,
          subLama: data?.sub || data?.nama,
          nama: subBaru,
        }),
      });

      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal memperbarui Sub");
      }

      if (onRefresh) onRefresh();
      onClose();
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const mainDisplay = data?.mainKode ? `(${data.mainKode}) ${data?.main}` : data?.main;
  const currentSubDisplay = data?.kode ? `(${data.kode}) ${data?.sub || data?.nama}` : (data?.sub || data?.nama);
  const newDisplay = kodeBaru ? `(${kodeBaru}) ${subBaru}` : subBaru;

  return (
    <>
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Sub"
      onAction={handleSubmit}
      isLoading={isLoading}
      breadcrumbs={
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{mainDisplay}</span>
          <ChevronRight size={12} className="text-stone-400 mx-0.5" />
          <span className="font-bold text-stone-800 tracking-tight">SUB</span>
          <span className="text-stone-400">·</span>
          <span>{currentSubDisplay}</span>
        </>
      }
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">SUB</span> · {currentSubDisplay}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Kode Rekening</label>
        <input 
          type="text" 
          value={kodeBaru}
          onChange={(e) => setKodeBaru(e.target.value)}
          placeholder="Misal: 1-1001" 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] font-mono text-[14px]" 
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Sub Baru</label>
        <input 
          type="text" 
          value={subBaru}
          onChange={(e) => setSubBaru(e.target.value)}
          placeholder="Masukkan nama baru..." 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] text-[14px]" 
        />
      </div>
    </ModalWrapper>
    <Toast
      open={showSuccess}
      message={`Sub berhasil diperbarui menjadi "${newDisplay}".`}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}