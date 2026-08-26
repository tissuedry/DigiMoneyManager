'use client';

import { Check } from 'lucide-react';

export type ReimbursementStep = 'upload' | 'ocr' | 'review' | 'success';

export default function StepperHeader({ currentState }: { currentState: ReimbursementStep }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 text-xs font-semibold px-2 relative">
        <div className="flex items-center gap-3 z-10">
          <div className="w-8 h-8 rounded-full bg-[#008F5D] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Check size={16} className="stroke-3" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 leading-tight">Pilih Dokumen</h4>
            <p className="text-[10px] text-stone-400 font-medium">Single / Multi Struk</p>
          </div>
        </div>

        <div
          className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' ? 'bg-stone-200' : 'bg-[#008F5D]'
            }`}
        />

        <div className="flex items-center gap-3 z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'upload'
              ? 'bg-stone-100 text-stone-400 border border-stone-200'
              : currentState === 'ocr'
                ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-[#008F5D] text-white'
              }`}
          >
            {currentState === 'upload' || currentState === 'ocr' ? '2' : <Check size={16} className="stroke-3" />}
          </div>
          <div>
            <h4 className={`font-bold leading-tight ${currentState === 'upload' ? 'text-stone-400' : 'text-stone-800'}`}>
              Scan AI
            </h4>
            <p className="text-[10px] text-stone-400 font-medium">Multimodal Vision</p>
          </div>
        </div>

        <div
          className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' || currentState === 'ocr' ? 'bg-stone-200' : 'bg-[#008F5D]'
            }`}
        />

        <div className="flex items-center gap-3 z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'review'
              ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : currentState === 'success'
                ? 'bg-[#008F5D] text-white'
                : 'bg-stone-100 text-stone-400 border border-stone-200'
              }`}
          >
            {currentState === 'success' ? <Check size={16} className="stroke-3" /> : '3'}
          </div>
          <div>
            <h4 className={`font-bold leading-tight ${currentState === 'review' || currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>
              Review Tiap Struk
            </h4>
            <p className="text-[10px] text-stone-400 font-medium">Edit & Validasi Data</p>
          </div>
        </div>

        <div
          className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'success' ? 'bg-[#008F5D]' : 'bg-stone-200'
            }`}
        />

        <div className="flex items-center gap-3 z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'success'
              ? 'bg-[#008F5D] text-white shadow-md'
              : 'bg-stone-100 text-stone-400 border border-stone-200'
              }`}
          >
            4
          </div>
          <div>
            <h4 className={`font-bold leading-tight ${currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>
              Terkirim
            </h4>
            <p className="text-[10px] text-stone-400 font-medium">Ke Project Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
