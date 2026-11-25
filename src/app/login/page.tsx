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
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signed_out") === "true";

  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const isDev = process.env.NODE_ENV !== "production";
  const { data: session } = useSession();

  useEffect(() => {
    // Only redirect if session is present AND we are not explicitly signed out
    if (session?.user && !signedOut) {
      router.push("/my-work");
    }
  }, [session, router, signedOut]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/my-work?signed_in=true",
      });
    } catch (err: any) {
      alert("Sign in error: " + (err.message || "Unknown error"));
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
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Campaign<span className="text-purple-600">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Private campaign activity & review tracker for social media teams
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 shadow-sm transition hover:shadow focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Invite-only: Access requires an active invite or configured admin
            membership.
          </span>
        </div>

        {/* Development Quick-Logins */}
        {isDev && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Development Quick Sign-In</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Log in directly as test accounts to verify the multi-user workflow:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  handleDevLogin("admin@company.com", "Admin Alice")
                }
                disabled={loading}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition flex items-center justify-between"
              >
                <span>Alice (Configured First Admin)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDevLogin("alice@company.com", "Teammate Alice")
                }
                disabled={loading}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition flex items-center justify-between"
              >
                <span>Alice (Activity Owner)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => handleDevLogin("bob@company.com", "Teammate Bob")}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded-lg transition flex items-center justify-between"
              >
                <span>Bob (Reviewer)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (devEmail) handleDevLogin(devEmail);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="email"
                placeholder="custom-test@company.com"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !devEmail}
                className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
              >
                Go
              </button>
            </form>
          </div>
        )}
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
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
