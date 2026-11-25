"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layers,
  CheckSquare,
  Calendar,
  FolderGit2,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Loader2,
  Radio,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { UserAvatar } from "./UserAvatar";
import { NotificationCenter } from "./NotificationCenter";
import { signIn, signOut, useSession } from "@/lib/auth-client";

interface NavbarProps {
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

export function Navbar({ currentUser, userRole }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { data: clientSession } = useSession();
  const effectiveUser = isSigningOut
    ? null
    : currentUser || (clientSession?.user as any) || null;

  const navLinks = [
    { href: "/my-work", label: "My Work", icon: CheckSquare },
    { href: "/activities", label: "Activities", icon: Layers },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/campaigns", label: "Campaigns", icon: FolderGit2 },
    { href: "/channels", label: "Channels", icon: Radio },
    { href: "/team", label: "Team", icon: Users },
  ];

  const handleSignOut = async () => {
    try {
      setProfileDropdownOpen(false);
      setIsSigningOut(true);
      await signOut();
    } catch {
      // fallback
    } finally {
      document.cookie =
        "cf_dev_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Full hard navigation to /login with signed_out query param to reset all caches
      window.location.href = "/login?signed_out=true";
    }
  };

  const handleNavbarSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/my-work?signed_in=true",
      });
    } catch (err) {
      console.error("Navbar sign-in error:", err);
      setIsSigningIn(false);
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  };

  return (
    <>
      {/* Sign Out Progress Overlay */}
      {isSigningOut && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-3 border border-slate-200">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
            <span className="text-sm font-semibold text-slate-800">
              Signing out of CampaignFlow...
            </span>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo / Sidebar Toggle */}
            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={toggleSidebar}
                title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar (Logo click)"}
                className="flex items-center gap-2.5 group p-1.5 -m-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer select-none text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 group-hover:bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm transition">
                  CF
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-purple-900 transition">
                    Campaign<span className="text-indigo-600 group-hover:text-purple-600">Flow</span>
                  </span>
                  <PanelLeft
                    className={`w-4 h-4 transition ${
                      isExpanded
                        ? "text-purple-600"
                        : "text-slate-400 group-hover:text-purple-600"
                    }`}
                  />
                </div>
              </button>

              {/* Desktop Navigation */}
              {effectiveUser && (
                <div className="hidden md:flex items-center space-x-1">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/my-work" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Action Area */}
            <div className="flex items-center gap-3">
              {effectiveUser ? (
                <>
                  <NotificationCenter />

                  {/* Profile menu */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <UserAvatar
                        name={effectiveUser.name}
                        displayName={effectiveUser.displayName}
                        avatarUrl={effectiveUser.avatarUrl}
                        image={effectiveUser.image}
                        size="sm"
                      />
                      <div className="hidden sm:block text-left text-xs">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {effectiveUser.displayName ||
                            effectiveUser.name ||
                            "User"}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {userRole || "Teammate"}
                        </div>
                      </div>
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-purple-950/10 border border-slate-100 p-1.5 z-[60] animate-in fade-in-0 zoom-in-95 duration-100">
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-xs font-bold text-slate-900">
                            {effectiveUser.displayName || effectiveUser.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {effectiveUser.email}
                          </p>
                          {effectiveUser.jobTitle && (
                            <p className="text-[10px] font-semibold text-purple-600 mt-0.5">
                              {effectiveUser.jobTitle}
                            </p>
                          )}
                        </div>

                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span>Edit Profile</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                        </Link>

                        <Link
                          href="/team"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-slate-200/80 shrink-0">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <span>Team & Workspace</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          onClick={handleSignOut}
                          className="w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 shrink-0">
                              <LogOut className="w-3.5 h-3.5" />
                            </div>
                            <span>Sign Out</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile hamburger button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNavbarSignIn}
                  disabled={isSigningIn}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && effectiveUser && (
            <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/my-work" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
