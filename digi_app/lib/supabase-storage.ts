import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dndluxlfsdjotjcqotfp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mengompresi file gambar/base64 menjadi format WebP buffer dan mengunggahnya ke Supabase Storage.
 * Menghasilkan Public URL gambar dari bucket Supabase Storage.
 */
export async function uploadStrukToSupabase(
  input: Buffer | string,
  customFileName?: string
): Promise<string> {
  let buffer: Buffer;

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      // Sudah berupa URL eksternal / Supabase URL
      return input;
    }
    if (input.startsWith('data:image/')) {
      const parts = input.split(',');
      if (parts[1]) {
        buffer = Buffer.from(parts[1], 'base64');
      } else {
        return input;
      }
    } else {
      // Jika string base64 murni tanpa prefix data URI
      buffer = Buffer.from(input, 'base64');
    }
  } else {
    buffer = input;
  }

  // 1. Kompresi Gambar ke WebP menggunakan sharp
  let webpBuffer: Buffer;
  try {
    webpBuffer = await sharp(buffer)
      .resize({
        width: 1920,
        height: 1920,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Failed to compress image with Sharp, fallback to raw buffer:', error);
    webpBuffer = buffer;
  }

  // 2. Tentukan Nama File Unik
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = customFileName || `struk_${timestamp}_${randomStr}.webp`;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'struk-reimbursement';

  // Jika API key belum diisi di .env, tampilkan log peringatan
  if (!supabaseKey) {
    console.warn(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.'
    );
  }

  // 3. Upload Buffer ke Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, webpBuffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (error) {
    console.error(`❌ Error uploading to Supabase Storage bucket '${bucketName}':`, error.message);
    throw new Error(
      `Gagal mengunggah file ke Supabase Storage (Bucket: '${bucketName}'). Pastikan bucket sudah dibuat di Supabase dan diset Public. Detail: ${error.message}`
    );
  }

  // 4. Dapatkan Public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
