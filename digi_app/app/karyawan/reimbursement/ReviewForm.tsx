'use client';

import { useRef } from 'react';
import {
  Check, ChevronDown, ChevronRight, ChevronLeft, Loader2,
  FileText, Trash2, Copy, Eye, Plus,
} from 'lucide-react';
import DatePicker from '@/components/date-picker';
import KeteranganSearchDropdown, { type FlatKeteranganOption } from './KeteranganSearchDropdown';
import { formatRibuan } from '@/lib/proyek-utils';

export interface StrukItem {
  id: string;
  file: File | null;
  previewUrl: string;
  isPdf: boolean;
  fileName: string;
  fileSizeText: string;
  resubmitStrukUrl?: string | null;
  isScanning?: boolean;

  mainAnggaranId: string;
  subAnggaranId: string;
  posAnggaranId: string;
  merchant: string;
  tanggal: string;
  nominal: string;
  kategoriBukti: string;
  keterangan: string;

  errors?: {
    posAnggaran?: string;
    merchant?: string;
    tanggal?: string;
    nominal?: string;
    kategoriBukti?: string;
  };
}

export interface MainAnggaran {
  id: number | string;
  namaMain: string;
  kode?: string | null;
  subAnggaran?: Array<{
    id: number | string;
    namaSub: string;
    kode?: string | null;
    keterangan?: Array<{ id: number | string; keterangan: string }>;
  }>;
}

