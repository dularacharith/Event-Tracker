"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  Calendar,
  Layers,
  X,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  AlertOctagon,
  Archive,
  Palette,
} from "lucide-react";
import { useToast, setPendingToast } from "@/components/Toast";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export interface CampaignItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  color?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  activityCount: number;
}

interface CampaignsClientProps {
  currentUser: any;
  userRole: "admin" | "member";
  initialCampaigns: CampaignItem[];
}

const COLOR_OPTIONS = [
  { id: "slate", label: "Default Slate", border: "border-slate-200", bg: "bg-white", swatch: "bg-slate-400" },
  { id: "purple", label: "Royal Purple", border: "border-purple-200", bg: "bg-purple-50/20", swatch: "bg-purple-600" },
  { id: "indigo", label: "Indigo Blue", border: "border-indigo-200", bg: "bg-indigo-50/20", swatch: "bg-indigo-600" },
  { id: "emerald", label: "Emerald Green", border: "border-emerald-200", bg: "bg-emerald-50/20", swatch: "bg-emerald-600" },
  { id: "amber", label: "Warm Amber", border: "border-amber-200", bg: "bg-amber-50/20", swatch: "bg-amber-500" },
  { id: "rose", label: "Rose Pink", border: "border-rose-200", bg: "bg-rose-50/20", swatch: "bg-rose-500" },
  { id: "cyan", label: "Ocean Cyan", border: "border-cyan-200", bg: "bg-cyan-50/20", swatch: "bg-cyan-500" },
];

const STATUS_OPTIONS: DropdownOption[] = [
  {
    value: "active",
    label: "Active",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  },
  {
    value: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
  },
  {
    value: "hold",
    label: "On Hold",
    icon: <PauseCircle className="w-4 h-4 text-amber-600" />,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: <XCircle className="w-4 h-4 text-slate-500" />,
  },
  {
    value: "failed",
    label: "Failed",
    icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
  },
  {
    value: "archived",
    label: "Archived",
    icon: <Archive className="w-4 h-4 text-purple-600" />,
  },
];

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          COMPLETED
        </span>
      );
    case "hold":
    case "on hold":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ON HOLD
        </span>
      );
    case "canceled":
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          CANCELED
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          FAILED
        </span>
      );
    case "archived":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          ARCHIVED
        </span>
      );
    case "active":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ACTIVE
        </span>
      );
  }
}

function getCardTheme(colorId?: string | null) {
  const found = COLOR_OPTIONS.find((c) => c.id === colorId);
  if (found) {
    return {
      border: found.border,
      bg: found.bg,
    };
  }
  return {
    border: "border-slate-200 hover:border-slate-300",
    bg: "bg-white",
  };
}

