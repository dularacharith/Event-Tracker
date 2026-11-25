import type { Metadata } from "next";
import "./globals.css";
import { getCurrentAuth } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { DevAccountSwitcher } from "@/components/DevAccountSwitcher";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import { NavigationLoaderProvider } from "@/contexts/NavigationLoaderContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CampaignFlow — Private Social Campaign Tracker",
  description: "Campaign activity scheduling and review tracker for social media teams",
  icons: {
    icon: "/favicon.ico",
  },
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
        <ToastProvider>
          <ConfirmProvider>
            <NavigationLoaderProvider>
              <AppShell
                currentUser={authContext?.user || null}
                userRole={authContext?.member?.role || null}
              >
                {children}
              </AppShell>
              <DevAccountSwitcher />
            </NavigationLoaderProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
