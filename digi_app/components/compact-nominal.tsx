'use client';

import { useState, useRef, useEffect, useLayoutEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { formatCompactRupiah, formatFullRupiah, parseNominalNumber } from '@/lib/format-nominal';

interface CompactNominalProps {
  value: number | string;
  className?: string;
  compactThreshold?: number;
  showTooltip?: boolean;
}

function CompactNominalInner({
  value,
  className = '',
  compactThreshold = 1_000_000_000_000,
  showTooltip = true,
}: CompactNominalProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; transform: string }>({
    top: 0,
    left: 0,
    transform: 'translateX(-50%)',
  });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const numValue = parseNominalNumber(value);

  const isCompactNeeded = Math.abs(numValue) >= compactThreshold;
  const displayText = isCompactNeeded ? formatCompactRupiah(numValue) : formatFullRupiah(numValue);
  const fullText = formatFullRupiah(numValue);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 180;
      const halfWidth = tooltipWidth / 2;

      let targetLeft = rect.left + rect.width / 2;
      let targetTransform = 'translateX(-50%)';

      if (rect.left + rect.width / 2 + halfWidth > viewportWidth - 16) {
        targetLeft = Math.min(rect.right, viewportWidth - 16);
        targetTransform = 'translateX(-100%)';
      } else if (rect.left + rect.width / 2 - halfWidth < 16) {
        targetLeft = Math.max(rect.left, 16);
        targetTransform = 'translateX(0%)';
      }

      setCoords({
        top: rect.bottom + 6,
        left: targetLeft,
        transform: targetTransform,
      });
    }
  };

  useLayoutEffect(() => {
    if (isHovered) {
      updatePosition();
    }
  }, [isHovered]);

  const handleMouseEnter = () => {
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (!showTooltip || !isCompactNeeded) {
    return <span className={className}>{displayText}</span>;
  }

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

      {mounted && isHovered && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.transform,
            zIndex: 999999,
          }}
          className="pointer-events-none w-max max-w-90 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-bold text-stone-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {fullText}
        </div>,
        document.body
      )}
    </>
  );
}

const CompactNominal = memo(CompactNominalInner);
export default CompactNominal;
