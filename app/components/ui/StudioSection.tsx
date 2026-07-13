import React from 'react';

interface StudioSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function StudioSection({ title, action, children, className = '' }: StudioSectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-title-md text-title-md md:font-headline-lg-mobile md:text-headline-lg-mobile text-white">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}
