'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import Toast from '@/components/toast';
import DatePicker from '@/components/date-picker';
import {
  PlusCircle,
  Camera,
  Upload,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Loader2,
  Search,
  X,
  FileText,
  Trash2,
  Sparkles,
  Copy,
  Eye,
  Plus
} from 'lucide-react';
import { useApi } from '@/lib/use-api';
import {
  compressReceiptFile,
  compressMultipleWithMeta,
} from '@/lib/image-compression';

function formatRupiah(value: string): string {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiahToNumber(value: string): number {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

interface FlatKeteranganOption {
  id: string;
  keterangan: string;
  mainId: string;
  mainNama: string;
  subId: string;
  subNama: string;
}

function KeteranganSearchDropdown({
  options,
  selectedLabel,
  onSelect,
  hasError,
  placeholder = "Cari keterangan pos anggaran..."
}: {
  options: FlatKeteranganOption[];
  selectedLabel: string;
  onSelect: (opt: FlatKeteranganOption) => void;
  hasError?: boolean;
  placeholder?: string;
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
    ? options.filter((opt) =>
      opt.keterangan.toLowerCase().includes(query.trim().toLowerCase()) ||
      opt.mainNama.toLowerCase().includes(query.trim().toLowerCase()) ||
      opt.subNama.toLowerCase().includes(query.trim().toLowerCase())
    )
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
          placeholder={placeholder}
          className={`w-full bg-white border rounded-xl pl-3 pr-10 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${hasError ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
            }`}
        />
        <Search size={14} className="absolute right-3 top-3 text-stone-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-stone-200 rounded-xl shadow-xl shadow-stone-900/10 overflow-hidden max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2.5 text-stone-400 text-xs font-medium text-center">
              Tidak ada keterangan yang ditemukan
            </div>
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
              className="w-full text-left px-3 py-2 hover:bg-emerald-50/60 transition-colors border-b border-stone-100 last:border-0"
            >
              <div className="text-xs font-bold text-stone-800 truncate">{opt.keterangan}</div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                Main: <span className="text-stone-600">{opt.mainNama}</span> · Sub: <span className="text-stone-600">{opt.subNama}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Data Model untuk masing-masing Struk dalam pengajuan
interface StrukItem {
  id: string;
  file: File | null;
  previewUrl: string;
  isPdf: boolean;
  fileName: string;
  fileSizeText: string;
  resubmitStrukUrl?: string | null;
  isScanning?: boolean;

  // Data Form
  mainAnggaranId: string;
  subAnggaranId: string;
  posAnggaranId: string; // Keterangan ID
  merchant: string;
  tanggal: string;
  nominal: string; // Formatted Rupiah
  kategoriBukti: string;
  keterangan: string;

  // Error validation
  errors?: {
    posAnggaran?: string;
    merchant?: string;
    tanggal?: string;
    nominal?: string;
    kategoriBukti?: string;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function AjukanReimbursementContent() {
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get('resubmitId');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentState, setCurrentState] = useState<'upload' | 'ocr' | 'review' | 'success'>(
    resubmitId ? 'review' : 'upload'
  );
  const [isResubmitLoading, setIsResubmitLoading] = useState(!!resubmitId);

  // Modal Zoom Struk Preview
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activePreviewStruk, setActivePreviewStruk] = useState<{ url: string; isPdf: boolean; name: string } | null>(null);
  const [previewZoomScale, setPreviewZoomScale] = useState<number>(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoomAndPan = () => {
    setPreviewZoomScale(1);
    setPanPos({ x: 0, y: 0 });
    setIsDragging(false);
  };

  useEffect(() => {
    if (isPreviewModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isPreviewModalOpen]);

  // API Data
  const { data: meData } = useApi<any>("/api/auth/me");
  const { data: proyekData } = useApi<any>("/api/proyek?role=Karyawan");
  const { data: reimbData } = useApi<any>(
    resubmitId ? "/api/reimbursements?role=Karyawan" : null
  );
  const projects = proyekData?.projects ?? [];

  const [proyekId, setProyekId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  // Keterangan Tree
  const { data: posAnggaranData } = useApi<any>(proyekId ? `/api/proyek/${proyekId}/pos-anggaran` : null);
  const mainAnggaranList = posAnggaranData?.posAnggaran ?? [];

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

  // Multi-File Upload & Capture States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const appendCameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // List of parsed/editable receipts in review mode
  const [strukList, setStrukList] = useState<StrukItem[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);

  // Submission Summary State
  const [submittedTotalNominal, setSubmittedTotalNominal] = useState<string>('0');
  const [submittedTotalCount, setSubmittedTotalCount] = useState<number>(0);

  // Auto-select Proyek
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

  // Handle Resubmit prefill (single item flow from history)
  useEffect(() => {
    if (!resubmitId || !reimbData?.reimbursements) return;

    const original = reimbData.reimbursements.find((r: any) => String(r.id) === resubmitId);
    if (!original || original.status !== 'REJECTED') {
      setCurrentState('upload');
      return;
    }

    setProyekId(String(original.proyekId));
    const singleItem: StrukItem = {
      id: 'resubmit-' + original.id,
      file: null,
      previewUrl: original.strukUrl || '/bukti_struk.png',
      isPdf: (original.strukUrl || '').toLowerCase().includes('.pdf'),
      fileName: original.merchant || 'Struk Resubmit',
      fileSizeText: 'Tersimpan di Cloud',
      resubmitStrukUrl: original.strukUrl || null,
      mainAnggaranId: String(original.keteranganAnggaran?.subAnggaran?.mainAnggaranId ?? ''),
      subAnggaranId: String(original.keteranganAnggaran?.subAnggaranId ?? ''),
      posAnggaranId: String(original.keteranganAnggaranId ?? ''),
      merchant: original.merchant || original.nama || '',
      tanggal: original.tanggalStruk ? new Date(original.tanggalStruk).toISOString().split('T')[0] : '',
      nominal: original.nominal != null ? formatRupiah(String(Number(original.nominal))) : '',
      kategoriBukti: original.kategoriBukti || 'Struk Pembelian',
      keterangan: original.keterangan || original.nama || '',
      errors: {},
    };

    setStrukList([singleItem]);
    setCurrentState('review');
    setIsResubmitLoading(false);
  }, [resubmitId, reimbData]);

  const MAX_SCAN_LIMIT = 5;

  // Helper to add files to selectedFiles (Maksimal 5 berkas per scan)
  const addFilesToSelection = (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const arrayFiles = Array.from(newFiles);

    setSelectedFiles((prev) => {
      const combined = [...prev];
      let limitReached = false;

      for (const f of arrayFiles) {
        if (combined.length >= MAX_SCAN_LIMIT) {
          limitReached = true;
          break;
        }
        // Prevent exact duplicate by name and size
        if (!combined.some(item => item.name === f.name && item.size === f.size)) {
          combined.push(f);
        }
      }

      if (limitReached) {
        setToastError(`Batas maksimal sekali scan adalah ${MAX_SCAN_LIMIT} berkas struk.`);
      }

      return combined;
    });
  };

  const removeFileFromSelection = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFilesToSelection(e.target.files);
    e.target.value = '';
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    addFilesToSelection(e.dataTransfer.files);
  };

  // Trigger OCR on all selected files
  const handleStartScan = async () => {
    if (selectedFiles.length === 0) {
      setToastError('Silakan pilih minimal 1 foto/dokumen struk terlebih dahulu.');
      return;
    }

    setCurrentState('ocr');

    try {
      // Kompresi cerdas di browser (Resize maks 1600px jika > 1.5 MB)
      const compressResults = await compressMultipleWithMeta(selectedFiles);

      const formData = new FormData();
      const filesMeta: Array<{ fileName: string; originalSize: number; compressedSize: number }> = [];

      for (const item of compressResults) {
        formData.append('files', item.file);
        filesMeta.push({
          fileName: item.file.name,
          originalSize: item.originalSize,
          compressedSize: item.compressedSize,
        });
      }
      formData.append('filesMeta', JSON.stringify(filesMeta));

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      const extractedItems: any[] = resJson.items || (resJson.data ? [resJson.data] : []);

      const today = new Date().toISOString().split('T')[0];

      // Build struk items array corresponding to each selected file
      const newStrukList: StrukItem[] = selectedFiles.map((file, idx) => {
        const aiData = extractedItems[idx] || {};
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const previewUrl = URL.createObjectURL(file);

        return {
          id: `struk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl,
          isPdf,
          fileName: file.name,
          fileSizeText: formatBytes(file.size),
          mainAnggaranId: '',
          subAnggaranId: '',
          posAnggaranId: '',
          merchant: aiData.merchant || `Struk #${idx + 1}`,
          tanggal: aiData.tanggal || today,
          nominal: aiData.nominal ? formatRupiah(String(aiData.nominal)) : '',
          kategoriBukti: aiData.kategoriBukti || 'Struk Pembelian',
          keterangan: aiData.keterangan || '',
          errors: {},
        };
      });

      setStrukList(newStrukList);
      setCurrentState('review');

      if (!resJson.success) {
        setToastError(resJson.message || 'Sebagian data struk mungkin perlu dilengkapi secara manual.');
      } else {
        setToastSuccess(`Berhasil memindai ${newStrukList.length} struk dengan AI Vision.`);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setToastError('Gagal memproses AI OCR: ' + (err?.message || 'Error jaringan'));

      // Tetap sediakan form manual untuk semua file terpilih
      const today = new Date().toISOString().split('T')[0];
      const fallbackList: StrukItem[] = selectedFiles.map((file, idx) => ({
        id: `struk-manual-${Date.now()}-${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
        fileName: file.name,
        fileSizeText: formatBytes(file.size),
        mainAnggaranId: '',
        subAnggaranId: '',
        posAnggaranId: '',
        merchant: '',
        tanggal: today,
        nominal: '',
        kategoriBukti: 'Struk Pembelian',
        keterangan: '',
        errors: {},
      }));

      setStrukList(fallbackList);
      setCurrentState('review');
    }
  };

  // Update specific field on a struk in review state
  const updateStrukField = (id: string, updates: Partial<StrukItem>) => {
    setStrukList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedErrors = { ...(item.errors || {}) };
          // Clear errors for fields being updated
          if (updates.posAnggaranId !== undefined) delete updatedErrors.posAnggaran;
          if (updates.merchant !== undefined) delete updatedErrors.merchant;
          if (updates.tanggal !== undefined) delete updatedErrors.tanggal;
          if (updates.nominal !== undefined) delete updatedErrors.nominal;
          if (updates.kategoriBukti !== undefined) delete updatedErrors.kategoriBukti;

          return { ...item, ...updates, errors: updatedErrors };
        }
        return item;
      })
    );
  };

  // Remove a struk from review state
  const removeStrukFromReview = (id: string) => {
    setStrukList((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) {
        // Return to upload if all deleted
        setCurrentState('upload');
        setSelectedFiles([]);
        setActiveReviewIndex(0);
      } else {
        setActiveReviewIndex((prevIdx) => Math.min(prevIdx, next.length - 1));
      }
      return next;
    });
  };

  // Helper to copy first struk's Pos Anggaran to all struk items
  const applyFirstPosToAll = () => {
    if (strukList.length === 0) return;
    const first = strukList[0];
    if (!first.posAnggaranId) {
      setToastError('Pilih Keterangan Pos Anggaran pada Struk #1 terlebih dahulu.');
      return;
    }

    setStrukList((prev) =>
      prev.map((item) => ({
        ...item,
        mainAnggaranId: first.mainAnggaranId,
        subAnggaranId: first.subAnggaranId,
        posAnggaranId: first.posAnggaranId,
        errors: { ...(item.errors || {}), posAnggaran: undefined },
      }))
    );
    setToastSuccess('Keterangan Pos Anggaran Struk #1 berhasil diterapkan ke semua struk!');
  };

  // Append more receipts while in Review state (Auto Scan in Background without leaving page)
  const handleAppendFileInReview = async (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const filesArray = Array.from(newFiles);
    const today = new Date().toISOString().split('T')[0];

    const remainingQuota = MAX_SCAN_LIMIT - strukList.length;
    if (remainingQuota <= 0) {
      setToastError(`Batas pengajuan per sesi adalah maksimal ${MAX_SCAN_LIMIT} berkas struk.`);
      return;
    }

    const acceptedFiles = filesArray.slice(0, remainingQuota);
    if (filesArray.length > remainingQuota) {
      setToastError(`Hanya ${remainingQuota} struk yang ditambahkan karena mencapai batas maksimal ${MAX_SCAN_LIMIT} struk.`);
    }

    // Opsi bawaan pos anggaran dari struk pertama jika sudah ada
    const firstPos = strukList[0];

    const additionalItems: StrukItem[] = acceptedFiles.map((file, idx) => ({
      id: `struk-appended-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
      fileName: file.name,
      fileSizeText: formatBytes(file.size),
      isScanning: true,
      mainAnggaranId: firstPos?.mainAnggaranId || '',
      subAnggaranId: firstPos?.subAnggaranId || '',
      posAnggaranId: firstPos?.posAnggaranId || '',
      merchant: `Struk Tambahan #${strukList.length + idx + 1}`,
      tanggal: today,
      nominal: '',
      kategoriBukti: 'Struk Pembelian',
      keterangan: '',
      errors: {},
    }));

    // Langsung masukkan ke strukList dengan status isScanning: true
    setStrukList((prev) => [...prev, ...additionalItems]);
    setToastSuccess(`Sedang memindai ${additionalItems.length} struk tambahan dengan AI...`);

    // Jalankan OCR di background untuk file-file tambahan ini
    try {
      const compressResults = await compressMultipleWithMeta(acceptedFiles);
      const formData = new FormData();
      const filesMeta: Array<{ fileName: string; originalSize: number; compressedSize: number }> = [];

      for (const item of compressResults) {
        formData.append('files', item.file);
        filesMeta.push({
          fileName: item.file.name,
          originalSize: item.originalSize,
          compressedSize: item.compressedSize,
        });
      }
      formData.append('filesMeta', JSON.stringify(filesMeta));

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      const extractedItems: any[] = resJson.items || (resJson.data ? [resJson.data] : []);

      setStrukList((prev) =>
        prev.map((item) => {
          const matchIdx = additionalItems.findIndex((ai) => ai.id === item.id);
          if (matchIdx !== -1) {
            const aiData = extractedItems[matchIdx] || {};
            return {
              ...item,
              isScanning: false,
              merchant: aiData.merchant || item.merchant,
              tanggal: aiData.tanggal || today,
              nominal: aiData.nominal ? formatRupiah(String(aiData.nominal)) : item.nominal,
              kategoriBukti: aiData.kategoriBukti || item.kategoriBukti,
              keterangan: aiData.keterangan || item.keterangan,
            };
          }
          return item;
        })
      );

      if (resJson.success) {
        setToastSuccess(`Struk tambahan berhasil dipindai oleh AI!`);
      } else {
        setToastError(resJson.message || 'Sebagian data struk tambahan mungkin perlu diisi manual.');
      }
    } catch (err: any) {
      console.error('Append OCR error:', err);
      setStrukList((prev) =>
        prev.map((item) => {
          if (additionalItems.some((ai) => ai.id === item.id)) {
            return { ...item, isScanning: false };
          }
          return item;
        })
      );
      setToastError('Gagal memindai struk tambahan secara otomatis. Silakan lengkapi data manual.');
    }
  };

  // Calculate Grand Total
  const grandTotalNominal = strukList.reduce((acc, item) => {
    return acc + parseRupiahToNumber(item.nominal);
  }, 0);

  // Submit all validated receipts in PARALLEL (Bebas N+1 Waterfall)
  const handleSubmitAllReimbursements = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proyekId) {
      setToastError('Silakan pilih proyek terlebih dahulu.');
      return;
    }

    if (strukList.length === 0) {
      setToastError('Tidak ada struk yang diajukan.');
      return;
    }

    // Validate each struk
    let hasError = false;
    const validatedList = strukList.map((item, idx) => {
      const errors: typeof item.errors = {};
      const cleanNom = parseRupiahToNumber(item.nominal);

      if (!item.posAnggaranId) errors.posAnggaran = 'Keterangan pos wajib dipilih';
      if (!item.merchant.trim()) errors.merchant = 'Nama reimbursement wajib diisi';
      if (!item.tanggal.trim()) errors.tanggal = 'Tanggal transaksi wajib diisi';
      if (cleanNom <= 0) errors.nominal = 'Nominal wajib diisi & lebih dari 0';
      if (!item.kategoriBukti.trim()) errors.kategoriBukti = 'Kategori bukti wajib dipilih';

      if (Object.keys(errors).length > 0) {
        hasError = true;
      }
      return { ...item, errors };
    });

    setStrukList(validatedList);

    if (hasError) {
      setToastError('Mohon lengkapi seluruh field wajib pada setiap struk yang bertanda merah.');
      return;
    }

    setIsLoading(true);

    try {
      // Eksekusi pengunggahan seluruh struk secara PARALEL BERSAMAAN (Promise.all)
      await Promise.all(
        strukList.map(async (item) => {
          const cleanNominalStr = String(parseRupiahToNumber(item.nominal));
          const formData = new FormData();
          formData.append('proyekId', proyekId);
          formData.append('keteranganAnggaranId', item.posAnggaranId);
          formData.append('nominal', cleanNominalStr);

          if (item.file) {
            // Pastikan file terkompresi sebelum diunggah ke storage
            const readyFile = await compressReceiptFile(item.file);
            formData.append('file', readyFile);
          } else if (item.resubmitStrukUrl) {
            formData.append('strukUrl', item.resubmitStrukUrl);
          }

          formData.append('nama', item.merchant);
          formData.append('merchant', item.merchant);
          formData.append('tanggalStruk', item.tanggal);
          formData.append('kategoriBukti', item.kategoriBukti);
          formData.append('tipe', 'Reimbursement');

          if (item.keterangan) {
            formData.append('deskripsi', item.keterangan);
          }

          if (resubmitId) {
            formData.append('resubmitFrom', resubmitId);
          }

          const res = await fetch('/api/reimbursements', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || `Gagal mengirim pengajuan untuk ${item.merchant}`);
          }
        })
      );

      setSubmittedTotalNominal(grandTotalNominal.toLocaleString('id-ID'));
      setSubmittedTotalCount(strukList.length);
      setCurrentState('success');
    } catch (err: any) {
      console.error('Submit error:', err);
      setToastError(err?.message || 'Terjadi kesalahan saat mengirim pengajuan ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setCurrentState('upload');
    setSelectedFiles([]);
    setStrukList([]);
    setActiveReviewIndex(0);
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
      {/* 1. SIDEBAR */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      {/* 2. MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 space-y-6 w-full mx-auto overflow-y-auto">
          {/* Header Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Ajukan Reimbursement</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                <Sparkles size={11} className="text-emerald-600" /> Multi-Struk AI
              </span>
            </div>
            <p className="text-[13px] text-stone-400">
              Unggah atau foto beberapa struk sekaligus. AI akan mengekstrak nominal, tanggal, dan vendor tiap struk secara otomatis.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 text-xs font-semibold px-2 relative">
              {/* Step 1 */}
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

              {/* Step 2 */}
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

              {/* Step 3 */}
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

              {/* Step 4 */}
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

          {/* ============================================================== */}
          {/* STATE 1: UPLOAD / AMBIL FOTO (Dukungan Multi-Struk & Add More) */}
          {/* ============================================================== */}
          {currentState === 'upload' && (
            <div className="space-y-6">
              {/* Hidden Inputs */}
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

              {/* Dropzone & Action Top Box */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6 space-y-3.5">
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

              {/* DAFTAR FOTO STRUK YANG SUDAH DITAMBAHKAN */}
              {selectedFiles.length > 0 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-stone-900">
                          Foto / Dokumen Struk Terpilih
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-md border border-emerald-200">
                          {selectedFiles.length} / {MAX_SCAN_LIMIT} Berkas
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Tekan tombol tambah di bawah jika ingin menambah foto struk lainnya (Maks. 5 berkas).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="px-3 py-1.5 text-stone-500 hover:text-red-600 text-xs font-semibold hover:bg-red-50 rounded-lg transition"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>

                  {/* Grid Galeri Struk */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                    {selectedFiles.map((file, idx) => {
                      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                      const previewUrl = URL.createObjectURL(file);

                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="relative bg-stone-50 border border-stone-200 rounded-xl overflow-hidden group shadow-sm flex flex-col transition hover:border-emerald-500 hover:shadow-md"
                        >
                          {/* Tombol Hapus X */}
                          <button
                            type="button"
                            onClick={() => removeFileFromSelection(idx)}
                            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-stone-900/70 hover:bg-red-600 text-white flex items-center justify-center transition shadow cursor-pointer"
                            title="Hapus gambar ini"
                          >
                            <X size={12} />
                          </button>

                          {/* Badge Index */}
                          <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-stone-900/70 text-white text-[9px] font-mono font-bold select-none">
                            #{idx + 1}
                          </div>

                          {/* Image/PDF Thumbnail */}
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

                          {/* Info footer */}
                          <div className="p-2 bg-white border-t border-stone-100 flex-1 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-stone-800 truncate block" title={file.name}>
                              {file.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* TOMBOL + TAMBAH GAMBAR LAGI (Maksimal 5) */}
                    {selectedFiles.length < MAX_SCAN_LIMIT ? (
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

                  {/* Tombol Eksekusi Scan AI */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-stone-500">
                      Total <span className="font-bold text-stone-800">{selectedFiles.length} berkas</span> siap diproses
                    </div>
                    <button
                      type="button"
                      onClick={handleStartScan}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-700/20 cursor-pointer"
                    >
                      <Sparkles size={15} /> Mulai Scan AI ({selectedFiles.length} Struk)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STATE 2: AI OCR SEDANG MEMPROSES (BATCH SCANNING VISUALIZER)    */}
          {/* ============================================================== */}
          {currentState === 'ocr' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#DDF2E8] text-[#198754] text-[10px] font-bold rounded-md">
                    <RefreshCw size={11} className="animate-spin" /> Gemini Multimodal Vision API
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900">
                    Menganalisis {selectedFiles.length} Dokumen Struk Sekaligus..
                  </h2>
                  <p className="text-xs text-stone-400">
                    Sistem mengekstrak nama merchant, tanggal transaksi, nominal, dan kategori dokumen secara paralel.
                  </p>
                </div>
              </div>

              {/* Strip Preview Berkas dengan Animasi Scanning */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {selectedFiles.map((file, idx) => {
                  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                  const previewUrl = URL.createObjectURL(file);

                  return (
                    <div
                      key={idx}
                      className="relative bg-stone-100 border border-stone-200 rounded-xl overflow-hidden aspect-3/4 flex items-center justify-center shadow-inner"
                    >
                      {/* Animated scan bar */}
                      <div className="animate-scan" />
                      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 pointer-events-none z-10 animate-pulse" />

                      <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-md bg-stone-900/70 text-white text-[9px] font-mono font-bold">
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

              {/* Tracker Status Pemindaian */}
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
          )}

          {/* ============================================================== */}
          {/* STATE 3: REVIEW & EDIT INDIVIDUAL PER STRUK (KIRI: FORM, KANAN: BUKTI STRUK) */}
          {/* ============================================================== */}
          {currentState === 'review' && (
            <form onSubmit={handleSubmitAllReimbursements} className="space-y-6">
              {/* Hidden Inputs for adding more receipts in review */}
              <input
                type="file"
                ref={appendFileInputRef}
                onChange={(e) => { handleAppendFileInReview(e.target.files); e.target.value = ''; }}
                className="hidden"
                multiple
                accept="image/*,.pdf,application/pdf"
              />
              <input
                type="file"
                ref={appendCameraInputRef}
                onChange={(e) => { handleAppendFileInReview(e.target.files); e.target.value = ''; }}
                className="hidden"
                accept="image/*"
                capture="environment"
              />

              {/* Multi-Struk Tabs Bar (Jika berkas > 1) */}
              {strukList.length > 1 && (
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {strukList.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveReviewIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shrink-0 cursor-pointer ${
                          activeReviewIndex === idx
                            ? 'bg-[#008F5D] text-white border-[#008F5D] shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>#{idx + 1}</span>
                        <span className="truncate max-w-[120px]">{item.merchant || `Struk ${idx + 1}`}</span>
                        <span className="text-[10px] opacity-80 font-mono">
                          (Rp {item.nominal || '0'})
                        </span>
                        {strukList.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStrukFromReview(item.id);
                            }}
                            className={`p-0.5 rounded hover:bg-black/20 ${activeReviewIndex === idx ? 'text-white' : 'text-stone-400 hover:text-red-500'}`}
                            title="Hapus struk ini"
                          >
                            <Trash2 size={12} />
                          </span>
                        )}
                      </button>
                    ))}

                    {strukList.length < MAX_SCAN_LIMIT && (
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
                      onClick={applyFirstPosToAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      title="Salin Keterangan Pos Anggaran dari Struk #1 ke semua struk"
                    >
                      <Copy size={13} /> Terapkan Pos Struk #1 ke Semua
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Grand Total ({strukList.length} Struk)
                      </span>
                      <span className="text-sm font-extrabold text-stone-900 font-mono">
                        Rp {grandTotalNominal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* MAIN 2-COLUMN REVIEW GRID */}
              {(() => {
                const item = strukList[activeReviewIndex] || strukList[0];
                if (!item) return null;

                const selectedMainNama = mainAnggaranList.find((m: any) => String(m.id) === item.mainAnggaranId)?.namaMain || '';
                const subList = mainAnggaranList.find((m: any) => String(m.id) === item.mainAnggaranId)?.subAnggaran || [];
                const selectedSubNama = subList.find((s: any) => String(s.id) === item.subAnggaranId)?.namaSub || '';
                const ketList = subList.find((s: any) => String(s.id) === item.subAnggaranId)?.keterangan || [];
                const selectedKeteranganNama = ketList.find((k: any) => String(k.id) === item.posAnggaranId)?.keterangan || '';

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* KOLOM KIRI: Form Review & Lengkapi Data */}
                    <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                      {/* Header Form */}
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

                      {/* Keterangan Pos Anggaran */}
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-1">
                          <label className="text-stone-700 font-semibold text-xs">
                            Keterangan <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <KeteranganSearchDropdown
                          options={flatKeteranganOptions}
                          selectedLabel={selectedKeteranganNama}
                          onSelect={(opt) => {
                            updateStrukField(item.id, {
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

                        {/* Hierarchy Breadcrumb: MAIN > SUB > KET */}
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

                      {/* 2-Column Grid Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nama Reimbursement */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-stone-700 font-semibold text-xs">
                            Nama Reimbursement <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.merchant}
                            onChange={(e) => updateStrukField(item.id, { merchant: e.target.value })}
                            placeholder="Gramedia Merdeka / Nama Merchant..."
                            className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                              item.errors?.merchant
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-stone-200 focus:border-[#008F5D]'
                            }`}
                          />
                          {item.errors?.merchant && (
                            <p className="text-red-500 font-medium text-[11px]">{item.errors.merchant}</p>
                          )}
                        </div>

                        {/* Tanggal Transaksi */}
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
                            onChange={(val) => updateStrukField(item.id, { tanggal: val })}
                            error={!!item.errors?.tanggal}
                          />
                          {item.errors?.tanggal && (
                            <p className="text-red-500 font-medium text-[11px]">{item.errors.tanggal}</p>
                          )}
                        </div>

                        {/* Nominal (IDR) */}
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
                              onChange={(e) =>
                                updateStrukField(item.id, { nominal: formatRupiah(e.target.value) })
                              }
                              placeholder="0"
                              className={`w-full bg-white border rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                                item.errors?.nominal
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-stone-200 focus:border-[#008F5D]'
                              }`}
                            />
                          </div>
                          {item.errors?.nominal && (
                            <p className="text-red-500 font-medium text-[11px]">{item.errors.nominal}</p>
                          )}
                        </div>

                        {/* Kategori Bukti */}
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
                              onChange={(e) => updateStrukField(item.id, { kategoriBukti: e.target.value })}
                              className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium text-stone-900 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                                item.errors?.kategoriBukti
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

                      {/* Catatan / Keterangan Tambahan */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-stone-700 font-semibold text-xs">Catatan</label>
                        <textarea
                          rows={3}
                          value={item.keterangan}
                          onChange={(e) => updateStrukField(item.id, { keterangan: e.target.value })}
                          placeholder="Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site..."
                          className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs sm:text-sm font-normal text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008F5D] transition-all resize-none"
                        />
                      </div>

                      {/* Action Buttons at Bottom */}
                      <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          <ChevronLeft size={16} /> Upload ulang
                        </button>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          {strukList.length > 1 && (
                            <div className="flex items-center gap-1.5">
                              {activeReviewIndex > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveReviewIndex((p) => Math.max(0, p - 1))}
                                  className="px-3 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                  ← Sebelumnya
                                </button>
                              )}
                              {activeReviewIndex < strukList.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => setActiveReviewIndex((p) => Math.min(strukList.length - 1, p + 1))}
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

                    {/* KOLOM KANAN: Bukti Struk Preview Card */}
                    <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 lg:sticky lg:top-6">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900 tracking-tight">Bukti Struk</h3>
                          <p className="text-xs text-stone-400 font-normal">
                            Hasil scan{strukList.length > 1 ? ` (Struk #${activeReviewIndex + 1} dari ${strukList.length})` : ''}.
                          </p>
                        </div>
                        {strukList.length > 1 && (
                          <span className="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs font-bold rounded-lg">
                            #{activeReviewIndex + 1} / {strukList.length}
                          </span>
                        )}
                      </div>

                      {/* Gambar Preview */}
                      <div
                        onClick={() => {
                          setActivePreviewStruk({
                            url: item.previewUrl,
                            isPdf: item.isPdf,
                            name: item.fileName,
                          });
                          setIsPreviewModalOpen(true);
                        }}
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
                            alt={`Bukti Struk #${activeReviewIndex + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}

                        {/* Hover Overlay indicator */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition">
                          <span className="bg-stone-900/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition font-medium inline-flex items-center gap-1.5 shadow-md">
                            <Eye size={14} /> Klik untuk perbesar
                          </span>
                        </div>
                      </div>

                      {/* Meta info berkas */}
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
                            <span className="font-bold text-emerald-800 font-mono">Rp {grandTotalNominal.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </form>
          )}

          {/* ============================================================== */}
          {/* STATE 4: KONFIRMASI TERKIRIM                                   */}
          {/* ============================================================== */}
          {currentState === 'success' && (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-[#008F5D] text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/20">
                <Check size={36} className="stroke-3" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-xl font-extrabold text-stone-900">
                  {submittedTotalCount} Pengajuan Berhasil Dikirim!
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                  Seluruh {submittedTotalCount} pengajuan reimbursement dengan total nominal{' '}
                  <span className="font-extrabold text-stone-900 font-mono">Rp {submittedTotalNominal}</span> telah
                  diteruskan ke Project Manager untuk proses persetujuan (approval).
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/karyawan/riwayat-pengajuan">
                  <button className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer">
                    Lihat Riwayat Pengajuan
                  </button>
                </Link>
                <button
                  onClick={handleResetForm}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#008F5D] hover:bg-[#007A4F] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                >
                  <PlusCircle size={14} /> Ajukan Struk Lain
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODAL ZOOM & PAN PREVIEW STRUK                                 */}
      {/* ============================================================== */}
      {isPreviewModalOpen && activePreviewStruk && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setIsPreviewModalOpen(false);
            resetZoomAndPan();
          }}
        >
          {/* Tombol Tutup */}
          <button
            type="button"
            onClick={() => {
              setIsPreviewModalOpen(false);
              resetZoomAndPan();
            }}
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer shadow-xl"
            title="Tutup"
          >
            <X size={20} />
          </button>

          {/* Kontainer Gambar/PDF Zoom */}
          <div
            className={`relative max-w-[92vw] max-h-[92vh] overflow-hidden p-2 flex items-center justify-center select-none ${previewZoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
              }`}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (e.deltaY < 0) {
                setPreviewZoomScale((prev) => Math.min(prev + 0.25, 4));
              } else {
                setPreviewZoomScale((prev) => {
                  const next = Math.max(prev - 0.25, 1);
                  if (next === 1) setPanPos({ x: 0, y: 0 });
                  return next;
                });
              }
            }}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPanPos({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {activePreviewStruk.isPdf ? (
              <iframe
                src={activePreviewStruk.url}
                className="w-[85vw] max-w-4xl h-[80vh] rounded-2xl bg-white shadow-2xl border border-stone-200"
                title="Preview PDF"
              />
            ) : (
              <img
                src={activePreviewStruk.url}
                alt="Bukti Struk Full Preview"
                draggable={false}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${previewZoomScale})`,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/bukti_struk.png';
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        open={!!toastError}
        variant="error"
        message={toastError || ''}
        onClose={() => setToastError(null)}
      />
      <Toast
        open={!!toastSuccess}
        variant="success"
        message={toastSuccess || ''}
        onClose={() => setToastSuccess(null)}
      />
    </div>
  );
}

export default function AjukanReimbursement() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-stone-400 text-xs font-medium">
          Memuat halaman...
        </div>
      }
    >
      <AjukanReimbursementContent />
    </Suspense>
  );
}