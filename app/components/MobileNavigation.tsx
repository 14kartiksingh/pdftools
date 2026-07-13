"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function MobileNavigation() {
  const pathname = usePathname();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const navItems = [
    { label: "Home", icon: "home", href: "/" },
    { label: "Tools", icon: "build", href: "/tools" },
    { label: "AI", icon: "psychology", href: "/tools/studio-gpt" },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-surface border-t border-outline-variant z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-primary-container font-bold" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[24px] mb-1">{item.icon}</span>
              <span className="font-label-sm text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
        
        <button 
          onClick={() => setShowProfileModal(true)}
          className="flex flex-col items-center justify-center w-full h-full text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[24px] mb-1">person</span>
          <span className="font-label-sm text-[10px] uppercase tracking-wider">Profile</span>
        </button>
      </nav>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container p-8 rounded border border-outline-variant max-w-sm w-full animate-in zoom-in-95 duration-200 shadow-2xl relative text-center">
            <div className="w-16 h-16 mx-auto bg-surface-container-high rounded-full flex items-center justify-center border border-outline-variant shadow-inner mb-6">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">construction</span>
            </div>
            <h3 className="font-display-lg text-[24px] leading-tight text-white mb-2">Coming Soon</h3>
            <p className="text-on-surface-variant font-body-md mb-8">
              Profile management is currently under construction and will be available in the next Early Beta update.
            </p>
            <button 
              onClick={() => setShowProfileModal(false)}
              className="w-full px-6 py-3 rounded font-label-md uppercase tracking-widest bg-primary-container text-on-primary-container hover:brightness-110 transition-all duration-300"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
}
