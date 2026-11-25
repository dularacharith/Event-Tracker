"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

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

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm sm:max-w-md w-full p-6 sm:p-8 text-center relative animate-in zoom-in-95 duration-150 select-none">
        {/* Close Button Top Right */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Question */}
        <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight mt-2 px-4 leading-snug">
          {title}
        </h3>

        {/* Optional Description */}
        {description && (
          <p className="text-xs text-slate-500 mt-2 px-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Action Buttons Centered Side-by-Side (Matching Reference Design) */}
        <div className="flex items-center justify-center gap-3.5 mt-6 pt-2">
          {/* Confirm Button (Purple by Default matching Reference) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-w-[100px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              confirmVariant === "rose"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 active:bg-rose-800"
                : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 active:bg-purple-800"
            } disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span>{confirmLabel}</span>
          </button>

          {/* Cancel Button (Delicate Gray Outline matching reference) */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-w-[100px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {cancelLabel}
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
