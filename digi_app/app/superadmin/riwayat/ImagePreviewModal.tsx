'use client';

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl }: ImagePreviewModalProps) {
  const [imageModalZoomScale, setImageModalZoomScale] = useState<number>(1);
  const [imgPanPos, setImgPanPos] = useState({ x: 0, y: 0 });
  const [isImgDragging, setIsImgDragging] = useState(false);
  const [imgDragStart, setImgDragStart] = useState({ x: 0, y: 0 });

  const resetImgZoomAndPan = () => {
    setImageModalZoomScale(1);
    setImgPanPos({ x: 0, y: 0 });
    setIsImgDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
    } else {
      document.body.style.overflow = '';
      resetImgZoomAndPan();
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => {
        onClose();
        resetImgZoomAndPan();
      }}
    >
      <button
        type="button"
        onClick={() => {
          onClose();
          resetImgZoomAndPan();
        }}
        className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 transition cursor-pointer shadow-xl"
        title="Tutup"
      >
        <X size={20} />
      </button>

      <div
        className={`relative max-w-[92vw] max-h-[92vh] overflow-hidden p-2 flex items-center justify-center select-none ${
          imageModalZoomScale > 1 ? (isImgDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (e.deltaY < 0) {
            setImageModalZoomScale((prev) => Math.min(prev + 0.25, 4));
          } else {
            setImageModalZoomScale((prev) => {
              const next = Math.max(prev - 0.25, 1);
              if (next === 1) setImgPanPos({ x: 0, y: 0 });
              return next;
            });
          }
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            setIsImgDragging(true);
            setImgDragStart({ x: e.clientX - imgPanPos.x, y: e.clientY - imgPanPos.y });
          }
        }}
        onMouseMove={(e) => {
          if (isImgDragging) {
            setImgPanPos({
              x: e.clientX - imgDragStart.x,
              y: e.clientY - imgDragStart.y,
            });
          }
        }}
        onMouseUp={() => setIsImgDragging(false)}
        onMouseLeave={() => setIsImgDragging(false)}
      >
        <img
          src={imageUrl}
          alt="Bukti Struk"
          loading="lazy"
          draggable={false}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${imgPanPos.x}px, ${imgPanPos.y}px) scale(${imageModalZoomScale})`,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/bukti_struk.png';
          }}
        />
      </div>
    </div>
  );
}