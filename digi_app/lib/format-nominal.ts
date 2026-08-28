export function parseNominalNumber(val: number | string): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleanStr = String(val)
    .replace(/Rp\s?/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

const idrFullFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatFullRupiah(value: number | string): string {
  return idrFullFormatter.format(parseNominalNumber(value));
}

export function formatSisaRupiah(num: number): string {
  const n = Number(num) || 0;
  if (n < 0) return `-Rp ${Math.abs(Math.round(n)).toLocaleString("id-ID")}`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

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
    const val = absNum / 1_000_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} T`;
  }
  if (absNum >= 1_000_000_000) {
    const val = absNum / 1_000_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} M`;
  }
  if (absNum >= 1_000_000) {
    const val = absNum / 1_000_000;
    return `${sign}Rp ${formatExactDecimal(val)} jt`;
  }
  if (absNum >= 1_000 && absNum % 1_000 === 0) {
    const val = absNum / 1_000;
    return `${sign}Rp ${formatExactDecimal(val)} rb`;
  }

  return formatFullRupiah(num);
}
