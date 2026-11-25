"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Layers,
  CheckSquare,
  Calendar,
  FolderGit2,
  Radio,
  Users,
  User,
  Settings,
  ChevronRight,
  PanelLeftClose,
  RotateCcw,
  Sparkles,
  Hash,
  Globe,
  Shield,
  Film,
  FileText,
  Clock,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useFilterContext } from "@/contexts/FilterContext";
import { useNavigationLoader } from "@/contexts/NavigationLoaderContext";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { UserAvatar } from "@/components/UserAvatar";

interface SidebarProps {
  currentUser?: {
    id: string;
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    image?: string | null;
    avatarUrl?: string | null;
    jobTitle?: string | null;
  } | null;
  userRole?: "admin" | "member" | null;
}

export function Sidebar({ currentUser, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isExpanded, collapseSidebar, isFilterOpen, toggleFilter } = useSidebar();
  const { loadingHref, startLoading } = useNavigationLoader();
  const {
    search,
    setSearch,
    filterCampaign,
    setFilterCampaign,
    filterChannel,
    setFilterChannel,
    filterPlatform,
    setFilterPlatform,
    filterStatus,
    setFilterStatus,
    filterOwner,
    setFilterOwner,
    resetFilters,
    activeFilterCount,
    campaigns,
    channels,
    teammates,
  } = useFilterContext();

  const [omniQuery, setOmniQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    settings: any[];
    activities: any[];
    campaigns: any[];
    channels: any[];
    members: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync omni search input with global filter search if on /activities
  useEffect(() => {
    if (pathname === "/activities") {
      setSearch(omniQuery);
    }
  }, [omniQuery, pathname, setSearch]);

  // Live Omni Search Debounce
  useEffect(() => {
    if (!omniQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(omniQuery)}`);
        const data = await res.json();
        if (data.success && data.results) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [omniQuery]);

  // Close search popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("sidebar-omni-search");
        input?.focus();
        setSearchFocused(true);
      }
      if (e.key === "Escape" && searchFocused) {
        setSearchFocused(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchFocused]);

  const navLinks = [
    { href: "/my-work", label: "My Work", icon: CheckSquare },
    { href: "/activities", label: "Activities", icon: Layers },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/campaigns", label: "Campaigns", icon: FolderGit2 },
    { href: "/channels", label: "Channels", icon: Radio },
    { href: "/team", label: "Team", icon: Users },
  ];

  const totalResultsCount =
    (searchResults?.settings?.length || 0) +
    (searchResults?.activities?.length || 0) +
    (searchResults?.campaigns?.length || 0) +
    (searchResults?.channels?.length || 0) +
    (searchResults?.members?.length || 0);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isExpanded && (
        <div
          onClick={collapseSidebar}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Collapsible Sidebar Drawer / Dock */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 shadow-2xl lg:shadow-sm flex flex-col transition-all duration-300 ease-in-out select-none ${
          isExpanded
            ? "w-80 translate-x-0 opacity-100"
            : "-translate-x-full w-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <button
            type="button"
            onClick={collapseSidebar}
            title="Collapse Sidebar"
            className="flex items-center gap-2 group px-2 py-1.5 -ml-2 rounded-xl hover:bg-slate-100/80 transition cursor-pointer select-none text-left"
          >
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-purple-900 transition">
              Campaign<span className="text-purple-600">Flow</span>
            </span>
            <PanelLeftClose className="w-4 h-4 text-purple-600 group-hover:text-purple-800 transition" />
          </button>
        </div>

        {/* Search & Filter Controls Section */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2 shrink-0">
          <div className="flex items-center gap-2" ref={searchContainerRef}>
            {/* Omni Search Bar */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="sidebar-omni-search"
                type="text"
                value={omniQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setOmniQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search events, settings, anything..."
                className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition"
              />
              {omniQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setOmniQuery("");
                    setSearchResults(null);
                  }}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2 top-2 text-[10px] text-slate-300 font-mono pointer-events-none hidden sm:inline">
                  ⌘K
                </span>
              )}

              {/* Floating Live Omni-Search Popover Results */}
              {searchFocused && (omniQuery.trim() || isSearching) && (
                <div className="absolute left-0 right-0 mt-2 z-[70] bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      Searching everywhere...
                    </div>
                  ) : totalResultsCount === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching events, settings, or pages found for &quot;{omniQuery}&quot;
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Settings & System Shortcuts */}
                      {searchResults?.settings && searchResults.settings.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Settings className="w-3 h-3 text-purple-600" />
                            Settings & Quick Actions
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {searchResults.settings.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  router.push(item.url);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-purple-50 group flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                                    <Settings className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 group-hover:text-purple-900 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities / Events */}
                      {searchResults?.activities && searchResults.activities.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-indigo-600" />
                            Activities & Events
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {searchResults.activities.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  router.push(item.url);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-slate-50 group flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-900 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Campaigns */}
                      {searchResults?.campaigns && searchResults.campaigns.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FolderGit2 className="w-3 h-3 text-blue-600" />
                            Campaigns
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {searchResults.campaigns.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  router.push(item.url);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-slate-50 group flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <FolderGit2 className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Channels */}
                      {searchResults?.channels && searchResults.channels.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-cyan-600" />
                            Channels
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {searchResults.channels.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  router.push(item.url);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-slate-50 group flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                                    <Hash className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      {searchResults?.members && searchResults.members.length > 0 && (
                        <div>
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-emerald-600" />
                            Team Members
                          </div>
                          <div className="space-y-0.5 mt-0.5">
                            {searchResults.members.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  router.push(item.url);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-slate-50 group flex items-center justify-between transition cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <User className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {item.subtitle}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Small Filter Button Next to Search */}
            <button
              type="button"
              onClick={toggleFilter}
              title="Filter Activities & Workflow"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 ${
                isFilterOpen || activeFilterCount > 0
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isFilterOpen || activeFilterCount > 0
                      ? "bg-white text-purple-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filter Panel (Given in Photo: All Campaigns, All Channels, All Platforms, All Statuses, All Owners) */}
          {isFilterOpen && (
            <div className="mt-2.5 p-3 rounded-2xl bg-slate-50/90 border border-purple-100 shadow-sm space-y-2.5 animate-in fade-in-0 zoom-in-98 duration-100">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Filter Activities
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {/* 1. All Campaigns Dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Campaign
                </label>
                <CustomDropdown
                  value={filterCampaign}
                  onChange={(val) => {
                    setFilterCampaign(val);
                    if (pathname !== "/activities") router.push("/activities");
                  }}
                  placeholder={campaigns.length === 0 ? "No Campaigns" : "All Campaigns"}
                  size="sm"
                  options={[
                    { value: "", label: "All Campaigns", icon: <Layers className="w-3.5 h-3.5" /> },
                    ...campaigns.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                />
              </div>

              {/* 2. All Channels Dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Channel
                </label>
                <CustomDropdown
                  value={filterChannel}
                  onChange={(val) => {
                    setFilterChannel(val);
                    if (pathname !== "/activities") router.push("/activities");
                  }}
                  placeholder={channels.length === 0 ? "No Channels" : "All Channels"}
                  size="sm"
                  options={[
                    { value: "", label: "All Channels", icon: <Hash className="w-3.5 h-3.5" /> },
                    ...channels.map((ch) => ({
                      value: ch.id,
                      label: `#${ch.name}`,
                      subtitle: ch.platform ? ch.platform.toUpperCase() : undefined,
                    })),
                  ]}
                />
              </div>

              {/* 3. All Platforms Dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Social Platform
                </label>
                <CustomDropdown
                  value={filterPlatform}
                  onChange={(val) => {
                    setFilterPlatform(val);
                    if (pathname !== "/activities") router.push("/activities");
                  }}
                  placeholder="All Platforms"
                  size="sm"
                  options={[
                    { value: "", label: "All Platforms", icon: <Radio className="w-3.5 h-3.5" /> },
                    { value: "twitter", label: "Twitter / X", icon: <span className="font-bold text-xs">𝕏</span> },
                    { value: "instagram", label: "Instagram", icon: <span className="text-pink-600 font-bold text-xs">IG</span> },
                    { value: "tiktok", label: "TikTok", icon: <span className="text-cyan-600 font-bold text-xs">TT</span> },
                    { value: "linkedin", label: "LinkedIn", icon: <span className="text-blue-600 font-bold text-xs">in</span> },
                    { value: "youtube", label: "YouTube", icon: <span className="text-red-600 font-bold text-xs">YT</span> },
                    { value: "facebook", label: "Facebook", icon: <span className="text-blue-700 font-bold text-xs">fb</span> },
                    { value: "threads", label: "Threads", icon: <span className="font-bold text-xs">@</span> },
                  ]}
                />
              </div>

              {/* 4. All Statuses Dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Workflow Status
                </label>
                <CustomDropdown
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val);
                    if (pathname !== "/activities") router.push("/activities");
                  }}
                  placeholder="All Statuses"
                  size="sm"
                  options={[
                    { value: "", label: "All Statuses", icon: <Layers className="w-3.5 h-3.5" /> },
                    { value: "draft", label: "Draft", icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> },
                    { value: "scheduled", label: "Scheduled", icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> },
                    { value: "in_progress", label: "In Progress", icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> },
                    { value: "awaiting_review", label: "Awaiting Review", icon: <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> },
                    { value: "passed", label: "Completed", icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> },
                    { value: "failed", label: "Failed", icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> },
                    { value: "canceled", label: "Canceled", icon: <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" /> },
                  ]}
                />
              </div>

              {/* 5. All Owners Dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Owner
                </label>
                <CustomDropdown
                  value={filterOwner}
                  onChange={(val) => {
                    setFilterOwner(val);
                    if (pathname !== "/activities") router.push("/activities");
                  }}
                  placeholder="All Owners"
                  size="sm"
                  options={[
                    { value: "", label: "All Owners", icon: <Users className="w-3.5 h-3.5" /> },
                    ...teammates.map((m) => ({
                      value: m.userId,
                      label: m.displayName || m.name || "Teammate",
                      subtitle: m.role ? m.role.toUpperCase() : undefined,
                      icon: <User className="w-3.5 h-3.5" />,
                    })),
                  ]}
                />
              </div>

              {pathname !== "/activities" && activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => router.push("/activities")}
                  className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  Apply in Activities Board <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Shortcuts Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workspace Pages
            </div>
            <div className="space-y-0.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/my-work" && pathname.startsWith(item.href));
                const isLinkLoading =
                  loadingHref === item.href ||
                  (item.href !== "/my-work" && loadingHref?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (pathname !== item.href) {
                        startLoading(item.href);
                      }
                      if (window.innerWidth < 1024) collapseSidebar();
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                      isLinkLoading
                        ? "bg-purple-100/70 text-purple-800 border border-purple-300/80 shadow-2xs"
                        : isActive
                        ? "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isLinkLoading
                            ? "bg-purple-600 text-white"
                            : isActive
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                        }`}
                      >
                        {isLinkLoading ? (
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        ) : (
                          <Icon className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {isLinkLoading ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping shrink-0 mr-1" />
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition shrink-0 ${
                          isActive
                            ? "text-purple-600"
                            : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick System Settings Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              System Settings
            </div>
            <div className="space-y-0.5">
              <Link
                href="/profile"
                onClick={() => {
                  if (window.innerWidth < 1024) collapseSidebar();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 flex items-center justify-center shrink-0 transition">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span>Timezone & Regional</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>

              <Link
                href="/team"
                onClick={() => {
                  if (window.innerWidth < 1024) collapseSidebar();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 flex items-center justify-center shrink-0 transition">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>Roles & Member Invites</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>

              <Link
                href="/profile"
                onClick={() => {
                  if (window.innerWidth < 1024) collapseSidebar();
                }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 flex items-center justify-center shrink-0 transition">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>User Profile & Job Title</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        {currentUser && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
            <Link
              href="/profile"
              onClick={() => {
                if (window.innerWidth < 1024) collapseSidebar();
              }}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition"
            >
              <UserAvatar
                name={currentUser.name}
                displayName={currentUser.displayName}
                avatarUrl={currentUser.avatarUrl}
                image={currentUser.image}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.displayName || currentUser.name || "User"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser.email}
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
                {userRole || "Member"}
              </span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
