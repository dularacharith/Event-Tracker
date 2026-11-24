"use client";

import React, { useState } from "react";

interface UserAvatarProps {
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({
  name,
  displayName,
  avatarUrl,
  image,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const effectiveName = displayName || name || "User";
  const initials = effectiveName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const src = avatarUrl || image;

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
    xl: "w-16 h-16 text-lg",
  }[size];

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={effectiveName}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 ${sizeClasses} ${className}`}
      />
    );
  }

  // Consistent background color based on name hash
  const colors = [
    "bg-indigo-600 text-white",
    "bg-emerald-600 text-white",
    "bg-sky-600 text-white",
    "bg-amber-600 text-white",
    "bg-purple-600 text-white",
    "bg-rose-600 text-white",
  ];
  const charCode = (effectiveName.charCodeAt(0) || 0) + (effectiveName.charCodeAt(1) || 0);
  const colorClass = colors[charCode % colors.length];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shrink-0 ${colorClass} ${sizeClasses} ${className}`}
    >
      {initials}
    </div>
  );
}
