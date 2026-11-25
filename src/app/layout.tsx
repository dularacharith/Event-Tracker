import type { Metadata } from "next";
import "./globals.css";
import { getCurrentAuth } from "@/lib/session";
import { Navbar } from "@/components/Navbar";
import { DevAccountSwitcher } from "@/components/DevAccountSwitcher";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CampaignFlow — Private Social Campaign Tracker",
  description: "Campaign activity scheduling and review tracker for social media teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let authContext = null;
  try {
    authContext = await getCurrentAuth();
  } catch {
    // ignore
  }

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar
          currentUser={authContext?.user || null}
          userRole={authContext?.member?.role || null}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <DevAccountSwitcher />
      </body>
    </html>
  );
}
