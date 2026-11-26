"use client";

import React, { useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  ShieldX,
  UserMinus,
  Mail,
  Clock,
  X,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useToast, setPendingToast } from "@/components/Toast";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface TeamClientProps {
  currentUser: {
    id: string;
    email: string;
  };
  userRole: "admin" | "member";
  initialMembers: any[];
  initialInvites: any[];
}

export function TeamClient({
  currentUser,
  userRole,
  initialMembers,
  initialInvites,
}: TeamClientProps) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          expiresInDays: Number(expiresInDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invite");
      setGeneratedLink(data.invite.inviteLink);
      toast.success(
        "Invite created!",
        `Single-use invitation link ready for ${inviteEmail}`
      );
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to create invite", err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Copied to clipboard!", "Invite link copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    const ok = await confirm({
      title: "Are you sure you want to revoke this invite?",
      description: "The invitation link will be invalidated immediately.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/team/invites/${inviteId}/revoke`, {
        method: "POST",
      });
      if (res.ok) {
        setPendingToast({
          type: "success",
          title: "Invite revoked",
          message: "The invitation link has been revoked.",
        });
        window.location.reload();
      } else {
        const d = await res.json();
        toast.error("Failed to revoke invite", d.error);
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const ok = await confirm({
      title: `Are you sure you want to remove ${memberName}?`,
      description: "This teammate will lose access to the workspace immediately.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/team/members/${memberId}/remove`, {
        method: "POST",
      });
      if (res.ok) {
        setPendingToast({
          type: "success",
          title: "Teammate removed",
          message: `${memberName} was removed from the workspace.`,
        });
        window.location.reload();
      } else {
        const d = await res.json();
        toast.error("Failed to remove teammate", d.error);
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Teammates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your shared workspace members, roles, and single-use invites
          </p>
        </div>

        {userRole === "admin" && (
          <button
            onClick={() => {
              setError(null);
              setGeneratedLink(null);
              setInviteEmail("");
              setInviteModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" /> Invite Teammate
          </button>
        )}
      </div>

      {/* Active Teammates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Active Teammates ({initialMembers.filter((m) => m.status === "active").length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {initialMembers.map((m) => {
            const isSelf = m.userId === currentUser.id;
            const isActive = m.status === "active";
            return (
              <div
                key={m.memberId}
                className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={m.name}
                    displayName={m.displayName}
                    avatarUrl={m.avatarUrl}
                    image={m.image}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {m.displayName || m.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          m.role === "admin"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {m.role}
                      </span>
                      {!isActive && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>{m.email}</span>
                      {m.jobTitle && (
                        <span className="text-indigo-600 font-medium">
                          • {m.jobTitle}
                        </span>
                      )}
                      <span>• Timezone: {m.timezone || "UTC"}</span>
                    </div>
                  </div>
                </div>

                {userRole === "admin" && !isSelf && isActive && (
                  <button
                    onClick={() =>
                      handleRemoveMember(m.memberId, m.displayName || m.name)
                    }
                    className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition flex items-center gap-1 self-start sm:self-center"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Deactivate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invites (Admin Only) */}
      {userRole === "admin" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              Pending & Past Invites ({initialInvites.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each invite expires, is single-use, revocable, and only works for the intended verified Google email.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {initialInvites.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">
                No invites have been created yet.
              </p>
            ) : (
              initialInvites.map((inv) => {
                const isAccepted = !!inv.acceptedAt;
                const isRevoked = !!inv.revokedAt;
                const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
                const isPending = !isAccepted && !isRevoked && !isExpired;

                const origin =
                  typeof window !== "undefined" ? window.location.origin : "";
                const inviteLink = `${origin}/invite/${inv.token}`;

                return (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800">
                          {inv.email}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {inv.role}
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Accepted
                          </span>
                        )}
                        {isRevoked && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            Revoked
                          </span>
                        )}
                        {isExpired && !isAccepted && !isRevoked && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Expired
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()} • Invited by{" "}
                        {inv.invitedBy?.displayName || inv.invitedBy?.name}
                      </p>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(inviteLink)}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Link
                        </button>
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Invite Teammate Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full flex flex-col max-h-[82vh] text-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            {/* Static / Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <h3 className="font-bold text-base text-slate-900">
                Invite New Teammate
              </h3>
              <button
                type="button"
                onClick={() => {
                  setInviteModalOpen(false);
                  if (generatedLink) window.location.reload();
                }}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                    {error}
                  </div>
                )}

            {generatedLink ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Single-use invite created for {inviteEmail}!</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Copy and share this invite link manually:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedLink)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p>• Link expires in {expiresInDays} days and is single-use.</p>
                  <p>• Only {inviteEmail} can accept it upon signing in with Google.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInviteModalOpen(false);
                    window.location.reload();
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teammate Google Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    The user must sign in using this exact verified email.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Workspace Role
                    </label>
                    <CustomDropdown
                      value={inviteRole}
                      onChange={(v) => setInviteRole(v as any)}
                      options={[
                        { value: "member", label: "Member", icon: <Users className="w-3.5 h-3.5" /> },
                        { value: "admin", label: "Admin", icon: <Shield className="w-3.5 h-3.5" /> },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expires In
                    </label>
                    <CustomDropdown
                      value={expiresInDays}
                      onChange={setExpiresInDays}
                      options={[
                        { value: "1", label: "24 hours", icon: <Clock className="w-3.5 h-3.5" /> },
                        { value: "3", label: "3 days", icon: <Clock className="w-3.5 h-3.5" /> },
                        { value: "7", label: "7 days", icon: <Clock className="w-3.5 h-3.5" /> },
                        { value: "14", label: "14 days", icon: <Clock className="w-3.5 h-3.5" /> },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 shrink-0 bg-slate-50/80 -mx-6 -mb-6 mt-4">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? "Generating Link..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
