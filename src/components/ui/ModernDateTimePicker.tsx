"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from "date-fns";

export interface ModernDateTimePickerProps {
  value?: string | null;
  onChange: (value: string, meta?: { isAllDay: boolean; date: Date | null }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowNoTime?: boolean;
  dateOnly?: boolean;
  minDate?: Date;
  className?: string;
  id?: string;
}

export function ModernDateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time...",
  required = false,
  disabled = false,
  allowNoTime = true,
  dateOnly = false,
  minDate,
  className = "",
  id,
}: ModernDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse incoming value
  const parsedValue = useMemo(() => {
    if (!value) return null;
    try {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return {
        date: d,
        isAllDay: isDateOnly,
      };
    } catch {
      return null;
    }
  }, [value]);

  // Working state when modal is open
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return parsedValue?.date || new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    return parsedValue?.date || null;
  });
  const [isAllDay, setIsAllDay] = useState<boolean>(() => {
    if (dateOnly) return true;
    return parsedValue?.isAllDay ?? false;
  });

  // Time state: 12-hour format with AM/PM
  const [selectedHour12, setSelectedHour12] = useState<number>(() => {
    if (parsedValue?.date && !parsedValue.isAllDay) {
      const h24 = parsedValue.date.getHours();
      const h12 = h24 % 12 || 12;
      return h12;
    }
    return 9;
  });

  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    if (parsedValue?.date && !parsedValue.isAllDay) {
      return parsedValue.date.getMinutes();
    }
    return 0;
  });

  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">(() => {
    if (parsedValue?.date && !parsedValue.isAllDay) {
      return parsedValue.date.getHours() >= 12 ? "PM" : "AM";
    }
    return "AM";
  });

  // Active view inside modal: "date" or "time"
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  // Active clock dial mode: "hour" or "minute"
  const [clockMode, setClockMode] = useState<"hour" | "minute">("hour");

  // Dropdown states for month/year selectors
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);

  // Clock dial ref for dragging/clicking
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Re-sync when modal opens
  const handleOpen = () => {
    if (disabled) return;
    const initialDate = parsedValue?.date || new Date();
    setSelectedDate(parsedValue?.date || initialDate);
    setCurrentMonth(initialDate);
    setIsAllDay(dateOnly ? true : (parsedValue?.isAllDay ?? false));

    if (parsedValue?.date && !parsedValue.isAllDay) {
      const h24 = parsedValue.date.getHours();
      setSelectedHour12(h24 % 12 || 12);
      setSelectedMinute(parsedValue.date.getMinutes());
      setSelectedAmPm(h24 >= 12 ? "PM" : "AM");
    } else {
      setSelectedHour12(9);
      setSelectedMinute(0);
      setSelectedAmPm("AM");
    }

    setActiveTab("date");
    setClockMode("hour");
    setShowMonthSelect(false);
    setShowYearSelect(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Convert 12-hour + AM/PM to 24-hour
  const get24Hour = useCallback((h12: number, ampm: "AM" | "PM") => {
    if (ampm === "AM") {
      return h12 === 12 ? 0 : h12;
    } else {
      return h12 === 12 ? 12 : h12 + 12;
    }
  }, []);

  // Format final value and confirm
  const handleConfirm = () => {
    if (!selectedDate) {
      onChange("");
      handleClose();
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");

    if (isAllDay || dateOnly) {
      // Date only: YYYY-MM-DD
      const dateStr = `${year}-${month}-${day}`;
      const finalDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
      onChange(dateStr, { isAllDay: true, date: finalDate });
    } else {
      // Date + Time: YYYY-MM-DDTHH:mm
      const h24 = get24Hour(selectedHour12, selectedAmPm);
      const hourStr = String(h24).padStart(2, "0");
      const minStr = String(selectedMinute).padStart(2, "0");
      const isoLocal = `${year}-${month}-${day}T${hourStr}:${minStr}`;
      const finalDate = new Date(year, selectedDate.getMonth(), selectedDate.getDate(), h24, selectedMinute, 0);
      onChange(isoLocal, { isAllDay: false, date: finalDate });
    }

    handleClose();
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleSelectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setShowYearSelect(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setShowMonthSelect(false);
  };

  // Month days generation
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    // Standard week starts on Sunday (index 0) like in the reference image
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Quick preset chips
  const handleSetToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const handleSetTomorrow = () => {
    const tmrw = addDays(new Date(), 1);
    setSelectedDate(tmrw);
    setCurrentMonth(tmrw);
  };

  const handleSetNextWeek = () => {
    const nextWk = addDays(new Date(), 7);
    setSelectedDate(nextWk);
    setCurrentMonth(nextWk);
  };

  // Interactive Clock Dial Math & Handlers
  const calculateClockValueFromEvent = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let clientX = 0;
      let clientY = 0;

      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // Angle in degrees from top (0 degrees = 12 o'clock)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      if (clockMode === "hour") {
        let hour = Math.round(angle / 30) % 12;
        if (hour === 0) hour = 12;
        setSelectedHour12(hour);
      } else {
        let minute = Math.round(angle / 6) % 60;
        setSelectedMinute(minute);
      }
    },
    [clockMode]
  );

  const handleDialMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    calculateClockValueFromEvent(e);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      calculateClockValueFromEvent(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // If was selecting hour, smoothly advance to minute mode
      if (clockMode === "hour") {
        setTimeout(() => {
          setClockMode("minute");
        }, 220);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, calculateClockValueFromEvent, clockMode]);

  // Year options: currentYear - 2 to currentYear + 10
  const yearOptions = useMemo(() => {
    const curr = new Date().getFullYear();
    const list = [];
    for (let y = curr - 2; y <= curr + 8; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Formatted trigger display text
  const displayText = useMemo(() => {
    if (!parsedValue || !parsedValue.date) return null;
    const d = parsedValue.date;
    if (parsedValue.isAllDay) {
      return {
        dateStr: format(d, "MMM d, yyyy"),
        timeStr: "All-day",
        isAllDay: true,
      };
    }
    return {
      dateStr: format(d, "MMM d, yyyy"),
      timeStr: format(d, "hh:mm a"),
      isAllDay: false,
    };
  }, [parsedValue]);

  // Angle calculations for clock hand
  const hourAngle = (selectedHour12 % 12) * 30; // 360 / 12 = 30 deg
  const minuteAngle = selectedMinute * 6; // 360 / 60 = 6 deg
  const currentHandAngle = clockMode === "hour" ? hourAngle : minuteAngle;

  return (
    <>
      {/* Trigger Input Field */}
      <div
        id={id}
        onClick={handleOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`group relative w-full text-xs border border-slate-200 hover:border-purple-300 focus:border-purple-500 rounded-xl px-3 py-2.5 bg-white transition-all shadow-2xs cursor-pointer flex items-center justify-between gap-2 select-none outline-none focus:ring-2 focus:ring-purple-500/20 ${
          disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-purple-600 shrink-0" />
          {displayText ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-800">{displayText.dateStr}</span>
              <span className="text-slate-300">•</span>
              {displayText.isAllDay ? (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  All-day
                </span>
              ) : (
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-500 inline shrink-0" />
                  {displayText.timeStr}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {displayText && !required && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date & time"
              className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition" />
        </div>
      </div>

      {/* Modern Popover / Modal Overlay mounted via React Portal */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed top-16 inset-x-0 bottom-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-md select-none overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-[380px] sm:max-w-[420px] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150 text-slate-900">
            {/* Header: Title, Tab Switcher & 3D Calendar Badge */}
            <div className="p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-purple-50/60 via-indigo-50/30 to-white">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {activeTab === "date" ? "Select Date" : "Select Time"}
                  </h3>
                </div>

                {/* Date / Time Sliding Tabs (Hidden if dateOnly) */}
                {!dateOnly && (
                  <div className="relative bg-slate-100/90 p-0.5 rounded-xl flex items-center text-xs font-semibold select-none border border-slate-200/70 w-44 shadow-2xs">
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-lg bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        activeTab === "date" ? "left-0.5 translate-x-0" : "left-0.5 translate-x-full"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setActiveTab("date")}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                        activeTab === "date" ? "text-purple-700 font-bold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAllDay(false);
                        setActiveTab("time");
                      }}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                        activeTab === "time" ? "text-purple-700 font-bold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Time</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Top Right: Modern Calendar Badge (Inspired by Reference) & Close button */}
              <div className="flex items-center gap-2">
                {/* Modern 3D-styled Calendar Badge with system purple accent */}
                <div className="w-12 h-13 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-purple-500/30 flex flex-col items-center justify-center border-t border-purple-400 relative overflow-hidden shrink-0">
                  {/* Calendar Top Rings */}
                  <div className="absolute top-1 inset-x-0 flex justify-around px-2 pointer-events-none">
                    <span className="w-1 h-1.5 rounded-full bg-white/70" />
                    <span className="w-1 h-1.5 rounded-full bg-white/70" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-200 mt-1 leading-none">
                    {format(selectedDate || currentMonth, "MMM")}
                  </span>
                  <span className="text-lg font-black tracking-tight leading-none text-white mt-0.5">
                    {format(selectedDate || currentMonth, "dd")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB CONTENT: DATE VIEW */}
            {activeTab === "date" && (
              <div className="p-5 space-y-4 animate-in fade-in-50 duration-150">
                {/* Month & Year Selectors with Chevrons */}
                <div className="flex items-center justify-between gap-2 relative">
                  <div className="flex items-center gap-2">
                    {/* Month Dropdown Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMonthSelect((prev) => !prev);
                          setShowYearSelect(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer shadow-2xs"
                      >
                        <span>{format(currentMonth, "MMMM")}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {showMonthSelect && (
                        <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 grid grid-cols-1 max-h-48 overflow-y-auto">
                          {monthNames.map((name, idx) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => handleSelectMonth(idx)}
                              className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition font-medium ${
                                currentMonth.getMonth() === idx
                                  ? "bg-purple-50 text-purple-700 font-bold"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Year Dropdown Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowYearSelect((prev) => !prev);
                          setShowMonthSelect(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80 cursor-pointer shadow-2xs"
                      >
                        <span>{format(currentMonth, "yyyy")}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {showYearSelect && (
                        <div className="absolute left-0 top-full mt-1.5 w-24 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 grid grid-cols-1 max-h-48 overflow-y-auto">
                          {yearOptions.map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => handleSelectYear(yr)}
                              className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition font-medium ${
                                currentMonth.getFullYear() === yr
                                  ? "bg-purple-50 text-purple-700 font-bold"
                                  : "hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Previous / Next Month Chevrons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition cursor-pointer"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 transition cursor-pointer"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers: SUN MON TUE WED THU FRI SAT */}
                <div className="grid grid-cols-7 text-center">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName) => (
                    <div
                      key={dayName}
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, idx) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const inCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDay = isToday(day);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          if (!isSameMonth(day, currentMonth)) {
                            setCurrentMonth(day);
                          }
                        }}
                        className={`h-9 sm:h-9.5 rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-all relative cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-500/35 scale-105 z-10"
                            : inCurrentMonth
                            ? "text-slate-800 hover:bg-purple-50 hover:text-purple-700"
                            : "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                        }`}
                      >
                        <span>{format(day, "d")}</span>
                        {/* Dot indicator for today if not selected */}
                        {isTodayDay && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Shortcuts: Today, Tomorrow, Next Week */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleSetTomorrow}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={handleSetNextWeek}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition"
                    >
                      Next Week
                    </button>
                  </div>

                  {/* All-Day / No Specific Time Toggle */}
                  {allowNoTime && (
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <span className="text-[11px]">No specific time</span>
                    </label>
                  )}
                </div>

                {/* Action Button: Either Confirm Date or Next: Time */}
                <div className="pt-2">
                  {isAllDay || dateOnly ? (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{dateOnly ? "Confirm Date" : "Confirm Date (All-day)"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("time")}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Next: Select Time</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: CLOCK TIME PICKER VIEW */}
            {activeTab === "time" && (
              <div className="p-5 space-y-4 animate-in fade-in-50 duration-150">
                {/* Digital Time Display & AM/PM Selector */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    {/* Hour Button */}
                    <button
                      type="button"
                      onClick={() => setClockMode("hour")}
                      className={`px-3 py-1.5 rounded-xl text-2xl font-black transition cursor-pointer ${
                        clockMode === "hour"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                          : "bg-white text-slate-800 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {String(selectedHour12).padStart(2, "0")}
                    </button>

                    <span className="text-xl font-bold text-slate-400">:</span>

                    {/* Minute Button */}
                    <button
                      type="button"
                      onClick={() => setClockMode("minute")}
                      className={`px-3 py-1.5 rounded-xl text-2xl font-black transition cursor-pointer ${
                        clockMode === "minute"
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                          : "bg-white text-slate-800 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {String(selectedMinute).padStart(2, "0")}
                    </button>
                  </div>

                  {/* AM / PM Segmented Control */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedAmPm("AM")}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        selectedAmPm === "AM"
                          ? "bg-white text-purple-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>AM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAmPm("PM")}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        selectedAmPm === "PM"
                          ? "bg-white text-purple-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>PM</span>
                    </button>
                  </div>
                </div>

                {/* Clock Dial Mode Indicator & Switcher */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Selecting: <strong className="text-purple-700 uppercase">{clockMode}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setClockMode(clockMode === "hour" ? "minute" : "hour")}
                      className="text-purple-600 hover:text-purple-800 font-semibold underline text-xs cursor-pointer"
                    >
                      Switch to {clockMode === "hour" ? "Minute" : "Hour"}
                    </button>
                  </div>
                </div>

                {/* Interactive Analog Clock Face */}
                <div className="py-1 flex items-center justify-center">
                  <div
                    ref={dialRef}
                    onMouseDown={handleDialMouseDown}
                    className="w-60 h-60 sm:w-64 sm:h-64 rounded-full bg-slate-50 border-2 border-slate-200/80 relative shadow-inner flex items-center justify-center select-none cursor-pointer group"
                  >
                    {/* Center Pivot */}
                    <div className="w-3 h-3 rounded-full bg-purple-600 z-30 shadow-xs" />

                    {/* Animated Clock Hand pointing to selected angle */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out z-20"
                      style={{
                        transform: `rotate(${currentHandAngle}deg)`,
                      }}
                    >
                      {/* Hand stem */}
                      <div className="absolute top-7 bottom-1/2 w-1 bg-purple-600 rounded-full" />
                      {/* Hand Pointer Knob */}
                      <div className="absolute top-3 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/40 border-2 border-white">
                        {clockMode === "hour"
                          ? selectedHour12
                          : String(selectedMinute).padStart(2, "0")}
                      </div>
                    </div>

                    {/* Clock Numbers */}
                    {clockMode === "hour" ? (
                      // 12 Hours: 1..12
                      [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                        const angle = (h * 30 - 90) * (Math.PI / 180);
                        const radius = 92; // px from center
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        const isCurrent = selectedHour12 === h;

                        return (
                          <div
                            key={h}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                            className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? "text-white opacity-0" // covered by knob
                                : "text-slate-700 group-hover:text-slate-900"
                            }`}
                          >
                            {h}
                          </div>
                        );
                      })
                    ) : (
                      // 12 Major Minute Marks: 00, 05, 10... 55
                      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                        const angle = (m * 6 - 90) * (Math.PI / 180);
                        const radius = 92;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);
                        const isCurrent = selectedMinute === m;

                        return (
                          <div
                            key={m}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
                            }}
                            className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? "text-white opacity-0"
                                : "text-slate-700 group-hover:text-slate-900"
                            }`}
                          >
                            {String(m).padStart(2, "0")}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick Presets: 9am, 12pm, 3pm, 6pm */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                  {[
                    { label: "09:00 AM", h: 9, m: 0, ampm: "AM" as const },
                    { label: "12:00 PM", h: 12, m: 0, ampm: "PM" as const },
                    { label: "03:00 PM", h: 3, m: 0, ampm: "PM" as const },
                    { label: "06:00 PM", h: 6, m: 0, ampm: "PM" as const },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSelectedHour12(preset.h);
                        setSelectedMinute(preset.m);
                        setSelectedAmPm(preset.ampm);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11px] font-semibold transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Bottom Action Buttons in Time View */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("date")}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Date</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {allowNoTime && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAllDay(true);
                          handleConfirm();
                        }}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition cursor-pointer"
                      >
                        Skip Time
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
