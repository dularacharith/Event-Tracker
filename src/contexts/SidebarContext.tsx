"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextValue {
  isExpanded: boolean;
  toggleSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  isFilterOpen: boolean;
  toggleFilter: () => void;
  setIsFilterOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const saved = localStorage.getItem("cf_sidebar_expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    } else {
      // Default to expanded on desktop screens (>= 1280px)
      if (typeof window !== "undefined" && window.innerWidth >= 1280) {
        setIsExpanded(true);
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("cf_sidebar_expanded", String(next));
      }
      return next;
    });
  };

  const expandSidebar = () => {
    setIsExpanded(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("cf_sidebar_expanded", "true");
    }
  };

  const collapseSidebar = () => {
    setIsExpanded(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("cf_sidebar_expanded", "false");
    }
  };

  const toggleFilter = () => {
    setIsFilterOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        toggleSidebar,
        expandSidebar,
        collapseSidebar,
        isFilterOpen,
        toggleFilter,
        setIsFilterOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
