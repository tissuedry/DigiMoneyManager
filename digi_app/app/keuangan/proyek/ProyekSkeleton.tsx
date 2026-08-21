import React from "react";

export default function ProyekSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 rounded-lg" />
          <div className="h-4 w-80 bg-stone-100 rounded-lg" />
        </div>
        <div className="h-10 w-64 bg-stone-200 rounded-xl" />
      </div>

      {/* Main Card Skeleton */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-6 w-56 bg-stone-200 rounded-lg" />
            <div className="h-5 w-16 bg-stone-100 rounded-full" />
            <div className="h-4 w-28 bg-stone-100 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-40 bg-stone-100 rounded-xl" />
            <div className="h-9 w-28 bg-stone-200 rounded-xl" />
            <div className="h-9 w-36 bg-stone-200 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="h-5 w-44 bg-stone-200 rounded-lg pb-3 border-b border-stone-100" />
            <div className="space-y-3">
              <div className="h-16 bg-stone-50 rounded-xl" />
              <div className="h-16 bg-stone-50 rounded-xl" />
              <div className="h-16 bg-stone-50 rounded-xl" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <div className="h-5 w-36 bg-stone-200 rounded-lg pb-3 border-b border-stone-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-emerald-50 rounded-xl" />
              <div className="h-20 bg-amber-50 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
