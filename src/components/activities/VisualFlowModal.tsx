"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Save,
  AlertTriangle,
  Loader2,
  FolderPlus,
} from "lucide-react";
import {
  FlowColumn,
  PipelineField,
  DEFAULT_PIPELINE_FIELDS,
  loadPipelineFields,
  savePipelineFields,
  getColumnFieldId,
  getFieldStyles,
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
  onOpenCreateColumn: (defaultField?: string) => void;
  onResetToDefault: () => void;
  activitiesCountByStatus: Record<string, number>;
  pipelineFields?: PipelineField[];
  onUpdateFields?: (fields: PipelineField[]) => void;
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
  pipelineFields: initialPipelineFields,
  onUpdateFields,
}: VisualFlowModalProps) {
  const confirm = useConfirm();
  const { toast } = useToast();

  // Pipeline Fields state (Inputs, Execution, Outcomes + Custom Fields)
  const [pipelineFields, setPipelineFields] = useState<PipelineField[]>(() => {
    return initialPipelineFields && initialPipelineFields.length > 0
      ? initialPipelineFields
      : loadPipelineFields();
  });

  useEffect(() => {
    if (initialPipelineFields && initialPipelineFields.length > 0) {
      setPipelineFields(initialPipelineFields);
    }
  }, [initialPipelineFields]);

  // Add / Edit Field Modals
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"input" | "execution" | "outcome" | "custom">("execution");
  const [newFieldColor, setNewFieldColor] = useState("purple");

  const [editingField, setEditingField] = useState<PipelineField | null>(null);
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldColor, setEditFieldColor] = useState("purple");
  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false);

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

  // Working copy of columns (for responsive local state)
  const [workingColumns, setWorkingColumns] = useState<FlowColumn[]>(columns);
  // Snapshot of last confirmed saved columns
  const [savedColumns, setSavedColumns] = useState<FlowColumn[]>(columns);
  // Unsaved modifications flag
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Sync workingColumns when columns prop updates from outside (e.g. ColumnEditModal)
  useEffect(() => {
    setWorkingColumns(columns);
    setSavedColumns(columns);
    setIsDirty(false);
  }, [columns]);

  // Debounced Auto-Save: Automatically commit changes 1.8s after last edit
  useEffect(() => {
    if (!isDirty || !isOpen) return;

    const autoSaveTimer = setTimeout(() => {
      onUpdateColumns(workingColumns);
      setSavedColumns(workingColumns);
      savePipelineFields(undefined, pipelineFields);
      if (onUpdateFields) onUpdateFields(pipelineFields);
      setIsDirty(false);
    }, 1800);

    return () => clearTimeout(autoSaveTimer);
  }, [workingColumns, pipelineFields, isDirty, isOpen, onUpdateColumns, onUpdateFields]);

  // Selected column object
  const selectedCol = useMemo(() => {
    return (
      workingColumns.find((c) => c.id === selectedColId) ||
      workingColumns.find((c) => c.id === "in_progress") ||
      workingColumns[0]
    );
  }, [workingColumns, selectedColId]);

  const handleSavePipeline = () => {
    setIsSaving(true);
    onUpdateColumns(workingColumns);
    setSavedColumns(workingColumns);
    savePipelineFields(undefined, pipelineFields);
    if (onUpdateFields) onUpdateFields(pipelineFields);
    setIsDirty(false);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Pipeline Saved", "Workflow configuration saved and active across your workspace.");
    }, 150);
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = () => {
    onUpdateColumns(workingColumns);
    setSavedColumns(workingColumns);
    savePipelineFields(undefined, pipelineFields);
    if (onUpdateFields) onUpdateFields(pipelineFields);
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    toast.success("Pipeline Saved", "Workflow configuration saved.");
    onClose();
  };

  const handleDiscardAndClose = () => {
    setWorkingColumns(savedColumns);
    onUpdateColumns(savedColumns);
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    toast.info("Changes Discarded", "Unsaved pipeline changes discarded.");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showUnsavedPrompt) {
          setShowUnsavedPrompt(false);
        } else if (isHowToUseOpen) {
          setIsHowToUseOpen(false);
        } else {
          handleRequestClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, showUnsavedPrompt, isHowToUseOpen]);

  if (!isOpen) return null;

  const pushHistory = (newCols: FlowColumn[]) => {
    setHistory((prev) => [...prev, workingColumns]);
    setFuture([]);
    setWorkingColumns(newCols);
    setIsDirty(true);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [workingColumns, ...f]);
    setHistory((h) => h.slice(0, -1));
    setWorkingColumns(prev);
    setIsDirty(true);
    toast.info("Action undone", "Restored previous flow configuration.");
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, workingColumns]);
    setFuture((f) => f.slice(1));
    setWorkingColumns(next);
    setIsDirty(true);
    toast.info("Action redone", "Reapplied flow configuration.");
  };

  const toggleHide = (colId: string) => {
    const updated = workingColumns.map((c) =>
      c.id === colId ? { ...c, hidden: !c.hidden } : c
    );
    pushHistory(updated);
  };

  const handleRename = (colId: string, newLabel: string) => {
    const updated = workingColumns.map((c) =>
      c.id === colId ? { ...c, label: newLabel } : c
    );
    pushHistory(updated);
  };

  const changeTheme = (colId: string, themeId: string) => {
    const updated = workingColumns.map((c) =>
      c.id === colId ? { ...c, colorTheme: themeId, customHex: undefined } : c
    );
    pushHistory(updated);
  };

  const moveEarlier = (colId: string) => {
    const idx = workingColumns.findIndex((c) => c.id === colId);
    if (idx <= 0) return;
    const newCols = [...workingColumns];
    const temp = newCols[idx - 1];
    newCols[idx - 1] = newCols[idx];
    newCols[idx] = temp;
    pushHistory(newCols);
  };

  const moveLater = (colId: string) => {
    const idx = workingColumns.findIndex((c) => c.id === colId);
    if (idx < 0 || idx >= workingColumns.length - 1) return;
    const newCols = [...workingColumns];
    const temp = newCols[idx + 1];
    newCols[idx + 1] = newCols[idx];
    newCols[idx] = temp;
    pushHistory(newCols);
  };

  const deleteColumn = async (colId: string) => {
    if (workingColumns.length <= 1) {
      toast.error("Cannot remove stage", "You must have at least one stage in the flow.");
      return;
    }
    const target = workingColumns.find((c) => c.id === colId);
    const ok = await confirm({
      title: `Delete "${target?.label || colId}" stage?`,
      description: "This stage will be removed from your active flow pipeline.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (ok) {
      const remaining = workingColumns.filter((c) => c.id !== colId);
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
    const sourceIdx = workingColumns.findIndex((c) => c.id === sourceId);
    const targetIdx = workingColumns.findIndex((c) => c.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const targetFieldId = getColumnFieldId(workingColumns[targetIdx], pipelineFields);
    const newCols = [...workingColumns];
    const [moved] = newCols.splice(sourceIdx, 1);
    const updatedMoved = { ...moved, field: targetFieldId };
    newCols.splice(targetIdx, 0, updatedMoved);
    pushHistory(newCols);
    toast.success("Stage reordered", `Moved "${moved.label}"`);
    setDraggedStageId(null);
    setDragOverColId(null);
  };

  const handleDropToSection = (targetSectionId: string) => {
    if (!draggedStageId) return;
    const sourceIdx = workingColumns.findIndex((c) => c.id === draggedStageId);
    if (sourceIdx === -1) return;

    const newCols = [...workingColumns];
    const moved = { ...newCols[sourceIdx], field: targetSectionId };
    newCols.splice(sourceIdx, 1);

    // Find insertion index in newCols for this field
    let targetIndex = -1;
    for (let i = newCols.length - 1; i >= 0; i--) {
      if (getColumnFieldId(newCols[i], pipelineFields) === targetSectionId) {
        targetIndex = i + 1;
        break;
      }
    }
    if (targetIndex === -1) {
      newCols.push(moved);
    } else {
      newCols.splice(targetIndex, 0, moved);
    }

    pushHistory(newCols);
    const targetField = pipelineFields.find((f) => f.id === targetSectionId);
    toast.success(
      "Stage moved",
      `Placed "${moved.label}" into ${targetField?.name || targetSectionId}`
    );
    setDraggedStageId(null);
    setDragOverSection(null);
  };

  const handleAssignStageField = (colId: string, fieldId: string) => {
    const updated = workingColumns.map((c) =>
      c.id === colId ? { ...c, field: fieldId } : c
    );
    pushHistory(updated);
    const targetField = pipelineFields.find((f) => f.id === fieldId);
    toast.success("Stage updated", `Moved to ${targetField?.name || fieldId}`);
  };

  const handleCreateField = () => {
    if (!newFieldName.trim()) return;
    const newField: PipelineField = {
      id: `field_${Date.now()}`,
      name: newFieldName.trim(),
      type: newFieldType,
      colorTheme: newFieldColor,
      isCustom: true,
      description: "Custom workflow pipeline stage section.",
    };
    const outcomesIdx = pipelineFields.findIndex(
      (f) => f.id === "outcomes" || f.type === "outcome"
    );
    const updated = [...pipelineFields];
    if (outcomesIdx !== -1) {
      updated.splice(outcomesIdx, 0, newField);
    } else {
      updated.push(newField);
    }
    setPipelineFields(updated);
    savePipelineFields(undefined, updated);
    if (onUpdateFields) onUpdateFields(updated);
    setIsDirty(true);
    setIsAddFieldModalOpen(false);
    setNewFieldName("");
    toast.success("Field added", `Added "${newField.name}" to pipeline`);
  };

  const handleOpenEditField = (field: PipelineField) => {
    setEditingField(field);
    setEditFieldName(field.name);
    setEditFieldColor(field.colorTheme || "purple");
    setIsEditFieldModalOpen(true);
  };

  const handleSaveEditField = () => {
    if (!editingField || !editFieldName.trim()) return;
    const updated = pipelineFields.map((f) =>
      f.id === editingField.id
        ? { ...f, name: editFieldName.trim(), colorTheme: editFieldColor }
        : f
    );
    setPipelineFields(updated);
    savePipelineFields(undefined, updated);
    if (onUpdateFields) onUpdateFields(updated);
    setIsDirty(true);
    setIsEditFieldModalOpen(false);
    toast.success("Field updated", `Updated "${editFieldName.trim()}"`);
  };

  const handleDeleteField = async (fieldId: string) => {
    const field = pipelineFields.find((f) => f.id === fieldId);
    if (!field) return;
    const ok = await confirm({
      title: `Delete Field: ${field.name}?`,
      description: `Any stages currently in this field will be safely reassigned to Outcomes.`,
      confirmLabel: "Delete Field",
      confirmVariant: "rose",
    });
    if (!ok) return;

    const updatedCols = workingColumns.map((c) =>
      getColumnFieldId(c, pipelineFields) === fieldId ? { ...c, field: "outcomes" } : c
    );
    const updatedFields = pipelineFields.filter((f) => f.id !== fieldId);
    setWorkingColumns(updatedCols);
    pushHistory(updatedCols);
    setPipelineFields(updatedFields);
    savePipelineFields(undefined, updatedFields);
    if (onUpdateFields) onUpdateFields(updatedFields);
    setIsDirty(true);
    setIsEditFieldModalOpen(false);
    toast.success("Field deleted", `Removed "${field.name}"`);
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
  const inputColumns = workingColumns.filter(
    (c) => c.id === "draft" || c.id === "scheduled" || c.step === "1" || c.step === "2"
  );
  const executionColumns = workingColumns.filter(
    (c) => c.id === "in_progress" || c.step === "3"
  );
  const outcomeColumns = workingColumns.filter(
    (c) =>
      c.id !== "draft" &&
      c.id !== "scheduled" &&
      c.id !== "in_progress" &&
      c.step !== "1" &&
      c.step !== "2" &&
      c.step !== "3"
  );

  // Filtered list for Stage Library search
  const filteredLibraryColumns = workingColumns.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Centered Modal Overlay below Navbar with balanced margins */}
      <div
        className="fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-950/40 backdrop-blur-xs select-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleRequestClose();
        }}
      >
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[1440px] h-[calc(100vh-8.5rem)] max-h-[760px] min-h-[460px] flex flex-col overflow-hidden relative font-sans my-auto">
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
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                      isDirty
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    {isDirty ? "Unsaved changes" : "Connected / Auto-saved"}
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

              {/* Save Pipeline Button (Replaced Deploy Pipeline) */}
              <button
                type="button"
                onClick={handleSavePipeline}
                disabled={isSaving}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                  isDirty
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25 ring-2 ring-purple-400/40"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/15"
                }`}
                title={isDirty ? "Save changes to pipeline" : "Pipeline up to date"}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Pipeline</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer ml-1"
                title="Close builder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Studio Body: Library Sidebar | Center Canvas | Stage Inspector */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {/* 1. LEFT SIDEBAR: STAGE LIBRARY */}
            {isLibraryOpen && (
              <div className="w-60 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-left duration-150 min-h-0">
                {/* Library Header */}
                <div className="p-3 pb-2.5 border-b border-slate-200/80 shrink-0">
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
                    onClick={() => onOpenCreateColumn()}
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
                  {pipelineFields.map((field) => {
                    const fieldCols = filteredLibraryColumns.filter(
                      (c) => getColumnFieldId(c, pipelineFields) === field.id
                    );

                    return (
                      <div key={field.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                            {field.name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            {fieldCols.length}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {fieldCols.map((c) => {
                            const cStyles = getColumnStyles(c);
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
                                <div className="flex items-center gap-2 min-w-0">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${cStyles.dotClass}`}
                                    style={cStyles.dotStyle}
                                  />
                                  <span className="text-xs font-semibold truncate">{c.label}</span>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 shrink-0">
                                  {field.type}
                                </span>
                              </div>
                            );
                          })}
                          {fieldCols.length === 0 && (
                            <div className="text-[10px] text-slate-400 italic p-1.5 text-center">
                              No stages in this field
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Custom Stage Button */}
                <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenCreateColumn()}
                    className="w-full py-1.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/40 text-slate-600 hover:text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Custom Stage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFieldName("");
                      setNewFieldColor("purple");
                      setIsAddFieldModalOpen(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl border border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100/70 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ Add Pipeline Field</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. CENTER INTERACTIVE CANVAS (Fits default on board, supports Pan Hand & Zoom) */}
            <div
              className="flex-1 flex flex-col relative overflow-hidden bg-[#f8fafc] select-none min-h-0"
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
                    onClick={() => onOpenCreateColumn()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stage</span>
                  </button>

                  {/* Add Field */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewFieldName("");
                      setNewFieldColor("purple");
                      setIsAddFieldModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Add Field</span>
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
                className="flex-1 overflow-hidden relative flex items-center justify-center p-4 pt-14 min-h-0"
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
                  {pipelineFields.map((field, fIdx) => {
                    const fieldCols = workingColumns.filter(
                      (c) => getColumnFieldId(c, pipelineFields) === field.id
                    );
                    const isFirst = fIdx === 0;
                    const isLast = fIdx === pipelineFields.length - 1;
                    const isExecution = field.id === "execution" || field.type === "execution";
                    const isInput = field.id === "inputs" || field.type === "input";
                    const isOutcome = field.id === "outcomes" || field.type === "outcome";
                    const styles = getFieldStyles(field);
                    const isDragOver = dragOverSection === field.id;
                    const nextField = !isLast ? pipelineFields[fIdx + 1] : null;

                    const transitionPillText = isFirst
                      ? "Start"
                      : nextField && (nextField.id === "outcomes" || nextField.type === "outcome")
                      ? "Verify"
                      : isExecution
                      ? "Verify"
                      : "Process";

                    return (
                      <React.Fragment key={field.id}>
                        {/* Container for this Field */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSection(field.id);
                          }}
                          onDragLeave={() => setDragOverSection(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropToSection(field.id);
                          }}
                          className={`w-64 sm:w-72 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs relative transition shrink-0 border-2 ${
                            isDragOver
                              ? "border-purple-500 ring-4 ring-purple-500/20"
                              : ""
                          }`}
                          style={{
                            backgroundColor: styles.containerBg,
                            borderColor: isDragOver ? undefined : styles.borderColor,
                          }}
                        >
                          {/* Left Input Port */}
                          {!isFirst && (
                            <div
                              className="w-3 h-3 rounded-full border-2 border-white shadow-sm absolute -left-1.5 top-1/2 -translate-y-1/2 z-10"
                              style={{ backgroundColor: styles.portBg }}
                            />
                          )}

                          {/* Container Header */}
                          <div
                            className="flex items-center justify-between pb-1 border-b"
                            style={{ borderColor: styles.borderColor }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isInput ? (
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: styles.hex }} />
                              ) : isExecution ? (
                                <Play className="w-3.5 h-3.5 shrink-0" style={{ color: styles.hex, fill: styles.hex }} />
                              ) : isOutcome ? (
                                <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: styles.hex }} />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: styles.hex }} />
                              )}
                              <span
                                className="font-bold text-[11px] uppercase tracking-wider truncate"
                                style={{ color: styles.headerText }}
                              >
                                {field.name}
                              </span>

                              {/* Question mark hover notification if execution */}
                              {isExecution && (
                                <div className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => setShowQualityInfo(!showQualityInfo)}
                                    className="w-4 h-4 rounded-full bg-amber-200/90 hover:bg-amber-300 text-amber-900 flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition shadow-2xs"
                                    title="Quality Contracts & Pass Criteria Info"
                                  >
                                    ?
                                  </button>
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
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
                                style={{ backgroundColor: styles.badgeBg, color: styles.headerText }}
                              >
                                {fieldCols.length} {fieldCols.length === 1 ? "stage" : "stages"}
                              </span>

                              {/* Settings / Edit button for this field */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditField(field)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                                title="Configure field"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Stage Cards Inside this Field */}
                          <div className="space-y-2">
                            {fieldCols.map((col) => {
                              const count = activitiesCountByStatus[col.id] || 0;
                              const isSelected = selectedColId === col.id;
                              const colStyles = getColumnStyles(col);

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
                                      ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                                  } ${col.hidden ? "opacity-50 border-dashed" : ""}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <GripVertical className="w-3 h-3 text-slate-300 hover:text-slate-500 shrink-0" />
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${colStyles.dotClass}`}
                                      style={colStyles.dotStyle}
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

                                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleHide(col.id);
                                      }}
                                      className="p-0.5 hover:text-slate-700 rounded transition cursor-pointer"
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
                                      className="p-0.5 hover:text-slate-700 rounded transition cursor-pointer"
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
                              onClick={() => onOpenCreateColumn(field.id)}
                              className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/50 text-slate-600 hover:text-purple-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert stage here (Drop)</span>
                            </button>
                          </div>

                          {/* Right Output Connector Port */}
                          {!isLast && (
                            <div
                              className="w-3 h-3 rounded-full border-2 border-white shadow-sm absolute -right-1.5 top-1/2 -translate-y-1/2 z-10"
                              style={{ backgroundColor: styles.portBg }}
                            />
                          )}
                        </div>

                        {/* Connector Wires & Transition Pill between fields */}
                        {!isLast && nextField && (
                          <div className="w-14 h-40 relative shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 56 160">
                              {isFirst && fieldCols.length >= 2 ? (
                                <>
                                  <path
                                    d="M 0 50 C 28 50, 28 80, 56 80"
                                    fill="none"
                                    stroke={styles.wireStroke}
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                  <path
                                    d="M 0 110 C 28 110, 28 80, 56 80"
                                    fill="none"
                                    stroke={styles.wireStroke}
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                </>
                              ) : (nextField.id === "outcomes" || nextField.type === "outcome") &&
                                workingColumns.filter(
                                  (c) => getColumnFieldId(c, pipelineFields) === nextField.id
                                ).length >= 3 ? (
                                <>
                                  <path
                                    d="M 0 80 C 28 80, 28 30, 56 30"
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                  <path
                                    d="M 0 80 C 28 80, 28 65, 56 65"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                  <path
                                    d="M 0 80 C 28 80, 28 95, 56 95"
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                  <path
                                    d="M 0 80 C 28 80, 28 130, 56 130"
                                    fill="none"
                                    stroke="#64748b"
                                    strokeWidth="2.5"
                                    strokeDasharray={isLivePreview ? "6 6" : "none"}
                                    className={isLivePreview ? "animate-pulse" : ""}
                                  />
                                </>
                              ) : (
                                <path
                                  d="M 0 80 C 28 80, 28 80, 56 80"
                                  fill="none"
                                  stroke={styles.wireStroke}
                                  strokeWidth="2.5"
                                  strokeDasharray={isLivePreview ? "6 6" : "none"}
                                  className={isLivePreview ? "animate-pulse" : ""}
                                />
                              )}
                            </svg>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-purple-300 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-10 select-none whitespace-nowrap">
                              {transitionPillText}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. RIGHT SIDEBAR: STAGE INSPECTOR */}
            {isInspectorOpen && (
              <div className="w-60 bg-slate-50/70 border-l border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-150 min-h-0">
                {/* Inspector Header */}
                <div className="p-3 border-b border-slate-200/80 flex items-center justify-between shrink-0">
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
                <div className="p-3 flex-1 overflow-y-auto space-y-3.5 min-h-0">
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

                        {/* Pipeline Field / Section Property */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Pipeline Field / Section
                          </label>
                          <select
                            value={selectedCol.field || getColumnFieldId(selectedCol, pipelineFields)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__add_new__") {
                                setNewFieldName("");
                                setNewFieldColor("purple");
                                setIsAddFieldModalOpen(true);
                                return;
                              }
                              handleAssignStageField(selectedCol.id, val);
                            }}
                            className="w-full bg-white border border-slate-200/90 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none font-semibold transition shadow-2xs cursor-pointer"
                          >
                            {pipelineFields.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} (
                                {f.type === "input"
                                  ? "Input"
                                  : f.type === "execution"
                                  ? "Execution"
                                  : f.type === "outcome"
                                  ? "Outcome"
                                  : "Custom"}
                                )
                              </option>
                            ))}
                            <option value="__add_new__">+ Add New Field...</option>
                          </select>
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
                <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
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
                  Hover or click the <strong>?</strong> icon on the Active Execution Hub to review your Quality Contracts criteria. When satisfied with your pipeline layout, click <span className="font-bold text-purple-700">Save Pipeline</span> to apply all stage settings across your team&apos;s workspace in real time.
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

      {/* ADD PIPELINE FIELD MODAL */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add Pipeline Field</h3>
                  <p className="text-[11px] text-slate-500">Create a new section in your workflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Quality Assurance, Staging, Client Review"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Field Role
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "execution", label: "Execution" },
                    { id: "outcome", label: "Outcome" },
                    { id: "input", label: "Input" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewFieldType(t.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        newFieldType === t.id
                          ? "bg-purple-50 border-purple-400 text-purple-900 shadow-2xs ring-2 ring-purple-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {["purple", "indigo", "teal", "orange", "rose"].map((cId) => {
                    const t = COLOR_THEMES.find((theme) => theme.id === cId);
                    if (!t) return null;
                    return (
                      <button
                        key={cId}
                        type="button"
                        onClick={() => setNewFieldColor(cId)}
                        className={`h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          newFieldColor === cId
                            ? "ring-2 ring-purple-600 scale-105 border-slate-800 shadow-xs"
                            : "border-black/10 hover:scale-105"
                        }`}
                        style={{ backgroundColor: t.hex }}
                      >
                        {newFieldColor === cId && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateField}
                disabled={!newFieldName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Create Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PIPELINE FIELD MODAL */}
      {isEditFieldModalOpen && editingField && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Configure Field: {editingField.name}</h3>
                  <p className="text-[11px] text-slate-500">Edit title, appearance, or manage field</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditFieldModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                  placeholder="Field Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {["sky", "amber", "emerald", "purple", "rose"].map((cId) => {
                    const t = COLOR_THEMES.find((theme) => theme.id === cId);
                    if (!t) return null;
                    return (
                      <button
                        key={cId}
                        type="button"
                        onClick={() => setEditFieldColor(cId)}
                        className={`h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          editFieldColor === cId
                            ? "ring-2 ring-purple-600 scale-105 border-slate-800 shadow-xs"
                            : "border-black/10 hover:scale-105"
                        }`}
                        style={{ backgroundColor: t.hex }}
                      >
                        {editFieldColor === cId && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingField.isCustom && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteField(editingField.id)}
                    className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Field</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsEditFieldModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditField}
                disabled={!editFieldName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES PROMPT MODAL */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-150 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              Unsaved Pipeline Changes
            </h3>
            <p className="text-xs text-slate-500 mt-2 px-1 leading-relaxed">
              You have unsaved changes to your pipeline architecture. Would you like to save them before closing, or discard them?
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-6 pt-1">
              {/* Discard Changes Button */}
              <button
                type="button"
                onClick={handleDiscardAndClose}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer"
              >
                Discard Changes
              </button>

              {/* Save Changes Button */}
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>

            {/* Cancel / Keep Editing */}
            <button
              type="button"
              onClick={() => setShowUnsavedPrompt(false)}
              className="mt-3.5 text-xs text-slate-400 hover:text-slate-700 font-medium transition cursor-pointer block mx-auto"
            >
              Cancel / Keep Editing
            </button>
          </div>
        </div>
      )}
    </>
  );
}
