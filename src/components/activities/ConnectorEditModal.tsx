"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, EyeOff, RotateCcw, Sparkles } from "lucide-react";
import {
  PipelineField,
  COLOR_THEMES,
  PRESET_CONNECTOR_SYMBOLS,
  getConnectorSymbolComponent,
  getResolvedFieldConnector,
  getConnectorStyles,
} from "@/lib/flowColumns";

interface ConnectorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: PipelineField | null;
  fIdx: number;
  allFields: PipelineField[];
  onSave: (updatedField: PipelineField) => void;
}

export function ConnectorEditModal({
  isOpen,
  onClose,
  field,
  fIdx,
  allFields,
  onSave,
}: ConnectorEditModalProps) {
  const [mounted, setMounted] = useState(false);

  const [label, setLabel] = useState("Start");
  const [colorTheme, setColorTheme] = useState("purple");
  const [icon, setIcon] = useState("ArrowRight");
  const [hidden, setHidden] = useState(false);
  const [displayMode, setDisplayMode] = useState<"both" | "icon_only" | "text_only">("both");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && field) {
      const resolved = getResolvedFieldConnector(field, fIdx, allFields);
      setLabel(resolved.label);
      setColorTheme(resolved.colorTheme);
      setIcon(resolved.icon);
      setHidden(resolved.hidden);
      setDisplayMode(resolved.displayMode);
    }
  }, [isOpen, field, fIdx, allFields]);

  if (!isOpen || !mounted || !field) return null;

  const nextField = fIdx < allFields.length - 1 ? allFields[fIdx + 1] : null;

  const currentStyles = getConnectorStyles(colorTheme);
  const PreviewIcon = getConnectorSymbolComponent(icon);

  const handleResetDefaults = () => {
    const isFirst = fIdx === 0;
    const isExecution = field.id === "execution" || field.type === "execution";
    const defaultLabel = isFirst
      ? "Start"
      : nextField && (nextField.id === "outcomes" || nextField.type === "outcome")
      ? "Verify"
      : isExecution
      ? "Verify"
      : "Proceed";

    setLabel(defaultLabel);
    setColorTheme("purple");
    setIcon("ArrowRight");
    setHidden(false);
    setDisplayMode("both");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedField: PipelineField = {
      ...field,
      connector: {
        label: label.trim(),
        colorTheme,
        icon,
        hidden,
        displayMode,
      },
    };
    onSave(updatedField);
    onClose();
  };

  return createPortal(
    <div
      className="fixed top-16 inset-x-0 bottom-0 z-[85] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md select-none animate-in fade-in duration-150 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)] sm:max-h-[640px] my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Customize Connector Button
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                {field.name} &rarr; {nextField?.name || "Next Stage"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* Live Interactive Button Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Live Button Preview
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {hidden ? "Hidden from board" : displayMode === "icon_only" ? "Symbol without letters" : displayMode === "text_only" ? "Text only" : "Symbol + Text"}
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-center">
                {hidden ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-dashed border-slate-300 text-xs font-semibold text-slate-400 select-none">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Button Hidden</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border-2 shadow-xs text-xs font-bold transition-all select-none"
                    style={{
                      borderColor: currentStyles.border,
                      color: currentStyles.text,
                    }}
                  >
                    {displayMode !== "text_only" && PreviewIcon && (
                      <PreviewIcon
                        className={displayMode === "icon_only" ? "w-4 h-4" : "w-3.5 h-3.5"}
                        style={{ color: currentStyles.hex }}
                      />
                    )}
                    {displayMode !== "icon_only" && (label.trim() || "Button")}
                  </div>
                )}
              </div>
            </div>

            {/* Button Name / Label */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Button Name / Text
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Leave blank for symbol only
                </span>
              </div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Start, Verify, Review, Proceed"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
              />
            </div>

            {/* Display Mode: Symbol + Text, Symbol Only, Text Only */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Display Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "both", label: "Symbol + Text" },
                  { id: "icon_only", label: "Symbol Only" },
                  { id: "text_only", label: "Text Only" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDisplayMode(mode.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                      displayMode === mode.id
                        ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Symbols Picker */}
            {displayMode !== "text_only" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Preset Symbol
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {PRESET_CONNECTOR_SYMBOLS.find((s) => s.id === icon)?.label || "Select symbol"}
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {PRESET_CONNECTOR_SYMBOLS.map((sym) => {
                    const SymIcon = sym.Icon;
                    const isSelected = icon === sym.id;
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => setIcon(sym.id)}
                        className={`h-8 rounded-xl flex items-center justify-center transition cursor-pointer text-xs font-bold ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-xs scale-105 ring-2 ring-purple-400"
                            : "bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200/80 shadow-2xs hover:scale-105"
                        }`}
                        title={sym.label}
                      >
                        {SymIcon ? (
                          <SymIcon className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[9px]">None</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Theme Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Color Theme
              </label>
              <div className="grid grid-cols-9 gap-1.5">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = colorTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setColorTheme(theme.id)}
                      className={`h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-purple-600 scale-105 border-slate-900 shadow-xs"
                          : "border-black/10 hover:scale-105"
                      }`}
                      style={{ backgroundColor: theme.hex }}
                      title={theme.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility Toggle ("Hide if want") */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-800">
                  Hide Button
                </span>
                <span className="text-[11px] text-slate-400">
                  Hide this transition button from the board
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHidden(!hidden)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  hidden ? "bg-purple-600" : "bg-slate-200"
                }`}
                title={hidden ? "Click to unhide" : "Click to hide"}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    hidden ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Button
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
