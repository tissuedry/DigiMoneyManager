/**
 * Helper utility untuk konversi nominal Rupiah ke format ringkas (rb, jt, M, T)
 * tanpa pembulatan ke atas/bawah (presisi angka persis/truncation).
 */

export function parseNominalNumber(val: number | string): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Hapus "Rp", spasi, dan titik ribuan
  const cleanStr = String(val)
    .replace(/Rp\s?/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatFullRupiah(value: number | string): string {
  const num = parseNominalNumber(value);

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Memformat desimal tanpa pembulatan (truncation) hingga maks 3 digit desimal
 * Contoh: 9.778.000 -> 9,778jt (bukan 9,8jt)
 */
function formatExactDecimal(val: number, maxDecimals = 3): string {
  if (val % 1 === 0) return val.toString();

  const str = val.toString();
  const parts = str.split('.');
  if (parts.length === 1) return parts[0];

  const intPart = parts[0];
  let decPart = parts[1].substring(0, maxDecimals);

  decPart = decPart.replace(/0+$/, '');
  if (!decPart) return intPart;

  return `${intPart},${decPart}`;
}

export function formatCompactRupiah(value: number | string): string {
  const num = parseNominalNumber(value);
  if (num === 0) return 'Rp 0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000_000) {
    // Triliun (T)
    const val = absNum / 1_000_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)}T`;
  }
  if (absNum >= 1_000_000_000) {
    // Miliar (M)
    const val = absNum / 1_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)}M`;
  }
  if (absNum >= 1_000_000) {
    // Juta (jt)
    const val = absNum / 1_000_000;
    return `${sign}Rp ${formatExactDecimal(val)}jt`;
  }
  if (absNum >= 1_000 && absNum % 1_000 === 0) {
    // Ribuan bulat (misal 200.000 -> 200rb)
    const val = absNum / 1_000;
    return `${sign}Rp ${formatExactDecimal(val)}rb`;
  }

  // Untuk nominal di bawah 1 Juta dengan desimal/ratusan (seperti Rp 191.475 atau Rp 221.500), tampilkan format lengkap bersih
  return formatFullRupiah(num);
}
