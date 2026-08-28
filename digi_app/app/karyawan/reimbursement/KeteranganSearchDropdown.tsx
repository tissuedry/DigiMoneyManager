'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export interface FlatKeteranganOption {
  id: string;
  keterangan: string;
  mainId: string;
  mainNama: string;
  subId: string;
  subNama: string;
}

export default function KeteranganSearchDropdown({
  options,
  selectedLabel,
  onSelect,
  hasError,
  placeholder = "Cari keterangan pos anggaran..."
}: {
  options: FlatKeteranganOption[];
  selectedLabel: string;
  onSelect: (opt: FlatKeteranganOption) => void;
  hasError?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((opt) =>
      opt.keterangan.toLowerCase().includes(query.trim().toLowerCase()) ||
      opt.mainNama.toLowerCase().includes(query.trim().toLowerCase()) ||
      opt.subNama.toLowerCase().includes(query.trim().toLowerCase())
    )
    : options;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-white border rounded-xl pl-3 pr-10 py-2.5 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${hasError ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-[#008F5D]'
            }`}
        />
        <Search size={14} className="absolute right-3 top-3 text-stone-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-stone-200 rounded-xl shadow-xl shadow-stone-900/10 overflow-hidden max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2.5 text-stone-400 text-xs font-medium text-center">
              Tidak ada keterangan yang ditemukan
            </div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt);
                setQuery('');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50/60 transition-colors border-b border-stone-100 last:border-0"
            >
              <div className="text-xs font-bold text-stone-800 truncate">{opt.keterangan}</div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                Main: <span className="text-stone-600">{opt.mainNama}</span> · Sub: <span className="text-stone-600">{opt.subNama}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
