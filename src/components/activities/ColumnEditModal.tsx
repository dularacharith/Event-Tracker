"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Palette,
  Check,
  Plus,
  Sparkles,
  Eye,
  Trash2,
  FileText,
  Play,
  Layers,
  FolderPlus,
} from "lucide-react";
import {
  FlowColumn,
  PipelineField,
  DEFAULT_PIPELINE_FIELDS,
  loadPipelineFields,
  savePipelineFields,
  getColumnFieldId,
  COLOR_THEMES,
  ColorTheme,
  getColumnStyles,
  getFieldStyles,
  PRESET_FIELD_ICONS,
  getFieldIconComponent,
} from "@/lib/flowColumns";
import { CustomDropdown, DropdownOption } from "@/components/ui/CustomDropdown";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { PlatformIcon } from "@/components/icons/PlatformIcons";

interface ColumnEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  column?: FlowColumn | null;
  isNew?: boolean;
  existingColumns: FlowColumn[];
  pipelineFields?: PipelineField[];
  onSave: (col: FlowColumn, newField?: PipelineField) => void;
  onDelete?: (colId: string) => void;
  onHide?: (colId: string) => void;
  defaultField?: string;
  activitiesCount?: number;
  defaultInLibrary?: boolean;
}

export function ColumnEditModal({
  isOpen,
  onClose,
  column,
  isNew = false,
  existingColumns,
  pipelineFields,
  onSave,
  onDelete,
  onHide,
  defaultField,
  activitiesCount = 0,
  defaultInLibrary = false,
}: ColumnEditModalProps) {
  const confirm = useConfirm();
  const [label, setLabel] = useState("");
  const [colorTheme, setColorTheme] = useState("amber");
  const [customHex, setCustomHex] = useState("");
  const [useCustomHex, setUseCustomHex] = useState(false);
  const [statusMapping, setStatusMapping] = useState("draft");

  // Pipeline Field state (Input, Execution, Outcome, or custom field)
  const [fields, setFields] = useState<PipelineField[]>(() => {
    return pipelineFields && pipelineFields.length > 0
      ? pipelineFields
      : loadPipelineFields();
  });
  const [selectedFieldId, setSelectedFieldId] = useState<string>("inputs");
  const [isAddingNewField, setIsAddingNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"input" | "execution" | "outcome" | "custom">("execution");
  const [newFieldColor, setNewFieldColor] = useState("purple");
  const [newFieldIcon, setNewFieldIcon] = useState("Zap");
  const [newFieldCreated, setNewFieldCreated] = useState<PipelineField | null>(null);
  const [previewHasActivities, setPreviewHasActivities] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentFields =
        pipelineFields && pipelineFields.length > 0
          ? pipelineFields
          : loadPipelineFields();
      setFields(currentFields);
      setIsAddingNewField(false);
      setNewFieldName("");
      setNewFieldType("execution");
      setNewFieldColor("purple");
      setNewFieldIcon("Zap");
      setNewFieldCreated(null);

      if (column) {
        setLabel(column.label);
        setColorTheme(column.colorTheme || "amber");
        setCustomHex(column.customHex || "");
        setUseCustomHex(Boolean(column.customHex));
        setStatusMapping(column.statusMapping || column.id);
        setSelectedFieldId(column.field || getColumnFieldId(column, currentFields));
        setPreviewHasActivities(activitiesCount > 0);
      } else {
        setLabel("");
        setColorTheme("amber");
        setCustomHex("");
        setUseCustomHex(false);
        const initialField = defaultField || "inputs";
        setSelectedFieldId(initialField);
        if (initialField === "inputs") setStatusMapping("draft");
        else if (initialField === "execution") setStatusMapping("in_progress");
        else setStatusMapping("awaiting_review");
        setPreviewHasActivities(false);
      }
    }
  }, [isOpen, column, defaultField, pipelineFields, activitiesCount]);

  if (!isOpen) return null;

  const handleCreateCustomField = () => {
    if (!newFieldName.trim()) return;
    const customFieldId = `custom_field_${Date.now()}`;
    const newField: PipelineField = {
      id: customFieldId,
      name: newFieldName.trim(),
      type: newFieldType,
      colorTheme: newFieldColor,
      icon: newFieldIcon,
      isCustom: true,
      description: "Custom workflow pipeline stage section.",
    };
    const updated = [...fields, newField];
    setFields(updated);
    savePipelineFields(undefined, updated);
    setSelectedFieldId(customFieldId);
    setNewFieldCreated(newField);
    setIsAddingNewField(false);
    setNewFieldName("");
  };

  const selectedField =
    fields.find((f) => f.id === selectedFieldId) ||
    fields[0] ||
    DEFAULT_PIPELINE_FIELDS[0];

  // Build a draft column to feed into preview
  const draftColumn: FlowColumn = {
    id: column?.id || `custom_${Date.now()}`,
    step: column?.step || `${existingColumns.length + 1}`,
    label: label.trim() || (isNew ? "New Stage" : "Untitled Card"),
    colorTheme,
    customHex: useCustomHex && customHex ? customHex : undefined,
    hidden: column?.hidden || false,
    inLibrary: isNew ? Boolean(defaultInLibrary) : (column?.inLibrary || false),
    isCustom: column?.isCustom ?? isNew,
    statusMapping: statusMapping || "draft",
    field: selectedFieldId,
  };

  const previewStyles = getColumnStyles(draftColumn);

  const isInput =
    selectedField.type === "input" ||
    selectedField.id === "inputs" ||
    draftColumn.field === "inputs" ||
    draftColumn.id === "draft" ||
    draftColumn.id === "scheduled";

  const addTaskLabel =
    draftColumn.id === "draft" && draftColumn.label.toLowerCase() === "draft"
      ? "Add Task"
      : draftColumn.id === "scheduled" && draftColumn.label.toLowerCase() === "scheduled"
      ? "Add Scheduled Task"
      : `Add ${draftColumn.label} Task`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onSave(draftColumn, newFieldCreated || undefined);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed top-16 inset-x-0 bottom-0 z-[75] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] sm:max-h-[640px] my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {isNew ? "Create New Card / Stage" : `Edit Card: ${column?.label || ""}`}
            </h3>
            <p className="text-[11px] text-slate-500">
              Customize title, background, bubble, and accent colors.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body with Fixed Bottom Action Bar */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">
            {/* Card Title Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Card Title *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. In Progress, Quality Review, Scheduled"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

          {/* Pipeline Field Selection (Inputs, Execution, Outcomes, or Custom Field) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pipeline Field / Section *
              </label>
              <span className="text-[11px] text-slate-400">
                Which stage group this card belongs to
              </span>
            </div>

            {/* Field selector tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fields.map((f) => {
                const isSelected = !isAddingNewField && selectedFieldId === f.id;
                const isInput = f.type === "input" || f.id === "inputs";
                const isExecution = f.type === "execution" || f.id === "execution";
                const isOutcome = f.type === "outcome" || f.id === "outcomes";
                const FieldIcon = getFieldIconComponent(f.icon, f.type);

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFieldId(f.id);
                      setIsAddingNewField(false);
                      if (isInput) setStatusMapping("draft");
                      else if (isExecution) setStatusMapping("in_progress");
                      else if (isOutcome) setStatusMapping("awaiting_review");
                    }}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                      isSelected
                        ? isInput
                          ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-500/25 shadow-xs"
                          : isExecution
                          ? "border-amber-400 bg-amber-50/80 ring-2 ring-amber-500/25 shadow-xs"
                          : isOutcome
                          ? "border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-500/25 shadow-xs"
                          : "border-purple-400 bg-purple-50/80 ring-2 ring-purple-500/25 shadow-xs"
                        : "border-slate-200/90 bg-slate-50 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <div className="flex items-center gap-1.5">
                        <FieldIcon className={`w-3.5 h-3.5 ${
                          isInput
                            ? "text-blue-600"
                            : isExecution
                            ? "text-amber-600"
                            : isOutcome
                            ? "text-emerald-600"
                            : "text-purple-600"
                        }`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {isInput
                            ? "Input"
                            : isExecution
                            ? "Execution"
                            : isOutcome
                            ? "Outcome"
                            : "Custom"}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      )}
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Field Toggle & Sub-form */}
            <div className="mt-2">
              {!isAddingNewField ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewField(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add New Pipeline Field</span>
                </button>
              ) : (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                      Add New Pipeline Field
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewField(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Field name (e.g. Quality Assurance, Staging)"
                      className="flex-1 bg-white border border-purple-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomField}
                      disabled={!newFieldName.trim()}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                    >
                      Add Field
                    </button>
                  </div>

                  {/* Field Role & Type */}
                  <div>
                    <span className="text-[10px] font-semibold text-purple-900 block mb-1">
                      Field Role / Type:
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: "input", label: "Input" },
                        { id: "execution", label: "Execution" },
                        { id: "outcome", label: "Outcome" },
                        { id: "custom", label: "Custom" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNewFieldType(t.id as any)}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer text-center ${
                            newFieldType === t.id
                              ? "bg-purple-600 border-purple-600 text-white shadow-2xs"
                              : "bg-white border-purple-200/80 text-purple-800 hover:bg-purple-100/60"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Icon Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-purple-900">
                        Preset Icon:
                      </span>
                      <span className="text-[10px] text-purple-700 font-medium">
                        {PRESET_FIELD_ICONS.find((p) => p.id === newFieldIcon)?.label || "Select icon"}
                      </span>
                    </div>
                    <div className="grid grid-cols-10 gap-1 p-1.5 bg-white border border-purple-200/80 rounded-xl">
                      {PRESET_FIELD_ICONS.map((preset) => {
                        const IconComp = preset.Icon;
                        const isSelected = newFieldIcon === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setNewFieldIcon(preset.id)}
                            className={`h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                              isSelected
                                ? "bg-purple-600 text-white shadow-xs scale-105"
                                : "text-slate-600 hover:text-purple-700 hover:bg-purple-50"
                            }`}
                            title={preset.label}
                          >
                            <IconComp className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick color selector for the new field */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-semibold text-purple-900">
                      Field Accent:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {["sky", "amber", "emerald", "purple", "indigo", "rose", "orange", "teal", "slate"].map((cId) => {
                        const theme = COLOR_THEMES.find((t) => t.id === cId);
                        if (!theme) return null;
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => setNewFieldColor(cId)}
                            className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                              newFieldColor === cId
                                ? "ring-2 ring-purple-600 scale-110 border-white shadow-2xs"
                                : "border-black/10"
                            }`}
                            style={{ backgroundColor: theme.hex }}
                            title={theme.name}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact Live Field Preview */}
                  {(() => {
                    const previewField: PipelineField = {
                      id: "inline_new_field",
                      name: newFieldName.trim() || "Field Name",
                      type: newFieldType,
                      colorTheme: newFieldColor,
                      icon: newFieldIcon,
                    };
                    const styles = getFieldStyles(previewField);
                    const IconComp = getFieldIconComponent(newFieldIcon, newFieldType);
                    const isExecution = newFieldType === "execution";

                    return (
                      <div
                        className="rounded-xl p-2.5 border-2 shadow-2xs transition-colors space-y-1.5 select-none"
                        style={{
                          backgroundColor: styles.containerBg,
                          borderColor: styles.borderColor,
                        }}
                      >
                        <div
                          className="flex items-center justify-between pb-1 border-b"
                          style={{ borderColor: styles.borderColor }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <IconComp
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: styles.hex }}
                            />
                            <span
                              className="font-bold text-[10px] uppercase tracking-wider truncate"
                              style={{ color: styles.headerText }}
                            >
                              {newFieldName.trim() || "FIELD NAME"}
                            </span>
                            {isExecution && (
                              <span
                                className="w-3.5 h-3.5 rounded-full bg-amber-200/90 text-amber-900 flex items-center justify-center text-[9px] font-extrabold shadow-2xs shrink-0"
                                title="Quality Contracts & Pass Criteria"
                              >
                                ?
                              </span>
                            )}
                          </div>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-full"
                            style={{ backgroundColor: styles.badgeBg, color: styles.headerText }}
                          >
                            0 stages
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-1.5 border border-slate-200/90 shadow-2xs flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: styles.hex }}
                            />
                            <span className="font-bold text-slate-800 uppercase tracking-wider truncate">
                              Sample Stage
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Color Selection - Theme Swatches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Card Color Theme
              </label>
              <span className="text-[11px] text-slate-400">
                Controls background, bubble dot & accent border
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {COLOR_THEMES.map((theme) => {
                const isSelected = !useCustomHex && colorTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setColorTheme(theme.id);
                      setUseCustomHex(false);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      isSelected
                        ? "shadow-2xs ring-2 ring-purple-600/30"
                        : "border-slate-200/90 bg-slate-50 hover:bg-white hover:border-slate-300"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: theme.hex,
                            backgroundColor: `${theme.hex}12`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span className="truncate text-slate-800">{theme.name}</span>
                    {isSelected && (
                      <Check
                        className="w-3.5 h-3.5 ml-auto shrink-0"
                        style={{ color: theme.hex }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Option */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={useCustomHex}
                  onChange={(e) => setUseCustomHex(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Custom hex color</span>
              </label>
              {useCustomHex && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customHex || "#8b5cf6"}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    placeholder="#8b5cf6"
                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Workflow Status Mapping (for new custom cards) */}
          {isNew && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Workflow Base Mapping
              </label>
              <CustomDropdown
                value={statusMapping}
                onChange={setStatusMapping}
                options={[
                  {
                    value: "draft",
                    label: "Draft",
                    subtitle: "Pre-scheduling stage",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />,
                  },
                  {
                    value: "scheduled",
                    label: "Scheduled",
                    subtitle: "Queue & calendar stage",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />,
                  },
                  {
                    value: "in_progress",
                    label: "In Progress",
                    subtitle: "Active execution stage",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />,
                  },
                  {
                    value: "awaiting_review",
                    label: "Awaiting Review",
                    subtitle: "Quality & proof gate",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />,
                  },
                  {
                    value: "passed",
                    label: "Completed",
                    subtitle: "Finished & published",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />,
                  },
                  {
                    value: "failed",
                    label: "Failed",
                    subtitle: "Requires revision/rework",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />,
                  },
                  {
                    value: "canceled",
                    label: "Canceled",
                    subtitle: "Dropped or archived",
                    icon: <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />,
                  },
                ]}
              />
            </div>
          )}

          {/* Live Preview of the Card */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Live Card Preview</span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setPreviewHasActivities(false)}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    !previewHasActivities ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  Empty (0 tasks)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewHasActivities(true)}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    previewHasActivities ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  With Activity
                </button>
              </div>
            </div>
            <div
              className={`rounded-2xl border ${previewStyles.borderClass} ${previewStyles.bgClass} p-4 shadow-2xs transition`}
              style={previewStyles.containerStyle}
            >
              <div className="flex items-start justify-between pb-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${previewStyles.dotClass}`}
                      style={previewStyles.dotStyle}
                    />
                    <span
                      className={`font-bold text-xs uppercase tracking-wider ${previewStyles.headerTextClass}`}
                      style={previewStyles.headerStyle}
                    >
                      {draftColumn.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 pl-5 pt-0.5">
                    {previewHasActivities
                      ? `${activitiesCount > 0 ? activitiesCount : 1} ${
                          activitiesCount === 1 || activitiesCount === 0 ? "task" : "tasks"
                        }`
                      : "0 tasks"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/90 text-slate-700 shadow-2xs">
                    {selectedField.name}
                  </span>
                  <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-slate-600">
                    Step {draftColumn.step}
                  </div>
                </div>
              </div>

              {previewHasActivities ? (
                /* Sample inner activity box */
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs text-xs space-y-1.5 mt-1">
                  <div className="font-bold text-slate-800">Sample Campaign Activity</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1">
                      <PlatformIcon platform="twitter" className="w-3 h-3 text-slate-800 shrink-0" />
                      <span>Twitter / X</span>
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                      Post
                    </span>
                  </div>
                </div>
              ) : isInput ? (
                /* Empty state for input stages matching board */
                <div className="w-full py-5 px-4 border-2 border-dashed border-slate-200/90 rounded-xl bg-white/60 flex flex-col items-center justify-center gap-1.5 text-slate-400 mt-1 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {addTaskLabel}
                  </span>
                </div>
              ) : (
                /* Empty state for non-input stages matching board */
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200/90 rounded-xl bg-white/50 mt-1 shadow-2xs">
                  No activities
                </div>
              )}
            </div>
          </div>

          </div>

          {/* Fixed Actions Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
            <div>
              {!isNew && column && (
                <div className="flex items-center gap-1">
                  {onHide && (
                    <button
                      type="button"
                      onClick={() => {
                        onHide(column.id);
                        onClose();
                      }}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Hide Card</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Are you sure you want to delete the "${column.label}" card?`,
                          description: "This card will be removed from the flow pipeline.",
                          confirmLabel: "Delete",
                          cancelLabel: "Cancel",
                        });
                        if (ok) {
                          onDelete(column.id);
                          onClose();
                        }
                      }}
                      className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer"
              >
                {isNew ? "Create Card" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
