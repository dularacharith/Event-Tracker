"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  duration?: number;
  isExiting?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "isExiting">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Global dispatcher to allow firing toasts from anywhere
export function showToast(toast: Omit<ToastItem, "id" | "isExiting">) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cf-toast-event", {
        detail: toast,
      })
    );
  }
}

// Persist a toast across full page navigation/reload
export function setPendingToast(toast: Omit<ToastItem, "id" | "isExiting">) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("cf_pending_toast", JSON.stringify(toast));
    } catch {
      // ignore
    }
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target || target.isExiting) return prev;
      return prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t));
    });

    // Wait for the slide-out animation (350ms) to complete before removing from state
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 360);
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      dismissToast(id);
    },
    [dismissToast]
  );

  const addToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 4000,
    }: Omit<ToastItem, "id" | "isExiting">) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const toastHelpers = {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: "success", title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: "error", title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: "info", title, message, duration }),
  };

  // Check for pending toasts across page reloads
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const pending = sessionStorage.getItem("cf_pending_toast");
        if (pending) {
          sessionStorage.removeItem("cf_pending_toast");
          const item = JSON.parse(pending);
          if (item?.title) {
            addToast(item);
          }
        }
      } catch {
        sessionStorage.removeItem("cf_pending_toast");
      }
    }
  }, [addToast]);

  // Listen to custom global events
  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent<Omit<ToastItem, "id" | "isExiting">>;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener("cf-toast-event", handleCustomToast);
    return () => {
      window.removeEventListener("cf-toast-event", handleCustomToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Suspense fallback={null}>
        <ToastUrlWatcher />
      </Suspense>
    </ToastContext.Provider>
  );
}

function ToastUrlWatcher() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const signedOut = searchParams.get("signed_out");
    const signedIn = searchParams.get("signed_in");

    if (signedOut === "true") {
      toast.success(
        "Successfully signed out",
        "You have been signed out of CampaignFlow."
      );
      // Clean query parameter without full reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("signed_out");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    } else if (signedIn === "true") {
      toast.success(
        "Signed in successfully",
        "Welcome back to CampaignFlow!"
      );
      // Clean query parameter without full reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("signed_in");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  }, [searchParams, pathname, toast]);

  return null;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[120] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Track remaining duration for smooth pause/resume on hover
  const remainingTimeRef = useRef(item.duration ?? 4000);
  const timerStartRef = useRef<number | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    const dur = remainingTimeRef.current;
    if (dur <= 0 || item.isExiting) return;

    timerStartRef.current = Date.now();
    timerIdRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, dur);
  }, [item.id, item.isExiting, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    if (timerStartRef.current) {
      const elapsed = Date.now() - timerStartRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      timerStartRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (item.isExiting) {
      pauseTimer();
      return;
    }

    if (!isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }

    return () => {
      pauseTimer();
    };
  }, [isPaused, item.isExiting, startTimer, pauseTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.touches[0].clientX - touchStartX;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      setDragOffset(0);
      onDismiss(item.id);
    } else {
      setDragOffset(0);
      setIsPaused(false);
    }
    setTouchStartX(null);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={
        !item.isExiting && dragOffset > 0
          ? {
              transform: `translateX(${dragOffset}px)`,
              opacity: Math.max(0.3, 1 - dragOffset / 200),
            }
          : undefined
      }
      className={`pointer-events-auto bg-white rounded-xl shadow-xl border border-slate-200/90 p-4 flex items-start gap-3 transition-shadow duration-200 ease-out hover:shadow-2xl relative overflow-hidden ${
        item.isExiting
          ? "animate-toast-slide-out pointer-events-none"
          : "animate-toast-slide-in"
      }`}
    >
      {item.type === "success" && (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}
      {item.type === "error" && (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
      )}
      {item.type === "info" && (
        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1 pt-0.5 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 leading-tight">
          {item.title}
        </h4>
        {item.message && (
          <p className="text-xs text-slate-500 mt-1 leading-normal">
            {item.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition -mr-1 -mt-1 hover:bg-slate-100 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Subtle bottom progress bar */}
      {item.duration && item.duration > 0 && !item.isExiting && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100/80 overflow-hidden">
          <div
            className={`h-full ${
              item.type === "success"
                ? "bg-emerald-500"
                : item.type === "error"
                ? "bg-rose-500"
                : "bg-sky-500"
            }`}
            style={{
              animation: `toastProgress ${item.duration}ms linear forwards`,
              animationPlayState: isPaused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}
