'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import Toast from '@/components/toast';
import ImageLightbox from '@/components/image-lightbox';
import StepperHeader from './Stepper';
import UploadScreen from './UploadScreen';
import OcrProgressScreen from './OcrProgressScreen';
import ReviewForm, { type StrukItem, type MainAnggaran } from './ReviewForm';
import SuccessScreen from './SuccessScreen';
import type { FlatKeteranganOption } from './KeteranganSearchDropdown';
import { ReimbursePageSkeleton } from '../SkeletonLoader';
import { useApi } from '@/lib/use-api';
import { compressReceiptFile, compressMultipleWithMeta } from '@/lib/image-compression';
import { formatRupiah, parseRupiahToNumber, formatBytes } from '@/lib/formatters';
import { Sparkles } from 'lucide-react';

type MeResponse = { user?: { proyekId?: number | string } };
type Project = { id: number | string };
type ProyekResponse = { projects?: Project[] };

type RawReimbursement = {
  id: number;
  status: string;
  proyekId?: number | string;
  strukUrl?: string | null;
  merchant?: string | null;
  nama?: string | null;
  tanggalStruk?: string | null;
  nominal?: number | string | null;
  kategoriBukti?: string | null;
  keterangan?: string | null;
  keteranganAnggaranId?: number | string | null;
  keteranganAnggaran?: {
    subAnggaranId?: number | string | null;
    subAnggaran?: { mainAnggaranId?: number | string | null } | null;
  } | null;
};

type OcrResult = {
  items: Array<{
    merchant?: string;
    tanggal?: string;
    nominal?: string | number;
    kategoriBukti?: string;
    keterangan?: string;
  }>;
  success: boolean;
  message?: string;
};

async function scanStruks(files: File[]): Promise<OcrResult> {
  const compressResults = await compressMultipleWithMeta(files);

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
  return {
    items: resJson.items || (resJson.data ? [resJson.data] : []),
    success: !!resJson.success,
    message: resJson.message,
  };
}

