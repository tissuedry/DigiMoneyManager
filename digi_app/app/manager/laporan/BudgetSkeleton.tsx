"use client";

export default function BudgetSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-3xl shadow-sm p-6 sm:p-7">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-12 h-12 rounded-2xl bg-stone-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-2.5">
                  <div className="h-5 w-56 bg-stone-200 rounded-lg" />
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-20 bg-stone-200 rounded-full" />
                    <div className="h-3.5 w-28 bg-stone-200 rounded" />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-32 bg-stone-200 rounded" />
                  <div className="h-5 w-36 bg-stone-200 rounded" />
                </div>
                <div className="w-full h-3 sm:h-3.5 bg-stone-200 rounded-full" />
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-4.5 space-y-2.5">
                    <div className="h-3.5 w-28 bg-stone-200 rounded" />
                    <div className="h-6 w-32 bg-stone-200 rounded" />
                  </div>
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-4.5 space-y-2.5">
                    <div className="h-3.5 w-28 bg-stone-200 rounded" />
                    <div className="h-6 w-32 bg-stone-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
