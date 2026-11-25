"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
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
export function showToast(toast: Omit<ToastItem, "id">) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cf-toast-event", {
        detail: toast,
      })
    );
  }
}

// Persist a toast across full page navigation/reload
export function setPendingToast(toast: Omit<ToastItem, "id">) {
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

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 4000,
    }: Omit<ToastItem, "id">) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
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
      const customEvent = event as CustomEvent<Omit<ToastItem, "id">>;
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
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
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
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto bg-white rounded-xl shadow-xl border border-slate-200/90 p-4 flex items-start gap-3 transition transform duration-200 ease-out hover:shadow-2xl animate-in slide-in-from-top-2 fade-in"
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
            onClick={() => onDismiss(item.id)}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition -mr-1 -mt-1 hover:bg-slate-100 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
