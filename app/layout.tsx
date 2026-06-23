import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "PDF STUDIO | Home Dashboard",
  description: "High-performance PDF and AI tools for professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded font-label-md text-label-md font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 duration-100">
            Upgrade to Pro
          </button>
        </header>

        {children}

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-surface border-t border-outline-variant z-50">
          <button className="flex flex-col items-center justify-center text-primary-container font-bold">
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-label-md">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">build</span>
            <span className="font-label-md text-label-md">Tools</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-md text-label-md">AI</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">Profile</span>
          </button>
        </nav>
      </body>
    </html>
  );
}
