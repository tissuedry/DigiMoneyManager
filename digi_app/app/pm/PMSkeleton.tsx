import React from "react";

export default function PMSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-64 bg-stone-200 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-stone-200 rounded-md" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4 min-h-[120px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-stone-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-stone-200" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-36 bg-stone-200 rounded-md" />
              <div className="h-3 w-40 bg-stone-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Budget Progress Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-44 bg-stone-200 rounded-md" />
            <div className="h-3 w-64 bg-stone-200 rounded" />
          </div>
          <div className="h-6 w-16 bg-stone-200 rounded-lg" />
        </div>

        <div className="w-full bg-stone-200 h-5 rounded-full" />

        <div className="flex justify-between items-center">
          <div className="h-3 w-32 bg-stone-200 rounded" />
          <div className="h-3 w-32 bg-stone-200 rounded" />
        </div>
      </div>

      {/* Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Realisasi Pos Anggaran */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="space-y-1">
              <div className="h-4 w-40 bg-stone-200 rounded-md" />
              <div className="h-3 w-48 bg-stone-200 rounded" />
            </div>
            <div className="h-4 w-24 bg-stone-200 rounded" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-stone-200 rounded" />
                  <div className="h-4 w-36 bg-stone-200 rounded" />
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

        {/* Right: Quick actions & Alerts */}
        <div className="space-y-6 lg:col-span-5">
          {/* Validation Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="h-4 w-40 bg-stone-200 rounded-md border-b border-stone-100 pb-3" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-stone-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-stone-200 rounded" />
                <div className="h-3 w-48 bg-stone-200 rounded" />
              </div>
            </div>
            <div className="w-full h-9 bg-stone-200 rounded-xl" />
          </div>

          {/* Notifications Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="h-4 w-36 bg-stone-200 rounded-md" />
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 bg-stone-300 rounded-full mt-1.5 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-full bg-stone-200 rounded" />
                    <div className="h-2.5 w-16 bg-stone-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
