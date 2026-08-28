import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dndluxlfsdjotjcqotfp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey || 'dummy-key-for-build');

export async function uploadStrukToSupabase(
  input: Buffer | string,
  customFileName?: string,
  isPdfHint?: boolean
): Promise<string> {
  let buffer: Buffer;

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return input;
    }
    if (input.startsWith('/uploads/')) {
      return input;
    }
    if (input.startsWith('data:')) {
      const parts = input.split(',');
      if (parts[1]) {
        buffer = Buffer.from(parts[1], 'base64');
      } else {
        return input;
      }
    } else {
      buffer = Buffer.from(input, 'base64');
    }
  } else {
    buffer = input;
  }

  const isPdf = isPdfHint || (buffer.length > 4 && buffer.subarray(0, 4).toString() === '%PDF');

  let fileBuffer: Buffer = buffer;
  let contentType = 'image/webp';
  let fileExt = 'webp';

  if (isPdf) {
    if (buffer.length > 3 * 1024 * 1024) {
      try {
        const soi = Buffer.from([0xff, 0xd8, 0xff]);
        const eoi = Buffer.from([0xff, 0xd9]);
        const extracted: Buffer[] = [];
        let offset = 0;

        while (offset < buffer.length && extracted.length < 6) {
          const start = buffer.indexOf(soi, offset);
          if (start === -1) break;
          const end = buffer.indexOf(eoi, start + 3);
          if (end === -1) break;
          const imgBuffer = buffer.subarray(start, end + 2);
          if (imgBuffer.length > 5 * 1024) {
            extracted.push(imgBuffer);
          }
          offset = end + 2;
        }

        if (extracted.length > 0) {
          const compBuffer = await sharp(extracted[0])
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

          if (compBuffer.length <= 3 * 1024 * 1024) {
            fileBuffer = compBuffer;
            contentType = 'image/webp';
            fileExt = 'webp';
          } else {
            fileBuffer = buffer;
            contentType = 'application/pdf';
            fileExt = 'pdf';
          }
        } else {
          fileBuffer = buffer;
          contentType = 'application/pdf';
          fileExt = 'pdf';
        }
      } catch {
        fileBuffer = buffer;
        contentType = 'application/pdf';
        fileExt = 'pdf';
      }
    } else {
      fileBuffer = buffer;
      contentType = 'application/pdf';
      fileExt = 'pdf';
    }
  } else {
    try {
      let compressed = await sharp(buffer)
        .resize({
          width: 1920,
          height: 1920,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();

      if (compressed.length > 3 * 1024 * 1024) {
        compressed = await sharp(compressed)
          .resize({ width: 1280, height: 1280, fit: 'inside' })
          .webp({ quality: 60 })
          .toBuffer();
      }

      if (compressed.length > 3 * 1024 * 1024) {
        compressed = await sharp(compressed)
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .webp({ quality: 50 })
          .toBuffer();
      }

      fileBuffer = compressed;
    } catch (error) {
      console.error('Failed to compress image with Sharp, fallback to raw buffer:', error);
      fileBuffer = buffer;
    }
  }

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = customFileName || `struk_${timestamp}_${randomStr}.${fileExt}`;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'struk-reimbursement';

  if (supabaseKey && supabaseKey !== 'dummy-key-for-build') {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (supabaseErr: any) {
      console.warn(`Supabase Storage upload error (${supabaseErr?.message}). Fallback ke local storage...`);
    }
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${fileName}`;
  } catch (fsErr: any) {
    console.error('Local storage fallback error:', fsErr);
    return `/uploads/placeholder.png`;
  }
}
