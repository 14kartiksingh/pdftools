"use client";

import { useState } from "react";
import StudioButton from "./ui/StudioButton";

export default function UpgradeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary-container text-on-primary-container px-4 py-2 rounded font-label-md text-label-md font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 duration-100 hidden md:block"
      >
        Upgrade to Pro
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container p-8 md:p-10 rounded border border-outline-variant max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
            
            {/* Subtle background glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🚀</span>
                <h3 className="font-display-lg text-[28px] md:text-[32px] leading-tight text-white tracking-tight">Early Beta Access</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <p className="text-on-surface-variant font-body-lg">
                  PDF Studio is currently in <strong className="text-white">Early Beta</strong>.
                </p>
                <p className="text-on-surface-variant font-body-lg">
                  Every feature is completely FREE during this phase. We're focusing on improving the product with community feedback before introducing premium plans.
                </p>
                <p className="text-on-surface-variant font-body-lg">
                  Enjoy unlimited access while Early Beta lasts. Thank you for being one of our early users ❤️
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-8">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded font-label-md uppercase tracking-widest text-on-surface border border-outline-variant hover:border-primary-container hover:bg-surface-container-high hover:text-white transition-all duration-300"
                >
                  Close
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded font-label-md uppercase tracking-widest bg-primary text-on-primary hover:brightness-110 transition-all duration-300"
                >
                  Continue Using PDF Studio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