function AjukanReimbursementContent() {
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get('resubmitId');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentState, setCurrentState] = useState<'upload' | 'ocr' | 'review' | 'success'>(
    resubmitId ? 'review' : 'upload'
  );
  const [isResubmitLoading, setIsResubmitLoading] = useState(!!resubmitId);

  const [activePreviewStruk, setActivePreviewStruk] = useState<{ url: string; isPdf: boolean } | null>(null);

  const { data: meData } = useApi<MeResponse>("/api/auth/me");
  const { data: proyekData } = useApi<ProyekResponse>("/api/proyek?role=Karyawan");
  const { data: reimbData } = useApi<{ reimbursements?: RawReimbursement[] }>(
    resubmitId ? "/api/reimbursements?role=Karyawan" : null
  );
  const projects = useMemo(() => proyekData?.projects ?? [], [proyekData]);

  const [proyekId, setProyekId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);

  const { data: posAnggaranData } = useApi<{ posAnggaran?: MainAnggaran[] }>(proyekId ? `/api/proyek/${proyekId}/pos-anggaran` : null);
  const mainAnggaranList = posAnggaranData?.posAnggaran ?? [];

  const flatKeteranganOptions: FlatKeteranganOption[] = mainAnggaranList.flatMap((m: any) =>
    (m.subAnggaran ?? []).flatMap((s: any) =>
      (s.keterangan ?? []).map((k: any) => ({
        id: String(k.id),
        keterangan: k.keterangan,
        mainId: String(m.id),
        mainNama: m.kode ? `(${m.kode}) ${m.namaMain}` : m.namaMain,
        subId: String(s.id),
        subNama: s.kode ? `(${s.kode}) ${s.namaSub}` : s.namaSub,
      }))
    )
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Map<File, string>>(new Map());
  const previewUrls = new Set(previews.values());

  const [strukList, setStrukList] = useState<StrukItem[]>([]);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);

  const [submittedTotalNominal, setSubmittedTotalNominal] = useState<string>('0');
  const [submittedTotalCount, setSubmittedTotalCount] = useState<number>(0);

  useEffect(() => {
    if (projects.length === 0 || proyekId || resubmitId) return;
    const sessionProyekId = meData?.user?.proyekId;
    const selectedProj = projects.find((p) => p.id === sessionProyekId) ?? projects[0];
    if (!selectedProj) return;

    setProyekId(String(selectedProj.id));
  }, [projects, meData, resubmitId, proyekId]);

  useEffect(() => {
    if (!resubmitId || !reimbData?.reimbursements) return;

    const original = reimbData.reimbursements.find((r) => String(r.id) === resubmitId);
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

  const addFilesToSelection = (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const accepted: File[] = [];
    let limitReached = false;

    for (const f of Array.from(newFiles)) {
      if (selectedFiles.length + accepted.length >= MAX_SCAN_LIMIT) {
        limitReached = true;
        break;
      }
      if (!selectedFiles.some((item) => item.name === f.name && item.size === f.size)) {
        accepted.push(f);
      }
    }

    if (accepted.length > 0) {
      const next = new Map(previews);
      for (const f of accepted) next.set(f, URL.createObjectURL(f));
      setPreviews(next);
      setSelectedFiles((prev) => [...prev, ...accepted]);
    }

    if (limitReached) {
      setToastError(`Batas maksimal sekali scan adalah ${MAX_SCAN_LIMIT} berkas struk.`);
    }
  };

  const removeFileFromSelection = (index: number) => {
    const removed = selectedFiles[index];
    if (removed) {
      const url = previews.get(removed);
      if (url) {
        URL.revokeObjectURL(url);
        const next = new Map(previews);
        next.delete(removed);
        setPreviews(next);
      }
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(new Map());
    setSelectedFiles([]);
  };

  const makeStrukItem = (file: File, idx: number, aiData: OcrResult['items'][number], idPrefix: string): StrukItem => {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `${idPrefix}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: previews.get(file) || URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
      fileName: file.name,
      fileSizeText: formatBytes(file.size),
      mainAnggaranId: '',
      subAnggaranId: '',
      posAnggaranId: '',
      merchant: aiData.merchant || (idPrefix === 'struk' ? `Struk #${idx + 1}` : ''),
      tanggal: aiData.tanggal || today,
      nominal: aiData.nominal ? formatRupiah(String(aiData.nominal)) : '',
      kategoriBukti: aiData.kategoriBukti || 'Struk Pembelian',
      keterangan: aiData.keterangan || '',
      errors: {},
    };
  };

  const handleStartScan = async () => {
    if (selectedFiles.length === 0) {
      setToastError('Silakan pilih minimal 1 foto/dokumen struk terlebih dahulu.');
      return;
    }

    setCurrentState('ocr');

    try {
      const result = await scanStruks(selectedFiles);
      const newStrukList = selectedFiles.map((file, idx) =>
        makeStrukItem(file, idx, result.items[idx] || {}, 'struk')
      );

      setStrukList(newStrukList);
      setCurrentState('review');

      if (!result.success) {
        setToastError(result.message || 'Sebagian data struk mungkin perlu dilengkapi secara manual.');
      } else {
        setToastSuccess(`Berhasil memindai ${newStrukList.length} struk dengan AI Vision.`);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setToastError('Gagal memproses AI OCR: ' + (err?.message || 'Error jaringan'));
      setStrukList(selectedFiles.map((file, idx) => makeStrukItem(file, idx, {}, 'struk-manual')));
      setCurrentState('review');
    }
  };

  const updateStrukField = (id: string, updates: Partial<StrukItem>) => {
    setStrukList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedErrors = { ...(item.errors || {}) };

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

  const removeStrukFromReview = (id: string) => {
    const removed = strukList.find((i) => i.id === id);
    if (removed && removed.previewUrl.startsWith('blob:') && !previewUrls.has(removed.previewUrl)) {
      URL.revokeObjectURL(removed.previewUrl);
    }

    const next = strukList.filter((item) => item.id !== id);
    setStrukList(next);
    if (next.length === 0) {
      setCurrentState('upload');
      clearSelection();
      setActiveReviewIndex(0);
    } else {
      setActiveReviewIndex((prevIdx) => Math.min(prevIdx, next.length - 1));
    }
  };

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

    setStrukList((prev) => [...prev, ...additionalItems]);
    setToastSuccess(`Sedang memindai ${additionalItems.length} struk tambahan dengan AI...`);

    try {
      const result = await scanStruks(acceptedFiles);

      setStrukList((prev) =>
        prev.map((item) => {
          const matchIdx = additionalItems.findIndex((ai) => ai.id === item.id);
          if (matchIdx !== -1) {
            const aiData = result.items[matchIdx] || {};
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

      if (result.success) {
        setToastSuccess(`Struk tambahan berhasil dipindai oleh AI!`);
      } else {
        setToastError(result.message || 'Sebagian data struk tambahan mungkin perlu diisi manual.');
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

  const grandTotalNominal = strukList.reduce((acc, item) => {
    return acc + parseRupiahToNumber(item.nominal);
  }, 0);

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

    let hasError = false;
    const validatedList = strukList.map((item) => {
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
      await Promise.all(
        validatedList.map(async (item) => {
          const cleanNominalStr = String(parseRupiahToNumber(item.nominal));
          const formData = new FormData();
          formData.append('proyekId', proyekId);
          formData.append('keteranganAnggaranId', item.posAnggaranId);
          formData.append('nominal', cleanNominalStr);

          if (item.file) {
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
      setSubmittedTotalCount(validatedList.length);
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
    strukList.forEach((item) => {
      if (item.previewUrl.startsWith('blob:') && !previewUrls.has(item.previewUrl)) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    clearSelection();
    setStrukList([]);
    setActiveReviewIndex(0);
  };

  if (isResubmitLoading) {
    return <ReimbursePageSkeleton />;
  }

  return (
    <div className="h-screen bg-[#f9f8f4] flex text-stone-800 font-sans selection:bg-emerald-100 overflow-hidden">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole="Karyawan"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 px-6 lg:px-8 py-6 space-y-6 w-full mx-auto overflow-y-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold tracking-tight text-stone-900">Ajukan Reimbursement</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                <Sparkles size={11} className="text-emerald-600" /> Multi-Struk AI
              </span>
            </div>
            <p className="text-sm text-stone-400 mt-1.5">
              Unggah atau foto beberapa struk sekaligus. AI akan mengekstrak nominal, tanggal, dan vendor tiap struk secara otomatis.
            </p>
          </div>

          <StepperHeader currentState={currentState} />

          {currentState === 'upload' && (
            <UploadScreen
              selectedFiles={selectedFiles}
              previews={previews}
              maxLimit={MAX_SCAN_LIMIT}
              onAddFiles={addFilesToSelection}
              onRemoveFile={removeFileFromSelection}
              onClearAll={clearSelection}
              onStartScan={handleStartScan}
            />
          )}

          {currentState === 'ocr' && (
            <OcrProgressScreen files={selectedFiles} previews={previews} />
          )}

          {currentState === 'review' && (
            <ReviewForm
              strukList={strukList}
              activeIndex={activeReviewIndex}
              onSelectIndex={setActiveReviewIndex}
              grandTotal={grandTotalNominal}
              maxLimit={MAX_SCAN_LIMIT}
              options={flatKeteranganOptions}
              mainAnggaranList={mainAnggaranList}
              onUpdateField={updateStrukField}
              onRemoveStruk={removeStrukFromReview}
              onApplyFirstToAll={applyFirstPosToAll}
              onAppendFiles={handleAppendFileInReview}
              isLoading={isLoading}
              onSubmit={handleSubmitAllReimbursements}
              onReset={handleResetForm}
              onPreviewStruk={(item) => setActivePreviewStruk({ url: item.previewUrl, isPdf: item.isPdf })}
            />
          )}

          {currentState === 'success' && (
            <SuccessScreen
              count={submittedTotalCount}
              totalNominal={submittedTotalNominal}
              onReset={handleResetForm}
            />
          )}
        </main>
      </div>

      <ImageLightbox
        url={activePreviewStruk?.url ?? null}
        isPdf={activePreviewStruk?.isPdf ?? false}
        onClose={() => setActivePreviewStruk(null)}
      />

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
    <Suspense fallback={<ReimbursePageSkeleton />}>
      <AjukanReimbursementContent />
    </Suspense>
  );
}
