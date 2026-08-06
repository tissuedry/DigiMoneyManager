'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePreview: string;
  isPdf: boolean;
  fileName?: string;
}

export default function PreviewModal({ isOpen, onClose, filePreview, isPdf, fileName }: PreviewModalProps) {
  const [previewZoomScale, setPreviewZoomScale] = useState<number>(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoomAndPan = () => {
    setPreviewZoomScale(1);
    setPanPos({ x: 0, y: 0 });
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      resetZoomAndPan();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        onClose();
        resetZoomAndPan();
      }}
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          resetZoomAndPan();
        }}
        className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer shadow-xl"
        title="Tutup"
      >
        <X size={20} />
      </button>

      <div
        className={`relative max-w-[92vw] max-h-[92vh] overflow-hidden p-2 flex items-center justify-center select-none ${
          previewZoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setPreviewZoomScale((prev) => Math.min(prev + 0.25, 4));
          } else {
            setPreviewZoomScale((prev) => {
              const next = Math.max(prev - 0.25, 1);
              if (next === 1) setPanPos({ x: 0, y: 0 });
              return next;
            });
          }
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
          }
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            setPanPos({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y,
            });
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        {isPdf ? (
          <iframe
            src={filePreview}
            className="w-[85vw] max-w-4xl h-[80vh] rounded-2xl bg-white shadow-2xl border border-stone-200"
            title="Preview PDF"
          />
        ) : (
          <img
            src={filePreview}
            alt="Bukti Struk Full Preview"
            draggable={false}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${previewZoomScale})`,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/bukti_struk.png';
            }}
          />
        )}
      </div>
    </div>
  );
}