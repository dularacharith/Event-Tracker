"use client";

import React, { useState, useMemo, useRef } from "react";
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
  HelpCircle,
  Info,
  BookOpen,
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
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [showQualityInfo, setShowQualityInfo] = useState(false);

  // Drag and drop state
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // Canvas Pan (Hand Tool) State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // History for undo/redo
  const [history, setHistory] = useState<FlowColumn[][]>([]);
  const [future, setFuture] = useState<FlowColumn[][]>([]);

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

  // Reordering via Drag and Drop
  const handleDropOnCard = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIdx = columns.findIndex((c) => c.id === sourceId);
    const targetIdx = columns.findIndex((c) => c.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newCols = [...columns];
    const [moved] = newCols.splice(sourceIdx, 1);
    newCols.splice(targetIdx, 0, moved);
    pushHistory(newCols);
    toast.success("Stage reordered", `Moved "${moved.label}"`);
    setDraggedStageId(null);
    setDragOverColId(null);
  };

  const handleDropToSection = (targetSection: "inputs" | "execution" | "outcomes") => {
    if (!draggedStageId) return;
    const sourceIdx = columns.findIndex((c) => c.id === draggedStageId);
    if (sourceIdx === -1) return;

    const newCols = [...columns];
    const [moved] = newCols.splice(sourceIdx, 1);

    if (targetSection === "inputs") {
      newCols.splice(1, 0, moved);
    } else if (targetSection === "execution") {
      newCols.splice(2, 0, moved);
    } else {
      newCols.push(moved);
    }

    pushHistory(newCols);
    toast.success("Stage moved", `Placed "${moved.label}" into ${targetSection}`);
    setDraggedStageId(null);
    setDragOverSection(null);
  };

  const handleDeploy = () => {
    toast.success("Pipeline Deployed", "Your interactive workflow architecture is saved and active across the workspace.");
    onClose();
  };

  // Canvas Pan Hand Tool Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === "pan") {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
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
    <>
      {/* Modal Positioning: Touching below header border (top-16) and centered to bottom */}
      <div className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/40 backdrop-blur-xs select-none">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[1520px] h-[calc(100vh-5.5rem)] max-h-[890px] flex flex-col overflow-hidden relative font-sans">
          {/* Top Header Bar (Clean in-app modal header) */}
          <div className="bg-slate-50/90 border-b border-slate-200/80 px-5 py-3 flex items-center justify-between shrink-0 select-none">
            {/* Left: Icon + Title + Status */}
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

          {/* Main Studio Body: Library Sidebar | Center Canvas | Stage Inspector */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* 1. LEFT SIDEBAR: STAGE LIBRARY */}
            {isLibraryOpen && (
              <div className="w-60 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-left duration-150">
                {/* Library Header */}
                <div className="p-3 pb-2 border-b border-slate-200/80">
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

                  {/* Add New Stage Button */}
                  <button
                    type="button"
                    onClick={onOpenCreateColumn}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/25 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Stage</span>
                  </button>

                  {/* Search stages */}
                  <div className="relative mt-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stages..."
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Categorized Draggable Stage Items */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3.5">
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
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", c.id);
                              setDraggedStageId(c.id);
                            }}
                            onDragEnd={() => setDraggedStageId(null)}
                            onClick={() => setSelectedColId(c.id)}
                            className={`p-2 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
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
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", c.id);
                              setDraggedStageId(c.id);
                            }}
                            onDragEnd={() => setDraggedStageId(null)}
                            onClick={() => setSelectedColId(c.id)}
                            className={`p-2 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
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
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", c.id);
                                setDraggedStageId(c.id);
                              }}
                              onDragEnd={() => setDraggedStageId(null)}
                              onClick={() => setSelectedColId(c.id)}
                              className={`p-2 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs ${
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

            {/* 2. CENTER INTERACTIVE CANVAS (Fits default on board, supports Pan Hand & Zoom) */}
            <div
              className="flex-1 flex flex-col relative overflow-hidden bg-[#f8fafc] select-none"
              style={{
                backgroundImage:
                  "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
                backgroundSize: "22px 22px",
              }}
            >
              {/* Floating Canvas Controls Toolbar (With Clean "How to use" Button, NO amber banner!) */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center select-none pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-1 flex items-center gap-1 shadow-lg shadow-slate-200/60">
                  {/* Toggle Library sidebar if closed */}
                  {!isLibraryOpen && (
                    <button
                      type="button"
                      onClick={() => setIsLibraryOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0 whitespace-nowrap"
                      title="Open Stage Library"
                    >
                      Library
                    </button>
                  )}

                  {/* Pan Tool (Hand Option) */}
                  <button
                    type="button"
                    onClick={() => setActiveTool("pan")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${
                      activeTool === "pan"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title="Hand tool: click and drag canvas to move around"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    <span>Pan</span>
                  </button>

                  {/* Select Tool */}
                  <button
                    type="button"
                    onClick={() => setActiveTool("select")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 whitespace-nowrap ${
                      activeTool === "select"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                    title="Select tool: click cards to inspect and edit"
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                    <span>Select</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                  {/* Add Stage */}
                  <button
                    type="button"
                    onClick={onOpenCreateColumn}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stage</span>
                  </button>

                  {/* Connect Nodes Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsLivePreview(!isLivePreview)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Connect Nodes</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                  {/* Zoom Controls */}
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(100);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="text-xs font-bold text-slate-700 px-1 hover:text-purple-600 transition cursor-pointer shrink-0 whitespace-nowrap"
                    title="Reset to 100% and Center"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(z + 10, 160))}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                  {/* Undo / Redo */}
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
                    title="Undo last change"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={future.length === 0}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
                    title="Redo change"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                  {/* Modern Question Mark Icon Button */}
                  <button
                    type="button"
                    onClick={() => setIsHowToUseOpen(true)}
                    className="w-7 h-7 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/90 flex items-center justify-center transition cursor-pointer shadow-2xs shrink-0 group"
                    title="How to use the pipeline flow builder"
                    aria-label="How to use pipeline guide"
                  >
                    <HelpCircle className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Toggle Inspector sidebar if closed */}
                  {!isInspectorOpen && (
                    <button
                      type="button"
                      onClick={() => setIsInspectorOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0 whitespace-nowrap cursor-pointer"
                      title="Open Inspector"
                    >
                      Inspector
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas Viewport: Interactive Pan & Zoom, Perfectly Centered */}
              <div
                className="flex-1 overflow-hidden relative flex items-center justify-center p-4 pt-14"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  cursor: activeTool === "pan" ? (isPanning ? "grabbing" : "grab") : "default",
                }}
              >
                {/* Scalable & Pannable Graph Stage Board */}
                <div
                  className="flex items-center justify-center gap-2 select-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel / 100})`,
                    transformOrigin: "center center",
                    transition: isPanning ? "none" : "transform 0.15s ease-out",
                  }}
                >
                  {/* 1. INPUTS & INITIATION CONTAINER (Compact & Perfectly Scaled) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSection("inputs");
                    }}
                    onDragLeave={() => setDragOverSection(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropToSection("inputs");
                    }}
                    className={`w-60 bg-blue-50/60 border-2 ${
                      dragOverSection === "inputs"
                        ? "border-blue-500 ring-4 ring-blue-500/20"
                        : "border-blue-200/90 hover:border-blue-300"
                    } rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs relative transition shrink-0`}
                  >
                    {/* Container Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-[11px] uppercase tracking-wider text-blue-900">
                          INPUTS &amp; INITIATION
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-700/80 font-medium">
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
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", col.id);
                              setDraggedStageId(col.id);
                            }}
                            onDragEnd={() => setDraggedStageId(null)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverColId(col.id);
                            }}
                            onDragLeave={() => setDragOverColId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedStageId) handleDropOnCard(draggedStageId, col.id);
                            }}
                            onClick={() => setSelectedColId(col.id)}
                            className={`rounded-xl p-2.5 border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                              dragOverColId === col.id
                                ? "border-purple-500 ring-2 ring-purple-500/40 bg-purple-50"
                                : isSelected
                                ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                : "bg-white border-blue-200/80 hover:border-blue-300 hover:bg-blue-50/30"
                            } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
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
                                className="p-0.5 hover:text-slate-700 rounded transition"
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
                                className="p-0.5 hover:text-slate-700 rounded transition"
                                title="Edit stage settings"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Dropzone Button */}
                      <button
                        type="button"
                        onClick={onOpenCreateColumn}
                        className="w-full py-2 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50/60 text-blue-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert stage here (Drop)</span>
                      </button>
                    </div>

                    {/* Right Output Connector Port */}
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
                  </div>

                  {/* SVG Curve Wires to Transition Pill "Start" */}
                  <div className="w-14 h-36 relative shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 56 144">
                      {/* Upper curve (from Draft) */}
                      <path
                        d="M 0 44 C 28 44, 28 72, 56 72"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                      {/* Lower curve (from Scheduled) */}
                      <path
                        d="M 0 100 C 28 100, 28 72, 56 72"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                    </svg>

                    {/* Transition Node "Start" Pill */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-300 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-10 select-none">
                      Start
                    </div>
                  </div>

                  {/* 2. CENTRAL ACTIVE EXECUTION HUB (Compact, Tasking, Question Mark on Header, NO Quality Contracts Card) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSection("execution");
                    }}
                    onDragLeave={() => setDragOverSection(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropToSection("execution");
                    }}
                    className={`w-64 bg-amber-50/60 border-2 ${
                      dragOverSection === "execution"
                        ? "border-amber-500 ring-4 ring-amber-500/20"
                        : "border-amber-300/90 hover:border-amber-400"
                    } rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs relative transition shrink-0`}
                  >
                    {/* Left Input Port */}
                    <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                    {/* Container Header with Question Mark Tooltip Trigger */}
                    <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                        <span className="font-bold text-[11px] uppercase tracking-wider text-amber-950">
                          ACTIVE EXECUTION HUB
                        </span>

                        {/* Question mark hover notification */}
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setShowQualityInfo(!showQualityInfo)}
                            className="w-4 h-4 rounded-full bg-amber-200/90 hover:bg-amber-300 text-amber-900 flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition shadow-2xs"
                            title="Quality Contracts & Pass Criteria Info"
                          >
                            ?
                          </button>

                          {/* Hover Notification Card */}
                          <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-6 w-64 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl z-30 text-xs border border-slate-700 pointer-events-none animate-in fade-in">
                            <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Quality Contracts &amp; Pass Criteria</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Enforces reviewer sign-off, checklist criteria, and proof evidence before activities can complete.
                            </p>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-amber-800/80 font-medium">
                        {executionColumns.length} stages
                      </span>
                    </div>

                    {/* Main Tasking Stage Card */}
                    {executionColumns.slice(0, 1).map((col) => {
                      const count = activitiesCountByStatus[col.id] || 0;
                      const isSelected = selectedColId === col.id;
                      return (
                        <div
                          key={col.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", col.id);
                            setDraggedStageId(col.id);
                          }}
                          onDragEnd={() => setDraggedStageId(null)}
                          onClick={() => setSelectedColId(col.id)}
                          className={`rounded-xl p-3 border transition cursor-pointer flex flex-col gap-2 shadow-2xs ${
                            isSelected
                              ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                              : "bg-white border-amber-200 hover:border-amber-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
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

                    {/* Dropzone Inside Active Execution Hub */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSection("execution");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropToSection("execution");
                      }}
                      className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 py-2.5 px-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Drop here to insert stage</span>
                    </div>

                    {/* Right Output Connector Port */}
                    <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-sm absolute -right-1.5 top-1/2 -translate-y-1/2 z-10" />
                  </div>

                  {/* SVG Curve Wires to Transition Pill "Verify" */}
                  <div className="w-14 h-44 relative shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 56 176">
                      {/* Lines fanning out to the 4 outcomes */}
                      {/* To Awaiting Review */}
                      <path
                        d="M 0 88 C 28 88, 28 28, 56 28"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                      {/* To Completed */}
                      <path
                        d="M 0 88 C 28 88, 28 68, 56 68"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                      {/* To Failed */}
                      <path
                        d="M 0 88 C 28 88, 28 108, 56 108"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                      {/* To Canceled */}
                      <path
                        d="M 0 88 C 28 88, 28 148, 56 148"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2.5"
                        strokeDasharray={isLivePreview ? "6 6" : "none"}
                        className={isLivePreview ? "animate-pulse" : ""}
                      />
                    </svg>

                    {/* Transition Node "Verify" Pill */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-purple-300 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-10 select-none">
                      Verify
                    </div>
                  </div>

                  {/* 3. OUTCOMES & DESTINATIONS CONTAINER (Compact, 4 Stages) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSection("outcomes");
                    }}
                    onDragLeave={() => setDragOverSection(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropToSection("outcomes");
                    }}
                    className={`w-72 bg-emerald-50/40 border-2 ${
                      dragOverSection === "outcomes"
                        ? "border-emerald-500 ring-4 ring-emerald-500/20"
                        : "border-emerald-200/90 hover:border-emerald-300"
                    } rounded-2xl p-3.5 flex flex-col gap-2 shadow-xs relative transition shrink-0`}
                  >
                    {/* Left Input Port */}
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm absolute -left-1.5 top-1/2 -translate-y-1/2 z-10" />

                    {/* Container Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-200/60">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-950">
                          OUTCOMES &amp; DESTINATIONS
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800/80 font-medium">
                        {outcomeColumns.length} stages
                      </span>
                    </div>

                    {/* Stage Cards Inside Outcomes */}
                    <div className="space-y-1.5">
                      {outcomeColumns.map((col) => {
                        const count = activitiesCountByStatus[col.id] || 0;
                        const isSelected = selectedColId === col.id;
                        const styles = getColumnStyles(col);

                        return (
                          <div
                            key={col.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", col.id);
                              setDraggedStageId(col.id);
                            }}
                            onDragEnd={() => setDraggedStageId(null)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverColId(col.id);
                            }}
                            onDragLeave={() => setDragOverColId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedStageId) handleDropOnCard(draggedStageId, col.id);
                            }}
                            onClick={() => setSelectedColId(col.id)}
                            className={`rounded-xl p-2 border transition cursor-pointer flex items-center justify-between shadow-2xs ${
                              dragOverColId === col.id
                                ? "border-purple-500 ring-2 ring-purple-500/40 bg-purple-50"
                                : isSelected
                                ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GripVertical className="w-3 h-3 text-slate-300 hover:text-slate-500 shrink-0" />
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${styles.dotClass}`}
                                style={styles.dotStyle}
                              />
                              <span
                                className="font-bold text-[11px] sm:text-xs uppercase tracking-tight text-slate-800 whitespace-nowrap"
                                title={col.label}
                              >
                                {col.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {count}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleHide(col.id);
                                }}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
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

                      {/* Dropzone Button */}
                      <button
                        type="button"
                        onClick={onOpenCreateColumn}
                        className="w-full py-2 rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Drop stage here to add outcome</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RIGHT SIDEBAR: STAGE INSPECTOR */}
            {isInspectorOpen && (
              <div className="w-60 bg-slate-50/70 border-l border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-150">
                {/* Inspector Header */}
                <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
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
                <div className="p-3 flex-1 overflow-y-auto space-y-3.5">
                  {/* Stage Properties Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-slate-900">Stage Properties</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>

                    {selectedCol ? (
                      <div className="space-y-3">
                        {/* Name Field */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={selectedCol.label}
                            onChange={(e) => handleRename(selectedCol.id, e.target.value)}
                            className="w-full bg-white border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-2.5 py-1 text-xs text-slate-900 focus:outline-none font-semibold transition shadow-2xs"
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
                            className={`w-full py-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer shadow-2xs ${
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
                          <div className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 flex items-center justify-between shadow-2xs">
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
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Color Theme
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {COLOR_THEMES.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => changeTheme(selectedCol.id, t.id)}
                                className={`w-6 h-6 rounded-xl transition hover:scale-110 cursor-pointer border flex items-center justify-center shadow-2xs ${
                                  selectedCol.colorTheme === t.id
                                    ? "border-slate-800 ring-2 ring-purple-600"
                                    : "border-black/10"
                                }`}
                                style={{ backgroundColor: t.hex }}
                                title={t.name}
                              >
                                {selectedCol.colorTheme === t.id && (
                                  <Check className="w-3 h-3 text-white drop-shadow" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Transition Rules Accordion */}
                        <div className="border-t border-slate-200 pt-2.5">
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
                            <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700 shadow-2xs animate-in fade-in">
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
                        <div className="border-t border-slate-200 pt-2.5 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                            Reorder Stage
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveEarlier(selectedCol.id)}
                              className="flex-1 py-1 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition cursor-pointer shadow-2xs"
                            >
                              Move Earlier
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLater(selectedCol.id)}
                              className="flex-1 py-1 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition cursor-pointer shadow-2xs"
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

      {/* "HOW TO USE" COMPREHENSIVE PIPELINE GUIDE MODAL */}
      {isHowToUseOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/25">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    How to Use the Pipeline Flow Builder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Master interactive workflow visualization, stages, and execution rules.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHowToUseOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guide Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
              {/* Section 1: Architecture Overview */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Pipeline Architecture &amp; The 3 Core Hubs</span>
                </h4>
                <p className="text-slate-600 leading-relaxed pl-7">
                  CampaignFlow connects social media production across three consecutive stages:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-7 pt-1">
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1">
                    <span className="font-bold text-blue-900 block">Inputs &amp; Initiation</span>
                    <p className="text-[11px] text-blue-800/80 leading-snug">
                      Where tasks are drafted (Draft) or given publishing deadlines (Scheduled).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-900 block">Active Execution Hub</span>
                    <p className="text-[11px] text-amber-800/80 leading-snug">
                      In-flight authoring (Tasking), content creation, and real-time production.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                    <span className="font-bold text-emerald-900 block">Outcomes &amp; Review</span>
                    <p className="text-[11px] text-emerald-800/80 leading-snug">
                      Verification gates routing to Review, Completed, Failed, or Canceled.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Drag, Drop & Reorder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Drag &amp; Drop Reordering</span>
                </h4>
                <ul className="space-y-1.5 pl-7 list-disc list-outside text-slate-600">
                  <li>
                    <strong>From Library:</strong> Click and drag any stage from the left Stage Library and drop it into any active hub on the canvas.
                  </li>
                  <li>
                    <strong>On Canvas:</strong> Drag cards by their <span className="text-slate-700 font-mono">⠿</span> handle and drop onto another card to swap or reorder positions.
                  </li>
                  <li>
                    <strong>Inspector Actions:</strong> You can also use the <em>Move Earlier</em> and <em>Move Later</em> buttons in the Stage Inspector.
                  </li>
                </ul>
              </div>

              {/* Section 3: Canvas Navigation (Pan & Zoom) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Canvas Navigation &amp; Hand Tool</span>
                </h4>
                <ul className="space-y-1.5 pl-7 list-disc list-outside text-slate-600">
                  <li>
                    <strong>Pan (Hand Tool):</strong> Select <span className="font-semibold text-purple-700">✋ Pan</span> from the top toolbar, then click and drag anywhere on the canvas to move the board around smoothly.
                  </li>
                  <li>
                    <strong>Select Tool:</strong> Switch to <span className="font-semibold text-purple-700">↖ Select</span> to click and inspect stage details on the right panel.
                  </li>
                  <li>
                    <strong>Zoom Controls:</strong> Use <strong>+</strong> and <strong>-</strong> to zoom in and out. Click the percentage (e.g. <strong>100%</strong>) to instantly re-center the entire board.
                  </li>
                </ul>
              </div>

              {/* Section 4: Quality Contracts & Deploy */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>Quality Contracts &amp; Deploying</span>
                </h4>
                <p className="pl-7 text-slate-600 leading-relaxed">
                  Hover or click the <strong>?</strong> icon on the Active Execution Hub to review your Quality Contracts criteria. When satisfied with your pipeline layout, click <span className="font-bold text-purple-700">Deploy Pipeline</span> to apply all stage settings across your team&apos;s workspace in real time.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHowToUseOpen(false)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
