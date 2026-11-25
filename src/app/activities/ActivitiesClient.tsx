"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  List,
  Kanban,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast, setPendingToast } from "@/components/Toast";

interface ActivityItem {
  id: string;
  campaignId: string;
  campaignName?: string | null;
  title: string;
  brief: string;
  socialPlatform: string;
  contentType: string;
  scheduledAt?: Date | string | null;
  reviewDeadline?: Date | string | null;
  ownerId?: string | null;
  reviewerId?: string | null;
  status: string;
  passCriteria: string;
  createdAt: Date | string;
  owner?: {
    id: string;
    name?: string | null;
    displayName?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface ActivitiesClientProps {
  currentUser: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    timezone?: string;
  };
  userRole: "admin" | "member";
  initialActivities: ActivityItem[];
  campaigns: any[];
  teammates: any[];
  initialOpenCreate?: boolean;
}

const STATUS_COLUMNS = [
  {
    id: "draft",
    step: "1",
    label: "Draft",
    bg: "bg-slate-50/80",
    border: "border-slate-200",
    badgeBg: "bg-slate-200 text-slate-700",
    headerText: "text-slate-800",
  },
  {
    id: "scheduled",
    step: "2",
    label: "Scheduled",
    bg: "bg-blue-50/40",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    headerText: "text-blue-900",
  },
  {
    id: "in_progress",
    step: "3",
    label: "In Progress",
    bg: "bg-amber-50/40",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-700",
    headerText: "text-amber-900",
  },
  {
    id: "awaiting_review",
    step: "4",
    label: "Awaiting Review",
    bg: "bg-purple-50/40",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    headerText: "text-purple-900",
  },
  {
    id: "passed",
    step: "5",
    label: "Passed",
    bg: "bg-emerald-50/40",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-700",
    headerText: "text-emerald-900",
  },
  {
    id: "failed",
    step: "6",
    label: "Failed",
    bg: "bg-rose-50/40",
    border: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-700",
    headerText: "text-rose-900",
  },
];

export function ActivitiesClient({
  currentUser,
  userRole,
  initialActivities,
  campaigns,
  teammates,
  initialOpenCreate = false,
}: ActivitiesClientProps) {
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [search, setSearch] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterReviewer, setFilterReviewer] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(initialOpenCreate);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create form state
  const [newCampaignId, setNewCampaignId] = useState(campaigns[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [newPlatform, setNewPlatform] = useState("twitter");
  const [newContentType, setNewContentType] = useState("post");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newReviewDeadline, setNewReviewDeadline] = useState("");
  const [newOwnerId, setNewOwnerId] = useState(currentUser.id);
  const [newReviewerId, setNewReviewerId] = useState("");
  const [newCriteria, setNewCriteria] = useState("");
  const [newStatus, setNewStatus] = useState<"draft" | "scheduled">("draft");

  // Filtering
  const filteredActivities = initialActivities.filter((act) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        act.title.toLowerCase().includes(q) ||
        act.brief.toLowerCase().includes(q) ||
        (act.campaignName && act.campaignName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterCampaign && act.campaignId !== filterCampaign) return false;
    if (filterPlatform && act.socialPlatform !== filterPlatform) return false;
    if (filterStatus && act.status !== filterStatus) return false;
    if (filterOwner && act.ownerId !== filterOwner) return false;
    if (filterReviewer && act.reviewerId !== filterReviewer) return false;
    return true;
  });

