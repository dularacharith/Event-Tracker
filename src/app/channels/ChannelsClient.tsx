"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Plus,
  Layers,
  X,
  Search,
  Trash2,
  ExternalLink,
  Share2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useToast, setPendingToast } from "@/components/Toast";

interface ChannelItem {
  id: string;
  name: string;
  platform?: string | null;
  description?: string | null;
  createdAt: Date | string;
  activityCount: number;
}

interface ChannelsClientProps {
  currentUser: any;
  userRole: "admin" | "member";
  initialChannels: ChannelItem[];
}

const PLATFORM_META: Record<
  string,
  { label: string; badge: string; border: string; bg: string; dot: string }
> = {
  twitter: {
    label: "Twitter / X",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-sky-200",
    bg: "bg-sky-50/40",
    dot: "bg-sky-500",
  },
  instagram: {
    label: "Instagram",
    badge: "bg-pink-100 text-pink-800 border-pink-200",
    border: "border-pink-200",
    bg: "bg-pink-50/40",
    dot: "bg-pink-500",
  },
  linkedin: {
    label: "LinkedIn",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    border: "border-blue-200",
    bg: "bg-blue-50/40",
    dot: "bg-blue-600",
  },
  tiktok: {
    label: "TikTok",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    border: "border-cyan-200",
    bg: "bg-cyan-50/40",
    dot: "bg-cyan-500",
  },
  youtube: {
    label: "YouTube",
    badge: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-200",
    bg: "bg-red-50/40",
    dot: "bg-red-500",
  },
  facebook: {
    label: "Facebook",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    border: "border-indigo-200",
    bg: "bg-indigo-50/40",
    dot: "bg-indigo-600",
  },
  threads: {
    label: "Threads",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    border: "border-slate-200",
    bg: "bg-slate-50/40",
    dot: "bg-slate-700",
  },
};

const ALL_PLATFORMS = [
  { id: "twitter", label: "Twitter / X" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "threads", label: "Threads" },
  { id: "other", label: "Other / General" },
];

export function ChannelsClient({
  currentUser,
  userRole,
  initialChannels,
}: ChannelsClientProps) {
  const { toast } = useToast();
  const [channelsList, setChannelsList] = useState<ChannelItem[]>(initialChannels);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("twitter");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredChannels = channelsList.filter((ch) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        ch.name.toLowerCase().includes(q) ||
        (ch.description && ch.description.toLowerCase().includes(q)) ||
        (ch.platform && ch.platform.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterPlatform && ch.platform !== filterPlatform) return false;
    return true;
  });

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Channel name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().replace(/^#/, ""),
          platform,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create channel");

      setPendingToast({
        type: "success",
        title: "Channel created!",
        message: `#${data.channel.name} has been added successfully.`,
      });
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to create channel", err.message);
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (id: string, channelName: string) => {
    if (!confirm(`Are you sure you want to delete channel "#${channelName}"? Activities linked to this channel will remain safe.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/channels/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete channel");

      toast.success("Channel deleted", `#${channelName} has been removed.`);
      setChannelsList((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete channel", err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformMeta = (p?: string | null) => {
    const key = (p || "other").toLowerCase();
    return (
      PLATFORM_META[key] || {
        label: p || "General",
        badge: "bg-purple-100 text-purple-800 border-purple-200",
        border: "border-purple-200",
        bg: "bg-purple-50/40",
        dot: "bg-purple-500",
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Channels</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create and organize publishing channels across Twitter / X, Instagram, LinkedIn, TikTok, YouTube, Facebook, and Threads
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setName("");
            setDescription("");
            setPlatform("twitter");
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Channel
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search channels by name, handle, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredChannels.length}</span> of{" "}
            {channelsList.length} channels
          </div>
        </div>

        {/* Platform Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1 shrink-0">
            Platforms:
          </span>
          <button
            onClick={() => setFilterPlatform("")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs whitespace-nowrap shrink-0 ${
              !filterPlatform
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Platforms ({channelsList.length})
          </button>
          {ALL_PLATFORMS.map((p) => {
            const count = channelsList.filter(
              (c) => (c.platform || "other").toLowerCase() === p.id
            ).length;
            if (count === 0 && filterPlatform !== p.id) return null;
            return (
              <button
                key={p.id}
                onClick={() =>
                  setFilterPlatform(filterPlatform === p.id ? "" : p.id)
                }
                className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  filterPlatform === p.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChannels.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Radio className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">
              {channelsList.length === 0 ? "No channels created yet" : "No matching channels"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {channelsList.length === 0
                ? "Create channels for your Twitter/X, Instagram, TikTok, LinkedIn, YouTube, and Facebook accounts to organize your social campaigns and deliverables."
                : "Try adjusting your search terms or platform filter."}
            </p>
            {channelsList.length === 0 && (
              <button
                onClick={() => {
                  setError(null);
                  setName("");
                  setDescription("");
                  setModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Channel
              </button>
            )}
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const meta = getPlatformMeta(ch.platform);
            const isDeleting = deletingId === ch.id;

            return (
              <div
                key={ch.id}
                className={`bg-white rounded-2xl border ${meta.border} p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-4`}
              >
                <div>
                  {/* Card Header: Platform Tag + Delete button */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${meta.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>

                    <button
                      onClick={() => handleDeleteChannel(ch.id, ch.name)}
                      disabled={isDeleting}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                      title={`Delete #${ch.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Channel Name */}
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-1 mb-1">
                    <span className="text-slate-400 font-normal">#</span>
                    <span>{ch.name}</span>
                  </h3>

                  {/* Channel Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {ch.description || "No specific description provided."}
                  </p>
                </div>

                {/* Card Footer: Activity Count + Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {ch.activityCount} {Number(ch.activityCount) === 1 ? "activity" : "activities"}
                    </span>
                  </div>

                  <Link
                    href={`/activities?channel=${ch.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <span>View Activities</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Channel Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Create New Channel
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateChannel} className="space-y-4">
              {/* Social Media Platform */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Social Media Platform *
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="threads">Threads</option>
                  <option value="other">Other / General</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select the social network or platform this channel represents
                </span>
              </div>

              {/* Channel Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Channel Name / Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. main-brand-x, tiktok-growth, dev-updates"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identifier used when tagging and filtering campaign deliverables
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <textarea
                  placeholder="Purpose, target audience, posting guidelines, handle info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creating..." : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
