"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Info,
  AlertCircle,
  AlignLeft,
  MoreVertical,
  Radio,
  Hash,
  Repeat,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  Share2,
  Palette,
  Settings2,
  ChevronRight,
  Users,
  Video,
  Film,
  FileText,
  Globe,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { useFilterContext } from "@/contexts/FilterContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast, setPendingToast } from "@/components/Toast";
import {
  FlowColumn,
  DEFAULT_FLOW_COLUMNS,
  loadFlowColumns,
  saveFlowColumns,
  resetFlowColumns,
  getColumnStyles,
  COLOR_THEMES,
} from "@/lib/flowColumns";
import { ColumnEditModal } from "@/components/activities/ColumnEditModal";
import { VisualFlowModal } from "@/components/activities/VisualFlowModal";
import { HowItWorksModal } from "@/components/activities/HowItWorksModal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useConfirm } from "@/components/ui/ConfirmModal";

interface ActivityItem {
  id: string;
  campaignId: string;
  campaignName?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  recurrenceRule?: string | null;
  recurrenceDay?: string | null;
  recurrenceEndDate?: Date | string | null;
  parentActivityId?: string | null;
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

function formatRecurrenceLabel(
  rule?: string | null,
  day?: string | null,
  untilDate?: Date | string | null
) {
  if (!rule || rule === "none") return "";
  let label = "";
  switch (rule) {
    case "daily":
      label = "Daily";
      break;
    case "every_2_days":
      label = "Every 2 days";
      break;
    case "every_5_days":
      label = "Every 5 days";
      break;
    case "weekly":
      label = "Weekly";
      break;
    case "weekends":
      label = "Weekends (Sat & Sun)";
      break;
    case "specific_day":
      label = day ? `Every ${day.charAt(0).toUpperCase() + day.slice(1)}` : "Weekly";
      break;
    default:
      label = rule;
  }
  if (untilDate) {
    label += ` until ${new Date(untilDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  }
  return label;
}

function formatRecurrenceBadge(rule?: string | null, day?: string | null) {
  if (!rule || rule === "none") return "";
  switch (rule) {
    case "daily":
      return "Daily";
    case "every_2_days":
      return "Every 2d";
    case "every_5_days":
      return "Every 5d";
    case "weekly":
      return "Weekly";
    case "weekends":
      return "Weekends";
    case "specific_day":
      return day ? day.slice(0, 3).toUpperCase() : "Weekly";
    default:
      return rule;
  }
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
  channels?: any[];
  teammates: any[];
  initialOpenCreate?: boolean;
  initialFilterChannel?: string;
}

const STATUS_COLUMNS = DEFAULT_FLOW_COLUMNS;

const getPlatformTagStyle = (platform: string) => {
  switch (platform?.toLowerCase()) {
    case "twitter":
      return { label: "Twitter / X", bg: "bg-sky-100 text-sky-800 border-sky-200" };
    case "instagram":
      return { label: "Instagram", bg: "bg-pink-100 text-pink-800 border-pink-200" };
    case "youtube":
      return { label: "YouTube", bg: "bg-red-100 text-red-800 border-red-200" };
    case "linkedin":
      return { label: "LinkedIn", bg: "bg-blue-100 text-blue-800 border-blue-200" };
    case "tiktok":
      return { label: "TikTok", bg: "bg-cyan-100 text-cyan-800 border-cyan-200" };
    case "facebook":
      return { label: "Facebook", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
    case "threads":
      return { label: "Threads", bg: "bg-slate-100 text-slate-800 border-slate-200" };
    default:
      return { label: platform || "Social", bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

const getContentTypeTagStyle = (type: string) => {
  switch (type?.toLowerCase()) {
    case "reel":
      return { label: "Reel", bg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" };
    case "video":
      return { label: "Video", bg: "bg-violet-100 text-violet-800 border-violet-200" };
    case "reel_video":
      return { label: "Reel / Video", bg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" };
    case "post":
      return { label: "Post", bg: "bg-amber-100 text-amber-900 border-amber-200" };
    case "story":
      return { label: "Story", bg: "bg-rose-100 text-rose-800 border-rose-200" };
    case "thread":
      return { label: "Thread", bg: "bg-teal-100 text-teal-800 border-teal-200" };
    case "carousel":
      return { label: "Carousel", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case "article":
      return { label: "Article", bg: "bg-purple-100 text-purple-800 border-purple-200" };
    default:
      return { label: type || "Content", bg: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

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
  channels = [],
  teammates,
  initialOpenCreate = false,
  initialFilterChannel = "",
}: ActivitiesClientProps) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [isTabPending, startTabTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false);

  // Collapsed Activity Cards State
  const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());

  const toggleCardCollapse = (activityId: string) => {
    setCollapsedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const areAllCollapsed =
    initialActivities.length > 0 &&
    initialActivities.every((a) => collapsedCardIds.has(a.id));

  const toggleCollapseAll = () => {
    if (areAllCollapsed) {
      setCollapsedCardIds(new Set());
    } else {
      setCollapsedCardIds(new Set(initialActivities.map((a) => a.id)));
    }
  };

  // Flow Columns & Customization State
  const [flowColumns, setFlowColumns] = useState<FlowColumn[]>(DEFAULT_FLOW_COLUMNS);
  const [editingColumn, setEditingColumn] = useState<FlowColumn | null>(null);
  const [isEditingNewColumn, setIsEditingNewColumn] = useState(false);
  const [isColumnEditModalOpen, setIsColumnEditModalOpen] = useState(false);
  const [isVisualFlowModalOpen, setIsVisualFlowModalOpen] = useState(false);
  const [activeKebabMenuColId, setActiveKebabMenuColId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadFlowColumns(currentUser?.id);
    if (loaded && loaded.length > 0) {
      setFlowColumns(loaded);
    }
  }, [currentUser?.id]);

  const updateColumns = (cols: FlowColumn[]) => {
    setFlowColumns(cols);
    saveFlowColumns(currentUser?.id, cols);
  };

  const handleResetFlow = () => {
    const defaults = resetFlowColumns(currentUser?.id);
    setFlowColumns(defaults);
    toast.success("Flow reset", "Pipeline columns restored to default configuration.");
  };

  const handleHideColumn = (colId: string) => {
    const updated = flowColumns.map((c) =>
      c.id === colId ? { ...c, hidden: true } : c
    );
    updateColumns(updated);
    if (filterStatus === colId) setFilterStatus("");
    toast.success("Card hidden", "Card removed from the flow. Restore it anytime in Configure Flow.");
  };

  const handleDeleteColumn = async (colId: string) => {
    if (flowColumns.length <= 1) {
      toast.error("Cannot delete", "At least one card must remain in the flow.");
      return;
    }
    const target = flowColumns.find((c) => c.id === colId);
    const count = initialActivities.filter((a) => a.status === colId).length;
    const ok = await confirm({
      title: `Are you sure you want to delete the "${target?.label || colId}" card?`,
      description:
        count > 0
          ? `This card has ${count} activities. Removing it will remove the card from the flow.`
          : "This will remove the card from the visual flow pipeline.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    const updated = flowColumns.filter((c) => c.id !== colId);
    updateColumns(updated);
    if (filterStatus === colId) setFilterStatus("");
    toast.success("Card deleted", `"${target?.label || colId}" has been deleted.`);
  };

  const handleQuickColorChange = (colId: string, themeId: string) => {
    const updated = flowColumns.map((c) =>
      c.id === colId ? { ...c, colorTheme: themeId, customHex: undefined, customDotHex: undefined } : c
    );
    updateColumns(updated);
    setActiveKebabMenuColId(null);
    toast.success("Color updated", "Background, bubble, and accent colors updated.");
  };

  const handleSaveColumn = (savedCol: FlowColumn) => {
    if (isEditingNewColumn) {
      const updated = [...flowColumns, savedCol];
      updateColumns(updated);
      toast.success("Card created", `"${savedCol.label}" has been added to the flow.`);
    } else {
      const updated = flowColumns.map((c) => (c.id === savedCol.id ? savedCol : c));
      updateColumns(updated);
      toast.success("Card updated", `"${savedCol.label}" updated successfully.`);
    }
  };

  const visibleColumns = flowColumns.filter((c) => !c.hidden);
  const hiddenColumns = flowColumns.filter((c) => c.hidden);

  const [activeKebabActivityId, setActiveKebabActivityId] = useState<string | null>(null);

  const handleEditActivityTitle = async (activityId: string, currentTitle: string) => {
    const newTitle = prompt("Edit activity title:", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle.trim()) return;

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update title");
      }
      toast.success("Title updated", "Activity title changed successfully.");
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to update title", err.message);
    }
  };

  const handleDeleteActivity = async (activityId: string, title: string) => {
    const ok = await confirm({
      title: "Are you sure you want to delete this task?",
      description: `"${title}" will be permanently removed.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete activity");
      }
      toast.success("Activity deleted", `"${title}" has been deleted.`);
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to delete", err.message);
    }
  };
  const {
    search,
    setSearch,
    filterCampaign,
    setFilterCampaign,
    filterChannel,
    setFilterChannel,
    filterPlatform,
    setFilterPlatform,
    filterStatus,
    setFilterStatus,
    filterOwner,
    setFilterOwner,
    resetFilters,
    activeFilterCount,
    setFilterContextData,
  } = useFilterContext();
  const [filterReviewer, setFilterReviewer] = useState("");

  useEffect(() => {
    setFilterContextData({
      campaigns,
      channels,
      teammates,
    });
    if (initialFilterChannel) {
      setFilterChannel(initialFilterChannel);
    }
  }, [campaigns, channels, teammates, initialFilterChannel, setFilterContextData, setFilterChannel]);

  const [createModalOpen, setCreateModalOpen] = useState(initialOpenCreate);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campaign state & inline creation
  const [currentCampaigns, setCurrentCampaigns] = useState<any[]>(campaigns);
  const [quickCampaignName, setQuickCampaignName] = useState("");
  const [creatingQuickCampaign, setCreatingQuickCampaign] = useState(false);
  const [quickCampaignError, setQuickCampaignError] = useState<string | null>(null);

  const handleQuickCreateCampaign = async () => {
    if (!quickCampaignName.trim()) return;
    try {
      setCreatingQuickCampaign(true);
      setQuickCampaignError(null);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickCampaignName.trim(),
          description: "Created from activity modal",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create campaign");

      toast.success("Campaign created!", `"${d.campaign.name}" has been created and selected.`);
      setCurrentCampaigns((prev) => [...prev, d.campaign]);
      setNewCampaignId(d.campaign.id);
      setQuickCampaignName("");
    } catch (err: any) {
      setQuickCampaignError(err.message);
    } finally {
      setCreatingQuickCampaign(false);
    }
  };

  // Channel state & inline creation
  const [currentChannels, setCurrentChannels] = useState<any[]>(channels || []);
  const [newChannelId, setNewChannelId] = useState("");
  const [quickChannelName, setQuickChannelName] = useState("");
  const [quickChannelOpen, setQuickChannelOpen] = useState(false);
  const [creatingQuickChannel, setCreatingQuickChannel] = useState(false);
  const [quickChannelError, setQuickChannelError] = useState<string | null>(null);

  const handleQuickCreateChannel = async () => {
    if (!quickChannelName.trim()) return;
    try {
      setCreatingQuickChannel(true);
      setQuickChannelError(null);
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickChannelName.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to create channel");

      toast.success("Channel created!", `"${d.channel.name}" has been created and selected.`);
      setCurrentChannels((prev) => [...prev, d.channel]);
      setNewChannelId(d.channel.id);
      setQuickChannelName("");
      setQuickChannelOpen(false);
    } catch (err: any) {
      setQuickChannelError(err.message);
    } finally {
      setCreatingQuickChannel(false);
    }
  };

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
  const [newRecurrenceRule, setNewRecurrenceRule] = useState<string>("none");
  const [newRecurrenceDay, setNewRecurrenceDay] = useState<string>("monday");
  const [newRecurrenceEndDate, setNewRecurrenceEndDate] = useState<string>("");
  const [newRecurrenceCount, setNewRecurrenceCount] = useState<number>(5);

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
    if (filterChannel && act.channelId !== filterChannel) return false;
    if (filterPlatform && act.socialPlatform !== filterPlatform) return false;
    if (filterStatus && act.status !== filterStatus) return false;
    if (filterOwner && act.ownerId !== filterOwner) return false;
    if (filterReviewer && act.reviewerId !== filterReviewer) return false;
    return true;
  });

  const activitiesCountByStatus = filteredActivities.reduce((acc, act) => {
    acc[act.status] = (acc[act.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

      if (!newCampaignId) throw new Error("Please select or create a campaign first");

      const body: any = {
        campaignId: newCampaignId,
        channelId: newChannelId || null,
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

      if (newRecurrenceRule && newRecurrenceRule !== "none") {
        body.recurrenceRule = newRecurrenceRule;
        if (newRecurrenceRule === "specific_day") {
          body.recurrenceDay = newRecurrenceDay;
        }
        if (newRecurrenceEndDate) {
          body.recurrenceEndDate = new Date(newRecurrenceEndDate).toISOString();
        }
        body.recurrenceCount = newRecurrenceCount;
      }

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
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your social campaign pipeline, schedule deadlines, and review proof
          </p>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setHowItWorksModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100/90 text-purple-700 text-xs font-semibold border border-purple-200/80 transition cursor-pointer shadow-2xs group"
            >
              <span className="w-4 h-4 rounded-full bg-purple-200/80 text-purple-800 flex items-center justify-center text-[10px] font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                ?
              </span>
              <span>How it works</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* List vs Board Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => {
                if (viewMode !== "board") {
                  setPendingTab("board");
                  startTabTransition(() => setViewMode("board"));
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "board" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isTabPending && pendingTab === "board" ? (
                <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              ) : (
                <Kanban className="w-3.5 h-3.5" />
              )}
              <span>Board</span>
            </button>
            <button
              onClick={() => {
                if (viewMode !== "list") {
                  setPendingTab("list");
                  startTabTransition(() => setViewMode("list"));
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isTabPending && pendingTab === "list" ? (
                <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              ) : (
                <List className="w-3.5 h-3.5" />
              )}
              <span>List</span>
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

      {/* Active Filter Indicators (When Filtered via Sidebar) */}
      {(activeFilterCount > 0 || search) && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-purple-50/80 border border-purple-200/80 rounded-2xl px-4 py-2.5 text-purple-900 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-purple-700">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Active Filters:</span>
          </div>

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Search: &quot;{search}&quot;
              <button
                type="button"
                onClick={() => setSearch("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterCampaign && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Campaign: {currentCampaigns.find((c) => c.id === filterCampaign)?.name || filterCampaign}
              <button
                type="button"
                onClick={() => setFilterCampaign("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterChannel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Channel: #{currentChannels.find((ch) => ch.id === filterChannel)?.name || filterChannel}
              <button
                type="button"
                onClick={() => setFilterChannel("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterPlatform && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Platform: {filterPlatform.toUpperCase()}
              <button
                type="button"
                onClick={() => setFilterPlatform("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterStatus && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Status: {filterStatus.replace("_", " ").toUpperCase()}
              <button
                type="button"
                onClick={() => setFilterStatus("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterOwner && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 font-medium text-xs">
              Owner: {teammates.find((m) => m.userId === filterOwner)?.displayName || "Teammate"}
              <button
                type="button"
                onClick={() => setFilterOwner("")}
                className="hover:text-purple-950 p-0.5 rounded hover:bg-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSearch("");
              resetFilters();
            }}
            className="ml-auto text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* View: Status Board (Linked Pipeline Flow & Kanban Columns) */}
      {viewMode === "board" ? (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Quick Column Jump Pills & Visual Flow Controls */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs px-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold text-[11px] mr-1">Columns:</span>
              <button
                onClick={() => {
                  setPendingTab("all-columns");
                  startTabTransition(() => setFilterStatus(""));
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                  !filterStatus
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isTabPending && pendingTab === "all-columns" && (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                )}
                <span>All {visibleColumns.length} Columns</span>
              </button>
              {visibleColumns.map((c) => {
                const styles = getColumnStyles(c);
                const count = filteredActivities.filter((a) => a.status === c.id).length;
                const isThisPending = isTabPending && pendingTab === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setPendingTab(c.id);
                      startTabTransition(() => setFilterStatus(filterStatus === c.id ? "" : c.id));
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      filterStatus === c.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {isThisPending ? (
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${styles.dotClass}`}
                        style={styles.dotStyle}
                      />
                    )}
                    <span>{c.label}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}

              {/* Hidden Columns Pill */}
              {hiddenColumns.length > 0 && (
                <button
                  onClick={() => setIsVisualFlowModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg font-semibold transition text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                  title="Click to view and restore hidden cards in the flow"
                >
                  <EyeOff className="w-3 h-3 text-amber-600" />
                  <span>{hiddenColumns.length} Hidden</span>
                </button>
              )}
            </div>

            {/* Board Controls: Collapse/Expand All & Configure Flow */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleCollapseAll}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-600 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title={areAllCollapsed ? "Expand all activity cards" : "Collapse all activity cards"}
              >
                {areAllCollapsed ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Expand All</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Collapse All</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsVisualFlowModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title="Configure Visual Flow Pipeline"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Configure Flow</span>
              </button>
            </div>
          </div>

          {/* Linked Kanban Columns Track */}
          <div className="flex items-stretch overflow-x-auto pb-4 pt-1 px-1 flex-1 min-h-[calc(100vh-270px)]">
            {visibleColumns.filter(
              (col) => !filterStatus || filterStatus === col.id
            ).map((col, idx, arr) => {
              const colActivities = filteredActivities.filter(
                (a) => a.status === col.id
              );
              const colStyles = getColumnStyles(col);

              return (
                <React.Fragment key={col.id}>
                  <div className="flex-1 min-w-[240px] max-w-[360px] shrink-0 self-stretch flex flex-col">
                    <div
                      className={`rounded-2xl border ${colStyles.borderClass} ${colStyles.bgClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition h-full flex-1 min-h-[calc(100vh-280px)]`}
                      style={colStyles.containerStyle}
                    >
                    {/* Top Column Section: Header & Cards List */}
                    <div className="flex-1 flex flex-col min-h-0">
                    {/* Column Header */}
                    <div className="flex items-start justify-between pb-1 gap-2 relative">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${colStyles.dotClass}`}
                            style={colStyles.dotStyle}
                          />
                          <span
                            className={`font-bold text-xs uppercase tracking-wider ${colStyles.headerTextClass} whitespace-nowrap truncate`}
                            style={colStyles.headerStyle}
                          >
                            {col.label}
                          </span>
                        </div>
                        <div className="pl-[18px] pt-0.5">
                          <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {colActivities.length} {colActivities.length === 1 ? "task" : "tasks"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 shrink-0 pt-0.5">
                        <button
                          onClick={() => {
                            setNewStatus(col.id === "scheduled" ? "scheduled" : "draft");
                            setCreateModalOpen(true);
                          }}
                          className="p-1 hover:text-slate-700 hover:bg-white/80 rounded-md transition cursor-pointer"
                          title={`Add task to ${col.label}`}
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveKebabMenuColId(
                              activeKebabMenuColId === col.id ? null : col.id
                            )
                          }
                          className={`p-1 hover:text-slate-700 hover:bg-white/80 rounded-md transition cursor-pointer ${
                            activeKebabMenuColId === col.id ? "text-slate-900 bg-white shadow-2xs" : "text-slate-400"
                          }`}
                          title="Card options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Kebab Dropdown Menu positioned smartly inside the Column Header */}
                      {activeKebabMenuColId === col.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveKebabMenuColId(null)}
                          />
                          <div
                            className={`absolute ${
                              idx === 0 ? "left-0" : "right-0"
                            } top-8 z-40 w-64 bg-white rounded-2xl shadow-xl shadow-purple-950/10 border border-slate-100 p-1.5 text-xs text-slate-700 animate-in fade-in-0 zoom-in-95 duration-100`}
                          >
                            {/* Change Title & Color */}
                            <button
                              onClick={() => {
                                setActiveKebabMenuColId(null);
                                setEditingColumn(col);
                                setIsEditingNewColumn(false);
                                setIsColumnEditModalOpen(true);
                              }}
                              className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                                  <Pencil className="w-3.5 h-3.5" />
                                </div>
                                <span>Edit Title & Colors</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                            </button>

                            {/* Quick Color Swatches */}
                            <div className="px-3 py-2 border-t border-slate-100 my-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Change Color Theme:
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {COLOR_THEMES.map((theme) => (
                                  <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => {
                                      handleQuickColorChange(col.id, theme.id);
                                    }}
                                    className={`w-4 h-4 rounded-full transition hover:scale-125 cursor-pointer shrink-0 border border-black/10 shadow-2xs ${
                                      col.colorTheme === theme.id ? "ring-2 ring-purple-600 ring-offset-1" : ""
                                    }`}
                                    style={{ backgroundColor: theme.hex }}
                                    title={theme.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-100 my-1" />

                            {/* Create New Card */}
                            <button
                              onClick={() => {
                                setActiveKebabMenuColId(null);
                                setEditingColumn(null);
                                setIsEditingNewColumn(true);
                                setIsColumnEditModalOpen(true);
                              }}
                              className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                                  <Plus className="w-3.5 h-3.5" />
                                </div>
                                <span>Create New Card</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                            </button>

                            {/* Hide Card */}
                            <button
                              onClick={() => {
                                setActiveKebabMenuColId(null);
                                handleHideColumn(col.id);
                              }}
                              className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-amber-500 group-hover:bg-slate-200/80 shrink-0">
                                  <EyeOff className="w-3.5 h-3.5" />
                                </div>
                                <span>Hide Card from Flow</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                            </button>

                            {/* Configure Flow */}
                            <button
                              onClick={() => {
                                setActiveKebabMenuColId(null);
                                setIsVisualFlowModalOpen(true);
                              }}
                              className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                                  <Share2 className="w-3.5 h-3.5" />
                                </div>
                                <span>Configure Flow...</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            {/* Delete Card */}
                            <button
                              onClick={() => {
                                setActiveKebabMenuColId(null);
                                handleDeleteColumn(col.id);
                              }}
                              className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </div>
                                <span>Delete Card</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Cards */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 my-2 max-h-[calc(100vh-380px)] min-h-[140px]">
                      {colActivities.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200/90 rounded-xl bg-white/50">
                          No activities
                        </div>
                      ) : (
                        colActivities.map((act) => {
                          const isCollapsed = collapsedCardIds.has(act.id);
                          const pStyle = getPlatformTagStyle(act.socialPlatform);
                          const cStyle = getContentTypeTagStyle(act.contentType);

                          const kebabMenu = (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveKebabActivityId(
                                    activeKebabActivityId === act.id ? null : act.id
                                  )
                                }
                                className="p-0.5 text-slate-300 hover:text-slate-600 rounded transition cursor-pointer"
                                title="Activity options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {activeKebabActivityId === act.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveKebabActivityId(null)}
                                  />
                                  <div className="absolute right-0 top-5 z-40 w-48 bg-white rounded-2xl shadow-xl shadow-purple-950/10 border border-slate-100 p-1.5 text-xs animate-in fade-in-0 zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveKebabActivityId(null);
                                        handleEditActivityTitle(act.id, act.title);
                                      }}
                                      className="w-full group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                                          <Pencil className="w-3 h-3" />
                                        </div>
                                        <span>Rename Title</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                    </button>
                                    <Link
                                      href={`/activities/${act.id}`}
                                      className="w-full group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                                          <ExternalLink className="w-3 h-3" />
                                        </div>
                                        <span>View Details</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                    </Link>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveKebabActivityId(null);
                                        handleDeleteActivity(act.id, act.title);
                                      }}
                                      className="w-full group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 shrink-0">
                                          <Trash2 className="w-3 h-3" />
                                        </div>
                                        <span>Delete Activity</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );

                          if (isCollapsed) {
                            return (
                              <div
                                key={act.id}
                                className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs hover:shadow-xs transition flex flex-col gap-1.5 group/card"
                              >
                                {/* Collapsed Top Row: Chevron, Title, Owner, Kebab */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleCardCollapse(act.id)}
                                      className="p-1 -ml-1 text-slate-400 hover:text-purple-600 rounded-md hover:bg-purple-50 transition cursor-pointer shrink-0"
                                      title="Expand card details"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <Link
                                      href={`/activities/${act.id}`}
                                      className="font-bold text-xs text-slate-800 hover:text-purple-600 transition truncate block"
                                      title={act.title}
                                    >
                                      {act.title}
                                    </Link>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div
                                      className="shrink-0"
                                      title={act.owner?.displayName || act.owner?.name || "Assigned owner"}
                                    >
                                      <UserAvatar
                                        name={act.owner?.displayName || act.owner?.name}
                                        avatarUrl={act.owner?.avatarUrl || act.owner?.image}
                                        size="sm"
                                      />
                                    </div>
                                    {kebabMenu}
                                  </div>
                                </div>

                                {/* Collapsed Meta Sub-row: Platform, Campaign or Content Type, Date */}
                                <div className="flex items-center justify-between gap-1 text-[10px] pl-5 text-slate-500">
                                  <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${pStyle.bg} shrink-0`}
                                    >
                                      {pStyle.label}
                                    </span>
                                    {act.campaignName ? (
                                      <span
                                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-indigo-50/70 text-indigo-700 border-indigo-100 truncate max-w-[85px]"
                                        title={act.campaignName}
                                      >
                                        {act.campaignName}
                                      </span>
                                    ) : act.contentType ? (
                                      <span
                                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${cStyle.bg} shrink-0`}
                                      >
                                        {cStyle.label}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
                                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                    <span>
                                      {act.scheduledAt
                                        ? new Date(act.scheduledAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : act.createdAt
                                        ? new Date(act.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={act.id}
                              className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:shadow transition flex flex-col gap-2.5"
                            >
                              {/* Title at top with collapse toggle and quick action menu */}
                              <div className="flex items-start justify-between gap-1.5 relative">
                                <div className="flex items-start gap-1 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleCardCollapse(act.id)}
                                    className="p-1 -ml-1 text-slate-400 hover:text-purple-600 rounded-md hover:bg-purple-50 transition cursor-pointer shrink-0 mt-0.5"
                                    title="Collapse card details"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="font-bold text-xs text-slate-900 hover:text-indigo-600 transition block line-clamp-2 leading-snug flex-1"
                                  >
                                    {act.title}
                                  </Link>
                                </div>
                                {kebabMenu}
                              </div>

                              {/* Tags row: Platform, Content Type, Channel, Campaign */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pStyle.bg}`}
                                >
                                  {pStyle.label}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cStyle.bg}`}
                                >
                                  {cStyle.label}
                                </span>
                                {act.channelName && (
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-0.5"
                                    title={`Channel: ${act.channelName}`}
                                  >
                                    <span className="opacity-70">#</span>
                                    <span>{act.channelName}</span>
                                  </span>
                                )}
                                {act.campaignName && (
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-100 max-w-[130px] truncate"
                                    title={`Campaign: ${act.campaignName}`}
                                  >
                                    {act.campaignName}
                                  </span>
                                )}
                                {act.recurrenceRule && act.recurrenceRule !== "none" && (
                                  <span
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
                                    title={`Recurring: ${formatRecurrenceLabel(act.recurrenceRule, act.recurrenceDay, act.recurrenceEndDate)}`}
                                  >
                                    <Repeat className="w-2.5 h-2.5" />
                                    <span>{formatRecurrenceBadge(act.recurrenceRule, act.recurrenceDay)}</span>
                                  </span>
                                )}
                              </div>

                              {/* Bottom row: Priority indicator [∧], Date box [📅 Jul 15, 2025], Notes [≡], Owner Avatar */}
                              <div className="flex items-center justify-between pt-1 text-slate-600">
                                <div className="flex items-center gap-1.5">
                                  {/* Priority indicator [∧] */}
                                  <div
                                    className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs ${
                                      act.status === "in_progress"
                                        ? "border-amber-200 bg-amber-50 text-amber-600"
                                        : act.status === "awaiting_review"
                                        ? "border-purple-200 bg-purple-50 text-purple-600"
                                        : act.status === "passed"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                        : act.status === "failed"
                                        ? "border-rose-200 bg-rose-50 text-rose-600"
                                        : "border-sky-200 bg-sky-50 text-sky-600"
                                    }`}
                                    title={`Status: ${act.status}`}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </div>

                                  {/* Date Box: [📅 Jun 10, 2025] */}
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-slate-50/60 text-[10px] font-medium text-slate-600">
                                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="whitespace-nowrap">
                                      {act.scheduledAt
                                        ? new Date(act.scheduledAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })
                                        : act.createdAt
                                        ? new Date(act.createdAt).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "No date"}
                                    </span>
                                  </div>

                                  {/* Notes / Details [≡] Button */}
                                  <Link
                                    href={`/activities/${act.id}`}
                                    className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                                    title="View activity details and brief"
                                  >
                                    <AlignLeft className="w-3 h-3" />
                                  </Link>
                                </div>

                                {/* Owner avatar */}
                                <div
                                  className="shrink-0"
                                  title={act.owner?.displayName || act.owner?.name || "Assigned owner"}
                                >
                                  <UserAvatar
                                    name={act.owner?.displayName || act.owner?.name}
                                    avatarUrl={act.owner?.avatarUrl || act.owner?.image}
                                    size="sm"
                                  />
                                </div>
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
                                      className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
                                    >
                                      <Play className="w-3 h-3" /> Start Work
                                    </button>
                                  )}

                                  {act.status === "scheduled" && (
                                    <button
                                      onClick={() => handleStartProgress(act.id)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
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
                                      className="flex-1 flex items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
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
                                      className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Reschedule
                                    </button>
                                  )}

                                  {act.status === "canceled" && (
                                    <button
                                      onClick={() =>
                                        handleChainTransition(act.id, "draft")
                                      }
                                      className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
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
                                  <div className="pt-0.5">
                                    <CustomDropdown
                                      value=""
                                      onChange={(targetStatus) => {
                                        if (targetStatus)
                                          handleChainTransition(act.id, targetStatus);
                                      }}
                                      placeholder="Move along chain..."
                                      size="sm"
                                      options={CHAIN_TRANSITIONS[act.status].map((t) => ({
                                        value: t.targetStatus,
                                        label: t.label,
                                        icon: <ArrowRight className="w-3.5 h-3.5" />,
                                      }))}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    </div>

                    {/* Column Footer: + Add Task */}
                    <div className="pt-2 border-t border-slate-200/50 mt-auto shrink-0">
                      <button
                        onClick={() => {
                          setNewStatus(col.id === "scheduled" ? "scheduled" : "draft");
                          setCreateModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-white/80 p-2 rounded-xl transition w-full text-left cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
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

            {/* "+ Add New Card" Column at the end of the track */}
            {!filterStatus && (
              <div className="min-w-[200px] shrink-0 self-stretch flex">
                <button
                  onClick={() => {
                    setEditingColumn(null);
                    setIsEditingNewColumn(true);
                    setIsColumnEditModalOpen(true);
                  }}
                  className="w-full h-full min-h-[calc(100vh-280px)] border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/20 transition p-4 cursor-pointer group bg-white/40"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition shadow-2xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs">Add New Card</span>
                  <span className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Insert another stage into your activity pipeline flow
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* View: Grouped List (displaying board columns as list groups) */
        <div className="space-y-4">
          {visibleColumns.filter(
            (col) => !filterStatus || filterStatus === col.id
          ).map((col) => {
            const colActivities = filteredActivities.filter(
              (a) => a.status === col.id
            );
            const colStyles = getColumnStyles(col);

            return (
              <div
                key={col.id}
                className={`bg-white rounded-2xl border ${colStyles.borderClass} shadow-2xs overflow-hidden`}
              >
                {/* Group Header */}
                <div
                  className={`p-3 sm:px-4 flex items-center justify-between ${colStyles.bgClass} border-b ${colStyles.borderClass}`}
                  style={colStyles.containerStyle}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colStyles.badgeBgClass}`}
                      style={colStyles.badgeStyle}
                    >
                      {col.step}
                    </span>
                    <span
                      className={`font-bold text-xs uppercase tracking-wider ${colStyles.headerTextClass}`}
                      style={colStyles.headerStyle}
                    >
                      {col.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {colActivities.length}
                    </span>
                  </div>

                  {col.id === "draft" && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
                      title="Create new activity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Activity</span>
                    </button>
                  )}
                </div>

                {/* Group Items / Empty State */}
                <div className="divide-y divide-slate-100">
                  {colActivities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {col.id === "draft" ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <span>No activities in Draft.</span>
                          <button
                            onClick={() => setCreateModalOpen(true)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create first draft
                          </button>
                        </div>
                      ) : (
                        <span>No activities in {col.label.toLowerCase()}</span>
                      )}
                    </div>
                  ) : (
                    colActivities.map((act) => {
                      const owner = teammates.find((m) => m.userId === act.ownerId);
                      const pStyle = getPlatformTagStyle(act.socialPlatform);
                      const cStyle = getContentTypeTagStyle(act.contentType);

                      return (
                        <div
                          key={act.id}
                          className="p-3.5 sm:p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(act.status)}
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${pStyle.bg}`}
                              >
                                {pStyle.label}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${cStyle.bg}`}
                              >
                                {cStyle.label}
                              </span>
                              {act.channelName && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200">
                                  #{act.channelName}
                                </span>
                              )}
                              {act.campaignName && (
                                <span className="text-xs text-indigo-600 font-medium">
                                  • {act.campaignName}
                                </span>
                              )}
                              {act.recurrenceRule && act.recurrenceRule !== "none" && (
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
                                  title={`Recurring: ${formatRecurrenceLabel(act.recurrenceRule, act.recurrenceDay, act.recurrenceEndDate)}`}
                                >
                                  <Repeat className="w-3 h-3" />
                                  <span>{formatRecurrenceLabel(act.recurrenceRule, act.recurrenceDay, act.recurrenceEndDate)}</span>
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

                            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                              {owner && (
                                <span className="flex items-center gap-1.5 text-slate-600">
                                  <UserAvatar
                                    name={owner.displayName || owner.name}
                                    avatarUrl={owner.avatarUrl}
                                    size="sm"
                                  />
                                  <span>{owner.displayName || owner.name}</span>
                                </span>
                              )}
                              {act.scheduledAt && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Sched: {new Date(act.scheduledAt).toLocaleDateString()}
                                </span>
                              )}
                              {act.reviewDeadline && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  Due: {new Date(act.reviewDeadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                            {/* Quick Chain Move Dropdown */}
                            {CHAIN_TRANSITIONS[act.status]?.length > 0 && (
                              <div className="w-48">
                                <CustomDropdown
                                  value=""
                                  onChange={(targetStatus) => {
                                    if (targetStatus)
                                      handleChainTransition(act.id, targetStatus);
                                  }}
                                  placeholder="Move along chain..."
                                  size="sm"
                                  options={CHAIN_TRANSITIONS[act.status].map((t) => ({
                                    value: t.targetStatus,
                                    label: t.label,
                                    icon: <ArrowRight className="w-3.5 h-3.5" />,
                                  }))}
                                />
                              </div>
                            )}

                            {act.status === "scheduled" && (
                              <button
                                onClick={() => handleStartProgress(act.id)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
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
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Activity Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 pt-20">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-900 overflow-y-auto max-h-[calc(100vh-6rem)]">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Campaign *
                  </label>
                  {currentCampaigns.length > 0 && (
                    <Link
                      href="/campaigns"
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition"
                    >
                      + Manage Campaigns
                    </Link>
                  )}
                </div>

                {currentCampaigns.length === 0 ? (
                  <div className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-500 flex items-center justify-between">
                    <span>No campaigns available</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ) : (
                  <CustomDropdown
                    value={newCampaignId}
                    onChange={setNewCampaignId}
                    placeholder="Select a campaign..."
                    options={currentCampaigns.map((c) => ({
                      value: c.id,
                      label: c.name,
                      icon: <Layers className="w-3.5 h-3.5" />,
                    }))}
                  />
                )}

                {/* Empty State Banner when no campaigns exist */}
                {currentCampaigns.length === 0 && (
                  <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 overflow-hidden">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800">
                          No campaigns found in this workspace
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Every activity must belong to a campaign. Create your first campaign below to get started.
                        </p>
                      </div>
                    </div>

                    {userRole === "admin" ? (
                      <div className="pt-2 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Enter new campaign name..."
                            value={quickCampaignName}
                            onChange={(e) => setQuickCampaignName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickCreateCampaign();
                              }
                            }}
                            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            disabled={creatingQuickCampaign || !quickCampaignName.trim()}
                            onClick={handleQuickCreateCampaign}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>{creatingQuickCampaign ? "Creating..." : "Create Campaign"}</span>
                          </button>
                        </div>
                        {quickCampaignError && (
                          <p className="text-[10px] text-rose-600 font-medium">
                            {quickCampaignError}
                          </p>
                        )}
                        <div className="pt-0.5">
                          <Link
                            href="/campaigns"
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition"
                          >
                            Or open dedicated Campaigns manager →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-slate-200/80">
                        <p className="text-[11px] text-slate-500">
                          Only workspace admins can create campaigns. Please contact an admin to set up a campaign first.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                  <CustomDropdown
                    value={newPlatform}
                    onChange={setNewPlatform}
                    options={[
                      { value: "twitter", label: "Twitter / X", icon: <span className="font-bold text-xs">𝕏</span> },
                      { value: "instagram", label: "Instagram", icon: <span className="text-pink-600 font-bold text-xs">IG</span> },
                      { value: "tiktok", label: "TikTok", icon: <span className="text-cyan-600 font-bold text-xs">TT</span> },
                      { value: "linkedin", label: "LinkedIn", icon: <span className="text-blue-600 font-bold text-xs">in</span> },
                      { value: "youtube", label: "YouTube", icon: <span className="text-red-600 font-bold text-xs">YT</span> },
                      { value: "facebook", label: "Facebook", icon: <span className="text-blue-700 font-bold text-xs">fb</span> },
                      { value: "threads", label: "Threads", icon: <span className="font-bold text-xs">@</span> },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Content Type *
                  </label>
                  <CustomDropdown
                    value={newContentType}
                    onChange={setNewContentType}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Channel <span className="font-normal text-slate-400">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickChannelOpen(!quickChannelOpen)}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    {quickChannelOpen ? "Close" : "+ Add Channel"}
                  </button>
                </div>

                <CustomDropdown
                  value={newChannelId}
                  onChange={setNewChannelId}
                  placeholder="No channel (None)"
                  options={[
                    { value: "", label: "No channel (None)" },
                    ...currentChannels.map((ch) => ({
                      value: ch.id,
                      label: `#${ch.name}`,
                      subtitle: ch.platform ? ch.platform.toUpperCase() : undefined,
                      icon: <Hash className="w-3.5 h-3.5" />,
                    })),
                  ]}
                />

                {quickChannelOpen && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">Add a publication channel (e.g. @BrandOfficial, YouTube Main):</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter channel name..."
                        value={quickChannelName}
                        onChange={(e) => setQuickChannelName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickCreateChannel();
                          }
                        }}
                        className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        disabled={creatingQuickChannel || !quickChannelName.trim()}
                        onClick={handleQuickCreateChannel}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 shrink-0 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                      >
                        {creatingQuickChannel ? "Adding..." : "Add Channel"}
                      </button>
                    </div>
                    {quickChannelError && (
                      <p className="text-[10px] text-rose-600 font-medium">{quickChannelError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <CustomDropdown
                    value={newStatus}
                    onChange={(val) => setNewStatus(val as any)}
                    options={[
                      { value: "draft", label: "Draft", subtitle: "Pre-scheduling stage", icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> },
                      { value: "scheduled", label: "Scheduled", subtitle: "Queue with deadline", icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner
                  </label>
                  <CustomDropdown
                    value={newOwnerId}
                    onChange={setNewOwnerId}
                    disabled={userRole !== "admin"}
                    options={teammates.map((m) => ({
                      value: m.userId,
                      label: m.displayName || m.name,
                      subtitle: m.role,
                      icon: <Users className="w-3.5 h-3.5" />,
                    }))}
                  />
                </div>
              </div>

              {/* Date & Recurrence Section */}
              <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Date & Recurrence</span>
                  </div>
                  {newRecurrenceRule !== "none" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <Repeat className="w-2.5 h-2.5" />
                      Recurring Event
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Scheduled Date & Time {newStatus === "scheduled" && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="datetime-local"
                      value={newScheduledAt}
                      onChange={(e) => setNewScheduledAt(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={newStatus === "scheduled"}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {newRecurrenceRule !== "none" ? "Start date for recurring series" : "Optional for Draft, required for Scheduled"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repeat Frequency
                    </label>
                    <CustomDropdown
                      value={newRecurrenceRule}
                      onChange={setNewRecurrenceRule}
                      options={[
                        { value: "none", label: "Does not repeat", icon: <X className="w-3.5 h-3.5 text-slate-400" /> },
                        { value: "daily", label: "By day (Every day)", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "every_2_days", label: "Every 2 days", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "every_5_days", label: "Every 5 days", icon: <Repeat className="w-3.5 h-3.5" /> },
                        { value: "weekly", label: "Every week (Weekly)", icon: <Calendar className="w-3.5 h-3.5" /> },
                        { value: "weekends", label: "Only weekends (Sat & Sun)", icon: <Calendar className="w-3.5 h-3.5" /> },
                        { value: "specific_day", label: "On a specific day of the week", icon: <Calendar className="w-3.5 h-3.5" /> },
                      ]}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Automatically generates recurring activities
                    </span>
                  </div>
                </div>

                {newRecurrenceRule !== "none" && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {newRecurrenceRule === "specific_day" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Select Day of Week
                        </label>
                        <CustomDropdown
                          value={newRecurrenceDay}
                          onChange={setNewRecurrenceDay}
                          options={[
                            { value: "monday", label: "Every Monday" },
                            { value: "tuesday", label: "Every Tuesday" },
                            { value: "wednesday", label: "Every Wednesday" },
                            { value: "thursday", label: "Every Thursday" },
                            { value: "friday", label: "Every Friday" },
                            { value: "saturday", label: "Every Saturday" },
                            { value: "sunday", label: "Every Sunday" },
                          ]}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Recur Until Date (Last Day)
                      </label>
                      <input
                        type="date"
                        value={newRecurrenceEndDate}
                        onChange={(e) => setNewRecurrenceEndDate(e.target.value)}
                        min={newScheduledAt ? newScheduledAt.split("T")[0] : undefined}
                        className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Events after this day will be dropped
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Occurrences
                      </label>
                      <CustomDropdown
                        value={String(newRecurrenceCount)}
                        onChange={(val) => setNewRecurrenceCount(Number(val))}
                        options={[
                          { value: "3", label: "3 occurrences" },
                          { value: "5", label: "5 occurrences" },
                          { value: "8", label: "8 occurrences" },
                          { value: "10", label: "10 occurrences" },
                          { value: "14", label: "14 occurrences" },
                          { value: "20", label: "20 occurrences" },
                          { value: "30", label: "30 occurrences" },
                        ]}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {newRecurrenceEndDate
                          ? `Up to ${newRecurrenceCount} occurrences before end date`
                          : `Creates ${newRecurrenceCount} occurrences on schedule`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {newStatus === "scheduled" && (
                <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-800">
                    Review & QA Requirements (for Scheduled status):
                  </p>
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Reviewer *
                    </label>
                    <CustomDropdown
                      value={newReviewerId}
                      onChange={setNewReviewerId}
                      placeholder="Select an eligible reviewer"
                      options={[
                        { value: "", label: "Select an eligible reviewer" },
                        ...teammates
                          .filter((m) => m.userId !== newOwnerId && m.userId !== currentUser.id)
                          .map((m) => ({
                            value: m.userId,
                            label: m.displayName || m.name,
                            subtitle: m.role,
                            icon: <Users className="w-3.5 h-3.5" />,
                          })),
                      ]}
                    />
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
                  disabled={submitting || currentCampaigns.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : currentCampaigns.length === 0
                    ? "Create Campaign First"
                    : "Create Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Edit / Create Modal */}
      <ColumnEditModal
        isOpen={isColumnEditModalOpen}
        onClose={() => setIsColumnEditModalOpen(false)}
        column={editingColumn}
        isNew={isEditingNewColumn}
        existingColumns={flowColumns}
        onSave={handleSaveColumn}
        onDelete={handleDeleteColumn}
        onHide={handleHideColumn}
      />

      {/* Visual Pipeline Architecture & Flow Modal (Inspired by Reference) */}
      <VisualFlowModal
        isOpen={isVisualFlowModalOpen}
        onClose={() => setIsVisualFlowModalOpen(false)}
        columns={flowColumns}
        onUpdateColumns={updateColumns}
        onOpenEditColumn={(col) => {
          setEditingColumn(col);
          setIsEditingNewColumn(false);
          setIsColumnEditModalOpen(true);
        }}
        onOpenCreateColumn={() => {
          setEditingColumn(null);
          setIsEditingNewColumn(true);
          setIsColumnEditModalOpen(true);
        }}
        onResetToDefault={handleResetFlow}
        activitiesCountByStatus={activitiesCountByStatus}
      />

      {/* How it Works Workflow Guide Modal */}
      <HowItWorksModal
        isOpen={howItWorksModalOpen}
        onClose={() => setHowItWorksModalOpen(false)}
      />
    </div>
  );
}
