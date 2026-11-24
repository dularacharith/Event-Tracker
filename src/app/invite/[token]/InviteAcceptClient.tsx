"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "@/lib/auth-client";
import { Mail, CheckCircle, AlertTriangle, ArrowRight, LogOut } from "lucide-react";

interface InviteAcceptClientProps {
  token: string;
  inviteEmail: string;
  inviteRole: string;
  currentUser: {
    id: string;
    email: string;
    name?: string | null;
    displayName?: string | null;
  } | null;
}

export function InviteAcceptClient({
  token,
  inviteEmail,
  inviteRole,
  currentUser,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedUserEmail = (currentUser?.email || "").trim().toLowerCase();
  const normalizedInviteEmail = inviteEmail.trim().toLowerCase();
  const isEmailMatch = currentUser && normalizedUserEmail === normalizedInviteEmail;

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/team/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invite");
      }
      router.push("/my-work");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: `/invite/${token}`,
      });
    } catch (err: any) {
      alert("Sign in error: " + err.message);
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      await signOut();
    } catch {}
    document.cookie = "cf_dev_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push(`/login`);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          Workspace Invitation
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          You have been invited to join the CampaignFlow workspace as a{" "}
          <span className="font-semibold capitalize text-indigo-600">{inviteRole}</span>.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 text-left mb-6 border border-slate-100 space-y-1">
          <p className="text-slate-500">Invited Email Address:</p>
          <p className="font-semibold text-slate-900 text-sm">{inviteEmail}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-left">
            {error}
          </div>
        )}

        {!currentUser ? (
          <div>
            <p className="text-xs text-slate-500 mb-4">
              Please sign in with Google using <span className="font-semibold">{inviteEmail}</span> to accept this invitation.
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition"
            >
              Sign In to Accept Invite <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : isEmailMatch ? (
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Signed in as {currentUser.email}. Ready to accept!</span>
            </div>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-sm"
            >
              {loading ? "Joining..." : "Accept & Join Workspace"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl mb-4 text-left border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Email Mismatch</p>
                <p className="mt-0.5">
                  This invite was issued for <span className="font-semibold">{inviteEmail}</span>, but you are currently signed in as <span className="font-semibold">{currentUser.email}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2.5 px-4 rounded-xl text-sm transition"
            >
              <LogOut className="w-4 h-4" /> Switch Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
