"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function EditSubModal({ isOpen, onClose, data, onRefresh }: any) {
  const [subBaru, setSubBaru] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubBaru(data?.sub || "");
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
          type: "sub", 
          id: data?.id,
          main: data?.main,
          subLama: data?.sub,
          nama: subBaru, // PERBAIKAN: Ubah subBaru menjadi nama
        }),
      });

      // Mencegah error 'Unexpected end of JSON input'
      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal memperbarui Sub");
      }

      if (onRefresh) onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <span>{data?.main}</span>
          <ChevronRight size={12} className="text-stone-400 mx-0.5" />
          <span className="font-bold text-stone-800 tracking-tight">SUB</span>
          <span className="text-stone-400">·</span>
          <span className="font-bold text-stone-800">{data?.sub}</span>
        </>
      }
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">MAIN</span> · {data?.main}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Sub Baru</label>
        <input 
          type="text" 
          value={subBaru}
          onChange={(e) => setSubBaru(e.target.value)}
          placeholder="Masukkan nama baru..." 
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" 
        />
      </div>
    </ModalWrapper>
  );
}