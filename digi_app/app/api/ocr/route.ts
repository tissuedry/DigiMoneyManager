import { NextResponse, NextRequest } from 'next/server';
import Groq from 'groq-sdk';

// Helper function untuk memanggil Google Gemini Vision REST API (Zero dependency)
async function scanWithGemini(base64Image: string, mimeType: string, promptInstruksi: string, geminiKey: string): Promise<string> {
  // 1. Coba Endpoint Terbaru: v1alpha Interactions API (gemini-3.6-flash)
  try {
    const url = `https://generativelanguage.googleapis.com/v1alpha/interactions?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        input: [
          { type: 'text', text: promptInstruksi },
          { type: 'image', data: base64Image, mime_type: mimeType }
        ]
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.outputs?.[0]?.text || data.output_text || '';
      if (text) return text;
    }
  } catch (e: any) {
    console.warn('Gemini Interactions API fallback to generateContent:', e.message);
  }

  // 2. Coba Endpoint Standar: v1beta generateContent API (gemini-2.0-flash / gemini-2.5-flash)
  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
  let lastError = '';

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Model ${modelName} HTTP ${response.status}: ${errText}`;
        continue;
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawText) return rawText;
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || 'Seluruh model Gemini gagal merespon.');
}

// POST: Proses pemindaian dokumen (Struk & Invoice) dengan AI Vision Model (Groq + Gemini Fallback)
export async function POST(req: NextRequest) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { success: false, message: 'API Key AI (GROQ_API_KEY atau GEMINI_API_KEY) belum dikonfigurasi di file .env' },
        { status: 500 }
      );
    }

    // 1. Ambil file gambar dari FormData request Frontend
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file dokumen (struk/invoice) yang diunggah' },
        { status: 400 }
      );
    }

    // 2. Konversi file gambar mentah ke Base64 (Lossless / Uncompressed)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // 3. Susun instruksi Prompt Fleksibel & Akurat untuk Struk Thermal, EDC, BRI Link, Kuitansi, maupun Invoice / Faktur
    const promptInstruksi = `Bertindaklah sebagai OCR Dokumen Keuangan profesional berakurasi sangat tinggi.
Tugas Anda adalah membaca gambar dokumen transaksi (struk thermal, struk transfer BRI LINK/EDC, nota toko, kuitansi, atau invoice tagihan) dan mengekstrak informasi kunci:

1. 'merchant': Nama toko/vendor/agen pengeluar dokumen (string). Contoh: "JIHAD BRILINK", "Indomaret", "PT SYAFTRACO".
2. 'tanggal': Tanggal transaksi dengan format standard ISO 'YYYY-MM-DD'.
   *PENTING*: Perhatikan format tanggal Indonesia (DD-MM-YYYY / DD/MM/YYYY). Contoh: '16-09-2023 10:56:51' ubah menjadi '2023-09-16'.
3. 'nominal': Total nominal pembayaran / grand total akhir yang dibayarkan (integer murni tanpa huruf/simbol).
   *PENTING*: Cari baris "Total", "Total Bayar", "Jumlah Bayar", "Grand Total", atau angka akhir transaksi. Contoh jika tertulis "Total : Rp 638.000", hasilnya adalah 638000.
4. 'kategoriBukti': Tentukan kategori dokumen hanya dari pilihan berikut:
   - "Struk Pembelian" (jika berupa struk thermal, struk belanjaan, atau struk EDC/transfer)
   - "Invoice / Faktur" (jika berupa faktur tagihan resmi / bill)
   - "Kuitansi Resmi" (jika berupa kuitansi pembayaran)
   - "Nota Kontan" (jika berupa nota manual/toko)
5. 'keterangan': Ringkasan singkat mengenai transaksi/layanan yang dibayarkan (misal: "Pembayaran Briva PT SYAFTRACO a/n JUMIAH").

WAJIB: DILARANG KERAS menyertakan tag <think> atau penjelasan teks apapun. Kembalikan HANYA berupa satu objek JSON valid persis dengan struktur berikut:
{
  "merchant": "JIHAD BRILINK",
  "tanggal": "2023-09-16",
  "nominal": 638000,
  "kategoriBukti": "Struk Pembelian",
  "keterangan": "Pembayaran Briva PT SYAFTRACO"
}`;

    let rawResponse = '';
    let providerUsed = '';

    // 4. Coba Primary Provider: Groq Vision (qwen/qwen3.6-27b)
    if (groqKey) {
      try {
        const client = new Groq({ apiKey: groqKey });
        const chatCompletion = await client.chat.completions.create({
          model: 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptInstruksi },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          temperature: 0.1,
        });
        rawResponse = chatCompletion.choices[0]?.message?.content || '';
        if (rawResponse) providerUsed = 'Groq Vision (Qwen)';
      } catch (groqErr: any) {
        console.warn('Groq Vision primary error/rate-limited:', groqErr?.status, groqErr?.message);
      }
    }

    // 5. Coba Secondary Provider: Google Gemini Vision API (bila Groq gagal/rate limit)
    if (!rawResponse && geminiKey) {
      try {
        console.log('Menggunakan Secondary AI Provider: Google Gemini 3.6 Flash / 2.0 Flash...');
        rawResponse = await scanWithGemini(base64Image, mimeType, promptInstruksi, geminiKey);
        if (rawResponse) providerUsed = 'Google Gemini Vision';
      } catch (geminiErr: any) {
        console.error('Gemini Vision fallback error:', geminiErr?.message);
      }
    }

    // 6. Jika kedua provider gagal
    if (!rawResponse) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Layanan AI Vision sedang mencapai batas kuota harian atau mengalami gangguan. Silakan periksa API Key atau isi detail pengajuan secara manual.' 
        },
        { status: 429 }
      );
    }

    // 7. Sanitasi & Extractor JSON Respons (Aman dari tag <think> dan markdown code block)
    const parseAiJson = (text: string): any => {
      if (!text) return null;
      // Hapus tag pemikiran model AI (<think>...</think>)
      let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // Ekstrak dari markdown code block ```json ... ```
      const codeBlockMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        clean = codeBlockMatch[1].trim();
      }

      // 1. Coba parse langsung
      try {
        return JSON.parse(clean);
      } catch {}

      // 2. Cari substring JSON { ... } terluar
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = clean.substring(firstBrace, lastBrace + 1).trim();
        try {
          return JSON.parse(jsonCandidate);
        } catch {}
      }

      // 3. Fallback regex matcher per baris JSON
      const matches = clean.match(/\{[\s\S]*?\}/g);
      if (matches) {
        for (const m of matches) {
          try {
            const parsed = JSON.parse(m);
            if (parsed && typeof parsed === 'object') return parsed;
          } catch {}
        }
      }

      return null;
    };

    let dataJson = parseAiJson(rawResponse);

    if (!dataJson || typeof dataJson !== 'object') {
      console.error('Gagal memproses respons AI Vision. Raw output:', rawResponse);
      return NextResponse.json({
        success: false,
        message: 'Vision AI tidak dapat mengekstrak data dari dokumen ini. Silakan periksa atau isi data secara manual.',
      }, { status: 422 });
    }

    // Normalisasi & pembersihan tipe data hasil ekstrak
    const sanitizedData = {
      merchant: String(dataJson.merchant || 'Vendor Dokumen').trim(),
      tanggal: String(dataJson.tanggal || new Date().toISOString().split('T')[0]).trim(),
      nominal: typeof dataJson.nominal === 'number' 
        ? Math.round(dataJson.nominal) 
        : parseInt(String(dataJson.nominal || '0').replace(/\D/g, ''), 10) || 0,
      kategoriBukti: String(dataJson.kategoriBukti || 'Struk Pembelian').trim(),
      keterangan: String(dataJson.keterangan || '').trim(),
    };

    return NextResponse.json({
      success: true,
      message: `Berhasil mengekstrak data menggunakan ${providerUsed}`,
      data: sanitizedData,
    });

  } catch (error: any) {
    console.error('OCR Endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: `Terjadi kesalahan server: ${error?.message || 'Error tidak diketahui'}`,
    }, { status: 500 });
  }
}