"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoIconProps {
  className?: string;
  size?: number;
}

export function BrandLogoIcon({
  className = "w-7 h-7",
  size = 32,
}: BrandLogoIconProps) {
  return (
    <Image
      src="/images/logo-icon.png"
      alt="CampaignFlow Logo"
      width={size * 2}
      height={size * 2}
      className={`object-contain select-none pointer-events-none shrink-0 ${className}`}
      priority
    />
  );
}

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  iconSize?: number;
  textSize?: string;
}

export function BrandLogo({
  className = "",
  iconClassName = "w-7 h-7",
  iconSize = 28,
  textSize = "text-xl",
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <BrandLogoIcon className={iconClassName} size={iconSize} />
      <span className={`font-extrabold tracking-tight text-slate-900 ${textSize}`}>
        Campaign<span className="text-purple-600">Flow</span>
      </span>
    </div>
  );
}
