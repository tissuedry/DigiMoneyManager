'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/toast';
import DatePicker from '@/components/date-picker';
import ImageLightbox from '@/components/image-lightbox';
import {
  PlusCircle,
  Camera,
  Upload,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Search,
  FileText
} from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { compressReceiptFile } from '@/lib/image-compression';
import { formatRupiah } from '@/lib/formatters';

interface FlatKeteranganOption {
  id: string;
  keterangan: string;
  mainId: string;
  mainNama: string;
  subId: string;
  subNama: string;
}

// Komponen Search Dropdown Kustom untuk Keterangan
function KeteranganSearchDropdown({
  options,
  selectedLabel,
  onSelect,
  hasError
}: {
  options: FlatKeteranganOption[];
  selectedLabel: string;
  onSelect: (opt: FlatKeteranganOption) => void;
  hasError?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((opt) => opt.keterangan.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          placeholder="Cari keterangan..."
          className={`w-full bg-white border rounded-xl pl-4 pr-10 py-3.5 font-medium text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
            hasError ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
          }`}
        />
        <Search size={16} className="absolute right-4 top-4 text-stone-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-900/5 overflow-hidden max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-stone-400 text-sm font-medium">Tidak ada keterangan yang ditemukan</div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt);
                setQuery('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0"
            >
              <div className="text-sm font-bold text-stone-800 truncate">{opt.keterangan}</div>
              <div className="text-[11px] text-stone-400 font-medium mt-1 truncate">
                Main: {opt.mainNama} · Sub: {opt.subNama}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Komponen Dropdown Kustom untuk Proyek agar senada dengan UI
function CustomProjectSelect({
  projects,
  selectedValue,
  onChange,
  hasError
}: {
  projects: any[];
  selectedValue: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedProj = projects.find(p => String(p.id) === selectedValue);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border rounded-xl px-4 py-3.5 transition-all text-sm font-medium ${
          hasError ? 'border-red-300 ring-4 ring-red-500/10' : 
          isOpen ? 'border-[#008F5D] ring-4 ring-emerald-500/10' : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <span className={selectedProj ? 'text-stone-800' : 'text-stone-400'}>
          {selectedProj ? (selectedProj.nama || selectedProj.namaProyek || `Proyek ${selectedProj.id}`) : 'Pilih Proyek...'}
        </span>
        <ChevronDown size={16} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-900/5 overflow-hidden max-h-60 overflow-y-auto py-1">
          {projects.length === 0 ? (
            <div className="px-4 py-3 text-stone-400 text-sm font-medium">Tidak ada proyek tersedia</div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(String(p.id));
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-stone-50 ${
                  String(p.id) === selectedValue ? 'bg-emerald-50 text-emerald-700' : 'text-stone-700'
                }`}
              >
                {p.nama || p.namaProyek || `Proyek ${p.id}`}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AjukanReimbursementContent() {
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get('resubmitId');

  const [currentState, setCurrentState] = useState<'upload' | 'ocr' | 'review' | 'success'>(resubmitId ? 'review' : 'upload');
  const [isResubmitLoading, setIsResubmitLoading] = useState(!!resubmitId);
  const [resubmitStrukUrl, setResubmitStrukUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Fetching Data - Role diubah ke Superadmin
  const { data: meData } = useApi<any>("/api/auth/me");
  const { data: proyekData } = useApi<any>("/api/proyek?role=Superadmin");
  const { data: reimbData } = useApi<any>(
    resubmitId ? "/api/reimbursements?role=Superadmin" : null
  );
  const projects = proyekData?.projects ?? [];

  const [proyekId, setProyekId] = useState('');
  const [mainAnggaranId, setMainAnggaranId] = useState('');
  const [subAnggaranId, setSubAnggaranId] = useState('');
  const [posAnggaranId, setPosAnggaranId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  // Fetch hierarki anggaran BERDASARKAN ID proyek yang dipilih
  const { data: posAnggaranData } = useApi<any>(proyekId ? `/api/proyek/${proyekId}/pos-anggaran` : null);
  
  // Mengurai data anggaran sesuai schema prisma 
  // (Budget -> MainAnggaran -> SubAnggaran -> KeteranganAnggaran)
  const mainAnggaranList = posAnggaranData?.posAnggaran ?? []; 
  const subAnggaranList = mainAnggaranList.find((m: any) => String(m.id) === mainAnggaranId)?.subAnggaran ?? [];
  const keteranganList = subAnggaranList.find((s: any) => String(s.id) === subAnggaranId)?.keterangan ?? [];
  
  const selectedMainNama = mainAnggaranList.find((m: any) => String(m.id) === mainAnggaranId)?.namaMain ?? '';
  const selectedSubNama = subAnggaranList.find((s: any) => String(s.id) === subAnggaranId)?.namaSub ?? '';
  const selectedKeteranganNama = keteranganList.find((k: any) => String(k.id) === posAnggaranId)?.keterangan ?? '';

  // Membuat daftar flat dari KeteranganAnggaran untuk Dropdown Search
  const flatKeteranganOptions: FlatKeteranganOption[] = mainAnggaranList.flatMap((m: any) =>
    (m.subAnggaran ?? []).flatMap((s: any) =>
      (s.keterangan ?? []).map((k: any) => ({
        id: String(k.id),
        keterangan: k.keterangan,
        mainId: String(m.id),
        mainNama: m.namaMain,
        subId: String(s.id),
        subNama: s.namaSub,
      }))
    )
  );

  // Form states
  const [merchant, setMerchant] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [nominal, setNominal] = useState("");
  const [kategoriBukti, setKategoriBukti] = useState("Struk Pembelian");
  const [keterangan, setKeterangan] = useState("");
  const [formErrors, setFormErrors] = useState<{
    proyek?: string;
    posAnggaran?: string;
    merchant?: string;
    tanggal?: string;
    nominal?: string;
    kategoriBukti?: string;
  }>({});

  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('/bukti_struk.png');
  const [isDragActive, setIsDragActive] = useState(false);

  // Inisiasi Proyek Default (hanya dijalankan jika tidak ada resubmit)
  useEffect(() => {
    if (projects.length > 0 && !proyekId && !resubmitId) {
      const sessionProyekId = meData?.user?.proyekId;
      const hasSessionProyek = sessionProyekId && projects.some((p: any) => p.id === sessionProyekId);
      const selectedProj = hasSessionProyek
        ? projects.find((p: any) => p.id === sessionProyekId)
        : projects[0];

      setProyekId(String(selectedProj.id));
    }
  }, [projects, meData, resubmitId, proyekId]);

  // Load Data Jika Mode Resubmit
  useEffect(() => {
    if (!resubmitId || !reimbData?.reimbursements) return;

    const original = reimbData.reimbursements.find((r: any) => String(r.id) === resubmitId);
    if (!original || original.status !== 'REJECTED') {
      setCurrentState('upload');
      return;
    }

    setProyekId(String(original.proyekId));
    setMainAnggaranId(String(original.keteranganAnggaran?.subAnggaran?.mainAnggaranId ?? ''));
    setSubAnggaranId(String(original.keteranganAnggaran?.subAnggaranId ?? ''));
    setPosAnggaranId(String(original.keteranganAnggaranId ?? ''));
    setMerchant(original.merchant || original.nama || '');
    setTanggal(original.tanggalStruk ? new Date(original.tanggalStruk).toISOString().split('T')[0] : '');
    setNominal(original.nominal != null ? formatRupiah(String(Number(original.nominal))) : '');
    setKategoriBukti(original.kategoriBukti || 'Struk Pembelian');
    setKeterangan(original.keterangan || original.nama || '');
    setFilePreview(original.strukUrl || '/bukti_struk.png');
    setResubmitStrukUrl(original.strukUrl || null);
    setCurrentState('review');
    setIsResubmitLoading(false);
  }, [resubmitId, reimbData]);

  const clearFieldError = (field: keyof typeof formErrors) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleProyekSelect = (newProyekId: string) => {
    setProyekId(newProyekId);
    clearFieldError('proyek');
    // Reset keterangan karena data anggaran berbeda tiap proyek
    setMainAnggaranId('');
    setSubAnggaranId('');
    setPosAnggaranId('');
    clearFieldError('posAnggaran');
  };

  const handleKeteranganSelect = (opt: FlatKeteranganOption) => {
    setMainAnggaranId(opt.mainId);
    setSubAnggaranId(opt.subId);
    setPosAnggaranId(opt.id);
    clearFieldError('posAnggaran');
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const handleUploadTrigger = () => triggerFileInput();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setToastError('Ukuran file terlalu besar (Maksimal 10MB). Silakan pilih file yang lebih kecil.');
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setCurrentState('ocr');

    try {
      const readyFile = await compressReceiptFile(file);
      const formData = new FormData();
      formData.append('file', readyFile);
      formData.append(
        'filesMeta',
        JSON.stringify([
          {
            fileName: readyFile.name,
            originalSize: file.size,
            compressedSize: readyFile.size,
          },
        ])
      );

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data) {
        setTanggal(data.data.tanggal || new Date().toISOString().split('T')[0]);
        setNominal(formatRupiah((data.data.nominal || 0).toString()));
        setKategoriBukti(data.data.kategoriBukti || "Struk Pembelian");
        setKeterangan(data.data.keterangan || "");
        setCurrentState('review');
      } else {
        setToastError(data.message || 'Pemindaian AI Vision gagal. Silakan isi detail pengajuan secara manual.');
        setTanggal(new Date().toISOString().split('T')[0]);
        setNominal('');
        setKategoriBukti("Struk Pembelian");
        setKeterangan("");
        setCurrentState('review');
      }

    } catch (err: any) {
      console.error(err);
      setToastError('Gagal menghubungkan ke layanan AI Vision: ' + (err?.message || 'Error jaringan'));
      setCurrentState('review');
    }
  };

  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNominal = nominal.replace(/\./g, '').replace(/,/g, '.');
    const errors: typeof formErrors = {};
    
    if (!proyekId) errors.proyek = 'Proyek wajib dipilih';
    if (!posAnggaranId) errors.posAnggaran = 'Keterangan wajib dipilih';
    if (!merchant.trim()) errors.merchant = 'Nama reimbursement wajib diisi';
    if (!tanggal.trim()) errors.tanggal = 'Tanggal transaksi wajib diisi';
    if (!cleanNominal || Number(cleanNominal) <= 0) errors.nominal = 'Nominal wajib diisi';
    if (!kategoriBukti.trim()) errors.kategoriBukti = 'Kategori bukti wajib dipilih';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsLoading(true);

    const formData = new FormData();
    formData.append('proyekId', proyekId);
    formData.append('keteranganAnggaranId', posAnggaranId);
    formData.append('nominal', cleanNominal);
    formData.append('nama', merchant);
    formData.append('merchant', merchant);
    formData.append('tanggalStruk', tanggal);
    formData.append('kategoriBukti', kategoriBukti);
    formData.append('tipe', 'Reimbursement'); 
    
    if (keterangan) formData.append('deskripsi', keterangan); 
    if (selectedFile) {
      const readyFile = await compressReceiptFile(selectedFile);
      formData.append('file', readyFile);
    } else if (resubmitStrukUrl) {
      formData.append('strukUrl', resubmitStrukUrl);
    }
    if (resubmitId) formData.append('resubmitFrom', resubmitId);

    try {
      const res = await fetch('/api/reimbursements', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setNominal(parseFloat(cleanNominal).toLocaleString('id-ID'));
        setCurrentState('success');
      } else {
        setToastError(data.message || 'Gagal mengirim pengajuan');
      }
    } catch (err) {
      console.error(err);
      setToastError('Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setCurrentState('upload');
    setSelectedFile(null);
    setFilePreview('/bukti_struk.png');
    setMerchant("");
    setTanggal("");
    setNominal("");
    setKategoriBukti("Struk Pembelian");
    setKeterangan("");
    setResubmitStrukUrl(null);
    setFormErrors({});
  };

  const isPdf = selectedFile?.type === 'application/pdf' || selectedFile?.name?.toLowerCase().endsWith('.pdf');

  if (isResubmitLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-stone-400 text-xs font-medium">
        Memuat data pengajuan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-stone-800 font-sans selection:bg-emerald-100">
      <main className="flex-1 p-4 lg:p-8 space-y-6 w-full max-w-7xl mx-auto overflow-y-auto">

        <div className="space-y-1">
          <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Ajukan Reimbursement</h1>
          <p className="text-[14px] text-stone-400 mt-1.5">
            Foto struk-mu, biarkan AI yang mengisi. Pengajuan akan diteruskan ke Project Manager untuk validasi.
          </p>
        </div>

        {/* STEPPER */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 text-xs font-semibold px-2 relative">
            <div className="flex items-center gap-3 z-10">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check size={16} className="stroke-3" />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 leading-tight">Upload struk</h4>
                <p className="text-[10px] text-stone-400 font-medium">Foto atau gambar</p>
              </div>
            </div>

            <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' ? 'bg-stone-200' : 'bg-emerald-600'}`} />

            <div className="flex items-center gap-3 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'upload' ? 'bg-stone-100 text-stone-400 border border-stone-200' :
                  currentState === 'ocr' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                    'bg-emerald-600 text-white'
                }`}>
                {currentState === 'upload' || currentState === 'ocr' ? '2' : <Check size={16} className="stroke-3" />}
              </div>
              <div>
                <h4 className={`font-bold leading-tight ${currentState === 'upload' ? 'text-stone-400' : 'text-stone-800'}`}>Scan</h4>
                <p className="text-[10px] text-stone-400 font-medium">Otomatis baca data</p>
              </div>
            </div>

            <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' || currentState === 'ocr' ? 'bg-stone-200' : 'bg-emerald-600'}`} />

            <div className="flex items-center gap-3 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'review' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                  currentState === 'success' ? 'bg-emerald-600 text-white' :
                    'bg-stone-100 text-stone-400 border border-stone-200'
                }`}>
                {currentState === 'success' ? <Check size={16} className="stroke-3" /> : '3'}
              </div>
              <div>
                <h4 className={`font-bold leading-tight ${currentState === 'review' || currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>Review & kirim</h4>
                <p className="text-[10px] text-stone-400 font-medium">Verifikasi data</p>
              </div>
            </div>

            <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'success' ? 'bg-emerald-600' : 'bg-stone-200'}`} />

            <div className="flex items-center gap-3 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 ${currentState === 'success' ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                  'bg-stone-100 text-stone-400 border border-stone-200'
                }`}>
                4
              </div>
              <div>
                <h4 className={`font-bold leading-tight ${currentState === 'success' ? 'text-stone-800' : 'text-stone-400'}`}>Terkirim</h4>
                <p className="text-[10px] text-stone-400 font-medium">Menunggu approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* STATE 1: UPLOAD STRUK */}
        {currentState === 'upload' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,application/pdf"
            />
            <div className="md:col-span-6 space-y-4">
              <h2 className="text-lg font-bold text-stone-900">Upload bukti transaksi (Struk, Nota, atau PDF Invoice)</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pastikan struk/dokumen terlihat jelas dan seluruh informasi (tanggal & nominal) terbaca. Format yang didukung: JPG, PNG, WEBP, atau file PDF (Maksimal 10 Halaman / 10MB).
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                <button onClick={handleUploadTrigger} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer">
                  <Camera size={14} /> Ambil foto
                </button>
                <button onClick={handleUploadTrigger} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer">
                  <Upload size={14} /> Unggah File
                </button>
              </div>
            </div>

            <div
              onClick={handleUploadTrigger}
              onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
              onDrop={handleFileDrop}
              className={`md:col-span-6 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group ${
                isDragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-stone-200 hover:border-emerald-500 bg-stone-50/50'
              }`}
            >
              <div className={`pointer-events-none w-9 h-9 bg-white border border-stone-100 rounded-xl flex items-center justify-center shadow-sm transition ${
                isDragActive ? 'text-emerald-600' : 'text-stone-400 group-hover:text-emerald-600'
              }`}>
                <Upload size={16} />
              </div>
              <span className="pointer-events-none text-xs font-bold text-stone-700">Klik atau drop bukti di sini</span>
              <span className="pointer-events-none text-[10px] text-stone-400">JPG, PNG, WEBP, atau PDF (maks. 10MB / 10 Hal)</span>
            </div>
          </div>
        )}

        {/* STATE 2: AI OCR SEDANG MEMPROSES */}
        {currentState === 'ocr' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 bg-stone-100 rounded-xl overflow-hidden shadow-sm relative group aspect-3/4 max-w-60 mx-auto md:mx-0 flex items-center justify-center">
              <div className="animate-scan" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none z-10 animate-pulse" />
              {!!isPdf ? (
                <div className="w-full h-full bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <FileText size={48} className="text-red-500 mb-2" />
                  <span className="text-xs font-bold text-stone-800 truncate max-w-full px-2">{selectedFile?.name}</span>
                  <span className="text-[10px] text-stone-400 font-mono mt-1">{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB • Dokumen PDF</span>
                </div>
              ) : (
                <img src={filePreview} alt="Bukti Struk" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="md:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
                <RefreshCw size={11} className="animate-spin" /> Model sedang memproses
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-stone-900">Membaca strukmu..</h2>
                <p className="text-xs text-stone-400">
                  Sistem sedang mengekstrak nominal, tanggal transaksi, dan nama merchant. Proses biasanya selesai dalam 2 detik.
                </p>
              </div>
              <div className="space-y-3 pt-2 text-xs font-semibold">
                <div className="flex items-center gap-2.5 text-stone-800">
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={10} className="stroke-3" /></div>
                  <span>Deteksi tepi struk</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-800">
                  <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={10} className="stroke-3" /></div>
                  <span>Extrak teks (VLM)</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-800">
                  <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-white" /></div>
                  <span>Parsing nominal & tanggal</span>
                </div>
                <div className="flex items-center gap-2.5 text-stone-300">
                  <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-200" />
                  <span>Validasi anti-fraud</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: REVIEW & LENGKAPI DATA */}
        {currentState === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="bg-white border border-stone-200 rounded-2xl p-7 shadow-sm lg:col-span-8 space-y-6">
              <div className="space-y-1.5 border-b border-stone-100 pb-5">
                <h2 className="text-2xl font-extrabold text-stone-900">Review & lengkapi data</h2>
                <p className="text-sm text-stone-500">
                  Periksa data yang dibaca AI. Field yang ditandai dapat kamu ubah jika ada yang tidak sesuai.
                </p>
              </div>

              <form className="space-y-5 text-sm font-bold text-stone-700" onSubmit={handleSubmitReimbursement}>

                {/* 1. INPUT PROYEK KUSTOM (Mirip image_d35878.png) */}
                <div className="space-y-2 text-left">
                  <label className="text-stone-700 font-bold block">Proyek <span className="text-red-500">*</span></label>
                  <CustomProjectSelect
                    projects={projects}
                    selectedValue={proyekId}
                    onChange={handleProyekSelect}
                    hasError={!!formErrors.proyek}
                  />
                  {formErrors.proyek && <p className="text-red-500 text-xs font-medium">{formErrors.proyek}</p>}
                </div>

                {/* 2. INPUT KETERANGAN ANGGARAN (Mirip image_d357b7.png) */}
                <div className="space-y-2 text-left">
                  <label className="text-stone-700 font-bold block">Keterangan <span className="text-red-500">*</span></label>
                  
                  {/* Kotak Dropdown Search */}
                  <KeteranganSearchDropdown
                    options={flatKeteranganOptions}
                    selectedLabel={selectedKeteranganNama}
                    onSelect={handleKeteranganSelect}
                    hasError={!!formErrors.posAnggaran}
                  />
                  {formErrors.posAnggaran && <p className="text-red-500 text-xs font-medium">{formErrors.posAnggaran}</p>}

                  {/* Hierarki Teks (Main > Sub > Ket) yang ditampilkan setelah memilih */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-1.5 pl-1">
                    <span className="font-bold text-stone-400 tracking-wider">MAIN</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-800">{selectedMainNama || '-'}</span>
                    <ChevronRight size={12} className="text-stone-300 shrink-0 mx-0.5" />
                    
                    <span className="font-bold text-stone-400 tracking-wider">SUB</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-800">{selectedSubNama || '-'}</span>
                    <ChevronRight size={12} className="text-stone-300 shrink-0 mx-0.5" />
                    
                    <span className="font-bold text-stone-400 tracking-wider">KET</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-medium text-stone-600">{selectedKeteranganNama || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <label className="text-stone-700 font-bold">Nama Reimbursement <span className="text-red-500">*</span></label>
                      <span aria-hidden="true" className="opacity-0 pointer-events-none bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                    </div>
                    <input
                      type="text"
                      value={merchant}
                      onChange={(e) => { setMerchant(e.target.value); clearFieldError('merchant'); }}
                      placeholder="Ketik nama reimbursement..."
                      className={`w-full bg-white border rounded-xl px-4 py-3.5 font-medium text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                        formErrors.merchant ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
                      }`}
                    />
                    {formErrors.merchant && <p className="text-red-500 text-xs font-medium">{formErrors.merchant}</p>}
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <label className="text-stone-700 font-bold">Tanggal Transaksi <span className="text-red-500">*</span></label>
                      <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                    </div>
                    <DatePicker
                      value={tanggal}
                      onChange={(v) => { setTanggal(v); clearFieldError('tanggal'); }}
                      error={!!formErrors.tanggal}
                    />
                    {formErrors.tanggal && <p className="text-red-500 text-xs font-medium">{formErrors.tanggal}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <label className="text-stone-700 font-bold">Nominal (IDR) <span className="text-red-500">*</span></label>
                      <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-4 font-medium text-stone-400 select-none">Rp</span>
                      <input
                        type="text"
                        value={nominal}
                        onChange={(e) => { setNominal(formatRupiah(e.target.value)); clearFieldError('nominal'); }}
                        placeholder="0"
                        className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3.5 font-bold text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                          formErrors.nominal ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
                        }`}
                      />
                    </div>
                    {formErrors.nominal && <p className="text-red-500 text-xs font-medium">{formErrors.nominal}</p>}
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <label className="text-stone-700 font-bold">Kategori Bukti <span className="text-red-500">*</span></label>
                      <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                    </div>
                    <div className="relative">
                      <select
                        value={kategoriBukti}
                        onChange={(e) => { setKategoriBukti(e.target.value); clearFieldError('kategoriBukti'); }}
                        className={`w-full bg-white border rounded-xl pl-4 pr-10 py-3.5 font-medium text-stone-800 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                          formErrors.kategoriBukti ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
                        }`}
                      >
                        <option value="Struk Pembelian">Struk Pembelian</option>
                        <option value="Kuitansi Resmi">Kuitansi Resmi</option>
                        <option value="Nota Kontan">Nota Kontan</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-4 text-stone-400 pointer-events-none" />
                    </div>
                    {formErrors.kategoriBukti && <p className="text-red-500 text-xs font-medium">{formErrors.kategoriBukti}</p>}
                  </div>
                </div>

                <div className="space-y-2 text-left pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-stone-700 font-bold">Catatan</label>
                    <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                  </div>
                  <textarea
                    rows={3}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 font-medium text-stone-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-6 mt-6 border-t border-stone-100 gap-4">
                  <button type="button" onClick={handleResetForm} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-800 transition">
                    <ArrowLeft size={16} /> Upload ulang
                  </button>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button type="button" onClick={handleResetForm} className="flex-1 sm:flex-none px-5 py-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-sm font-bold rounded-xl transition">
                      Batal
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#008F5D] hover:bg-[#007A4F] text-white text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-70">
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                      Kirim ke project manager
                    </button>
                  </div>
                </div>

              </form>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm lg:col-span-4 space-y-4 sticky top-6">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Bukti Struk</h3>
                <p className="text-xs text-stone-500 mt-0.5">Hasil scan. Klik gambar untuk memperbesar.</p>
              </div>
              <div
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 aspect-3/4 relative flex items-center justify-center shadow-inner cursor-zoom-in hover:opacity-95 transition-all group"
              >
                {!!isPdf ? (
                  <div className="w-full h-full bg-stone-100 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                    <FileText size={64} className="text-red-500 mb-3" />
                    <span className="text-sm font-bold text-stone-800 truncate max-w-[200px]">{selectedFile?.name}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded font-bold mt-3">Dokumen PDF</span>
                  </div>
                ) : (
                  <img
                    src={filePreview}
                    alt="Bukti Struk"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                  <span className="bg-stone-900/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold tracking-wide">
                    Perbesar Gambar
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 4: KONFIRMASI TERKIRIM */}
        {currentState === 'success' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-sm max-w-2xl mx-auto text-center space-y-8 mt-10">
            <div className="w-20 h-20 bg-[#008F5D] text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20">
              <Check size={40} className="stroke-3" />
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-2xl font-extrabold text-stone-900">Pengajuan terkirim!</h2>
              <p className="text-sm text-stone-500 leading-relaxed font-medium">
                Pengajuan reimbursement senilai <span className="font-bold text-stone-900">Rp {nominal}</span> telah diteruskan ke Project Manager untuk validasi. Kamu akan mendapat notifikasi saat statusnya berubah.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/karyawan" className="w-full sm:w-auto">
                <button onClick={handleResetForm} className="w-full px-6 py-3.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-sm font-bold rounded-xl transition shadow-sm">
                    Kembali ke dashboard
                </button>
              </Link>
              <button onClick={handleResetForm} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-sm font-bold rounded-xl transition shadow-sm">
                <PlusCircle size={16} /> Ajukan lagi
              </button>
            </div>
          </div>
        )}

      </main>

      <ImageLightbox
        url={isPreviewModalOpen ? filePreview : null}
        onClose={() => setIsPreviewModalOpen(false)}
        isPdf={!!isPdf}
      />

      <Toast
        open={!!toastError}
        variant="error"
        message={toastError || ''}
        onClose={() => setToastError(null)}
      />
    </div>
  );
}

export default function AjukanReimbursement() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-stone-400 text-sm font-medium">
        Memuat halaman...
      </div>
    }>
      <AjukanReimbursementContent />
    </Suspense>
  );
}