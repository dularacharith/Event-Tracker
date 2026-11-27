"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  Pencil,
  Repeat,
  Send,
  Paperclip,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  MessageSquare,
  FileText,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import { FlowColumn, getColumnStyles, getCampaignTagStyle } from "@/lib/flowColumns";
import { PlatformIcon } from "@/components/icons/PlatformIcons";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/components/Toast";

export interface ActivityDetailData {
  id: string;
  campaignId: string;
  campaignName?: string | null;
  campaignStatus?: string | null;
  campaignColor?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  recurrenceRule?: string | null;
  recurrenceDay?: string | null;
  recurrenceEndDate?: Date | string | null;
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
  reviewer?: {
    id: string;
    name?: string | null;
    displayName?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
  } | null;
  evidence?: Array<{
    id: string;
    type: "screenshot" | "external_link";
    mediaFileId?: string | null;
    externalUrl?: string | null;
    caption?: string | null;
    createdAt: string | Date;
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    author: {
      id: string;
      name?: string | null;
      displayName?: string | null;
      avatarUrl?: string | null;
    };
  }>;
  [key: string]: any;
}

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDetailData | null;
  flowColumns: FlowColumn[];
  onMoveTo?: (activity: ActivityDetailData) => void;
  onEditTitle?: (activityId: string, currentTitle: string) => void;
  onStatusChange?: (activityId: string, targetStatus: string) => Promise<void>;
}

