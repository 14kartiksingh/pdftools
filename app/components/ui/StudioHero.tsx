import React from 'react';
import StudioButton from './StudioButton';

interface StudioHeroProps {
  title: string;
  description: string;
  tag?: string;
  ctaText: string;
  ctaHref: string;
}

export default function StudioHero({ title, description, tag, ctaText, ctaHref }: StudioHeroProps) {
  return (
    <section className="relative overflow-hidden bg-surface-container rounded border border-outline-variant w-full group">
      <div className="px-8 py-16 md:px-16 md:py-28 relative z-10 flex flex-col items-start max-w-3xl">
        {tag && (
          <span className="bg-surface-container-high border border-primary/50 text-primary px-4 py-1.5 rounded font-label-md text-label-md uppercase tracking-[0.2em] mb-8 block animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
            {tag}
          </span>
        )}
        <h1 className="font-display-lg text-[40px] md:text-[56px] leading-[1.1] text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both font-medium tracking-tight">
          {title}
        </h1>
        <p className="font-body-lg text-[18px] md:text-[20px] text-on-surface-variant mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
          {description}
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 ease-out fill-mode-both">
          <StudioButton href={ctaHref} variant="primary">
            {ctaText}
          </StudioButton>
        </div>
      </div>
      
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 bottom-0 w-full md:w-1/2 opacity-60 pointer-events-none flex items-center justify-center overflow-hidden mix-blend-screen">
        <span className="material-symbols-outlined text-[340px] text-primary/5 translate-x-1/4 group-hover:scale-105 group-hover:text-primary/10 transition-all duration-1000 ease-out">psychology</span>
      </div>
      
      {/* Animated Dot Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(#a98a7d 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-t from-surface-container to-transparent"></div>
    </section>
  );
}
