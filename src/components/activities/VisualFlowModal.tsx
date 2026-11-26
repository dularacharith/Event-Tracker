"use client";

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
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
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import {
  FlowColumn,
  PipelineField,
  DEFAULT_PIPELINE_FIELDS,
  loadPipelineFields,
  savePipelineFields,
  saveFlowColumns,
  getColumnFieldId,
  getFieldStyles,
  COLOR_THEMES,
  getColumnStyles,
  sortColumnsByPipeline,
  PRESET_FIELD_ICONS,
  getFieldIconComponent,
  getResolvedFieldConnector,
  getConnectorSymbolComponent,
  getConnectorStyles,
} from "@/lib/flowColumns";
import { ConnectorEditModal } from "@/components/activities/ConnectorEditModal";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/Toast";

interface VisualFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: FlowColumn[];
  onUpdateColumns: (cols: FlowColumn[]) => void;
  onOpenEditColumn: (col: FlowColumn) => void;
  onOpenCreateColumn: (defaultField?: string, inLibrary?: boolean) => void;
  onResetToDefault: () => void;
  activitiesCountByStatus: Record<string, number>;
  pipelineFields?: PipelineField[];
  onUpdateFields?: (fields: PipelineField[]) => void;
  onSavePipelineFlow?: (cols: FlowColumn[], fields: PipelineField[]) => void;
  workspaceId?: string;
}

interface WirePath {
  id: string;
  d: string;
  color: string;
  isDash: boolean;
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
  onSavePipelineFlow,
  workspaceId,
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
  const [newFieldIcon, setNewFieldIcon] = useState("Zap");

  const [editingField, setEditingField] = useState<PipelineField | null>(null);
  const [editFieldName, setEditFieldName] = useState("");
  const [editFieldType, setEditFieldType] = useState<"input" | "execution" | "outcome" | "custom">("execution");
  const [editFieldColor, setEditFieldColor] = useState("purple");
  const [editFieldIcon, setEditFieldIcon] = useState("FileText");
  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<{ field: PipelineField; fIdx: number } | null>(null);

