"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";

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
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "purple",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[90] flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
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

        {/* Action Buttons Centered Side-by-Side (Inspired by Reference) */}
        <div className="flex items-center justify-center gap-3 mt-6 pt-2">
          {/* Confirm Button (Purple by Default) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              confirmVariant === "rose"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 active:bg-purple-800"
            } disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            <span>{confirmLabel}</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
