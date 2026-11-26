"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
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
    <div className="min-h-screen w-full bg-[#0a0418] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden select-none font-sans">
      {/* 1. HIGH-RESOLUTION COSMIC AURORA BACKDROP */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-cosmic-bg.jpg"
          alt="CampaignFlow Cosmic Aurora"
          fill
          priority
          quality={90}
          className="object-cover object-center pointer-events-none select-none opacity-90 scale-100"
        />
        {/* Subtle Ambient Vignette & Contrast Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0418]/60 via-transparent to-[#0a0418]/40 pointer-events-none" />
      </div>

      {/* Floating Translucent Cosmic Glass Orbs / Ambient Accent Elements */}
      <div className="absolute top-[16%] left-[8%] w-16 h-16 rounded-full border border-white/20 bg-gradient-to-tr from-purple-500/15 to-cyan-400/20 backdrop-blur-xs shadow-xl shadow-cyan-500/10 pointer-events-none animate-pulse duration-1000 hidden md:block" />
      <div className="absolute bottom-[20%] left-[10%] w-20 h-20 rounded-full border border-white/25 bg-gradient-to-tr from-pink-500/15 via-purple-500/15 to-cyan-500/20 backdrop-blur-xs shadow-2xl shadow-purple-500/20 pointer-events-none hidden md:block" />
      <div className="absolute bottom-[22%] right-[8%] w-16 h-16 rounded-full border border-white/20 bg-gradient-to-bl from-cyan-400/20 to-purple-600/15 backdrop-blur-xs shadow-xl shadow-cyan-500/15 pointer-events-none hidden md:block" />

      {/* 2. CENTERED SPLIT CARD (Artwork Illustration + Authentication Form) */}
      <div className="w-full max-w-[980px] bg-white rounded-3xl sm:rounded-[32px] border border-white/20 shadow-2xl shadow-purple-950/80 overflow-hidden flex flex-col lg:flex-row relative z-10 backdrop-blur-md">
        
        {/* LEFT HALF: Illustration Artwork Panel */}
        <div className="w-full lg:w-1/2 bg-[#2a1052] relative overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[380px] lg:min-h-[570px]">
          <Image
            src="/images/login-illustration-clean.png"
            alt="CampaignFlow Workspace Pipeline"
            fill
            priority
            quality={95}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center select-none pointer-events-none"
          />
        </div>

        {/* RIGHT HALF: Authentication Form Panel */}
        <div className="w-full lg:w-1/2 bg-white p-7 sm:p-9 lg:p-11 flex flex-col justify-between">
          <div>
            {/* Top Brand Logo - System CampaignFlow Logo */}
            <div className="flex items-center gap-2 select-none mb-6">
              <Sparkles className="w-5 h-5 text-purple-600 fill-purple-600 shrink-0" />
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                Campaign<span className="text-purple-600">Flow</span>
              </span>
            </div>

            {/* Stacked Isometric 3-Layer Icon */}
            <div className="mb-4">
              <svg className="w-11 h-11 drop-shadow-sm" viewBox="0 0 54 54" fill="none">
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

            {/* Header Titles with Modern Typography */}
            <div className="mb-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "signin" ? "Welcome back" : "Create Account"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
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
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    <span className="text-sm font-medium">Connecting to Google...</span>
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

            {/* Invite-Only Organization Security Card */}
            <div className="mt-5 rounded-2xl bg-purple-50/50 border border-purple-100 p-3.5 flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-800 leading-relaxed">
                <span className="font-bold block text-slate-900">Invite-Only Organization</span>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed font-normal">
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
        <div className="min-h-screen w-full bg-[#0a0418] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
