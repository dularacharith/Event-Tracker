"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  UserCheck,
  Loader2,
  Sparkles,
  ChevronDown,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signed_out") === "true";

  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const isDev = process.env.NODE_ENV !== "production";
  const { data: session } = useSession();

  useEffect(() => {
    // Only redirect if session is present AND we are not explicitly signed out
    if (session?.user && !signedOut) {
      router.push("/my-work");
    }
  }, [session, router, signedOut]);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/my-work?signed_in=true",
      });
    } catch (err: any) {
      alert("Authentication error: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const handleDevLogin = async (email: string, name?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/dev/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || email.split("@")[0] }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }
      router.push("/my-work?signed_in=true");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c051a] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden select-none font-sans">
      {/* 1. DYNAMIC COSMIC AURORA LIGHT RIBBONS & AMBIENT GLOW */}
      {/* Top-Right Sweeping Aurora Waves */}
      <div className="absolute top-0 right-0 w-[55vw] max-w-[760px] h-[70vh] pointer-events-none select-none opacity-85 z-0">
        <svg
          viewBox="0 0 760 620"
          className="w-full h-full object-cover"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="auroraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#ec4899" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="auroraGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
            <filter id="auroraGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="38" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sweeping Ribbon 1 */}
          <path
            d="M 280 -60 C 440 80, 520 220, 780 180 C 880 160, 920 300, 720 460 C 580 570, 780 620, 820 660"
            stroke="url(#auroraGrad1)"
            strokeWidth="110"
            strokeLinecap="round"
            filter="url(#auroraGlow)"
            opacity="0.8"
          />
          {/* Sweeping Ribbon 2 */}
          <path
            d="M 380 -80 C 500 120, 480 320, 760 380 C 860 410, 680 560, 620 620"
            stroke="url(#auroraGrad2)"
            strokeWidth="60"
            strokeLinecap="round"
            filter="url(#auroraGlow)"
            opacity="0.65"
          />
          {/* Fine Cyan/Magenta Accent Threads */}
          <path
            d="M 240 20 C 380 140, 560 210, 740 260"
            stroke="#38bdf8"
            strokeWidth="8"
            filter="url(#auroraGlow)"
            opacity="0.9"
          />
          <path
            d="M 320 -20 C 460 160, 620 260, 800 320"
            stroke="#f472b6"
            strokeWidth="6"
            filter="url(#auroraGlow)"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Bottom-Left Sweeping Aurora Waves */}
      <div className="absolute -bottom-20 -left-20 w-[45vw] max-w-[620px] h-[55vh] pointer-events-none select-none opacity-80 z-0">
        <svg
          viewBox="0 0 600 500"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -40 480 C 140 380, 240 260, 180 140 C 120 20, 280 -40, 360 -20"
            stroke="url(#auroraGrad1)"
            strokeWidth="90"
            strokeLinecap="round"
            filter="url(#auroraGlow)"
            opacity="0.75"
          />
          <path
            d="M 20 520 C 180 400, 320 320, 240 180"
            stroke="#818cf8"
            strokeWidth="24"
            filter="url(#auroraGlow)"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Floating Translucent Cosmic Glass Orbs / Bubbles */}
      <div className="absolute top-[18%] left-[7%] w-16 h-16 rounded-full border border-white/20 bg-gradient-to-tr from-purple-500/15 to-cyan-400/20 backdrop-blur-xs shadow-xl shadow-cyan-500/10 pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-[22%] left-[10%] w-24 h-24 rounded-full border border-white/25 bg-gradient-to-tr from-pink-500/20 via-purple-500/15 to-cyan-500/20 backdrop-blur-xs shadow-2xl shadow-purple-500/20 pointer-events-none" />
      <div className="absolute bottom-[14%] left-[6%] w-10 h-10 rounded-full border border-white/20 bg-gradient-to-tr from-indigo-500/20 to-purple-400/20 backdrop-blur-xs pointer-events-none" />
      <div className="absolute bottom-[24%] right-[7%] w-14 h-14 rounded-full border border-white/25 bg-gradient-to-bl from-cyan-400/20 to-purple-600/15 backdrop-blur-xs shadow-xl shadow-cyan-500/15 pointer-events-none" />
      <div className="absolute top-[14%] right-[12%] w-10 h-10 rounded-full border border-white/20 bg-gradient-to-tr from-purple-500/20 to-pink-400/15 backdrop-blur-xs pointer-events-none" />

      {/* Floating Sparkles & Dust Particles */}
      <div className="absolute top-[28%] left-[14%] w-1.5 h-1.5 rounded-full bg-cyan-300 blur-[0.5px] pointer-events-none" />
      <div className="absolute top-[42%] left-[4%] w-2 h-2 rounded-full bg-purple-300 blur-[0.5px] pointer-events-none animate-ping" />
      <div className="absolute bottom-[36%] right-[11%] w-2 h-2 rounded-full bg-cyan-200 blur-[0.5px] pointer-events-none" />
      <div className="absolute top-[22%] right-[22%] w-1.5 h-1.5 rounded-full bg-pink-300 blur-[0.5px] pointer-events-none" />

      {/* 2. CENTERED SPLIT CARD (Exact Layout matching reference) */}
      <div className="w-full max-w-[1020px] bg-white rounded-3xl sm:rounded-[32px] border border-white/25 shadow-2xl shadow-purple-950/70 overflow-hidden flex flex-col lg:flex-row relative z-10 backdrop-blur-md">
        
        {/* LEFT HALF: Workspace Illustration Showcase */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#2a0f52] via-[#3a0d63] to-[#180533] text-white p-6 sm:p-8 lg:p-9 flex flex-col justify-between relative overflow-hidden min-h-[380px] lg:min-h-[580px]">
          {/* Subtle Grid Dots Texture */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Glowing Ambient Backdrop Shading */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Pill Badge: ✦ CampaignFlow Workspace */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 fill-purple-300" />
              <span>CampaignFlow Workspace</span>
            </div>
          </div>

          {/* Centerpiece Vector Illustration: Woman Creative at Desk with Interactive Pipeline & Floating Notifications */}
          <div className="relative z-10 my-auto py-2 sm:py-4 flex items-center justify-center">
            <svg
              viewBox="0 0 520 420"
              className="w-full max-w-[460px] h-auto drop-shadow-2xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>
                <linearGradient id="lockBubble" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="mailBubble" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
                <linearGradient id="checkBubble" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="userBubble" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="wireGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Glowing Background Waves Behind Illustration */}
              <path
                d="M 60 240 C 140 180, 240 120, 360 160 C 440 190, 480 120, 510 80"
                stroke="url(#wireGlow)"
                strokeWidth="5"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <path
                d="M 40 310 C 160 270, 220 320, 380 230 C 460 190, 500 240, 530 200"
                stroke="url(#wireGlow)"
                strokeWidth="3"
                opacity="0.6"
              />

              {/* DESK STRUCTURE */}
              {/* Desk Top Surface */}
              <polygon
                points="175,255 465,255 450,265 155,265"
                fill="#581c87"
                opacity="0.95"
              />
              <polygon
                points="175,255 465,255 480,260 160,260"
                fill="#7e22ce"
              />
              {/* Desk Legs */}
              <polygon points="190,265 186,375 194,375 200,265" fill="#4c1d95" />
              <polygon points="425,265 442,375 434,375 417,265" fill="#4c1d95" />

              {/* ITEMS UNDER DESK */}
              {/* Royal Blue Briefcase */}
              <rect x="295" y="325" width="46" height="34" rx="5" fill="#2563eb" />
              <rect x="295" y="335" width="46" height="4" fill="#1d4ed8" />
              <circle cx="318" cy="337" r="2.5" fill="#e2e8f0" />
              <path
                d="M 311 325 C 311 317, 325 317, 325 325"
                stroke="#93c5fd"
                strokeWidth="3"
                fill="none"
              />

              {/* Potted Indoor Plant */}
              <polygon points="405,335 435,335 430,375 410,375" fill="#581c87" />
              {/* Tropical Leaves in Magenta & Lavender */}
              <path
                d="M 420 335 C 410 305, 380 305, 375 320 C 390 325, 410 325, 420 335 Z"
                fill="#ec4899"
              />
              <path
                d="M 420 335 C 435 295, 460 300, 455 325 C 445 328, 430 330, 420 335 Z"
                fill="#c084fc"
              />
              <path
                d="M 420 335 C 415 310, 425 295, 435 305 C 430 315, 425 325, 420 335 Z"
                fill="#f472b6"
              />

              {/* DESK ITEMS */}
              {/* Lime & Orange Binders/Folders */}
              <polygon points="392,205 406,205 406,255 392,255" fill="#84cc16" />
              <circle cx="399" cy="225" r="2" fill="#ffffff" />
              <polygon points="409,205 423,205 423,255 409,255" fill="#f59e0b" />
              <circle cx="416" cy="225" r="2" fill="#ffffff" />

              {/* Magenta Coffee Mug */}
              <rect x="365" y="240" width="13" height="15" rx="3" fill="#ec4899" />
              <path
                d="M 378 243 C 383 243, 383 252, 378 252"
                stroke="#ec4899"
                strokeWidth="2"
                fill="none"
              />

              {/* COMPUTER MONITOR */}
              {/* Stand */}
              <ellipse cx="325" cy="257" rx="30" ry="4" fill="#e2e8f0" />
              <rect x="321" y="228" width="8" height="28" rx="3" fill="#cbd5e1" />
              {/* Outer Monitor Frame (Crisp White/Silver iMac Style) */}
              <rect
                x="225"
                y="140"
                width="200"
                height="130"
                rx="12"
                fill="#ffffff"
                stroke="#e2e8f0"
                strokeWidth="2.5"
              />
              {/* Screen Bezel / Inner Viewport */}
              <rect
                x="231"
                y="146"
                width="188"
                height="116"
                rx="8"
                fill="url(#screenGrad)"
              />

              {/* Screen Content: Pipeline Flow Architecture */}
              {/* Header Bar */}
              <circle cx="241" cy="157" r="2.5" fill="#10b981" />
              <text
                x="248"
                y="160"
                fill="#475569"
                fontSize="6"
                fontWeight="800"
                fontFamily="sans-serif"
              >
                ACTIVE EXECUTION PIPELINE
              </text>
              <rect x="374" y="152" width="38" height="11" rx="4" fill="#10b981" />
              <text
                x="381"
                y="160"
                fill="#ffffff"
                fontSize="5.5"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                Live Flow
              </text>

              {/* Node Pipeline Wires & Stages */}
              <line x1="265" y1="184" x2="385" y2="184" stroke="#cbd5e1" strokeWidth="2" />
              {/* Stage 1: Draft */}
              <rect x="238" y="174" width="28" height="20" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
              <circle cx="244" cy="184" r="2" fill="#3b82f6" />
              <text x="249" y="186" fill="#1e3a8a" fontSize="5" fontWeight="bold">Draft</text>
              {/* Stage 2: Scheduled */}
              <rect x="278" y="174" width="34" height="20" rx="4" fill="#ffffff" stroke="#7dd3fc" strokeWidth="1.5" />
              <circle cx="284" cy="184" r="2" fill="#0284c7" />
              <text x="289" y="186" fill="#075985" fontSize="5" fontWeight="bold">Sched</text>
              {/* Stage 3: Tasking (Active Node) */}
              <rect x="324" y="172" width="34" height="24" rx="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="331" cy="184" r="2" fill="#d97706" />
              <text x="336" y="186" fill="#92400e" fontSize="5.5" fontWeight="bold">Task</text>
              {/* Stage 4: Review */}
              <rect x="370" y="174" width="34" height="20" rx="4" fill="#ffffff" stroke="#d8b4fe" strokeWidth="1.5" />
              <circle cx="376" cy="184" r="2" fill="#9333ea" />
              <text x="381" y="186" fill="#581c87" fontSize="5" fontWeight="bold">Review</text>

              {/* Activity Sample Card Inside Monitor */}
              <rect x="238" y="206" width="174" height="24" rx="5" fill="#ffffff" stroke="#e2e8f0" />
              <circle cx="248" cy="218" r="3" fill="#ec4899" />
              <text x="255" y="219" fill="#1e293b" fontSize="5.5" fontWeight="bold">
                Reel Publishing • Road to 100k
              </text>
              <rect x="355" y="212" width="52" height="12" rx="3" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
              <text x="360" y="220" fill="#059669" fontSize="4.8" fontWeight="bold">
                ✓ Proof Verified
              </text>

              {/* FLOATING NOTIFICATION CIRCULAR BUBBLES */}
              {/* 1. Orange Lock Circle */}
              <circle cx="240" cy="125" r="15" fill="url(#lockBubble)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
              {/* Lock SVG Icon */}
              <rect x="235" y="123" width="10" height="7" rx="1.5" fill="#ffffff" />
              <path d="M 237 123 C 237 119, 243 119, 243 123" stroke="#ffffff" strokeWidth="1.8" fill="none" />

              {/* 2. Pink Envelope Circle */}
              <circle cx="285" cy="85" r="17" fill="url(#mailBubble)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
              {/* Mail SVG Icon */}
              <rect x="278" y="79" width="14" height="11" rx="2" fill="#ffffff" />
              <path d="M 278 80 L 285 86 L 292 80" stroke="#db2777" strokeWidth="1.5" fill="none" />

              {/* 3. Emerald Green Checkmark Circle */}
              <circle cx="345" cy="75" r="16" fill="url(#checkBubble)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
              {/* Checkmark SVG */}
              <path d="M 339 75 L 343 79 L 351 70" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

              {/* 4. Blue User Avatar Circle */}
              <circle cx="375" cy="120" r="15" fill="url(#userBubble)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
              {/* User SVG */}
              <circle cx="375" cy="116" r="3.5" fill="#ffffff" />
              <path d="M 369 126 C 369 122, 381 122, 381 126" fill="#ffffff" />

              {/* Floating Sparkles around Circles */}
              <path d="M 405 95 L 407 88 L 409 95 L 416 97 L 409 99 L 407 106 L 405 99 L 398 97 Z" fill="#e879f9" />
              <path d="M 315 65 L 316.5 60 L 318 65 L 323 66.5 L 318 68 L 316.5 73 L 315 68 L 310 66.5 Z" fill="#ffffff" />
              <path d="M 220 90 L 221 86 L 222 90 L 226 91 L 222 92 L 221 96 L 220 92 L 216 91 Z" fill="#c084fc" />

              {/* THE CHARACTER: Woman Creator Seated at Chair */}
              {/* Modern Chair */}
              <rect x="110" y="215" width="12" height="75" rx="6" fill="#c084fc" />
              <polygon points="108,285 170,285 165,296 108,296" fill="#a855f7" />
              {/* Chair Legs */}
              <line x1="118" y1="296" x2="102" y2="375" stroke="#4c1d95" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="155" y1="296" x2="168" y2="375" stroke="#4c1d95" strokeWidth="3.5" strokeLinecap="round" />

              {/* Character Seated */}
              {/* Dark Wavy Hair */}
              <path
                d="M 125 185 C 115 150, 150 140, 160 160 C 165 170, 170 180, 155 200 C 145 210, 130 220, 125 240 C 120 260, 140 270, 135 285 C 130 295, 120 290, 115 270 C 110 250, 120 230, 120 210 Z"
                fill="#181126"
              />
              {/* Head / Profile Face */}
              <circle cx="160" cy="170" r="13" fill="#fde68a" />
              <path d="M 166 170 C 172 172, 172 176, 166 178" fill="#fde68a" />
              {/* Purple Jacket / Torso */}
              <path
                d="M 145 195 C 155 185, 170 188, 175 200 L 180 250 C 170 255, 145 255, 140 248 Z"
                fill="#9333ea"
              />
              {/* Arm reaching to desk/keyboard */}
              <path
                d="M 165 208 C 185 220, 205 235, 235 252"
                stroke="#9333ea"
                strokeWidth="11"
                strokeLinecap="round"
                fill="none"
              />
              {/* Hand */}
              <circle cx="236" cy="253" r="5" fill="#fde68a" />

              {/* Legs / Trousers */}
              <polygon points="140,250 180,250 185,295 195,345 180,348 165,300 135,285" fill="#581c87" />
              {/* Shoe */}
              <ellipse cx="198" cy="350" rx="9" ry="4" fill="#1e1b2e" />
            </svg>
          </div>

          {/* Bottom Space / Placeholder for balanced spacing */}
          <div className="relative z-10 hidden sm:block" />
        </div>

        {/* RIGHT HALF: Authentication Form Panel */}
        <div className="w-full lg:w-1/2 bg-white p-7 sm:p-9 lg:p-11 flex flex-col justify-between">
          <div>
            {/* Top Brand Logo - System CampaignFlow Logo matching reference */}
            <div className="flex items-center gap-2 select-none mb-6">
              <Sparkles className="w-5 h-5 text-purple-600 fill-purple-600 shrink-0" />
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Campaign<span className="text-purple-600">Flow</span>
              </span>
            </div>

            {/* Stacked Isometric 3-Layer Icon (Exact from reference) */}
            <div className="mb-4">
              <svg className="w-11 h-11" viewBox="0 0 54 54" fill="none">
                {/* Bottom layer */}
                <path
                  d="M 27 41 L 45 32 L 27 23 L 9 32 Z"
                  fill="#6366f1"
                  opacity="0.5"
                />
                <path
                  d="M 9 32 L 27 41 L 45 32 L 45 35.5 L 27 44.5 L 9 35.5 Z"
                  fill="#4f46e5"
                />
                {/* Middle layer */}
                <path
                  d="M 27 30 L 45 21 L 27 12 L 9 21 Z"
                  fill="#8b5cf6"
                  opacity="0.75"
                />
                <path
                  d="M 9 21 L 27 30 L 45 21 L 45 24.5 L 27 33.5 L 9 24.5 Z"
                  fill="#7c3aed"
                />
                {/* Top layer */}
                <path
                  d="M 27 19 L 45 10 L 27 1 L 9 10 Z"
                  fill="#a855f7"
                />
                <path
                  d="M 9 10 L 27 19 L 45 10 L 45 13.5 L 27 22.5 L 9 13.5 Z"
                  fill="#9333ea"
                />
              </svg>
            </div>

            {/* Header Titles */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "signin" ? "Welcome back" : "Create Account"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {authMode === "signin"
                  ? "Sign in with your authorized Google account to continue."
                  : "Sign up with your authorized Google account to continue."}
              </p>
            </div>

            {/* Mode Switcher Tabs (Segmented Control: Sign In / Create Account) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === "signin"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  authMode === "signup"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Primary Google Authentication Button */}
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3 px-4 rounded-xl border border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md transition-all focus:ring-2 focus:ring-purple-500/20 focus:outline-none disabled:opacity-60 cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
                    <span className="text-sm">Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google G Logo SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="text-sm font-bold group-hover:text-purple-950 transition">
                      {authMode === "signin" ? "Sign in with Google" : "Sign up with Google"}
                    </span>
                  </>
                )}
              </button>

              {/* Mode Switch Prompt */}
              <div className="text-center text-xs text-slate-500 pt-0.5">
                {authMode === "signin" ? (
                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-purple-600 hover:text-purple-700 font-bold underline underline-offset-2 transition cursor-pointer"
                    >
                      Create account with Google
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-purple-600 hover:text-purple-700 font-bold underline underline-offset-2 transition cursor-pointer"
                    >
                      Sign in with Google
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Invite-Only Organization Security Card (Matching Reference) */}
            <div className="mt-5 rounded-2xl bg-purple-50/50 border border-purple-100 p-3.5 flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800 leading-relaxed">
                <span className="font-bold block text-slate-900">Invite-Only Organization</span>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                  CampaignFlow is private to your team. Access requires an authorized Google account matching your workspace invitation or administrator account.
                </p>
              </div>
            </div>

            {/* Development Quick-Logins (Collapsible Drawer for local test & verification) */}
            {isDev && (
              <details className="mt-4 pt-3 border-t border-slate-100 group text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-600 hover:text-purple-700 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Development Quick Sign-In</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-slate-400" />
                </summary>

                <div className="mt-3 space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDevLogin("admin@company.com", "Admin Alice")}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition flex items-center justify-between cursor-pointer border border-slate-100"
                  >
                    <span>Alice (Configured First Admin)</span>
                    <span className="text-[10px] text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded font-bold">
                      Admin
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin("bob@company.com", "Bob Creator")}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition flex items-center justify-between cursor-pointer border border-slate-100"
                  >
                    <span>Bob (Existing Member)</span>
                    <span className="text-[10px] text-slate-600 bg-slate-200/70 px-1.5 py-0.5 rounded font-medium">
                      Member
                    </span>
                  </button>
                </div>
              </details>
            )}
          </div>

          {/* Footer Disclaimer */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              By signing in, you agree to workspace security guidelines and policies.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#0c051a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
