"use client";

import React, { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  PipelineField,
  DEFAULT_FLOW_COLUMNS,
  DEFAULT_PIPELINE_FIELDS,
  loadFlowColumns,
  saveFlowColumns,
  resetFlowColumns,
  loadPipelineFields,
  savePipelineFields,
  resetPipelineFields,
  getColumnStyles,
  COLOR_THEMES,
  getCampaignTagStyle,
  getFieldStyles,
  hexToRgba,
  getColumnFieldId,
  sortColumnsByPipeline,
} from "@/lib/flowColumns";
import { ColumnEditModal } from "@/components/activities/ColumnEditModal";
import { VisualFlowModal } from "@/components/activities/VisualFlowModal";
import { HowItWorksModal } from "@/components/activities/HowItWorksModal";
import { MoveActivityModal } from "@/components/activities/MoveActivityModal";
import { ActivityDetailsModal } from "@/components/activities/ActivityDetailsModal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { ModernDateTimePicker } from "@/components/ui/ModernDateTimePicker";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { usePrompt } from "@/components/ui/PromptModal";
import { useSidebar } from "@/contexts/SidebarContext";
import { PlatformIcon } from "@/components/icons/PlatformIcons";

interface ActivityItem {
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
    { label: "Back to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Start Work", targetStatus: "in_progress", color: "text-amber-700 bg-amber-50 hover:bg-amber-100" },
    { label: "Submit Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Complete", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  in_progress: [
    { label: "Back to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
    { label: "Schedule", targetStatus: "scheduled", color: "text-blue-700 bg-blue-50 hover:bg-blue-100" },
    { label: "Submit Review", targetStatus: "awaiting_review", color: "text-purple-700 bg-purple-50 hover:bg-purple-100" },
    { label: "Complete", targetStatus: "passed", color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" },
    { label: "Fail", targetStatus: "failed", color: "text-rose-700 bg-rose-50 hover:bg-rose-100" },
    { label: "Cancel", targetStatus: "canceled", color: "text-zinc-600 bg-zinc-100 hover:bg-zinc-200" },
  ],
  awaiting_review: [
    { label: "Back to Draft", targetStatus: "draft", color: "text-slate-700 bg-slate-100 hover:bg-slate-200" },
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
  const prompt = usePrompt();
  const router = useRouter();
  const { isExpanded } = useSidebar();
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>(initialActivities);

  useEffect(() => {
    setActivitiesList(initialActivities);
  }, [initialActivities]);
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
    activitiesList.length > 0 &&
    activitiesList.every((a) => collapsedCardIds.has(a.id));

  const toggleCollapseAll = () => {
    if (areAllCollapsed) {
      setCollapsedCardIds(new Set());
    } else {
      setCollapsedCardIds(new Set(activitiesList.map((a) => a.id)));
    }
  };

  // Flow Columns & Customization State
  const [flowColumns, setFlowColumns] = useState<FlowColumn[]>(DEFAULT_FLOW_COLUMNS);
  const [pipelineFields, setPipelineFields] = useState<PipelineField[]>(DEFAULT_PIPELINE_FIELDS);
  const [defaultFieldForNewColumn, setDefaultFieldForNewColumn] = useState<string>("inputs");
  const [editingColumn, setEditingColumn] = useState<FlowColumn | null>(null);
  const [isEditingNewColumn, setIsEditingNewColumn] = useState(false);
  const [isColumnEditModalOpen, setIsColumnEditModalOpen] = useState(false);
  const [isVisualFlowModalOpen, setIsVisualFlowModalOpen] = useState(false);
  const [activeKebabMenuColId, setActiveKebabMenuColId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadedFields = loadPipelineFields(currentUser?.id);
    const activeFields = loadedFields && loadedFields.length > 0 ? loadedFields : DEFAULT_PIPELINE_FIELDS;
    if (loadedFields && loadedFields.length > 0) {
      setPipelineFields(loadedFields);
    }
    const loaded = loadFlowColumns(currentUser?.id);
    if (loaded && loaded.length > 0) {
      const sorted = sortColumnsByPipeline(loaded, activeFields);
      setFlowColumns(sorted);
    }
  }, [currentUser?.id]);

  const updateColumns = (cols: FlowColumn[]) => {
    const sorted = sortColumnsByPipeline(cols, pipelineFields);
    setFlowColumns(sorted);
    saveFlowColumns(currentUser?.id, sorted);
  };

  const updateFields = (fields: PipelineField[]) => {
    setPipelineFields(fields);
    savePipelineFields(currentUser?.id, fields);
    const sorted = sortColumnsByPipeline(flowColumns, fields);
    setFlowColumns(sorted);
    saveFlowColumns(currentUser?.id, sorted);
  };

  const handleResetFlow = () => {
    const defaults = resetFlowColumns(currentUser?.id);
    setFlowColumns(defaults);
    const defaultFields = resetPipelineFields(currentUser?.id);
    setPipelineFields(defaultFields);
    toast.success("Flow reset", "Pipeline columns and fields restored to default configuration.");
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
    const count = activitiesList.filter((a) => a.status === colId).length;
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

  const handleSaveColumn = (savedCol: FlowColumn, newField?: PipelineField) => {
    if (newField) {
      const updatedFields = [...pipelineFields, newField];
      setPipelineFields(updatedFields);
      savePipelineFields(currentUser?.id, updatedFields);
    }
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

  const visibleColumns = useMemo<FlowColumn[]>(() => {
    return sortColumnsByPipeline(
      flowColumns.filter((c) => !c.hidden),
      pipelineFields
    );
  }, [flowColumns, pipelineFields]);
  const hiddenColumns = flowColumns.filter((c) => c.hidden);

  const isInputStage = useCallback(
    (col: FlowColumn, field?: PipelineField) => {
      if (field && (field.type === "input" || field.id === "inputs")) return true;
      const fieldId = getColumnFieldId(col, pipelineFields);
      const matchedField = pipelineFields.find((f) => f.id === fieldId);
      return (
        matchedField?.type === "input" ||
        fieldId === "inputs" ||
        col.field === "inputs" ||
        col.id === "draft" ||
        col.id === "scheduled"
      );
    },
    [pipelineFields]
  );

  const getAddTaskLabel = useCallback((col: FlowColumn) => {
    if (col.id === "draft" && col.label.toLowerCase() === "draft") return "Add Task";
    if (col.id === "scheduled" && col.label.toLowerCase() === "scheduled") return "Add Scheduled Task";
    return `Add ${col.label} Task`;
  }, []);

  const [activeKebabActivityId, setActiveKebabActivityId] = useState<string | null>(null);
  const [movingActivity, setMovingActivity] = useState<ActivityItem | null>(null);
  const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<ActivityItem | null>(null);

  const handleEditActivityTitle = async (activityId: string, currentTitle: string) => {
    const newTitle = await prompt({
      title: "Rename Activity",
      description: "Enter a new title for this campaign activity.",
      defaultValue: currentTitle,
      placeholder: "e.g. New Product Launch Reel",
      confirmLabel: "Save Title",
      cancelLabel: "Cancel",
      icon: "pencil",
      confirmVariant: "purple",
    });
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
      setActivitiesList((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, title: newTitle.trim() } : a))
      );
      toast.success("Title updated", "Activity title changed successfully.");
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
      setActivitiesList((prev) => prev.filter((a) => a.id !== activityId));
      toast.success("Activity deleted", `"${title}" has been deleted.`);
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
  const [newStatus, setNewStatus] = useState<string>("draft");
  const [newRecurrenceRule, setNewRecurrenceRule] = useState<string>("none");
  const [newRecurrenceDay, setNewRecurrenceDay] = useState<string>("monday");
  const [newRecurrenceEndDate, setNewRecurrenceEndDate] = useState<string>("");
  const [newRecurrenceCount, setNewRecurrenceCount] = useState<number>(5);

  // Filtering
  const filteredActivities = activitiesList.filter((act) => {
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
        toast.error("Failed to start progress", d.error || "Action could not be completed.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to start progress");
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

      if (newScheduledAt) {
        body.scheduledAt = new Date(newScheduledAt).toISOString();
      }
      if (newReviewDeadline) {
        body.reviewDeadline = new Date(newReviewDeadline).toISOString();
      } else if (newStatus === "scheduled" && newScheduledAt) {
        // Auto-default review deadline to 24 hours after scheduledAt if omitted
        body.reviewDeadline = new Date(new Date(newScheduledAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
      }

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

      const targetCol = flowColumns.find((c) => c.id === targetStatus);
      const stageName = targetCol?.label || targetStatus.replace("_", " ");

      setActivitiesList((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? { ...a, status: targetStatus, ...(data.activity || {}) }
            : a
        )
      );

      toast.success("Activity moved!", `Successfully moved to ${stageName}.`);
      router.refresh();
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
    <div className="space-y-3.5 flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 pb-2 sm:pb-3">
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
          {/* List vs Board Toggle with sliding animated pill */}
          <div className="relative bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold select-none border border-slate-200/60 shadow-2xs w-44">
            {/* Sliding white pill indicator */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                viewMode === "board" ? "left-1 translate-x-0" : "left-1 translate-x-full"
              }`}
            />

            <button
              type="button"
              onClick={() => {
                if (viewMode !== "board") {
                  setPendingTab("board");
                  startTabTransition(() => setViewMode("board"));
                }
              }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                viewMode === "board" ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "list") {
                  setPendingTab("list");
                  startTabTransition(() => setViewMode("list"));
                }
              }}
              className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                viewMode === "list" ? "text-slate-900 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewStatus("draft");
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> New Activity
          </button>
        </div>
      </div>

      {/* Active Filter Indicators (When Filtered via Global Search or Sidebar Filters - Status is managed by Column options below) */}
      {(Boolean(search) || Boolean(filterCampaign) || Boolean(filterChannel) || Boolean(filterPlatform) || Boolean(filterOwner)) && (
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
              setFilterCampaign("");
              setFilterChannel("");
              setFilterPlatform("");
              setFilterOwner("");
            }}
            className="ml-auto text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* View: Status Board (Linked Pipeline Flow & Kanban Columns) vs Grouped List */}
      <div
        className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-out ${
          isTabPending ? "filter blur-[2px] opacity-80 pointer-events-none" : ""
        }`}
      >
        {viewMode === "board" ? (
          <div key="board-view" className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden animate-tab-slide-left">
            {/* Quick Column Jump Pills & Visual Flow Controls */}
            <div className="flex items-center justify-between gap-3 text-xs px-1 shrink-0 min-h-[36px]">
              <div className="flex items-center gap-1.5 flex-nowrap shrink overflow-x-auto no-scrollbar py-0.5 min-w-0">
                <span className="text-slate-400 font-semibold text-[11px] mr-1 shrink-0">Columns:</span>
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
                  <span>All {visibleColumns.length} Columns</span>
                </button>
                {visibleColumns.map((c) => {
                  const styles = getColumnStyles(c);
                  const count = filteredActivities.filter((a) => a.status === c.id).length;

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
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${styles.dotClass}`}
                        style={styles.dotStyle}
                      />
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
              <div className="flex items-center gap-2 shrink-0 self-center">
                <button
                  type="button"
                  onClick={toggleCollapseAll}
                  className={`h-8 rounded-xl bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-600 font-bold text-xs flex items-center justify-center shadow-2xs transition-all duration-300 ease-in-out cursor-pointer overflow-hidden ${
                    isExpanded ? "w-8 px-0" : "px-3"
                  }`}
                  title={areAllCollapsed ? "Expand all activity cards" : "Collapse all activity cards"}
                  aria-label={areAllCollapsed ? "Expand all activity cards" : "Collapse all activity cards"}
                >
                  {areAllCollapsed ? (
                    <Maximize2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  )}
                  <span
                    className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap inline-block ${
                      isExpanded
                        ? "max-w-0 opacity-0 -translate-x-1 ml-0 pointer-events-none"
                        : "max-w-[120px] opacity-100 translate-x-0 ml-1.5"
                    }`}
                  >
                    {areAllCollapsed ? "Expand All" : "Collapse All"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVisualFlowModalOpen(true)}
                  className={`h-8 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 font-bold text-xs flex items-center justify-center shadow-2xs transition-all duration-300 ease-in-out cursor-pointer overflow-hidden ${
                    isExpanded ? "w-8 px-0" : "px-3"
                  }`}
                  title="Configure Visual Flow Pipeline"
                  aria-label="Configure Visual Flow Pipeline"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span
                    className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap inline-block ${
                      isExpanded
                        ? "max-w-0 opacity-0 -translate-x-1 ml-0 pointer-events-none"
                        : "max-w-[120px] opacity-100 translate-x-0 ml-1.5"
                    }`}
                  >
                    Configure Flow
                  </span>
                </button>
              </div>
            </div>

          {/* Linked Kanban Columns Track with animated tab slide effect */}
          <div
            key={`track-${filterStatus || "all"}`}
            className="flex items-stretch overflow-x-auto pb-2 pt-1 px-1 flex-1 min-h-0 animate-tab-slide-right gap-3"
          >
            {pipelineFields.map((field, fIdx) => {
              const fieldCols = visibleColumns.filter(
                (col) => getColumnFieldId(col, pipelineFields) === field.id && (!filterStatus || filterStatus === col.id)
              );

              // If filtering by column and this field has no matching columns, hide it
              if (filterStatus && fieldCols.length === 0) return null;

              const isFirst = fIdx === 0;
              const isLast = fIdx === pipelineFields.length - 1;
              const isExecution = field.id === "execution" || field.type === "execution";
              const isInput = field.id === "inputs" || field.type === "input";
              const isOutcome = field.id === "outcomes" || field.type === "outcome";
              const fieldStyles = getFieldStyles(field);
              const nextField = !isLast ? pipelineFields[fIdx + 1] : null;

              const transitionPillText = isFirst
                ? "Start"
                : nextField && (nextField.id === "outcomes" || nextField.type === "outcome")
                ? "Verify"
                : isExecution
                ? "Verify"
                : "Proceed";

              const totalFieldTasks = fieldCols.reduce(
                (sum, c) => sum + filteredActivities.filter((a) => a.status === c.id).length,
                0
              );

              return (
                <React.Fragment key={field.id}>
                  {/* Pipeline Field Section Container */}
                  <div
                    className="shrink-0 flex flex-col h-full min-h-0 rounded-3xl border-2 p-2.5 sm:p-3 transition-all duration-200 shadow-2xs group/field"
                    style={{
                      backgroundColor: fieldStyles.containerBg,
                      borderColor: fieldStyles.borderColor,
                    }}
                  >
                    {/* Field Section Header */}
                    <div
                      className="flex items-center justify-between pb-2 mb-2 px-1 border-b shrink-0 gap-3"
                      style={{ borderColor: hexToRgba(fieldStyles.hex, 0.25) }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: hexToRgba(fieldStyles.hex, 0.15) }}
                        >
                          {isInput ? (
                            <FileText className="w-3.5 h-3.5" style={{ color: fieldStyles.hex }} />
                          ) : isExecution ? (
                            <Play className="w-3.5 h-3.5" style={{ color: fieldStyles.hex, fill: fieldStyles.hex }} />
                          ) : isOutcome ? (
                            <Layers className="w-3.5 h-3.5" style={{ color: fieldStyles.hex }} />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" style={{ color: fieldStyles.hex }} />
                          )}
                        </div>

                        <span
                          className="font-black text-xs uppercase tracking-wider truncate"
                          style={{ color: fieldStyles.headerText }}
                        >
                          {field.name}
                        </span>

                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: fieldStyles.badgeBg,
                            color: fieldStyles.headerText,
                          }}
                        >
                          {fieldCols.length} {fieldCols.length === 1 ? "stage" : "stages"} • {totalFieldTasks} {totalFieldTasks === 1 ? "task" : "tasks"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingColumn(null);
                            setIsEditingNewColumn(true);
                            setDefaultFieldForNewColumn(field.id);
                            setIsColumnEditModalOpen(true);
                          }}
                          className="h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer hover:shadow-2xs active:scale-95"
                          style={{
                            backgroundColor: hexToRgba(fieldStyles.hex, 0.15),
                            color: fieldStyles.headerText,
                          }}
                          title={`Add a new stage into ${field.name}`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span className="hidden sm:inline">Add Stage</span>
                        </button>
                      </div>
                    </div>

                    {/* Columns inside this Field Section */}
                    <div className="flex items-stretch gap-3 flex-1 min-h-0">
                      {fieldCols.length === 0 ? (
                        <div
                          className="w-64 min-w-[240px] flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center"
                          style={{ borderColor: hexToRgba(fieldStyles.hex, 0.25) }}
                        >
                          <span className="text-xs font-semibold text-slate-500 mb-2">
                            No stages in {field.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingColumn(null);
                              setIsEditingNewColumn(true);
                              setDefaultFieldForNewColumn(field.id);
                              setIsColumnEditModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                            style={{
                              backgroundColor: hexToRgba(fieldStyles.hex, 0.15),
                              color: fieldStyles.headerText,
                            }}
                          >
                            + Add Stage
                          </button>
                        </div>
                      ) : (
                        fieldCols.map((col) => {
                          const colActivities = filteredActivities.filter(
                            (a) => a.status === col.id
                          );
                          const colStyles = getColumnStyles(col);

                          return (
                            <div
                              key={col.id}
                              className="w-[280px] sm:w-[310px] shrink-0 self-stretch flex flex-col h-full min-h-0"
                            >
                    <div
                      className={`rounded-2xl border ${colStyles.borderClass} ${colStyles.bgClass} p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition h-full min-h-0`}
                      style={colStyles.containerStyle}
                    >
                    {/* Top Column Section: Header & Cards List */}
                    <div className="flex-1 flex flex-col min-h-0 relative">
                    {/* Column Header */}
                    <div className="flex items-start justify-between pb-1 gap-2 relative shrink-0">
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
                        {isInputStage(col, field) && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus(col.id);
                              setCreateModalOpen(true);
                            }}
                            className="p-1 hover:text-slate-700 hover:bg-white/80 rounded-md transition cursor-pointer"
                            title={getAddTaskLabel(col)}
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        )}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveKebabMenuColId(
                                activeKebabMenuColId === col.id ? null : col.id
                              )
                            }
                            className={`p-1 hover:text-slate-700 hover:bg-white/80 rounded-md transition cursor-pointer ${
                              activeKebabMenuColId === col.id ? "text-slate-900 bg-white shadow-2xs" : "text-slate-400"
                            }`}
                            aria-label="Column options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Kebab Dropdown Menu positioned cleanly under the column options button */}
                          {activeKebabMenuColId === col.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveKebabMenuColId(null)}
                              />
                              <div
                                className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 p-1.5 text-xs text-slate-700 animate-in fade-in-0 zoom-in-95 duration-100"
                              >
                                {/* Change Title & Color */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKebabMenuColId(null);
                                    setEditingColumn(col);
                                    setIsEditingNewColumn(false);
                                    setIsColumnEditModalOpen(true);
                                  }}
                                  className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 shrink-0">
                                      <Pencil className="w-3 h-3" />
                                    </div>
                                    <span>Edit Title & Colors</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                </button>

                                {/* Quick Color Swatches */}
                                <div className="px-2.5 py-2 border-t border-slate-100 my-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                    Change Color Theme:
                                  </span>
                                  <div className="flex items-center justify-between gap-1">
                                    {COLOR_THEMES.map((theme) => (
                                      <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => {
                                          handleQuickColorChange(col.id, theme.id);
                                        }}
                                        className={`w-4 h-4 rounded-full transition hover:scale-125 cursor-pointer shrink-0 border border-black/10 shadow-2xs ${
                                          col.colorTheme === theme.id ? "ring-2 ring-purple-600 ring-offset-1 scale-110" : ""
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
                                  type="button"
                                  onClick={() => {
                                    setActiveKebabMenuColId(null);
                                    setEditingColumn(null);
                                    setIsEditingNewColumn(true);
                                    setIsColumnEditModalOpen(true);
                                  }}
                                  className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 shrink-0">
                                      <Plus className="w-3 h-3" />
                                    </div>
                                    <span>Create New Card</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                </button>

                                {/* Hide Card */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKebabMenuColId(null);
                                    handleHideColumn(col.id);
                                  }}
                                  className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 shrink-0">
                                      <EyeOff className="w-3 h-3" />
                                    </div>
                                    <span>Hide Card from Flow</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                </button>

                                {/* Configure Flow */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKebabMenuColId(null);
                                    setIsVisualFlowModalOpen(true);
                                  }}
                                  className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 active:bg-purple-600 active:text-white transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 shrink-0">
                                      <Share2 className="w-3 h-3" />
                                    </div>
                                    <span>Configure Flow...</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                {/* Delete Card */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveKebabMenuColId(null);
                                    handleDeleteColumn(col.id);
                                  }}
                                  className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 shrink-0">
                                      <Trash2 className="w-3 h-3" />
                                    </div>
                                    <span>Delete Card</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto pr-1 my-2 pb-2">
                      {colActivities.length === 0 ? (
                        isInputStage(col, field) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus(col.id);
                              setCreateModalOpen(true);
                            }}
                            className="w-full py-5 px-4 border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-xl bg-white/60 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-purple-600 transition group cursor-pointer shadow-2xs"
                            aria-label={getAddTaskLabel(col)}
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center text-slate-500 group-hover:text-purple-600 transition">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold">
                              {getAddTaskLabel(col)}
                            </span>
                          </button>
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200/90 rounded-xl bg-white/50">
                            No activities
                          </div>
                        )
                      ) : (
                        colActivities.map((act) => {
                          const isCollapsed = collapsedCardIds.has(act.id);
                          const pStyle = getPlatformTagStyle(act.socialPlatform);
                          const cStyle = getContentTypeTagStyle(act.contentType);

                          const kebabMenu = (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveKebabActivityId(
                                    activeKebabActivityId === act.id ? null : act.id
                                  );
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                aria-label="Activity options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {activeKebabActivityId === act.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveKebabActivityId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 p-1.5 text-xs animate-in fade-in-0 zoom-in-95 duration-100">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveKebabActivityId(null);
                                        handleEditActivityTitle(act.id, act.title);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer text-left"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                        <Pencil className="w-3 h-3" />
                                      </div>
                                      <span>Rename Title</span>
                                    </button>

                                    {CHAIN_TRANSITIONS[act.status]?.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveKebabActivityId(null);
                                          setMovingActivity(act);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer text-left"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                          <ArrowRight className="w-3 h-3" />
                                        </div>
                                        <span>Move to...</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveKebabActivityId(null);
                                        setSelectedActivityForDetails(act);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition text-left cursor-pointer"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <ExternalLink className="w-3 h-3" />
                                      </div>
                                      <span>View Details</span>
                                    </button>

                                    <div className="border-t border-slate-100 my-1" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveKebabActivityId(null);
                                        handleDeleteActivity(act.id, act.title);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                        <Trash2 className="w-3 h-3" />
                                      </div>
                                      <span>Delete Activity</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );

                          const actCampaign = currentCampaigns.find(
                            (c) => c.id === act.campaignId || c.name === act.campaignName
                          );
                          const campStyle = getCampaignTagStyle(
                            actCampaign?.status || act.campaignStatus,
                            actCampaign?.color || act.campaignColor
                          );

                          return (
                            <div
                              key={act.id}
                              className={`bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs hover:shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col group/card relative ${
                                activeKebabActivityId === act.id ? "z-30" : "z-10 hover:z-30"
                              }`}
                            >
                              {/* Header row: [Collapse/Expand Button] + [Title] + [Expanded Kebab] */}
                              <div className="flex items-center justify-between gap-2 relative">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* Collapse/Expand Button styled exactly as shown on the image */}
                                  <button
                                    type="button"
                                    onClick={() => toggleCardCollapse(act.id)}
                                    className="w-7 h-7 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-sky-100 hover:border-sky-300 text-sky-600 hover:text-sky-700 flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer shadow-2xs active:scale-95 group/collapse"
                                    title={isCollapsed ? "Expand card details" : "Collapse card details"}
                                  >
                                    <ChevronUp
                                      className={`w-3.5 h-3.5 stroke-[2.2] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        isCollapsed ? "rotate-180 text-sky-500" : "rotate-0 text-sky-600"
                                      }`}
                                    />
                                  </button>

                                  {/* Activity Title (clickable for details) */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedActivityForDetails(act)}
                                    className={`font-bold text-xs text-slate-900 hover:text-purple-600 transition text-left flex-1 min-w-0 cursor-pointer ${
                                      isCollapsed ? "truncate" : "line-clamp-2 leading-snug"
                                    }`}
                                    title={act.title}
                                  >
                                    {act.title}
                                  </button>
                                </div>

                                {/* Kebab Menu for Expanded state (fades out smoothly when collapsed) */}
                                <div
                                  className={`transition-all duration-300 shrink-0 ${
                                    isCollapsed
                                      ? "opacity-0 pointer-events-none scale-90 w-0 overflow-hidden"
                                      : "opacity-100 scale-100"
                                  }`}
                                >
                                  {kebabMenu}
                                </div>
                              </div>

                              {/* Collapsed Details Row (Platform, Date) */}
                              <div
                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                  isCollapsed
                                    ? "grid-rows-[1fr] opacity-100 mt-2"
                                    : "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="flex items-center gap-2 text-[10px] pl-9">
                                    {/* Platform Badge */}
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${pStyle.bg} flex items-center gap-1 shrink-0`}
                                    >
                                      <PlatformIcon platform={act.socialPlatform} className="w-2.5 h-2.5 shrink-0" />
                                      <span>{pStyle.label}</span>
                                    </span>

                                    {/* Date */}
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0">
                                      <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
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
                                          : "No date"}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Hover Visual Display of Creator, Content Type, and Campaign on Collapsed Card */}
                              {isCollapsed && (
                                <div className="pointer-events-none absolute left-0 right-0 top-full mt-2 z-50 hidden group-hover/card:flex flex-col gap-1.5 p-3 bg-slate-900/95 text-white rounded-xl shadow-xl text-[10px] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xs border border-slate-700/60">
                                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Activity Info</span>
                                    <span className="text-[9px] text-purple-300 font-semibold">{pStyle.label}</span>
                                  </div>

                                  {/* Creator / Owner */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 shrink-0">Creator:</span>
                                    <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                                      {act.owner?.displayName || act.owner?.name || "Unassigned"}
                                    </span>
                                  </div>

                                  {/* Content Type */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-slate-400 shrink-0">Content Type:</span>
                                    <span className="font-semibold text-slate-200 capitalize truncate max-w-[140px]">
                                      {act.contentType?.replace("_", " ")}
                                    </span>
                                  </div>

                                  {/* Campaign with dynamic status color */}
                                  {act.campaignName && (
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-slate-400 shrink-0">Campaign:</span>
                                      <span className="font-semibold text-white truncate max-w-[140px] flex items-center gap-1">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${campStyle.dotClass}`}
                                          style={campStyle.dotStyle}
                                        />
                                        <span className="truncate">{act.campaignName}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Expanded Content Section (Tags, Date/Notes/Avatar, Actions) */}
                              <div
                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                  isCollapsed
                                    ? "grid-rows-[0fr] opacity-0 pointer-events-none mt-0"
                                    : "grid-rows-[1fr] opacity-100 mt-2.5"
                                }`}
                              >
                                <div className="overflow-hidden flex flex-col gap-2.5">
                                  {/* Tags row: Platform, Content Type, Channel, Campaign */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${pStyle.bg} flex items-center gap-1 shrink-0`}
                                    >
                                      <PlatformIcon platform={act.socialPlatform} className="w-2.5 h-2.5 shrink-0" />
                                      <span>{pStyle.label}</span>
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
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border max-w-[140px] truncate flex items-center gap-1.5 ${campStyle.badgeClass}`}
                                        style={campStyle.style}
                                        title={`Campaign: ${act.campaignName}${actCampaign?.status ? ` (${actCampaign.status.replace(/_/g, " ").toUpperCase()})` : ""}`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${campStyle.dotClass}`}
                                          style={campStyle.dotStyle}
                                        />
                                        <span className="truncate">{act.campaignName}</span>
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

                                  {/* Bottom row: Date box [📅 Jul 15, 2025], Notes [≡], Owner Avatar */}
                                  <div className="flex items-center justify-between pt-1 text-slate-600">
                                    <div className="flex items-center gap-1.5">
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
                                      <button
                                        type="button"
                                        onClick={() => setSelectedActivityForDetails(act)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200 bg-white hover:bg-purple-50 text-slate-500 hover:text-purple-600 transition cursor-pointer"
                                        title="View activity details and brief"
                                      >
                                        <AlignLeft className="w-3 h-3" />
                                      </button>
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
                                        <button
                                          type="button"
                                          onClick={() => setSelectedActivityForDetails(act)}
                                          className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer"
                                        >
                                          Review <ArrowRight className="w-3 h-3" />
                                        </button>
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
                                        <button
                                          type="button"
                                          onClick={() => setSelectedActivityForDetails(act)}
                                          className="flex-1 text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 px-2 rounded-lg transition cursor-pointer"
                                        >
                                          Completed ✓
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => setSelectedActivityForDetails(act)}
                                        className="text-center text-[11px] font-medium text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer"
                                      >
                                        Details
                                      </button>
                                    </div>

                                    {/* "Move to" Action Button */}
                                    {CHAIN_TRANSITIONS[act.status]?.length > 0 && (
                                      <div className="pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setMovingActivity(act)}
                                          className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/80 hover:border-purple-200 text-xs font-semibold flex items-center justify-between transition cursor-pointer group shadow-2xs"
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                                            <span>Move to</span>
                                          </span>
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    </div>
                  </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Field-to-Field Flow Connector */}
                  {!filterStatus && !isLast && (
                    <div className="hidden xl:flex flex-col items-center justify-center shrink-0 px-1 select-none self-center">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-600 hover:border-purple-300 transition group">
                        <span>{transitionPillText}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* "+" Button at the end of the track */}
            {!filterStatus && (
              <div className="shrink-0 self-stretch flex items-center justify-center px-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingColumn(null);
                    setIsEditingNewColumn(true);
                    setIsColumnEditModalOpen(true);
                  }}
                  title="Add new stage"
                  aria-label="Add new stage"
                  className="w-11 h-11 rounded-full bg-purple-100/90 hover:bg-purple-200 border border-purple-200/90 hover:border-purple-300 text-purple-600 hover:text-purple-700 shadow-2xs hover:shadow-md hover:shadow-purple-500/20 flex items-center justify-center transition-all duration-200 cursor-pointer group hover:scale-110 active:scale-95"
                >
                  <Plus className="w-5 h-5 stroke-[2.5] transition-transform duration-300 ease-out group-hover:rotate-90" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* View: Grouped List (displaying board columns as list groups) */
        <div
          key={`list-view-${filterStatus || "all"}`}
          className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 pb-4 animate-tab-slide-right"
        >
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
                    {(() => {
                      const field = pipelineFields.find(
                        (f) => f.id === getColumnFieldId(col, pipelineFields)
                      );
                      const fStyles = field ? getFieldStyles(field) : null;
                      if (!field) return null;
                      return (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1"
                          style={{
                            backgroundColor: fStyles?.badgeBg,
                            color: fStyles?.headerText,
                          }}
                        >
                          {field.name}
                        </span>
                      );
                    })()}
                  </div>

                  {isInputStage(col) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewStatus(col.id);
                        setCreateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer"
                      title={getAddTaskLabel(col)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{getAddTaskLabel(col)}</span>
                    </button>
                  )}
                </div>

                {/* Group Items / Empty State */}
                <div className="divide-y divide-slate-100">
                  {colActivities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {isInputStage(col) ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <span>No activities in {col.label}.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewStatus(col.id);
                              setCreateModalOpen(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> {getAddTaskLabel(col)}
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
                                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${pStyle.bg} flex items-center gap-1.5 shrink-0`}
                              >
                                <PlatformIcon platform={act.socialPlatform} className="w-3 h-3 shrink-0" />
                                <span>{pStyle.label}</span>
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

                            <button
                              type="button"
                              onClick={() => setSelectedActivityForDetails(act)}
                              className="font-bold text-slate-900 text-sm hover:text-purple-600 transition block truncate text-left cursor-pointer"
                            >
                              {act.title}
                            </button>

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
                            {/* "Move to" Action Button */}
                            {CHAIN_TRANSITIONS[act.status]?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setMovingActivity(act)}
                                className="bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/80 hover:border-purple-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs group shrink-0"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                                <span>Move to</span>
                              </button>
                            )}

                            {act.status === "scheduled" && (
                              <button
                                onClick={() => handleStartProgress(act.id)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" /> Start Work
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedActivityForDetails(act)}
                              className="text-xs font-medium text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
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
      </div>

      {/* Create Activity Modal */}
      {mounted && createModalOpen && createPortal(
        <div
          className="fixed top-16 inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-md z-[75] flex items-center justify-center p-4 sm:p-6 animate-in fade-in-0 duration-150 select-none overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-lg w-full flex flex-col max-h-[82vh] text-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            {/* Static / Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <h3 className="font-bold text-base text-slate-900">Create Campaign Activity</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping scrollable content and static footer */}
            <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                    Initial Status / Stage
                  </label>
                  <CustomDropdown
                    value={newStatus}
                    onChange={(val) => setNewStatus(val as string)}
                    options={
                      flowColumns.filter((c) => isInputStage(c)).length > 0
                        ? flowColumns
                            .filter((c) => isInputStage(c))
                            .map((c) => {
                              const styles = getColumnStyles(c);
                              return {
                                value: c.id,
                                label: c.label,
                                subtitle:
                                  c.id === "scheduled"
                                    ? "Queue with scheduled deadline"
                                    : c.id === "draft"
                                    ? "Pre-scheduling intake"
                                    : "Input stage task",
                                icon: (
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${styles.dotClass}`}
                                    style={styles.dotStyle}
                                  />
                                ),
                              };
                            })
                        : [
                            { value: "draft", label: "Draft", subtitle: "Pre-scheduling stage", icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> },
                            { value: "scheduled", label: "Scheduled", subtitle: "Queue with deadline", icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> },
                          ]
                    }
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
                    <ModernDateTimePicker
                      value={newScheduledAt}
                      onChange={(val) => {
                        setNewScheduledAt(val);
                        // Auto-suggest review deadline (1 day after) if currently empty
                        if (val && !newReviewDeadline && newStatus === "scheduled") {
                          try {
                            const d = new Date(val);
                            if (!isNaN(d.getTime())) {
                              const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);
                              const yr = nextDay.getFullYear();
                              const mo = String(nextDay.getMonth() + 1).padStart(2, "0");
                              const da = String(nextDay.getDate()).padStart(2, "0");
                              const ho = String(nextDay.getHours()).padStart(2, "0");
                              const mi = String(nextDay.getMinutes()).padStart(2, "0");
                              setNewReviewDeadline(`${yr}-${mo}-${da}T${ho}:${mi}`);
                            }
                          } catch {}
                        }
                      }}
                      placeholder="Select scheduled date & time..."
                      allowNoTime={true}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {newRecurrenceRule !== "none" ? "Start date for recurring series" : "Optional for Draft, time optional for Scheduled"}
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
                      <ModernDateTimePicker
                        value={newRecurrenceEndDate}
                        onChange={setNewRecurrenceEndDate}
                        dateOnly={true}
                        placeholder="Select end date..."
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
                    <ModernDateTimePicker
                      value={newReviewDeadline}
                      onChange={setNewReviewDeadline}
                      placeholder="Select review deadline..."
                      allowNoTime={false}
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
              </div>

              {/* Static / Sticky Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 shrink-0 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || currentCampaigns.length === 0}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
        </div>,
        document.body
      )}

      {/* Visual Pipeline Architecture & Flow Modal (Inspired by Reference) */}
      <VisualFlowModal
        isOpen={isVisualFlowModalOpen}
        onClose={() => setIsVisualFlowModalOpen(false)}
        columns={flowColumns}
        onUpdateColumns={updateColumns}
        pipelineFields={pipelineFields}
        onUpdateFields={updateFields}
        workspaceId={currentUser?.id}
        onOpenEditColumn={(col) => {
          setEditingColumn(col);
          setIsEditingNewColumn(false);
          setIsColumnEditModalOpen(true);
        }}
        onOpenCreateColumn={(defaultField?: string) => {
          setEditingColumn(null);
          setIsEditingNewColumn(true);
          setDefaultFieldForNewColumn(defaultField || "inputs");
          setIsColumnEditModalOpen(true);
        }}
        onResetToDefault={handleResetFlow}
        activitiesCountByStatus={activitiesCountByStatus}
      />

      {/* Column Edit / Create Modal (Layered on top of VisualFlowModal) */}
      <ColumnEditModal
        isOpen={isColumnEditModalOpen}
        onClose={() => setIsColumnEditModalOpen(false)}
        column={editingColumn}
        isNew={isEditingNewColumn}
        existingColumns={flowColumns}
        pipelineFields={pipelineFields}
        defaultField={defaultFieldForNewColumn}
        onSave={handleSaveColumn}
        onDelete={handleDeleteColumn}
        onHide={handleHideColumn}
      />

      {/* How it Works Workflow Guide Modal */}
      <HowItWorksModal
        isOpen={howItWorksModalOpen}
        onClose={() => setHowItWorksModalOpen(false)}
      />

      {/* Move Activity Workflow Modal */}
      <MoveActivityModal
        isOpen={!!movingActivity}
        onClose={() => setMovingActivity(null)}
        activity={movingActivity}
        flowColumns={flowColumns}
        onConfirmMove={handleChainTransition}
      />

      {/* Activity Quick Details Modal */}
      <ActivityDetailsModal
        isOpen={!!selectedActivityForDetails}
        onClose={() => setSelectedActivityForDetails(null)}
        activity={selectedActivityForDetails}
        flowColumns={flowColumns}
        onMoveTo={(act) => setMovingActivity(act as ActivityItem)}
        onEditTitle={(id, currentTitle) => handleEditActivityTitle(id, currentTitle)}
        onStatusChange={handleChainTransition}
      />
    </div>
  );
}
