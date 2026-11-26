"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  ArrowRight,
  Sliders,
  Plus,
  Calendar,
  Layers,
  Inbox,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  FlowColumn,
  PipelineField,
  getColumnFieldId,
  getColumnStyles,
  getFieldStyles,
  getFieldIconComponent,
  getConnectorSymbolComponent,
  getResolvedFieldConnector,
  getConnectorStyles,
} from "@/lib/flowColumns";
import { PlatformIcon } from "@/components/icons/PlatformIcons";

interface Activity {
  id: string;
  title: string;
  status: string;
  socialPlatform?: string;
  scheduledFor?: string | null;
  dueDate?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  campaignColor?: string | null;
  contentType?: string;
}

interface FieldStageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceField: PipelineField;
  fIdx: number;
  nextField: PipelineField;
  allFields: PipelineField[];
  flowColumns: FlowColumn[];
  activities: Activity[];
  onTransitionActivity: (activityId: string, targetStageId: string) => Promise<void>;
  onCreateActivityInStage: (targetStageId: string) => void;
  onOpenConnectorEdit?: () => void;
  onSavePipelineFields?: (fields: PipelineField[]) => void;
}

export function FieldStageSelectModal({
  isOpen,
  onClose,
  sourceField,
  fIdx,
  nextField,
  allFields,
  flowColumns,
  activities,
  onTransitionActivity,
  onCreateActivityInStage,
  onOpenConnectorEdit,
  onSavePipelineFields,
}: FieldStageSelectModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resolved connector styling and configuration
  const conn = useMemo(
    () => getResolvedFieldConnector(sourceField, fIdx, allFields),
    [sourceField, fIdx, allFields]
  );
  const connStyles = useMemo(() => getConnectorStyles(conn.colorTheme), [conn.colorTheme]);
  const ConnIcon = useMemo(() => getConnectorSymbolComponent(conn.icon), [conn.icon]);

  // Source stages & next stages
  const sourceStages = useMemo(
    () =>
      flowColumns.filter(
        (col) => getColumnFieldId(col, allFields) === sourceField.id && !col.hidden
      ),
    [flowColumns, allFields, sourceField]
  );

  const nextStages = useMemo(
    () =>
      flowColumns.filter(
        (col) => getColumnFieldId(col, allFields) === nextField.id && !col.hidden
      ),
    [flowColumns, allFields, nextField]
  );

  // Activities present in the source field
  const sourceActivities = useMemo(
    () =>
      activities.filter((act) =>
        sourceStages.some((stage) => stage.id === act.status)
      ),
    [activities, sourceStages]
  );

  // Destination stage selection
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);

  // Initialize or re-evaluate selections when modal opens or props change
  useEffect(() => {
    if (isOpen && nextStages.length > 0) {
      // If connector had a targetStageId that exists in nextStages, prioritize it
      const matchedConfigured = nextStages.find(
        (s) => s.id === conn.targetStageId
      );
      if (matchedConfigured) {
        setSelectedStageId(matchedConfigured.id);
      } else {
        setSelectedStageId(nextStages[0].id);
      }
    }
    if (isOpen && sourceActivities.length > 0) {
      setSelectedActivityId(sourceActivities[0].id);
    } else {
      setSelectedActivityId("");
    }
    setSaveAsDefault(false);
  }, [isOpen, nextStages, conn.targetStageId, sourceActivities]);

  if (!isOpen || !mounted) return null;

  const SourceIcon = getFieldIconComponent(sourceField.icon, sourceField.type);
  const NextIcon = getFieldIconComponent(nextField.icon, nextField.type);

  const sourceFieldStyles = getFieldStyles(sourceField);
  const nextFieldStyles = getFieldStyles(nextField);

  const selectedStage = nextStages.find((s) => s.id === selectedStageId) || nextStages[0];
  const selectedActivity = sourceActivities.find((a) => a.id === selectedActivityId);

  const handleConfirmMove = async () => {
    if (!selectedActivityId || !selectedStageId) return;

    try {
      setIsSubmitting(true);

      // Persist default target stage if checked
      if (saveAsDefault && onSavePipelineFields) {
        const updatedFields = allFields.map((f, idx) => {
          if (idx === fIdx) {
            return {
              ...f,
              connector: {
                ...(f.connector || {}),
                targetStageId: selectedStageId,
              },
            };
          }
          return f;
        });
        onSavePipelineFields(updatedFields);
      }

      await onTransitionActivity(selectedActivityId, selectedStageId);
      onClose();
    } catch (err) {
      console.error("Transition failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInSelectedStage = () => {
    if (!selectedStageId) return;
    onCreateActivityInStage(selectedStageId);
    onClose();
  };

  const handleSaveDefaultStageOnly = () => {
    if (!selectedStageId || !onSavePipelineFields) return;
    const updatedFields = allFields.map((f, idx) => {
      if (idx === fIdx) {
        return {
          ...f,
          connector: {
            ...(f.connector || {}),
            targetStageId: selectedStageId,
          },
        };
      }
      return f;
    });
    onSavePipelineFields(updatedFields);
    onClose();
  };

  return createPortal(
    <div
      className="fixed top-16 inset-x-0 bottom-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md select-none animate-in fade-in duration-150 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)] sm:max-h-[660px] my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs"
              style={{
                backgroundColor: connStyles.badgeBg,
                borderColor: connStyles.border,
                color: connStyles.text,
              }}
            >
              {ConnIcon ? (
                <ConnIcon className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Select Stage in {nextField.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose the destination stage to advance activities into
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenConnectorEdit && (
              <button
                type="button"
                onClick={onOpenConnectorEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition border border-slate-200/80 hover:border-purple-200 cursor-pointer shadow-2xs"
                title="Customize button style & label"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customize Button</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pipeline Transition Path Pill */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Source Field Pill */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border shadow-2xs"
              style={{
                backgroundColor: sourceFieldStyles.badgeBg,
                color: sourceFieldStyles.headerText,
                borderColor: sourceFieldStyles.borderColor,
              }}
            >
              {SourceIcon && <SourceIcon className="w-3.5 h-3.5" />}
              <span>{sourceField.name}</span>
            </span>

            {/* Transition Connector Button Representation */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border-2 shadow-2xs"
              style={{
                borderColor: connStyles.border,
                color: connStyles.text,
                backgroundColor: "#ffffff",
              }}
            >
              {ConnIcon && <ConnIcon className="w-3 h-3" />}
              {conn.label && <span>{conn.label}</span>}
            </span>

            {/* Next Field Pill */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border shadow-2xs"
              style={{
                backgroundColor: nextFieldStyles.badgeBg,
                color: nextFieldStyles.headerText,
                borderColor: nextFieldStyles.borderColor,
              }}
            >
              {NextIcon && <NextIcon className="w-3.5 h-3.5" />}
              <span>{nextField.name}</span>
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            {nextStages.length} {nextStages.length === 1 ? "stage" : "stages"} available
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 min-h-0 text-slate-800">
          {/* Section 1: Destination Stage Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Next Field Stage ({nextField.name})</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Click a stage card to select
              </span>
            </div>

            {nextStages.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No visible stages in {nextField.name}. Open Configure Flow to add or unhide stages.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nextStages.map((stage) => {
                  const isSelected = selectedStageId === stage.id;
                  const colStyles = getColumnStyles(stage);
                  const stageTasksCount = activities.filter(
                    (a) => a.status === stage.id
                  ).length;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setSelectedStageId(stage.id)}
                      className={`relative p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 shadow-2xs group ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/20 shadow-xs"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={colStyles.dotStyle}
                          />
                          <span className="font-bold text-xs text-slate-900 group-hover:text-purple-700 transition truncate">
                            {stage.label}
                          </span>
                        </div>

                        {/* Selected Radio Indicator */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 bg-white group-hover:border-slate-400"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="capitalize text-[10px] font-semibold text-slate-500">
                          {stage.step && stage.step !== "→"
                            ? `Step ${stage.step}`
                            : `${nextField.type} Stage`}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            stageTasksCount > 0
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {stageTasksCount} {stageTasksCount === 1 ? "task" : "tasks"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Activity Selection to Move */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  Activities in {sourceField.name} ({sourceActivities.length})
                </span>
              </label>
              {sourceActivities.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Select activity to advance
                </span>
              )}
            </div>

            {sourceActivities.length > 0 ? (
              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {sourceActivities.map((act) => {
                  const isActSelected = selectedActivityId === act.id;
                  const currentStageCol = flowColumns.find((c) => c.id === act.status);
                  const currentStyles = currentStageCol ? getColumnStyles(currentStageCol) : null;

                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                        isActSelected
                          ? "border-purple-600 bg-purple-50/20 ring-1 ring-purple-500/20"
                          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                            isActSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isActSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {act.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                            {act.socialPlatform && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                <PlatformIcon
                                  platform={act.socialPlatform}
                                  className="w-2.5 h-2.5"
                                />
                                <span className="capitalize">{act.socialPlatform}</span>
                              </span>
                            )}
                            {currentStageCol && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[10px]"
                                style={{
                                  backgroundColor: currentStyles?.badgeBgClass
                                    ? undefined
                                    : "rgba(100, 116, 139, 0.1)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={currentStyles?.dotStyle}
                                />
                                <span>{currentStageCol.label}</span>
                              </span>
                            )}
                            {act.scheduledFor && (
                              <span className="text-slate-400 flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>
                                  {new Date(act.scheduledFor).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-4 h-4 shrink-0 transition ${
                          isActSelected
                            ? "text-purple-600 translate-x-0.5"
                            : "text-slate-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    No activities currently in {sourceField.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                    You can create a new activity directly in the selected stage ({selectedStage?.label}) or save this stage as the default destination.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateInSelectedStage}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Activity in {selectedStage?.label || "Selected Stage"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Default Stage Preference */}
          {onSavePipelineFields && selectedStage && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium">
                Remember <strong className="text-purple-700">{selectedStage.label}</strong> as default target stage for this transition button
              </span>
            </label>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {sourceActivities.length === 0 ? (
              <>
                {onSavePipelineFields && selectedStage && (
                  <button
                    type="button"
                    onClick={handleSaveDefaultStageOnly}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Set as Default Stage
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCreateInSelectedStage}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Activity in {selectedStage?.label}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConfirmMove}
                disabled={isSubmitting || !selectedActivityId || !selectedStageId}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                  isSubmitting || !selectedActivityId || !selectedStageId
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-sm active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Moving...</span>
                  </>
                ) : (
                  <>
                    <span>
                      Move to {selectedStage?.label || "Selected Stage"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
