import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
      >
        <ChevronLeft size={14} />
        Sebelumnya
      </button>
      <span className="text-xs font-semibold text-stone-500 px-3">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
      >
        Selanjutnya
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
