function StatCardSkeleton() {
  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[124px]">
      <div className="flex justify-between items-start">
        <div className="h-3 w-20 bg-stone-200 rounded" />
        <div className="w-7 h-7 bg-stone-100 rounded-lg" />
      </div>
      <div>
        <div className="h-6 w-24 bg-stone-200 rounded mb-2" />
        <div className="h-2.5 w-16 bg-stone-100 rounded" />
      </div>
    </div>
  );
}

export function JurnalPageSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-56 bg-stone-200 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-stone-100 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="flex justify-end gap-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[30px] w-28 bg-stone-100 border border-stone-200 rounded-lg" />
        ))}
      </div>

      <div className="bg-white border border-stone-200/80 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-200 bg-[#fafaf9]">
              {["NO. JURNAL", "TANGGAL", "KETERANGAN", "AKUN", "DEBIT", "KREDIT", "REF"].map((col) => (
                <th key={col} className="text-left text-[11px] font-semibold text-stone-300 tracking-wider px-4 py-3.5 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className={i < 4 ? "border-b border-stone-100" : ""}>
                <td className="px-7 py-3"><div className="h-3 w-16 bg-stone-200 rounded" /></td>
                <td className="px-4 py-3"><div className="h-3 w-20 bg-stone-100 rounded" /></td>
                <td className="px-4 py-3"><div className="h-3 w-40 bg-stone-100 rounded" /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5.5 h-5.5 rounded-full bg-stone-200 shrink-0" />
                    <div className="h-3 w-10 bg-stone-200 rounded" />
                    <div className="h-3 w-28 bg-stone-100 rounded" />
                  </div>
                </td>
                <td className="px-4 py-2.5"><div className="h-3 w-24 bg-stone-200 rounded ml-auto" /></td>
                <td className="px-4 py-2.5"><div className="h-3 w-24 bg-stone-200 rounded ml-auto" /></td>
                <td className="px-6 py-3"><div className="h-3 w-14 bg-stone-100 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
