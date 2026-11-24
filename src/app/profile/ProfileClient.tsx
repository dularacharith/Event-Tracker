"use client";

import React, { useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { Upload, CheckCircle, AlertCircle, Save } from "lucide-react";

interface ProfileClientProps {
  currentUser: {
    id: string;
    email: string;
    name?: string | null;
    displayName?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    timezone?: string;
  };
  userRole: "admin" | "member";
}

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Colombo",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function ProfileClient({
  currentUser,
  userRole,
}: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(
    currentUser.displayName || currentUser.name || ""
  );
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || "");
  const [timezone, setTimezone] = useState(currentUser.timezone || "UTC");
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatarUrl || currentUser.image || ""
  );

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "avatar");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload avatar");

      setAvatarUrl(data.file.url);
      setMessage({ type: "success", text: "Avatar uploaded! Click 'Save Changes' to update your profile." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          jobTitle,
          timezone,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Your profile is visible on activity assignments, comments, and review history
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <UserAvatar
              displayName={displayName}
              avatarUrl={avatarUrl}
              size="xl"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profile Avatar (PNG, JPEG, WebP, max 3 MB)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFile}
                disabled={uploadingAvatar}
                className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {uploadingAvatar
                  ? "Validating & storing privately..."
                  : "Private Vercel Blob storage served only to authenticated workspace members."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email (Google Verified)
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Title (Display Only)
              </label>
              <input
                type="text"
                placeholder="e.g. Social Media Strategist, Video Editor"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Note: Job title is cosmetic and does not grant permissions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Used to render calendar due dates and review deadlines.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Workspace Role:{" "}
              <span className="font-semibold capitalize text-indigo-700">
                {userRole}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
