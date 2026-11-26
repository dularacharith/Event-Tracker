"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Trash2,
  Palette,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Layers,
  Share2,
  Calendar,
  FileText,
  Play,
  RotateCw,
} from "lucide-react";
import {
  FlowColumn,
  COLOR_THEMES,
  getColumnStyles,
} from "@/lib/flowColumns";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/Toast";

interface VisualFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: FlowColumn[];
  onUpdateColumns: (cols: FlowColumn[]) => void;
  onOpenEditColumn: (col: FlowColumn) => void;
  onOpenCreateColumn: () => void;
  onResetToDefault: () => void;
  activitiesCountByStatus: Record<string, number>;
}

export function VisualFlowModal({
  isOpen,
  onClose,
  columns,
  onUpdateColumns,
  onOpenEditColumn,
  onOpenCreateColumn,
  onResetToDefault,
  activitiesCountByStatus,
}: VisualFlowModalProps) {
  const confirm = useConfirm();
  const { toast } = useToast();
  const [selectedColId, setSelectedColId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleHide = (colId: string) => {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, hidden: !c.hidden } : c
    );
    onUpdateColumns(updated);
  };

  const moveLeft = (index: number) => {
    if (index <= 0) return;
    const newCols = [...columns];
    const temp = newCols[index - 1];
    newCols[index - 1] = newCols[index];
    newCols[index] = temp;
    onUpdateColumns(newCols);
  };

  const moveRight = (index: number) => {
    if (index >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[index + 1];
    newCols[index + 1] = newCols[index];
    newCols[index] = temp;
    onUpdateColumns(newCols);
  };

  const changeTheme = (colId: string, themeId: string) => {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, colorTheme: themeId, customHex: undefined } : c
    );
    onUpdateColumns(updated);
  };

  const deleteColumn = async (colId: string) => {
    if (columns.length <= 1) {
      toast.error("Cannot remove stage", "You must have at least one card in the flow.");
      return;
    }
    const target = columns.find((c) => c.id === colId);
    const ok = await confirm({
      title: `Are you sure you want to delete the "${target?.label || colId}" card?`,
      description: "This card will be removed from the visual flow pipeline.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (ok) {
      onUpdateColumns(columns.filter((c) => c.id !== colId));
    }
  };

  const unhideAll = () => {
    onUpdateColumns(columns.map((c) => ({ ...c, hidden: false })));
  };

  const visibleCount = columns.filter((c) => !c.hidden).length;
  const hiddenCount = columns.filter((c) => c.hidden).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:px-6 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Activity Pipeline Flow Architecture
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {visibleCount} Active Stages {hiddenCount > 0 && `• ${hiddenCount} Hidden`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visual flow configuration: reorder stages, customize colors, toggle visibility, and configure transitions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {hiddenCount > 0 && (
              <button
                onClick={unhideAll}
                className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Unhide All ({hiddenCount})</span>
              </button>
            )}
            <button
              onClick={onOpenCreateColumn}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage / Card</span>
            </button>
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: "Reset the entire flow pipeline?",
                  description: "Restore the original default 7 columns and pipeline stages.",
                  confirmLabel: "Reset Flow",
                  cancelLabel: "Cancel",
                });
                if (ok) {
                  onResetToDefault();
                }
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="Reset to default flow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Pipeline Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-100/40">
          {/* Reference-Styled Visual Architecture Diagram */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interactive Pipeline Diagram
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Click any stage card to adjust colors, visibility, or order
              </span>
            </div>

            {/* Architecture Flow Canvas (Inspired by Reference Image) */}
            <div className="relative py-4 overflow-x-auto">
              <div className="min-w-[960px] flex items-center justify-between gap-4 relative">
                {/* 1. INPUT SOURCES (Left) */}
                <div className="flex flex-col gap-3 w-56 shrink-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>Inputs & Initiation</span>
                  </div>

                  {columns
                    .slice(0, 2)
                    .map((col, idx) => {
                      const styles = getColumnStyles(col);
                      const count = activitiesCountByStatus[col.id] || 0;
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColId(col.id)}
                          className={`rounded-xl border p-3 transition cursor-pointer relative ${
                            col.hidden ? "opacity-50 border-dashed border-slate-300 bg-slate-50" : styles.borderClass
                          } ${styles.bgClass} ${selectedColId === col.id ? "ring-2 ring-indigo-500 shadow-md" : "hover:shadow-xs"}`}
                          style={styles.containerStyle}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dotClass}`}
                                style={styles.dotStyle}
                              />
                              <span
                                className={`font-bold text-xs uppercase tracking-wider truncate ${styles.headerTextClass}`}
                                style={styles.headerStyle}
                              >
                                {col.label}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title={col.hidden ? "Show in flow" : "Hide from flow"}
                            >
                              {col.hidden ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{count} {count === 1 ? "task" : "tasks"}</span>
                            {col.hidden && (
                              <span className="text-[10px] text-rose-600 font-semibold">Hidden from flow</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Curved SVG Connector from Inputs to Center Hub */}
                <div className="w-16 h-28 relative shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 64 112">
                    <path
                      d="M 0 32 C 32 32, 32 56, 64 56"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 80 C 32 80, 32 56, 64 56"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute top-1/2 -translate-y-1/2 bg-white px-1 py-0.5 rounded border border-slate-200 text-[9px] font-bold text-slate-500 shadow-2xs">
                    Start
                  </div>
                </div>

                {/* 2. CENTRAL PROCESSING HUB (In Progress / Active Work) */}
                <div className="w-64 shrink-0 flex flex-col items-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                    <Play className="w-3 h-3 text-amber-500" />
                    <span>Active Execution Hub</span>
                  </div>

                  {columns
                    .filter((c) => c.id === "in_progress" || c.step === "3")
                    .slice(0, 1)
                    .map((col) => {
                      const styles = getColumnStyles(col);
                      const count = activitiesCountByStatus[col.id] || 0;
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColId(col.id)}
                          className={`w-full rounded-2xl p-4 transition cursor-pointer shadow-md text-white bg-slate-900 border-2 ${
                            selectedColId === col.id ? "ring-4 ring-indigo-500/40 border-indigo-400" : "border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded-full shrink-0 ${styles.dotClass}`}
                                style={styles.dotStyle}
                              />
                              <span className="font-extrabold text-xs uppercase tracking-wider text-amber-400">
                                {col.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300">
                              Core Engine
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            Content creation, recording, editing, and task authoring in real time.
                          </p>
                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                            <span className="font-semibold text-white">{count} in progress</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {col.hidden ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* DATA CONTRACTS / QUALITY GATE BELOW HUB (Like Reference Image) */}
                  <div className="mt-3 w-full bg-purple-50/80 border border-purple-200 rounded-xl p-3 flex items-start gap-2 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <div className="font-bold text-purple-900">Quality Contracts & Pass Criteria</div>
                      <p className="text-purple-700/80 text-[10px] leading-tight">
                        Enforces reviewer sign-off, checklist criteria, and proof evidence before completion.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Curved SVG Connector from Hub to Verification & Outcomes */}
                <div className="w-16 h-28 relative shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 64 112">
                    <path
                      d="M 0 56 C 32 56, 32 24, 64 24"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 56 C 32 56, 32 88, 64 88"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute top-1/2 -translate-y-1/2 bg-white px-1 py-0.5 rounded border border-slate-200 text-[9px] font-bold text-slate-500 shadow-2xs">
                    Verify
                  </div>
                </div>

                {/* 3. VERIFICATION & OUTCOME DESTINATIONS (Right) */}
                <div className="flex flex-col gap-2.5 w-64 shrink-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>Outcomes & Destinations</span>
                  </div>

                  {columns
                    .slice(3)
                    .map((col) => {
                      const styles = getColumnStyles(col);
                      const count = activitiesCountByStatus[col.id] || 0;
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColId(col.id)}
                          className={`rounded-xl border p-2.5 transition cursor-pointer relative ${
                            col.hidden ? "opacity-50 border-dashed border-slate-300 bg-slate-50" : styles.borderClass
                          } ${styles.bgClass} ${selectedColId === col.id ? "ring-2 ring-indigo-500 shadow-md" : "hover:shadow-xs"}`}
                          style={styles.containerStyle}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dotClass}`}
                                style={styles.dotStyle}
                              />
                              <span
                                className={`font-bold text-xs uppercase tracking-wider truncate ${styles.headerTextClass}`}
                                style={styles.headerStyle}
                              >
                                {col.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500 bg-white/70 px-1.5 py-0.2 rounded border border-slate-200">
                                {count}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHide(col.id);
                                }}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                              >
                                {col.hidden ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Flow Stages Sequential Editor Track */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sequential Stage Controls & Customization
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Use arrows to reorder, color swatches to recolor, or eye to hide/unhide
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {columns.map((col, idx) => {
                const styles = getColumnStyles(col);
                const count = activitiesCountByStatus[col.id] || 0;

                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                      col.hidden
                        ? "border-dashed border-slate-300 bg-slate-50/70 opacity-60"
                        : `${styles.borderClass} ${styles.bgClass} shadow-xs hover:shadow`
                    }`}
                    style={col.hidden ? {} : styles.containerStyle}
                  >
                    <div>
                      {/* Top Row: Bubble + Title + Step badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${styles.dotClass}`}
                            style={styles.dotStyle}
                          />
                          <h4
                            className={`font-bold text-xs uppercase tracking-wider truncate ${styles.headerTextClass}`}
                            style={styles.headerStyle}
                          >
                            {col.label}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                          Step {idx + 1}
                        </span>
                      </div>

                      {/* Status / Task Count */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                        <span>{count} {count === 1 ? "activity" : "activities"}</span>
                        {col.hidden ? (
                          <span className="font-semibold text-rose-600 text-[10px] bg-rose-50 px-1.5 py-0.2 rounded">
                            Hidden from flow
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded">
                            Visible on board
                          </span>
                        )}
                      </div>

                      {/* Color Palette Swatches */}
                      <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Color Theme:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {COLOR_THEMES.map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => changeTheme(col.id, theme.id)}
                              className={`w-5 h-5 rounded-full ${theme.dot} transition hover:scale-110 cursor-pointer ${
                                col.colorTheme === theme.id ? "ring-2 ring-slate-800 ring-offset-1" : ""
                              }`}
                              title={theme.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-1 text-slate-600">
                      {/* Reorder Arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveLeft(idx)}
                          className="p-1 hover:bg-white rounded border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                          title="Move earlier in flow"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === columns.length - 1}
                          onClick={() => moveRight(idx)}
                          className="p-1 hover:bg-white rounded border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
                          title="Move later in flow"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit, Visibility, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenEditColumn(col)}
                          className="p-1.5 hover:bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 transition"
                          title="Edit card title & custom colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleHide(col.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            col.hidden
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                          }`}
                          title={col.hidden ? "Unhide card" : "Hide card from flow"}
                        >
                          {col.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteColumn(col.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 transition"
                          title="Delete card from flow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Changes to the flow pipeline are saved automatically and applied across the workspace.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            Done Configuring
          </button>
        </div>
      </div>
    </div>
  );
}