  // Selected stage for the Stage Inspector
  const [selectedColId, setSelectedColId] = useState<string>("in_progress");
  const [searchQuery, setSearchQuery] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<WirePath[]>([]);
  const [activeTool, setActiveTool] = useState<"pan" | "select">("select");
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [showQualityInfo, setShowQualityInfo] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-fit board to canvas
  const autoFitCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const availableW = canvasRef.current.clientWidth - 40;
    const availableH = canvasRef.current.clientHeight - 40;
    if (availableW <= 0 || availableH <= 0) return;
    const boardW = 760;
    const boardH = 360;
    const scaleW = availableW / boardW;
    const scaleH = availableH / boardH;
    const maxScale = isExpanded ? 1.05 : 0.9;
    const targetScale = Math.min(maxScale, Math.max(0.55, Math.min(scaleW, scaleH)));
    const pct = Math.round(targetScale * 100);
    setZoomLevel(pct);
    setPan({ x: 0, y: 0 });
  }, [isExpanded]);

  useEffect(() => {
    const timer = setTimeout(autoFitCanvas, 150);
    return () => clearTimeout(timer);
  }, [autoFitCanvas, isLibraryOpen, isInspectorOpen, isExpanded]);

  // Drag and drop state
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverDropzoneSection, setDragOverDropzoneSection] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below">("below");
  const [isDragOverLibrary, setIsDragOverLibrary] = useState(false);
  const [dragOverLibraryField, setDragOverLibraryField] = useState<string | null>(null);

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
  // Snapshot of last confirmed saved fields
  const [savedFields, setSavedFields] = useState<PipelineField[]>(() => {
    return initialPipelineFields && initialPipelineFields.length > 0
      ? initialPipelineFields
      : loadPipelineFields();
  });
  // Unsaved modifications flag
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Sync workingColumns & pipelineFields when modal opens or external updates occur
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      if (!prevIsOpenRef.current) {
        const activeFields =
          initialPipelineFields && initialPipelineFields.length > 0
            ? initialPipelineFields
            : loadPipelineFields(workspaceId);
        setWorkingColumns(columns);
        setSavedColumns(columns);
        setPipelineFields(activeFields);
        setSavedFields(activeFields);
        setHistory([]);
        setFuture([]);
        setIsDirty(false);
        setShowUnsavedPrompt(false);
      } else {
        // Modal is already open; if external modal (like ColumnEditModal) added or edited columns, sync them into workingColumns
        setWorkingColumns((prevWorking) => {
          const externalMap = new Map(columns.map((c) => [c.id, c]));
          const updated = prevWorking.map((c) => {
            const ext = externalMap.get(c.id);
            if (ext) {
              return {
                ...c,
                label: ext.label,
                colorTheme: ext.colorTheme,
                customHex: ext.customHex,
                customDotHex: ext.customDotHex,
                hidden: ext.hidden,
                field: ext.field || c.field,
                inLibrary: ext.inLibrary !== undefined ? ext.inLibrary : c.inLibrary,
              };
            }
            return c;
          });
          const currentIds = new Set(updated.map((c) => c.id));
          const newCols = columns.filter((c) => !currentIds.has(c.id));
          if (newCols.length > 0) {
            return sortColumnsByPipeline([...updated, ...newCols], pipelineFields);
          }
          return updated;
        });
        if (initialPipelineFields && initialPipelineFields.length > 0) {
          setPipelineFields((prevFields) => {
            const fieldIds = new Set(prevFields.map((f) => f.id));
            const newFields = initialPipelineFields.filter((f) => !fieldIds.has(f.id));
            return newFields.length > 0 ? [...prevFields, ...newFields] : prevFields;
          });
        }
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, columns, initialPipelineFields, workspaceId]);

  // Selected column object
  const selectedCol = useMemo(() => {
    return (
      workingColumns.find((c) => c.id === selectedColId) ||
      workingColumns.find((c) => !c.inLibrary && c.id === "in_progress") ||
      workingColumns.find((c) => !c.inLibrary) ||
      workingColumns[0]
    );
  }, [workingColumns, selectedColId]);

  // Dynamic multi-stage connection wires calculation
  const updateWires = useCallback(() => {
    if (!boardRef.current) return;
    const boardEl = boardRef.current;
    const boardRect = boardEl.getBoundingClientRect();
    const scale = zoomLevel / 100;
    if (!scale || scale <= 0 || boardRect.width === 0) return;

    const newWires: WirePath[] = [];

    pipelineFields.forEach((field, fIdx) => {
      if (fIdx >= pipelineFields.length - 1) return;
      const nextField = pipelineFields[fIdx + 1];
      if (!nextField) return;

      const pillEl = boardEl.querySelector(`[data-connector-btn="${fIdx}"]`) as HTMLElement | null;
      if (!pillEl) return;
      const pillRect = pillEl.getBoundingClientRect();
      const pillLeftX = (pillRect.left - boardRect.left) / scale;
      const pillRightX = (pillRect.right - boardRect.left) / scale;
      const pillCenterY = (pillRect.top + pillRect.height / 2 - boardRect.top) / scale;

      // Visible source stages in Field A (canvas only, not hidden)
      const colsA = workingColumns.filter(
        (c) => getColumnFieldId(c, pipelineFields) === field.id && !c.inLibrary && !c.hidden
      );

      // Visible target stages in Field B (canvas only, not hidden)
      const colsB = workingColumns.filter(
        (c) => getColumnFieldId(c, pipelineFields) === nextField.id && !c.inLibrary && !c.hidden
      );

      // 1. Output wire from each visible stage in Field A into connector pill
      colsA.forEach((col) => {
        const portEl = boardEl.querySelector(`[data-port-output="${col.id}"]`) as HTMLElement | null;
        if (!portEl) return;
        const portRect = portEl.getBoundingClientRect();
        const startX = (portRect.left + portRect.width / 2 - boardRect.left) / scale;
        const startY = (portRect.top + portRect.height / 2 - boardRect.top) / scale;

        const dx = Math.max(24, pillLeftX - startX);
        const cp1X = startX + dx * 0.5;
        const cp1Y = startY;
        const cp2X = pillLeftX - dx * 0.5;
        const cp2Y = pillCenterY;
        const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${pillLeftX} ${pillCenterY}`;

        const colStyles = getColumnStyles(col);
        const color = colStyles.dotHex || colStyles.accentHex;

        newWires.push({
          id: `wire-out-${col.id}-${fIdx}`,
          d,
          color,
          isDash: isLivePreview,
        });
      });

      // 2. Input wire from connector pill into each visible stage in Field B
      colsB.forEach((col) => {
        const portEl = boardEl.querySelector(`[data-port-input="${col.id}"]`) as HTMLElement | null;
        if (!portEl) return;
        const portRect = portEl.getBoundingClientRect();
        const endX = (portRect.left + portRect.width / 2 - boardRect.left) / scale;
        const endY = (portRect.top + portRect.height / 2 - boardRect.top) / scale;

        const dx = Math.max(24, endX - pillRightX);
        const cp1X = pillRightX + dx * 0.5;
        const cp1Y = pillCenterY;
        const cp2X = endX - dx * 0.5;
        const cp2Y = endY;
        const d = `M ${pillRightX} ${pillCenterY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

        const colStyles = getColumnStyles(col);
        const color = colStyles.dotHex || colStyles.accentHex;

        newWires.push({
          id: `wire-in-${fIdx}-${col.id}`,
          d,
          color,
          isDash: isLivePreview,
        });
      });
    });

    setWires(newWires);
  }, [workingColumns, pipelineFields, zoomLevel, isLivePreview]);

  useLayoutEffect(() => {
    updateWires();
    const t1 = setTimeout(updateWires, 20);
    const t2 = setTimeout(updateWires, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [updateWires]);

  useEffect(() => {
    if (!boardRef.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      updateWires();
    });
    ro.observe(boardRef.current);
    const children = boardRef.current.children;
    for (let i = 0; i < children.length; i++) {
      ro.observe(children[i]);
    }
    return () => ro.disconnect();
  }, [updateWires]);

  useEffect(() => {
    window.addEventListener("resize", updateWires);
    return () => window.removeEventListener("resize", updateWires);
  }, [updateWires]);

  useEffect(() => {
    const timer = setTimeout(updateWires, 160);
    return () => clearTimeout(timer);
  }, [isLibraryOpen, isInspectorOpen, isExpanded, updateWires]);

  const handleSavePipeline = () => {
    setIsSaving(true);
    const sorted = sortColumnsByPipeline(workingColumns, pipelineFields);
    setSavedColumns(sorted);
    setSavedFields(pipelineFields);
    setWorkingColumns(sorted);

    // Persist to storage
    saveFlowColumns(workspaceId, sorted);
    savePipelineFields(workspaceId, pipelineFields);

    // Apply to parent activities board atomically
    if (onSavePipelineFlow) {
      onSavePipelineFlow(sorted, pipelineFields);
    } else {
      onUpdateColumns(sorted);
      if (onUpdateFields) onUpdateFields(pipelineFields);
    }

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
    handleSavePipeline();
    setShowUnsavedPrompt(false);
    onClose();
  };

  const handleDiscardAndClose = () => {
    // Revert all unsaved working state to original saved snapshot
    setWorkingColumns(savedColumns);
    setPipelineFields(savedFields);
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    toast.info("Changes Discarded", "Unsaved pipeline changes were discarded.");
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
        } else if (isAddFieldModalOpen) {
          setIsAddFieldModalOpen(false);
        } else if (isEditFieldModalOpen) {
          setIsEditFieldModalOpen(false);
        } else if (editingConnector) {
          setEditingConnector(null);
        } else {
          handleRequestClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, showUnsavedPrompt, isHowToUseOpen, isAddFieldModalOpen, isEditFieldModalOpen, editingConnector]);

  if (!isOpen || !mounted) return null;

  const pushHistory = (newCols: FlowColumn[], fields: PipelineField[] = pipelineFields) => {
    setHistory((prev) => [...prev, workingColumns]);
    setFuture([]);
    const sorted = sortColumnsByPipeline(newCols, fields);
    setWorkingColumns(sorted);
    setPipelineFields(fields);
    setIsDirty(true);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [workingColumns, ...f]);
    setHistory((h) => h.slice(0, -1));
    const sorted = sortColumnsByPipeline(prev, pipelineFields);
    setWorkingColumns(sorted);
    setIsDirty(true);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, workingColumns]);
    setFuture((f) => f.slice(1));
    const sorted = sortColumnsByPipeline(next, pipelineFields);
    setWorkingColumns(sorted);
    setIsDirty(true);
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
    }
  };

  // Reordering via Drag and Drop with precise above/below detection
  const handleDropOnCard = (
    sourceId: string,
    targetId: string,
    position: "above" | "below" = "below"
  ) => {
    if (sourceId === targetId) return;
    const sourceIdx = workingColumns.findIndex((c) => c.id === sourceId);
    const targetIdx = workingColumns.findIndex((c) => c.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const targetFieldId = getColumnFieldId(workingColumns[targetIdx], pipelineFields);
    const newCols = [...workingColumns];
    const [moved] = newCols.splice(sourceIdx, 1);
    const updatedMoved = { ...moved, field: targetFieldId, inLibrary: false };

    // Find new index of target in newCols after removing source
    let newTargetIdx = newCols.findIndex((c) => c.id === targetId);
    if (newTargetIdx === -1) {
      newCols.push(updatedMoved);
    } else {
      const insertionIdx = position === "below" ? newTargetIdx + 1 : newTargetIdx;
      newCols.splice(insertionIdx, 0, updatedMoved);
    }

    pushHistory(newCols);
    setDraggedStageId(null);
    setDragOverColId(null);
    setDropPosition("below");
  };

  const handleDropToSection = (targetSectionId: string) => {
    if (!draggedStageId) return;
    const sourceIdx = workingColumns.findIndex((c) => c.id === draggedStageId);
    if (sourceIdx === -1) return;

    const newCols = [...workingColumns];
    const [moved] = newCols.splice(sourceIdx, 1);
    const updatedMoved = { ...moved, field: targetSectionId, inLibrary: false };

    // Find last index of this section in newCols
    let lastSectionIdx = -1;
    for (let i = newCols.length - 1; i >= 0; i--) {
      if (getColumnFieldId(newCols[i], pipelineFields) === targetSectionId) {
        lastSectionIdx = i;
        break;
      }
    }

    if (lastSectionIdx !== -1) {
      newCols.splice(lastSectionIdx + 1, 0, updatedMoved);
    } else {
      newCols.push(updatedMoved);
    }

    pushHistory(newCols);
    setDraggedStageId(null);
    setDragOverSection(null);
    setDragOverColId(null);
    setDragOverDropzoneSection(null);
  };

  // Move stage back to Stage Library (unplaced)
  const handleDropToLibrary = (stageId: string, targetFieldId?: string) => {
    const col = workingColumns.find((c) => c.id === stageId);
    if (!col) return;

    // Safety guard: ensure at least one active stage remains on canvas
    const placedOnCanvas = workingColumns.filter((c) => !c.inLibrary);
    if (placedOnCanvas.length <= 1 && !col.inLibrary) {
      toast.info("Active Stage Required", "At least one stage must remain active on the pipeline canvas.");
      setIsDragOverLibrary(false);
      setDragOverLibraryField(null);
      setDraggedStageId(null);
      return;
    }

    const updated = workingColumns.map((c) => {
      if (c.id === stageId) {
        return {
          ...c,
          inLibrary: true,
          ...(targetFieldId ? { field: targetFieldId } : {}),
        };
      }
      return c;
    });

    pushHistory(updated);
    setIsDragOverLibrary(false);
    setDragOverLibraryField(null);
    setDraggedStageId(null);
    setSelectedColId(stageId);
  };

  // Place stage from Stage Library onto canvas
  const handlePlaceOnCanvas = (stageId: string, targetFieldId?: string) => {
    const updated = workingColumns.map((c) => {
      if (c.id === stageId) {
        return {
          ...c,
          inLibrary: false,
          ...(targetFieldId ? { field: targetFieldId } : {}),
        };
      }
      return c;
    });
    pushHistory(updated);
    setSelectedColId(stageId);
  };

  const handleAssignStageField = (colId: string, fieldId: string) => {
    const updated = workingColumns.map((c) =>
      c.id === colId ? { ...c, field: fieldId } : c
    );
    pushHistory(updated);
  };

  const handleCreateField = () => {
    if (!newFieldName.trim()) return;
    const newField: PipelineField = {
      id: `field_${Date.now()}`,
      name: newFieldName.trim(),
      type: newFieldType,
      colorTheme: newFieldColor,
      icon: newFieldIcon,
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
    pushHistory(workingColumns, updated);
    setIsAddFieldModalOpen(false);
    setNewFieldName("");
  };

  const handleOpenEditField = (field: PipelineField) => {
    setEditingField(field);
    setEditFieldName(field.name);
    setEditFieldType(field.type);
    setEditFieldColor(field.colorTheme || "purple");
    setEditFieldIcon(
      field.icon ||
        (field.type === "input"
          ? "FileText"
          : field.type === "execution"
          ? "Play"
          : field.type === "outcome"
          ? "Layers"
          : "Sparkles")
    );
    setIsEditFieldModalOpen(true);
  };

  const handleSaveEditField = () => {
    if (!editingField || !editFieldName.trim()) return;
    const updated = pipelineFields.map((f) =>
      f.id === editingField.id
        ? {
            ...f,
            name: editFieldName.trim(),
            type: editFieldType,
            colorTheme: editFieldColor,
            icon: editFieldIcon,
          }
        : f
    );
    setPipelineFields(updated);
    pushHistory(workingColumns, updated);
    setIsEditFieldModalOpen(false);
  };

  const handleSaveConnector = (updatedField: PipelineField) => {
    const updated = pipelineFields.map((f) =>
      f.id === updatedField.id ? updatedField : f
    );
    setPipelineFields(updated);
    pushHistory(workingColumns, updated);
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
    setPipelineFields(updatedFields);
    pushHistory(updatedCols, updatedFields);
    setIsEditFieldModalOpen(false);
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

  // Filtered list for Stage Library search: only stages stored in library
  const filteredLibraryColumns = workingColumns.filter(
    (c) =>
      Boolean(c.inLibrary) &&
      c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalLibraryCount = workingColumns.filter((c) => Boolean(c.inLibrary)).length;

  return createPortal(
    <>
      {/* Modal Overlay below Navbar with dynamic expanded / centered sizing */}
      <div
        className={`fixed top-16 inset-x-0 bottom-0 z-50 flex items-center justify-center select-none overflow-hidden transition-all duration-200 ${
          isExpanded
            ? "p-0 bg-slate-900/10"
            : "p-3 sm:p-5 lg:p-6 bg-slate-900/40 backdrop-blur-md"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleRequestClose();
        }}
      >
        <div
          className={`bg-white text-slate-800 shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden relative font-sans transition-all duration-200 ${
            isExpanded
              ? "w-full h-full max-w-none max-h-none rounded-none border-x-0 border-b-0 border-t"
              : "w-full max-w-[1360px] h-[calc(100%-2.5rem)] max-h-[700px] min-h-[380px] rounded-2xl sm:rounded-3xl my-auto"
          }`}
        >
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                      isDirty
                        ? "bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-2xs"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDirty ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {isDirty ? "Unsaved changes" : "Saved"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Production Pipeline &gt; <span className="font-semibold text-slate-700">Flow Configurator</span>
                </p>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Live Preview Toggle */}
              <button
                type="button"
                onClick={() => setIsLivePreview(!isLivePreview)}
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

              {/* Expand / Minimize Full View Toggle Button */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                  isExpanded
                    ? "bg-purple-50 hover:bg-purple-100/70 border-purple-300 text-purple-800 shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
                }`}
                title={isExpanded ? "Exit full view" : "Expand to full screen view"}
                aria-label={isExpanded ? "Exit full view" : "Expand view"}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Exit Full View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Expand View</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer ml-0.5"
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
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (!isDragOverLibrary) setIsDragOverLibrary(true);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDragOverLibrary(false);
                    setDragOverLibraryField(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverLibrary(false);
                  setDragOverLibraryField(null);
                  if (draggedStageId) {
                    handleDropToLibrary(draggedStageId);
                  }
                }}
                className={`w-52 sm:w-56 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-left duration-150 min-h-0 transition-colors ${
                  isDragOverLibrary ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20" : ""
                }`}
              >
                {/* Library Header */}
                <div className="p-3 pb-2.5 border-b border-slate-200/80 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      STAGE LIBRARY
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {totalLibraryCount} unplaced
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
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Stage Library</h3>
                  <p className="text-[11px] text-slate-500">Drag nodes into canvas or back to library</p>

                  {/* Search stages (positioned ABOVE Add New Stage) */}
                  <div className="relative mt-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search stages..."
                      className="w-full bg-white border border-slate-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                    />
                  </div>

                  {/* Add New Stage Button (positioned BELOW search) */}
                  <button
                    type="button"
                    onClick={() => onOpenCreateColumn(undefined, true)}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/25 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Stage</span>
                  </button>
                </div>

                {/* Categorized Draggable Stage Items */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-0">
                  {/* Drop return highlight when dragging over library */}
                  {isDragOverLibrary && draggedStageId && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-purple-500 bg-purple-100/70 text-purple-900 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse text-center">
                      <ArrowLeft className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Drop to move stage back to library</span>
                    </div>
                  )}

                  {totalLibraryCount === 0 ? (
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-white text-center space-y-1.5 text-slate-500 shadow-2xs">
                      <Bookmark className="w-4 h-4 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">All stages are on canvas</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Drag cards from the canvas here to store them, or click &ldquo;Add New Stage&rdquo; above.
                      </p>
                    </div>
                  ) : filteredLibraryColumns.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      No stages match &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    pipelineFields.map((field) => {
                      const fieldCols = filteredLibraryColumns.filter(
                        (c) => getColumnFieldId(c, pipelineFields) === field.id
                      );
                      if (fieldCols.length === 0) return null;

                      const isFieldHovered = dragOverLibraryField === field.id;

                      return (
                        <div
                          key={field.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverLibraryField(field.id);
                            setIsDragOverLibrary(true);
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDragOverLibraryField((prev) => (prev === field.id ? null : prev));
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragOverLibrary(false);
                            setDragOverLibraryField(null);
                            if (draggedStageId) {
                              handleDropToLibrary(draggedStageId, field.id);
                            }
                          }}
                          className={`rounded-xl transition p-1 ${
                            isFieldHovered ? "bg-purple-100/70 ring-2 ring-purple-400/50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 group">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {(() => {
                                const IconComponent = getFieldIconComponent(field.icon, field.type);
                                const fStyles = getFieldStyles(field);
                                return (
                                  <IconComponent
                                    className="w-3 h-3 shrink-0"
                                    style={{ color: fStyles.hex }}
                                  />
                                );
                              })()}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                                {field.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditField(field)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-purple-600 rounded transition cursor-pointer"
                                title={`Configure ${field.name} field`}
                              >
                                <Settings className="w-2.5 h-2.5" />
                              </button>
                            </div>
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
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggedStageId(c.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedStageId(null);
                                    setIsDragOverLibrary(false);
                                    setDragOverLibraryField(null);
                                  }}
                                  onClick={() => setSelectedColId(c.id)}
                                  className={`p-2 rounded-xl bg-white border transition flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs group/card ${
                                    selectedColId === c.id
                                      ? "border-purple-500 text-purple-950 ring-2 ring-purple-500/20 shadow-xs bg-purple-50/40"
                                      : c.hidden
                                      ? "border-rose-200 bg-rose-50/30 text-slate-500 opacity-75 hover:opacity-100"
                                      : "border-slate-200/90 hover:border-slate-300 text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${cStyles.dotClass}`}
                                      style={cStyles.dotStyle}
                                    />
                                    <span className={`text-xs font-semibold truncate ${c.hidden ? "text-slate-500" : ""}`}>
                                      {c.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlaceOnCanvas(c.id);
                                      }}
                                      className="opacity-0 group-hover/card:opacity-100 p-1 text-purple-600 hover:bg-purple-100 rounded transition cursor-pointer"
                                      title="Place stage on canvas"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    {c.hidden && (
                                      <span className="p-0.5 text-rose-500" title="Hidden stage">
                                        <EyeOff className="w-3 h-3" />
                                      </span>
                                    )}
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                                      {field.type}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Custom Stage Button */}
                <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenCreateColumn(undefined, true)}
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
                    <span>Add Pipeline Field</span>
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
                    onClick={autoFitCanvas}
                    className="text-xs font-bold text-slate-700 px-1 hover:text-purple-600 transition cursor-pointer shrink-0 whitespace-nowrap"
                    title="Auto-fit board to canvas"
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
                ref={canvasRef}
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
                  ref={boardRef}
                  className="flex items-center justify-center gap-3 sm:gap-4 select-none relative"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel / 100})`,
                    transformOrigin: "center center",
                    transition: isPanning ? "none" : "transform 0.15s ease-out",
                  }}
                >
                  {/* Dynamic Multi-Stage Connection Wires */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
                    style={{ minWidth: "100%", minHeight: "100%" }}
                  >
                    {wires.map((w) => (
                      <path
                        key={w.id}
                        d={w.d}
                        fill="none"
                        stroke={w.color}
                        strokeWidth="2.5"
                        strokeDasharray={w.isDash ? "6 6" : "none"}
                        className={w.isDash ? "animate-pulse" : "transition-all duration-150"}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>

                  {pipelineFields.map((field, fIdx) => {
                    const fieldCols = workingColumns.filter(
                      (c) => getColumnFieldId(c, pipelineFields) === field.id && !c.inLibrary
                    );
                    const isFirst = fIdx === 0;
                    const isLast = fIdx === pipelineFields.length - 1;
                    const isExecution = field.id === "execution" || field.type === "execution";
                    const isInput = field.id === "inputs" || field.type === "input";
                    const isOutcome = field.id === "outcomes" || field.type === "outcome";
                    const styles = getFieldStyles(field);
                    const isDragOver = dragOverSection === field.id;
                    const nextField = !isLast ? pipelineFields[fIdx + 1] : null;

                    return (
                      <React.Fragment key={field.id}>
                        {/* Container for this Field */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSection(field.id);
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDragOverSection(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedStageId) {
                              handleDropToSection(field.id);
                            }
                            setDragOverSection(null);
                          }}
                          className={`w-52 sm:w-60 rounded-2xl p-3 flex flex-col gap-2 shadow-xs relative transition shrink-0 border-2 ${
                            isDragOver
                              ? "border-purple-500 ring-4 ring-purple-500/20"
                              : ""
                          }`}
                          style={{
                            backgroundColor: styles.containerBg,
                            borderColor: isDragOver ? undefined : styles.borderColor,
                          }}
                        >

                          {/* Container Header */}
                          <div
                            className="flex items-center justify-between pb-1 border-b"
                            style={{ borderColor: styles.borderColor }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {(() => {
                                const IconComp = getFieldIconComponent(field.icon, field.type);
                                return (
                                  <IconComp
                                    className="w-3.5 h-3.5 shrink-0"
                                    style={{ color: styles.hex }}
                                  />
                                );
                              })()}
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
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggedStageId(col.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedStageId(null);
                                    setDragOverColId(null);
                                    setDragOverSection(null);
                                    setDragOverDropzoneSection(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (draggedStageId && draggedStageId !== col.id) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const isTop = e.clientY < rect.top + rect.height / 2;
                                      const pos = isTop ? "above" : "below";
                                      setDragOverColId(col.id);
                                      setDropPosition(pos);
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                      setDragOverColId((prev) => (prev === col.id ? null : prev));
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (draggedStageId && draggedStageId !== col.id) {
                                      handleDropOnCard(draggedStageId, col.id, dropPosition);
                                    }
                                    setDragOverColId(null);
                                    setDraggedStageId(null);
                                  }}
                                  onClick={() => setSelectedColId(col.id)}
                                  className={`rounded-xl p-2.5 border transition-all duration-150 cursor-pointer flex items-center justify-between shadow-2xs relative select-none group ${
                                    draggedStageId === col.id
                                      ? "opacity-30 scale-[0.98] border-dashed border-purple-400 bg-purple-50/50 shadow-none ring-0"
                                      : dragOverColId === col.id
                                      ? "border-purple-500 ring-2 ring-purple-500/40 bg-purple-50/80 shadow-xs"
                                      : isSelected
                                      ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                                      : col.hidden
                                      ? "bg-rose-50/25 border-dashed border-rose-300 opacity-65 hover:opacity-95"
                                      : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                                  }`}
                                >
                                  {/* Left Input Port Dot on Card (if not first field) */}
                                  {!isFirst && !col.hidden && (
                                    <div
                                      data-port-input={col.id}
                                      className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs absolute -left-1.25 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                      style={{ backgroundColor: colStyles.dotHex || colStyles.accentHex }}
                                    />
                                  )}

                                  {/* Right Output Port Dot on Card (if not last field) */}
                                  {!isLast && !col.hidden && (
                                    <div
                                      data-port-output={col.id}
                                      className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs absolute -right-1.25 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                      style={{ backgroundColor: colStyles.dotHex || colStyles.accentHex }}
                                    />
                                  )}

                                  {/* High-Fidelity Glow Drop Line Indicator */}
                                  {dragOverColId === col.id && draggedStageId !== col.id && (
                                    <div
                                      className={`absolute inset-x-2 h-1 rounded-full bg-purple-600 shadow-md shadow-purple-500/50 z-30 pointer-events-none transition-all ${
                                        dropPosition === "above" ? "-top-1" : "-bottom-1"
                                      }`}
                                    >
                                      <div className="absolute -left-1 -top-0.5 w-2 h-2 rounded-full bg-purple-600 shadow-xs ring-2 ring-white" />
                                      <div className="absolute -right-1 -top-0.5 w-2 h-2 rounded-full bg-purple-600 shadow-xs ring-2 ring-white" />
                                    </div>
                                  )}

                                  <div className={`flex items-center gap-2 min-w-0 ${draggedStageId ? "pointer-events-none" : ""}`}>
                                    <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 shrink-0 cursor-grab" />
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${colStyles.dotClass}`}
                                      style={colStyles.dotStyle}
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`font-bold text-xs uppercase tracking-wider block truncate ${col.hidden ? "text-slate-500" : "text-slate-900"}`}>
                                          {col.label}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        {count} {count === 1 ? "task" : "tasks"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className={`flex items-center gap-1 text-slate-400 shrink-0 ${draggedStageId ? "pointer-events-none" : ""}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleHide(col.id);
                                      }}
                                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        col.hidden
                                          ? "text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200"
                                          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                      }`}
                                      title={col.hidden ? "Stage is hidden from board (Click to show)" : "Stage is visible on board (Click to hide)"}
                                    >
                                      {col.hidden ? (
                                        <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDropToLibrary(col.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                      title="Move back to Stage Library"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenEditColumn(col);
                                      }}
                                      className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverDropzoneSection(field.id);
                              }}
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  setDragOverDropzoneSection((prev) => (prev === field.id ? null : prev));
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggedStageId) {
                                  handleDropToSection(field.id);
                                }
                                setDragOverDropzoneSection(null);
                              }}
                              className={`w-full py-2.5 rounded-xl border border-dashed transition-all duration-150 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                dragOverDropzoneSection === field.id
                                  ? "border-purple-600 bg-purple-100 text-purple-700 ring-2 ring-purple-500/40 scale-[1.01]"
                                  : "border-slate-300 hover:border-purple-500 bg-white hover:bg-purple-50/50 text-slate-600 hover:text-purple-700"
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert stage here (Drop)</span>
                            </button>
                          </div>

                        </div>

                        {/* Connector Transition Pill between fields */}
                        {!isLast && nextField && (
                          <div className="w-24 sm:w-28 h-36 relative shrink-0 flex items-center justify-center z-10 pointer-events-auto">
                            {(() => {
                              const conn = getResolvedFieldConnector(field, fIdx, pipelineFields);
                              const connStyles = getConnectorStyles(conn.colorTheme);
                              const IconComp = getConnectorSymbolComponent(conn.icon);
                              const showIcon = conn.displayMode !== "text_only" && Boolean(IconComp);
                              const showText = conn.displayMode !== "icon_only" && Boolean(conn.label);

                              return (
                                <button
                                  data-connector-btn={fIdx}
                                  type="button"
                                  onClick={() => setEditingConnector({ field, fIdx })}
                                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-20 select-none whitespace-nowrap transition cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 group ${
                                    conn.hidden
                                      ? "opacity-50 hover:opacity-100 border-dashed bg-slate-100/90 text-slate-500"
                                      : "hover:shadow-sm"
                                  }`}
                                  style={{
                                    borderColor: conn.hidden ? undefined : connStyles.border,
                                    color: conn.hidden ? undefined : connStyles.text,
                                  }}
                                  title="Click to customize transition button"
                                >
                                  {conn.hidden ? (
                                    <>
                                      <EyeOff className="w-3 h-3 text-slate-400" />
                                      <span>Hidden</span>
                                    </>
                                  ) : (
                                    <>
                                      {showIcon && IconComp && (
                                        <IconComp
                                          className={conn.displayMode === "icon_only" ? "w-3.5 h-3.5" : "w-3 h-3"}
                                          style={{ color: connStyles.hex }}
                                        />
                                      )}
                                      {showText && conn.label && <span>{conn.label}</span>}
                                    </>
                                  )}
                                </button>
                              );
                            })()}
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
              <div className="w-52 sm:w-56 bg-slate-50/70 border-l border-slate-200/80 flex flex-col shrink-0 select-none z-10 animate-in slide-in-from-right duration-150 min-h-0">
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
                            className={`w-full h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer shadow-2xs select-none ${
                              selectedCol.hidden
                                ? "bg-rose-50 hover:bg-rose-100/70 border-rose-300 text-rose-700 ring-2 ring-rose-400/20"
                                : "bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800"
                            }`}
                            title={selectedCol.hidden ? "Click to show on board" : "Click to hide from board"}
                          >
                            <span className="flex items-center gap-2 font-bold whitespace-nowrap">
                              {selectedCol.hidden ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Hidden from Board</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Visible on Board</span>
                                </>
                              )}
                            </span>
                            <span
                              className={`w-7 h-4 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                                selectedCol.hidden ? "bg-slate-300" : "bg-emerald-500"
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full bg-white shadow-xs transform transition-transform duration-200 block ${
                                  selectedCol.hidden ? "translate-x-0" : "translate-x-3"
                                }`}
                              />
                            </span>
                          </button>
                        </div>

                        {/* Location: Canvas / Stage Library Toggle */}
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Canvas Location
                          </label>
                          {selectedCol.inLibrary ? (
                            <button
                              type="button"
                              onClick={() => handlePlaceOnCanvas(selectedCol.id)}
                              className="w-full h-9 px-3 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                              <span>Place on Canvas</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDropToLibrary(selectedCol.id)}
                              className="w-full h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                              title="Move this stage back to Stage Library"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                              <span>Move to Stage Library</span>
                            </button>
                          )}
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
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-[75] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHowToUseOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[calc(100vh-5.5rem)] sm:max-h-[640px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
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
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-[85] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddFieldModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-5 max-h-[calc(100vh-5.5rem)] sm:max-h-[580px] overflow-y-auto animate-in zoom-in-95 duration-150 my-auto">
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
                  Field Role &amp; Type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
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

              {/* Preset Icon Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Field Icon
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {PRESET_FIELD_ICONS.find((p) => p.id === newFieldIcon)?.label || "Select an icon"}
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  {PRESET_FIELD_ICONS.map((preset) => {
                    const IconComp = preset.Icon;
                    const isSelected = newFieldIcon === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setNewFieldIcon(preset.id)}
                        className={`h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs scale-105 ring-2 ring-purple-400"
                            : "bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200/80 shadow-2xs hover:scale-105"
                        }`}
                        title={preset.label}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-9 gap-1.5">
                  {["sky", "amber", "emerald", "purple", "indigo", "rose", "orange", "teal", "slate"].map((cId) => {
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
                        title={t.name}
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
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-[85] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditFieldModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-5 max-h-[calc(100vh-5.5rem)] sm:max-h-[600px] overflow-y-auto animate-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Configure Field: {editingField.name}</h3>
                  <p className="text-[11px] text-slate-500">Edit name, role, preset icon, or appearance</p>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Field Role &amp; Type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "input", label: "Input" },
                    { id: "execution", label: "Execution" },
                    { id: "outcome", label: "Outcome" },
                    { id: "custom", label: "Custom" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditFieldType(t.id as any)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        editFieldType === t.id
                          ? "bg-purple-50 border-purple-400 text-purple-900 shadow-2xs ring-2 ring-purple-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Icon Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Field Icon
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {PRESET_FIELD_ICONS.find((p) => p.id === editFieldIcon)?.label || "Select an icon"}
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                  {PRESET_FIELD_ICONS.map((preset) => {
                    const IconComp = preset.Icon;
                    const isSelected = editFieldIcon === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditFieldIcon(preset.id)}
                        className={`h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs scale-105 ring-2 ring-purple-400"
                            : "bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200/80 shadow-2xs hover:scale-105"
                        }`}
                        title={preset.label}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-9 gap-1.5">
                  {["sky", "amber", "emerald", "purple", "indigo", "rose", "orange", "teal", "slate"].map((cId) => {
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
                        title={t.name}
                      >
                        {editFieldColor === cId && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editingField && pipelineFields.findIndex((f) => f.id === editingField.id) < pipelineFields.length - 1 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fIdx = pipelineFields.findIndex((f) => f.id === editingField.id);
                      setIsEditFieldModalOpen(false);
                      setEditingConnector({ field: editingField, fIdx });
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Customize Outgoing Transition Button</span>
                  </button>
                </div>
              )}

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
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUnsavedPrompt(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm sm:max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-150 relative my-auto">
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

      {/* CONNECTOR EDIT MODAL */}
      {editingConnector && (
        <ConnectorEditModal
          isOpen={Boolean(editingConnector)}
          onClose={() => setEditingConnector(null)}
          field={editingConnector.field}
          fIdx={editingConnector.fIdx}
          allFields={pipelineFields}
          flowColumns={workingColumns}
          onSave={handleSaveConnector}
        />
      )}
    </>,
    document.body
  );
}
