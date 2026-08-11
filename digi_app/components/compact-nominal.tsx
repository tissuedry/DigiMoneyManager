'use client';

import React from 'react';
import { formatCompactRupiah, formatFullRupiah, parseNominalNumber } from '@/lib/format-nominal';

interface CompactNominalProps {
  value: number | string;
  className?: string;
  /** Ambang batas nominal (Rp) kapan penyingkatan (jt, M, T) diaktifkan untuk mencegah teks bocor/overflow dari container. Default: 100.000.000 (100 Juta) */
  compactThreshold?: number;
  showTooltip?: boolean;
}

export default function CompactNominal({
  value,
  className = '',
  compactThreshold = 100_000_000,
  showTooltip = true,
}: CompactNominalProps) {
  const numValue = parseNominalNumber(value);

  // Penyingkatan HANYA aktif jika nominal melebihi ambang batas container (agar tidak meluap/bocor dari box)
  const isCompactNeeded = Math.abs(numValue) >= compactThreshold;
  const displayText = isCompactNeeded ? formatCompactRupiah(numValue) : formatFullRupiah(numValue);
  const fullText = formatFullRupiah(numValue);

  // Jika digit tidak terlalu banyak (muat di dalam container), tampilkan format lengkap bersih tanpa tooltip
  if (!showTooltip || !isCompactNeeded) {
    return <span className={className}>{displayText}</span>;
  }

  // Jika digit kepanjangan & berisiko bocor dari container, tampilkan format disingkat (jt, M, T) + Floating Tooltip Card Putih saat hover
  return (
    <span className="group relative inline-block cursor-pointer min-w-0">
      <span className={className}>
        {displayText}
      </span>

      {/* Floating Tooltip Card Putih (Lebih Besar, Jelas, & Presisi saat Hover) */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full z-50 mb-2 hidden w-max max-w-[360px] whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-bold text-stone-900 shadow-xl group-hover:block animate-in fade-in zoom-in-95 duration-150">
        {fullText}
      </span>
    </span>
  );
}
