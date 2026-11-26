import React from "react";

export default function Loading() {
  return (
    <div className="w-full flex-1 flex flex-col space-y-5 animate-page-slide filter blur-[2px] opacity-80 pointer-events-none transition-all duration-300">
      {/* Skeleton Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-slate-100/90 rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-9 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-1 flex-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/70 border border-slate-200/60 p-4 space-y-3 backdrop-blur-xs shadow-2xs animate-pulse"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="h-4 w-20 bg-slate-200/80 rounded-md" />
              <div className="h-4 w-6 bg-slate-100 rounded-full" />
            </div>
            <div className="h-24 w-full bg-slate-100/80 rounded-xl" />
            <div className="h-20 w-full bg-slate-100/60 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
