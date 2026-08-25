/**
 * Helper utility untuk konversi nominal Rupiah ke format ringkas (rb, jt, M, T)
 * dengan presisi desimal maksimal 2 digit belakang koma (id-ID) dan spasi sebelum unit.
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

/** Rupiah penuh dengan tanda minus eksplisit untuk nilai sisa yang overbudget */
export function formatSisaRupiah(num: number): string {
  const n = Number(num) || 0;
  if (n < 0) return `-Rp ${Math.abs(Math.round(n)).toLocaleString("id-ID")}`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

/**
 * Memformat angka hingga maksimal 2 digit desimal belakang koma (id-ID).
 * Contoh: 2.200.000 / 1.000.000 = 2.2 -> "2,20"
 * Contoh: 2.220.000.000 / 1.000.000.000 = 2.22 -> "2,22"
 * Contoh: 2.000.000 / 1.000.000 = 2 -> "2"
 */
function formatExactDecimal(val: number, maxDecimals = 2): string {
  const roundedVal = Math.round(val * 100) / 100;
  if (roundedVal % 1 === 0) return roundedVal.toString();

  return roundedVal.toFixed(maxDecimals).replace('.', ',');
}

export function formatCompactRupiah(value: number | string): string {
  const num = parseNominalNumber(value);
  if (num === 0) return 'Rp 0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000_000_000) {
    // Triliun (T)
    const val = absNum / 1_000_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} T`;
  }
  if (absNum >= 1_000_000_000) {
    // Miliar (M)
    const val = absNum / 1_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} M`;
  }
  if (absNum >= 1_000_000) {
    // Juta (jt)
    const val = absNum / 1_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} jt`;
  }
  if (absNum >= 1_000 && absNum % 1_000 === 0) {
    // Ribuan bulat (misal 200.000 -> 200 rb)
    const val = absNum / 1_000;
    return `${sign}Rp ${formatExactDecimal(val)} rb`;
  }

  // Untuk nominal di bawah 1 Juta dengan desimal/ratusan (seperti Rp 191.475 atau Rp 221.500), tampilkan format lengkap bersih
  return formatFullRupiah(num);
}
