"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

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

interface MyWorkClientProps {
  currentUser: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    timezone?: string;
  };
  userRole: "admin" | "member";
  activities: ActivityItem[];
  campaigns: any[];
}

export function MyWorkClient({
  currentUser,
  userRole,
  activities,
  campaigns,
}: MyWorkClientProps) {
  const [activeTab, setActiveTab] = useState<"owned" | "reviews" | "overdue">(
    "owned"
  );

  const now = new Date();

  // 1. Activities owned by current user
  const ownedActivities = activities.filter((a) => a.ownerId === currentUser.id);

  // 2. Reviews assigned to current user
  const reviewsAssigned = activities.filter(
    (a) => a.reviewerId === currentUser.id
  );
  const pendingMyReview = reviewsAssigned.filter(
    (a) => a.status === "awaiting_review"
  );

  // 3. Overdue work:
  // Activity is overdue if reviewDeadline has passed and status is not 'passed',
  // or scheduledAt has passed and status is still 'draft' or 'scheduled'.
  const overdueWork = activities.filter((a) => {
    if (a.status === "passed") return false;
    if (a.reviewDeadline && new Date(a.reviewDeadline).getTime() < now.getTime()) {
      return true;
    }
    if (a.scheduledAt && new Date(a.scheduledAt).getTime() < now.getTime()) {
      if (a.status === "draft" || a.status === "scheduled") return true;
    }
    return false;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      draft: { label: "Draft", bg: "bg-slate-100", text: "text-slate-700" },
      scheduled: { label: "Scheduled", bg: "bg-blue-100", text: "text-blue-700" },
      in_progress: {
        label: "In Progress",
        bg: "bg-amber-100",
        text: "text-amber-700",
      },
      awaiting_review: {
        label: "Awaiting Review",
        bg: "bg-purple-100",
        text: "text-purple-700",
      },
      passed: { label: "Passed", bg: "bg-emerald-100", text: "text-emerald-700" },
      failed: { label: "Failed", bg: "bg-rose-100", text: "text-rose-700" },
    };

    const style = map[status] || {
      label: status,
      bg: "bg-slate-100",
      text: "text-slate-700",
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
    );
  };

  const currentList =
    activeTab === "owned"
      ? ownedActivities
      : activeTab === "reviews"
      ? reviewsAssigned
      : overdueWork;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Work
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track your campaigns, pending reviews, and due dates
          </p>
        </div>

        <Link
          href="/activities?new=true"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Create Activity
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab("owned")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "owned"
              ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              My Activities
            </span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {ownedActivities.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {ownedActivities.filter((a) => a.status === "in_progress").length} in
            progress
          </p>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "reviews"
              ? "bg-purple-50/50 border-purple-200 ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Assigned Reviews
            </span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {reviewsAssigned.length}
          </div>
          <p className="text-xs text-purple-600 font-medium mt-1">
            {pendingMyReview.length} awaiting your verdict
          </p>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`p-4 rounded-xl border text-left transition ${
            activeTab === "overdue"
              ? "bg-rose-50/50 border-rose-200 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Overdue Work
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {overdueWork.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Missed schedule or review deadline
          </p>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab("owned")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "owned"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          My Activities ({ownedActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "reviews"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Reviews For Me ({reviewsAssigned.length})
          {pendingMyReview.length > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
              {pendingMyReview.length} action
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "overdue"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Overdue Items ({overdueWork.length})
        </button>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {currentList.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-sm">
              No activities found in this view
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === "owned"
                ? "You have not created or been assigned any activities yet."
                : activeTab === "reviews"
                ? "You currently have no reviews assigned to you."
                : "Great news! There is no overdue work on the team."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.socialPlatform}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      {item.contentType.replace("_", " ")}
                    </span>
                    {item.campaignName && (
                      <span className="text-xs text-indigo-600 font-medium">
                        • {item.campaignName}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/activities/${item.id}`}
                    className="font-semibold text-slate-900 text-base hover:text-indigo-600 transition block truncate"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {item.brief}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                    {item.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Due:{" "}
                          {new Date(item.scheduledAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    )}

                    {item.reviewDeadline && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Review by:{" "}
                          {new Date(item.reviewDeadline).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-3 shrink-0">
                  {item.status === "awaiting_review" &&
                    item.reviewerId === currentUser.id && (
                      <Link
                        href={`/activities/${item.id}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        Review Now <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                  {item.status === "failed" &&
                    (item.ownerId === currentUser.id || userRole === "admin") && (
                      <Link
                        href={`/activities/${item.id}`}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        Reschedule <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                  <Link
                    href={`/activities/${item.id}`}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
