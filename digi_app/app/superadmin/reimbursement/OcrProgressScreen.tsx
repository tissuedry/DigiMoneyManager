'use client';

import { RefreshCw, Check, FileText } from 'lucide-react';

export default function OcrProgressScreen({
  files,
  previews,
}: {
  files: File[];
  previews: Map<File, string>;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
            <RefreshCw size={11} className="animate-spin" /> Gemini Multimodal Vision API
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">
            Menganalisis {files.length} Dokumen Struk Sekaligus..
          </h2>
          <p className="text-xs text-stone-400">
            Sistem mengekstrak nama merchant, tanggal transaksi, nominal, dan kategori dokumen secara paralel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {files.map((file, idx) => {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const previewUrl = previews.get(file) || '';

          return (
            <div
              key={idx}
              className="relative bg-stone-100 border border-stone-200 rounded-xl overflow-hidden aspect-3/4 flex items-center justify-center shadow-inner"
            >
              <div className="animate-scan" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 pointer-events-none z-10 animate-pulse" />

              <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-stone-900/70 text-white text-[9px]  font-bold">
                #{idx + 1}
              </div>

              {isPdf ? (
                <div className="p-2 text-center flex flex-col items-center">
                  <FileText size={36} className="text-red-500" />
                  <span className="text-[9px] font-bold text-stone-700 mt-1 truncate max-w-[80px]">
                    {file.name}
                  </span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt={`Scanning Struk ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold">
        <div className="flex items-center gap-2 text-stone-800">
          <div className="w-5 h-5 rounded-full bg-[#008F5D] text-white flex items-center justify-center">
            <Check size={12} className="stroke-3" />
          </div>
          <span>Deteksi Dokumen</span>
        </div>
        <div className="flex items-center gap-2 text-stone-800">
          <div className="w-5 h-5 rounded-full bg-[#008F5D] text-white flex items-center justify-center">
            <Check size={12} className="stroke-3" />
          </div>
          <span>Ekstraksi Vision VLM</span>
        </div>
        <div className="flex items-center gap-2 text-stone-800">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span>Parsing Data & Nominal</span>
        </div>
        <div className="flex items-center gap-2 text-stone-400">
          <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-500">
            4
          </div>
          <span>Menyiapkan Review</span>
        </div>
      </div>
    </div>
  );
}
