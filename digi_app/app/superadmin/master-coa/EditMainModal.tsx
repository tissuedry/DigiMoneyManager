import React from "react";
import { ChevronDown } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function EditMainModal({ isOpen, onClose, data }: any) {
  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Main"
      breadcrumbs={
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{data?.main}</span>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Pilih Project</label>
        <div className="relative">
          <select className="w-full appearance-none bg-white border border-stone-200 text-stone-700 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] focus:ring-1 focus:ring-[#008f5d] transition shadow-sm cursor-pointer">
            <option>Renovasi Kantor Cabang Bandung</option>
            <option>Pembangunan Gudang Cikarang Fase 2</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
      </div>
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">ALIAS</span> · {data?.main}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Alias Baru</label>
        <input type="text" placeholder="Korek" className="w-full bg-white border border-stone-200 text-stone-800 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] focus:ring-1 focus:ring-[#008f5d] transition shadow-sm" />
      </div>
    </ModalWrapper>
  );
}