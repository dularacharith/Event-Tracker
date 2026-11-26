"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Check,
  Plus,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react";
import {
  FlowColumn,
  COLOR_THEMES,
  ColorTheme,
  getColumnStyles,
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
  onSave: (col: FlowColumn) => void;
  onDelete?: (colId: string) => void;
  onHide?: (colId: string) => void;
}

export function ColumnEditModal({
  isOpen,
  onClose,
  column,
  isNew = false,
  existingColumns,
  onSave,
  onDelete,
  onHide,
}: ColumnEditModalProps) {
  const confirm = useConfirm();
  const [label, setLabel] = useState("");
  const [colorTheme, setColorTheme] = useState("amber");
  const [customHex, setCustomHex] = useState("");
  const [useCustomHex, setUseCustomHex] = useState(false);
  const [statusMapping, setStatusMapping] = useState("draft");

  useEffect(() => {
    if (isOpen) {
      if (column) {
        setLabel(column.label);
        setColorTheme(column.colorTheme || "amber");
        setCustomHex(column.customHex || "");
        setUseCustomHex(Boolean(column.customHex));
        setStatusMapping(column.statusMapping || column.id);
      } else {
        setLabel("");
        setColorTheme("amber");
        setCustomHex("");
        setUseCustomHex(false);
        setStatusMapping("draft");
      }
    }
  }, [isOpen, column]);

  if (!isOpen) return null;

  // Build a draft column to feed into preview
  const draftColumn: FlowColumn = {
    id: column?.id || `custom_${Date.now()}`,
    step: column?.step || `${existingColumns.length + 1}`,
    label: label.trim() || (isNew ? "New Stage" : "Untitled Card"),
    colorTheme,
    customHex: useCustomHex && customHex ? customHex : undefined,
    hidden: column?.hidden || false,
    isCustom: column?.isCustom ?? isNew,
    statusMapping: statusMapping || "draft",
  };

  const previewStyles = getColumnStyles(draftColumn);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onSave(draftColumn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              {isNew ? <Plus className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isNew ? "Create New Card / Stage" : `Edit Card: ${column?.label || ""}`}
              </h3>
              <p className="text-xs text-slate-500">
                Customize title, background, bubble, and accent colors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {/* Card Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Card Title *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. In Progress, Quality Review, Scheduled"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
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
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Live Card Preview</span>
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
                    3 tasks
                  </span>
                </div>
                <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 text-slate-600">
                  Step {draftColumn.step}
                </div>
              </div>

              {/* Sample inner activity box */}
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
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
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
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1"
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
                      className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                {isNew ? "Create Card" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
