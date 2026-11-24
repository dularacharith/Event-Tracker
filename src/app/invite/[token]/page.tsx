import React from "react";
import { getInviteStatus } from "@/lib/services/team";
import { getCurrentAuth } from "@/lib/session";
import { InviteAcceptClient } from "./InviteAcceptClient";
import { ShieldX, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inviteStatus = await getInviteStatus(token);
  const authContext = await getCurrentAuth();

  if (inviteStatus.status === "not_found") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <ShieldX className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite Link</h1>
          <p className="text-sm text-slate-600 mb-6">
            This invite link is invalid or does not exist. Please ask your administrator for a new invite.
          </p>
          <Link
            href="/login"
            className="inline-block bg-slate-900 text-white font-medium text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (inviteStatus.status === "revoked") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <ShieldX className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invite Revoked</h1>
          <p className="text-sm text-slate-600 mb-6">
            This invite link has been revoked by an administrator and can no longer be used.
          </p>
          <Link
            href="/login"
            className="inline-block bg-slate-900 text-white font-medium text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (inviteStatus.status === "already_used") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invite Already Used</h1>
          <p className="text-sm text-slate-600 mb-6">
            This single-use invite has already been accepted. If you are a member, please sign in.
          </p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
          >
            Sign In to CampaignFlow
          </Link>
        </div>
      </div>
    );
  }

  if (inviteStatus.status === "expired") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invite Expired</h1>
          <p className="text-sm text-slate-600 mb-6">
            This invite link has expired. Please contact your workspace administrator to receive a fresh invite.
          </p>
          <Link
            href="/login"
            className="inline-block bg-slate-900 text-white font-medium text-xs px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const invite = inviteStatus.invite!;

  return (
    <InviteAcceptClient
      token={token}
      inviteEmail={invite.email}
      inviteRole={invite.role}
      currentUser={authContext?.user || null}
    />
  );
}
