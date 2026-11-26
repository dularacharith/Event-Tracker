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
  Activity,
  Workflow,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0e17] text-slate-200 rounded-3xl shadow-2xl border border-slate-800 w-full max-w-[1520px] h-[92vh] flex flex-col overflow-hidden relative font-sans">
        {/* Top Header Bar (Mac Studio Style) */}
        <div className="bg-[#0d121f] border-b border-slate-800/90 px-4 py-3 flex items-center justify-between shrink-0 select-none">
          {/* Left: Window Controls + Logo + Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Window control traffic lights */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition cursor-pointer"
                title="Close Window"
                aria-label="Close Window"
              />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Logo Icon */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* Title & Status */}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-white text-sm sm:text-base tracking-tight leading-none">
                  Interactive Pipeline Flow Builder
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected / Auto-saved
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Production Pipeline &gt; <span className="text-slate-300">Flow Configurator</span>
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
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isLivePreview
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20"
                  : "bg-[#141b2d] hover:bg-slate-800 border-slate-700/80 text-slate-300"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
              {isLivePreview && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />}
            </button>

            {/* Deploy Pipeline Button */}
            <button
              type="button"
              onClick={handleDeploy}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deploy Pipeline</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
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
            <div className="w-64 bg-[#0d121f] border-r border-slate-800/90 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-left duration-150">
              {/* Library Header */}
              <div className="p-3.5 pb-2 border-b border-slate-800/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    STAGE LIBRARY
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(false)}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
                    title="Hide library"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-xs font-bold text-white">Stage Library</h3>
                <p className="text-[11px] text-slate-400">Drag nodes into canvas</p>

                {/* Search stages */}
                <div className="relative mt-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stages..."
                    className="w-full bg-[#131b2e] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
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
                          className={`p-2 rounded-xl bg-[#131b2e] border transition flex items-center justify-between cursor-grab active:cursor-grabbing ${
                            selectedColId === c.id
                              ? "border-blue-500 text-white shadow-sm shadow-blue-500/20"
                              : "border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                            <span
                              className={`w-2 h-2 rounded-full ${
                                c.id === "draft" ? "bg-blue-400" : "bg-sky-400"
                              }`}
                            />
                            <span className="text-xs font-semibold">{c.label}</span>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-blue-300">
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
                          className={`p-2 rounded-xl bg-[#131b2e] border transition flex items-center justify-between cursor-grab active:cursor-grabbing ${
                            selectedColId === c.id
                              ? "border-amber-500 text-white shadow-sm shadow-amber-500/20"
                              : "border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
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
                      className="p-2 rounded-xl bg-[#171329] border border-purple-500/30 hover:border-purple-400/60 transition flex items-center justify-between cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-purple-400/70" />
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-200">
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
                            className={`p-2 rounded-xl bg-[#131b2e] border transition flex items-center justify-between cursor-grab active:cursor-grabbing ${
                              selectedColId === c.id
                                ? "border-indigo-500 text-white shadow-sm shadow-indigo-500/20"
                                : "border-slate-800 hover:border-slate-700 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-3.5 h-3.5 text-slate-500" />
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
              <div className="p-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onOpenCreateColumn}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-[#121829] hover:bg-indigo-950/30 text-slate-300 hover:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Custom Stage</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. CENTER INTERACTIVE CANVAS */}
          <div
            className="flex-1 flex flex-col relative overflow-hidden bg-[#070a13]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(148, 163, 184, 0.16) 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          >
            {/* Floating Canvas Controls Toolbar (Pan, Select, Add, Connect, Zoom, Undo, Redo) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none">
              <div className="bg-[#121829]/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-1 flex items-center gap-1 shadow-2xl shadow-black/80">
                {/* Toggle Library sidebar if closed */}
                {!isLibraryOpen && (
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
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
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* + Add Stage */}
                <button
                  type="button"
                  onClick={onOpenCreateColumn}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Connect Nodes</span>
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Zoom */}
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 10, 150))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-300 px-1">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {/* Undo / Redo */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Undo last change"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Redo change"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>

                {/* Toggle Inspector sidebar if closed */}
                {!isInspectorOpen && (
                  <button
                    type="button"
                    onClick={() => setIsInspectorOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Open Inspector"
                  >
                    Inspector
                  </button>
                )}
              </div>

              {/* Information Pill Banner */}
              <div className="bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <span>💡</span>
                <span>Drag cards by their ⠿ handle to reorder, or drag from the left library to add new stages.</span>
              </div>
            </div>

            {/* Canvas Viewport (Scalable by Zoom) */}
            <div
              className="flex-1 overflow-auto flex items-center justify-center p-8 pt-24"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
              }}
            >
              {/* Linked Graph Columns Container */}
              <div className="flex items-center gap-2 relative">
                {/* 1. INPUTS & INITIATION CONTAINER (Blue Glow) */}
                <div className="w-72 bg-[#0c1424]/90 backdrop-blur-md border-2 border-blue-500/30 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl shadow-blue-950/50 relative transition">
                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-blue-300">
                        INPUTS &amp; INITIATION
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
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
                          className={`rounded-xl p-3 border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#142340] border-blue-400 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30"
                              : "bg-[#101b33] border-blue-500/20 hover:border-blue-400/50 hover:bg-[#13203b]"
                          } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                col.id === "draft" ? "bg-blue-400" : "bg-sky-400"
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs uppercase tracking-wider text-white block truncate">
                                {col.label}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {count} {count === 1 ? "task" : "tasks"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="p-1 hover:text-white rounded transition"
                              title={col.hidden ? "Show in flow" : "Hide from flow"}
                            >
                              {col.hidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
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
                              className="p-1 hover:text-white rounded transition"
                              title="Edit stage settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dropzone / Insert Stage Button */}
                    <button
                      type="button"
                      onClick={onOpenCreateColumn}
                      className="w-full py-2.5 rounded-xl border border-dashed border-slate-700/80 hover:border-blue-400/60 bg-[#0e172a]/60 hover:bg-blue-950/20 text-slate-400 hover:text-blue-300 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Insert stage here (Drop)</span>
                    </button>
                  </div>

                  {/* Right Output Connector Port */}
                  <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-[#070a13] shadow-md shadow-blue-500/80 absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0e1628] border border-blue-400/50 text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-blue-900/40 z-10 select-none">
                    Start
                  </div>
                </div>

                {/* 2. CENTRAL ACTIVE EXECUTION HUB CONTAINER (Amber/Purple Glow) */}
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
                  className={`w-80 bg-gradient-to-b from-[#1c1815]/90 via-[#191326]/90 to-[#121629]/90 backdrop-blur-md border-2 ${
                    isDraggingOverHub
                      ? "border-emerald-400 ring-4 ring-emerald-500/20"
                      : "border-amber-500/40 hover:border-amber-500/60"
                  } rounded-2xl p-4 flex flex-col gap-3 shadow-2xl shadow-amber-950/40 relative transition`}
                >
                  {/* Left Input Port */}
                  <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#070a13] shadow-md shadow-amber-400/80 absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                        ACTIVE EXECUTION HUB
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
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
                        className={`rounded-xl p-3.5 border transition cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? "bg-[#251f1a] border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20"
                            : "bg-[#1d1916] border-amber-500/30 hover:border-amber-400/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                            <span className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                              {col.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHide(col.id);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            {col.hidden ? (
                              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-snug">
                          Content creation, recording, editing, and task authoring in real time.
                        </p>

                        <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {count} in progress
                          </span>
                          <span className="text-[10px] text-slate-500">Core Engine</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Dropzone Inside Active Execution Hub */}
                  <div
                    onClick={() => {
                      setQualityGateEnabled(!qualityGateEnabled);
                      toast.info("Quality Gate Toggled", qualityGateEnabled ? "Quality Contracts disabled." : "Quality Contracts enabled.");
                    }}
                    className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 text-emerald-300 py-2.5 px-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Drop here to insert stage</span>
                  </div>

                  {/* Quality Contracts & Pass Criteria Stage Card */}
                  {qualityGateEnabled && (
                    <div
                      onClick={() => {
                        setSelectedColId("quality_contracts");
                        setIsRulesExpanded(true);
                      }}
                      className={`rounded-xl p-3.5 border transition cursor-pointer flex flex-col gap-1.5 ${
                        selectedColId === "quality_contracts"
                          ? "bg-[#231a38] border-purple-400 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20"
                          : "bg-[#1a142c] border-purple-500/30 hover:border-purple-400/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                          <span className="font-bold text-xs uppercase tracking-wide text-purple-200">
                            QUALITY CONTRACTS &amp; PASS CRITERIA
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300">
                          Gate
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Enforces reviewer sign-off, checklist criteria, and proof evidence before completion.
                      </p>
                    </div>
                  )}

                  {/* Right Output Connector Port */}
                  <div className="w-3 h-3 rounded-full bg-purple-400 border-2 border-[#070a13] shadow-md shadow-purple-400/80 absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#181329] border border-purple-400/50 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-purple-900/40 z-10 select-none">
                    Verify
                  </div>
                </div>

                {/* 3. OUTCOMES & DESTINATIONS CONTAINER (Emerald/Purple/Rose Glow) */}
                <div className="w-72 bg-gradient-to-b from-[#102022]/90 via-[#16142a]/90 to-[#201218]/90 backdrop-blur-md border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col gap-2.5 shadow-2xl shadow-emerald-950/30 relative transition">
                  {/* Left Input Port */}
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#070a13] shadow-md shadow-emerald-400/80 absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                  {/* Container Header */}
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                        OUTCOMES &amp; DESTINATIONS
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
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
                          className={`rounded-xl p-2.5 border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-slate-800/90 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg"
                              : "bg-slate-900/70 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/60"
                          } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dotClass}`}
                              style={styles.dotStyle}
                            />
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-200 truncate">
                              {col.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-slate-700">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHide(col.id);
                              }}
                              className="text-slate-400 hover:text-white"
                              title={col.hidden ? "Show in flow" : "Hide from flow"}
                            >
                              {col.hidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dropzone Inside Outcomes */}
                    <button
                      type="button"
                      onClick={onOpenCreateColumn}
                      className="w-full py-2.5 rounded-xl border border-dashed border-slate-700/80 hover:border-emerald-400/60 bg-[#0e172a]/60 hover:bg-emerald-950/20 text-slate-400 hover:text-emerald-300 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Drop stage here to add outcome</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RIGHT SIDEBAR: STAGE INSPECTOR */}
          {isInspectorOpen && (
            <div className="w-64 bg-[#0d121f] border-l border-slate-800/90 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-150">
              {/* Inspector Header */}
              <div className="p-3.5 border-b border-slate-800/70 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  STAGE INSPECTOR
                </span>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded transition cursor-pointer"
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
                    <span className="text-xs font-bold text-white">Stage Properties</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {selectedCol ? (
                    <div className="space-y-3.5">
                      {/* Name Field */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={selectedCol.label}
                          onChange={(e) => handleRename(selectedCol.id, e.target.value)}
                          className="w-full bg-[#131b2e] border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-semibold transition"
                          placeholder="Stage name"
                        />
                      </div>

                      {/* Visibility Field */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Visibility
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleHide(selectedCol.id)}
                          className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            selectedCol.hidden
                              ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Status
                        </label>
                        <div className="bg-[#131b2e] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 flex items-center justify-between">
                          <span>
                            {selectedCol.id === "in_progress"
                              ? `${activitiesCountByStatus[selectedCol.id] || 0} in progress`
                              : `${activitiesCountByStatus[selectedCol.id] || 0} tasks`}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                      </div>

                      {/* Color Theme Swatches */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {COLOR_THEMES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => changeTheme(selectedCol.id, t.id)}
                              className={`w-7 h-7 rounded-xl transition hover:scale-110 cursor-pointer border flex items-center justify-center ${
                                selectedCol.colorTheme === t.id
                                  ? "border-white ring-2 ring-indigo-500 shadow-md"
                                  : "border-black/20"
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
                      <div className="border-t border-slate-800 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                          className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition py-1"
                        >
                          <span>Edit Rules</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isRulesExpanded ? "rotate-90 text-indigo-400" : "text-slate-500"
                            }`}
                          />
                        </button>

                        {isRulesExpanded && (
                          <div className="mt-2 space-y-2 p-2.5 rounded-xl bg-[#131b2e] border border-slate-800 text-[11px] text-slate-300 animate-in fade-in">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-indigo-600 cursor-pointer"
                              />
                              <span>Require Reviewer Sign-off</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-indigo-600 cursor-pointer"
                              />
                              <span>Require Proof Attachment</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded accent-indigo-600 cursor-pointer"
                              />
                              <span>Enforce Pass Criteria</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Stage Ordering & Edit Modal Trigger */}
                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Reorder Stage
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveEarlier(selectedCol.id)}
                            className="flex-1 py-1.5 px-2 rounded-xl border border-slate-700 bg-[#131b2e] hover:bg-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
                          >
                            Move Earlier
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLater(selectedCol.id)}
                            className="flex-1 py-1.5 px-2 rounded-xl border border-slate-700 bg-[#131b2e] hover:bg-slate-800 text-xs text-slate-300 font-medium transition cursor-pointer"
                          >
                            Move Later
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenEditColumn(selectedCol)}
                          className="w-full py-1.5 px-3 rounded-xl border border-slate-700 bg-[#131b2e] hover:bg-slate-800 text-xs text-indigo-300 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Advanced Settings</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteColumn(selectedCol.id)}
                          className="w-full py-1.5 px-3 rounded-xl border border-rose-500/30 hover:border-rose-500 bg-rose-950/20 hover:bg-rose-950/40 text-xs text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Stage</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-6">
                      Click any card in the canvas or library to inspect properties.
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector Footer with Reset Flow button */}
              <div className="p-3 border-t border-slate-800/80">
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
                  className="w-full py-1.5 rounded-xl border border-slate-700/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
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
