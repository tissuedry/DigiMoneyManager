import React from "react";
import { X } from "lucide-react";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actionLabel?: string;
}

export default function ModalWrapper({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  breadcrumbs, 
  actionLabel = "Terapkan" 
}: ModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-start justify-between relative">
          <div className="pr-8">
            <h2 className="text-xl font-bold text-stone-900 leading-tight">{title}</h2>
            {breadcrumbs && (
              <div className="text-[12px] text-stone-600 mt-1.5 flex flex-wrap items-center gap-1.5">
                {breadcrumbs}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {children}
        </div>
        
        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-[13px] font-bold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition shadow-sm cursor-pointer"
          >
            Batal
          </button>
          <button className="px-5 py-2.5 text-[13px] font-bold text-white bg-[#1a1a1a] rounded-xl hover:bg-black transition shadow-sm cursor-pointer">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}