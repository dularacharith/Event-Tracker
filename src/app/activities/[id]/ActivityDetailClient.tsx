"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
  UserCheck,
  Plus,
  Paperclip,
  ExternalLink,
  MessageSquare,
  History,
  ShieldAlert,
  Trash2,
  X,
  Upload,
  ArrowRight,
  ArrowLeftRight,
  Link2,
  Ban,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  Repeat,
  User,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast, setPendingToast } from "@/components/Toast";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { PlatformIcon } from "@/components/icons/PlatformIcons";

interface ActivityDetailClientProps {
  currentUser: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    email?: string | null;
    timezone?: string;
  };
  userRole: "admin" | "member";
  activity: any;
  teammates: any[];
}

const CHAIN_TRANSITIONS: Record<
  string,
  { label: string; targetStatus: string; color: string }[]
> = {
  draft: [
    { label: "Schedule Activity", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Start Work Directly", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  scheduled: [
    { label: "Start Work (In Progress)", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Submit for Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Mark Completed", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Mark Failed", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  in_progress: [
    { label: "Move back to Scheduled", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Submit for Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Mark Completed", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Mark Failed", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  awaiting_review: [
    { label: "Pass / Completed", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail Activity", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Return to In Progress", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  failed: [
    { label: "Reschedule Activity", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Retry (In Progress)", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Reset to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  passed: [
    { label: "Reopen Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Reset to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Cancel Activity", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  canceled: [
    { label: "Restore to Draft", targetStatus: "draft", color: "text-indigo-700 bg-indigo-50 hover:bg-indigo-100" },
    { label: "Move to Scheduled", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
  ],
};

export function ActivityDetailClient({
  currentUser,
  userRole,
  activity,
  teammates,
}: ActivityDetailClientProps) {
  const { toast } = useToast();
  const confirm = useConfirm();
  // Action modals
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [verdictModalOpen, setVerdictModalOpen] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<"passed" | "failed">("passed");
  const [verdictReason, setVerdictReason] = useState("");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(false);

  // Evidence upload form
  const [evidenceType, setEvidenceType] = useState<"screenshot" | "external_link">("screenshot");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [evidenceCaption, setEvidenceCaption] = useState("");

  // Reschedule form
  const [reschedDate, setReschedDate] = useState("");
  const [reschedDeadline, setReschedDeadline] = useState("");
  const [reschedCriteria, setReschedCriteria] = useState(activity.passCriteria);
  const [reschedReason, setReschedReason] = useState("");

  // Reassign form
  const [newReviewerId, setNewReviewerId] = useState("");

  // Comments form
  const [newComment, setNewComment] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner = activity.ownerId === currentUser.id;
  const isReviewer = activity.reviewerId === currentUser.id;
  const isAdmin = userRole === "admin";

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
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const handleChainTransition = async (targetStatus: string, reason?: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${activity.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, reason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to transition status");

      setPendingToast({
        type: "success",
        title: "Status updated!",
        message: `Activity transitioned along chain to ${targetStatus.replace("_", " ")}.`,
      });
      window.location.reload();
    } catch (err: any) {
      toast.error("Status update failed", err.message);
      setLoading(false);
    }
  };

  // Start progress
  const handleStartProgress = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${activity.id}/start`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to start progress");
      setPendingToast({
        type: "success",
        title: "Progress started",
        message: "Activity status set to In Progress.",
      });
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to start progress", err.message);
      setLoading(false);
    }
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${activity.id}/submit`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit for review");
      setPendingToast({
        type: "success",
        title: "Submitted for review!",
        message: "Assigned reviewer notified to inspect evidence.",
      });
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to submit review", err.message);
      setLoading(false);
    }
  };

  // Record review verdict
  const handleRecordVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);
      const res = await fetch(`/api/activities/${activity.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: selectedVerdict,
          verdictReason,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to record verdict");
      setPendingToast({
        type: "success",
        title: selectedVerdict === "passed" ? "Activity Passed!" : "Activity Marked as Failed",
        message: "Verdict recorded with written reasoning.",
      });
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message);
      setLoading(false);
    }
  };

  // Add evidence
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);

      let mediaFileId: string | undefined = undefined;

      if (evidenceType === "screenshot") {
        if (!fileToUpload) throw new Error("Please select a PNG, JPEG, or WebP screenshot file.");
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("purpose", "evidence");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload file");
        mediaFileId = uploadData.file.id;
      }

      const res = await fetch(`/api/activities/${activity.id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: evidenceType,
          mediaFileId,
          externalUrl: evidenceType === "external_link" ? externalUrl : undefined,
          caption: evidenceCaption,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to add evidence");
      setPendingToast({
        type: "success",
        title: "Evidence attached!",
        message: "Proof was successfully attached to this activity.",
      });
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message);
      setLoading(false);
    }
  };

  // Remove evidence
  const handleRemoveEvidence = async (evidenceId: string) => {
    const ok = await confirm({
      title: "Are you sure you want to remove this evidence item?",
      description: "The uploaded proof attachment will be deleted.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/activities/${activity.id}/evidence?evidenceId=${evidenceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPendingToast({
          type: "success",
          title: "Evidence removed",
        });
        window.location.reload();
      } else {
        const d = await res.json();
        toast.error("Failed to remove evidence", d.error);
      }
    } catch (err: any) {
      toast.error("Error", err.message);
    }
  };

  // Reschedule activity
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);
      const res = await fetch(`/api/activities/${activity.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(reschedDate).toISOString(),
          reviewDeadline: new Date(reschedDeadline).toISOString(),
          passCriteria: reschedCriteria,
          rescheduleReason: reschedReason,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to reschedule activity");
      setPendingToast({
        type: "success",
        title: "Activity rescheduled!",
        message: "New schedule saved; past review verdict is preserved.",
      });
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message);
      setLoading(false);
    }
  };

  // Reassign reviewer
  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setActionError(null);
      const res = await fetch(`/api/activities/${activity.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newReviewerId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to reassign reviewer");
      setPendingToast({
        type: "success",
        title: "Reviewer assigned!",
        message: "Eligible reviewer was updated.",
      });
      window.location.reload();
    } catch (err: any) {
      setActionError(err.message);
      setLoading(false);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/activities/${activity.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        setNewComment("");
        setPendingToast({
          type: "success",
          title: "Comment posted",
        });
        window.location.reload();
      } else {
        const d = await res.json();
        toast.error("Comment failed", d.error || "Failed to post comment");
        setLoading(false);
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to post comment");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/activities" className="hover:text-indigo-600 transition">
              Activities
            </Link>
            <span>/</span>
            {activity.campaignName && (
              <span className="text-indigo-600 font-medium">
                {activity.campaignName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activity.title}
            </h1>
            {getStatusBadge(activity.status)}
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded flex items-center gap-1.5 shrink-0">
              <PlatformIcon platform={activity.socialPlatform} className="w-3.5 h-3.5 shrink-0" colored />
              <span>{activity.socialPlatform}</span>
            </span>
            <span className="text-xs text-slate-500 capitalize bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              {activity.contentType.replace("_", " ")}
            </span>
            {activity.channelName && (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                #{activity.channelName}
              </span>
            )}
            {activity.recurrenceRule && activity.recurrenceRule !== "none" && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                <span>
                  {activity.recurrenceRule === "daily"
                    ? "Daily"
                    : activity.recurrenceRule === "every_2_days"
                    ? "Every 2 days"
                    : activity.recurrenceRule === "every_5_days"
                    ? "Every 5 days"
                    : activity.recurrenceRule === "weekly"
                    ? "Weekly"
                    : activity.recurrenceRule === "weekends"
                    ? "Weekends"
                    : activity.recurrenceRule === "specific_day"
                    ? `Every ${activity.recurrenceDay ? activity.recurrenceDay.charAt(0).toUpperCase() + activity.recurrenceDay.slice(1) : "week"}`
                    : activity.recurrenceRule}
                  {activity.recurrenceEndDate && (
                    <span className="opacity-75">
                      {" "}until {new Date(activity.recurrenceEndDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons based on Role & State */}
        <div className="flex items-center gap-2 flex-wrap">
          {activity.status === "scheduled" && isOwner && (
            <button
              onClick={handleStartProgress}
              disabled={loading}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5" /> Start Work
            </button>
          )}

          {activity.status === "in_progress" && isOwner && (
            <button
              onClick={handleSubmitForReview}
              disabled={loading || activity.evidence.length === 0}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
              title={
                activity.evidence.length === 0
                  ? "At least one piece of evidence is required to submit for review"
                  : "Submit for reviewer decision"
              }
            >
              <Send className="w-3.5 h-3.5" /> Submit for Review
            </button>
          )}

          {activity.status === "awaiting_review" && isReviewer && (
            <button
              onClick={() => {
                setActionError(null);
                setVerdictModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Record Review Verdict
            </button>
          )}

          {activity.status === "failed" && (isOwner || isAdmin) && (
            <button
              onClick={() => {
                setActionError(null);
                setRescheduleModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reschedule Activity
            </button>
          )}

          {isAdmin && activity.status !== "passed" && (
            <button
              onClick={() => {
                setActionError(null);
                setReassignModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <UserCheck className="w-3.5 h-3.5" /> Reassign Reviewer
            </button>
          )}
        </div>
      </div>

      {/* Workflow Chain Actions & Stepper Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Link2 className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Workflow Lifecycle Chain
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Move this activity along the connected chain. Draft can go to Scheduled or directly In Progress; Scheduled & In Progress can be completed, submitted, or canceled; and Canceled loops back to Draft.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFlowGuide((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showFlowGuide ? "Hide Flow Diagram" : "View Flow Diagram"}</span>
              {showFlowGuide ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Current Stage:</span>
              {getStatusBadge(activity.status)}
            </div>
          </div>
        </div>

        {/* Visual Stepper / Mind Map (Collapsible / Expandable) */}
        {showFlowGuide && (
          <div className="overflow-x-auto py-3 px-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <div className="min-w-[820px] flex items-center justify-between gap-3 text-xs">
              {/* 1. Draft */}
              <div className={`flex flex-col items-center ${activity.status === "draft" ? "scale-105 transition" : ""}`}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "draft"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">1</span>
                  Draft
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">Initial state</span>
              </div>

              {/* Split Branch Connector from Draft to Scheduled (top), In Progress (direct), Canceled (bottom) */}
              <div className="flex flex-col justify-between items-center h-28 relative w-12 text-slate-300 shrink-0">
                <div className="absolute top-4 left-0 w-6 h-10 border-t-2 border-l-2 border-slate-200 rounded-tl-xl" />
                <ArrowRight className="absolute top-2 right-1.5 w-3.5 h-3.5 text-blue-400" />

                <div className="w-full border-t border-dashed border-slate-300 relative my-auto">
                  <ArrowRight className="absolute -top-1.5 right-1.5 w-3.5 h-3.5 text-amber-400" />
                </div>

                <div className="absolute bottom-4 left-0 w-6 h-10 border-b-2 border-l-2 border-slate-200 rounded-bl-xl" />
                <ArrowRight className="absolute bottom-2 right-1.5 w-3.5 h-3.5 text-zinc-400" />
              </div>

              {/* TWO SEPARATE BOXES (NOT LINKED HORIZONTALLY): Scheduled & Canceled */}
              <div className="flex flex-col justify-between h-28 py-0.5 shrink-0">
                {/* Scheduled Box */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "scheduled"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
                  Scheduled
                </div>

                {/* Canceled Box (Separate box, not linked horizontally to Scheduled) */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "canceled"
                    ? "bg-zinc-800 text-white border-zinc-800 shadow-md ring-2 ring-zinc-400"
                    : "bg-zinc-100 text-zinc-700 border-zinc-300"
                }`}>
                  <Ban className="w-3.5 h-3.5 text-zinc-500" />
                  Canceled
                </div>
              </div>

              {/* Connector to In Progress (and Canceled loopback) */}
              <div className="flex flex-col justify-between h-28 py-1 items-center relative w-12 text-slate-300 shrink-0">
                <div className="absolute top-4 left-0 w-6 h-10 border-t-2 border-r-2 border-slate-200 rounded-tr-xl" />
                <span title="Bidirectional Scheduled ⇄ In Progress" className="absolute top-2 right-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                </span>

                <div
                  className="absolute bottom-2 flex items-center gap-1 text-[10px] text-indigo-600 font-semibold whitespace-nowrap bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100"
                  title="Canceled activities can loop back to Draft"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>↶ to Draft</span>
                </div>
              </div>

              {/* 3. In Progress */}
              <div className={`flex flex-col items-center ${activity.status === "in_progress" ? "scale-105 transition" : ""}`}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "in_progress"
                    ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">3</span>
                  In Progress
                </div>
                <span className="text-[10px] text-amber-600 mt-1 font-medium">Active work</span>
              </div>

              <div className="flex items-center text-slate-300 px-1 shrink-0">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 4. Awaiting Review */}
              <div className={`flex flex-col items-center ${activity.status === "awaiting_review" ? "scale-105 transition" : ""}`}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "awaiting_review"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300"
                    : "bg-purple-50 text-purple-800 border-purple-200"
                }`}>
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold">4</span>
                  Awaiting Review
                </div>
                <span className="text-[10px] text-purple-600 mt-1 font-medium">Proof inspection</span>
              </div>

              <div className="flex items-center text-slate-300 px-1 shrink-0">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 5 & 6. Outcomes */}
              <div className="flex flex-col justify-between h-28 py-0.5 shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "passed"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Completed
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
                  activity.status === "failed"
                    ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Failed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transition Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Move along chain:</span>
          {CHAIN_TRANSITIONS[activity.status]?.map((t) => (
            <button
              key={t.targetStatus}
              disabled={loading}
              onClick={() => handleChainTransition(t.targetStatus)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border border-transparent shadow-xs disabled:opacity-50 ${t.color}`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Details Left, Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Brief Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Campaign Brief & Target
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activity.brief}
            </p>
          </div>

          {/* Pass Criteria Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Pass Criteria
              </h2>
              <span className="text-[10px] text-slate-400">
                Enforced by reviewer before approval
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
              {activity.passCriteria || "No pass criteria defined."}
            </div>
          </div>

          {/* Evidence Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Proof of Work & Evidence ({activity.evidence.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Screenshots or external links demonstrating the completed deliverable
                </p>
              </div>

              {activity.status !== "passed" && (
                <button
                  onClick={() => {
                    setActionError(null);
                    setEvidenceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Evidence
                </button>
              )}
            </div>

            {activity.evidence.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  No proof attached yet
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  The owner must attach at least one piece of evidence before submitting for review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activity.evidence.map((evi: any) => (
                  <div
                    key={evi.id}
                    className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      {evi.type === "screenshot" && evi.mediaFileId && (
                        <div className="mb-2 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center">
                          <img
                            src={`/api/files/${evi.mediaFileId}`}
                            alt={evi.caption || "Evidence screenshot"}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}

                      {evi.type === "external_link" && (
                        <div className="mb-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                          <a
                            href={evi.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1 break-all"
                          >
                            <span>{evi.externalUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}

                      {evi.caption && (
                        <p className="text-xs text-slate-700 font-medium">{evi.caption}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>
                        {new Date(evi.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {activity.status !== "awaiting_review" && activity.status !== "passed" && (
                        <button
                          onClick={() => handleRemoveEvidence(evi.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Remove evidence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Review Attempts & Snapshots */}
          {activity.attempts && activity.attempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Review Attempts & Snapshots ({activity.attempts.length})
              </h2>
              <div className="space-y-4">
                {activity.attempts.map((att: any) => (
                  <div
                    key={att.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">
                        Attempt #{att.attemptNumber}
                      </span>
                      {att.verdict ? (
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            att.verdict === "passed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {att.verdict}
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Awaiting Review
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      Submitted by{" "}
                      <span className="font-medium text-slate-700">
                        {att.submittedBy?.displayName || att.submittedBy?.name || "Owner"}
                      </span>{" "}
                      on {new Date(att.submittedAt).toLocaleDateString()}
                    </p>

                    {/* Snapshot of criteria */}
                    <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-600 block mb-0.5">
                        Reviewed Criteria Snapshot:
                      </span>
                      <p className="text-slate-700">{att.criteriaSnapshot}</p>
                    </div>

                    {/* Verdict Reason if decided */}
                    {att.verdictReason && (
                      <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-600 block mb-0.5">
                          Reviewer Verdict Reason:
                        </span>
                        <p className="text-slate-800 font-medium">{att.verdictReason}</p>
                        {att.decidedAt && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Decided at {new Date(att.decidedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              Teammate Comments ({activity.comments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment or feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                Post
              </button>
            </form>

            {/* Comment Feed */}
            <div className="space-y-3 pt-2">
              {activity.comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No comments yet. Start the conversation with your team!
                </p>
              ) : (
                activity.comments.map((comm: any) => (
                  <div
                    key={comm.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <UserAvatar
                      name={comm.author?.name}
                      displayName={comm.author?.displayName}
                      avatarUrl={comm.author?.avatarUrl}
                      image={comm.author?.image}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">
                          {comm.author?.displayName || comm.author?.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comm.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {comm.author?.jobTitle && (
                        <p className="text-[10px] text-indigo-600 font-medium">
                          {comm.author.jobTitle}
                        </p>
                      )}
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Metadata, People, Audit History */}
        <div className="space-y-6">
          {/* People Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              People & Ownership
            </h3>

            {/* Owner */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                Activity Owner
              </span>
              {activity.owner ? (
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    name={activity.owner.name}
                    displayName={activity.owner.displayName}
                    avatarUrl={activity.owner.avatarUrl}
                    image={activity.owner.image}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-xs text-slate-800">
                      {activity.owner.displayName || activity.owner.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {activity.owner.jobTitle || activity.owner.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Unassigned</p>
              )}
            </div>

            {/* Reviewer */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                Assigned Reviewer
              </span>
              {activity.reviewer ? (
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    name={activity.reviewer.name}
                    displayName={activity.reviewer.displayName}
                    avatarUrl={activity.reviewer.avatarUrl}
                    image={activity.reviewer.image}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-xs text-slate-800">
                      {activity.reviewer.displayName || activity.reviewer.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {activity.reviewer.jobTitle || activity.reviewer.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No reviewer assigned</p>
              )}
            </div>
          </div>

          {/* Schedule & Timing Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Schedule & Deadlines
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Scheduled Date</span>
                <span className="font-semibold text-slate-800">
                  {activity.scheduledAt
                    ? new Date(activity.scheduledAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not scheduled yet"}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Review Deadline</span>
                <span className="font-semibold text-slate-800">
                  {activity.reviewDeadline
                    ? new Date(activity.reviewDeadline).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No deadline"}
                </span>
              </div>
            </div>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" /> Audit Trail
            </h3>

            <div className="relative pl-4 space-y-3 border-l-2 border-slate-100 text-xs">
              {activity.history.map((h: any) => (
                <div key={h.id} className="relative group">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-indigo-600 transition" />
                  <p className="font-semibold text-slate-800">
                    {h.fromStatus} → {h.toStatus}
                  </p>
                  {h.reason && (
                    <p className="text-slate-500 text-[11px] mt-0.5">{h.reason}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {h.actor?.displayName || h.actor?.name} •{" "}
                    {new Date(h.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Decision Modal (Assigned Reviewer Only) */}
      {verdictModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-900 overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Record Review Decision
              </h3>
              <button
                onClick={() => setVerdictModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleRecordVerdict} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVerdict("passed")}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      selectedVerdict === "passed"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PASSED
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVerdict("failed")}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                      selectedVerdict === "failed"
                        ? "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" /> FAILED
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Written Reason * (Required for both Passed and Failed)
                </label>
                <textarea
                  placeholder={
                    selectedVerdict === "passed"
                      ? "Explain why the criteria was verified and met..."
                      : "Explain the issues found and required revisions..."
                  }
                  value={verdictReason}
                  onChange={(e) => setVerdictReason(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Rule: Saved atomically with the append-only audit trail in a single database transaction. Stale submissions will be rejected.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerdictModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !verdictReason.trim()}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition shadow-sm disabled:opacity-50 ${
                    selectedVerdict === "passed"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {loading ? "Recording..." : `Confirm ${selectedVerdict.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-900 overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Attach Proof of Work</h3>
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAddEvidence} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEvidenceType("screenshot")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    evidenceType === "screenshot"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Screenshot (Private Blob)
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceType("external_link")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    evidenceType === "external_link"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  External Link
                </button>
              </div>

              {evidenceType === "screenshot" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image File (PNG, JPEG, WebP, max 3 MB) *
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-100 file:font-semibold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    For videos or files larger than 3MB, please choose External Link.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    External URL * (Google Drive, Figma, YouTube, Loom, etc.)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Caption / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Final 4K export preview or Figma artboard"
                  value={evidenceCaption}
                  onChange={(e) => setEvidenceCaption(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {loading ? "Attaching..." : "Attach Evidence"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-900 overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Reschedule Failed Work
              </h3>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Scheduled Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={reschedDate}
                    onChange={(e) => setReschedDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Review Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={reschedDeadline}
                    onChange={(e) => setReschedDeadline(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pass Criteria (Editable for new iteration)
                </label>
                <textarea
                  value={reschedCriteria}
                  onChange={(e) => setReschedCriteria(e.target.value)}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reschedule Notes / Next Steps
                </label>
                <input
                  type="text"
                  placeholder="e.g. Updating data charts per feedback"
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Rule: Preserves the previous failed verdict and snapshot completely intact in history.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {loading ? "Rescheduling..." : "Reschedule Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Reviewer Modal (Admin Only) */}
      {reassignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full p-6 text-slate-900 overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Reassign Reviewer
              </h3>
              <button
                onClick={() => setReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Reviewer *
                </label>
                <CustomDropdown
                  value={newReviewerId}
                  onChange={setNewReviewerId}
                  placeholder="Select an eligible teammate"
                  options={[
                    { value: "", label: "Select an eligible teammate" },
                    ...teammates
                      .filter(
                        (m) =>
                          m.userId !== activity.ownerId &&
                          m.userId !== activity.createdById &&
                          m.userId !== activity.reviewerId
                      )
                      .map((m) => ({
                        value: m.userId,
                        label: m.displayName || m.name,
                        subtitle: m.role ? m.role.toUpperCase() : undefined,
                        icon: <User className="w-3.5 h-3.5" />,
                      })),
                  ]}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Must be an active teammate who is neither the creator nor the owner.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newReviewerId}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {loading ? "Reassigning..." : "Confirm Reassignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
