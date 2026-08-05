import React from "react";
import { ChevronRight } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function TambahKategoriModal({ isOpen, onClose, type, data }: any) {
  const getTitle = () => {
    if (type === 'tambahMain') return "Tambah Main Baru";
    if (type === 'tambahSub') return "Tambah Sub Baru";
    return "Tambah Keterangan Baru";
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
    if (type === 'tambahKet') {
      return (
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{data?.main}</span>
          <ChevronRight size={12} className="text-stone-400 mx-0.5" />
          <span className="font-bold text-stone-400 tracking-tight">SUB</span>
          <span className="text-stone-400">·</span>
          <span className="font-bold text-stone-800">{data?.sub}</span>
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
      breadcrumbs={getBreadcrumbs()}
    >
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Kategori Baru</label>
        <input type="text" placeholder="Masukkan nama..." className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" />
      </div>
    </ModalWrapper>
  );
}