  const handleStartProgress = async (activityId: string) => {
    try {
      const res = await fetch(`/api/activities/${activityId}/start`, {
        method: "POST",
      });
      if (res.ok) {
        setPendingToast({
          type: "success",
          title: "Progress started",
          message: "Activity status set to In Progress.",
        });
        window.location.reload();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to start progress");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      if (!newCampaignId) throw new Error("Please select a campaign");

      const body: any = {
        campaignId: newCampaignId,
        title: newTitle,
        brief: newBrief,
        socialPlatform: newPlatform,
        contentType: newContentType,
        ownerId: newOwnerId,
        reviewerId: newReviewerId || null,
        passCriteria: newCriteria,
        initialStatus: newStatus,
      };

      if (newScheduledAt) body.scheduledAt = new Date(newScheduledAt).toISOString();
      if (newReviewDeadline) body.reviewDeadline = new Date(newReviewDeadline).toISOString();

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create activity");

      setPendingToast({
        type: "success",
        title: "Activity created!",
        message: `"${newTitle}" was created successfully.`,
      });
      window.location.reload();
    } catch (err: any) {
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-700" },
      scheduled: { label: "Scheduled", bg: "bg-blue-100", text: "text-blue-700" },
      in_progress: { label: "In Progress", bg: "bg-amber-100", text: "text-amber-700" },
      awaiting_review: { label: "Awaiting Review", bg: "bg-purple-100", text: "text-purple-700" },
      passed: { label: "Passed", bg: "bg-emerald-100", text: "text-emerald-700" },
      failed: { label: "Failed", bg: "bg-rose-100", text: "text-rose-700" },
    };
    const s = map[status] || { label: status, bg: "bg-slate-100", text: "text-slate-700" };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your social campaign pipeline, schedule deadlines, and review proof
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List vs Board Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "board" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> New Activity
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, brief, campaign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 flex-wrap">
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Platforms</option>
              <option value="twitter">Twitter / X</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="threads">Threads</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Owners</option>
              {teammates.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName || m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* View: Status Board (Linked Pipeline Flow & Kanban Columns) */}
      {viewMode === "board" ? (
        <div className="space-y-4">
          {/* Linked Pipeline Stepper Flow Bar */}
          <div className="hidden lg:block bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto">
              {STATUS_COLUMNS.map((col, idx) => {
                const count = filteredActivities.filter(
                  (a) => a.status === col.id
                ).length;
                return (
                  <React.Fragment key={col.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${col.badgeBg}`}
                      >
                        {col.step}
                      </span>
                      <span
                        className={`text-xs font-semibold ${col.headerText}`}
                      >
                        {col.label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    </div>
                    {idx < STATUS_COLUMNS.length - 1 && (
                      <div className="flex items-center px-1 text-slate-300">
                        {idx === 4 ? (
                          <span className="text-xs font-semibold text-slate-300">
                            or
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Linked Kanban Columns Track */}
          <div className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 px-1">
            {STATUS_COLUMNS.map((col, idx) => {
              const colActivities = filteredActivities.filter(
                (a) => a.status === col.id
              );
              return (
                <div
                  key={col.id}
                  className="relative flex-1 min-w-[260px] max-w-[320px] shrink-0"
                >
                  <div
                    className={`rounded-2xl border ${col.border} ${col.bg} p-3.5 flex flex-col gap-3 shadow-2xs hover:shadow-xs transition`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${col.badgeBg}`}
                        >
                          {col.step}
                        </span>
                        <span
                          className={`font-bold text-xs uppercase tracking-wider ${col.headerText}`}
                        >
                          {col.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                        {colActivities.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3 min-h-[300px]">
                      {colActivities.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200/90 rounded-xl bg-white/50">
                          No activities
                        </div>
                      ) : (
                        colActivities.map((act) => (
                          <div
                            key={act.id}
                            className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:shadow transition space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {act.socialPlatform}
                              </span>
                              <span className="text-[10px] text-slate-400 capitalize">
                                {act.contentType.replace("_", " ")}
                              </span>
                            </div>

                            <Link
                              href={`/activities/${act.id}`}
                              className="font-semibold text-xs text-slate-900 hover:text-indigo-600 transition block line-clamp-2"
                            >
                              {act.title}
                            </Link>

                            {act.campaignName && (
                              <p className="text-[10px] text-indigo-600 font-medium truncate">
                                {act.campaignName}
                              </p>
                            )}

                            <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-50">
                              {act.scheduledAt && (
                                <div className="flex items-center gap-1 truncate">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>
                                    {new Date(
                                      act.scheduledAt
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                              {act.reviewDeadline && (
                                <div className="flex items-center gap-1 text-slate-500 truncate">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>
                                    Review:{" "}
                                    {new Date(
                                      act.reviewDeadline
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Explicit Action Buttons */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                              {act.status === "scheduled" && (
                                <button
                                  onClick={() => handleStartProgress(act.id)}
                                  className="w-full flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                >
                                  <Play className="w-3 h-3" /> Start Work
                                </button>
                              )}

                              {act.status === "awaiting_review" &&
                                act.reviewerId === currentUser.id && (
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="w-full flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    Review <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}

                              {act.status === "failed" &&
                                (act.ownerId === currentUser.id ||
                                  userRole === "admin") && (
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="w-full flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Reschedule
                                  </Link>
                                )}

                              {act.status !== "scheduled" &&
                                !(
                                  act.status === "awaiting_review" &&
                                  act.reviewerId === currentUser.id
                                ) &&
                                !(
                                  act.status === "failed" &&
                                  (act.ownerId === currentUser.id ||
                                    userRole === "admin")
                                ) && (
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="w-full text-center text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-1 px-2 rounded-lg transition"
                                  >
                                    Details
                                  </Link>
                                )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Visual Link Connector between adjacent stages */}
                  {idx < STATUS_COLUMNS.length - 1 && (
                    <div
                      className="hidden xl:flex absolute -right-3 top-5 z-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-400 pointer-events-none"
                    >
                      {idx === 4 ? (
                        <span className="text-[9px] font-bold text-slate-400">
                          /
                        </span>
                      ) : (
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* View: Filterable List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No activities match your filters.
              </div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(act.status)}
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {act.socialPlatform}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {act.contentType.replace("_", " ")}
                      </span>
                      {act.campaignName && (
                        <span className="text-xs text-indigo-600 font-medium">
                          • {act.campaignName}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/activities/${act.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition block truncate"
                    >
                      {act.title}
                    </Link>

                    <p className="text-xs text-slate-500 line-clamp-1">{act.brief}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {act.status === "scheduled" && (
                      <button
                        onClick={() => handleStartProgress(act.id)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Work
                      </button>
                    )}

                    <Link
                      href={`/activities/${act.id}`}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Create Campaign Activity</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign *
                </label>
                <select
                  value={newCampaignId}
                  onChange={(e) => setNewCampaignId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Product Launch Reel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief *
                </label>
                <textarea
                  placeholder="Detailed instructions, hashtags, hook, call to action..."
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform *
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="threads">Threads</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Content Type *
                  </label>
                  <select
                    value={newContentType}
                    onChange={(e) => setNewContentType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="post">Post</option>
                    <option value="reel_video">Reel / Video</option>
                    <option value="story">Story</option>
                    <option value="thread">Thread</option>
                    <option value="carousel">Carousel</option>
                    <option value="article">Article</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner
                  </label>
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    disabled={userRole !== "admin"}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {teammates.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.displayName || m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newStatus === "scheduled" && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-800">
                    Scheduling Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Scheduled Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={newScheduledAt}
                        onChange={(e) => setNewScheduledAt(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={newStatus === "scheduled"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Review Deadline *
                      </label>
                      <input
                        type="datetime-local"
                        value={newReviewDeadline}
                        onChange={(e) => setNewReviewDeadline(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={newStatus === "scheduled"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Reviewer *
                    </label>
                    <select
                      value={newReviewerId}
                      onChange={(e) => setNewReviewerId(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={newStatus === "scheduled"}
                    >
                      <option value="">Select an eligible reviewer</option>
                      {teammates
                        .filter((m) => m.userId !== newOwnerId && m.userId !== currentUser.id)
                        .map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.displayName || m.name} ({m.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pass Criteria *
                    </label>
                    <textarea
                      placeholder="What standards must be met to mark Passed?"
                      value={newCriteria}
                      onChange={(e) => setNewCriteria(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={newStatus === "scheduled"}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
