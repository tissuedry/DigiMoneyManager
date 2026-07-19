  'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import {
  PlusCircle,
  Camera,
  Upload,
  Check,
  ChevronDown,
  ArrowLeft,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useApi } from '@/lib/use-api';

function formatRupiah(value: string): string {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

interface PosAnggaranOption {
  id: string;
  label: string;
  disabled?: boolean;
  disabledNote?: string;
}

function PosAnggaranDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (id: string) => void;
  options: PosAnggaranOption[];
  placeholder: string;
  disabled?: boolean;
}) {
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

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-xl pl-3 pr-3 py-3 font-medium text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed ${!selected ? 'text-stone-400' : 'text-stone-800'}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`text-stone-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-stone-200 rounded-xl shadow-lg shadow-stone-900/5 overflow-hidden max-h-64 overflow-y-auto py-1">
          {options.length === 0 && (
            <div className="px-3 py-2.5 text-stone-400 text-xs font-medium">Tidak ada pilihan</div>
          )}
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
                  opt.disabled
                    ? 'text-stone-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-stone-700 hover:bg-stone-50 font-medium cursor-pointer'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.disabled && opt.disabledNote && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-400">
                    {opt.disabledNote}
                  </span>
                )}
                {!opt.disabled && isSelected && (
                  <Check size={13} className="text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AjukanReimbursementContent() {
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get('resubmitId');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentState, setCurrentState] = useState<'upload' | 'ocr' | 'review' | 'success'>(resubmitId ? 'review' : 'upload');
  const [isResubmitLoading, setIsResubmitLoading] = useState(!!resubmitId);
  const [resubmitStrukUrl, setResubmitStrukUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // ponytail: TanStack Query deduplicates /api/auth/me across Header, Sidebar, and this page
  const { data: meData } = useApi<any>("/api/auth/me");
  const { data: proyekData } = useApi<any>("/api/proyek?role=Karyawan");
  const { data: reimbData } = useApi<any>(
    resubmitId ? "/api/reimbursements?role=Karyawan" : null
  );
  const projects = proyekData?.projects ?? [];

  // Auto-select project when data loads
  const [proyekId, setProyekId] = useState('');
  const [mainAnggaranId, setMainAnggaranId] = useState('');
  const [subAnggaranId, setSubAnggaranId] = useState('');
  const [posAnggaranId, setPosAnggaranId] = useState(''); // holds the selected KeteranganAnggaran (leaf) id
  const [isLoading, setIsLoading] = useState(false);

  // Lightweight Main > Sub > Keterangan name tree for the selected project's
  // budget (id + name only, no financial data) — same ids the backend
  // validates reimbursements against.
  const { data: posAnggaranData } = useApi<any>(proyekId ? `/api/proyek/${proyekId}/pos-anggaran` : null);
  const mainAnggaranList = posAnggaranData?.posAnggaran ?? [];
  const subAnggaranList = mainAnggaranList.find((m: any) => String(m.id) === mainAnggaranId)?.subAnggaran ?? [];
  const keteranganList = subAnggaranList.find((s: any) => String(s.id) === subAnggaranId)?.keterangan ?? [];
  const selectedMainNama = mainAnggaranList.find((m: any) => String(m.id) === mainAnggaranId)?.namaMain ?? '';
  const selectedSubNama = subAnggaranList.find((s: any) => String(s.id) === subAnggaranId)?.namaSub ?? '';
  const selectedKeteranganNama = keteranganList.find((k: any) => String(k.id) === posAnggaranId)?.keterangan ?? '';
  const isPosAnggaranSelected = !!(mainAnggaranId && subAnggaranId && posAnggaranId);

  // Form states - Reimbursement fields
  const [merchant, setMerchant] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [nominal, setNominal] = useState("");
  const [kategoriBukti, setKategoriBukti] = useState("Struk Pembelian");
  const [keterangan, setKeterangan] = useState("");

  // File upload state and preview
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('/bukti_struk.png');

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

  useEffect(() => {
    // Pre-fill the form with the rejected submission's data and jump straight to "Review & kirim"
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
    setMerchant(original.ocrData?.merchant || '');
    setTanggal(original.ocrData?.tanggal || '');
    setNominal(original.nominal != null ? formatRupiah(String(Number(original.nominal))) : '');
    setKategoriBukti(original.ocrData?.kategoriBukti || 'Struk Pembelian');
    setKeterangan(original.ocrData?.keterangan || '');
    setFilePreview(original.strukUrl || '/bukti_struk.png');
    setResubmitStrukUrl(original.strukUrl || null);
    setCurrentState('review');
    setIsResubmitLoading(false);
  }, [resubmitId, reimbData]);

  const handleMainAnggaranChange = (id: string) => {
    setMainAnggaranId(id);
    setSubAnggaranId('');
    setPosAnggaranId('');
  };

  const handleSubAnggaranChange = (id: string) => {
    setSubAnggaranId(id);
    setPosAnggaranId('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUploadTrigger = () => {
    if (!isPosAnggaranSelected) {
      alert('Pilih pos anggaran (Main, Sub, dan Keterangan) terlebih dahulu');
      return;
    }
    triggerFileInput();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);

    setCurrentState('ocr');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMerchant(data.data.merchant);
        setTanggal(data.data.tanggal);
        setNominal(formatRupiah(data.data.nominal.toString()));
        setKategoriBukti(data.data.kategoriBukti);
        setKeterangan(data.data.keterangan);
        setCurrentState('review');
      } else {
        alert('VLM failed: ' + (data.message || 'Unknown error'));
        setCurrentState('upload');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to VLM API');
      setCurrentState('upload');
    }
  };

  const handleSubmitReimbursement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proyekId || !posAnggaranId) {
      alert('Pilih proyek dan pos anggaran terlebih dahulu');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('proyekId', proyekId);
    formData.append('keteranganAnggaranId', posAnggaranId);

    // Clean nominal string (e.g. "450.000" -> "450000")
    const cleanNominal = nominal.replace(/\./g, '').replace(/,/g, '.');
    formData.append('nominal', cleanNominal);

    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (resubmitStrukUrl) {
      formData.append('strukUrl', resubmitStrukUrl);
    }

    formData.append('ocrData', JSON.stringify({
      merchant,
      tanggal,
      kategoriBukti,
      keterangan,
      ...(resubmitId ? { resubmitFrom: Number(resubmitId) } : {}),
    }));

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
        alert(data.message || 'Gagal mengirim pengajuan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghubungi server');
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
  };

  if (isResubmitLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-stone-400 text-xs font-medium">
        Memuat data pengajuan...
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex text-stone-800 font-sans selection:bg-emerald-100 overflow-hidden">

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole='Karyawan'
      />

      {/* 2. MAIN AREA CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* CONTAINER CONTENT UTAMA */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 w-full mx-auto overflow-y-auto">

          <div className="space-y-1">
            <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Ajukan Reimbursement</h1>
            <p className="text-[14px] text-stone-400 mt-1.5">
              Foto struk-mu, biarkan AI yang mengisi. Pengajuan akan diteruskan ke Project Manager untuk validasi.
            </p>
          </div>

          {/* 3. COMPONENT STEPPER PROGRESS BAR */}
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

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' ? 'bg-stone-200' : 'bg-emerald-600'
                }`} />

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

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'upload' || currentState === 'ocr' ? 'bg-stone-200' : 'bg-emerald-600'
                }`} />

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

              <div className={`hidden md:block flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentState === 'success' ? 'bg-emerald-600' : 'bg-stone-200'
                }`} />

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
            <>
              {/* PILIH POS ANGGARAN */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-stone-900">Pilih pos anggaran</h2>
                  <p className="text-xs text-stone-400">
                    Tentukan dulu pengeluaran ini masuk ke pos mana, sebelum upload struk.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-stone-700">
                  <div className="space-y-1.5 text-left">
                    <label className="text-stone-500 font-bold">Main <span className="text-red-500">*</span></label>
                    <PosAnggaranDropdown
                      value={mainAnggaranId}
                      onChange={handleMainAnggaranChange}
                      placeholder="Pilih main..."
                      options={mainAnggaranList.map((m: any) => ({
                        id: String(m.id),
                        label: m.namaMain,
                        disabled: (m.subAnggaran?.length ?? 0) === 0,
                        disabledNote: 'Belum ada sub',
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-stone-500 font-bold">Sub <span className="text-red-500">*</span></label>
                    <PosAnggaranDropdown
                      value={subAnggaranId}
                      onChange={handleSubAnggaranChange}
                      placeholder="Pilih sub..."
                      disabled={!mainAnggaranId}
                      options={subAnggaranList.map((s: any) => ({
                        id: String(s.id),
                        label: s.namaSub,
                        disabled: (s.keterangan?.length ?? 0) === 0,
                        disabledNote: 'Belum ada keterangan',
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-stone-500 font-bold">Keterangan <span className="text-red-500">*</span></label>
                    <PosAnggaranDropdown
                      value={posAnggaranId}
                      onChange={setPosAnggaranId}
                      placeholder="Pilih keterangan..."
                      disabled={!subAnggaranId}
                      options={keteranganList.map((k: any) => ({
                        id: String(k.id),
                        label: k.keterangan,
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className={`bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-opacity ${!isPosAnggaranSelected ? 'opacity-60' : ''}`}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                <div className="md:col-span-6 space-y-4">
                  <h2 className="text-lg font-bold text-stone-900">Upload foto struk atau nota</h2>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Pastikan struk terlihat jelas, tidak terlipat, dan seluruh informasi (merchant, tanggal, total) terbaca. Format yang didukung: JPG, PNG, HEIC, atau PDF dengan ukuran maksimal 10MB.
                  </p>
                  <div className="flex items-center gap-2.5 pt-2">
                    <button onClick={handleUploadTrigger} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm">
                      <Camera size={14} /> Ambil foto
                    </button>
                    <button onClick={handleUploadTrigger} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm">
                      <Upload size={14} /> Unggah File
                    </button>
                  </div>
                </div>

                <div onClick={handleUploadTrigger} className="md:col-span-6 border-2 border-dashed border-stone-200 hover:border-emerald-500 bg-stone-50/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group">
                  <div className="w-9 h-9 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 group-hover:text-emerald-600 shadow-sm transition">
                    <Upload size={16} />
                  </div>
                  <span className="text-xs font-bold text-stone-700">Klik atau drop struk di sini</span>
                  <span className="text-[10px] text-stone-400">JPG, PNG, HEIC, PDF maks. 10MB</span>
                </div>
              </div>
            </>
          )}

          {/* STATE 2: AI OCR SEDANG MEMPROSES */}
          {currentState === 'ocr' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Sisi Kiri Mockup Gambar Struk */}
              <div className="md:col-span-4 bg-stone-100 rounded-xl overflow-hidden shadow-sm relative group aspect-3/4 max-w-60 mx-auto md:mx-0 flex items-center justify-center">
                <div className="animate-scan" />
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 pointer-events-none z-10 animate-pulse" />

                <img
                  src={filePreview}
                  alt="Bukti Struk"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Sisi Kanan Logika Loading Stepper Progress */}
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

                {/* Sublist Tracker Status OCR */}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Form Input Sisi Kiri */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm lg:col-span-8 space-y-5">
                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
                    Data berhasil diekstrak
                  </div>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs pt-1">
                    <span className="font-bold text-stone-400 tracking-wide">MAIN</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-900">{selectedMainNama || '-'}</span>
                    <span className="text-stone-300 px-1">—</span>
                    <span className="font-bold text-stone-400 tracking-wide">SUB</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-900">{selectedSubNama || '-'}</span>
                    <span className="text-stone-300 px-1">—</span>
                    <span className="font-bold text-stone-400 tracking-wide">KET</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-medium text-stone-500">{selectedKeteranganNama || '-'}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">Review & lengkapi data</h2>
                  <p className="text-xs text-stone-400">
                    Periksa data yang dibaca AI. Field yang ditandai dapat kamu ubah jika ada yang tidak sesuai.
                  </p>
                </div>

                <form className="space-y-4 text-xs font-bold text-stone-700" onSubmit={handleSubmitReimbursement}>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-stone-500 font-bold">Nama Reimbursement</label>
                      <input
                        type="text"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-bold">Tanggal Transaksi</label>
                        <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                      </div>
                      <div className="relative">
                        <input
                          type="date"
                          value={tanggal}
                          onChange={(e) => setTanggal(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all [color-scheme:light]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <label className="text-stone-500 font-bold">Nominal (IDR)</label>
                        <span className="bg-[#E0F2FE] text-[#0369A1] font-bold text-[9px] px-1.5 py-0.5 rounded-md leading-none shadow-sm select-none">dari VLM</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 font-medium text-stone-400 select-none">Rp</span>
                        <input
                          type="text"
                          value={nominal}
                          onChange={(e) => setNominal(formatRupiah(e.target.value))}
                          placeholder="0"
                          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-3 font-medium text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-stone-500 font-bold">Kategori Bukti</label>
                      <div className="relative">
                        <select
                          value={kategoriBukti}
                          onChange={(e) => setKategoriBukti(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-3 pr-10 py-3 font-medium text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                        >
                          <option value="Struk Pembelian">Struk Pembelian</option>
                          <option value="Kuitansi Resmi">Kuitansi Resmi</option>
                          <option value="Nota Kontan">Nota Kontan</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-stone-500 font-bold">Keterangan</label>
                    <textarea
                      rows={3}
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-3 font-medium text-stone-800 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <button type="button" onClick={handleResetForm} className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-800 transition">
                      <ArrowLeft size={14} /> Upload ulang
                    </button>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleResetForm} className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition">
                        Batal
                      </button>
                      <button type="submit" disabled={isLoading} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-70">
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                        Kirim ke project manager
                      </button>
                    </div>
                  </div>

                </form>
              </div>

              {/* Tampilan Ringkasan Bukti Struk Sisi Kanan */}
              {/* Tampilan Ringkasan Bukti Struk Sisi Kanan */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm lg:col-span-4 space-y-3">
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">Bukti Struk</h3>
                  <p className="text-[10px] text-stone-400 font-medium">Hasil scan. Klik gambar untuk memperbesar.</p>
                </div>
                {/* KODE DIUBAH: Ditambahkan fitur klik, hover, dan pointer zoom */}
                <div
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="w-full rounded-xl overflow-hidden bg-stone-50 border border-stone-200 aspect-3/4 relative flex items-center justify-center shadow-inner cursor-zoom-in hover:opacity-95 transition-all group"
                >
                  <img
                    src={filePreview}
                    alt="Bukti Struk"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay efek hover transparan */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-all">
                    <span className="bg-stone-900/80 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all font-medium">
                      Perbesar Gambar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: KONFIRMASI TERKIRIM */}
          {currentState === 'success' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-[#008F5D] text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-700/20">
                <Check size={36} className="stroke-3" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl font-extrabold text-stone-900">Pengajuan terkirim!</h2>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                  Pengajuan reimbursement senilai <span className="font-bold text-stone-900">Rp {nominal}</span> telah diteruskan ke Project Manager untuk validasi. Kamu akan mendapat notifikasi saat statusnya berubah.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/karyawan">
                  <button onClick={handleResetForm} className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm">
                      Kembali ke dashboard
                  </button>
                </Link>
                <button onClick={handleResetForm} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm">
                  <PlusCircle size={14} /> Ajukan lagi
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup jika area gambar yang di-klik
          >
            <img
              src={filePreview}
              alt="Bukti Struk Full Preview"
              className="max-w-full max-h-[82vh] object-contain rounded-xl"
            />
            <div className="flex justify-between items-center px-2 py-2 bg-stone-50 rounded-b-xl border-t border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500">Pratinjau Dokumen Bukti</span>
              <button
                type="button"
                className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold rounded-lg transition"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AjukanReimbursement() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-stone-400 text-xs font-medium">
        Memuat halaman...
      </div>
    }>
      <AjukanReimbursementContent />
    </Suspense>
  );
}