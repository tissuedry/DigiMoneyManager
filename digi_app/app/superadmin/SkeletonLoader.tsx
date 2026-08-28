export function KaryawanDashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="h-3 w-24 bg-stone-100 rounded" />
              <div className="w-8 h-8 bg-stone-200 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-stone-200 rounded mb-2" />
            <div className="h-3 w-28 bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="h-4 w-36 bg-stone-200 rounded" />
          <div className="h-3 w-16 bg-stone-100 rounded" />
        </div>
        <div className="divide-y divide-stone-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-9 h-9 shrink-0 bg-stone-200 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/4 bg-stone-200 rounded" />
                <div className="h-2.5 w-1/5 bg-stone-100 rounded" />
              </div>
              <div className="h-3 w-24 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReimbursePageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 p-4 lg:p-8 space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-stone-200 rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-stone-100 rounded-md" />
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-stone-200" />
                {i < 2 && <div className="h-[2px] w-10 bg-stone-200 rounded" />}
              </div>
            ))}
          </div>

          <div className="border-2 border-dashed border-stone-200 rounded-xl h-48 flex items-center justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-32 h-28 bg-stone-100 rounded-xl" />
            ))}
          </div>

          <div className="space-y-3">
            <div className="h-11 bg-stone-100 rounded-xl" />
            <div className="h-11 bg-stone-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-11 bg-stone-100 rounded-xl" />
              <div className="h-11 bg-stone-100 rounded-xl" />
            </div>
          </div>

          <div className="h-12 w-full sm:w-auto bg-stone-200 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
