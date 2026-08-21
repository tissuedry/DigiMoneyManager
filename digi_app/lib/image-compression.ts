/**
 * Utility helper untuk kompresi cerdas berkas gambar struk/invoice di sisi browser (Client-side).
 * Menggunakan HTML5 Canvas dan prinsip Ambang Batas (Threshold 1.5 MB).
 */

export const THRESHOLD_SIZE_KB = 1536; // 1.5 MB (1536 KB)

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  isCompressed: boolean;
}

/**
 * Mengompresi berkas gambar jika ukurannya melebihi threshold (1.5 MB).
 * Jika ukuran file sudah <= 1.5 MB atau berupa PDF, file dilewatkan langsung (bypass).
 *
 * @param file Berkas File asli dari input form / dropzone
 * @param maxDimension Dimensi terpanjang (lebar/tinggi) maksimum piksel (default 1600px)
 * @param quality Kualitas kompresi JPEG (default 0.85 untuk menjaga ketajaman teks struk)
 * @param thresholdKB Ambang batas ukuran file dalam KB (default 1536 KB = 1.5 MB)
 * @returns Promise<File> Berkas gambar yang sudah dioptimasi atau berkas asli
 */
export async function compressReceiptFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = THRESHOLD_SIZE_KB
): Promise<File> {
  // 1. Jika berupa PDF, jangan diubah (biarkan dokumen aslinya)
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }

  // 2. Jika bukan tipe gambar yang didukung canvas, kembalikan file asli
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const fileSizeKB = file.size / 1024;

  // 3. Ambang batas: Jika ukuran file sudah <= threshold (1.5 MB), tidak perlu kompresi
  if (fileSizeKB <= thresholdKB) {
    return file;
  }

  // 4. Kompresi gambar via HTML5 Canvas (Resize cerdas proporsional)
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proporsional jika melebihi maxDimension (1600px)
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        // Gambar ulang di kanvas dengan interpolasi halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Ganti ekstensi menjadi .jpg yang terkompresi
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper untuk memproses array berkas secara paralel dengan kompresi cerdas.
 */
export async function compressMultipleReceiptFiles(
  files: File[],
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = THRESHOLD_SIZE_KB
): Promise<File[]> {
  return Promise.all(
    files.map((file) => compressReceiptFile(file, maxDimension, quality, thresholdKB))
  );
}

/**
 * Helper kompresi yang mengembalikan file hasil kompresi beserta metrik ukuran asli dan akhirnya.
 */
export async function compressReceiptWithMeta(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = THRESHOLD_SIZE_KB
): Promise<CompressionResult> {
  const originalSize = file.size;
  const compressed = await compressReceiptFile(file, maxDimension, quality, thresholdKB);
  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
    isCompressed: compressed.size < originalSize,
  };
}

export async function compressMultipleWithMeta(
  files: File[],
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = THRESHOLD_SIZE_KB
): Promise<CompressionResult[]> {
  return Promise.all(files.map((f) => compressReceiptWithMeta(f, maxDimension, quality, thresholdKB)));
}
