import { NextResponse, NextRequest } from 'next/server';
import sharp from 'sharp';

const isDev = process.env.NODE_ENV !== 'production';
const debugLog = (...args: any[]) => {
  if (isDev) console.log(...args);
};
const debugWarn = (...args: any[]) => {
  if (isDev) console.warn(...args);
};

interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

interface SingleDocResult {
  index: number;
  fileName: string;
  merchant: string;
  tanggal: string;
  nominal: number;
  kategoriBukti: string;
  keterangan: string;
  modelUsed: string;
  usage?: TokenUsage;
  origSizeKB?: number;
  finalSizeKB?: number;
  reductionPct?: number;
  isCompressed?: boolean;
}

function parseAiJson(text: string): any {
  if (!text) return null;
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(clean);
  } catch { }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1).trim());
    } catch { }
  }

  const firstArray = clean.indexOf('[');
  const lastArray = clean.lastIndexOf(']');
  if (firstArray !== -1 && lastArray > firstArray) {
    try {
      const arr = JSON.parse(clean.substring(firstArray, lastArray + 1).trim());
      if (Array.isArray(arr) && arr[0]) return arr[0];
    } catch { }
  }

  return null;
}

async function scanSingleDocument(
  file: File,
  index: number,
  geminiKey: string,
  clientOrigSizeKB?: number
): Promise<SingleDocResult> {
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
  ];

  const origSizeKB = clientOrigSizeKB !== undefined ? clientOrigSizeKB : file.size / 1024;
  const fileName = file.name;
  let mimeType = file.type || 'image/jpeg';
  let isCompressed = false;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e: any) {
    console.error(`[OCR #${index}] Gagal membaca buffer file:`, e?.message);
    throw new Error(`Gagal membaca file: ${fileName}`);
  }

  if (buffer.length > 1.5 * 1024 * 1024 && mimeType.startsWith('image/')) {
    try {
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      if (compressedBuffer.length < buffer.length) {
        buffer = compressedBuffer;
        mimeType = 'image/jpeg';
        isCompressed = true;
      }
    } catch (e: any) {
      debugWarn(`[OCR #${index}] Backend image compression skipped:`, e?.message);
    }
  }

  const finalSizeKB = buffer.length / 1024;
  const reductionPct = origSizeKB > 0 ? Math.max(0, ((origSizeKB - finalSizeKB) / origSizeKB) * 100) : 0;
  const base64Image = buffer.toString('base64');
  const today = new Date().toISOString().split('T')[0];

  const promptInstruksi = `Bertindaklah sebagai OCR Dokumen Keuangan profesional berakurasi sangat tinggi.
Tugas Anda adalah membaca 1 dokumen transaksi keuangan terlampir dan mengekstrak informasi kunci:
1. 'merchant': Nama toko/vendor.
2. 'tanggal': Tanggal transaksi (YYYY-MM-DD).
3. 'nominal': Total nominal pembayaran (integer).
4. 'kategoriBukti': "Struk Pembelian", "Invoice / Faktur", "Kuitansi Resmi", atau "Nota Kontan".
5. 'keterangan': Ringkasan transaksi.
Kembalikan HANYA berupa satu objek JSON valid.`;

  let lastError = '';

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: promptInstruksi },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Status ${response.status}: ${errText}`;
        debugWarn(`[OCR #${index}] Model ${modelName} returned HTTP ${response.status}: ${errText.slice(0, 120)}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usageMetadata = data?.usageMetadata;
      const usage: TokenUsage = {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      };

      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed) {
        const nominal = parseInt(String(parsed.nominal || 0).replace(/\D/g, ''), 10) || 0;
        let merchant = (parsed.merchant || '').trim();
        if (!merchant) merchant = `Struk #${index}`;

        let tanggal = (parsed.tanggal || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
          tanggal = today;
        }

        const validKategori = ['Struk Pembelian', 'Invoice / Faktur', 'Kuitansi Resmi', 'Nota Kontan'];
        let kategoriBukti = (parsed.kategoriBukti || '').trim();
        if (!validKategori.includes(kategoriBukti)) {
          kategoriBukti = 'Struk Pembelian';
        }

        const keterangan = (parsed.keterangan || '').trim();

        return {
          index,
          fileName,
          merchant,
          tanggal,
          nominal,
          kategoriBukti,
          keterangan,
          modelUsed: modelName,
          usage,
          origSizeKB,
          finalSizeKB,
          reductionPct,
          isCompressed,
        };
      }
    } catch (e: any) {
      lastError = e?.message || 'Timeout / Network error';
      debugWarn(`[OCR #${index}] Error saat memanggil ${modelName}:`, e?.message);
    }
  }

  console.error(`[OCR #${index}] Gagal memindai berkas ${fileName}: ${lastError}`);
  return {
    index,
    fileName,
    merchant: `Struk #${index}`,
    tanggal: today,
    nominal: 0,
    kategoriBukti: 'Struk Pembelian',
    keterangan: '',
    modelUsed: 'Fallback (Manual)',
    usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
    origSizeKB,
    finalSizeKB,
    reductionPct,
    isCompressed,
  };
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { success: false, message: 'API Key GEMINI_API_KEY belum dikonfigurasi' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files: File[] = [];

    const rawFiles = formData.getAll('files') as File[];
    if (rawFiles && rawFiles.length > 0) {
      for (const f of rawFiles) {
        if (f && typeof f === 'object' && 'arrayBuffer' in f && f.size > 0) {
          files.push(f);
        }
      }
    }

    const singleFile = formData.get('file') as File | null;
    if (singleFile && typeof singleFile === 'object' && 'arrayBuffer' in singleFile && singleFile.size > 0) {
      if (!files.some(f => f.name === singleFile.name && f.size === singleFile.size)) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file dokumen yang diunggah' },
        { status: 400 }
      );
    }

    const MAX_DOCS_LIMIT = 5;
    if (files.length > MAX_DOCS_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: `Batas maksimal ${MAX_DOCS_LIMIT} dokumen.`
        },
        { status: 400 }
      );
    }

    const count = files.length;
    const filesMetaStr = formData.get('filesMeta') as string;
    let filesMeta: Array<{ fileName: string; originalSize: number; compressedSize: number }> = [];
    if (filesMetaStr) {
      try {
        filesMeta = JSON.parse(filesMetaStr);
      } catch {}
    }

    debugLog(`\n================== [START PARALLEL OCR SCAN] ==================`);
    debugLog(`🚀 Memproses ${count} dokumen secara PARALEL MANDIRI (Maks 5 berkas)...`);

    const startTime = Date.now();
    const results = await Promise.all(
      files.map((file, idx) => {
        const meta = filesMeta.find((m) => m.fileName === file.name) || filesMeta[idx];
        const clientOrigSizeKB = meta?.originalSize ? meta.originalSize / 1024 : undefined;
        return scanSingleDocument(file, idx + 1, geminiKey, clientOrigSizeKB);
      })
    );
    const durationMs = Date.now() - startTime;

    const totalUsage: TokenUsage = {
      promptTokens: results.reduce((acc, r) => acc + (r.usage?.promptTokens || 0), 0),
      candidatesTokens: results.reduce((acc, r) => acc + (r.usage?.candidatesTokens || 0), 0),
      totalTokens: results.reduce((acc, r) => acc + (r.usage?.totalTokens || 0), 0),
    };

    const modelsUsedSet = Array.from(new Set(results.map(r => r.modelUsed))).join(', ');

    debugLog(`⏱️ Waktu Selesai Paralel   : ${(durationMs / 1000).toFixed(2)} detik`);
    debugLog(`🤖 Model yang Digunakan    : ${modelsUsedSet}`);
    debugLog(`📥 Total Input Tokens      : ${totalUsage.promptTokens.toLocaleString()} tokens`);
    debugLog(`📤 Total Output Tokens     : ${totalUsage.candidatesTokens.toLocaleString()} tokens`);
    debugLog(`📊 Total Konsumsi Tokens   : ${totalUsage.totalTokens.toLocaleString()} tokens`);
    debugLog(`📋 Rincian Hasil Ekstraksi & Ukuran Tiap Struk (100% Mandiri):`);
    results.forEach((it) => {
      const origText = it.origSizeKB !== undefined
        ? (it.origSizeKB >= 1024 ? `${(it.origSizeKB / 1024).toFixed(2)} MB` : `${it.origSizeKB.toFixed(1)} KB`)
        : '-';
      const finalText = it.finalSizeKB !== undefined
        ? (it.finalSizeKB >= 1024 ? `${(it.finalSizeKB / 1024).toFixed(2)} MB` : `${it.finalSizeKB.toFixed(1)} KB`)
        : '-';
      const statusText = it.isCompressed
        ? `⚡ Terkompresi (Hemat ${it.reductionPct?.toFixed(1)}%)`
        : `✅ Optimal/Bypass (<= 1.5MB)`;

      debugLog(`  🔹 [Struk #${it.index}] File: "${it.fileName}" | Ukuran: ${origText} ➔ ${finalText} (${statusText})`);
      debugLog(`     ↳ Vendor: "${it.merchant}" | Tanggal: ${it.tanggal} | Nominal: Rp ${it.nominal.toLocaleString('id-ID')} | Kategori: ${it.kategoriBukti}`);
    });
    debugLog(`================== [END PARALLEL OCR SCAN] ====================\n`);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak ${results.length} dokumen secara paralel mandiri (${modelsUsedSet})`,
      data: results[0],
      items: results,
      count: results.length,
      usage: totalUsage,
    });

  } catch (error: any) {
    console.error('Parallel OCR Endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan server: ${error?.message || 'Error tidak diketahui'}`,
    }, { status: 500 });
  }
}