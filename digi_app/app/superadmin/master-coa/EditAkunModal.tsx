"use client";

import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";

export default function EditAkunModal({ isOpen, onClose, data, onRefresh }: any) {
  const [nomorAkun, setNomorAkun] = useState("");
  const [namaAkun, setNamaAkun] = useState("");
  const [tipe, setTipe] = useState("");
  const [standar, setStandar] = useState("PSAK");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Mengisi form dengan data yang dipilih saat modal dibuka
  useEffect(() => {
    if (isOpen && data) {
      setNomorAkun(data.nomorAkun ? String(data.nomorAkun) : "");
      setNamaAkun(data.namaAkun || "");
      setTipe(data.tipe || "Aset");
      setStandar(data.standar || "PSAK");
    }
  }, [isOpen, data]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Membersihkan format nomor akun dari karakter non-angka
      const cleanNomorAkun = nomorAkun.replace(/\D/g, '');

      // Endpoint PUT ke /api/coa/[id][cite: 21]
      const res = await fetch(`/api/coa/${data?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nomorAkun: cleanNomorAkun, 
          namaAkun, 
          tipe, 
          standar 
        }),
      });

      // Mencegah error "Unexpected end of JSON input" jika response kosong
      const text = await res.text();
      const responseData = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(responseData.message || "Gagal memperbarui akun");
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
      title="Edit Akun (CoA)" 
      actionLabel="Simpan Perubahan" 
      onAction={handleSubmit} 
      isLoading={isLoading}
    >
      {errorMsg && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{errorMsg}</div>}
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-stone-800">Nomor Akun</label>
          <input 
            type="text" 
            value={nomorAkun}
            onChange={(e) => setNomorAkun(e.target.value)}
            placeholder="Contoh: 111001" 
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-stone-800">Nama Akun</label>
          <input 
            type="text" 
            value={namaAkun}
            onChange={(e) => setNamaAkun(e.target.value)}
            placeholder="Contoh: Kas Kecil" 
            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-stone-800">Tipe</label>
            <select 
              value={tipe}
              onChange={(e) => setTipe(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm cursor-pointer"
            >
              <option value="Aset">Aset</option>
              <option value="Asset">Asset</option>
              <option value="Beban">Beban</option>
              <option value="Kewajiban">Kewajiban</option>
              <option value="Ekuitas">Ekuitas</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-stone-800">Standar</label>
            <select 
              value={standar}
              onChange={(e) => setStandar(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm cursor-pointer"
            >
              <option value="PSAK">PSAK</option>
              <option value="IFRS">IFRS</option>
              <option value="SAK ETAP">SAK ETAP</option>
            </select>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}