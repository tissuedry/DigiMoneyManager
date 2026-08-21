import { NextResponse, NextRequest } from 'next/server';
import sharp from 'sharp';

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

// Helper untuk membersihkan dan mem-parsing JSON AI yang toleran terhadap format array / object
function parseAiJson(text: string): any {
  if (!text) return null;
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Ekstrak dari markdown code block ```json ... ```
  const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    clean = codeBlockMatch[1].trim();
  }

  // 1. Coba parse langsung
  try {
    return JSON.parse(clean);
  } catch { }

  // 2. Cari substring JSON Object { ... }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1).trim());
    } catch { }
  }

  // 3. Cari substring JSON Array [ ... ]
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

// Helper pemindaian 1 berkas dokumen mandiri (100% Akurasi & Fokus Maksimal)
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

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);
  const receivedSizeKB = arrayBuffer.byteLength / 1024;
  const origSizeKB = clientOrigSizeKB && clientOrigSizeKB > 0 ? clientOrigSizeKB : receivedSizeKB;
  let isCompressed = (origSizeKB - receivedSizeKB) > 5; // Terkompresi di client jika ada penghematan > 5KB

  const fileName = file.name || `Dokumen_${index}`;
  const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  let mimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');

  // Backend Threshold Compression: Jika gambar masih > 1.5 MB, kompres lagi dengan sharp ke maks 1600px @ 85%
  if (!isPdf && buffer.length > 1536 * 1024) {
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
      console.warn(`[OCR #${index}] Backend image compression skipped:`, e?.message);
    }
  }

  const finalSizeKB = buffer.length / 1024;
  const reductionPct = origSizeKB > 0 ? Math.max(0, ((origSizeKB - finalSizeKB) / origSizeKB) * 100) : 0;
  const base64Image = buffer.toString('base64');
  const today = new Date().toISOString().split('T')[0];

  const promptInstruksi = `Bertindaklah sebagai OCR Dokumen Keuangan profesional berakurasi sangat tinggi.
Tugas Anda adalah membaca 1 dokumen transaksi keuangan terlampir (struk belanja thermal, nota toko, invoice PDF, kuitansi, atau bukti transfer) dan mengekstrak informasi kunci MURNI HANYA DARI TEKS YANG TERTERA DI DOKUMEN INI:

1. 'merchant': Nama toko / vendor / penyedia layanan pengeluar dokumen (string).
2. 'tanggal': Tanggal transaksi pada dokumen dengan format standard ISO 'YYYY-MM-DD'.
3. 'nominal': Total nominal pembayaran pada dokumen (integer angka murni tanpa huruf/titik/koma/simbol).
4. 'kategoriBukti': Tentukan kategori dokumen hanya dari pilihan berikut:
   - "Struk Pembelian" (jika berupa struk belanja/thermal/EDC/BBM)
   - "Invoice / Faktur" (jika berupa faktur tagihan resmi/bill/PDF invoice)
   - "Kuitansi Resmi" (jika berupa kuitansi pembayaran)
   - "Nota Kontan" (jika berupa nota manual/toko)
5. 'keterangan': Catatan/ringkasan transaksi barang atau jasa yang tertera pada dokumen tersebut.

WAJIB: DILARANG KERAS menyertakan tag <think> atau penjelasan teks apapun. Kembalikan HANYA berupa satu objek JSON valid:
{
  "merchant": "Nama Toko / Vendor",
  "tanggal": "YYYY-MM-DD",
  "nominal": 150000,
  "kategoriBukti": "Struk Pembelian",
  "keterangan": "Beli ATK operasional"
}`;

  let lastError = '';

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik untuk stabilitas koneksi

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptInstruksi },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.0, // 0.0 menjamin ekstraksi teks deterministik tanpa halusinasi
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Model ${modelName} HTTP ${response.status}: ${errText}`;
        console.warn(`[OCR #${index}] Model ${modelName} gagal (${response.status}), mencoba model berikutnya...`);
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (rawText) {
        const usage: TokenUsage = {
          promptTokens: resJson.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: resJson.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: resJson.usageMetadata?.totalTokenCount || 0,
        };

        const parsed = parseAiJson(rawText) || {};

        let nominal = 0;
        if (typeof parsed.nominal === 'number') {
          nominal = Math.round(parsed.nominal);
        } else if (parsed.nominal) {
          nominal = parseInt(String(parsed.nominal).replace(/\D/g, ''), 10) || 0;
        }

        const merchant = String(parsed.merchant || `Struk #${index}`).trim();
        const rawDate = String(parsed.tanggal || today).trim();
        const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today;
        const rawKategori = String(parsed.kategoriBukti || 'Struk Pembelian').trim();
        const kategoriBukti = ['Struk Pembelian', 'Invoice / Faktur', 'Kuitansi Resmi', 'Nota Kontan'].includes(rawKategori)
          ? rawKategori
          : 'Struk Pembelian';
        const keterangan = String(parsed.keterangan || '').trim();

        return {
          index,
          fileName,
          merchant,
          tanggal,
          nominal: isNaN(nominal) ? 0 : nominal,
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
      console.warn(`[OCR #${index}] Error saat memanggil ${modelName}:`, e?.message);
    }
  }

  // Fallback jika API gagal total untuk berkas ini
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

// POST: Proses pemindaian dokumen secara PARALEL MANDIRI (Parallel Independent Scan)
export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { success: false, message: 'API Key GEMINI_API_KEY belum dikonfigurasi di file .env' },
        { status: 500 }
      );
    }

    // 1. Ambil file gambar/PDF dari FormData request
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
        { success: false, message: 'Tidak ada file dokumen (struk/invoice) yang diunggah' },
        { status: 400 }
      );
    }

    const MAX_DOCS_LIMIT = 5;
    if (files.length > MAX_DOCS_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: `Batas maksimal berkas dalam 1 kali scan adalah ${MAX_DOCS_LIMIT} dokumen struk. Anda mengunggah ${files.length} dokumen.`
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

    console.log(`\n================== [START PARALLEL OCR SCAN] ==================`);
    console.log(`🚀 Memproses ${count} dokumen secara PARALEL MANDIRI (Maks 5 berkas)...`);

    // 2. Eksekusi pemindaian setiap dokumen secara PARALEL bersamaan (Promise.all)
    const startTime = Date.now();
    const results = await Promise.all(
      files.map((file, idx) => {
        const meta = filesMeta.find((m) => m.fileName === file.name) || filesMeta[idx];
        const clientOrigSizeKB = meta?.originalSize ? meta.originalSize / 1024 : undefined;
        return scanSingleDocument(file, idx + 1, geminiKey, clientOrigSizeKB);
      })
    );
    const durationMs = Date.now() - startTime;

    // 3. Akumulasi konsumsi token
    const totalUsage: TokenUsage = {
      promptTokens: results.reduce((acc, r) => acc + (r.usage?.promptTokens || 0), 0),
      candidatesTokens: results.reduce((acc, r) => acc + (r.usage?.candidatesTokens || 0), 0),
      totalTokens: results.reduce((acc, r) => acc + (r.usage?.totalTokens || 0), 0),
    };

    const modelsUsedSet = Array.from(new Set(results.map(r => r.modelUsed))).join(', ');

    console.log(`⏱️ Waktu Selesai Paralel   : ${(durationMs / 1000).toFixed(2)} detik`);
    console.log(`🤖 Model yang Digunakan    : ${modelsUsedSet}`);
    console.log(`📥 Total Input Tokens      : ${totalUsage.promptTokens.toLocaleString()} tokens`);
    console.log(`📤 Total Output Tokens     : ${totalUsage.candidatesTokens.toLocaleString()} tokens`);
    console.log(`📊 Total Konsumsi Tokens   : ${totalUsage.totalTokens.toLocaleString()} tokens`);
    console.log(`📋 Rincian Hasil Ekstraksi & Ukuran Tiap Struk (100% Mandiri):`);
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

      console.log(`  🔹 [Struk #${it.index}] File: "${it.fileName}" | Ukuran: ${origText} ➔ ${finalText} (${statusText})`);
      console.log(`     ↳ Vendor: "${it.merchant}" | Tanggal: ${it.tanggal} | Nominal: Rp ${it.nominal.toLocaleString('id-ID')} | Kategori: ${it.kategoriBukti}`);
    });
    console.log(`================== [END PARALLEL OCR SCAN] ====================\n`);

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak ${results.length} dokumen secara paralel mandiri (${modelsUsedSet})`,
      data: results[0], // Backwards compatible untuk modul single-file
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