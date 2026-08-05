import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ModalWrapper from "./ModalWrapper";

export default function EditSubModal({ isOpen, onClose, data }: any) {
  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Sub"
      breadcrumbs={
        <>
          <span className="font-bold text-stone-800 tracking-tight">MAIN</span>
          <span className="text-stone-400">·</span>
          <span>{data?.main}</span>
          <ChevronRight size={12} className="text-stone-400 mx-0.5" />
          <span className="font-bold text-stone-400 tracking-tight">SUB</span>
          <span className="text-stone-400">·</span>
          <span className="font-bold text-stone-800">{data?.sub}</span>
        </>
      }
    >
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Pilih Project</label>
        <div className="relative">
          <select className="w-full appearance-none bg-white border border-stone-200 text-stone-700 text-[14px] rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d] transition shadow-sm">
            <option>Renovasi Kantor Cabang Bandung</option>
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        </div>
      </div>
      <div className="text-[13px] text-stone-700 font-medium">
        <span className="font-bold text-stone-800">ALIAS</span> · {data?.main}
      </div>
      <div className="space-y-1.5">
        <label className="text-[13px] font-bold text-stone-800">Nama Alias Baru</label>
        <input type="text" placeholder="Masukkan nama baru..." className="w-full border border-stone-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#008f5d]" />
      </div>
    </ModalWrapper>
  );
}