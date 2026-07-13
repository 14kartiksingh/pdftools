import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

import { auth } from "@/auth";
import UserMenu from "./components/UserMenu";

import UpgradeButton from "./components/UpgradeButton";

import MobileNavigation from "./components/MobileNavigation";

export const metadata: Metadata = {
  title: "PDF STUDIO | Home Dashboard",
  description: "High-performance PDF and AI tools for professionals.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-on-surface`}>
        {/* Top Navigation Bar */}
        <header className="bg-surface border-b border-outline-variant sticky top-0 z-50 flex justify-between items-center h-14 px-4 md:px-8 w-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">draft</span>
            <span className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold tracking-tighter text-on-surface">PDF STUDIO</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full inner-glow flex items-center bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-body-md w-full placeholder:text-on-surface-variant/50 outline-none" placeholder="Search for tools (Merge, AI, Sign...)" type="text" />
              <span className="text-mono-sm text-on-surface-variant border border-outline-variant px-1 rounded">⌘K</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UpgradeButton />
            {session?.user && (
              <UserMenu user={{ name: session.user.name, email: session.user.email }} />
            )}
          </div>
        </header>

        {children}

        {/* Bottom Navigation Bar (Mobile Only) */}
        <MobileNavigation />
      </body>
    </html>
  );
}
