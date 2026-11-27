"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, Loader2, Trash2, AlertCircle, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "purple" | "rose";
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "purple" | "rose";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "purple",
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const isDelete =
    confirmVariant === "rose" ||
    confirmLabel.toLowerCase().includes("delete") ||
    confirmLabel.toLowerCase().includes("remove") ||
    title.toLowerCase().includes("delete") ||
    title.toLowerCase().includes("remove");

  return (
    <div
      className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100/90 px-6 py-5 sm:px-8 sm:py-5.5 text-center animate-in zoom-in-95 duration-150 select-none">
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon: Clean, unbordered, standalone and prominently sized */}
        {isDelete ? (
          <div className="mx-auto mb-2.5 flex items-center justify-center text-red-500">
            <Trash2 className="w-9 h-9 stroke-[2.2]" />
          </div>
        ) : (
          <div className="mx-auto mb-2.5 flex items-center justify-center text-emerald-500">
            <svg
              className="w-9 h-9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-lg sm:text-xl text-slate-800 tracking-tight leading-snug">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-500 font-normal mt-1.5 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {/* Action Buttons Right-Aligned */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 mt-4 sm:mt-5">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900 font-semibold text-sm px-4 py-2 transition cursor-pointer"
          >
            {cancelLabel}
          </button>

          {/* Confirm / Action Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-w-[120px] h-10 px-6 sm:px-7 py-2 rounded-xl text-sm font-semibold text-white shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-center active:scale-[0.98] disabled:opacity-75 ${
              isDelete
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-500/20"
                : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-500/20"
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0 text-white" />
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Global Context & Hook for async confirmation
interface ConfirmContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<{
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant: "purple" | "rose";
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      if (typeof options === "string") {
        setModalState({
          title: options,
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          confirmVariant: "purple",
          resolve,
        });
      } else {
        setModalState({
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel || "Delete",
          cancelLabel: options.cancelLabel || "Cancel",
          confirmVariant: options.confirmVariant || "purple",
          resolve,
        });
      }
    });
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleClose = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={!!modalState}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState?.title || ""}
        description={modalState?.description}
        confirmLabel={modalState?.confirmLabel || "Delete"}
        cancelLabel={modalState?.cancelLabel || "Cancel"}
        confirmVariant={modalState?.confirmVariant || "purple"}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx.confirm;
}
