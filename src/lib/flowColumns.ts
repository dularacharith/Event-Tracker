import {
  FileText,
  Inbox,
  Play,
  Zap,
  Layers,
  CheckCircle2,
  Sparkles,
  Target,
  Flag,
  Folder,
  ShieldCheck,
  Send,
  Clock,
  Flame,
  Heart,
  Star,
  Cpu,
  Compass,
  Bookmark,
  Package,
  ArrowRight,
  ChevronRight,
  MoveRight,
  Check,
  Eye,
  Lock,
  RefreshCw,
  FileCheck,
} from "lucide-react";

export interface ColorTheme {
  id: string;
  name: string;
  hex: string;
  dot: string;
  bg: string;
  border: string;
  badgeBg: string;
  headerText: string;
  lightBg: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "amber",
    name: "Amber / Yellow",
    hex: "#f59e0b",
    dot: "bg-amber-500",
    bg: "bg-amber-50/50",
    border: "border-amber-300",
    badgeBg: "bg-amber-100 text-amber-800",
    headerText: "text-amber-950",
    lightBg: "#fffbeb",
  },
  {
    id: "purple",
    name: "Purple / Violet",
    hex: "#a855f7",
    dot: "bg-purple-500",
    bg: "bg-purple-50/50",
    border: "border-purple-300",
    badgeBg: "bg-purple-100 text-purple-800",
    headerText: "text-purple-950",
    lightBg: "#faf5ff",
  },
  {
    id: "indigo",
    name: "Indigo / Blue",
    hex: "#6366f1",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50/50",
    border: "border-indigo-300",
    badgeBg: "bg-indigo-100 text-indigo-800",
    headerText: "text-indigo-950",
    lightBg: "#eef2ff",
  },
  {
    id: "emerald",
    name: "Emerald / Green",
    hex: "#10b981",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/50",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-100 text-emerald-800",
    headerText: "text-emerald-950",
    lightBg: "#ecfdf5",
  },
  {
    id: "rose",
    name: "Rose / Coral",
    hex: "#f43f5e",
    dot: "bg-rose-500",
    bg: "bg-rose-50/50",
    border: "border-rose-300",
    badgeBg: "bg-rose-100 text-rose-800",
    headerText: "text-rose-950",
    lightBg: "#fff1f2",
  },
  {
    id: "sky",
    name: "Sky / Cyan",
    hex: "#0ea5e9",
    dot: "bg-sky-500",
    bg: "bg-sky-50/50",
    border: "border-sky-300",
    badgeBg: "bg-sky-100 text-sky-800",
    headerText: "text-sky-950",
    lightBg: "#f0f9ff",
  },
  {
    id: "orange",
    name: "Orange",
    hex: "#f97316",
    dot: "bg-orange-500",
    bg: "bg-orange-50/50",
    border: "border-orange-300",
    badgeBg: "bg-orange-100 text-orange-800",
    headerText: "text-orange-950",
    lightBg: "#fff7ed",
  },
  {
    id: "teal",
    name: "Teal",
    hex: "#14b8a6",
    dot: "bg-teal-500",
    bg: "bg-teal-50/50",
    border: "border-teal-300",
    badgeBg: "bg-teal-100 text-teal-800",
    headerText: "text-teal-950",
    lightBg: "#f0fdfa",
  },
  {
    id: "slate",
    name: "Slate / Gray",
    hex: "#64748b",
    dot: "bg-slate-500",
    bg: "bg-slate-50/80",
    border: "border-slate-300",
    badgeBg: "bg-slate-200 text-slate-800",
    headerText: "text-slate-800",
    lightBg: "#f8fafc",
  },
];

export interface FieldConnectorConfig {
  label?: string;
  colorTheme?: string;
  icon?: string;
  hidden?: boolean;
  displayMode?: "both" | "icon_only" | "text_only";
  targetStageId?: string;
}

