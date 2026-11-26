"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { X, Pencil, FolderGit2, Hash, Plus, Sparkles, HelpCircle } from "lucide-react";

export interface PromptOptions {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: "pencil" | "folder" | "hash" | "plus" | "sparkles" | React.ReactNode;
  confirmVariant?: "purple" | "indigo" | "rose";
  required?: boolean;
}

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: string) => void;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: "pencil" | "folder" | "hash" | "plus" | "sparkles" | React.ReactNode;
  confirmVariant?: "purple" | "indigo" | "rose";
  required?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  defaultValue = "",
  placeholder = "Enter a value...",
  confirmLabel = "Save Changes",
  cancelLabel = "Cancel",
  icon = "pencil",
  confirmVariant = "purple",
  required = true,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultValue]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) return;
    onConfirm(value.trim());
  };

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    if (icon === "pencil") return <Pencil className="w-5 h-5 text-purple-600" />;
    if (icon === "folder") return <FolderGit2 className="w-5 h-5 text-indigo-600" />;
    if (icon === "hash") return <Hash className="w-5 h-5 text-emerald-600" />;
    if (icon === "plus") return <Plus className="w-5 h-5 text-purple-600" />;
    if (icon === "sparkles") return <Sparkles className="w-5 h-5 text-amber-500" />;
    return <HelpCircle className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl shadow-purple-950/15 border border-slate-100 max-w-sm sm:max-w-md w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150 select-none overflow-hidden">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header: Icon + Title + Description */}
        <div className="flex items-start gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100/80 flex items-center justify-center shrink-0 shadow-2xs">
            {renderIcon()}
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-3 focus:ring-purple-500/15 focus:border-purple-500 transition shadow-2xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={required && !value.trim()}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmVariant === "rose"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                  : confirmVariant === "indigo"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25"
              }`}
            >
              <span>{confirmLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Global Context & Hook for async prompt modals
interface PromptContextValue {
  prompt: (options: PromptOptions | string) => Promise<string | null>;
}

const PromptContext = createContext<PromptContextValue | null>(null);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    options: PromptOptions;
    resolve: (val: string | null) => void;
  } | null>(null);

  const prompt = useCallback((options: PromptOptions | string): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      const parsedOptions: PromptOptions =
        typeof options === "string"
          ? {
              title: options,
              confirmLabel: "OK",
              cancelLabel: "Cancel",
            }
          : options;

      setModalState({
        options: parsedOptions,
        resolve,
      });
    });
  }, []);

  const handleConfirm = (val: string) => {
    if (modalState) {
      modalState.resolve(val);
      setModalState(null);
    }
  };

  const handleClose = () => {
    if (modalState) {
      modalState.resolve(null);
      setModalState(null);
    }
  };

  return (
    <PromptContext.Provider value={{ prompt }}>
      {children}
      {modalState && (
        <PromptModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={modalState.options.title}
          description={modalState.options.description}
          defaultValue={modalState.options.defaultValue}
          placeholder={modalState.options.placeholder}
          confirmLabel={modalState.options.confirmLabel || "Save Changes"}
          cancelLabel={modalState.options.cancelLabel || "Cancel"}
          icon={modalState.options.icon || "pencil"}
          confirmVariant={modalState.options.confirmVariant || "purple"}
          required={modalState.options.required ?? true}
        />
      )}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return ctx.prompt;
}
