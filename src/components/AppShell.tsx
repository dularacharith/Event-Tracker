"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { useNavigationLoader } from "@/contexts/NavigationLoaderContext";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  currentUser?: any;
  userRole?: any;
  children: React.ReactNode;
}

function MainLayout({ currentUser, userRole, children }: AppShellProps) {
  const { isExpanded } = useSidebar();
  const { loadingHref } = useNavigationLoader();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* Full-width Top Header */}
      <Navbar currentUser={currentUser} userRole={userRole} />

      {/* Main Body Area: Sidebar below Navbar, and Main Content */}
      <div className="flex-1 flex relative">
        <Sidebar currentUser={currentUser} userRole={userRole} />

        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            isExpanded ? "lg:pl-80" : "lg:pl-0"
          }`}
        >
          <main
            key={pathname}
            className={`flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col transition-all duration-300 ease-out animate-page-slide ${
              loadingHref ? "page-loading-blur" : ""
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ currentUser, userRole, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <FilterProvider>
        <MainLayout currentUser={currentUser} userRole={userRole}>
          {children}
        </MainLayout>
      </FilterProvider>
    </SidebarProvider>
  );
}
