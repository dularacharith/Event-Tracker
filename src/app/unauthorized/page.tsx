"use client";

import React from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    document.cookie = "cf_dev_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Workspace Access Required
        </h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          CampaignFlow is a private, invite-only workspace for our team. Signing in with Google alone does not grant access without an active invite or membership.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 text-left mb-6 space-y-1.5 border border-slate-100">
          <p className="font-semibold text-slate-800">What should you do?</p>
          <p>• If you were invited, make sure to open the exact single-use invite link sent by your administrator.</p>
          <p>• Make sure you sign in with the specific Google email address where the invite was sent.</p>
          <p>• Contact your workspace administrator to request an invite link.</p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm transition"
        >
          <LogOut className="w-4 h-4" /> Sign In with Different Account
        </button>
      </div>
    </div>
  );
}
