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
      <div className="relative w-full max-w-sm sm:max-w-md filter drop-shadow-2xl animate-in zoom-in-95 duration-150 select-none">
        {/* Floating Top Icon */}
        {isDelete ? (
          /* Custom Red Outline Trash Can matching reference design */
          <svg
            className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-[52px] h-[52px] text-[#ff3b3b] z-10 pointer-events-none drop-shadow-xs"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Handle */}
            <path d="M19 12 C 19 10, 20 8, 22 8 L 26 8 C 28 8, 29 10, 29 12" />
            {/* Lid with slight overhang */}
            <path d="M13 14 L 35 14" />
            {/* Can Body */}
            <path d="M15 14 L 16 36 C 16 38, 17 39, 19 39 L 29 39 C 31 39, 32 38, 32 36 L 33 14" />
            {/* 3 Vertical Slats */}
            <line x1="20" y1="20" x2="20" y2="33" />
            <line x1="24" y1="20" x2="24" y2="33" />
            <line x1="28" y1="20" x2="28" y2="33" />
          </svg>
        ) : (
          <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-purple-100 border-2 border-purple-200 text-purple-600 flex items-center justify-center shadow-xs z-10 pointer-events-none">
            <AlertCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
        )}

        {/* Top Header Row with Smooth Concave Scoop Notch */}
        <div className="flex h-11 shrink-0 select-none">
          <div className="flex-1 bg-white rounded-tl-[24px]" />
          <svg className="w-[116px] h-11 shrink-0 text-white" viewBox="0 0 116 44" preserveAspectRatio="none">
            <path d="M 0 0 C 18 0, 30 40, 58 40 C 86 40, 98 0, 116 0 L 116 44 L 0 44 Z" fill="white" />
          </svg>
          <div className="flex-1 bg-white rounded-tr-[24px] relative">
            {/* Close Button Top Right */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute right-4 top-3 text-slate-300 hover:text-slate-600 p-1.5 rounded-full transition cursor-pointer"
              title="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="bg-white rounded-b-[24px] px-6 sm:px-8 pb-7 pt-2 -mt-[1px] text-center">
          {/* Title */}
          <h3 className="font-bold text-lg sm:text-xl text-slate-800 tracking-tight px-2 leading-snug">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-slate-500 font-normal mt-2.5 px-2 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
              {description}
            </p>
          )}

          {/* Action Buttons Right-Aligned matching reference image */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 mt-7 pt-1">
            {/* Cancel Button (Clean text link style) */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-600 hover:text-slate-900 font-semibold text-sm px-4 py-2.5 transition cursor-pointer"
            >
              {cancelLabel}
            </button>

            {/* Confirm / Delete Button */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-6 sm:px-7 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 ${
                isDelete
                  ? "bg-[#ff3b3b] hover:bg-[#eb2d2d] active:bg-[#d62424]"
                  : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
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
