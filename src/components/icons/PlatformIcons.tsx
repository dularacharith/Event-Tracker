"use client";

import React from "react";
import { Globe } from "lucide-react";

export interface PlatformIconProps {
  platform?: string | null;
  className?: string;
  size?: number | string;
  colored?: boolean;
}

/**
 * Official Twitter / X Vector Mark
 */
export function TwitterXIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Official Instagram Vector Camera Mark
 */
export function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

/**
 * Official TikTok Vector Mark
 */
export function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.34 22a6.33 6.33 0 0 0 6.34-6.33V8.8a8.28 8.28 0 0 0 4.91 1.6V6.95a4.9 4.9 0 0 1-1-.26z" />
    </svg>
  );
}

/**
 * Official LinkedIn Vector Mark
 */
export function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.4 1.4 0 0 0 1.4-1.4 1.4 1.4 0 0 0-1.4-1.4 1.4 1.4 0 0 0-1.4 1.4 1.4 1.4 0 0 0 1.4 1.4m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

/**
 * Official YouTube Vector Mark
 */
export function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/**
 * Official Facebook Vector Mark
 */
export function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * Official Threads Swirl Vector Mark
 */
export function ThreadsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.786 2.002C6.91 1.768 2.054 6.398 2.002 12.274c-.053 5.94 4.707 10.74 10.647 10.725 3.978-.01 7.42-2.189 9.213-5.385l-1.748-1.012c-1.42 2.531-4.148 4.258-7.29 4.266-4.757.012-8.583-3.83-8.54-8.587.042-4.697 3.896-8.418 8.657-8.229 4.41.176 7.973 3.766 8.058 8.18v.76c0 1.554-.972 2.607-2.316 2.607-1.074 0-1.89-.785-1.95-1.905V10.17h-1.97v1.077c-.556-.757-1.488-1.228-2.585-1.228-2.613 0-4.634 2.112-4.634 4.747 0 2.64 2.021 4.754 4.634 4.754 1.144 0 2.118-.517 2.673-1.328.455 1.485 1.79 2.457 3.447 2.457 2.428 0 4.285-1.866 4.285-4.577v-.76c-.1-5.518-4.555-10-10.07-10.22zm-.577 10.82c1.474 0 2.67 1.196 2.67 2.67 0 1.475-1.196 2.672-2.67 2.672-1.475 0-2.672-1.197-2.672-2.672 0-1.474 1.197-2.67 2.672-2.67z" />
    </svg>
  );
}

/**
 * Universal PlatformIcon router component
 */
export function PlatformIcon({
  platform,
  className = "w-4 h-4",
  colored = false,
}: PlatformIconProps) {
  const norm = (platform || "").toLowerCase().trim();

  if (norm === "twitter" || norm === "x") {
    return (
      <TwitterXIcon
        className={`${className} ${colored ? "text-slate-900" : ""}`}
      />
    );
  }
  if (norm === "instagram" || norm === "ig") {
    return (
      <InstagramIcon
        className={`${className} ${colored ? "text-pink-600" : ""}`}
      />
    );
  }
  if (norm === "tiktok" || norm === "tt") {
    return (
      <TikTokIcon
        className={`${className} ${colored ? "text-slate-900" : ""}`}
      />
    );
  }
  if (norm === "linkedin" || norm === "in") {
    return (
      <LinkedInIcon
        className={`${className} ${colored ? "text-blue-600" : ""}`}
      />
    );
  }
  if (norm === "youtube" || norm === "yt") {
    return (
      <YouTubeIcon
        className={`${className} ${colored ? "text-red-600" : ""}`}
      />
    );
  }
  if (norm === "facebook" || norm === "fb") {
    return (
      <FacebookIcon
        className={`${className} ${colored ? "text-blue-600" : ""}`}
      />
    );
  }
  if (norm === "threads") {
    return (
      <ThreadsIcon
        className={`${className} ${colored ? "text-slate-900" : ""}`}
      />
    );
  }

  return (
    <Globe
      className={`${className} ${colored ? "text-slate-500" : ""}`}
    />
  );
}

/**
 * Helper to get platform metadata, label, color styles, and icon
 */
export function getPlatformMeta(platform?: string | null) {
  const norm = (platform || "other").toLowerCase().trim();

  switch (norm) {
    case "twitter":
    case "x":
      return {
        id: "twitter",
        label: "Twitter / X",
        colorClass: "text-slate-900",
        badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
        icon: <TwitterXIcon className="w-4 h-4 text-slate-900" />,
      };
    case "instagram":
    case "ig":
      return {
        id: "instagram",
        label: "Instagram",
        colorClass: "text-pink-600",
        badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
        icon: <InstagramIcon className="w-4 h-4 text-pink-600" />,
      };
    case "tiktok":
    case "tt":
      return {
        id: "tiktok",
        label: "TikTok",
        colorClass: "text-slate-900",
        badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
        icon: <TikTokIcon className="w-4 h-4 text-slate-900" />,
      };
    case "linkedin":
    case "in":
      return {
        id: "linkedin",
        label: "LinkedIn",
        colorClass: "text-blue-600",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <LinkedInIcon className="w-4 h-4 text-blue-600" />,
      };
    case "youtube":
    case "yt":
      return {
        id: "youtube",
        label: "YouTube",
        colorClass: "text-red-600",
        badgeBg: "bg-red-50 text-red-700 border-red-200",
        icon: <YouTubeIcon className="w-4 h-4 text-red-600" />,
      };
    case "facebook":
    case "fb":
      return {
        id: "facebook",
        label: "Facebook",
        colorClass: "text-blue-600",
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <FacebookIcon className="w-4 h-4 text-blue-600" />,
      };
    case "threads":
      return {
        id: "threads",
        label: "Threads",
        colorClass: "text-slate-900",
        badgeBg: "bg-zinc-100 text-zinc-800 border-zinc-200",
        icon: <ThreadsIcon className="w-4 h-4 text-slate-900" />,
      };
    default:
      return {
        id: "other",
        label: "Other",
        colorClass: "text-slate-500",
        badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
        icon: <Globe className="w-4 h-4 text-slate-500" />,
      };
  }
}
