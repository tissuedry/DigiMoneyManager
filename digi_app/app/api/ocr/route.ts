import { NextResponse, NextRequest } from 'next/server';
import Groq from 'groq-sdk';

// POST: Proses pemindaian riil dengan Llama 4 Scout Vision AI
export async function POST(req: NextRequest) {
  try {
    // 1. Validasi keberadaan API Key di Server Environment
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'GROQ_API_KEY belum dikonfigurasi di file .env.local' },
        { status: 500 }
      );
    }

    // 2. Ambil file gambar dari FormData request Frontend
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file dokumen/struk yang diunggah' },
        { status: 400 }
      );
    }

    // 3. Konversi file gambar mentah ke Base64 Data URI (Menggantikan fungsi open() rb pada Python)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // 4. Inisialisasi Groq Node.js Client
    const client = new Groq({ apiKey });

    // 5. Susun instruksi Prompt ketat bahasa Indonesia dengan struktur kunci penampung state form
    const promptInstruksi = `Bertindaklah sebagai parser struk belanjaan profesional berakurasi tinggi.
Tugas Anda adalah melihat gambar struk belanjaan yang diberikan, lalu mengekstrak informasi berikut:
1. 'merchant': Nama toko/brand/perusahaan (string).
2. 'tanggal': Tanggal transaksi dengan format standard ISO 'YYYY-MM-DD'.
   *PENTING*: Perhatikan penulisan tanggal di struk Indonesia. Jika tertulis '10 May 19', itu artinya tanggal 2019-05-10 (format YYYY-MM-DD). Jangan salah mengira angka '19' sebagai hari atau bulan!
3. 'nominal': Total nominal akhir/pembayaran yang harus dibayarkan (integer murni, hilangkan simbol Rp, koma, atau titik).
4. 'kategoriBukti': Tentukan kategori bukti kembalian hanya dari tiga pilihan ini: "Struk Pembelian", "Kuitansi Resmi", atau "Nota Kontan".
5. 'keterangan': Rangkuman deskripsi singkat mengenai barang/jasa apa saja yang dibeli pada struk tersebut untuk kebutuhan operasional site.

WAJIB: Format output hanya boleh berupa JSON bersih tanpa pembungkus markdown block (seperti \`\`\`json ... \`\`\`) dan tanpa teks penjelasan basa-basi apa pun. Struktur JSON harus persis seperti ini:
{
  "merchant": "Nama Merchant",
  "tanggal": "2026-05-18",
  "nominal": 450000,
  "kategoriBukti": "Struk Pembelian",
  "keterangan": "Pembelian kertas A4, log book, dan papan klip untuk kebutuhan administrasi site."
}`;

    // 6. Jalankan request ke Llama 4 Scout Vision API
    const chatCompletion = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
      temperature: 0.1, // Nilai rendah agar hasil analisis kaku, akurat, dan tidak berhalusinasi angka
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || '';

    // 7. Bersihkan data string dari kemungkinan kembalian blok markdown luar
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.substring(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.substring(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
    }
    cleanedResponse = cleanedResponse.trim();

    // 8. Transformasikan string bersih menjadi objek JSON terstruktur
    const dataJson = JSON.parse(cleanedResponse);

    // Kembalikan struktur data yang pas dengan konsumsi state Frontend Anda
    return NextResponse.json({
      success: true,
      message: 'Model berhasil mengekstrak data struk belanjaan secara riil',
      data: dataJson,
    });

  } catch (error: any) {
    console.error('OCR Endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}