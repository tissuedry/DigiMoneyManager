"use client";

export default function BudgetSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
          <div className="h-6 w-40 bg-stone-200 rounded-full" />
          <div className="h-6 w-32 bg-stone-200 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/40 rounded-full border border-stone-200/60 w-fit">
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
          <div className="h-6 w-16 bg-stone-200 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-stone-200" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-2">
                    <div className="h-4 w-40 bg-stone-200 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-16 bg-stone-200 rounded-full" />
                      <div className="h-3 w-24 bg-stone-200 rounded" />
                    </div>
                  </div>
                  <div className="h-7 w-16 bg-stone-200 rounded-lg shrink-0" />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-stone-200 rounded" />
                    <div className="h-4 w-32 bg-stone-200 rounded" />
                  </div>
                  <div className="w-full h-2.5 bg-stone-200 rounded-full" />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                      <div className="h-3 w-20 bg-stone-200 rounded" />
                      <div className="h-5 w-28 bg-stone-200 rounded" />
                    </div>
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                      <div className="h-3 w-16 bg-stone-200 rounded" />
                      <div className="h-5 w-28 bg-stone-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-5 mt-8">
        <div className="w-8 h-8 bg-stone-200 rounded-full" />
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-stone-200 rounded-full" />
          <div className="w-2.5 h-2.5 bg-stone-200 rounded-full" />
          <div className="w-7 h-2.5 bg-stone-200 rounded-full" />
          <div className="w-2.5 h-2.5 bg-stone-200 rounded-full" />
        </div>
        <div className="w-8 h-8 bg-stone-200 rounded-full" />
      </div>
    </div>
  );
}
