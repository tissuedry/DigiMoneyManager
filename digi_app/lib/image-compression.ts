export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  isCompressed: boolean;
}

export async function compressReceiptFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = 1536
): Promise<File> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return file;
  }

  if (!file.type.startsWith('image/')) {
    return file;
  }

  const fileSizeKB = file.size / 1024;

  if (fileSizeKB <= thresholdKB) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

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

export async function compressReceiptWithMeta(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
  thresholdKB = 1536
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
  thresholdKB = 1536
): Promise<CompressionResult[]> {
  return Promise.all(files.map((f) => compressReceiptWithMeta(f, maxDimension, quality, thresholdKB)));
}
