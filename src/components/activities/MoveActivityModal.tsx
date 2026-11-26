"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ArrowRight,
  ArrowLeftRight,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { FlowColumn, getColumnStyles } from "@/lib/flowColumns";

export interface Activity {
  id: string;
  title: string;
  status: string;
  socialPlatform?: string | null;
  contentType?: string | null;
  campaignName?: string | null;
  [key: string]: any;
}

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

function getTransitionHint(fromStatus: string, toStatus: string, label: string): string {
  if (toStatus === "canceled") return "Cancel this activity and archive from active production";
  if (fromStatus === "draft" && toStatus === "scheduled") return "Assign release date and place in scheduled queue";
  if (fromStatus === "draft" && toStatus === "in_progress") return `Advance straight to ${label} execution`;
  if (toStatus === "in_progress") {
    if (fromStatus === "scheduled") return `Start work and move to active ${label}`;
    if (fromStatus === "awaiting_review") return "Return for revisions and further editing";
    if (fromStatus === "failed") return "Retry execution and rework content";
    if (fromStatus === "passed") return "Reopen completed activity for updates";
    return `Move to ${label}`;
  }
  if (toStatus === "awaiting_review") return "Submit completed assets for review and approval";
  if (toStatus === "passed") return "Mark as finalized and published";
  if (toStatus === "failed") return "Mark execution as failed or missed deadline";
  if (toStatus === "scheduled") {
    if (fromStatus === "failed") return "Reschedule for a new target date";
    if (fromStatus === "in_progress") return "Postpone back to scheduled queue";
    return "Place on publishing schedule";
  }
  if (toStatus === "draft") return "Return to draft stage for editing";
  return `Transition activity to ${label}`;
}

function isReturnTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === "in_progress" && toStatus === "scheduled") return true;
  if (fromStatus === "awaiting_review" && toStatus === "in_progress") return true;
  if (fromStatus === "failed" && (toStatus === "draft" || toStatus === "scheduled")) return true;
  if (fromStatus === "passed" && (toStatus === "in_progress" || toStatus === "draft")) return true;
  if (fromStatus === "canceled" && toStatus === "draft") return true;
  return false;
}

interface MoveActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  flowColumns: FlowColumn[];
  onConfirmMove: (activityId: string, targetStatus: string) => Promise<void>;
}

export function MoveActivityModal({
  isOpen,
  onClose,
  activity,
  flowColumns,
  onConfirmMove,
}: MoveActivityModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available destination options based on CHAIN_TRANSITIONS & customized flowColumns
  const availableOptions = useMemo(() => {
    if (!activity) return [];
    const configured = CHAIN_TRANSITIONS[activity.status] || [];

    if (configured.length > 0) {
      return configured.map((t) => {
        const col = flowColumns.find((c) => c.id === t.targetStatus);
        const styles = col ? getColumnStyles(col) : null;
        const targetLabel = col?.label || t.label;

        return {
          targetStatus: t.targetStatus,
          label: targetLabel,
          step: col?.step || "→",
          dotClass: styles?.dotClass || "bg-purple-500",
          dotStyle: styles?.dotStyle,
          badgeStyle: styles?.badgeStyle,
          badgeBgClass: styles?.badgeBgClass || "bg-purple-100 text-purple-800",
          colorTheme: col?.colorTheme || "purple",
          hint: getTransitionHint(activity.status, t.targetStatus, targetLabel),
          isReturn: isReturnTransition(activity.status, t.targetStatus),
        };
      });
    }

    // Fallback: all other visible flow columns
    return flowColumns
      .filter((c) => c.id !== activity.status && !c.hidden)
      .map((col) => {
        const styles = getColumnStyles(col);
        return {
          targetStatus: col.id,
          label: col.label,
          step: col.step,
          dotClass: styles.dotClass,
          dotStyle: styles.dotStyle,
          badgeStyle: styles.badgeStyle,
          badgeBgClass: styles.badgeBgClass,
          colorTheme: col.colorTheme,
          hint: `Transition to ${col.label}`,
          isReturn: false,
        };
      });
  }, [activity, flowColumns]);

  // Set default selection when modal opens
  React.useEffect(() => {
    if (isOpen && availableOptions.length > 0) {
      setSelectedStatus(availableOptions[0].targetStatus);
    } else {
      setSelectedStatus("");
    }
  }, [isOpen, availableOptions]);

  if (!isOpen || !activity) return null;

  const currentCol = flowColumns.find((c) => c.id === activity.status);
  const currentStyles = currentCol ? getColumnStyles(currentCol) : null;
  const selectedOption = availableOptions.find((o) => o.targetStatus === selectedStatus);

  const handleConfirm = async (targetStatus?: string) => {
    const finalTarget = targetStatus || selectedStatus;
    if (!finalTarget || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirmMove(activity.id, finalTarget);
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full flex flex-col max-h-[82vh] text-slate-900 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        {/* Static Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-snug">
                Move Activity
              </h2>
              <p className="text-xs text-slate-500 truncate" title={activity.title}>
                {activity.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Current Stage Indicator */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 shrink-0">
                Current Stage:
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${currentStyles?.dotClass || "bg-slate-400"}`}
                  style={currentStyles?.dotStyle}
                />
                <span className="text-xs font-bold text-slate-800 truncate">
                  {currentCol?.label || activity.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">
              Step {currentCol?.step || "—"}
            </span>
          </div>

          {/* Destination Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Destination Stage:
            </label>

            {availableOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No workflow transitions available from this stage.
              </div>
            ) : (
              <div className="space-y-2">
                {availableOptions.map((opt) => {
                  const isSelected = selectedStatus === opt.targetStatus;
                  return (
                    <button
                      key={opt.targetStatus}
                      type="button"
                      onClick={() => setSelectedStatus(opt.targetStatus)}
                      onDoubleClick={() => handleConfirm(opt.targetStatus)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isSelected
                          ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Radio Check Circle */}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 group-hover:border-purple-400 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        {/* Step Badge */}
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${opt.badgeBgClass}`}
                          style={opt.badgeStyle}
                        >
                          {opt.step}
                        </span>

                        {/* Label & Description */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-purple-900">
                              {opt.label}
                            </span>
                            {opt.isReturn ? (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded">
                                Return
                              </span>
                            ) : opt.targetStatus === "canceled" ? (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-1.5 py-0.2 rounded">
                                Cancel
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-1.5 py-0.2 rounded">
                                Advance
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {opt.hint}
                          </p>
                        </div>
                      </div>

                      {/* Direction Icon */}
                      <div className="shrink-0 text-slate-400 group-hover:text-purple-600 transition-colors">
                        {opt.isReturn ? (
                          <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                        ) : opt.targetStatus === "canceled" ? (
                          <XCircle className="w-4 h-4 text-rose-400 group-hover:text-rose-600" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Static Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleConfirm()}
            disabled={!selectedStatus || isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Moving...</span>
              </>
            ) : (
              <>
                <span>Move to {selectedOption?.label || "Stage"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
