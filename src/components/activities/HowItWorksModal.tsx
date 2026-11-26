"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  HelpCircle,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  ShieldCheck,
  Sparkles,
  Layers,
  FileCheck2,
  Calendar,
  Play,
  Send,
} from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed top-16 inset-x-0 bottom-0 bg-slate-900/40 backdrop-blur-md z-[80] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full my-8 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                How CampaignFlow Activities Work
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Workflow Guide
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lifecycle from initial draft ideation to verified publication and peer review
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-9rem)] overflow-y-auto">
          {/* Visual Lifecycle Pipeline Diagram */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Activity Lifecycle & Chain Transitions
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Step 1</span>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">Draft</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ideate content, brief, and target platform.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span className="text-[10px] font-semibold text-blue-500">Step 2</span>
                </div>
                <div>
                  <div className="font-bold text-blue-900 text-xs">Scheduled</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Lock date, recurrence rule, and reviewer.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600">Step 3</span>
                </div>
                <div>
                  <div className="font-bold text-amber-900 text-xs">In Progress</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    Actively creating assets and video edits.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  <span className="text-[10px] font-semibold text-purple-600">Step 4</span>
                </div>
                <div>
                  <div className="font-bold text-purple-900 text-xs">Awaiting Review</div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    Submit screenshot or live link proof.
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 shadow-2xs space-y-1.5 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                    5
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">Decision</span>
                </div>
                <div>
                  <div className="font-bold text-emerald-900 text-xs">Completed / Failed</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Reviewer records verdict & audit snapshot.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stage Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Step-by-Step Stage Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Draft */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    Draft Stage
                    <span className="text-[10px] font-medium text-slate-400">• Starting point</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Create content ideas, write initial copy, choose the campaign, channel, and social platform. No deadlines or reviewers are enforced yet.
                  </p>
                </div>
              </div>

              {/* Scheduled */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    Scheduling & Recurrence
                    <span className="text-[10px] font-medium text-blue-600">• Automation</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Set publication dates, optional recurrence frequency (daily, every 2/5 days, weekly, weekends), and an end date. Assigns an eligible reviewer with pass criteria.
                  </p>
                </div>
              </div>

              {/* In Progress */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    Active Execution
                    <span className="text-[10px] font-medium text-amber-600">• In Progress</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    The designated owner produces the design, captures footage, drafts post copy, and tracks work. Click &quot;Start Work&quot; to begin.
                  </p>
                </div>
              </div>

              {/* Awaiting Review */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  4
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    Review & Quality Check
                    <span className="text-[10px] font-medium text-purple-600">• Proof</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    The owner submits a screenshot or public post link. The designated reviewer inspects the evidence and checks off the criteria.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key System Protections & Rules */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Core Workflow Integrity Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-purple-950">
              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                <div className="font-bold text-[11px] text-purple-800">No Self-Reviews</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  An activity creator or owner cannot review their own work.
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                <div className="font-bold text-[11px] text-purple-800">Audit Proof Lock</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Approved activities have their screenshots and verdicts permanently sealed.
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                <div className="font-bold text-[11px] text-purple-800">Flexible Flow</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Canceled activities can be restored to Draft, and failed work can be rescheduled.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
