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
    <div className="flex items-center justify-center gap-5 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="p-2 rounded-full border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-sm"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2.5">
        {Array.from({ length: totalPages }).map((_, i) => {
          const isActive = i + 1 === page;
          return (
            <button
              key={i}
              onClick={() => onChange(i + 1)}
              aria-label={`Halaman ${i + 1}`}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full transition-all duration-300 ease-out cursor-pointer ${
                isActive ? "w-7 h-2.5 bg-[#2d6a4f]" : "w-2.5 h-2.5 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          );
        })}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="p-2 rounded-full border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-sm"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
