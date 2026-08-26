import React from "react";

export default function ProyekSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 rounded-lg" />
          <div className="h-4 w-72 bg-stone-200 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-stone-200 rounded-xl" />
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-44 bg-stone-200 rounded-md" />
            <div className="h-5 w-16 bg-stone-200 rounded-full" />
            <div className="h-4 w-28 bg-stone-200 rounded-md" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-28 bg-stone-200 rounded ml-auto" />
            <div className="h-7 w-40 bg-stone-200 rounded-md ml-auto" />
          </div>
        </div>

        <div className="w-full bg-stone-200 h-6 rounded-full" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-300" />
              <div className="h-3 w-20 bg-stone-200 rounded" />
            </div>
            <div className="h-6 w-36 bg-stone-200 rounded ml-5" />
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-300" />
              <div className="h-3 w-16 bg-stone-200 rounded" />
            </div>
            <div className="h-6 w-36 bg-stone-200 rounded ml-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="h-5 w-44 bg-stone-200 rounded-md" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-36 bg-stone-200 rounded-lg" />
              <div className="h-8 w-24 bg-stone-200 rounded-lg" />
              <div className="h-8 w-28 bg-stone-200 rounded-lg" />
            </div>
          </div>

          <div className="w-full bg-stone-200 h-4 rounded-full" />

          <div className="flex flex-wrap gap-4 py-1">
            <div className="h-4 w-28 bg-stone-200 rounded" />
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="h-4 w-24 bg-stone-200 rounded" />
          </div>

          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-stone-200 rounded" />
                  <div className="h-4 w-40 bg-stone-200 rounded" />
                </div>
                <div className="h-2.5 w-full bg-stone-200 rounded-full" />
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-stone-200 rounded" />
                  <div className="h-3 w-24 bg-stone-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="h-5 w-32 bg-stone-200 rounded-md border-b border-stone-100 pb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-full bg-stone-100 rounded-xl" />
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <div className="h-8 w-32 bg-stone-200 rounded-lg" />
              <div className="h-8 w-32 bg-stone-200 rounded-lg" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="h-5 w-36 bg-stone-200 rounded-md border-b border-stone-100 pb-3" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="h-3 w-28 bg-stone-200 rounded" />
                <div className="h-6 w-24 bg-stone-200 rounded" />
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="h-3 w-28 bg-stone-200 rounded" />
                <div className="h-6 w-24 bg-stone-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
