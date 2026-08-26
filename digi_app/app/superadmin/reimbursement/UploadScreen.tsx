'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, X, FileText, Sparkles, Plus, FolderOpen, ChevronDown, Check } from 'lucide-react';
import { formatBytes } from '@/lib/formatters';

export default function UploadScreen({
  selectedFiles,
  previews,
  maxLimit,
  projects,
  proyekId,
  onSelectProyek,
  onAddFiles,
  onRemoveFile,
  onClearAll,
  onStartScan,
}: {
  selectedFiles: File[];
  previews: Map<File, string>;
  maxLimit: number;
  projects: Array<{ id: number | string; nama?: string }>;
  proyekId: string;
  onSelectProyek: (id: string) => void;
  onAddFiles: (files: FileList | File[] | null) => void;
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onStartScan: () => void;
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProyekOpen, setIsProyekOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectedProyek = projects.find((p) => String(p.id) === proyekId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddFiles(e.target.files);
    e.target.value = '';
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    onAddFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,.pdf,application/pdf"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 space-y-3.5">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-stone-400" />
            <label className="text-xs font-bold text-stone-700">Proyek</label>
          </div>
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsProyekOpen((v) => !v)}
              className={`w-full md:w-72 flex items-center justify-between gap-2 bg-[#fcfbf9] border border-stone-200 rounded-xl pl-3 pr-3 py-2 text-xs font-semibold text-stone-700 hover:bg-white hover:border-stone-300 transition-all cursor-pointer ${isProyekOpen ? 'ring-2 ring-[#2d6a4f]/20 border-[#2d6a4f]' : ''}`}
            >
              <span className="truncate">{selectedProyek?.nama || `Proyek #${proyekId}`}</span>
              <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isProyekOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProyekOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsProyekOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-30 w-72 bg-white border border-stone-200 rounded-xl shadow-lg py-1 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-stone-500 bg-stone-50 border-b border-stone-100">
                    Pilih Proyek
                  </div>
                  <ul className="max-h-56 overflow-y-auto custom-scrollbar">
                    {projects.map((p) => (
                      <li key={String(p.id)}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProyek(String(p.id));
                            setIsProyekOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-100 flex items-center justify-between transition cursor-pointer"
                        >
                          <span className="truncate pr-2">{p.nama || `Proyek #${p.id}`}</span>
                          {String(p.id) === proyekId && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-stone-900">
              Upload Struk, Nota, atau PDF Invoice
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Kamu bisa mengunggah <span className="font-bold text-stone-700">beberapa foto struk sekaligus</span> atau mengambil foto langsung lewat kamera secara bergantian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              <Camera size={15} /> Ambil Foto Kamera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              <Upload size={15} /> Unggah File (Multi)
            </button>
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onDrop={handleFileDrop}
          className={`md:col-span-6 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group ${isDragActive
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-stone-200 hover:border-emerald-500 bg-stone-50/50'
            }`}
        >
          <div
            className={`pointer-events-none w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center shadow-sm transition ${isDragActive ? 'text-emerald-600' : 'text-stone-400 group-hover:text-emerald-600'
              }`}
          >
            <Upload size={18} />
          </div>
          <span className="pointer-events-none text-xs font-bold text-stone-700">
            Klik atau seret beberapa berkas ke sini
          </span>
          <span className="pointer-events-none text-[10px] text-stone-400">
            JPG, PNG, WEBP, atau PDF (Maksimal 5 berkas per scan)
          </span>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-stone-900">
                  Foto / Dokumen Struk Terpilih
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-md border border-emerald-200">
                  {selectedFiles.length} / {maxLimit} Berkas
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Tekan tombol tambah di bawah jika ingin menambah foto struk lainnya (Maks. 5 berkas).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-stone-500 hover:text-red-600 text-xs font-semibold hover:bg-red-50 rounded-lg transition"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {selectedFiles.map((file, idx) => {
              const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
              const previewUrl = previews.get(file) || '';

              return (
                <div
                  key={`${file.name}-${idx}`}
                  className="relative bg-stone-50 border border-stone-200 rounded-xl overflow-hidden group shadow-sm flex flex-col transition hover:border-emerald-500 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-stone-900/70 hover:bg-red-600 text-white flex items-center justify-center transition shadow cursor-pointer"
                    title="Hapus gambar ini"
                  >
                    <X size={12} />
                  </button>

                  <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-stone-900/70 text-white text-[9px]  font-bold select-none">
                    #{idx + 1}
                  </div>

                  <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center">
                        <FileText size={32} className="text-red-500" />
                        <span className="text-[9px] font-bold text-red-600 mt-1 uppercase">PDF File</span>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={`Struk ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    )}
                  </div>

                  <div className="p-2 bg-white border-t border-stone-100 flex-1 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-stone-800 truncate block" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[9px] text-stone-400 ">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                </div>
              );
            })}

            {selectedFiles.length < maxLimit ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 min-h-[75px] border-2 border-dashed border-stone-200 hover:border-emerald-500 bg-stone-50 hover:bg-emerald-50/40 rounded-xl flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-emerald-700 transition cursor-pointer p-2 text-center group"
                  title="Ambil foto lagi via kamera"
                >
                  <Camera size={18} className="group-hover:scale-110 transition" />
                  <span className="text-[10px] font-bold">+ Foto Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-h-[75px] border-2 border-dashed border-stone-200 hover:border-emerald-500 bg-stone-50 hover:bg-emerald-50/40 rounded-xl flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-emerald-700 transition cursor-pointer p-2 text-center group"
                  title="Pilih file lain dari perangkat"
                >
                  <Plus size={18} className="group-hover:scale-110 transition" />
                  <span className="text-[10px] font-bold">+ Tambah File</span>
                </button>
              </div>
            ) : (
              <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 flex flex-col items-center justify-center text-center text-amber-800 gap-1.5 min-h-[155px]">
                <span className="text-xs font-bold">Maks. 5 Berkas</span>
                <span className="text-[10px] text-amber-700 leading-tight">
                  Batas maksimum per scan telah tercapai.
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-500">
              Total <span className="font-bold text-stone-800">{selectedFiles.length} berkas</span> siap diproses
            </div>
            <button
              type="button"
              onClick={onStartScan}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Sparkles size={15} /> Mulai Scan AI ({selectedFiles.length} Struk)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
