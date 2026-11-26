"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  align?: "left" | "right";
  showChevronRight?: boolean;
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  icon,
  className = "",
  menuClassName = "",
  disabled = false,
  size = "md",
  align = "left",
  showChevronRight = true,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const isSmall = size === "sm";

  return (
    <div className={`relative inline-block text-left w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border transition cursor-pointer select-none ${
          isSmall ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-xs font-semibold"
        } ${
          isOpen
            ? "border-purple-500 ring-2 ring-purple-500/20 bg-white text-slate-900 shadow-xs"
            : "border-slate-200/90 bg-white text-slate-800 hover:border-purple-300 hover:bg-slate-50/60 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Trigger Icon */}
          {icon ? (
            <span className="shrink-0 flex items-center justify-center text-purple-600">{icon}</span>
          ) : selectedOption?.icon ? (
            <span className="shrink-0 flex items-center justify-center">{selectedOption.icon}</span>
          ) : null}

          <span className="truncate block font-semibold text-slate-800">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Chevron Dropdown Indicator */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180 text-purple-600" : "text-slate-400"
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1.5 z-50 w-full min-w-[200px] bg-white rounded-2xl shadow-xl shadow-purple-950/10 border border-slate-100 p-1.5 animate-in fade-in-0 zoom-in-95 duration-100 max-h-64 overflow-y-auto ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 font-medium">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`w-full group flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs transition cursor-pointer select-none text-left mb-0.5 last:mb-0 ${
                    opt.disabled ? "opacity-40 cursor-not-allowed" : ""
                  } ${
                    isSelected
                      ? "bg-purple-600 text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/90 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Squircle Icon Pill if provided */}
                    {opt.icon && (
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200/80"
                        }`}
                      >
                        {opt.icon}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.subtitle && (
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-purple-100" : "text-slate-400"
                          }`}
                        >
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right End: Badge or Chevron Right / Check */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}

                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[2.5]" />
                    ) : showChevronRight ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
