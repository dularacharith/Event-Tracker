"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  currentUser?: any;
  userRole?: any;
  children: React.ReactNode;
}

function MainLayout({ currentUser, userRole, children }: AppShellProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <Navbar currentUser={currentUser} userRole={userRole} />
      <Sidebar currentUser={currentUser} userRole={userRole} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? "lg:pl-80" : "lg:pl-0"
        }`}
      >
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
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
