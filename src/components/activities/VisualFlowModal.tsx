"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Sparkles,
  ShieldCheck,
  Layers,
  FileText,
  Play,
  Search,
  Hand,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  ChevronDown,
  ChevronRight,
  Check,
  Settings,
  GripVertical,
  Share2,
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

  // Selected stage for the Stage Inspector
  const [selectedColId, setSelectedColId] = useState<string>("in_progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<"pan" | "select">("select");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [isDraggingOverHub, setIsDraggingOverHub] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<FlowColumn[][]>([]);
  const [future, setFuture] = useState<FlowColumn[][]>([]);

  // Quality gate checklist toggle in Active Execution
  const [qualityGateEnabled, setQualityGateEnabled] = useState(true);

  // Selected column object
  const selectedCol = useMemo(() => {
    return (
      columns.find((c) => c.id === selectedColId) ||
      columns.find((c) => c.id === "in_progress") ||
      columns[0]
    );
  }, [columns, selectedColId]);

  if (!isOpen) return null;

  const pushHistory = (newCols: FlowColumn[]) => {
    setHistory((prev) => [...prev, columns]);
    setFuture([]);
    onUpdateColumns(newCols);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [columns, ...f]);
    setHistory((h) => h.slice(0, -1));
    onUpdateColumns(prev);
    toast.info("Action undone", "Restored previous flow configuration.");
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, columns]);
    setFuture((f) => f.slice(1));
    onUpdateColumns(next);
    toast.info("Action redone", "Reapplied flow configuration.");
  };

  const toggleHide = (colId: string) => {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, hidden: !c.hidden } : c
    );
    pushHistory(updated);
  };

  const handleRename = (colId: string, newLabel: string) => {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, label: newLabel } : c
    );
    pushHistory(updated);
  };

  const changeTheme = (colId: string, themeId: string) => {
    const updated = columns.map((c) =>
      c.id === colId ? { ...c, colorTheme: themeId, customHex: undefined } : c
    );
    pushHistory(updated);
  };

  const moveEarlier = (colId: string) => {
    const idx = columns.findIndex((c) => c.id === colId);
    if (idx <= 0) return;
    const newCols = [...columns];
    const temp = newCols[idx - 1];
    newCols[idx - 1] = newCols[idx];
    newCols[idx] = temp;
    pushHistory(newCols);
  };

  const moveLater = (colId: string) => {
    const idx = columns.findIndex((c) => c.id === colId);
    if (idx < 0 || idx >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[idx + 1];
    newCols[idx + 1] = newCols[idx];
    newCols[idx] = temp;
    pushHistory(newCols);
  };

  const deleteColumn = async (colId: string) => {
    if (columns.length <= 1) {
      toast.error("Cannot remove stage", "You must have at least one stage in the flow.");
      return;
    }
    const target = columns.find((c) => c.id === colId);
    const ok = await confirm({
      title: `Delete "${target?.label || colId}" stage?`,
      description: "This stage will be removed from your active flow pipeline.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (ok) {
      const remaining = columns.filter((c) => c.id !== colId);
      pushHistory(remaining);
      if (selectedColId === colId && remaining.length > 0) {
        setSelectedColId(remaining[0].id);
      }
      toast.success("Stage deleted", `"${target?.label}" has been removed.`);
    }
  };

  const handleDeploy = () => {
    toast.success("Pipeline Deployed", "Your interactive workflow architecture is saved and active across the workspace.");
    onClose();
  };

  // Group columns according to architecture
  const inputColumns = columns.filter(
    (c) => c.id === "draft" || c.id === "scheduled" || c.step === "1" || c.step === "2"
  );
  const executionColumns = columns.filter(
    (c) => c.id === "in_progress" || c.step === "3"
  );
  const outcomeColumns = columns.filter(
    (c) =>
      c.id !== "draft" &&
      c.id !== "scheduled" &&
      c.id !== "in_progress" &&
      c.step !== "1" &&
      c.step !== "2" &&
      c.step !== "3"
  );

  // Filtered list for Stage Library search
  const filteredLibraryColumns = columns.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[1520px] h-[92vh] flex flex-col overflow-hidden relative font-sans">
        {/* Top Header Bar (Clean in-app modal header matching app theme) */}
        <div className="bg-slate-50/90 border-b border-slate-200/80 px-5 py-3 flex items-center justify-between shrink-0 select-none">
          {/* Left: Icon + Title + Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-none">
                  Interactive Pipeline Flow Builder
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected / Auto-saved
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Production Pipeline &gt; <span className="font-semibold text-slate-700">Flow Configurator</span>
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Preview Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsLivePreview(!isLivePreview);
                toast.info(
                  isLivePreview ? "Preview Paused" : "Live Simulation Active",
                  isLivePreview
                    ? "Normal editing mode restored."
                    : "Simulating live activity flow along pipeline wires."
                );
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                isLivePreview
                  ? "bg-purple-100 border-purple-300 text-purple-800 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
              {isLivePreview && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />}
            </button>

            {/* Deploy Pipeline Button */}
            <button
              type="button"
              onClick={handleDeploy}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-500/25 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deploy Pipeline</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer ml-1"
              title="Close builder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Studio Body: Library Sidebar | Interactive Canvas | Stage Inspector */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* 1. LEFT SIDEBAR: STAGE LIBRARY */}
          {isLibraryOpen && (
            <div className="w-64 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-left duration-150">
              {/* Library Header */}
              <div className="p-3.5 pb-2 border-b border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    STAGE LIBRARY
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                    title="Hide library"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-xs font-bold text-slate-900">Stage Library</h3>
                <p className="text-[11px] text-slate-500">Drag nodes into canvas</p>

                {/* Search stages */}
                <div className="relative mt-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stages..."
                    className="w-full bg-white border border-slate-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Categorized Draggable Stage Items */}
              <div className="p-3 flex-1 overflow-y-auto space-y-4">
                {/* Inputs Group */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Inputs
                  </span>
                  <div className="space-y-1.5">
                    {filteredLibraryColumns
                      .filter((c) => c.id === "draft" || c.id === "scheduled")
                      .map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={() => setDraggedStageId(c.id)}
                          onDragEnd={() => setDraggedStageId(null)}
                          onClick={() => setSelectedColId(c.id)}
                          className={`p-2.5 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
                            selectedColId === c.id
                              ? "border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs bg-purple-50/40"
                              : "border-slate-200/90 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                            <span
                              className={`w-2 h-2 rounded-full ${
                                c.id === "draft" ? "bg-blue-500" : "bg-sky-500"
                              }`}
                            />
                            <span className="text-xs font-semibold">{c.label}</span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                            input
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Execution Group */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Execution
                  </span>
                  <div className="space-y-1.5">
                    {filteredLibraryColumns
                      .filter((c) => c.id === "in_progress")
                      .map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={() => setDraggedStageId(c.id)}
                          onDragEnd={() => setDraggedStageId(null)}
                          onClick={() => setSelectedColId(c.id)}
                          className={`p-2.5 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
                            selectedColId === c.id
                              ? "border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs bg-amber-50/40"
                              : "border-slate-200/90 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-semibold">{c.label}</span>
                          </div>
                        </div>
                      ))}

                    {/* Quality Contracts node */}
                    <div
                      draggable
                      onDragStart={() => setDraggedStageId("quality_contracts")}
                      onDragEnd={() => setDraggedStageId(null)}
                      onClick={() => setQualityGateEnabled(!qualityGateEnabled)}
                      className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 hover:border-purple-300 transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-purple-400" />
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-900">
                          Quality Contracts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outcomes Group */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Outcomes
                  </span>
                  <div className="space-y-1.5">
                    {filteredLibraryColumns
                      .filter(
                        (c) =>
                          c.id !== "draft" &&
                          c.id !== "scheduled" &&
                          c.id !== "in_progress"
                      )
                      .map((c) => {
                        const styles = getColumnStyles(c);
                        return (
                          <div
                            key={c.id}
                            draggable
                            onDragStart={() => setDraggedStageId(c.id)}
                            onDragEnd={() => setDraggedStageId(null)}
                            onClick={() => setSelectedColId(c.id)}
                            className={`p-2.5 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
                              selectedColId === c.id
                                ? "border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs bg-purple-50/40"
                                : "border-slate-200/90 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${styles.dotClass}`}
                                style={styles.dotStyle}
                              />
                              <span className="text-xs font-semibold">{c.label}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Bottom Custom Stage Button */}
              <div className="p-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={onOpenCreateColumn}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/40 text-slate-600 hover:text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Stage</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. CENTER INTERACTIVE CANVAS (Clean light canvas) */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden bg-[#f8fafc]"
            style={{
              backgroundImage:
                "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          >
            {/* Floating Canvas Controls Toolbar (Pan, Select, Add, Connect, Zoom, Undo, Redo) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1 flex items-center gap-1 shadow-lg shadow-slate-200/60">
                {/* Toggle Library sidebar if closed */}
                {!isLibraryOpen && (
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Open Stage Library"
                  >
                    Library
                  </button>
                )}

                {/* Pan Tool */}
                <button
                  type="button"
                  onClick={() => setActiveTool("pan")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTool === "pan"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Pan</span>
                </button>

                {/* Select Tool */}
                <button
                  type="button"
                  onClick={() => setActiveTool("select")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeTool === "select"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Add Stage */}
                <button
                  type="button"
                  onClick={onOpenCreateColumn}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stage</span>
                </button>

                {/* Connect Nodes */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLivePreview(!isLivePreview);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Connect Nodes</span>
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Zoom */}
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-1">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Undo / Redo */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Undo last change"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Redo change"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Inspector sidebar if closed */}
                {!isInspectorOpen && (
                  <button
                    type="button"
                    onClick={() => setIsInspectorOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Open Inspector"
                  >
                    Inspector
                  </button>
                )}
              </div>

              {/* Information Pill Banner */}
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xs">
                <span>💡</span>
                <span>Drag cards by their ⠿ handle to reorder, or drag from the left library to add new stages.</span>
              </div>
            </div>

            {/* Canvas Viewport (Scalable by Zoom - With Proper Auto Overflow without Left-side clipping) */}
            <div className="flex-1 overflow-auto p-6 lg:p-8 pt-24 min-h-0">
              <div
                className="min-w-fit mx-auto flex items-center justify-center gap-2 relative"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
              >
                {/* 1. INPUTS & INITIATION CONTAINER (Light Blue Box) */}
                <div className="w-72 bg-blue-50/60 border-2 border-blue-200/90 hover:border-blue-300 rounded-2xl p-4 flex flex-col gap-3 shadow-xs relative transition shrink-0">
                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-blue-900">
                        INPUTS &amp; INITIATION
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-700/80 font-medium">
                      {inputColumns.length} stages
                    </span>
                  </div>

                  {/* Stage Cards Inside Inputs */}
                  <div className="space-y-2">
                    {inputColumns.map((col) => {
                      const count = activitiesCountByStatus[col.id] || 0;
                      const isSelected = selectedColId === col.id;
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColId(col.id)}
                          className={`rounded-xl p-3 border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                            isSelected
                              ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                              : "bg-white border-blue-200/80 hover:border-blue-300 hover:bg-blue-50/30"
                          } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                col.id === "draft" ? "bg-blue-500" : "bg-sky-500"
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 block truncate">
                                {col.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {count} {count === 1 ? "task" : "tasks"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="p-1 hover:text-slate-700 rounded transition"
                              title={col.hidden ? "Show in flow" : "Hide from flow"}
                            >
                              {col.hidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditColumn(col);
                              }}
                              className="p-1 hover:text-slate-700 rounded transition"
                              title="Edit stage settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dropzone / Insert Stage Button (NO duplicate plus!) */}
                    <button
                      type="button"
                      onClick={onOpenCreateColumn}
                      className="w-full py-2.5 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/60 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert stage here (Drop)</span>
                    </button>
                  </div>

                  {/* Right Output Connector Port */}
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
                </div>

                {/* SVG Curve Wires to Transition Pill "Start" */}
                <div className="w-20 h-44 relative shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 80 176">
                    {/* Upper curve (from Draft) */}
                    <path
                      d="M 0 54 C 40 54, 40 88, 80 88"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                    {/* Lower curve (from Scheduled) */}
                    <path
                      d="M 0 122 C 40 122, 40 88, 80 88"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                  </svg>

                  {/* Transition Node "Start" Pill */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-300 text-blue-700 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xs z-10 select-none">
                    Start
                  </div>
                </div>

                {/* 2. CENTRAL ACTIVE EXECUTION HUB CONTAINER (Light Amber & Purple Box) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverHub(true);
                  }}
                  onDragLeave={() => setIsDraggingOverHub(false)}
                  onDrop={() => {
                    setIsDraggingOverHub(false);
                    if (draggedStageId === "quality_contracts") {
                      setQualityGateEnabled(true);
                      toast.success("Quality Gate Attached", "Quality Contracts & Pass Criteria enabled on Active Execution.");
                    }
                  }}
                  className={`w-80 bg-amber-50/60 border-2 ${
                    isDraggingOverHub
                      ? "border-emerald-400 ring-4 ring-emerald-500/20"
                      : "border-amber-300/90 hover:border-amber-400"
                  } rounded-2xl p-4 flex flex-col gap-3 shadow-xs relative transition shrink-0`}
                >
                  {/* Left Input Port */}
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-sm absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-600 fill-amber-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-amber-950">
                        ACTIVE EXECUTION HUB
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-800/80 font-medium">
                      {executionColumns.length + (qualityGateEnabled ? 1 : 0)} stages
                    </span>
                  </div>

                  {/* Main Tasking Stage Card */}
                  {executionColumns.slice(0, 1).map((col) => {
                    const count = activitiesCountByStatus[col.id] || 0;
                    const isSelected = selectedColId === col.id;
                    return (
                      <div
                        key={col.id}
                        onClick={() => setSelectedColId(col.id)}
                        className={`rounded-xl p-3.5 border transition cursor-pointer flex flex-col gap-2 shadow-2xs ${
                          isSelected
                            ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                            : "bg-white border-amber-200 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="font-extrabold text-xs uppercase tracking-wider text-amber-950">
                              {col.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHide(col.id);
                            }}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {col.hidden ? (
                              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">
                          Content creation, recording, editing, and task authoring in real time.
                        </p>

                        <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                            {count} in progress
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Core Engine</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dropzone Inside Active Execution Hub (Single plus!) */}
                  <div
                    onClick={() => {
                      setQualityGateEnabled(!qualityGateEnabled);
                      toast.info("Quality Gate Toggled", qualityGateEnabled ? "Quality Contracts disabled." : "Quality Contracts enabled.");
                    }}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 py-2.5 px-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Drop here to insert stage</span>
                  </div>

                  {/* Quality Contracts & Pass Criteria Stage Card */}
                  {qualityGateEnabled && (
                    <div
                      onClick={() => {
                        setSelectedColId("quality_contracts");
                        setIsRulesExpanded(true);
                      }}
                      className={`rounded-xl p-3.5 border transition cursor-pointer flex flex-col gap-1.5 shadow-2xs ${
                        selectedColId === "quality_contracts"
                          ? "bg-purple-100/70 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                          : "bg-purple-50/80 border-purple-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-xs uppercase tracking-wide text-purple-950">
                            QUALITY CONTRACTS &amp; PASS CRITERIA
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-200/80 border border-purple-300 text-purple-900">
                          Gate
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-900/80 leading-snug">
                        Enforces reviewer sign-off, checklist criteria, and proof evidence before completion.
                      </p>
                    </div>
                  )}

                  {/* Right Output Connector Port */}
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white shadow-sm absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
                </div>

                {/* SVG Curve Wires to Transition Pill "Verify" */}
                <div className="w-20 h-44 relative shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 80 176">
                    {/* Lines fanning out to the 4 outcomes */}
                    {/* To Awaiting Review */}
                    <path
                      d="M 0 88 C 40 88, 40 28, 80 28"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                    {/* To Completed */}
                    <path
                      d="M 0 88 C 40 88, 40 68, 80 68"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                    {/* To Failed */}
                    <path
                      d="M 0 88 C 40 88, 40 108, 80 108"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                    {/* To Canceled */}
                    <path
                      d="M 0 88 C 40 88, 40 148, 80 148"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.5"
                      strokeDasharray={isLivePreview ? "6 6" : "none"}
                      className={isLivePreview ? "animate-pulse" : ""}
                    />
                  </svg>

                  {/* Transition Node "Verify" Pill */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-purple-300 text-purple-700 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xs z-10 select-none">
                    Verify
                  </div>
                </div>

                {/* 3. OUTCOMES & DESTINATIONS CONTAINER (Light Emerald Box) */}
                <div className="w-72 bg-emerald-50/40 border-2 border-emerald-200/90 hover:border-emerald-300 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs relative transition shrink-0">
                  {/* Left Input Port */}
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                        OUTCOMES &amp; DESTINATIONS
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800/80 font-medium">
                      {outcomeColumns.length} stages
                    </span>
                  </div>

                  {/* Stage Cards Inside Outcomes */}
                  <div className="space-y-2">
                    {outcomeColumns.map((col) => {
                      const count = activitiesCountByStatus[col.id] || 0;
                      const isSelected = selectedColId === col.id;
                      const styles = getColumnStyles(col);

                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColId(col.id)}
                          className={`rounded-xl p-2.5 border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                            isSelected
                              ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dotClass}`}
                              style={styles.dotStyle}
                            />
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 truncate">
                              {col.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title={col.hidden ? "Show in flow" : "Hide from flow"}
                            >
                              {col.hidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dropzone Inside Outcomes (Single plus!) */}
                    <button
                      type="button"
                      onClick={onOpenCreateColumn}
                      className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Drop stage here to add outcome</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT SIDEBAR: STAGE INSPECTOR (Clean Light Style) */}
          {isInspectorOpen && (
            <div className="w-64 bg-slate-50/70 border-l border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-150">
              {/* Inspector Header */}
              <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  STAGE INSPECTOR
                </span>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                  title="Hide inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inspector Body */}
              <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
                {/* Stage Properties Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-900">Stage Properties</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  {selectedCol ? (
                    <div className="space-y-3.5">
                      {/* Name Field */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={selectedCol.label}
                          onChange={(e) => handleRename(selectedCol.id, e.target.value)}
                          className="w-full bg-white border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold transition shadow-2xs"
                          placeholder="Stage name"
                        />
                      </div>

                      {/* Visibility Field */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Visibility
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleHide(selectedCol.id)}
                          className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer shadow-2xs ${
                            selectedCol.hidden
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : "bg-emerald-50 border-emerald-200 text-emerald-800"
                          }`}
                        >
                          <span>{selectedCol.hidden ? "Hidden from Board" : "Visible"}</span>
                          {selectedCol.hidden ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Status / Task Count */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Status
                        </label>
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 flex items-center justify-between shadow-2xs">
                          <span>
                            {selectedCol.id === "in_progress"
                              ? `${activitiesCountByStatus[selectedCol.id] || 0} in progress`
                              : `${activitiesCountByStatus[selectedCol.id] || 0} tasks`}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                      </div>

                      {/* Color Theme Swatches */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {COLOR_THEMES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => changeTheme(selectedCol.id, t.id)}
                              className={`w-7 h-7 rounded-xl transition hover:scale-110 cursor-pointer border flex items-center justify-center shadow-2xs ${
                                selectedCol.colorTheme === t.id
                                  ? "border-slate-800 ring-2 ring-purple-600"
                                  : "border-black/10"
                              }`}
                              style={{ backgroundColor: t.hex }}
                              title={t.name}
                            >
                              {selectedCol.colorTheme === t.id && (
                                <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Transition Rules Accordion */}
                      <div className="border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-purple-700 transition py-1"
                        >
                          <span>Edit Rules</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isRulesExpanded ? "rotate-90 text-purple-600" : "text-slate-400"
                            }`}
                          />
                        </button>

                        {isRulesExpanded && (
                          <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 shadow-2xs animate-in fade-in">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-purple-600 cursor-pointer"
                              />
                              <span>Require Reviewer Sign-off</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-purple-600 cursor-pointer"
                              />
                              <span>Require Proof Attachment</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-purple-600 cursor-pointer"
                              />
                              <span>Enforce Pass Criteria</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Stage Ordering & Edit Modal Trigger */}
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Reorder Stage
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveEarlier(selectedCol.id)}
                            className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                          >
                            Move Earlier
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLater(selectedCol.id)}
                            className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                          >
                            Move Later
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenEditColumn(selectedCol)}
                          className="w-full py-1.5 px-3 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-xs text-purple-700 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Advanced Settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteColumn(selectedCol.id)}
                          className="w-full py-1.5 px-3 rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100/70 text-xs text-rose-700 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Stage</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-6">
                      Click any card in the canvas or library to inspect properties.
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector Footer with Reset Flow button */}
              <div className="p-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Reset the entire flow pipeline?",
                      description: "Restore the original default 7 columns and pipeline stages.",
                      confirmLabel: "Reset Flow",
                      cancelLabel: "Cancel",
                    });
                    if (ok) {
                      onResetToDefault();
                      toast.info("Pipeline Reset", "Default 7 workflow stages restored.");
                    }
                  }}
                  className="w-full py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Default Flow</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