export default function ReviewForm({
  strukList,
  activeIndex,
  onSelectIndex,
  grandTotal,
  maxLimit,
  options,
  mainAnggaranList,
  onUpdateField,
  onRemoveStruk,
  onApplyFirstToAll,
  onAppendFiles,
  isLoading,
  onSubmit,
  onReset,
  onPreviewStruk,
}: {
  strukList: StrukItem[];
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
  grandTotal: number;
  maxLimit: number;
  options: FlatKeteranganOption[];
  mainAnggaranList: MainAnggaran[];
  onUpdateField: (id: string, updates: Partial<StrukItem>) => void;
  onRemoveStruk: (id: string) => void;
  onApplyFirstToAll: () => void;
  onAppendFiles: (files: FileList | File[] | null) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onPreviewStruk: (item: StrukItem) => void;
}) {
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const appendCameraInputRef = useRef<HTMLInputElement>(null);

  if (strukList.length === 0) return null;

  const item = strukList[activeIndex] || strukList[0];
  if (!item) return null;

  const selectedMain = mainAnggaranList.find((m) => String(m.id) === item.mainAnggaranId);
  const selectedMainNama = selectedMain ? (selectedMain.kode ? `(${selectedMain.kode}) ${selectedMain.namaMain}` : selectedMain.namaMain) : '';
  const subList = selectedMain?.subAnggaran ?? [];
  const selectedSub = subList.find((s) => String(s.id) === item.subAnggaranId);
  const selectedSubNama = selectedSub ? (selectedSub.kode ? `(${selectedSub.kode}) ${selectedSub.namaSub}` : selectedSub.namaSub) : '';
  const selectedKeteranganNama =
    selectedSub?.keterangan?.find((k) => String(k.id) === item.posAnggaranId)?.keterangan || '';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input
        type="file"
        ref={appendFileInputRef}
        onChange={(e) => { onAppendFiles(e.target.files); e.target.value = ''; }}
        className="hidden"
        multiple
        accept="image/*,.pdf,application/pdf"
      />
      <input
        type="file"
        ref={appendCameraInputRef}
        onChange={(e) => { onAppendFiles(e.target.files); e.target.value = ''; }}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      {strukList.length > 1 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {strukList.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shrink-0 cursor-pointer ${activeIndex === idx
                  ? 'bg-[#008F5D] text-white border-[#008F5D] shadow-sm'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
              >
                <span>#{idx + 1}</span>
                <span className="truncate max-w-[120px]">{s.merchant || `Struk ${idx + 1}`}</span>
                <span className="text-[10px] opacity-80 ">
                  (Rp {s.nominal || '0'})
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStruk(s.id);
                  }}
                  className={`p-0.5 rounded hover:bg-black/20 ${activeIndex === idx ? 'text-white' : 'text-stone-400 hover:text-red-500'}`}
                  title="Hapus struk ini"
                >
                  <Trash2 size={12} />
                </span>
              </button>
            ))}

            {strukList.length < maxLimit && (
              <button
                type="button"
                onClick={() => appendFileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-stone-300 text-stone-600 hover:bg-stone-50 transition flex items-center gap-1 shrink-0 cursor-pointer"
                title="Tambah berkas struk lain"
              >
                <Plus size={13} /> Tambah Struk
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onApplyFirstToAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
              title="Salin Keterangan Pos Anggaran dari Struk #1 ke semua struk"
            >
              <Copy size={13} /> Terapkan Pos Struk #1 ke Semua
            </button>
            <div className="text-right">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Grand Total ({strukList.length} Struk)
              </span>
              <span className="text-sm font-extrabold text-stone-900 ">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E0F1EC] text-[#005837] text-xs font-semibold rounded-full">
              <Check size={13} className="stroke-3" /> Data berhasil diekstrak
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Review &amp; lengkapi data
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-normal">
              Periksa data yang dibaca AI. Field yang ditandai dapat kamu ubah jika ada yang tidak sesuai.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-1">
              <label className="text-stone-700 font-semibold text-xs">
                Keterangan <span className="text-red-500">*</span>
              </label>
            </div>
            <KeteranganSearchDropdown
              options={options}
              selectedLabel={selectedKeteranganNama}
              onSelect={(opt) => {
                onUpdateField(item.id, {
                  mainAnggaranId: opt.mainId,
                  subAnggaranId: opt.subId,
                  posAnggaranId: opt.id,
                });
              }}
              hasError={!!item.errors?.posAnggaran}
              placeholder="Cari keterangan..."
            />
            {item.errors?.posAnggaran && (
              <p className="text-red-500 font-medium text-[11px]">{item.errors.posAnggaran}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-1.5">
              <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider">MAIN</span>
              <span className="text-stone-800 font-semibold">· {selectedMainNama || 'Belum dipilih'}</span>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider">SUB</span>
              <span className="text-stone-800 font-semibold">· {selectedSubNama || 'Belum dipilih'}</span>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider">KET</span>
              <span className="text-stone-900 font-bold">· {selectedKeteranganNama || 'Belum dipilih'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-stone-700 font-semibold text-xs">
                Nama Reimbursement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={item.merchant}
                onChange={(e) => onUpdateField(item.id, { merchant: e.target.value })}
                placeholder="cth: Pembelian Alat Tulis"
                className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${item.errors?.merchant
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-stone-200 focus:border-[#008F5D]'
                  }`}
              />
              {item.errors?.merchant && (
                <p className="text-red-500 font-medium text-[11px]">{item.errors.merchant}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <label className="text-stone-700 font-semibold text-xs">
                  Tanggal Transaksi <span className="text-red-500">*</span>
                </label>
                <span className="px-2 py-0.5 bg-[#E0F1EC] text-[#005837] text-[10px] font-bold rounded-full">
                  dari VLM
                </span>
              </div>
              <DatePicker
                value={item.tanggal}
                onChange={(val) => onUpdateField(item.id, { tanggal: val })}
                error={!!item.errors?.tanggal}
              />
              {item.errors?.tanggal && (
                <p className="text-red-500 font-medium text-[11px]">{item.errors.tanggal}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <label className="text-stone-700 font-semibold text-xs">
                  Nominal (IDR) <span className="text-red-500">*</span>
                </label>
                <span className="px-2 py-0.5 bg-[#E0F1EC] text-[#005837] text-[10px] font-bold rounded-full">
                  dari VLM
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs sm:text-sm font-medium text-stone-400 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  value={item.nominal}
                  onChange={(e) => {
                    const { formatted, caret } = formatRibuan(e.target.value, e.target.selectionStart ?? 0);
                    onUpdateField(item.id, { nominal: formatted });
                    requestAnimationFrame(() => {
                      e.target.setSelectionRange(caret, caret);
                    });
                  }}
                  placeholder="0"
                  className={`w-full bg-white border rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-stone-900  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${item.errors?.nominal
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-stone-200 focus:border-[#008F5D]'
                    }`}
                />
              </div>
              {item.errors?.nominal && (
                <p className="text-red-500 font-medium text-[11px]">{item.errors.nominal}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <label className="text-stone-700 font-semibold text-xs">
                  Kategori Bukti <span className="text-red-500">*</span>
                </label>
                <span className="px-2 py-0.5 bg-[#E0F1EC] text-[#005837] text-[10px] font-bold rounded-full">
                  dari VLM
                </span>
              </div>
              <div className="relative">
                <select
                  value={item.kategoriBukti}
                  onChange={(e) => onUpdateField(item.id, { kategoriBukti: e.target.value })}
                  className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${item.errors?.kategoriBukti
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-stone-200 focus:border-[#008F5D]'
                    }`}
                >
                  <option value="Struk Pembelian">Struk Pembelian</option>
                  <option value="Invoice / Faktur">Invoice / Faktur</option>
                  <option value="Kuitansi Resmi">Kuitansi Resmi</option>
                  <option value="Nota Kontan">Nota Kontan</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3.5 top-3 text-stone-400 pointer-events-none"
                />
              </div>
              {item.errors?.kategoriBukti && (
                <p className="text-red-500 font-medium text-[11px]">{item.errors.kategoriBukti}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-stone-700 font-semibold text-xs">Catatan</label>
            <textarea
              rows={3}
              value={item.keterangan}
              onChange={(e) => onUpdateField(item.id, { keterangan: e.target.value })}
              placeholder="Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site..."
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-normal text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all resize-none"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <ChevronLeft size={16} /> Upload ulang
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {strukList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {activeIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
                      className="px-3 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      ← Sebelumnya
                    </button>
                  )}
                  {activeIndex < strukList.length - 1 && (
                    <button
                      type="button"
                      onClick={() => onSelectIndex(Math.min(strukList.length - 1, activeIndex + 1))}
                      className="px-3 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Berikutnya →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || strukList.length === 0}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#009162] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Kirim ke project manager
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xl font-bold text-stone-900 tracking-tight">Bukti Struk</h3>
              <p className="text-xs text-stone-400 font-normal">
                Hasil scan{strukList.length > 1 ? ` (Struk #${activeIndex + 1} dari ${strukList.length})` : ''}.
              </p>
            </div>
            {strukList.length > 1 && (
              <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs font-bold rounded-lg">
                #{activeIndex + 1} / {strukList.length}
              </span>
            )}
          </div>

          <div
            onClick={() => onPreviewStruk(item)}
            className="w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 aspect-3/4 relative flex items-center justify-center shadow-inner cursor-zoom-in hover:opacity-95 transition group"
            title="Klik untuk memperbesar foto struk"
          >
            {item.isScanning && (
              <>
                <div className="animate-scan" />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 via-amber-500/10 to-amber-500/0 pointer-events-none z-10 animate-pulse" />
              </>
            )}

            {item.isPdf ? (
              <div className="w-full h-full bg-stone-100 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <FileText size={56} className="text-red-500 mb-2" />
                <span className="text-xs font-bold text-stone-800 truncate max-w-[200px]">
                  {item.fileName}
                </span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 rounded font-bold mt-2">
                  Dokumen PDF
                </span>
              </div>
            ) : (
              <img
                src={item.previewUrl}
                alt={`Bukti Struk #${activeIndex + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            )}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition">
              <span className="bg-stone-900/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition font-medium inline-flex items-center gap-1.5 shadow-md">
                <Eye size={14} /> Klik untuk perbesar
              </span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 text-[11px] text-stone-500 space-y-1">
            <div className="flex justify-between">
              <span>Nama Berkas:</span>
              <span className="font-semibold text-stone-800 truncate max-w-[140px]">{item.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span>Ukuran File:</span>
              <span className="font-semibold text-stone-800">{item.fileSizeText}</span>
            </div>
            {strukList.length > 1 && (
              <div className="flex justify-between pt-1 border-t border-stone-200">
                <span>Grand Total ({strukList.length} Struk):</span>
                <span className="font-bold text-emerald-800 ">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
