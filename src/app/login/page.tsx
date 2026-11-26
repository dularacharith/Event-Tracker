"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  UserCheck,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { BrandLogoIcon } from "@/components/BrandLogo";

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
    <div className="min-h-screen w-full bg-[#f8f9fc] bg-gradient-to-br from-[#f8f9fc] via-[#f1f3f9] to-[#f8f6fc] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden select-none font-sans">
      {/* 1. OFF-WHITE AMBIENT LIGHTING & SUBTLE ACCENT ELEMENTS */}
      {/* Ambient Soft Pastel Glows */}
      <div className="absolute -top-36 -right-36 w-[620px] h-[620px] bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -left-36 w-[560px] h-[560px] bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[420px] h-[420px] bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Dot Matrix Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#475569 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Floating Translucent Frosted Glass Bubbles */}
      <div className="absolute top-[14%] left-[7%] w-16 h-16 rounded-full border border-purple-200/60 bg-white/50 backdrop-blur-xs shadow-md shadow-purple-200/20 pointer-events-none hidden md:block animate-pulse duration-1000" />
      <div className="absolute bottom-[18%] left-[9%] w-20 h-20 rounded-full border border-indigo-200/60 bg-white/50 backdrop-blur-xs shadow-lg shadow-indigo-200/20 pointer-events-none hidden md:block" />
      <div className="absolute bottom-[20%] right-[7%] w-16 h-16 rounded-full border border-purple-200/60 bg-white/50 backdrop-blur-xs shadow-md shadow-purple-200/20 pointer-events-none hidden md:block" />
      <div className="absolute top-[18%] right-[10%] w-12 h-12 rounded-full border border-pink-200/60 bg-white/50 backdrop-blur-xs shadow-sm pointer-events-none hidden md:block" />

      {/* 2. CENTERED SPLIT CARD (Artwork Illustration + Authentication Form) */}
      <div className="w-full max-w-[980px] bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/90 shadow-2xl shadow-slate-300/50 shadow-purple-950/5 overflow-hidden flex flex-col lg:flex-row relative z-10">
        
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
            {/* Brand Logo with New 3-Layer Isometric Stack Icon */}
            <div className="flex items-center gap-2.5 select-none mb-6">
              <BrandLogoIcon className="w-8 h-8 sm:w-9 sm:h-9" size={36} />
              <span className="font-black text-2xl tracking-tight text-slate-900 font-sans">
                Campaign<span className="text-purple-600">Flow</span>
              </span>
            </div>

            {/* Header Titles with Inter Typography & Tab Animation */}
            <div key={`header-${authMode}`} className="mb-5 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                {authMode === "signin" ? "Welcome back" : "Create Account"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium font-sans">
                {authMode === "signin"
                  ? "Sign in with your authorized Google account to continue."
                  : "Sign up with your authorized Google account to continue."}
              </p>
            </div>

            {/* Mode Switcher Tabs with Smooth Sliding Pill Indicator Animation */}
            <div className="relative flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80 select-none">
              {/* Smooth Animated Sliding Pill */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-2xs border border-slate-200/60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  authMode === "signin"
                    ? "left-1 translate-x-0"
                    : "left-1 translate-x-[calc(100%+2px)]"
                }`}
              />

              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer text-center ${
                  authMode === "signin"
                    ? "text-slate-900 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer text-center ${
                  authMode === "signup"
                    ? "text-slate-900 font-extrabold"
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
                    <span
                      key={`btn-txt-${authMode}`}
                      className="text-sm font-extrabold group-hover:text-purple-950 transition animate-in fade-in duration-200"
                    >
                      {authMode === "signin" ? "Sign in with Google" : "Sign up with Google"}
                    </span>
                  </>
                )}
              </button>

              {/* Mode Switch Prompt with Animation */}
              <div key={`prompt-${authMode}`} className="text-center text-xs text-slate-500 pt-0.5 animate-in fade-in duration-200">
                {authMode === "signin" ? (
                  <span>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-purple-600 hover:text-purple-700 font-extrabold underline underline-offset-2 transition cursor-pointer"
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
                      className="text-purple-600 hover:text-purple-700 font-extrabold underline underline-offset-2 transition cursor-pointer"
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
              <div className="text-xs text-slate-800 leading-relaxed font-sans">
                <span className="font-extrabold block text-slate-900">Invite-Only Organization</span>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed font-normal">
                  CampaignFlow is private to your team. Access requires an authorized Google account matching your workspace invitation or administrator account.
                </p>
              </div>
            </div>

            {/* Development Quick-Logins (Collapsible Drawer for local test & verification) */}
            {isDev && (
              <details className="mt-4 pt-3 border-t border-slate-100 group text-xs text-slate-500 font-sans">
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
          <div className="pt-4 text-center font-sans">
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
        <div className="min-h-screen w-full bg-[#f8f9fc] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
