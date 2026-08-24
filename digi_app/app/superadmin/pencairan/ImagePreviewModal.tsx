'use client';

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl }: ImagePreviewModalProps) {
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoomAndPan = () => {
    setZoomScale(1);
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

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
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
          zoomScale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setZoomScale((prev) => Math.min(prev + 0.25, 4));
          } else {
            setZoomScale((prev) => {
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
        <img
          src={imageUrl}
          alt="Bukti Struk"
          draggable={false}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/bukti_struk.png';
          }}
        />
      </div>
    </div>
  );
}