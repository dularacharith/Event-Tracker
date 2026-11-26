"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
  AlertCircle,
  Repeat,
  Layers,
  Radio,
  Hash,
  FileText,
  Film,
  Video,
  Sparkles,
  Users,
  User,
} from "lucide-react";
import { setPendingToast } from "@/components/Toast";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { PlatformIcon } from "@/components/icons/PlatformIcons";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";

interface ActivityItem {
  id: string;
  title: string;
  brief: string;
  socialPlatform: string;
  contentType: string;
  channelId?: string | null;
  channelName?: string | null;
  recurrenceRule?: string | null;
  recurrenceDay?: string | null;
  recurrenceEndDate?: Date | string | null;
  parentActivityId?: string | null;
  scheduledAt?: Date | string | null;
  reviewDeadline?: Date | string | null;
  status: string;
  campaignName?: string | null;
}

interface CalendarClientProps {
  currentUser: {
    id: string;
    displayName?: string | null;
    name?: string | null;
    timezone?: string;
  };
  userRole: "admin" | "member";
  activities: ActivityItem[];
  campaigns: any[];
  channels?: any[];
  teammates: any[];
}

export function CalendarClient({
  currentUser,
  userRole,
  activities,
  campaigns,
  channels = [],
  teammates,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formCampaignId, setFormCampaignId] = useState(
    campaigns[0]?.id || ""
  );
  const [formChannelId, setFormChannelId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBrief, setFormBrief] = useState("");
  const [formPlatform, setFormPlatform] = useState("twitter");
  const [formContentType, setFormContentType] = useState("post");
  const [formScheduledTime, setFormScheduledTime] = useState("10:00");
  const [formReviewDeadlineDays, setFormReviewDeadlineDays] = useState("1");
  const [formOwnerId, setFormOwnerId] = useState(currentUser.id);
  const [formReviewerId, setFormReviewerId] = useState("");
  const [formCriteria, setFormCriteria] = useState("");
  const [formRecurrenceRule, setFormRecurrenceRule] = useState("none");
  const [formRecurrenceDay, setFormRecurrenceDay] = useState("monday");
  const [formRecurrenceEndDate, setFormRecurrenceEndDate] = useState("");
  const [formRecurrenceCount, setFormRecurrenceCount] = useState(5);

  const userTz = currentUser.timezone || "UTC";

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Days interval calculation
  const getDaysToRender = () => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  };

  const days = getDaysToRender();

  const openCreateModal = (day: Date) => {
    setSelectedDay(day);
    setFormError(null);
    setModalOpen(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);

      if (!formCampaignId) {
        throw new Error("Please select or create a campaign first.");
      }

      // Combine date and time
      const [hours, mins] = formScheduledTime.split(":").map(Number);
      const scheduledDate = new Date(selectedDay);
      scheduledDate.setHours(hours || 10, mins || 0, 0, 0);

      const deadlineDate = new Date(
        scheduledDate.getTime() +
          Number(formReviewDeadlineDays) * 24 * 60 * 60 * 1000
      );

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: formCampaignId,
          channelId: formChannelId || null,
          title: formTitle,
          brief: formBrief,
          socialPlatform: formPlatform,
          contentType: formContentType,
          scheduledAt: scheduledDate.toISOString(),
          reviewDeadline: deadlineDate.toISOString(),
          recurrenceRule: formRecurrenceRule !== "none" ? formRecurrenceRule : null,
          recurrenceDay: formRecurrenceRule === "specific_day" ? formRecurrenceDay : null,
          recurrenceEndDate: formRecurrenceEndDate ? new Date(formRecurrenceEndDate).toISOString() : null,
          recurrenceCount: formRecurrenceCount,
          ownerId: formOwnerId,
          reviewerId: formReviewerId || null,
          passCriteria: formCriteria,
          initialStatus: formReviewerId && formCriteria ? "scheduled" : "draft",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create activity");
      }

      setPendingToast({
        type: "success",
        title: "Activity scheduled!",
        message: `"${formTitle}" added to the calendar.`,
      });
      window.location.reload();
    } catch (err: any) {
      setFormError(err.message);
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700 border-slate-200",
      scheduled: "bg-blue-50 text-blue-700 border-blue-200",
      in_progress: "bg-amber-50 text-amber-700 border-amber-200",
      awaiting_review: "bg-purple-50 text-purple-700 border-purple-200",
      passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      failed: "bg-rose-50 text-rose-700 border-rose-200",
      canceled: "bg-zinc-100 text-zinc-500 border-zinc-200 line-through",
    };
    return map[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Activity Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Showing in your profile time zone: <span className="font-semibold text-slate-700">{userTz}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === "month"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === "week"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-slate-800 ml-1">
            {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Day Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-semibold text-slate-600">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            // Filter activities scheduled on this day
            const dayActivities = activities.filter((act) => {
              if (!act.scheduledAt) return false;
              return isSameDay(new Date(act.scheduledAt), day);
            });

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 flex flex-col justify-between group transition hover:bg-slate-50/70 ${
                  !isCurrentMonth ? "bg-slate-50/40 text-slate-400" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  <button
                    onClick={() => openCreateModal(day)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                    title={`Schedule activity on ${format(day, "MMM d")}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day activities list */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-24">
                  {dayActivities.map((act) => (
                    <Link
                      key={act.id}
                      href={`/activities/${act.id}`}
                      className={`block px-1.5 py-1 rounded text-[11px] font-medium border truncate transition hover:opacity-80 ${getStatusColor(
                        act.status
                      )}`}
                    >
                      {act.recurrenceRule && act.recurrenceRule !== "none" && (
                        <Repeat className="w-2.5 h-2.5 inline-block mr-1 opacity-80 shrink-0" />
                      )}
                      <span className="uppercase text-[9px] mr-1 opacity-70">
                        {act.socialPlatform.substring(0, 2)}:
                      </span>
                      {act.title}
                    </Link>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 text-right">
                  {dayActivities.length > 0 && `${dayActivities.length} item${dayActivities.length > 1 ? "s" : ""}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Activity Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-lg w-full flex flex-col max-h-[82vh] text-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            {/* Static / Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Schedule Activity for {format(selectedDay, "MMMM d, yyyy")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Contents Only */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                    {formError}
                  </div>
                )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Campaign *
                  </label>
                  {campaigns.length > 0 && (
                    <Link
                      href="/campaigns"
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition"
                    >
                      + Manage Campaigns
                    </Link>
                  )}
                </div>

                {campaigns.length === 0 ? (
                  <div className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-500 flex items-center justify-between">
                    <span>No campaigns available</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ) : (
                  <CustomDropdown
                    value={formCampaignId}
                    onChange={setFormCampaignId}
                    placeholder="Select a campaign..."
                    options={campaigns.map((c) => ({
                      value: c.id,
                      label: c.name,
                      icon: <Layers className="w-3.5 h-3.5" />,
                    }))}
                  />
                )}

                {campaigns.length === 0 && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          No campaigns found
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Every activity must belong to a campaign. Please create a campaign first before scheduling activities.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80">
                      <Link
                        href="/campaigns"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Go to Campaigns & Create One
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Product Feature Teaser"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief *
                </label>
                <textarea
                  placeholder="Goals, target message, call to action..."
                  value={formBrief}
                  onChange={(e) => setFormBrief(e.target.value)}
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
                  <CustomDropdown
                    value={formPlatform}
                    onChange={setFormPlatform}
                    options={[
                      { value: "twitter", label: "Twitter / X", icon: <PlatformIcon platform="twitter" className="w-4 h-4 text-slate-900" /> },
                      { value: "instagram", label: "Instagram", icon: <PlatformIcon platform="instagram" className="w-4 h-4 text-pink-600" /> },
                      { value: "tiktok", label: "TikTok", icon: <PlatformIcon platform="tiktok" className="w-4 h-4 text-slate-900" /> },
                      { value: "linkedin", label: "LinkedIn", icon: <PlatformIcon platform="linkedin" className="w-4 h-4 text-blue-600" /> },
                      { value: "youtube", label: "YouTube", icon: <PlatformIcon platform="youtube" className="w-4 h-4 text-red-600" /> },
                      { value: "facebook", label: "Facebook", icon: <PlatformIcon platform="facebook" className="w-4 h-4 text-blue-600" /> },
                      { value: "threads", label: "Threads", icon: <PlatformIcon platform="threads" className="w-4 h-4 text-slate-900" /> },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Content Type *
                  </label>
                  <CustomDropdown
                    value={formContentType}
                    onChange={setFormContentType}
                    options={[
                      { value: "post", label: "Post", icon: <FileText className="w-3.5 h-3.5" /> },
                      { value: "reel", label: "Reel", icon: <Film className="w-3.5 h-3.5" /> },
                      { value: "video", label: "Video", icon: <Video className="w-3.5 h-3.5" /> },
                      { value: "reel_video", label: "Reel / Video", icon: <Video className="w-3.5 h-3.5" /> },
                      { value: "story", label: "Story", icon: <Sparkles className="w-3.5 h-3.5" /> },
                      { value: "thread", label: "Thread", icon: <Hash className="w-3.5 h-3.5" /> },
                      { value: "carousel", label: "Carousel", icon: <Layers className="w-3.5 h-3.5" /> },
                      { value: "article", label: "Article", icon: <FileText className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Channel <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <CustomDropdown
                  value={formChannelId}
                  onChange={setFormChannelId}
                  placeholder="No channel (None)"
                  options={[
                    { value: "", label: "No channel (None)" },
                    ...channels.map((ch) => ({
                      value: ch.id,
                      label: `#${ch.name}`,
                      subtitle: ch.platform ? ch.platform.toUpperCase() : undefined,
                      icon: <Hash className="w-3.5 h-3.5" />,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={formScheduledTime}
                    onChange={(e) => setFormScheduledTime(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Review Deadline
                  </label>
                  <CustomDropdown
                    value={formReviewDeadlineDays}
                    onChange={setFormReviewDeadlineDays}
                    options={[
                      { value: "1", label: "1 day after schedule", icon: <Clock className="w-3.5 h-3.5" /> },
                      { value: "2", label: "2 days after schedule", icon: <Clock className="w-3.5 h-3.5" /> },
                      { value: "3", label: "3 days after schedule", icon: <Clock className="w-3.5 h-3.5" /> },
                      { value: "7", label: "1 week after schedule", icon: <Clock className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </div>
              </div>

              {/* Recurrence Options */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Repeat / Recurrence</span>
                  </div>
                  {formRecurrenceRule !== "none" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      Repeating
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Frequency
                    </label>
                    <CustomDropdown
                      value={formRecurrenceRule}
                      onChange={setFormRecurrenceRule}
                      options={[
                        { value: "none", label: "Does not repeat", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "daily", label: "By day (Every day)", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "every_2_days", label: "Every 2 days", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "every_5_days", label: "Every 5 days", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "weekly", label: "Every week (Weekly)", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "weekends", label: "Only weekends (Sat & Sun)", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "specific_day", label: "On a specific day of the week", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recur Until Date (Last Day)
                    </label>
                    <input
                      type="date"
                      value={formRecurrenceEndDate}
                      onChange={(e) => setFormRecurrenceEndDate(e.target.value)}
                      disabled={formRecurrenceRule === "none"}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Events after this date are dropped
                    </span>
                  </div>
                </div>

                {formRecurrenceRule !== "none" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {formRecurrenceRule === "specific_day" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Day of Week
                        </label>
                        <CustomDropdown
                          value={formRecurrenceDay}
                          onChange={setFormRecurrenceDay}
                          options={[
                            { value: "monday", label: "Every Monday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "tuesday", label: "Every Tuesday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "wednesday", label: "Every Wednesday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "thursday", label: "Every Thursday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "friday", label: "Every Friday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "saturday", label: "Every Saturday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                            { value: "sunday", label: "Every Sunday", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
                          ]}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Occurrences
                      </label>
                      <CustomDropdown
                        value={String(formRecurrenceCount)}
                        onChange={(v) => setFormRecurrenceCount(Number(v))}
                        options={[
                          { value: "3", label: "3 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "5", label: "5 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "8", label: "8 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "10", label: "10 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "14", label: "14 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "20", label: "20 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                          { value: "30", label: "30 occurrences", icon: <Hash className="w-3.5 h-3.5" /> },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner
                  </label>
                  <CustomDropdown
                    value={formOwnerId}
                    onChange={setFormOwnerId}
                    disabled={userRole !== "admin"}
                    options={teammates.map((m) => ({
                      value: m.userId,
                      label: m.displayName || m.name,
                      subtitle: m.role ? m.role.toUpperCase() : undefined,
                      icon: <User className="w-3.5 h-3.5" />,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reviewer (Different Teammate)
                  </label>
                  <CustomDropdown
                    value={formReviewerId}
                    onChange={setFormReviewerId}
                    placeholder="Select an eligible reviewer"
                    options={[
                      { value: "", label: "Select an eligible reviewer" },
                      ...teammates
                        .filter((m) => m.userId !== formOwnerId && m.userId !== currentUser.id)
                        .map((m) => ({
                          value: m.userId,
                          label: m.displayName || m.name,
                          subtitle: m.role ? m.role.toUpperCase() : undefined,
                          icon: <User className="w-3.5 h-3.5" />,
                        })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pass Criteria
                </label>
                <textarea
                  placeholder="Required standards to pass review..."
                  value={formCriteria}
                  onChange={(e) => setFormCriteria(e.target.value)}
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              </div>

              {/* Static / Sticky Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 shrink-0 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || campaigns.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : campaigns.length === 0
                    ? "Create Campaign First"
                    : "Create & Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