export function CampaignsClient({
  currentUser,
  userRole,
  initialCampaigns,
}: CampaignsClientProps) {
  const { toast } = useToast();
  const [campaignsList, setCampaignsList] = useState<CampaignItem[]>(initialCampaigns);

  // Create Campaign Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createColor, setCreateColor] = useState("slate");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Kebab menu state
  const [activeKebabId, setActiveKebabId] = useState<string | null>(null);

  // Edit Campaign Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editColor, setEditColor] = useState("slate");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation Modals state
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Close kebab dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (activeKebabId) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-kebab-container]")) {
          setActiveKebabId(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeKebabId]);

  // Handle open Edit Modal
  const openEditModal = (camp: CampaignItem) => {
    setActiveKebabId(null);
    setEditingCampaign(camp);
    setEditName(camp.name);
    setEditDescription(camp.description || "");
    setEditStatus(camp.status || "active");
    setEditColor(camp.color || "slate");
    setEditStartDate(
      camp.startDate ? new Date(camp.startDate).toISOString().slice(0, 10) : ""
    );
    setEditEndDate(
      camp.endDate ? new Date(camp.endDate).toISOString().slice(0, 10) : ""
    );
    setEditError(null);
    setEditModalOpen(true);
  };

  // Open Delete Confirmation
  const promptDeleteCampaign = (camp: CampaignItem) => {
    setActiveKebabId(null);
    setCampaignToDelete(camp);
    setConfirmDeleteOpen(true);
  };

  // Submit Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setCreateError(null);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          description: createDescription,
          color: createColor,
          startDate: createStartDate ? new Date(createStartDate).toISOString() : undefined,
          endDate: createEndDate ? new Date(createEndDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      setCampaignsList((prev) => [
        {
          id: data.campaign.id,
          name: data.campaign.name,
          description: data.campaign.description,
          status: data.campaign.status || "active",
          color: data.campaign.color || createColor,
          startDate: data.campaign.startDate,
          endDate: data.campaign.endDate,
          activityCount: 0,
        },
        ...prev,
      ]);

      toast.success("Campaign created successfully");
      setCreateModalOpen(false);
      setCreateName("");
      setCreateDescription("");
      setCreateColor("slate");
      setCreateStartDate("");
      setCreateEndDate("");
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Prompt Save Changes Confirmation
  const handlePreSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Campaign title cannot be empty");
      return;
    }
    setEditError(null);
    setConfirmSaveOpen(true);
  };

  // Execute Save Changes
  const executeSaveEdit = async () => {
    if (!editingCampaign) return;
    try {
      setEditLoading(true);
      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          status: editStatus,
          color: editColor,
          startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
          endDate: editEndDate ? new Date(editEndDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update campaign");
      }

      setCampaignsList((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                name: editName,
                description: editDescription,
                status: editStatus,
                color: editColor,
                startDate: editStartDate ? new Date(editStartDate) : null,
                endDate: editEndDate ? new Date(editEndDate) : null,
              }
            : c
        )
      );

      toast.success("Campaign updated successfully");
      setConfirmSaveOpen(false);
      setEditModalOpen(false);
      setEditingCampaign(null);
    } catch (err: any) {
      setEditError(err.message);
      setConfirmSaveOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // Execute Delete Campaign
  const executeDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete campaign");
      }

      setCampaignsList((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      toast.success("Campaign deleted successfully");
      setConfirmDeleteOpen(false);
      setCampaignToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete campaign");
      setConfirmDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">
            Group and organize related social activities, initiatives, and content sprints
          </p>
        </div>

        {userRole === "admin" && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shadow-purple-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        )}
      </div>

      {/* Campaigns Grid */}
      {campaignsList.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No campaigns created yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Create your first campaign to group related social media posts, stories, and reels
            together.
          </p>
          {userRole === "admin" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition shadow-purple-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max">
          {campaignsList.map((camp) => {
            const theme = getCardTheme(camp.color);
            const isKebabOpen = activeKebabId === camp.id;

            return (
              <div
                key={camp.id}
                className={`${theme.bg} border ${theme.border} rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between relative group`}
              >
                <div>
                  {/* Top Bar: Status Badge + Activities Count + Kebab Menu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {getStatusBadge(camp.status)}

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white/80 border border-slate-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {camp.activityCount} {camp.activityCount === 1 ? "activity" : "activities"}
                        </span>
                      </div>

                      {/* Kebab Action Menu */}
                      {userRole === "admin" && (
                        <div className="relative" data-kebab-container>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveKebabId(isKebabOpen ? null : camp.id);
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isKebabOpen
                                ? "bg-purple-100 text-purple-700"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/80"
                            }`}
                            title="Campaign Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Kebab Dropdown Menu */}
                          {isKebabOpen && (
                            <div className="absolute right-0 top-8 z-30 w-44 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl py-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(camp);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-purple-600" />
                                <span>Edit Campaign</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  promptDeleteCampaign(camp);
                                }}
                                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Campaign</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 mb-1.5">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2rem]">
                    {camp.description || "No specific description provided."}
                  </p>

                  {/* Date range if any */}
                  {(camp.startDate || camp.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 pt-2.5 border-t border-slate-100/70">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : "Start"} –{" "}
                        {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : "Ongoing"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom link to filtered Activities */}
                <div className="mt-5 pt-3 border-t border-slate-100/80 flex items-center justify-end">
                  <Link
                    href={`/activities?campaignId=${camp.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 group-hover:translate-x-0.5 transition"
                  >
                    <span>View Activities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editModalOpen && editingCampaign && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 max-w-lg w-full p-6 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Campaign</h3>
                  <p className="text-xs text-slate-500">Update title, status, color theme, and details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handlePreSaveEdit} className="space-y-4">
              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Road to 100k, Summer Launch"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                />
              </div>

              {/* Status & Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status Tag
                  </label>
                  <CustomDropdown
                    value={editStatus}
                    onChange={(val) => setEditStatus(val)}
                    options={STATUS_OPTIONS.map((opt) => {
                      const cur = (editingCampaign?.status || "active").toLowerCase().trim();
                      const isCur =
                        opt.value === cur ||
                        (opt.value === "hold" && (cur === "hold" || cur === "on hold" || cur === "on_hold")) ||
                        (opt.value === "canceled" && (cur === "canceled" || cur === "cancelled"));
                      return {
                        ...opt,
                        badge: isCur ? "Current" : undefined,
                      };
                    })}
                    placeholder="Select status..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    Card Color Theme
                  </label>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditColor(c.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer border-2 ${
                          editColor === c.id
                            ? "border-purple-600 scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        }`}
                        title={c.label}
                      >
                        <span className={`w-5 h-5 rounded-full ${c.swatch}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What is this campaign about?"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs resize-none"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-purple-500/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Save Changes */}
      <ConfirmModal
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={executeSaveEdit}
        title="Are you sure you want to save changes to this campaign?"
        description={`This will update "${editName}" with the new status, theme, and properties.`}
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        confirmVariant="purple"
        loading={editLoading}
      />

      {/* Confirmation Modal for Delete Campaign */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDeleteCampaign}
        title="Are you sure you want to delete this campaign?"
        description={
          campaignToDelete
            ? `Campaign "${campaignToDelete.name}" will be deleted. Any existing activities will remain intact but will be unlinked.`
            : "Are you sure you want to delete this task?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="rose"
        loading={deleteLoading}
      />

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 max-w-lg w-full p-6 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Campaign</h3>
                  <p className="text-xs text-slate-500">Add a new campaign initiative to your workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Road to 100k, Product Launch"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600" />
                  Card Color Theme
                </label>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCreateColor(c.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer border-2 ${
                        createColor === c.id
                          ? "border-purple-600 scale-110 shadow-sm"
                          : "border-transparent hover:scale-105"
                      }`}
                      title={c.label}
                    >
                      <span className={`w-5 h-5 rounded-full ${c.swatch}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="What is the goal of this campaign?"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
