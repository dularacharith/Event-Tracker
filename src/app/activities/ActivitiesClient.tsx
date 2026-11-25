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
  ArrowLeftRight,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  Link2,
  Ban,
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
    label: "Completed",
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
  {
    id: "canceled",
    step: "↶",
    label: "Canceled",
    bg: "bg-zinc-100/70",
    border: "border-zinc-300",
    badgeBg: "bg-zinc-200 text-zinc-700",
    headerText: "text-zinc-800",
  },
];

const CHAIN_TRANSITIONS: Record<
  string,
  { label: string; targetStatus: string; color: string }[]
> = {
  draft: [
    { label: "Schedule", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Start Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  scheduled: [
    { label: "Start Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Submit Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Complete", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  in_progress: [
    { label: "Schedule", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Submit Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Complete", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  awaiting_review: [
    { label: "Pass / Complete", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "In Progress", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  failed: [
    { label: "Reschedule", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Retry Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Back to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  passed: [
    { label: "Reopen Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Back to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  canceled: [
    { label: "Restore to Draft", targetStatus: "draft", color: "text-indigo-700 bg-indigo-50 hover:bg-indigo-100" },
    { label: "Move to Scheduled", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
  ],
};

export function ActivitiesClient({
  currentUser,
  userRole,
  initialActivities,
  campaigns,
  teammates,
  initialOpenCreate = false,
}: ActivitiesClientProps) {
  const { toast } = useToast();
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

  const handleChainTransition = async (
    activityId: string,
    targetStatus: string
  ) => {
    try {
      const res = await fetch(`/api/activities/${activityId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setPendingToast({
        type: "success",
        title: "Activity moved!",
        message: `Activity transitioned along the chain to ${targetStatus.replace("_", " ")}.`,
      });
      window.location.reload();
    } catch (err: any) {
      toast.error("Transition failed", err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-700" },
      scheduled: { label: "Scheduled", bg: "bg-blue-100", text: "text-blue-700" },
      in_progress: { label: "In Progress", bg: "bg-amber-100", text: "text-amber-700" },
      awaiting_review: { label: "Awaiting Review", bg: "bg-purple-100", text: "text-purple-700" },
      passed: { label: "Completed", bg: "bg-emerald-100", text: "text-emerald-700" },
      failed: { label: "Failed", bg: "bg-rose-100", text: "text-rose-700" },
      canceled: { label: "Canceled", bg: "bg-zinc-100", text: "text-zinc-700" },
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
              <option value="passed">Completed</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
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
          {/* Interactive Mind Map & Linked Lifecycle Stepper */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                  <Link2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Activity Lifecycle Mind Map
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  — Scheduled and Canceled are two separate branches from Draft (not linked horizontally)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Filter stage:</span>
                {filterStatus ? (
                  <button
                    onClick={() => setFilterStatus("")}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]"
                  >
                    Showing {filterStatus.replace("_", " ")} <X className="w-2.5 h-2.5" />
                  </button>
                ) : (
                  <span className="font-semibold text-slate-700">All (click any box)</span>
                )}
              </div>
            </div>

            {/* Mind Map Canvas */}
            <div className="overflow-x-auto py-1">
              <div className="min-w-[860px] flex items-center justify-between gap-3 text-xs">
                {/* 1. DRAFT */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    onClick={() => setFilterStatus(filterStatus === "draft" ? "" : "draft")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "draft"
                        ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400"
                        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Draft</span>
                    <span className="bg-white text-slate-700 px-1.5 py-0.2 rounded-full text-[10px] border border-slate-200 font-bold">
                      {filteredActivities.filter((a) => a.status === "draft").length}
                    </span>
                  </button>
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">Initial state</span>
                </div>

                {/* DRAFT BRANCH CONNECTOR: Split from Draft into Scheduled (top), In Progress (middle direct), Canceled (bottom) */}
                <div className="flex flex-col justify-between items-center h-28 relative w-12 text-slate-300 shrink-0">
                  {/* Top branch line up to Scheduled */}
                  <div className="absolute top-4 left-0 w-6 h-10 border-t-2 border-l-2 border-slate-200 rounded-tl-xl" />
                  <ArrowRight className="absolute top-2 right-1.5 w-3.5 h-3.5 text-blue-400" />

                  {/* Middle direct dash line to In Progress */}
                  <div className="w-full border-t border-dashed border-slate-300 relative my-auto">
                    <ArrowRight className="absolute -top-1.5 right-1.5 w-3.5 h-3.5 text-amber-400" />
                  </div>

                  {/* Bottom branch line down to Canceled */}
                  <div className="absolute bottom-4 left-0 w-6 h-10 border-b-2 border-l-2 border-slate-200 rounded-bl-xl" />
                  <ArrowRight className="absolute bottom-2 right-1.5 w-3.5 h-3.5 text-zinc-400" />
                </div>

                {/* TWO SEPARATE BOXES (NOT LINKED HORIZONTALLY): Scheduled (top) & Canceled (bottom) */}
                <div className="flex flex-col justify-between h-28 py-0.5 shrink-0">
                  {/* SCHEDULED BOX */}
                  <button
                    onClick={() => setFilterStatus(filterStatus === "scheduled" ? "" : "scheduled")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "scheduled"
                        ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300"
                        : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Scheduled</span>
                    <span className="bg-white text-blue-800 px-1.5 py-0.2 rounded-full text-[10px] border border-blue-100 font-bold">
                      {filteredActivities.filter((a) => a.status === "scheduled").length}
                    </span>
                  </button>

                  {/* CANCELED BOX (SEPARATE BOX, NOT LINKED HORIZONTALLY TO SCHEDULED) */}
                  <button
                    onClick={() => setFilterStatus(filterStatus === "canceled" ? "" : "canceled")}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "canceled"
                        ? "bg-zinc-800 text-white border-zinc-800 ring-2 ring-zinc-400"
                        : "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200"
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Canceled</span>
                    <span className="bg-white text-zinc-700 px-1.5 py-0.2 rounded-full text-[10px] border border-zinc-200 font-bold">
                      {filteredActivities.filter((a) => a.status === "canceled").length}
                    </span>
                  </button>
                </div>

                {/* CONNECTOR from Scheduled to In Progress (and Canceled loopback) */}
                <div className="flex flex-col justify-between h-28 py-1 items-center relative w-12 text-slate-300 shrink-0">
                  {/* Line from Scheduled down to In Progress */}
                  <div className="absolute top-4 left-0 w-6 h-10 border-t-2 border-r-2 border-slate-200 rounded-tr-xl" />
                  <span title="Bidirectional Scheduled ⇄ In Progress" className="absolute top-2 right-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                  </span>

                  {/* Canceled loop back to Draft indicator */}
                  <div
                    onClick={() => setFilterStatus(filterStatus === "canceled" ? "" : "canceled")}
                    className="absolute bottom-2 flex items-center gap-1 text-[10px] text-indigo-600 font-semibold whitespace-nowrap bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-100 cursor-pointer transition"
                    title="Canceled events can be returned back to Draft"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>↶ to Draft</span>
                  </div>
                </div>

                {/* 3. IN PROGRESS */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    onClick={() => setFilterStatus(filterStatus === "in_progress" ? "" : "in_progress")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "in_progress"
                        ? "bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300"
                        : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>In Progress</span>
                    <span className="bg-white text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] border border-amber-100 font-bold">
                      {filteredActivities.filter((a) => a.status === "in_progress").length}
                    </span>
                  </button>
                  <span className="text-[10px] text-amber-600 mt-1 font-medium">Active work</span>
                </div>

                {/* CONNECTOR to Awaiting Review */}
                <div className="flex items-center text-slate-300 px-1 shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                {/* 4. AWAITING REVIEW */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    onClick={() => setFilterStatus(filterStatus === "awaiting_review" ? "" : "awaiting_review")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "awaiting_review"
                        ? "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-300"
                        : "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Awaiting Review</span>
                    <span className="bg-white text-purple-800 px-1.5 py-0.2 rounded-full text-[10px] border border-purple-100 font-bold">
                      {filteredActivities.filter((a) => a.status === "awaiting_review").length}
                    </span>
                  </button>
                  <span className="text-[10px] text-purple-600 mt-1 font-medium">Proof inspection</span>
                </div>

                {/* CONNECTOR to Outcomes */}
                <div className="flex items-center text-slate-300 px-1 shrink-0">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                {/* 5 & 6. OUTCOMES: Completed & Failed */}
                <div className="flex flex-col justify-between h-28 py-0.5 shrink-0">
                  {/* COMPLETED */}
                  <button
                    onClick={() => setFilterStatus(filterStatus === "passed" ? "" : "passed")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "passed"
                        ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300"
                        : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Completed</span>
                    <span className="bg-white text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px] border border-emerald-100 font-bold">
                      {filteredActivities.filter((a) => a.status === "passed").length}
                    </span>
                  </button>

                  {/* FAILED */}
                  <button
                    onClick={() => setFilterStatus(filterStatus === "failed" ? "" : "failed")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-xs ${
                      filterStatus === "failed"
                        ? "bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300"
                        : "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Failed</span>
                    <span className="bg-white text-rose-800 px-1.5 py-0.2 rounded-full text-[10px] border border-rose-100 font-bold">
                      {filteredActivities.filter((a) => a.status === "failed").length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Column Jump Pills */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px] mr-1">Columns:</span>
              <button
                onClick={() => setFilterStatus("")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
                  !filterStatus
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All 7 Columns
              </button>
              {STATUS_COLUMNS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterStatus(filterStatus === c.id ? "" : c.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs flex items-center gap-1 ${
                    filterStatus === c.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] opacity-75">
                    ({filteredActivities.filter((a) => a.status === c.id).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Linked Kanban Columns Track */}
          <div className="flex items-start overflow-x-auto pb-6 pt-1 px-1">
            {STATUS_COLUMNS.filter(
              (col) => !filterStatus || filterStatus === col.id
            ).map((col, idx, arr) => {
              const colActivities = filteredActivities.filter(
                (a) => a.status === col.id
              );
              return (
                <React.Fragment key={col.id}>
                  <div className="flex-1 min-w-[260px] max-w-[320px] shrink-0">
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

                            {/* Explicit & Chain Action Controls */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                              <div className="flex items-center gap-1">
                                {act.status === "draft" && (
                                  <button
                                    onClick={() =>
                                      handleChainTransition(
                                        act.id,
                                        "in_progress"
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <Play className="w-3 h-3" /> Start Work
                                  </button>
                                )}

                                {act.status === "scheduled" && (
                                  <button
                                    onClick={() => handleStartProgress(act.id)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <Play className="w-3 h-3" /> Start Work
                                  </button>
                                )}

                                {act.status === "in_progress" && (
                                  <button
                                    onClick={() =>
                                      handleChainTransition(
                                        act.id,
                                        "awaiting_review"
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <Clock className="w-3 h-3" /> Submit Review
                                  </button>
                                )}

                                {act.status === "awaiting_review" && (
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    Review <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}

                                {act.status === "failed" && (
                                  <button
                                    onClick={() =>
                                      handleChainTransition(
                                        act.id,
                                        "scheduled"
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <RotateCcw className="w-3 h-3" />{" "}
                                    Reschedule
                                  </button>
                                )}

                                {act.status === "canceled" && (
                                  <button
                                    onClick={() =>
                                      handleChainTransition(act.id, "draft")
                                    }
                                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Restore
                                  </button>
                                )}

                                {act.status === "passed" && (
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="flex-1 text-center text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 px-2 rounded-lg transition"
                                  >
                                    Completed ✓
                                  </Link>
                                )}

                                <Link
                                  href={`/activities/${act.id}`}
                                  className="text-center text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 py-1 px-2 rounded-lg transition shrink-0"
                                >
                                  Details
                                </Link>
                              </div>

                              {/* Quick Chain Move Dropdown */}
                              {CHAIN_TRANSITIONS[act.status]?.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <span className="shrink-0 text-slate-400">
                                    Move:
                                  </span>
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value)
                                        handleChainTransition(
                                          act.id,
                                          e.target.value
                                        );
                                    }}
                                    className="w-full text-[10px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
                                  >
                                    <option value="" disabled>
                                      Move along chain...
                                    </option>
                                    {CHAIN_TRANSITIONS[act.status].map((t) => (
                                      <option
                                        key={t.targetStatus}
                                        value={t.targetStatus}
                                      >
                                        → {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Independent Arrow Connector NEXT to the box (in the gap between boxes, NEVER overlapping!) */}
                  {!filterStatus && idx < arr.length - 1 && (
                    <div className="hidden xl:flex flex-col items-center justify-start pt-5 px-1.5 shrink-0 text-slate-400 select-none">
                      {idx === 1 ? (
                        <div
                          className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs"
                          title="Bidirectional: Scheduled ⇄ In Progress"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </div>
                      ) : idx === 4 || idx === 5 ? (
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs shadow-2xs">
                          /
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
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
