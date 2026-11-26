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

export interface FlowColumn {
  id: string;
  step: string;
  label: string;
  colorTheme: string;
  customHex?: string;
  customDotHex?: string;
  hidden?: boolean;
  isCustom?: boolean;
  statusMapping?: string;
}

export const DEFAULT_FLOW_COLUMNS: FlowColumn[] = [
  {
    id: "draft",
    step: "1",
    label: "Draft",
    colorTheme: "slate",
  },
  {
    id: "scheduled",
    step: "2",
    label: "Scheduled",
    colorTheme: "sky",
  },
  {
    id: "in_progress",
    step: "3",
    label: "In Progress",
    colorTheme: "amber",
    // Purple bubble dot as shown on reference image
    customDotHex: "#a855f7",
  },
  {
    id: "awaiting_review",
    step: "4",
    label: "Awaiting Review",
    colorTheme: "purple",
  },
  {
    id: "passed",
    step: "5",
    label: "Completed",
    colorTheme: "emerald",
  },
  {
    id: "failed",
    step: "6",
    label: "Failed",
    colorTheme: "rose",
  },
  {
    id: "canceled",
    step: "↶",
    label: "Canceled",
    colorTheme: "slate",
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

