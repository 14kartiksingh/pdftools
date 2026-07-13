import React from 'react';
import Link from 'next/link';

interface StudioButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export default function StudioButton({ variant = 'primary', href, className = '', children, ...props }: StudioButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-label-md text-label-md uppercase tracking-widest rounded transition-all px-6 py-3 border";
  
  const variants = {
    primary: "bg-gradient-to-b from-primary-container to-inverse-primary text-white border-primary-container shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 active:scale-95",
    ghost: "bg-transparent border-outline-variant text-on-surface hover:bg-surface-container-high hover:border-primary-container hover:text-white",
    danger: "bg-transparent border-outline-variant text-on-surface hover:bg-error-container hover:border-error hover:text-white"
  };

  const combinedClasses = `${baseClasses} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
