import React from 'react';

interface StudioCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function StudioCard({ children, className = '', hoverable = false }: StudioCardProps) {
  const baseClasses = "bg-surface-container border border-outline-variant rounded transition-all duration-300 ease-out";
  const hoverClasses = hoverable 
    ? "hover:bg-surface-container-high hover:border-primary-container hover:shadow-[0_0_20px_rgba(255,106,0,0.05)] hover:-translate-y-0.5"
    : "";

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}