export function ActivityDetailsModal({
  isOpen,
  onClose,
  activity,
  flowColumns,
  onMoveTo,
  onEditTitle,
  onStatusChange,
}: ActivityDetailsModalProps) {
  const { toast } = useToast();
  const [fullDetails, setFullDetails] = useState<ActivityDetailData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial activity and fetch complete details
  useEffect(() => {
    if (!isOpen || !activity) {
      setFullDetails(null);
      setCommentText("");
      return;
    }

    setFullDetails(activity);
    let isCancelled = false;

    async function fetchFull() {
      if (!activity) return;
      try {
        setLoadingDetails(true);
        const res = await fetch(`/api/activities/${activity.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data.activity) {
          setFullDetails(data.activity);
        }
      } catch {
        // Fallback to initial activity passed via props
      } finally {
        if (!isCancelled) setLoadingDetails(false);
      }
    }

    fetchFull();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, activity?.id]);

  if (!isOpen || !activity) return null;

  const currentData = fullDetails || activity;
  const currentCol = flowColumns.find((c) => c.id === currentData.status);
  const currentStyles = currentCol ? getColumnStyles(currentCol) : null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || postingComment) return;

    try {
      setPostingComment(true);
      const res = await fetch(`/api/activities/${currentData.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      // Refetch comments
      const refreshRes = await fetch(`/api/activities/${currentData.id}`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.activity) {
          setFullDetails(refreshData.activity);
        }
      }

      setCommentText("");
      toast.success("Comment posted", "Your comment has been added to the activity.");
    } catch (err: any) {
      toast.error("Comment failed", err.message);
    } finally {
      setPostingComment(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed top-16 inset-x-0 bottom-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full flex flex-col max-h-[85vh] text-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        {/* Sticky Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 border border-purple-100">
              <PlatformIcon platform={currentData.socialPlatform} className="w-5 h-5 shrink-0" colored />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-900 text-base leading-snug truncate" title={currentData.title}>
                  {currentData.title}
                </h2>
                {onEditTitle && (
                  <button
                    type="button"
                    onClick={() => onEditTitle(currentData.id, currentData.title)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition cursor-pointer shrink-0"
                    title="Rename title"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap text-xs">
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider ${
                    currentStyles?.badgeBgClass || "bg-slate-100 text-slate-700"
                  }`}
                  style={currentStyles?.badgeStyle}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${currentStyles?.dotClass || "bg-slate-400"}`}
                    style={currentStyles?.dotStyle}
                  />
                  <span>{currentCol?.label || currentData.status.replace("_", " ")}</span>
                </span>

                {/* Content Type */}
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
                  {currentData.contentType?.replace("_", " ")}
                </span>

                {/* Campaign */}
                {currentData.campaignName && (() => {
                  const campStyle = getCampaignTagStyle(
                    currentData.campaignStatus,
                    currentData.campaignColor
                  );
                  return (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[150px] flex items-center gap-1.5 ${campStyle.badgeClass}`}
                      style={campStyle.style}
                      title={`Campaign: ${currentData.campaignName}${campStyle.statusLabel ? ` (${campStyle.statusLabel})` : ""}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 shadow-2xs ${campStyle.dotClass}`}
                        style={campStyle.dotStyle}
                      />
                      <span className="truncate">{currentData.campaignName}</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onMoveTo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMoveTo(currentData);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Move to</span>
              </button>
            )}

            <Link
              href={`/activities/${currentData.id}`}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
              title="Open full page view"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Metadata Row: Channel, Recurrence, Owner, Reviewer, Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 text-xs">
            {/* Owner */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Owner
              </span>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                <UserAvatar
                  name={currentData.owner?.displayName || currentData.owner?.name}
                  avatarUrl={currentData.owner?.avatarUrl || currentData.owner?.image}
                  size="sm"
                />
                <span className="truncate">{currentData.owner?.displayName || currentData.owner?.name || "Unassigned"}</span>
              </div>
            </div>

            {/* Reviewer */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Reviewer
              </span>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                {currentData.reviewer ? (
                  <>
                    <UserAvatar
                      name={currentData.reviewer?.displayName || currentData.reviewer?.name}
                      avatarUrl={currentData.reviewer?.avatarUrl || currentData.reviewer?.image}
                      size="sm"
                    />
                    <span className="truncate">{currentData.reviewer?.displayName || currentData.reviewer?.name}</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic">Any Team Member</span>
                )}
              </div>
            </div>

            {/* Scheduled Date */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Scheduled
              </span>
              <div className="flex items-center gap-1 text-slate-700 font-medium truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {currentData.scheduledAt
                    ? new Date(currentData.scheduledAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not scheduled"}
                </span>
              </div>
            </div>

            {/* Review Deadline */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Deadline
              </span>
              <div className="flex items-center gap-1 text-slate-700 font-medium truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {currentData.reviewDeadline
                    ? new Date(currentData.reviewDeadline).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : "Flexible"}
                </span>
              </div>
            </div>
          </div>

          {/* Channel & Recurrence Pills if present */}
          {(currentData.channelName || (currentData.recurrenceRule && currentData.recurrenceRule !== "none")) && (
            <div className="flex items-center gap-2 flex-wrap">
              {currentData.channelName && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <span>#{currentData.channelName}</span>
                </span>
              )}
              {currentData.recurrenceRule && currentData.recurrenceRule !== "none" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                  <Repeat className="w-3 h-3" />
                  <span>
                    Repeats {currentData.recurrenceRule.replace("_", " ")}
                    {currentData.recurrenceEndDate &&
                      ` until ${new Date(currentData.recurrenceEndDate).toLocaleDateString()}`}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Campaign Brief */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Campaign Brief & Target</span>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {currentData.brief || "No brief specified."}
            </div>
          </div>

          {/* Pass Criteria */}
          {currentData.passCriteria && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pass Criteria (Approval Guidelines)</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
                {currentData.passCriteria}
              </div>
            </div>
          )}

          {/* Proof of Work / Evidence Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Attached Proof & Evidence ({currentData.evidence?.length || 0})
                </span>
              </div>
              <Link
                href={`/activities/${currentData.id}`}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition"
              >
                + Add or manage proof
              </Link>
            </div>

            {currentData.evidence && currentData.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentData.evidence.map((evi) => (
                  <div
                    key={evi.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1.5 flex flex-col justify-between"
                  >
                    <div>
                      {evi.type === "screenshot" && evi.mediaFileId ? (
                        <div className="mb-2 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center">
                          <img
                            src={`/api/files/${evi.mediaFileId}`}
                            alt={evi.caption || "Evidence screenshot"}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : evi.externalUrl ? (
                        <a
                          href={evi.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-purple-600 hover:underline flex items-center gap-1 break-all mb-1"
                        >
                          <span>{evi.externalUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : null}

                      {evi.caption && (
                        <p className="text-xs text-slate-700 font-medium">
                          {evi.caption}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200/50">
                      Added {new Date(evi.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40 text-xs text-slate-400">
                No proof of work or screenshots attached yet.
              </div>
            )}
          </div>

          {/* Activity Comments / Stream */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>Discussion & Notes ({currentData.comments?.length || 0})</span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a note or feedback..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || postingComment}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {postingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </form>

            {/* Comments List */}
            {currentData.comments && currentData.comments.length > 0 && (
              <div className="space-y-2 pt-1">
                {currentData.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <UserAvatar
                          name={c.author?.displayName || c.author?.name}
                          avatarUrl={c.author?.avatarUrl}
                          size="sm"
                        />
                        <span>{c.author?.displayName || c.author?.name || "Team Member"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 pl-6 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 z-10">
          <Link
            href={`/activities/${currentData.id}`}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition flex items-center gap-1"
          >
            <span>Open in full page</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            {onMoveTo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMoveTo(currentData);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Move to...</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
