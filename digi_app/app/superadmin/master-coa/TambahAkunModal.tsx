import React from "react";
import ModalWrapper from "./ModalWrapper";

export default function TambahAkunModal({ isOpen, onClose }: any) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Tambah Akun Baru" actionLabel="Simpan">
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nomor Akun</label>
        <input type="text" placeholder="Misal: 1-1104" className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Akun</label>
        <input type="text" placeholder="Masukkan nama..." className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" />
      </div>
    </ModalWrapper>
  );
}