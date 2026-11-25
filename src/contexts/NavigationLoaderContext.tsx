"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationLoaderContextValue {
  loadingHref: string | null;
  startLoading: (href: string) => void;
  stopLoading: () => void;
}

const NavigationLoaderContext = createContext<NavigationLoaderContextValue>({
  loadingHref: null,
  startLoading: () => {},
  stopLoading: () => {},
});

function NavigationTracker({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  // Clear loading when route or params finish changing
  useEffect(() => {
    setLoadingHref(null);
  }, [pathname, searchParams]);

  // Safety timeout in case navigation fails or is aborted
  useEffect(() => {
    if (!loadingHref) return;
    const timer = setTimeout(() => {
      setLoadingHref(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [loadingHref]);

  // Global click listener to detect internal link navigations
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href) return;
      if (e.defaultPrevented) return;
      if (target.target === "_blank") return;

      try {
        const url = new URL(target.href, window.location.origin);
        if (url.origin === window.location.origin) {
          const targetPath = url.pathname;
          if (targetPath !== window.location.pathname) {
            setLoadingHref(targetPath);
          }
        }
      } catch {
        // ignore invalid urls
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const startLoading = (href: string) => setLoadingHref(href);
  const stopLoading = () => setLoadingHref(null);

  return (
    <NavigationLoaderContext.Provider
      value={{ loadingHref, startLoading, stopLoading }}
    >
      {/* Top indeterminate loading bar */}
      {loadingHref && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-purple-100/80 z-[120] overflow-hidden pointer-events-none">
          <div className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 w-1/2 animate-indeterminate rounded-r-full shadow-xs" />
        </div>
      )}
      {children}
    </NavigationLoaderContext.Provider>
  );
}

export function NavigationLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<>{children}</>}>
      <NavigationTracker>{children}</NavigationTracker>
    </Suspense>
  );
}

export function useNavigationLoader() {
  return useContext(NavigationLoaderContext);
}
