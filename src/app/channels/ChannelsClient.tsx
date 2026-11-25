"use client";

import React, { useState, useMemo, useTransition } from "react";
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
  Globe,
  Loader2,
} from "lucide-react";
import { useToast, setPendingToast } from "@/components/Toast";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useConfirm } from "@/components/ui/ConfirmModal";

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
  { id: "youtube", label: "YouTube", icon: "YT", badgeBg: "bg-red-50 text-red-700 border-red-200" },
  { id: "twitter", label: "Twitter / X", icon: "𝕏", badgeBg: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "instagram", label: "Instagram", icon: "IG", badgeBg: "bg-pink-50 text-pink-700 border-pink-200" },
  { id: "tiktok", label: "TikTok", icon: "TT", badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "linkedin", label: "LinkedIn", icon: "in", badgeBg: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "facebook", label: "Facebook", icon: "fb", badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "threads", label: "Threads", icon: "@", badgeBg: "bg-slate-100 text-slate-800 border-slate-200" },
  { id: "other", label: "Other / General", icon: "#", badgeBg: "bg-purple-50 text-purple-700 border-purple-200" },
];

export function ChannelsClient({
  currentUser,
  userRole,
  initialChannels,
}: ChannelsClientProps) {
  const { toast } = useToast();
  const confirm = useConfirm();
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
  const [isTabPending, startTabTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<string | null>(null);

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

  const groupedChannels = useMemo(() => {
    const map = new Map<string, ChannelItem[]>();
    filteredChannels.forEach((ch) => {
      const p = (ch.platform || "other").toLowerCase();
      if (!map.has(p)) {
        map.set(p, []);
      }
      map.get(p)!.push(ch);
    });
    return map;
  }, [filteredChannels]);

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
    const ok = await confirm({
      title: `Are you sure you want to delete channel "#${channelName}"?`,
      description: "Activities linked to this channel will remain safe.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

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
            onClick={() => {
              setPendingTab("all");
              startTabTransition(() => setFilterPlatform(""));
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
              !filterPlatform
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {isTabPending && pendingTab === "all" && (
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            )}
            <span>All Platforms ({channelsList.length})</span>
          </button>
          {ALL_PLATFORMS.map((p) => {
            const count = channelsList.filter(
              (c) => (c.platform || "other").toLowerCase() === p.id
            ).length;
            if (count === 0 && filterPlatform !== p.id) return null;
            const isThisPending = isTabPending && pendingTab === p.id;

            return (
              <button
                key={p.id}
                onClick={() => {
                  setPendingTab(p.id);
                  startTabTransition(() =>
                    setFilterPlatform(filterPlatform === p.id ? "" : p.id)
                  );
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  filterPlatform === p.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isThisPending && (
                  <Loader2 className="w-3 h-3 animate-spin text-purple-200" />
                )}
                <span>{p.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channels Grouped by Platform */}
      {filteredChannels.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
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
        <div key={filterPlatform || "all"} className="space-y-6 animate-tab-slide-right">
          {ALL_PLATFORMS.map((platformDef) => {
            const groupChannels = groupedChannels.get(platformDef.id);
            if (!groupChannels || groupChannels.length === 0) return null;

            return (
              <div
                key={platformDef.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5"
              >
                {/* Platform Group Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border ${platformDef.badgeBg}`}
                    >
                      {platformDef.icon}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        {platformDef.label}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {groupChannels.length} {groupChannels.length === 1 ? "channel" : "channels"}
                        </span>
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setError(null);
                      setName("");
                      setDescription("");
                      setPlatform(platformDef.id === "other" ? "twitter" : platformDef.id);
                      setModalOpen(true);
                    }}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition p-1 hover:bg-purple-50 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Channel
                  </button>
                </div>

                {/* Compact Channel Cards Grid (Reduced Card Size) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {groupChannels.map((ch) => {
                    const isDeleting = deletingId === ch.id;
                    const countNum = Number(ch.activityCount) || 0;
                    const hasActivities = countNum > 0;

                    return (
                      <div
                        key={ch.id}
                        className="bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/90 hover:border-purple-300 p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          {/* Card Header: Channel Name + Delete button */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1 truncate">
                              <span className="text-slate-400 font-normal">#</span>
                              <span className="truncate">{ch.name}</span>
                            </h3>

                            <button
                              onClick={() => handleDeleteChannel(ch.id, ch.name)}
                              disabled={isDeleting}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition hover:bg-rose-50 cursor-pointer disabled:opacity-50 shrink-0"
                              title={`Delete #${ch.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Channel Description */}
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {ch.description || "No specific description provided."}
                          </p>
                        </div>

                        {/* Card Footer: Activity Count + Show Activities Button (Disabled when 0 activities) */}
                        <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>
                              {countNum} {countNum === 1 ? "activity" : "activities"}
                            </span>
                          </div>

                          {hasActivities ? (
                            <Link
                              href={`/activities?channel=${ch.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition"
                            >
                              <span>View Activities</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="No activities belong to this channel yet"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 cursor-not-allowed select-none"
                            >
                              <span>View Activities</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-300" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <CustomDropdown
                  value={platform}
                  onChange={setPlatform}
                  options={[
                    { value: "twitter", label: "Twitter / X", subtitle: "Microblogging & announcements", icon: <span className="font-bold text-xs">𝕏</span> },
                    { value: "instagram", label: "Instagram", subtitle: "Reels, Posts & Stories", icon: <span className="text-pink-600 font-bold text-xs">IG</span> },
                    { value: "tiktok", label: "TikTok", subtitle: "Short-form video", icon: <span className="text-cyan-600 font-bold text-xs">TT</span> },
                    { value: "linkedin", label: "LinkedIn", subtitle: "Professional network", icon: <span className="text-blue-600 font-bold text-xs">in</span> },
                    { value: "youtube", label: "YouTube", subtitle: "Long-form & Shorts", icon: <span className="text-red-600 font-bold text-xs">YT</span> },
                    { value: "facebook", label: "Facebook", subtitle: "Community & Pages", icon: <span className="text-blue-700 font-bold text-xs">fb</span> },
                    { value: "threads", label: "Threads", subtitle: "Text conversations", icon: <span className="font-bold text-xs">@</span> },
                    { value: "other", label: "Other / General", subtitle: "Blog, newsletter, etc.", icon: <Globe className="w-3.5 h-3.5 text-slate-600" /> },
                  ]}
                />
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
