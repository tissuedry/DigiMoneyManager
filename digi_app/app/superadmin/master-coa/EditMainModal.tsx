"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";

export default function EditMainModal({ isOpen, onClose, data, onRefresh }: any) {
  const [namaBaru, setNamaBaru] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNamaBaru(data?.main || "");
    }
  }, [isOpen, data]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Mengubah endpoint ke dynamic route /api/master/[id]
      const res = await fetch(`/api/master/${data?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "main",
          id: data?.id,
          namaLama: data?.main,
          nama: namaBaru,
        }),
      });

      // Mencegah error 'Unexpected end of JSON input'
      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal memperbarui Main");
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <span>{data?.main}</span>
        </>
      }
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">MAIN</span> · {data?.main}
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
  );
}