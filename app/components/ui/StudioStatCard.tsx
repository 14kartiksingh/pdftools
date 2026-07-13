import React from 'react';

interface StudioStatCardProps {
  label: string;
  value: string | number;
}

export default function StudioStatCard({ label, value }: StudioStatCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-2 -mx-2 rounded transition-colors hover:bg-surface-container-high/50 border-b border-outline-variant/50 last:border-0 group">
      <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">{label}</span>
      <span className="font-mono-sm text-mono-sm text-white tracking-widest">{value}</span>
    </div>
  );
}