export interface PipelineField {
  id: string;
  name: string;
  type: "input" | "execution" | "outcome" | "custom";
  colorTheme?: string;
  icon?: string;
  description?: string;
  isCustom?: boolean;
  connector?: FieldConnectorConfig;
}

export const PRESET_FIELD_ICONS = [
  { id: "FileText", label: "Document", Icon: FileText },
  { id: "Inbox", label: "Inbox", Icon: Inbox },
  { id: "Play", label: "Play", Icon: Play },
  { id: "Zap", label: "Zap", Icon: Zap },
  { id: "Layers", label: "Layers", Icon: Layers },
  { id: "CheckCircle2", label: "Check", Icon: CheckCircle2 },
  { id: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { id: "Target", label: "Target", Icon: Target },
  { id: "Flag", label: "Flag", Icon: Flag },
  { id: "Folder", label: "Folder", Icon: Folder },
  { id: "ShieldCheck", label: "Shield", Icon: ShieldCheck },
  { id: "Send", label: "Send", Icon: Send },
  { id: "Clock", label: "Clock", Icon: Clock },
  { id: "Flame", label: "Flame", Icon: Flame },
  { id: "Heart", label: "Heart", Icon: Heart },
  { id: "Star", label: "Star", Icon: Star },
  { id: "Cpu", label: "Engine", Icon: Cpu },
  { id: "Compass", label: "Compass", Icon: Compass },
  { id: "Bookmark", label: "Bookmark", Icon: Bookmark },
  { id: "Package", label: "Package", Icon: Package },
] as const;

export function getFieldIconComponent(iconId?: string, fieldType?: string) {
  if (iconId) {
    const found = PRESET_FIELD_ICONS.find((item) => item.id === iconId);
    if (found) return found.Icon;
  }
  if (fieldType === "input") return FileText;
  if (fieldType === "execution") return Play;
  if (fieldType === "outcome") return Layers;
  return Sparkles;
}

export const PRESET_CONNECTOR_SYMBOLS = [
  { id: "none", label: "None", Icon: null },
  { id: "ArrowRight", label: "Arrow", Icon: ArrowRight },
  { id: "ChevronRight", label: "Chevron", Icon: ChevronRight },
  { id: "MoveRight", label: "Forward", Icon: MoveRight },
  { id: "Play", label: "Play / Start", Icon: Play },
  { id: "Check", label: "Check", Icon: Check },
  { id: "CheckCircle2", label: "Success", Icon: CheckCircle2 },
  { id: "ShieldCheck", label: "Verify Gate", Icon: ShieldCheck },
  { id: "Zap", label: "Trigger", Icon: Zap },
  { id: "Sparkles", label: "Sparkle", Icon: Sparkles },
  { id: "Flame", label: "Priority", Icon: Flame },
  { id: "Send", label: "Dispatch", Icon: Send },
  { id: "Eye", label: "Review", Icon: Eye },
  { id: "Target", label: "Target", Icon: Target },
  { id: "Lock", label: "Approval Gate", Icon: Lock },
  { id: "Clock", label: "Timer", Icon: Clock },
  { id: "Star", label: "Star", Icon: Star },
  { id: "Compass", label: "Route", Icon: Compass },
  { id: "Layers", label: "Batch", Icon: Layers },
  { id: "Flag", label: "Milestone", Icon: Flag },
  { id: "RefreshCw", label: "Sync", Icon: RefreshCw },
  { id: "FileCheck", label: "Sign-off", Icon: FileCheck },
] as const;

export function getConnectorSymbolComponent(symbolId?: string) {
  if (!symbolId || symbolId === "none") return null;
  const found = PRESET_CONNECTOR_SYMBOLS.find((item) => item.id === symbolId);
  return found?.Icon || null;
}

export function getResolvedFieldConnector(
  field: PipelineField,
  fIdx: number,
  allFields: PipelineField[]
): Required<FieldConnectorConfig> {
  const isFirst = fIdx === 0;
  const isLast = fIdx === allFields.length - 1;
  const nextField = !isLast ? allFields[fIdx + 1] : null;
  const isExecution = field.id === "execution" || field.type === "execution";

  const defaultLabel = isFirst
    ? "Start"
    : nextField && (nextField.id === "outcomes" || nextField.type === "outcome")
    ? "Verify"
    : isExecution
    ? "Verify"
    : "Proceed";

  const defaultTheme = "purple";
  const defaultIcon = "ArrowRight";

  const c = field.connector || {};

  const label = c.label !== undefined ? c.label : defaultLabel;
  const icon = c.icon !== undefined ? c.icon : defaultIcon;
  const colorTheme = c.colorTheme || defaultTheme;
  const hidden = Boolean(c.hidden);

  let displayMode: "both" | "icon_only" | "text_only" = c.displayMode || "both";
  if (!c.displayMode) {
    if (!label.trim() && icon && icon !== "none") {
      displayMode = "icon_only";
    } else if (icon === "none") {
      displayMode = "text_only";
    } else {
      displayMode = "both";
    }
  }

  return {
    label,
    colorTheme,
    icon,
    hidden,
    displayMode,
    targetStageId: c.targetStageId || "",
  };
}

export function getConnectorStyles(colorThemeId?: string) {
  const theme =
    COLOR_THEMES.find((t) => t.id === colorThemeId) ||
    COLOR_THEMES.find((t) => t.id === "purple") ||
    COLOR_THEMES[0];

  const hex = theme.hex;

  return {
    theme,
    hex,
    border: hexToRgba(hex, 0.45),
    bg: "#ffffff",
    hoverBg: hexToRgba(hex, 0.08),
    text: hexToDark(hex),
    badgeBg: hexToRgba(hex, 0.12),
  };
}

export const DEFAULT_PIPELINE_FIELDS: PipelineField[] = [
  {
    id: "inputs",
    name: "Inputs & Initiation",
    type: "input",
    colorTheme: "sky",
    icon: "FileText",
    connector: {
      label: "Start",
      colorTheme: "purple",
      icon: "ArrowRight",
      hidden: false,
      displayMode: "both",
    },
    description: "Intake, drafting, and queue staging.",
  },
  {
    id: "execution",
    name: "Active Execution Hub",
    type: "execution",
    colorTheme: "amber",
    icon: "Play",
    connector: {
      label: "Verify",
      colorTheme: "purple",
      icon: "ArrowRight",
      hidden: false,
      displayMode: "both",
    },
    description: "Live content creation, authoring, and core production engine.",
  },
  {
    id: "outcomes",
    name: "Outcomes & Destinations",
    type: "outcome",
    colorTheme: "emerald",
    icon: "Layers",
    description: "Review gates, completion, published work, and archive states.",
  },
];

export interface FlowColumn {
  id: string;
  step: string;
  label: string;
  colorTheme: string;
  customHex?: string;
  customDotHex?: string;
  hidden?: boolean;
  inLibrary?: boolean;
  isCustom?: boolean;
  statusMapping?: string;
  field?: string;
}

export const DEFAULT_FLOW_COLUMNS: FlowColumn[] = [
  {
    id: "draft",
    step: "1",
    label: "Draft",
    colorTheme: "slate",
    field: "inputs",
  },
  {
    id: "scheduled",
    step: "2",
    label: "Scheduled",
    colorTheme: "sky",
    field: "inputs",
  },
  {
    id: "in_progress",
    step: "3",
    label: "In Progress",
    colorTheme: "amber",
    // Purple bubble dot as shown on reference image
    customDotHex: "#a855f7",
    field: "execution",
  },
  {
    id: "awaiting_review",
    step: "4",
    label: "Awaiting Review",
    colorTheme: "purple",
    field: "outcomes",
  },
  {
    id: "passed",
    step: "5",
    label: "Completed",
    colorTheme: "emerald",
    field: "outcomes",
  },
  {
    id: "failed",
    step: "6",
    label: "Failed",
    colorTheme: "rose",
    field: "outcomes",
  },
  {
    id: "canceled",
    step: "↶",
    label: "Canceled",
    colorTheme: "slate",
    field: "outcomes",
  },
];

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToDark(hex: string): string {
  const cleanHex = hex.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  // Darken by 50%
  r = Math.floor(r * 0.4);
  g = Math.floor(g * 0.4);
  b = Math.floor(b * 0.4);
  return `rgb(${r}, ${g}, ${b})`;
}

export function getColumnStyles(col: FlowColumn) {
  // If customHex is present
  if (col.customHex) {
    const hex = col.customHex;
    const dotHex = col.customDotHex || hex;
    return {
      containerStyle: {
        backgroundColor: hexToRgba(hex, 0.06),
        borderColor: hexToRgba(hex, 0.4),
      },
      dotStyle: {
        backgroundColor: dotHex,
      },
      headerStyle: {
        color: hexToDark(hex),
      },
      badgeStyle: {
        backgroundColor: hexToRgba(hex, 0.15),
        color: hexToDark(hex),
      },
      dotHex,
      accentHex: hex,
      bgClass: "",
      borderClass: "",
      dotClass: "",
      badgeBgClass: "",
      headerTextClass: "",
    };
  }

  // Predefined theme
  const theme =
    COLOR_THEMES.find((t) => t.id === col.colorTheme) ||
    COLOR_THEMES[0];

  const dotHex = col.customDotHex || theme.hex;
  const hex = theme.hex;

  return {
    containerStyle: {
      backgroundColor: hexToRgba(hex, 0.06),
      borderColor: hexToRgba(hex, 0.38),
    },
    dotStyle: {
      backgroundColor: dotHex,
    },
    headerStyle: {
      color: hexToDark(hex),
    },
    badgeStyle: {
      backgroundColor: hexToRgba(hex, 0.15),
      color: hexToDark(hex),
    },
    dotHex,
    accentHex: hex,
    bgClass: theme.bg,
    borderClass: theme.border,
    dotClass: col.customDotHex ? "" : theme.dot,
    badgeBgClass: theme.badgeBg,
    headerTextClass: theme.headerText,
  };
}

export function loadFlowColumns(workspaceId?: string): FlowColumn[] {
  if (typeof window === "undefined") {
    return DEFAULT_FLOW_COLUMNS;
  }
  try {
    const key = `campaignflow_flow_cols_${workspaceId || "default"}`;
    const stored = localStorage.getItem(key);
    if (!stored) return DEFAULT_FLOW_COLUMNS;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load flow columns from localStorage", e);
  }
  return DEFAULT_FLOW_COLUMNS;
}

export function saveFlowColumns(workspaceId: string | undefined, columns: FlowColumn[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = `campaignflow_flow_cols_${workspaceId || "default"}`;
    localStorage.setItem(key, JSON.stringify(columns));
  } catch (e) {
    console.error("Failed to save flow columns to localStorage", e);
  }
}

export function resetFlowColumns(workspaceId?: string): FlowColumn[] {
  if (typeof window !== "undefined") {
    try {
      const key = `campaignflow_flow_cols_${workspaceId || "default"}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to reset flow columns", e);
    }
  }
  return DEFAULT_FLOW_COLUMNS;
}

export function getColumnFieldId(col: FlowColumn, fields: PipelineField[] = DEFAULT_PIPELINE_FIELDS): string {
  if (col.field && fields.some((f) => f.id === col.field)) {
    return col.field;
  }
  // Backwards compatibility fallbacks
  if (col.id === "draft" || col.id === "scheduled" || col.step === "1" || col.step === "2") {
    return "inputs";
  }
  if (col.id === "in_progress" || col.step === "3") {
    return "execution";
  }
  return "outcomes";
}

export function sortColumnsByPipeline(
  columns: FlowColumn[],
  fields: PipelineField[] = DEFAULT_PIPELINE_FIELDS
): FlowColumn[] {
  const fieldOrder = new Map<string, number>();
  fields.forEach((f, idx) => fieldOrder.set(f.id, idx));

  return columns
    .map((col, index) => ({ col, index }))
    .sort((a, b) => {
      const fA = getColumnFieldId(a.col, fields);
      const fB = getColumnFieldId(b.col, fields);
      const orderA = fieldOrder.has(fA) ? fieldOrder.get(fA)! : 999;
      const orderB = fieldOrder.has(fB) ? fieldOrder.get(fB)! : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.index - b.index;
    })
    .map(({ col }) => col);
}

export function loadPipelineFields(workspaceId?: string): PipelineField[] {
  if (typeof window === "undefined") {
    return DEFAULT_PIPELINE_FIELDS;
  }
  try {
    const key = `campaignflow_pipeline_fields_${workspaceId || "default"}`;
    const stored = localStorage.getItem(key);
    if (!stored) return DEFAULT_PIPELINE_FIELDS;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load pipeline fields from localStorage", e);
  }
  return DEFAULT_PIPELINE_FIELDS;
}

export function savePipelineFields(workspaceId: string | undefined, fields: PipelineField[]): void {
  if (typeof window === "undefined") return;
  try {
    const key = `campaignflow_pipeline_fields_${workspaceId || "default"}`;
    localStorage.setItem(key, JSON.stringify(fields));
  } catch (e) {
    console.error("Failed to save pipeline fields to localStorage", e);
  }
}

export function resetPipelineFields(workspaceId?: string): PipelineField[] {
  if (typeof window !== "undefined") {
    try {
      const key = `campaignflow_pipeline_fields_${workspaceId || "default"}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to reset pipeline fields", e);
    }
  }
  return DEFAULT_PIPELINE_FIELDS;
}

export function getFieldStyles(field: PipelineField) {
  const theme =
    COLOR_THEMES.find((t) => t.id === field.colorTheme) ||
    (field.type === "input"
      ? COLOR_THEMES.find((t) => t.id === "sky")
      : field.type === "execution"
      ? COLOR_THEMES.find((t) => t.id === "amber")
      : COLOR_THEMES.find((t) => t.id === "emerald")) ||
    COLOR_THEMES[0];

  const hex = theme.hex;

  return {
    theme,
    hex,
    containerBg: hexToRgba(hex, 0.05),
    borderColor: hexToRgba(hex, 0.35),
    headerText: hexToDark(hex),
    badgeBg: hexToRgba(hex, 0.12),
    portBg: hex,
    wireStroke: hex,
  };
}

export function getCampaignTagStyle(status?: string | null, customColor?: string | null) {
  if (customColor) {
    return {
      badgeClass: "bg-white text-slate-800 border-slate-300",
      dotClass: "",
      dotStyle: { backgroundColor: customColor },
      style: { borderColor: customColor },
    };
  }

  const s = (status || "").toLowerCase().replace(/_/g, " ").trim();
  switch (s) {
    case "hold":
    case "on hold":
    case "paused":
      return {
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotClass: "bg-amber-500",
        style: undefined,
        dotStyle: undefined,
      };
    case "completed":
      return {
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        dotClass: "bg-blue-500",
        style: undefined,
        dotStyle: undefined,
      };
    case "canceled":
    case "cancelled":
      return {
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
        style: undefined,
        dotStyle: undefined,
      };
    case "failed":
      return {
        badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
        dotClass: "bg-rose-500",
        style: undefined,
        dotStyle: undefined,
      };
    case "archived":
      return {
        badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
        dotClass: "bg-purple-500",
        style: undefined,
        dotStyle: undefined,
      };
    case "active":
    default:
      return {
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dotClass: "bg-emerald-500",
        style: undefined,
        dotStyle: undefined,
      };
  }
}

