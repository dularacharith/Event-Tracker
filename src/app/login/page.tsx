"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  Play,
  Share2,
  ChevronDown,
  Calendar,
  Lock,
  Radio,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signed_out") === "true";

  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [devEmail, setDevEmail] = useState("");
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
    <div className="w-full flex items-center justify-center py-4">
      {/* Outer Card with Rounded Corners & Subtle Purple Border */}
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl sm:rounded-[32px] border-2 border-purple-200/80 shadow-2xl shadow-purple-900/10 overflow-hidden flex flex-col lg:flex-row relative z-10 transition-all duration-300">
        {/* LEFT HALF: Hero Visual Showcase */}
        <div className="w-full lg:w-[48%] bg-gradient-to-br from-[#1b1035] via-[#241445] to-[#110924] text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[380px] lg:min-h-[560px]">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Top Tag */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>CampaignFlow Workspace</span>
            </div>
          </div>

          {/* Middle Showcase Graphic: Floating Glass Cards */}
          <div className="relative z-10 my-6 sm:my-8 space-y-3.5">
            {/* Glass Card 1: Pipeline Flow Preview */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shadow-xl shadow-black/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                    Active Production Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live Flow
                </span>
              </div>

              {/* Mini Pipeline Node Track */}
              <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-purple-200 pt-1">
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Draft</span>
                </div>
                <ArrowRight className="w-3 h-3 text-purple-400/60 shrink-0" />
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>Schedule</span>
                </div>
                <ArrowRight className="w-3 h-3 text-purple-400/60 shrink-0" />
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-200 px-2 py-1 rounded-md border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Tasking</span>
                </div>
                <ArrowRight className="w-3 h-3 text-purple-400/60 shrink-0" />
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Review</span>
                </div>
              </div>

              {/* Sample Activity Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs font-medium text-white truncate">
                    Reel Publishing • Road to 100k
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Proof Verified
                </span>
              </div>
            </div>

            {/* Glass Card 2: Security & Quality Contracts */}
            <div className="bg-purple-950/60 backdrop-blur-md border border-purple-500/30 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs leading-snug">
                <span className="font-bold text-white block">Quality Contracts &amp; Pass Criteria</span>
                <span className="text-purple-200/80 text-[11px]">
                  Enforces reviewer sign-off and proof evidence before publishing.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Headline & Proof */}
          <div className="relative z-10 pt-2 border-t border-white/10">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug">
              Plan, produce, and review social campaigns together.
            </h2>
            <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
              The unified private platform for collaborative content authoring and verification.
            </p>
          </div>
        </div>

        {/* RIGHT HALF: Authentication Form Panel */}
        <div className="w-full lg:w-[52%] bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Top Logo Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 mb-4">
              <Layers className="w-6 h-6" />
            </div>

            {/* Header Titles */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "signup" ? "Create an account" : "Welcome back"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                {authMode === "signup"
                  ? "Sign up with your team Google account to access your workspace."
                  : "Sign in with your authorized Google account to continue."}
              </p>
            </div>

            {/* Mode Switcher Tabs (Sign In vs Create Account) */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/80">
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
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-3.5 px-5 rounded-2xl border-2 border-slate-200 hover:border-purple-400 shadow-xs hover:shadow-md transition-all focus:ring-2 focus:ring-purple-500/30 focus:outline-none disabled:opacity-60 cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
                    <span>Connecting to Google...</span>
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
                      {authMode === "signup" ? "Create account with Google" : "Sign in with Google"}
                    </span>
                  </>
                )}
              </button>

              {/* Mode Switch Prompt */}
              <div className="text-center text-xs text-slate-500 pt-1">
                {authMode === "signup" ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-purple-600 hover:text-purple-700 font-bold underline underline-offset-2 transition cursor-pointer"
                    >
                      Login
                    </button>
                  </span>
                ) : (
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
                )}
              </div>
            </div>

            {/* Invite-Only Workspace Security Card */}
            <div className="mt-6 rounded-2xl bg-purple-50/70 border border-purple-100 p-3.5 flex items-start gap-3 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-950 leading-relaxed">
                <span className="font-bold block">Invite-Only Organization</span>
                <p className="text-purple-800/80 text-[11px] mt-0.5">
                  CampaignFlow is private to your team. Access requires an authorized Google account matching your workspace invitation or administrator account.
                </p>
              </div>
            </div>

            {/* Development Quick-Logins (Collapsible Drawer for local test & verification) */}
            {isDev && (
              <details className="mt-5 pt-4 border-t border-slate-100 group text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-600 hover:text-purple-700 flex items-center justify-between select-none">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Development Quick Sign-In</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-slate-400" />
                </summary>

                <div className="mt-3 space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDevLogin("admin@company.com", "Admin Alice")}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Alice (Configured First Admin)</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin("alice@company.com", "Teammate Alice")}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Alice (Activity Owner)</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin("bob@company.com", "Teammate Bob")}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Bob (Reviewer)</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (devEmail) handleDevLogin(devEmail);
                    }}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      type="email"
                      placeholder="custom-test@company.com"
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !devEmail}
                      className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                    >
                      Go
                    </button>
                  </form>
                </div>
              </details>
            )}
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 text-center text-[11px] text-slate-400">
            <span>By signing in, you agree to workspace security guidelines and policies.</span>
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
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
