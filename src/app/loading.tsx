import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-150">
      <div className="bg-white/95 backdrop-blur-xs border border-purple-100 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
        <span className="text-xs font-semibold text-slate-700 tracking-tight">
          Loading content...
        </span>
      </div>
    </div>
  );
}
