"use client";

import React, { useState } from "react";
import { UserCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function DevAccountSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only render in non-production environments
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const switchAccount = async (email: string, name: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/dev/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-72 text-sm text-slate-800">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">
              Dev Account Switcher
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Quickly switch between accounts to test the multi-person review workflow:
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => switchAccount("admin@company.com", "Admin Alice")}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition flex items-center justify-between"
            >
              <span>Admin (admin@company.com)</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Admin</span>
            </button>
            <button
              onClick={() => switchAccount("alice@company.com", "Teammate Alice")}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 transition flex items-center justify-between"
            >
              <span>Teammate Alice (alice@company.com)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Member</span>
            </button>
            <button
              onClick={() => switchAccount("bob@company.com", "Teammate Bob")}
              disabled={loading}
              className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-sky-50 hover:text-sky-700 rounded-lg border border-slate-200 transition flex items-center justify-between"
            >
              <span>Teammate Bob (bob@company.com)</span>
              <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">Member</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition"
        >
          <UserCheck className="w-4 h-4" /> Switch Test User
        </button>
      )}
    </div>
  );
}
