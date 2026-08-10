import { NextResponse, NextRequest } from 'next/server';


// Helper function untuk memanggil Google Gemini Vision REST API (Eksklusif gemini-3.5-flash-lite)
async function scanWithGemini(base64Image: string, mimeType: string, promptInstruksi: string, geminiKey: string): Promise<string> {
  const modelName = 'gemini-3.5-flash-lite';
  
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
    throw new Error(`Model ${modelName} HTTP ${response.status}: ${errText}`);
  }

  const resJson = await response.json();
  const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (rawText) return rawText;

  throw new Error(`Model ${modelName} tidak mengembalikan respons teks.`);
}

// POST: Proses pemindaian dokumen (Struk & Invoice) dengan Gemini 3.5 Flash Lite
export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        { success: false, message: 'API Key GEMINI_API_KEY belum dikonfigurasi di file .env' },
        { status: 500 }
      );
    }

    // 1. Ambil file gambar/PDF dari FormData request Frontend (tanpa batasan ukuran untuk pemindaian OCR AI)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file dokumen (struk/invoice) yang diunggah' },
        { status: 400 }
      );
    }

    // 2. Konversi file dokumen/gambar mentah ke Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const fileName = file.name || '';
    const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    const mimeType = isPdf ? 'application/pdf' : (file.type || 'image/png');

    // 3. Susun instruksi Prompt Fleksibel & Akurat untuk Single/Multi Struk & Invoice PDF
    const promptInstruksi = `Bertindaklah sebagai OCR Dokumen Keuangan profesional berakurasi sangat tinggi.
Tugas Anda adalah membaca dokumen transaksi (struk thermal, struk transfer, nota toko, kuitansi, atau dokumen PDF yang berisi satu atau beberapa foto struk/invoice) dan mengekstrak informasi kunci:

1. 'merchant': Nama toko/vendor/agen pengeluar dokumen (string). Jika ada beberapa struk dalam satu dokumen PDF, sebutkan vendor utama atau gabungkan (contoh: "Indomaret / Pertamina / Toko Jaya").
2. 'tanggal': Tanggal transaksi dengan format standard ISO 'YYYY-MM-DD'. Ambil tanggal dari struk terbaru atau struk utama.
3. 'nominal': Total nominal pembayaran (integer murni tanpa huruf/simbol). 
   *PENTING*: Jika dokumen PDF berisi BEBERAPA foto struk/invoice terpisah, JUMLAHKAN SELURUH NOMINAL dari semua struk tersebut menjadi satu Grand Total akumulasi! Contoh: Struk 1 (Rp 50.000) + Struk 2 (Rp 100.000) = 150000.
4. 'kategoriBukti': Tentukan kategori dokumen hanya dari pilihan berikut:
   - "Struk Pembelian" (jika berupa struk thermal, struk belanjaan, atau struk EDC/transfer)
   - "Invoice / Faktur" (jika berupa faktur tagihan resmi / bill / PDF invoice)
   - "Kuitansi Resmi" (jika berupa kuitansi pembayaran)
   - "Nota Kontan" (jika berupa nota manual/toko)
5. 'keterangan': Ringkasan singkat mengenai transaksi/layanan yang dibayarkan (misal: "Gabungan foto struk pengeluaran operasional proyek").

WAJIB: DILARANG KERAS menyertakan tag <think> atau penjelasan teks apapun. Kembalikan HANYA berupa satu objek JSON valid persis dengan struktur berikut:
{
  "merchant": "Indomaret & Pertamina",
  "tanggal": "2026-08-04",
  "nominal": 150000,
  "kategoriBukti": "Struk Pembelian",
  "keterangan": "Gabungan foto struk operasional proyek"
}`;

    let rawResponse = '';
    let providerUsed = 'Google Gemini Vision (gemini-3.5-flash-lite)';

    // 4. Eksekusi OCR hanya dengan Gemini 3.5 Flash Lite
    try {
      console.log('Mengeksekusi OCR Reimbursement khusus dengan Gemini (gemini-3.5-flash-lite)...');
      rawResponse = await scanWithGemini(base64Image, mimeType, promptInstruksi, geminiKey);
    } catch (geminiErr: any) {
      console.error('Gemini Vision error:', geminiErr?.message);
      return NextResponse.json(
        {
          success: false,
          message: `Pemindaian Gemini gagal: ${geminiErr?.message || 'Error tidak diketahui'}`
        },
        { status: 500 }
      );
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
      } catch { }

      // 2. Cari substring JSON { ... } terluar
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = clean.substring(firstBrace, lastBrace + 1).trim();
        try {
          return JSON.parse(jsonCandidate);
        } catch { }
      }

      // 3. Fallback regex matcher per baris JSON
      const matches = clean.match(/\{[\s\S]*?\}/g);
      if (matches) {
        for (const m of matches) {
          try {
            const parsed = JSON.parse(m);
            if (parsed && typeof parsed === 'object') return parsed;
          } catch { }
        }
      }

      return null;
    };

    const dataJson = parseAiJson(rawResponse);

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