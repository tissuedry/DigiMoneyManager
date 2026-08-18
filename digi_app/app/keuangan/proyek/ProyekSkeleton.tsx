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

      {/* Summary Card Skeleton */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-stone-200 rounded-lg" />
            <div className="h-4 w-36 bg-stone-100 rounded-lg" />
          </div>
          <div className="h-10 w-44 bg-stone-100 rounded-xl" />
        </div>
        <div className="h-6 w-full bg-stone-100 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="h-20 bg-stone-50 border border-stone-100 rounded-xl" />
          <div className="h-20 bg-stone-50 border border-stone-100 rounded-xl" />
        </div>
      </div>

      {/* Main 2-column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="h-5 w-48 bg-stone-200 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-8 w-32 bg-stone-100 rounded-lg" />
              <div className="h-8 w-28 bg-stone-200 rounded-lg" />
            </div>
          </div>
          <div className="h-4 w-full bg-stone-100 rounded-full" />
          <div className="space-y-3 pt-2">
            <div className="h-16 bg-stone-50 rounded-xl" />
            <div className="h-16 bg-stone-50 rounded-xl" />
            <div className="h-16 bg-stone-50 rounded-xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="h-5 w-44 bg-stone-200 rounded-lg pb-3 border-b border-stone-100" />
            <div className="space-y-2.5">
              <div className="h-12 bg-stone-50 rounded-xl" />
              <div className="h-12 bg-stone-50 rounded-xl" />
              <div className="h-12 bg-stone-50 rounded-xl" />
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="h-5 w-36 bg-stone-200 rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-emerald-50 rounded-xl" />
              <div className="h-16 bg-amber-50 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
