'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const numValue = parseNominalNumber(value);

  // Penyingkatan HANYA aktif jika nominal melebihi ambang batas container (agar tidak meluap/bocor dari box)
  const isCompactNeeded = Math.abs(numValue) >= compactThreshold;
  const displayText = isCompactNeeded ? formatCompactRupiah(numValue) : formatFullRupiah(numValue);
  const fullText = formatFullRupiah(numValue);

  // Jika digit tidak terlalu banyak (muat di dalam container), tampilkan format lengkap bersih tanpa tooltip
  if (!showTooltip || !isCompactNeeded) {
    return <span className={className}>{displayText}</span>;
  }

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-pointer inline-block ${className}`}
      >
        {displayText}
      </span>

      {/* Floating Tooltip Card (Render via React Portal ke document.body agar 100% berada di atas SELURUH LAYER & tidak pernah terpotong overflow) */}
      {mounted && isHovered && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 999999,
          }}
          className="pointer-events-none w-max max-w-[360px] whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-bold text-stone-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {fullText}
        </div>,
        document.body
      )}
    </>
  );
}
