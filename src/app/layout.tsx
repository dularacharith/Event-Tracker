import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentAuth } from "@/lib/session";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});
import { AppShell } from "@/components/AppShell";
import { DevAccountSwitcher } from "@/components/DevAccountSwitcher";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import { PromptProvider } from "@/components/ui/PromptModal";
import { NavigationLoaderProvider } from "@/contexts/NavigationLoaderContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CampaignFlow — Private Social Campaign Tracker",
  description: "Campaign activity scheduling and review tracker for social media teams",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/images/logo-icon.png", type: "image/png" },
    ],
    apple: "/icon-192.png",
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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans bg-slate-50 text-slate-900 antialiased h-screen h-[100dvh] overflow-hidden flex flex-col`}>
        <ToastProvider>
          <ConfirmProvider>
            <PromptProvider>
              <NavigationLoaderProvider>
                <AppShell
                  currentUser={authContext?.user || null}
                  userRole={authContext?.member?.role || null}
                >
                  {children}
                </AppShell>
                <DevAccountSwitcher />
              </NavigationLoaderProvider>
            </PromptProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
